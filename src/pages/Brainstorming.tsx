import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';

/**
 * Brainstorming Page - Restored Ideas page functionality
 * 
 * - Three-column layout: Bins | Add Idea | Recent Ideas
 * - Add/delete bins
 * - Add ideas to specific bins
 * - Click idea to promote to Working and navigate
 */
export default function Brainstorming() {
  const navigate = useNavigate();
  const currentWorkspaceId = useAppStore(state => state.currentWorkspaceId);
  const binsAll = useAppStore(state => state.bins || []);
  const ideasAll = useAppStore(state => state.ideas || []);
  const addBin = useAppStore(state => state.addBin);
  const addIdea = useAppStore(state => state.addIdea);
  const deleteBin = useAppStore(state => state.deleteBin);
  const deleteIdea = useAppStore(state => state.deleteIdea);
  const setIdeaStatus = useAppStore(state => state.setIdeaStatus);

  // Filter for current workspace
  const bins = useMemo(
    () => binsAll.filter(b => b.workspace_id === currentWorkspaceId),
    [binsAll, currentWorkspaceId]
  );

  // Filter brainstorming ideas for current workspace
  const brainstormingIdeas = useMemo(
    () => ideasAll.filter(i => i.workspace_id === currentWorkspaceId && i.status === 'brainstorming'),
    [ideasAll, currentWorkspaceId]
  );

  const [newBinName, setNewBinName] = useState('');
  const [newIdeaText, setNewIdeaText] = useState('');
  const [selectedBinId, setSelectedBinId] = useState<string | null>(null);

  const handleAddBin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBinName.trim()) {
      addBin(newBinName.trim());
      setNewBinName('');
    }
  };

  const handleAddIdea = (e: React.FormEvent) => {
    e.preventDefault();
    if (newIdeaText.trim()) {
      addIdea(selectedBinId, newIdeaText.trim());
      setNewIdeaText('');
      setSelectedBinId(null);
    }
  };

  const handleDeleteBin = (binId: string, binName: string) => {
    if (confirm(`Delete bin "${binName}"? Ideas in this bin will not be deleted.`)) {
      deleteBin(binId);
    }
  };

  const handleDeleteIdea = (ideaId: string, ideaText: string) => {
    if (confirm(`Delete idea "${ideaText}"?`)) {
      deleteIdea(ideaId);
    }
  };

  const handlePromoteIdea = (ideaId: string) => {
    setIdeaStatus(ideaId, 'working');
    navigate(`/working?id=${ideaId}`);
  };

  const getBinName = (binId: string | null) => {
    if (!binId) return 'No Bin';
    return bins.find(b => b.id === binId)?.name || 'Unknown';
  };

  const getBinColor = (binId: string | null) => {
    if (!binId) return 'gray';
    return bins.find(b => b.id === binId)?.color || 'gray';
  };

  const getColorClass = (color?: string) => {
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-500',
      red: 'bg-red-500',
      amber: 'bg-amber-500',
      emerald: 'bg-emerald-500',
      purple: 'bg-purple-500',
      gray: 'bg-gray-500',
    };
    return colorMap[color || 'gray'] || 'bg-gray-500';
  };

  // Sort ideas by createdAt descending (most recent first)
  const recentIdeas = [...brainstormingIdeas].sort(
    (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
  );

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Brainstorming</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Card: Bins */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Bins</h2>

          <div className="space-y-2 mb-4">
            {bins.map(bin => (
              <div
                key={bin.id}
                className="flex items-center gap-3 p-2 rounded hover:bg-gray-700 group"
              >
                <div
                  className={`w-3 h-3 rounded-full flex-shrink-0 ${getColorClass(bin.color)}`}
                />
                <span className="flex-1">{bin.name}</span>
                <button
                  onClick={() => handleDeleteBin(bin.id, bin.name)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 text-red-400 rounded transition-all"
                  aria-label="Delete bin"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            {bins.length === 0 && (
              <p className="text-gray-400 text-sm">No bins yet</p>
            )}
          </div>

          <form onSubmit={handleAddBin} className="mt-4">
            <input
              type="text"
              value={newBinName}
              onChange={e => setNewBinName(e.target.value)}
              placeholder="Add bin..."
              className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </form>
        </div>

        {/* Middle Card: Add Idea */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Add Idea</h2>

          <form onSubmit={handleAddIdea} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Idea</label>
              <input
                type="text"
                value={newIdeaText}
                onChange={e => setNewIdeaText(e.target.value)}
                placeholder="Add a new idea..."
                className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Bin</label>
              <select
                value={selectedBinId || ''}
                onChange={e => setSelectedBinId(e.target.value || null)}
                className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              >
                <option value="">No Bin</option>
                {bins.map(bin => (
                  <option key={bin.id} value={bin.id}>
                    {bin.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={!newIdeaText.trim()}
              className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors font-medium"
            >
              Add Idea
            </button>
          </form>
        </div>

        {/* Right Card: Recent Ideas */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Recent Ideas</h2>

          <div className="space-y-3">
            {recentIdeas.map(idea => (
              <div
                key={idea.id}
                className="p-3 bg-gray-700 rounded hover:bg-gray-600 cursor-pointer transition-colors group relative"
                onClick={() => handlePromoteIdea(idea.id)}
              >
                <div className="flex items-start gap-2 mb-1">
                  <div
                    className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${getColorClass(
                      getBinColor(idea.bin_id)
                    )}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{idea.text}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {getBinName(idea.bin_id)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteIdea(idea.id, idea.text);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 text-red-400 rounded transition-all"
                    aria-label="Delete idea"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
            {recentIdeas.length === 0 && (
              <p className="text-gray-400 text-sm">Start by adding your first idea above.</p>
            )}
          </div>
        </div>
      </div>

      {/* Info Footer */}
      <div className="mt-6 text-center text-sm text-gray-400">
        <p>💡 Click an idea to promote it to Working Ideas</p>
      </div>
    </div>
  );
}
