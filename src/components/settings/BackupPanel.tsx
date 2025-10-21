import { useState } from 'react';
import { useAppStore } from '../../store';
import { supabase } from '../../lib/supabaseClient';

/**
 * BackupPanel - Manual cloud backup control
 * 
 * - Force an immediate backup to Supabase
 * - Shows last backup status and timestamp
 * - Uses same normalized workspace key as auto-backup
 */
export default function BackupPanel() {
  const currentWorkspaceId = useAppStore(state => state.currentWorkspaceId);
  const store = useAppStore(state => state);
  
  const [status, setStatus] = useState<'idle' | 'backing-up' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const [timestamp, setTimestamp] = useState<string>('');

  const handleBackupNow = async () => {
    setStatus('backing-up');
    setMessage('Backing up...');
    
    try {
      // Normalize workspace key (same as auto-backup)
      const wk = currentWorkspaceId.trim().toLowerCase();
      
      // Build persisted snapshot (same structure as localStorage)
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
      
      // Upsert to Supabase
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
    } catch (err: any) {
      console.warn('[backup] force upsert ERROR', err);
      setStatus('error');
      setMessage(`Exception: ${err.message || 'Unknown error'}`);
      setTimestamp(new Date().toLocaleTimeString());
    }
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
              Normalized key: {currentWorkspaceId.trim().toLowerCase()}
            </div>
          </div>
        </div>

        {/* Backup Button */}
        <div className="space-y-3">
          <button
            onClick={handleBackupNow}
            disabled={status === 'backing-up'}
            className={`
              w-full sm:w-auto px-6 py-3 rounded-lg font-semibold text-white
              transition-all duration-200
              ${status === 'backing-up'
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-brand hover:bg-brand/90 shadow-lg shadow-brand/20'
              }
            `}
          >
            {status === 'backing-up' ? (
              <span className="flex items-center gap-2">
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
        <div className="pt-4 border-t border-white/10 text-xs text-white/40">
          <p>
            This creates/updates a row in the <code className="px-1.5 py-0.5 bg-white/10 rounded">backups</code> table
            with your current workspace state. Check the browser console for detailed logs.
          </p>
        </div>
      </div>
    </div>
  );
}

