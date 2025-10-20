import { useState, useEffect } from 'react';
import { type Idea } from '../../store';
import HashtagInput from './HashtagInput';
import ThumbnailDrop from './ThumbnailDrop';

interface IdeaEditorProps {
  idea: Idea;
  onUpdate: (patch: Partial<Idea>) => void;
  onStatusChange: (status: 'brainstorming' | 'working') => void;
  onDelete: () => void;
  onMinimize?: () => void;
}

/**
 * IdeaEditor - Expanded editor panel for working ideas
 * 
 * - Inline editing with autosave on blur
 * - Hashtag inputs for YouTube, TikTok, Instagram
 * - Script, shotlist, thumbnail fields
 * - Move back to brainstorming or delete
 */
export default function IdeaEditor({ idea, onUpdate, onStatusChange, onDelete, onMinimize }: IdeaEditorProps) {
  const [localTitle, setLocalTitle] = useState(idea.title || '');
  const [localDescription, setLocalDescription] = useState(idea.description || '');
  const [localScript, setLocalScript] = useState(idea.script || '');
  const [localShotlist, setLocalShotlist] = useState(idea.shotlist || '');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Sync with prop changes
  useEffect(() => {
    setLocalTitle(idea.title || '');
    setLocalDescription(idea.description || '');
    setLocalScript(idea.script || '');
    setLocalShotlist(idea.shotlist || '');
  }, [idea]);

  const handleSave = (field: string, value: any) => {
    setSaveStatus('saving');
    onUpdate({ [field]: value });
    
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 300);
  };

  const handleHashtagChange = (platform: 'youtube' | 'tiktok' | 'instagram', tags: string[]) => {
    onUpdate({
      hashtags: {
        ...idea.hashtags,
        [platform]: tags,
      },
    });
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header with status */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3 sm:pb-4">
        <h3 className="text-base sm:text-lg font-semibold">Edit Working Idea</h3>
        <div className="flex items-center gap-2 sm:gap-3">
          {saveStatus === 'saving' && (
            <span className="text-xs text-white/50">Saving...</span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-xs text-green-400">✓ Saved</span>
          )}
          {onMinimize && (
            <button
              onClick={onMinimize}
              className="px-2 sm:px-3 py-1 text-xs text-white/70 hover:text-white hover:bg-white/5 border border-white/10 rounded transition-colors"
              title="Collapse this editor"
            >
              <span className="hidden sm:inline">Minimize</span>
              <span className="sm:hidden">−</span>
            </button>
          )}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-white/70 mb-2">
          Title (YouTube Shorts)
        </label>
        <input
          type="text"
          value={localTitle}
          onChange={(e) => setLocalTitle(e.target.value)}
          onBlur={() => handleSave('title', localTitle)}
          placeholder="Enter your YouTube Shorts title..."
          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-[15px] leading-5 bg-white/5 border border-white/10 rounded-lg focus:border-brand focus:outline-none transition-colors"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-white/70 mb-2">
          Description
        </label>
        <textarea
          value={localDescription}
          onChange={(e) => setLocalDescription(e.target.value)}
          onBlur={() => handleSave('description', localDescription)}
          placeholder="Enter your video description..."
          rows={4}
          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-[15px] leading-5 bg-white/5 border border-white/10 rounded-lg focus:border-brand focus:outline-none transition-colors resize-none"
        />
      </div>

      {/* Hashtags - YouTube */}
      <div>
        <label className="block text-sm font-medium text-white/70 mb-2">
          YouTube Hashtags
        </label>
        <HashtagInput
          value={idea.hashtags?.youtube || []}
          onChange={(tags) => handleHashtagChange('youtube', tags)}
          placeholder="Add YouTube hashtag (e.g., #shorts)"
          platform="youtube"
        />
      </div>

      {/* Hashtags - TikTok */}
      <div>
        <label className="block text-sm font-medium text-white/70 mb-2">
          TikTok Hashtags
        </label>
        <HashtagInput
          value={idea.hashtags?.tiktok || []}
          onChange={(tags) => handleHashtagChange('tiktok', tags)}
          placeholder="Add TikTok hashtag (e.g., #fyp)"
          platform="tiktok"
        />
      </div>

      {/* Hashtags - Instagram */}
      <div>
        <label className="block text-sm font-medium text-white/70 mb-2">
          Instagram Hashtags
        </label>
        <HashtagInput
          value={idea.hashtags?.instagram || []}
          onChange={(tags) => handleHashtagChange('instagram', tags)}
          placeholder="Add Instagram hashtag (e.g., #reels)"
          platform="instagram"
        />
      </div>

      {/* Script */}
      <div>
        <label className="block text-sm font-medium text-white/70 mb-2">
          Script
        </label>
        <textarea
          value={localScript}
          onChange={(e) => setLocalScript(e.target.value)}
          onBlur={() => handleSave('script', localScript)}
          placeholder="Write your script here..."
          rows={6}
          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-[15px] leading-5 bg-white/5 border border-white/10 rounded-lg focus:border-brand focus:outline-none transition-colors resize-none font-mono"
        />
      </div>

      {/* Shotlist */}
      <div>
        <label className="block text-sm font-medium text-white/70 mb-2">
          Shotlist
        </label>
        <textarea
          value={localShotlist}
          onChange={(e) => setLocalShotlist(e.target.value)}
          onBlur={() => handleSave('shotlist', localShotlist)}
          placeholder="List your shots/scenes..."
          rows={5}
          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-[15px] leading-5 bg-white/5 border border-white/10 rounded-lg focus:border-brand focus:outline-none transition-colors resize-none"
        />
      </div>

      {/* Thumbnail */}
      <div>
        <label className="block text-sm font-medium text-white/70 mb-2">
          Thumbnail
        </label>
        <ThumbnailDrop
          thumbnail={idea.thumbnail}
          onUpdate={(dataUrl) => onUpdate({ thumbnail: dataUrl })}
          onRemove={() => onUpdate({ thumbnail: undefined })}
        />
      </div>

      {/* Footer Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-0 pt-3 sm:pt-4 border-t border-white/10">
        <button
          onClick={() => onStatusChange('brainstorming')}
          className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
        >
          ← Move back to Brainstorming
        </button>
        
        <button
          onClick={() => {
            if (confirm('Delete this idea? This cannot be undone.')) {
              onDelete();
            }
          }}
          className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
