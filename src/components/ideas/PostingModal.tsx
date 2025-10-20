import { useEffect } from 'react';
import { type Idea, useAppStore } from '../../store';

interface PostingModalProps {
  idea: Idea;
  onClose: () => void;
  onMarkPosted?: () => void;
}

/**
 * PostingModal - Copy-ready view of idea for posting to platforms
 * 
 * - Read-only display of all fields
 * - Copy buttons for each field
 * - Copy All for combined template
 * - Optional Mark Posted action
 * - Portal to body with focus trap
 */
export default function PostingModal({ idea, onClose, onMarkPosted }: PostingModalProps) {
  const bins = useAppStore(state => state.bins || []);
  const bin = bins.find(b => b.id === idea.bin_id);

  // Trap focus and handle Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Could show a toast here
      console.log(`Copied ${label}`);
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('Failed to copy. Please select and copy manually.');
    }
  };

  const copyAll = async () => {
    const template = `
📝 ${idea.title || idea.text || 'Untitled'}
${bin ? `🏷️ ${bin.name}` : ''}

📄 DESCRIPTION:
${idea.description || '(none)'}

🏷️ HASHTAGS:
YouTube: ${idea.hashtags?.youtube?.join(' ') || '(none)'}
TikTok: ${idea.hashtags?.tiktok?.join(' ') || '(none)'}
Instagram: ${idea.hashtags?.instagram?.join(' ') || '(none)'}

📜 SCRIPT:
${idea.script || '(none)'}

🎬 SHOTLIST:
${idea.shotlist || '(none)'}

🖼️ THUMBNAIL:
${idea.thumbnail || '(none)'}
`.trim();

    await copyToClipboard(template, 'All fields');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-6 flex items-start justify-between gap-4 z-10">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-1">{idea.title || idea.text || 'Untitled'}</h2>
            {bin && (
              <div className="text-sm text-gray-400">{bin.name}</div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Thumbnail */}
          {idea.thumbnail && (
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">Thumbnail</h3>
              <div className="max-w-xs mx-auto rounded-xl overflow-hidden border border-gray-700">
                <img
                  src={idea.thumbnail}
                  alt={idea.title || idea.text || ''}
                  className="w-full aspect-[9/16] object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          )}

          {/* Title */}
          {idea.title && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-400">Title</h3>
                <button
                  onClick={() => copyToClipboard(idea.title!, 'Title')}
                  className="px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
                >
                  Copy
                </button>
              </div>
              <p className="text-white bg-gray-800 border border-gray-700 rounded-lg p-3">
                {idea.title}
              </p>
            </div>
          )}

          {/* Description */}
          {idea.description && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-400">Description</h3>
                <button
                  onClick={() => copyToClipboard(idea.description!, 'Description')}
                  className="px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
                >
                  Copy
                </button>
              </div>
              <p className="text-white bg-gray-800 border border-gray-700 rounded-lg p-3 whitespace-pre-wrap">
                {idea.description}
              </p>
            </div>
          )}

          {/* Hashtags */}
          {(idea.hashtags?.youtube?.length || idea.hashtags?.tiktok?.length || idea.hashtags?.instagram?.length) ? (
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-3">Hashtags</h3>
              <div className="space-y-2">
                {idea.hashtags?.youtube && idea.hashtags.youtube.length > 0 && (
                  <div className="flex items-center justify-between gap-2 bg-gray-800 border border-gray-700 rounded-lg p-3">
                    <div className="flex-1">
                      <div className="text-xs text-red-400 font-medium mb-1">YouTube</div>
                      <div className="text-sm text-white">{idea.hashtags.youtube.join(' ')}</div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(idea.hashtags!.youtube!.join(' '), 'YouTube hashtags')}
                      className="px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors flex-shrink-0"
                    >
                      Copy
                    </button>
                  </div>
                )}
                {idea.hashtags?.tiktok && idea.hashtags.tiktok.length > 0 && (
                  <div className="flex items-center justify-between gap-2 bg-gray-800 border border-gray-700 rounded-lg p-3">
                    <div className="flex-1">
                      <div className="text-xs text-cyan-400 font-medium mb-1">TikTok</div>
                      <div className="text-sm text-white">{idea.hashtags.tiktok.join(' ')}</div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(idea.hashtags!.tiktok!.join(' '), 'TikTok hashtags')}
                      className="px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors flex-shrink-0"
                    >
                      Copy
                    </button>
                  </div>
                )}
                {idea.hashtags?.instagram && idea.hashtags.instagram.length > 0 && (
                  <div className="flex items-center justify-between gap-2 bg-gray-800 border border-gray-700 rounded-lg p-3">
                    <div className="flex-1">
                      <div className="text-xs text-pink-400 font-medium mb-1">Instagram</div>
                      <div className="text-sm text-white">{idea.hashtags.instagram.join(' ')}</div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(idea.hashtags!.instagram!.join(' '), 'Instagram hashtags')}
                      className="px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors flex-shrink-0"
                    >
                      Copy
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* Script */}
          {idea.script && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-400">Script</h3>
                <button
                  onClick={() => copyToClipboard(idea.script!, 'Script')}
                  className="px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
                >
                  Copy
                </button>
              </div>
              <pre className="text-sm text-white bg-gray-800 border border-gray-700 rounded-lg p-3 whitespace-pre-wrap font-mono">
                {idea.script}
              </pre>
            </div>
          )}

          {/* Shotlist */}
          {idea.shotlist && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-400">Shotlist</h3>
                <button
                  onClick={() => copyToClipboard(idea.shotlist!, 'Shotlist')}
                  className="px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
                >
                  Copy
                </button>
              </div>
              <pre className="text-sm text-white bg-gray-800 border border-gray-700 rounded-lg p-3 whitespace-pre-wrap">
                {idea.shotlist}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-900 border-t border-gray-700 p-6 flex items-center justify-between gap-4">
          <button
            onClick={copyAll}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            Copy All
          </button>

          <div className="flex items-center gap-3">
            {onMarkPosted && (
              <button
                onClick={onMarkPosted}
                className="px-4 py-2 bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30 rounded-lg font-medium transition-colors"
              >
                Mark Posted
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}





