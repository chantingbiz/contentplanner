import { type Idea, computeIdeaCompletion, useAppStore } from '../../store';

interface IdeaRowProps {
  idea: Idea;
  isExpanded: boolean;
  onToggle: () => void;
}

/**
 * IdeaRow - Shared row component with completion chips and chevron
 * 
 * - Shows title or fallback to text
 * - Bin pill
 * - Completion chips (Title, Description, YT #, TikTok #, Insta #, Script, Shotlist, Thumbnail)
 * - Overall completion % mini progress bar
 * - Chevron button to expand/collapse
 */
export default function IdeaRow({ idea, isExpanded, onToggle }: IdeaRowProps) {
  const bins = useAppStore(state => state.bins || []);
  const bin = bins.find(b => b.id === idea.bin_id);
  
  const completion = computeIdeaCompletion(idea);

  const chips = [
    { label: 'Title', completed: completion.title },
    { label: 'Desc', completed: completion.description },
    { label: 'YT #', completed: completion.youtube },
    { label: 'TT #', completed: completion.tiktok },
    { label: 'IG #', completed: completion.instagram },
    { label: 'Script', completed: completion.script },
    { label: 'Shots', completed: completion.shotlist },
    { label: 'Thumb', completed: completion.thumbnail },
  ];

  return (
    <button
      onClick={onToggle}
      className="w-full text-left bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 transition-all duration-200"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg truncate">
            {idea.title || idea.text || 'Untitled'}
          </h3>
          {bin && (
            <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded bg-white/10 text-white/70">
              {bin.name}
            </span>
          )}
        </div>

        {/* Chevron */}
        <svg
          className={`w-5 h-5 text-white/50 transition-transform flex-shrink-0 ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Completion Chips */}
      <div className="flex flex-wrap gap-2 mb-3">
        {chips.map((chip, index) => (
          <span
            key={index}
            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs border ${
              chip.completed
                ? 'bg-green-500/20 text-green-300 border-green-500/30'
                : 'bg-white/5 text-white/40 border-white/10'
            }`}
          >
            {chip.completed && (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            {chip.label}
          </span>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-white/50">
          <span>Completion</span>
          <span className="font-semibold">{completion.percent}%</span>
        </div>
        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand transition-all duration-300"
            style={{ width: `${completion.percent}%` }}
          />
        </div>
      </div>
    </button>
  );
}





