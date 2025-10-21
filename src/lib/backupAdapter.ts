import { supabase } from './supabaseClient';
import type { AppStore, AppData } from '../store';

/**
 * Backup Adapter - Mirrors localStorage to Supabase per workspace
 * 
 * Behavior:
 * - On init: If localStorage is empty, restore from Supabase (once)
 * - On changes: Debounce ~2500ms (max 10s) and upsert to Supabase
 * - Multiple flush triggers: unload, visibility change, 60s safety interval
 * - Workspace keys normalized (trim + lowercase) for case-insensitive storage
 * 
 * Table: backups
 * Columns: workspace (text), data (jsonb), version (int), updated_at (timestamptz), id (uuid)
 * Unique index on (workspace)
 */

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let maxWaitTimer: ReturnType<typeof setTimeout> | null = null;
let safetyTimer: ReturnType<typeof setTimeout> | null = null;
let lastSaveTime = 0;
let storeInstance: AppStore | null = null;
let isDirty = false;

const DEBOUNCE_MS = 2500;
const MAX_WAIT_MS = 10000;
const SAFETY_INTERVAL_MS = 60000; // 60 seconds

/**
 * Normalize workspace key (case-insensitive)
 */
function normalizeWorkspaceKey(workspace: string): string {
  return workspace.trim().toLowerCase();
}

/**
 * Check if localStorage has data for the current workspace
 */
function hasLocalData(): boolean {
  try {
    const stored = localStorage.getItem('content-grid-web::state');
    return !!stored && stored.length > 10; // Basic sanity check
  } catch {
    return false;
  }
}

/**
 * Restore state from Supabase for the given workspace
 */
async function restoreFromCloud(workspace: string, store: AppStore): Promise<boolean> {
  try {
    const wk = normalizeWorkspaceKey(workspace);
    
    const { data, error } = await supabase
      .from('backups')
      .select('data')
      .eq('workspace', wk)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No row found, that's okay
        return false;
      }
      console.warn('[backup] restore error', error.message);
      return false;
    }

    if (data?.data) {
      console.info('[backup] first-load restore', wk);
      store.importState(data.data as Partial<AppData>);
      return true;
    }

    return false;
  } catch (err) {
    console.warn('[backup] restore error', err);
    return false;
  }
}

/**
 * Upsert current state to Supabase
 */
async function backupToCloud(workspace: string, data: AppData, reason: string): Promise<void> {
  try {
    const wk = normalizeWorkspaceKey(workspace);
    const at = new Date().toISOString();
    
    console.info('[backup] flush reason:', reason);
    console.info('[backup] preparing upsert', { workspace: wk, bytes: JSON.stringify(data).length });
    
    const payload = {
      workspace: wk,
      data: data as any, // JSONB column
      version: 1,
      updated_at: at,
    };

    const { error, status } = await supabase
      .from('backups')
      .upsert(payload, {
        onConflict: 'workspace',
      });

    if (error) {
      console.warn('[backup] ❌ upsert failed', { error, status });
    } else {
      console.info('[backup] ✅ upsert ok', { status, workspace: wk });
      isDirty = false; // Clear dirty flag on successful backup
    }
  } catch (err) {
    console.warn('[backup] upsert ERROR', err);
  }
}

/**
 * Extract data-only properties from store (no actions)
 */
function getDataSnapshot(store: AppStore): AppData {
  return {
    version: store.version,
    workspaces: store.workspaces,
    bins: store.bins,
    ideas: store.ideas,
    posts: store.posts,
    currentWorkspaceId: store.currentWorkspaceId,
    done: store.done,
    gridsByWorkspace: store.gridsByWorkspace,
  };
}

/**
 * Schedule a debounced backup with max wait guarantee
 */
