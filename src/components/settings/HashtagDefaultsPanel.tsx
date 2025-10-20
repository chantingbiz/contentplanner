import { useAppStore } from '../../store';
import HashtagInput from '../ideas/HashtagInput';

/**
 * HashtagDefaultsPanel - Edit per-bin, per-platform hashtag defaults
 * 
 * - Shows all bins for current workspace
 * - Three hashtag inputs per bin (YouTube, TikTok, Instagram)
 * - Autosave on change
 * - Help text explaining pre-fill behavior
 */
export default function HashtagDefaultsPanel() {
  const currentWorkspaceId = useAppStore(state => state.currentWorkspaceId);
  const bins = useAppStore(state => state.bins || []);
  const updateBinHashtagDefaults = useAppStore(state => state.updateBinHashtagDefaults);

  // Filter bins for current workspace
  const workspaceBins = bins
    .filter(b => b.workspace_id === currentWorkspaceId)
    .sort((a, b) => a.sort_order - b.sort_order);

  if (workspaceBins.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
        <p className="text-white/50">No bins in this workspace yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Hashtag Defaults per Bin</h2>
        <p className="text-white/60 text-sm">
          These tags are pre-filled when you move an idea into "Working" inside this bin.
          You can still edit per idea.
        </p>
      </div>

      {/* Bins */}
      <div className="space-y-6">
        {workspaceBins.map((bin) => (
          <div
            key={bin.id}
            className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5"
          >
            {/* Bin Header */}
            <div className="flex items-center gap-3 pb-4 border-b border-white/10">
              {bin.color && (
                <div
                  className={`w-3 h-3 rounded-full flex-shrink-0 ${
                    bin.color === 'blue' ? 'bg-blue-500' :
                    bin.color === 'red' ? 'bg-red-500' :
                    bin.color === 'amber' ? 'bg-amber-500' :
                    bin.color === 'emerald' ? 'bg-emerald-500' :
                    bin.color === 'purple' ? 'bg-purple-500' :
                    'bg-gray-500'
                  }`}
                />
              )}
              <h3 className="text-lg font-semibold">{bin.name}</h3>
            </div>

            {/* YouTube Defaults */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                YouTube Hashtags
              </label>
              <HashtagInput
                value={bin.hashtagDefaults?.youtube || []}
                onChange={(tags) => updateBinHashtagDefaults(bin.id, { youtube: tags })}
                placeholder="Add default YouTube hashtags (e.g., #shorts)"
                platform="youtube"
              />
            </div>

            {/* TikTok Defaults */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                TikTok Hashtags
              </label>
              <HashtagInput
                value={bin.hashtagDefaults?.tiktok || []}
                onChange={(tags) => updateBinHashtagDefaults(bin.id, { tiktok: tags })}
                placeholder="Add default TikTok hashtags (e.g., #fyp)"
                platform="tiktok"
              />
            </div>

            {/* Instagram Defaults */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Instagram Hashtags
              </label>
              <HashtagInput
                value={bin.hashtagDefaults?.instagram || []}
                onChange={(tags) => updateBinHashtagDefaults(bin.id, { instagram: tags })}
                placeholder="Add default Instagram hashtags (e.g., #reels)"
                platform="instagram"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Footer Help */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
        <div className="flex gap-3">
          <svg
            className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="text-sm text-blue-200">
            <p className="font-medium mb-1">How it works</p>
            <p className="text-blue-200/80">
              When you promote an idea from Brainstorming to Working, if the idea is assigned to a bin,
              these default hashtags will be automatically added to that idea. You can then customize
              them for each individual idea in the Working Ideas editor.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}





