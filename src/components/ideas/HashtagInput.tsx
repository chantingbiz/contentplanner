import { useState, type KeyboardEvent } from 'react';

interface HashtagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  platform?: 'youtube' | 'tiktok' | 'instagram';
}

/**
 * HashtagInput - Reusable tags input with pill UI
 * 
 * - Accepts array<string>, calls onChange
 * - Normalizes to #lowercase and dedupes
 * - Enter or comma to add tag
 * - Click X to remove tag
 */
export default function HashtagInput({ value, onChange, placeholder = 'Add hashtag...', platform }: HashtagInputProps) {
  const [input, setInput] = useState('');

  const normalizeTag = (tag: string): string => {
    let normalized = tag.trim().toLowerCase();
    if (normalized && !normalized.startsWith('#')) {
      normalized = '#' + normalized;
    }
    return normalized;
  };

  const addTag = (rawTag: string) => {
    const normalized = normalizeTag(rawTag);
    if (normalized && normalized.length > 1 && !value.includes(normalized)) {
      onChange([...value, normalized]);
    }
    setInput('');
  };

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (input.trim()) {
        addTag(input);
      }
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      // Remove last tag on backspace if input is empty
      removeTag(value.length - 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pastedText = e.clipboardData.getData('text');
    
    // Check if it's comma-separated
    if (pastedText.includes(',')) {
      e.preventDefault();
      const tags = pastedText.split(',').map(t => t.trim()).filter(Boolean);
      const newTags = tags
        .map(normalizeTag)
        .filter(t => t.length > 1 && !value.includes(t));
      
      if (newTags.length > 0) {
        onChange([...value, ...newTags]);
      }
      setInput('');
    }
  };

  const getPlatformColor = () => {
    switch (platform) {
      case 'youtube':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'tiktok':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'instagram':
        return 'bg-pink-500/20 text-pink-300 border-pink-500/30';
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    }
  };

  return (
    <div className="space-y-2">
      {/* Tags display */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tag, index) => (
            <span
              key={index}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm border ${getPlatformColor()}`}
            >
              {tag}
              <button
                onClick={() => removeTag(index)}
                className="hover:bg-white/10 rounded-full p-0.5 transition-colors"
                aria-label={`Remove ${tag}`}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input */}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onBlur={() => {
          if (input.trim()) {
            addTag(input);
          }
        }}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-brand focus:outline-none transition-colors text-sm"
      />

      <p className="text-xs text-white/50">
        Type hashtag and press Enter or comma. Paste comma-separated tags.
      </p>
    </div>
  );
}

