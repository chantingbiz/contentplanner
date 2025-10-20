import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { type Idea } from '../../store';

interface IdeaModalProps {
  idea: Idea;
  onClose: () => void;
}

/**
 * IdeaModal - Lightweight modal displaying copy-ready fields
 * 
 * - Read-only display of idea content
 * - Copy buttons for each field
 * - Copy All button for combined content
 * - ESC key to close
 */
export default function IdeaModal({ idea, onClose }: IdeaModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const allHashtags = [
    ...(idea?.hashtags?.youtube ?? []),
    ...(idea?.hashtags?.tiktok ?? []),
    ...(idea?.hashtags?.instagram ?? []),
  ].join(' ');

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" 
      onClick={onClose}
    >
      <div 
        className="bg-gray-900 text-white rounded-xl p-6 w-full max-w-md relative max-h-[90vh] overflow-y-auto" 
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          className="absolute top-3 right-3 text-sm text-gray-400 hover:text-white transition-colors" 
          onClick={onClose}
          aria-label="Close modal"
        >
          ✕
        </button>
        
        <h2 className="text-lg font-semibold mb-4 pr-8">
          {idea?.title || idea?.text || '(untitled)'}
        </h2>

        {idea?.thumbnail && (
          <div className="mb-4 rounded-lg overflow-hidden border border-gray-800">
            <img 
              src={idea.thumbnail} 
              alt="Thumbnail"
              className="w-full aspect-[9/16] object-cover" 
            />
          </div>
        )}

        <div className="space-y-4 text-sm">
          {idea?.description && (
            <section>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-white/90">Description</h3>
                <button 
                  className="text-[11px] px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 transition-colors"
                  onClick={() => copy(idea?.description ?? '')}
                >
                  Copy
                </button>
              </div>
              <p className="whitespace-pre-wrap text-gray-200 bg-black/20 rounded-lg p-3">
                {idea?.description}
              </p>
            </section>
          )}

          {allHashtags && (
            <section>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-white/90">Hashtags</h3>
                <button 
                  className="text-[11px] px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 transition-colors"
                  onClick={() => copy(allHashtags)}
                >
                  Copy
                </button>
              </div>
              <p className="text-gray-300 break-words bg-black/20 rounded-lg p-3">
                {allHashtags}
              </p>
            </section>
          )}

          {idea?.script && (
            <section>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-white/90">Script</h3>
                <button 
                  className="text-[11px] px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 transition-colors"
                  onClick={() => copy(idea?.script ?? '')}
                >
                  Copy
                </button>
              </div>
              <textarea 
                readOnly 
                className="w-full bg-gray-800 rounded-lg p-3 text-sm font-mono resize-none" 
                value={idea?.script || ''} 
                rows={6}
              />
            </section>
          )}

          {idea?.shotlist && (
            <section>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-white/90">Shotlist</h3>
                <button 
                  className="text-[11px] px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 transition-colors"
                  onClick={() => copy(idea?.shotlist ?? '')}
                >
                  Copy
                </button>
              </div>
              <textarea 
                readOnly 
                className="w-full bg-gray-800 rounded-lg p-3 text-sm resize-none" 
                value={idea?.shotlist || ''} 
                rows={6}
              />
            </section>
          )}
        </div>

        <div className="mt-6 flex gap-3 justify-end">
          <button
            className="bg-brand px-4 py-2 rounded-lg text-black font-semibold hover:bg-brand/90 transition-colors"
            onClick={() => copy(
              `${idea?.title || idea?.text || ''}\n\n${idea?.description || ''}\n\n${allHashtags}`
            )}
          >
            Copy All
          </button>
          <button 
            className="px-4 py-2 rounded-lg border border-gray-700 hover:bg-gray-800 transition-colors" 
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}



