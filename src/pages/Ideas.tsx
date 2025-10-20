import { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '../store';

export default function Ideas() {
  const currentWorkspaceId = useAppStore(state => state.currentWorkspaceId);
  const binsAll = useAppStore(state => state.bins || []);
  const ideasAll = useAppStore(state => state.ideas || []);
  const addBin = useAppStore(state => state.addBin);
  const addIdea = useAppStore(state => state.addIdea);

  // ✅ useMemo to prevent infinite re-renders
  const bins = useMemo(
    () => binsAll.filter(b => b.workspace_id === currentWorkspaceId),
    [binsAll, currentWorkspaceId]
  );

  const ideas = useMemo(
    () => ideasAll.filter(i => i.workspace_id === currentWorkspaceId),
    [ideasAll, currentWorkspaceId]
  );

  // Mount log for debugging
  useEffect(() => {
    console.log('[Ideas] mounted');
    return () => console.log('[Ideas] unmounted');
  }, []);

  const [newBinName, setNewBinName] = useState('');
  const [newIdeaTitle, setNewIdeaTitle] = useState('');
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
    if (newIdeaTitle.trim()) {
      addIdea(selectedBinId, newIdeaTitle.trim());
      setNewIdeaTitle('');
      setSelectedBinId(null);
    }
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

  // Sort ideas by createdAt descending
  const recentIdeas = [...ideas].sort(
    (a, b) =>
      (b.createdAt || 0) - (a.createdAt || 0)
  );

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Ideas</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Card: Bins */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Bins</h2>

          <div className="space-y-2 mb-4">
            {bins.map(bin => (
              <div
                key={bin.id}
                className="flex items-center gap-3 p-2 rounded hover:bg-gray-700"
              >
                <div
                  className={`w-3 h-3 rounded-full ${getColorClass(bin.color)}`}
                />
                <span>{bin.name}</span>
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
              <label className="block text-sm text-gray-400 mb-2">Title</label>
              <input
                type="text"
                value={newIdeaTitle}
                onChange={e => setNewIdeaTitle(e.target.value)}
                placeholder="Enter idea title..."
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
              className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded transition-colors font-medium"
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
              <div key={idea.id} className="p-3 bg-gray-700 rounded">
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
                </div>
              </div>
            ))}
            {recentIdeas.length === 0 && (
              <p className="text-gray-400 text-sm">No ideas yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
