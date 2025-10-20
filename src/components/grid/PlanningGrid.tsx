import { useDraggable, useDroppable } from '@dnd-kit/core';
import { useMemo, useState } from 'react';
import { useAppStore, useActiveGrid, type GridCell } from '../../store';
import IdeaModal from './IdeaModal';

/**
 * PlanningGrid - Per-workspace drag-and-drop grid (always 3 columns)
 * 
 * - Each workspace has its own isolated grid
 * - Drag from Working list into cells to assign
 * - Drag filled cells to move/swap
 * - Click filled cell to open IdeaModal
 * - Clear button to unassign
 * - Add Row button to expand grid
 * - Reset button to clear all cells back to 1×3
 * 
 * NOTE: DndContext is at the parent level (Working.tsx)
 */
export default function PlanningGrid() {
  const grid = useActiveGrid();
  const currentWorkspaceId = useAppStore(state => state.currentWorkspaceId);
  const allIdeas = useAppStore(state => state.ideas || []);
  const gridClear = useAppStore(state => state.gridClear);
  const gridResetTo1x3 = useAppStore(state => state.gridResetTo1x3);
  const addGridRows = useAppStore(state => state.addGridRows);

  // Filter ideas to current workspace only
  const ideas = useMemo(() => 
    allIdeas.filter(i => i.workspace_id === currentWorkspaceId),
    [allIdeas, currentWorkspaceId]
  );

  const cells = useMemo(() => {
    return Object.values(grid.cells).sort((a, b) => {
      if (a.row !== b.row) return a.row - b.row;
      return a.col - b.col;
    });
  }, [grid.cells]);

  const [modalIdeaId, setModalIdeaId] = useState<string | null>(null);

  function getIdeaLabel(ideaId?: string) {
    if (!ideaId) return '';
    const idea = ideas.find(i => i.id === ideaId);
    return (idea?.title?.trim() || idea?.text?.trim() || '(untitled)');
  }

  const modalIdea = modalIdeaId ? ideas.find(i => i.id === modalIdeaId) : undefined;

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm sm:text-base font-semibold">Planning Grid ({grid.rows}×3)</h2>
        <div className="flex items-center gap-2">
          <button
            className="text-xs px-2 sm:px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 transition-colors"
            onClick={() => addGridRows(1)}
          >
            <span className="hidden sm:inline">Add Row (+3)</span>
            <span className="sm:hidden">+Row</span>
          </button>
          <button
            className="text-xs px-2 sm:px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 transition-colors"
            onClick={() => {
              if (confirm('Reset grid to 1×3 and clear all cells?')) {
                gridResetTo1x3();
              }
            }}
          >
            <span className="hidden sm:inline">Reset 1×3</span>
            <span className="sm:hidden">Reset</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full">
          {cells.map((cell) => {
            const idea = cell.ideaId ? ideas.find(i => i.id === cell.ideaId) : undefined;
            const label = getIdeaLabel(cell.ideaId);
            const filled = !!idea;
            
            return (
              <GridCellView
                key={cell.id}
                cell={cell}
                idea={idea}
                label={label}
                filled={filled}
                onOpen={() => filled && setModalIdeaId(cell.ideaId!)}
                onClear={() => gridClear(cell.id)}
              />
            );
          })}
        </div>
      </div>

      {modalIdea && (
        <IdeaModal idea={modalIdea} onClose={() => setModalIdeaId(null)} />
      )}
    </section>
  );
}

interface GridCellViewProps {
  cell: GridCell;
  idea?: any;
  label: string;
  filled: boolean;
  onOpen: () => void;
  onClear: () => void;
}

function GridCellView({ cell, idea, label, filled, onOpen, onClear }: GridCellViewProps) {
  // Droppable target
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: cell.id });
  
  // Draggable tile (only when filled)
  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id: `cell-${cell.id}`,
    data: filled ? { type: 'cell', cellId: cell.id, ideaId: String(idea?.id) } : { type: 'cell', cellId: cell.id },
    disabled: !filled,
  });

  const tileClasses = [
    "aspect-[9/16]",
    "w-full",
    "min-w-[84px]",
    "rounded-xl overflow-hidden",
    "bg-[#0c1116] border border-white/10"
  ].join(" ");

  return (
    <div
      ref={setDropRef}
      className={`relative ${tileClasses} transition-all ${
        isOver ? 'ring-2 ring-brand/50' : ''
      } ${isDragging ? 'opacity-40' : ''}`}
    >
      <div
        ref={filled ? setDragRef : undefined}
        {...(filled ? { ...attributes, ...listeners } : {})}
        className={`w-full h-full ${
          filled ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
        }`}
        style={{ touchAction: 'none' }}
        onClick={() => filled && onOpen()}
      >
        {filled ? (
          <>
            {idea?.thumbnail ? (
              <img 
                src={idea.thumbnail} 
                alt={label} 
                className="w-full h-full object-cover" 
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 bg-black/20">
                No thumbnail
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-black/55 backdrop-blur-sm text-white text-[11px] px-2 py-1 truncate">
              {label}
            </div>
            <button
              className="absolute top-1 right-1 text-xs px-2 py-1 rounded bg-black/60 hover:bg-black/80 text-white/70 hover:text-white transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
            >
              ×
            </button>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="text-[12px] sm:text-xs text-gray-400 border border-dashed border-gray-600 rounded-md px-3 py-2 text-center">
              Drop here
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



