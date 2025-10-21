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
let pollTimer: ReturnType<typeof setInterval> | null = null;
let lastFlushTime = 0;
let storeInstance: AppStore | null = null;
let isDirty = false;
let lastStateHash = '';
let autoSyncEnabled = true;
let lastLocalSaveAt: string | null = null;
let lastRemoteUpdatedAt: string | null = null;

const DEBOUNCE_MS = 2500;
const MAX_WAIT_MS = 10000;
const WATCHDOG_INTERVAL_MS = 60000; // 60 seconds
const POLL_INTERVAL_MS = 30000; // 30 seconds

/**
 * Normalize workspace key (case-insensitive)
 */
function normalizeWorkspaceKey(workspace: string): string {
  return workspace.trim().toLowerCase();
}

/**
 * Get auto-sync preference for a workspace
 */
function getAutoSyncPref(wk: string): boolean {
  try {
    const stored = localStorage.getItem(`backup:autoSync:${wk}`);
    return stored !== null ? stored === 'true' : true; // Default ON
  } catch {
    return true;
  }
}

/**
 * Set auto-sync preference for a workspace
 */
function setAutoSyncPref(wk: string, enabled: boolean): void {
  try {
    localStorage.setItem(`backup:autoSync:${wk}`, String(enabled));
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[sync] Failed to save autoSync preference', err);
  }
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
      if (import.meta.env.DEV) console.warn('[backup] restore error', error.message);
      return false;
    }

    if (data?.data) {
      if (import.meta.env.DEV) console.info('[backup] first-load restore', wk);
      store.importState(data.data as Partial<AppData>);
      return true;
    }

    return false;
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[backup] restore error', err);
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
    
    if (import.meta.env.DEV) console.info('[backup] debounced upsert', { wk, bytes });
    
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
      if (import.meta.env.DEV) console.warn('[backup] ❌ upsert error', error);
    } else {
      const nowIso = new Date().toISOString();
      if (import.meta.env.DEV) console.info('[backup] ✅ upsert ok', { status });
      isDirty = false; // Clear dirty flag on successful backup
      lastLocalSaveAt = nowIso;
      lastRemoteUpdatedAt = nowIso; // Server canonical time
    }
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[backup] ❌ upsert error', err);
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
  if (import.meta.env.DEV) console.info('[backup] change', new Date().toISOString());
  
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
  
  if (import.meta.env.DEV) console.info('[backup] flush reason:', reason);
  
  const workspace = store.currentWorkspaceId;
  const data = getDataSnapshot(store);
  
  lastFlushTime = Date.now();
  clearTimers();
  
  // Fire and forget - don't await to avoid blocking
  backupToCloud(workspace, data, reason).catch(err => {
    if (import.meta.env.DEV) console.warn('[backup] backup error:', err);
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
 * Poll for remote updates (30s interval, visible tab only)
 */
async function pollRemoteUpdates(): Promise<void> {
  if (!storeInstance || !autoSyncEnabled) return;
  if (document.visibilityState !== 'visible') return;
  
  try {
    const wk = normalizeWorkspaceKey(storeInstance.currentWorkspaceId);
    
    const { data, error } = await supabase
      .from('backups')
      .select('updated_at')
      .eq('workspace', wk)
      .single();
    
    if (error) {
      if (error.code !== 'PGRST116') {
        if (import.meta.env.DEV) console.warn('[sync] poll error', error.message);
      }
      return;
    }
    
    const remoteUpdatedAt = data?.updated_at;
    
    if (import.meta.env.DEV) console.info('[sync] poll tick', { remote: remoteUpdatedAt, local: lastRemoteUpdatedAt });
    
    if (remoteUpdatedAt && remoteUpdatedAt > (lastRemoteUpdatedAt || '')) {
      lastRemoteUpdatedAt = remoteUpdatedAt;
      
      if (!isDirty) {
        // Auto-pull since local is clean
        if (import.meta.env.DEV) console.info('[sync] auto-pull (remote newer)');
        await performPull(false); // skipConfirm = true for auto-pull
      } else {
        if (import.meta.env.DEV) console.info('[sync] remote newer but local is dirty — skipped');
      }
    }
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[sync] poll error', err);
  }
}

/**
 * Start polling interval
 */
function startPolling(): void {
  if (pollTimer) return; // Already running
  
  pollTimer = setInterval(() => {
    pollRemoteUpdates();
  }, POLL_INTERVAL_MS);
}

/**
 * Stop polling interval
 */
function stopPolling(): void {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

/**
 * Pull latest from cloud
 */
async function performPull(askConfirm: boolean): Promise<void> {
  if (!storeInstance) {
    if (import.meta.env.DEV) console.warn('[sync] Cannot pull - adapter not initialized');
    return;
  }
  
  const wk = normalizeWorkspaceKey(storeInstance.currentWorkspaceId);
  
  // Confirm overwrite if dirty
  if (isDirty && askConfirm) {
    const proceed = confirm(
      'You have unsaved local changes. Pull from cloud will overwrite them. Continue?'
    );
    if (!proceed) {
      if (import.meta.env.DEV) console.info('[sync] pullLatest cancelled by user');
      return;
    }
  }
  
  try {
    // Save safety copy to sessionStorage
    if (isDirty) {
      const safetyKey = `backup:safety:${wk}:${Date.now()}`;
      const snapshot = JSON.stringify(getDataSnapshot(storeInstance));
      sessionStorage.setItem(safetyKey, snapshot);
      if (import.meta.env.DEV) console.info('[sync] safety copy saved', safetyKey);
    }
    
    // Fetch full row
    const { data, error } = await supabase
      .from('backups')
      .select('*')
      .eq('workspace', wk)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        if (import.meta.env.DEV) console.info('[sync] pullLatest: no cloud backup for this workspace');
        return;
      }
      if (import.meta.env.DEV) console.warn('[sync] pullLatest error', error.message);
      return;
    }
    
    if (data?.data) {
      // Replace local state
      storeInstance.importState(data.data as Partial<AppData>);
      
      // Update tracking
      isDirty = false;
      lastRemoteUpdatedAt = data.updated_at;
      lastStateHash = JSON.stringify(getDataSnapshot(storeInstance));
      
      if (import.meta.env.DEV) console.info('[sync] pullLatest OK', { wk, updated_at: data.updated_at });
    }
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[sync] pullLatest error', err);
  }
}

/**
 * Initialize the backup adapter
 * 
 * - Checks if localStorage is empty and restores from cloud if needed
 * - Subscribes to store changes with debounced backups
 * - Registers multiple flush triggers (unload, visibility, watchdog)
 * - Starts polling for remote updates if auto-sync is enabled
 * 
 * Returns { forceBackup } for manual triggering later
 */
export async function initBackupAdapter(store: AppStore): Promise<{ forceBackup: (reason?: string) => Promise<void> }> {
  storeInstance = store;
  
  const wk = normalizeWorkspaceKey(store.currentWorkspaceId);
  
  // Load auto-sync preference
  autoSyncEnabled = getAutoSyncPref(wk);
  
  // Step 1: Fetch remote metadata
  try {
    const { data } = await supabase
      .from('backups')
      .select('updated_at')
      .eq('workspace', wk)
      .single();
    
    if (data?.updated_at) {
      lastRemoteUpdatedAt = data.updated_at;
    }
  } catch {
    // Ignore errors during init
  }
  
  // Step 2: Check if we need to restore from cloud
  const hasLocal = hasLocalData();
  
  if (!hasLocal) {
    const restored = await restoreFromCloud(store.currentWorkspaceId, store);
    if (restored) {
      isDirty = false; // Don't immediately push back after restore
    }
  }
  
  // Step 3: Subscribe to store changes using the store's subscription mechanism
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
  
  // Step 4: Register event handlers
  window.addEventListener('beforeunload', handleBeforeUnload);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // Step 5: Start 60s watchdog timer
  startWatchdogTimer(store);
  
  // Step 6: Start polling if auto-sync enabled
  if (autoSyncEnabled) {
    startPolling();
  }
  
  // Return API for manual control
  return {
    forceBackup: async (reason = 'manual') => {
      if (!storeInstance) {
        if (import.meta.env.DEV) console.warn('[backup] Cannot force backup - adapter not initialized');
        return;
      }
      clearTimers();
      performBackup(storeInstance, reason);
      startWatchdogTimer(storeInstance);
    }
  };
}

/**
 * Set auto-sync enabled/disabled for current workspace
 */
export function setAutoSync(enabled: boolean): void {
  if (!storeInstance) return;
  
  const wk = normalizeWorkspaceKey(storeInstance.currentWorkspaceId);
  autoSyncEnabled = enabled;
  setAutoSyncPref(wk, enabled);
  
  if (import.meta.env.DEV) console.info('[sync] autoSync set →', enabled);
  
  if (enabled) {
    startPolling();
  } else {
    stopPolling();
  }
}

/**
 * Pull latest from cloud (manual or auto)
 */
export async function pullLatest(): Promise<void> {
  await performPull(true); // askConfirm = true for manual pulls
}

/**
 * Get current sync status
 */
export function getSyncStatus(): {
  workspace: string;
  autoSyncEnabled: boolean;
  dirty: boolean;
  lastLocalSaveAt: string | null;
  lastRemoteUpdatedAt: string | null;
} {
  const workspace = storeInstance?.currentWorkspaceId || '';
  return {
    workspace: normalizeWorkspaceKey(workspace),
    autoSyncEnabled,
    dirty: isDirty,
    lastLocalSaveAt,
    lastRemoteUpdatedAt,
  };
}


