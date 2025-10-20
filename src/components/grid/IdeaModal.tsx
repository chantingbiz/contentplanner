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
      className="fixed inset-0 z-50 flex bg-black/70" 
      onClick={onClose}
    >
      <div 
        className="m-0 sm:m-auto w-full sm:w-[520px] h-full sm:h-auto sm:max-h-[90vh] bg-gray-900 text-white rounded-none sm:rounded-xl p-4 sm:p-6 overflow-y-auto" 
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-lg sm:text-sm text-gray-400 hover:text-white transition-colors z-10" 
          onClick={onClose}
          aria-label="Close modal"
        >
          ✕
        </button>
        
        <h2 className="text-base sm:text-lg font-semibold mb-4 pr-8">
          {idea?.title || idea?.text || '(untitled)'}
        </h2>

        {idea?.thumbnail && (
          <div className="mb-4 rounded-lg overflow-hidden border border-gray-800 max-w-[280px] sm:max-w-full mx-auto sm:mx-0">
            <img 
              src={idea.thumbnail} 
              alt="Thumbnail"
              className="w-full aspect-[9/16] object-cover" 
              loading="lazy"
              decoding="async"
            />
          </div>
        )}

        <div className="space-y-4 text-xs sm:text-sm">
          {idea?.description && (
            <section>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-white/90 text-sm">Description</h3>
                <button 
                  className="text-[11px] px-2 sm:px-3 py-1 sm:py-1.5 rounded bg-gray-800 hover:bg-gray-700 transition-colors"
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
                <h3 className="font-medium text-white/90 text-sm">Hashtags</h3>
                <button 
                  className="text-[11px] px-2 sm:px-3 py-1 sm:py-1.5 rounded bg-gray-800 hover:bg-gray-700 transition-colors"
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
                <h3 className="font-medium text-white/90 text-sm">Script</h3>
                <button 
                  className="text-[11px] px-2 sm:px-3 py-1 sm:py-1.5 rounded bg-gray-800 hover:bg-gray-700 transition-colors"
                  onClick={() => copy(idea?.script ?? '')}
                >
                  Copy
                </button>
              </div>
              <textarea 
                readOnly 
                className="w-full bg-gray-800 rounded-lg p-3 text-xs sm:text-sm font-mono resize-none" 
                value={idea?.script || ''} 
                rows={6}
              />
            </section>
          )}

          {idea?.shotlist && (
            <section>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-white/90 text-sm">Shotlist</h3>
                <button 
                  className="text-[11px] px-2 sm:px-3 py-1 sm:py-1.5 rounded bg-gray-800 hover:bg-gray-700 transition-colors"
                  onClick={() => copy(idea?.shotlist ?? '')}
                >
                  Copy
                </button>
              </div>
              <textarea 
                readOnly 
                className="w-full bg-gray-800 rounded-lg p-3 text-xs sm:text-sm resize-none" 
                value={idea?.shotlist || ''} 
                rows={6}
              />
            </section>
          )}
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-end">
          <button
            className="bg-brand px-4 py-2.5 sm:py-2 rounded-lg text-black font-semibold hover:bg-brand/90 transition-colors text-sm sm:text-base order-1 sm:order-none"
            onClick={() => copy(
              `${idea?.title || idea?.text || ''}\n\n${idea?.description || ''}\n\n${allHashtags}`
            )}
          >
            Copy All
          </button>
          <button 
            className="px-4 py-2.5 sm:py-2 rounded-lg border border-gray-700 hover:bg-gray-800 transition-colors text-sm sm:text-base order-2 sm:order-none" 
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



