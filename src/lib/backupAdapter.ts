import { supabase } from './supabaseClient';
import type { AppStore, AppData } from '../store';

/**
 * Backup Adapter - Mirrors localStorage to Supabase per workspace
 * 
 * Behavior:
 * - On init: If localStorage is empty, restore from Supabase (once)
 * - On changes: Debounce ~2500ms (max 10s) and upsert to Supabase
 * - On unload: Flush any pending saves (best effort)
 * 
 * Table: backups
 * Columns: workspace (text), data (jsonb), version (int), updated_at (timestamptz), id (uuid)
 * Unique index on (workspace)
 */

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let maxWaitTimer: ReturnType<typeof setTimeout> | null = null;
let lastSaveTime = 0;
let storeInstance: AppStore | null = null;

const DEBOUNCE_MS = 2500;
const MAX_WAIT_MS = 10000;

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
    const { data, error } = await supabase
      .from('backups')
      .select('data')
      .eq('workspace', workspace)
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
      console.info('[backup] first-load restore', workspace);
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
async function backupToCloud(workspace: string, data: AppData): Promise<void> {
  try {
    console.info('[backup] upsert start', workspace);
    
    const updated_at = new Date().toISOString();
    const payload = {
      workspace,
      data: data as any, // JSONB column
      version: 1,
      updated_at,
    };

    const { error } = await supabase
      .from('backups')
      .upsert(payload, {
        onConflict: 'workspace',
      });

    if (error) {
      console.warn('[backup] upsert error', error);
    } else {
      console.info('[backup] upsert ok', { updated_at });
    }
  } catch (err) {
    console.warn('[backup] upsert error', err);
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
  const now = Date.now();
  const timeSinceLastSave = now - lastSaveTime;

  // If max wait time has passed, force save immediately
  if (timeSinceLastSave >= MAX_WAIT_MS) {
    clearTimers();
    performBackup(store);
    return;
  }

  // Clear existing debounce timer
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  // Set up new debounce timer
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    performBackup(store);
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
      performBackup(store);
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
}

/**
 * Perform the actual backup
 */
function performBackup(store: AppStore): void {
  const workspace = store.currentWorkspaceId;
  const data = getDataSnapshot(store);
  
  lastSaveTime = Date.now();
  clearTimers();
  
  // Fire and forget - don't await to avoid blocking
  backupToCloud(workspace, data).catch(err => {
    console.warn('[Backup] Backup error:', err);
  });
}

/**
 * Flush any pending backups (called on unload)
 */
function flushPendingBackup(): void {
  if (!storeInstance) return;
  
  clearTimers();
  
  // Synchronous backup attempt (best effort)
  const workspace = storeInstance.currentWorkspaceId;
  const data = getDataSnapshot(storeInstance);
  
  // Use sendBeacon if available for unload
  if (navigator.sendBeacon) {
    try {
      const blob = new Blob(
        [JSON.stringify({ workspace, data })],
        { type: 'application/json' }
      );
      // Note: This won't work without a proper endpoint, but we'll try anyway
      console.log('[Backup] Attempting flush on unload');
    } catch {
      // Ignore
    }
  }
  
  // Fallback: synchronous backup (may or may not complete)
  backupToCloud(workspace, data).catch(() => {
    // Ignore errors during unload
  });
}

/**
 * Initialize the backup adapter
 * 
 * - Checks if localStorage is empty and restores from cloud if needed
 * - Sets up store change listener with debounced backups
 * - Registers unload handler for flush
 * 
 * Returns { forceBackup } for manual triggering later
 */
export async function initBackupAdapter(store: AppStore): Promise<{ forceBackup: () => Promise<void> }> {
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
  
  // Step 3: Register unload handler
  window.addEventListener('beforeunload', flushPendingBackup);
  
  // Return forceBackup function for manual use
  return {
    forceBackup: async () => {
      if (!storeInstance) {
        console.warn('[backup] Cannot force backup - adapter not initialized');
        return;
      }
      clearTimers();
      performBackup(storeInstance);
    }
  };
}


