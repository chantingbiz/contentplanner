import { useAppStore } from '../store';

export default function Scheduler() {
  const currentWorkspaceId = useAppStore(state => state.currentWorkspaceId);
  const posts = useAppStore(state => (state.posts || []).filter(p => p.workspace_id === currentWorkspaceId));
  const bins = useAppStore(state => (state.bins || []).filter(b => b.workspace_id === currentWorkspaceId));
  const updatePost = useAppStore(state => state.updatePost);

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

  // Sort posts: with dates first (ascending), then no dates
  const sortedPosts = [...posts].sort((a, b) => {
    const aHasDate = !!a.post_date;
    const bHasDate = !!b.post_date;
    
    // If both have dates, sort by date ascending
    if (aHasDate && bHasDate) {
      return a.post_date!.localeCompare(b.post_date!);
    }
    
    // Posts with dates come before posts without dates
    if (aHasDate && !bHasDate) return -1;
    if (!aHasDate && bHasDate) return 1;
    
    // Both have no date, sort by id (creation order)
    return a.id.localeCompare(b.id);
  });

  const handleDateChange = (postId: string, newDate: string) => {
    updatePost(postId, { post_date: newDate || null });
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Scheduler</h1>
      
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900 border-b border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold w-32">Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Title</th>
                <th className="px-4 py-3 text-left text-sm font-semibold w-40">Bin</th>
                <th className="px-4 py-3 text-left text-sm font-semibold w-32">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {sortedPosts.map((post) => (
                <tr 
                  key={post.id} 
                  className="hover:bg-gray-700 transition-colors"
                >
                  <td className="px-4 py-3">
                    <input
                      type="date"
                      value={post.post_date || ''}
                      onChange={(e) => handleDateChange(post.id, e.target.value)}
                      className="w-full px-2 py-1 text-sm bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getColorClass(getBinColor(post.bin_id))}`} />
                      <span className="font-medium">{post.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {getBinName(post.bin_id)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-1 bg-gray-700 rounded">
                      {post.status}
                    </span>
                  </td>
                </tr>
              ))}
              {sortedPosts.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                    No posts yet. Create some posts in the Workboard!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 text-sm text-gray-400">
        <p>💡 Tip: Set post dates to schedule content. Posts with dates appear first, sorted chronologically.</p>
      </div>
    </div>
  );
}
