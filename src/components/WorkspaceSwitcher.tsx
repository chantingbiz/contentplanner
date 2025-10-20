import { useState } from 'react';
import { useAppStore, selectWorkspaces, selectWorkspaceId, selectCurrentWorkspace } from '../store';

/**
 * WorkspaceSwitcher - Branded dropdown with avatars for switching workspaces
 * 
 * Displays current workspace avatar + handle
 * Clicking opens dropdown with all workspaces
 * Selecting a workspace calls setWorkspace(id)
 */
export default function WorkspaceSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  
  const workspaces = useAppStore(selectWorkspaces);
  const currentWorkspaceId = useAppStore(selectWorkspaceId);
  const currentWorkspace = useAppStore(selectCurrentWorkspace);
  const setWorkspace = useAppStore(state => state.setWorkspace);

  const handleSelect = (workspaceId: string) => {
    setWorkspace(workspaceId);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Current Workspace Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg border border-brand transition-all duration-200 group h-11 min-h-[44px]"
        aria-label="Switch workspace"
        aria-expanded={isOpen}
      >
        {/* Avatar */}
        <div className="w-7 h-7 rounded-full overflow-hidden border-2 border-brand ring-2 ring-white/10">
          {currentWorkspace?.avatar ? (
            <img
              src={currentWorkspace.avatar}
              alt={currentWorkspace.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to initials if image fails
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full bg-brand flex items-center justify-center text-xs font-bold text-white">
              {currentWorkspace?.name?.[1]?.toUpperCase() || '?'}
            </div>
          )}
        </div>

        {/* Handle */}
        <span className="text-sm font-semibold text-brand group-hover:text-white transition-colors">
          {currentWorkspace?.name || 'Select Workspace'}
        </span>

        {/* Chevron */}
        <svg
          className={`w-3.5 h-3.5 text-brand transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-20"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Menu */}
          <div className="absolute left-0 mt-2 w-64 bg-[#1a1b1e] rounded-lg border border-white/10 shadow-xl z-30 overflow-hidden">
            {workspaces.map((workspace) => {
              const isActive = workspace.id === currentWorkspaceId;
              
              return (
                <button
                  key={workspace.id}
                  onClick={() => handleSelect(workspace.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-150 ${
                    isActive
                      ? 'bg-white/10 border-l-4 border-brand'
                      : 'hover:bg-white/5 border-l-4 border-transparent'
                  }`}
                >
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full overflow-hidden border-2 ${
                    isActive ? 'border-brand ring-2 ring-white/20' : 'border-white/20'
                  }`}>
                    {workspace.avatar ? (
                      <img
                        src={workspace.avatar}
                        alt={workspace.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold text-white">
                        {workspace.name[1]?.toUpperCase() || '?'}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-left">
                    <div className={`text-sm font-semibold ${
                      isActive ? 'text-brand' : 'text-white'
                    }`}>
                      {workspace.name}
                    </div>
                    {isActive && (
                      <div className="text-xs text-white/50 mt-0.5">Current workspace</div>
                    )}
                  </div>

                  {/* Check icon */}
                  {isActive && (
                    <svg
                      className="w-5 h-5 text-brand flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}