function scheduleBackup(store: AppStore): void {
  isDirty = true;
  console.info('[backup] store change detected', new Date().toISOString());
  console.info('[backup] change @', new Date().toISOString());
  
  const now = Date.now();
  const timeSinceLastSave = now - lastSaveTime;

  // If max wait time has passed, force save immediately
  if (timeSinceLastSave >= MAX_WAIT_MS) {
    clearTimers();
    performBackup(store, 'max-wait');
    return;
  }

  // Clear existing debounce timer
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  // Set up new debounce timer
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    performBackup(store, 'debounce');
  }, DEBOUNCE_MS);

  // Set up max wait timer if not already set
  if (!maxWaitTimer) {
    const remainingMaxWait = MAX_WAIT_MS - timeSinceLastSave;
    maxWaitTimer = setTimeout(() => {
      maxWaitTimer = null;
      if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
      }
      performBackup(store, 'max-wait');
    }, remainingMaxWait);
  }
}

/**
 * Clear all timers
 */
function clearTimers(): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  if (maxWaitTimer) {
    clearTimeout(maxWaitTimer);
    maxWaitTimer = null;
  }
  if (safetyTimer) {
    clearTimeout(safetyTimer);
    safetyTimer = null;
  }
}

/**
 * Perform the actual backup
 */
function performBackup(store: AppStore, reason: string): void {
  if (!isDirty) return; // Skip if no changes
  
  const workspace = store.currentWorkspaceId;
  const data = getDataSnapshot(store);
  
  lastSaveTime = Date.now();
  clearTimers();
  
  // Fire and forget - don't await to avoid blocking
  backupToCloud(workspace, data, reason).catch(err => {
    console.warn('[backup] backup error:', err);
  });
  
  // Restart safety timer
  startSafetyTimer(store);
}

/**
 * Start 60s safety interval timer
 */
function startSafetyTimer(store: AppStore): void {
  if (safetyTimer) {
    clearTimeout(safetyTimer);
  }
  
  safetyTimer = setTimeout(() => {
    if (isDirty && storeInstance) {
      performBackup(storeInstance, 'safety-60s');
    }
  }, SAFETY_INTERVAL_MS);
}

/**
 * Flush any pending backups (called on unload or visibility change)
 */
function flushPendingBackup(reason: string): void {
  if (!storeInstance || !isDirty) return;
  
  clearTimers();
  performBackup(storeInstance, reason);
}

/**
 * Handle visibility change
 */
function handleVisibilityChange(): void {
  if (document.hidden && isDirty && storeInstance) {
    flushPendingBackup('visibility-hidden');
  }
}

/**
 * Initialize the backup adapter
 * 
 * - Checks if localStorage is empty and restores from cloud if needed
 * - Sets up store change listener with debounced backups
 * - Registers multiple flush triggers (unload, visibility, safety interval)
 * 
 * Returns { forceBackup } for manual triggering later
 */
export async function initBackupAdapter(store: AppStore): Promise<{ forceBackup: (reason?: string) => Promise<void> }> {
  storeInstance = store;
  
  // Step 1: Check if we need to restore from cloud
  const hasLocal = hasLocalData();
  
  if (!hasLocal) {
    const workspace = store.currentWorkspaceId;
    await restoreFromCloud(workspace, store);
  }
  
  // Step 2: Subscribe to store changes for auto-backup
  // We'll use a simple interval check approach since store doesn't expose change events
  let lastState = JSON.stringify(getDataSnapshot(store));
  
  const checkForChanges = () => {
    const currentState = JSON.stringify(getDataSnapshot(store));
    if (currentState !== lastState) {
      lastState = currentState;
      scheduleBackup(store);
    }
  };
  
  // Check for changes every 1 second
  setInterval(checkForChanges, 1000);
  
  // Step 3: Register event handlers
  window.addEventListener('beforeunload', () => flushPendingBackup('beforeunload'));
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // Step 4: Start safety timer
  startSafetyTimer(store);
  
  // Return forceBackup function for manual use (e.g., route changes)
  return {
    forceBackup: async (reason = 'manual') => {
      if (!storeInstance) {
        console.warn('[backup] Cannot force backup - adapter not initialized');
        return;
      }
      clearTimers();
      performBackup(storeInstance, reason);
      startSafetyTimer(storeInstance);
    }
  };
}


