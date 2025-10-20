import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import { useAppStore, selectWorkspaces, selectWorkspaceId, selectCurrentWorkspace } from '../store';

export default function Header() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Use pure selector functions for maximum stability
  const workspaces = useAppStore(selectWorkspaces);
  const currentWorkspaceId = useAppStore(selectWorkspaceId);
  const currentWorkspace = useAppStore(selectCurrentWorkspace);
  const setWorkspace = useAppStore(state => state.setWorkspace);

  const tabs = [
    { name: 'Ideas', path: '/' },
    { name: 'Workboard', path: '/workboard' },
    { name: 'Scheduler', path: '/scheduler' },
    { name: 'Grid', path: '/grid' },
    { name: 'Settings', path: '/settings' },
  ];

  return (
    <header className="bg-gray-800 border-b border-gray-700">
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Content Grid</h1>
          
          {/* Workspace Switcher */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors flex items-center gap-2"
            >
              <span>{currentWorkspace?.name || 'Select Workspace'}</span>
              <svg
                className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-md shadow-lg z-10">
                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => {
                      setWorkspace(ws.id);
                      setIsDropdownOpen(false);
                    }}
                    className={`block w-full text-left px-4 py-2 hover:bg-gray-600 first:rounded-t-md last:rounded-b-md ${
                      currentWorkspaceId === ws.id ? 'bg-gray-600' : ''
                    }`}
                  >
                    {ws.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <nav className="flex gap-1">
          {tabs.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              end={tab.path === '/'}
              className={({ isActive }) =>
                `px-4 py-2 rounded-md transition-colors ${
                  isActive
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`
              }
            >
              {tab.name}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
