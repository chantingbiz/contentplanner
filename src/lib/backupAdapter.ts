import { supabase } from './supabaseClient';
import type { AppStore, AppData } from '../store';
import { store as storeAPI } from '../store';

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
let watchdogTimer: ReturnType<typeof setTimeout> | null = null;
let lastFlushTime = 0;
let storeInstance: AppStore | null = null;
let isDirty = false;
let lastStateHash = '';

const DEBOUNCE_MS = 2500;
const MAX_WAIT_MS = 10000;
const WATCHDOG_INTERVAL_MS = 60000; // 60 seconds

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
    const bytes = JSON.stringify(data).length;
    
    console.info('[backup] debounced upsert', { wk, bytes });
    
    const payload = {
      workspace: wk,
      data: data as any, // JSONB column
      version: 1,
      updated_at: new Date().toISOString(),
    };

    const { error, status } = await supabase
      .from('backups')
      .upsert(payload, {
        onConflict: 'workspace',
      });

    if (error) {
      console.warn('[backup] ❌ upsert error', error);
    } else {
      console.info('[backup] ✅ upsert ok', { status });
      isDirty = false; // Clear dirty flag on successful backup
    }
  } catch (err) {
    console.warn('[backup] ❌ upsert error', err);
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
  console.info('[backup] change', new Date().toISOString());
  
  const now = Date.now();
  const timeSinceLastFlush = now - lastFlushTime;

  // If max wait time has passed, force save immediately
  if (timeSinceLastFlush >= MAX_WAIT_MS) {
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
    const remainingMaxWait = MAX_WAIT_MS - timeSinceLastFlush;
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
  if (watchdogTimer) {
    clearTimeout(watchdogTimer);
    watchdogTimer = null;
  }
}

/**
 * Perform the actual backup
 */
function performBackup(store: AppStore, reason: string): void {
  if (!isDirty) return; // Skip if no changes
  
  console.info('[backup] flush reason:', reason);
  
  const workspace = store.currentWorkspaceId;
  const data = getDataSnapshot(store);
  
  lastFlushTime = Date.now();
  clearTimers();
  
  // Fire and forget - don't await to avoid blocking
  backupToCloud(workspace, data, reason).catch(err => {
    console.warn('[backup] backup error:', err);
  });
  
  // Restart watchdog timer
  startWatchdogTimer(store);
}

/**
 * Start 60s watchdog timer - safety net for missed flushes
 */
function startWatchdogTimer(store: AppStore): void {
  if (watchdogTimer) {
    clearTimeout(watchdogTimer);
  }
  
  watchdogTimer = setTimeout(() => {
    if (isDirty && storeInstance) {
      performBackup(storeInstance, 'watchdog-60s');
    }
  }, WATCHDOG_INTERVAL_MS);
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
 * Handle visibility change - flush when tab becomes hidden
 */
function handleVisibilityChange(): void {
  if (document.visibilityState === 'hidden' && isDirty && storeInstance) {
    flushPendingBackup('visibilitychange');
  }
}

/**
 * Handle beforeunload - best effort flush on page close
 */
function handleBeforeUnload(): void {
  if (isDirty && storeInstance) {
    flushPendingBackup('beforeunload');
  }
}

/**
 * Initialize the backup adapter
 * 
 * - Checks if localStorage is empty and restores from cloud if needed
 * - Subscribes to store changes with debounced backups
 * - Registers multiple flush triggers (unload, visibility, watchdog)
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
  
  // Step 2: Subscribe to store changes using the store's subscription mechanism
  // Initialize state hash after potential restore
  lastStateHash = JSON.stringify(getDataSnapshot(store));
  
  storeAPI.subscribe(() => {
    const currentState = storeAPI.getState();
    const currentHash = JSON.stringify(getDataSnapshot(currentState));
    if (currentHash !== lastStateHash) {
      lastStateHash = currentHash;
      scheduleBackup(currentState);
    }
  });
  
  // Step 3: Register event handlers
  window.addEventListener('beforeunload', handleBeforeUnload);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // Step 4: Start 60s watchdog timer
  startWatchdogTimer(store);
  
  // Return forceBackup function for manual use (e.g., Settings button)
  return {
    forceBackup: async (reason = 'manual') => {
      if (!storeInstance) {
        console.warn('[backup] Cannot force backup - adapter not initialized');
        return;
      }
      clearTimers();
      performBackup(storeInstance, reason);
      startWatchdogTimer(storeInstance);
    }
  };
}


