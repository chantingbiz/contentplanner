import { useState, useEffect } from 'react';
import { useAppStore } from '../../store';
import { supabase } from '../../lib/supabaseClient';
import { setAutoSync, pullLatest, getSyncStatus } from '../../lib/backupAdapter';

/**
 * BackupPanel - Cloud backup and cross-device sync control
 * 
 * - Backup Now: Force immediate backup to Supabase
 * - Pull Latest: Fetch latest from cloud
 * - Auto-sync toggle: Enable/disable 30s polling
 * - Shows sync status and timestamps
 */
export default function BackupPanel() {
  const currentWorkspaceId = useAppStore(state => state.currentWorkspaceId);
  const store = useAppStore(state => state);
  
  const [status, setStatus] = useState<'idle' | 'backing-up' | 'pulling' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const [timestamp, setTimestamp] = useState<string>('');
  const [syncStatus, setSyncStatus] = useState(getSyncStatus());
  
  // Refresh sync status every second
  useEffect(() => {
    const interval = setInterval(() => {
      setSyncStatus(getSyncStatus());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleBackupNow = async () => {
    setStatus('backing-up');
    setMessage('Backing up...');
    
    try {
      // Use forceBackup from window (set by main.tsx)
      if ((window as any).__forceBackup) {
        await (window as any).__forceBackup('manual-ui');
        setStatus('success');
        setMessage('Backup successful');
        setTimestamp(new Date().toLocaleTimeString());
      } else {
        // Fallback to direct upsert
        const wk = currentWorkspaceId.trim().toLowerCase();
        const snapshot = {
          version: store.version,
          workspaces: store.workspaces,
          bins: store.bins,
          ideas: store.ideas,
          posts: store.posts,
          currentWorkspaceId: store.currentWorkspaceId,
          done: store.done,
          gridsByWorkspace: store.gridsByWorkspace,
        };
        
        const bytes = JSON.stringify(snapshot).length;
        console.info('[backup] force upsert start', { wk, bytes });
        
        const { error, status: httpStatus } = await supabase
          .from('backups')
          .upsert(
            {
              workspace: wk,
              data: snapshot as any,
              version: 1,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'workspace' }
          );
        
        if (error) {
          console.warn('[backup] force upsert ERROR', error);
          setStatus('error');
          setMessage(`Error: ${error.message}`);
          setTimestamp(new Date().toLocaleTimeString());
        } else {
          console.info('[backup] force upsert OK', { status: httpStatus });
          setStatus('success');
          setMessage(`Backup successful (${bytes.toLocaleString()} bytes)`);
          setTimestamp(new Date().toLocaleTimeString());
        }
      }
    } catch (err: any) {
      console.warn('[backup] force upsert ERROR', err);
      setStatus('error');
      setMessage(`Exception: ${err.message || 'Unknown error'}`);
      setTimestamp(new Date().toLocaleTimeString());
    }
  };
  
  const handlePullLatest = async () => {
    setStatus('pulling');
    setMessage('Pulling from cloud...');
    
    try {
      await pullLatest();
      setStatus('success');
      setMessage('Pull successful - local state updated');
      setTimestamp(new Date().toLocaleTimeString());
    } catch (err: any) {
      setStatus('error');
      setMessage(`Pull failed: ${err.message || 'Unknown error'}`);
      setTimestamp(new Date().toLocaleTimeString());
    }
  };
  
  const handleToggleAutoSync = (enabled: boolean) => {
    setAutoSync(enabled);
    setSyncStatus(getSyncStatus());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Cloud Backup</h2>
        <p className="text-white/60 text-sm">
          Manually backup your current workspace to Supabase. Auto-backup runs every 2-10 seconds after changes.
        </p>
      </div>

      {/* Panel */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
        {/* Current Workspace */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <div className="text-sm text-white/50">Current Workspace</div>
            <div className="text-lg font-semibold">{currentWorkspaceId}</div>
            <div className="text-xs text-white/40 mt-1">
              Normalized key: {syncStatus.workspace}
            </div>
          </div>
        </div>

        {/* Auto-Sync Toggle */}
        <div className="flex items-center justify-between py-3 px-4 bg-white/5 rounded-lg border border-white/10">
          <div>
            <div className="font-medium text-sm">Auto-Sync</div>
            <div className="text-xs text-white/50 mt-0.5">
              Poll for updates every 30s
            </div>
          </div>
          <button
            onClick={() => handleToggleAutoSync(!syncStatus.autoSyncEnabled)}
            className={`
              relative w-12 h-6 rounded-full transition-colors
              ${syncStatus.autoSyncEnabled ? 'bg-brand' : 'bg-gray-600'}
            `}
          >
            <div
              className={`
                absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform
                ${syncStatus.autoSyncEnabled ? 'translate-x-6' : 'translate-x-0'}
              `}
            />
          </button>
        </div>

        {/* Sync Status Info */}
        <div className="space-y-2 text-xs text-white/50 bg-white/5 rounded-lg p-3">
          <div className="flex justify-between">
            <span>Local last save:</span>
            <span className="font-mono">{syncStatus.lastLocalSaveAt || 'Never'}</span>
          </div>
          <div className="flex justify-between">
            <span>Cloud updated:</span>
            <span className="font-mono">{syncStatus.lastRemoteUpdatedAt || 'Unknown'}</span>
          </div>
          <div className="flex justify-between">
            <span>Local changes:</span>
            <span className={syncStatus.dirty ? 'text-yellow-400' : 'text-green-400'}>
              {syncStatus.dirty ? 'Unsaved' : 'Clean'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={handleBackupNow}
            disabled={status === 'backing-up' || status === 'pulling'}
            className={`
              flex-1 px-6 py-3 rounded-lg font-semibold text-white
              transition-all duration-200
              ${status === 'backing-up' || status === 'pulling'
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-brand hover:bg-brand/90 shadow-lg shadow-brand/20'
              }
            `}
          >
            {status === 'backing-up' ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Backing up...
              </span>
            ) : (
              'Backup Now'
            )}
          </button>
          
          <button
            onClick={handlePullLatest}
            disabled={status === 'backing-up' || status === 'pulling'}
            className={`
              flex-1 px-6 py-3 rounded-lg font-semibold
              transition-all duration-200
              ${status === 'backing-up' || status === 'pulling'
                ? 'bg-gray-600 text-white cursor-not-allowed'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
              }
            `}
          >
            {status === 'pulling' ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Pulling...
              </span>
            ) : (
              'Pull Latest'
            )}
          </button>

          {/* Status Message */}
          {status !== 'idle' && message && (
            <div
              className={`
                p-3 rounded-lg text-sm
                ${status === 'success' ? 'bg-green-500/10 text-green-300 border border-green-500/30' : ''}
                ${status === 'error' ? 'bg-red-500/10 text-red-300 border border-red-500/30' : ''}
                ${status === 'backing-up' ? 'bg-blue-500/10 text-blue-300 border border-blue-500/30' : ''}
              `}
            >
              <div className="flex items-start gap-2">
                {status === 'success' && (
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                {status === 'error' && (
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
                <div className="flex-1">
                  <div className="font-medium">{message}</div>
                  {timestamp && (
                    <div className="text-xs opacity-70 mt-1">at {timestamp}</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Help Text */}
        <div className="pt-4 border-t border-white/10 text-xs text-white/40 space-y-2">
          <p>
            <strong>Backup Now:</strong> Push current state to cloud immediately.
          </p>
          <p>
            <strong>Pull Latest:</strong> Fetch latest cloud state and replace local (confirms if you have unsaved changes).
          </p>
          <p>
            <strong>Auto-Sync:</strong> When ON, polls every 30s and auto-pulls if cloud is newer and local is clean.
          </p>
          <p className="pt-2 text-white/30">
            All operations use the <code className="px-1.5 py-0.5 bg-white/10 rounded">backups</code> table.
            Check browser console for detailed logs.
          </p>
        </div>
      </div>
    </div>
  );
}

