import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DndContext, useSensor, useSensors, PointerSensor, KeyboardSensor, closestCenter, useDraggable, DragOverlay } from '@dnd-kit/core';
import { createPortal } from 'react-dom';
import { useWorkingIdeas, useAppStore } from '../store';
import IdeaRow from '../components/ideas/IdeaRow';
import IdeaEditor from '../components/ideas/IdeaEditor';
import PlanningGrid from '../components/grid/PlanningGrid';
import { useAutoExpandAndScroll } from '../hooks/useAutoExpandAndScroll';

/**
 * Working Ideas Page - Planning Grid + Expandable idea list
 * 
 * - Per-workspace Planning Grid at top for drag-and-drop scheduling
 * - Working ideas list with expand/collapse
 * - Drag ideas from list into grid
 * - POSTED button to move to Done
 * - Inline editor for all fields
 */
export default function Working() {
  const ideas = useWorkingIdeas();
  const [searchParams] = useSearchParams();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [toast, setToast] = useState<{ message: string; ideaId?: string } | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const setIdeaStatus = useAppStore(state => state.setIdeaStatus);
  const updateIdeaFields = useAppStore(state => state.updateIdeaFields);
  const deleteIdea = useAppStore(state => state.deleteIdea);
  const markIdeaPosted = useAppStore(state => state.markIdeaPosted);
  const unpostIdea = useAppStore(state => state.unpostIdea);
  const gridAssign = useAppStore(state => state.gridAssign);
  const gridMoveWithin = useAppStore(state => state.gridMoveWithin);

  // DnD sensors for the entire page
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor)
  );

  // Handle drag start
  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  // Handle drag end for both idea->cell and cell->cell
  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    setActiveId(null);
    
    if (!over) return;

    const data = active.data.current as any;
    const overId = String(over.id);

    if (data?.type === 'idea') {
      // Dropped a Working idea onto a cell
      gridAssign(overId, String(data.ideaId));
    } else if (data?.type === 'cell') {
      // Dragging a cell tile
      const fromId = String(data.cellId);
      if (fromId && fromId !== overId) {
        gridMoveWithin(fromId, overId);
      }
    }
  };

  // Get ideaId from URL
  const ideaId = searchParams.get('id') || undefined;

  // Auto-expand idea if ID is passed in URL (once only)
  const hasAutoExpandedRef = useRef(false);
  useEffect(() => {
    if (ideaId && !hasAutoExpandedRef.current && ideas.some(i => i.id === ideaId)) {
      setExpandedIds(prev => {
        const next = new Set(prev);
        next.add(ideaId);
        return next;
      });
      hasAutoExpandedRef.current = true;
    }
  }, [ideaId, ideas]);

  // Get target element and use auto-scroll hook
  const targetEl = ideaId ? (rowRefs.current[ideaId] ?? null) : null;
  useAutoExpandAndScroll(targetEl, ideaId);
  
  const toggleExpanded = (ideaId: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(ideaId)) {
        next.delete(ideaId);
      } else {
        next.add(ideaId);
      }
      return next;
    });
  };

  const handleStatusChange = (ideaId: string, status: 'brainstorming' | 'working') => {
    setIdeaStatus(ideaId, status);
    if (status === 'brainstorming') {
      setExpandedIds(prev => {
        const next = new Set(prev);
        next.delete(ideaId);
        return next;
      });
    }
  };

  const handleDelete = (ideaId: string) => {
    deleteIdea(ideaId);
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.delete(ideaId);
      return next;
    });
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  const handlePosted = (ideaId: string) => {
    // Clear any existing undo timer
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
    }

    // Mark as posted
    markIdeaPosted(ideaId);

    // Show toast with undo option
    setToast({ message: 'Moved to Done', ideaId });

    // Auto-hide toast after 8 seconds
    undoTimerRef.current = setTimeout(() => {
      setToast(null);
      undoTimerRef.current = null;
    }, 8000);
  };

  const handleUndo = () => {
    if (toast?.ideaId) {
      unpostIdea(toast.ideaId);
      setToast(null);
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
        undoTimerRef.current = null;
      }
    }
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
      }
    };
  }, []);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Planning Grid */}
        <PlanningGrid />

        {/* Toast Notification */}
        {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-black/90 backdrop-blur-sm text-white px-6 py-4 rounded-xl shadow-2xl border border-white/20 flex items-center gap-4 animate-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">{toast.message}</span>
          </div>
          {toast.ideaId && (
            <button
              onClick={handleUndo}
              className="px-3 py-1.5 text-sm font-medium bg-brand hover:bg-brand/80 rounded-lg transition-colors"
            >
              Undo
            </button>
          )}
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-white/50 hover:text-white transition-colors"
          >
            ×
          </button>
        </div>
      )}

      {/* Working Ideas List */}
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">Working Ideas</h1>
            <p className="text-white/60">
              Refine your ideas and mark them as POSTED when ready
            </p>
          </div>
          
          {ideas.length > 0 && expandedIds.size > 0 && (
            <button
              onClick={collapseAll}
              className="px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 border border-white/10 rounded-lg transition-colors"
            >
              Collapse All
            </button>
          )}
        </div>

        <div className="space-y-4" style={{ overflowAnchor: 'none' }}>
          {ideas.length === 0 ? (
            <div className="text-center py-16 bg-white/5 border border-white/10 rounded-2xl">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-white/20"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-white/50 mb-2">Nothing here yet.</p>
              <p className="text-sm text-white/40">
                Promote an idea from{' '}
                <a href="/brainstorming" className="text-brand hover:underline">
                  Brainstorming
                </a>{' '}
                to get started.
              </p>
            </div>
          ) : (
            ideas.map((idea) => (
              <DraggableIdeaRow
                key={idea.id}
                idea={idea}
                isExpanded={expandedIds.has(idea.id)}
                onToggle={() => toggleExpanded(idea.id)}
                onPosted={() => handlePosted(idea.id)}
                onUpdate={(patch) => updateIdeaFields(idea.id, patch)}
                onStatusChange={(status) => handleStatusChange(idea.id, status)}
                onDelete={() => handleDelete(idea.id)}
                rowRef={(el) => { rowRefs.current[idea.id] = el; }}
              />
            ))
          )}
        </div>

        {ideas.length > 0 && (
          <div className="text-center text-sm text-white/50 py-4">
            {ideas.length} working {ideas.length === 1 ? 'idea' : 'ideas'}
          </div>
        )}
      </div>
      </div>

      {/* Drag Overlay - matches tile size */}
      {createPortal(
        <DragOverlay>
          {activeId ? (
            <div 
              className="aspect-[9/16] w-32 sm:w-36 md:w-40 lg:w-44 rounded-xl overflow-hidden border-2 border-brand bg-gray-900/90 shadow-2xl flex items-center justify-center"
            >
              <div className="text-xs text-gray-400">Dragging...</div>
            </div>
          ) : null}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  );
}

// Draggable idea row component
interface DraggableIdeaRowProps {
  idea: any;
  isExpanded: boolean;
  onToggle: () => void;
  onPosted: () => void;
  onUpdate: (patch: any) => void;
  onStatusChange: (status: 'brainstorming' | 'working') => void;
  onDelete: () => void;
  rowRef: (el: HTMLDivElement | null) => void;
}

function DraggableIdeaRow({
  idea,
  isExpanded,
  onToggle,
  onPosted,
  onUpdate,
  onStatusChange,
  onDelete,
  rowRef,
}: DraggableIdeaRowProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `idea-${idea.id}`,
    data: { type: 'idea', ideaId: String(idea.id) },
  });

  return (
    <div
      id={`idea-${idea.id}`}
      ref={rowRef}
      className="space-y-3"
    >
      {/* Row with drag handle and POSTED button */}
      <div className="flex items-start gap-3">
        {/* Drag Handle - separate from the row content */}
        <div
          ref={setNodeRef}
          {...attributes}
          {...listeners}
          className={`flex-shrink-0 inline-flex items-center justify-center px-2 py-2 rounded-lg bg-gray-800/60 border border-gray-700/60 hover:bg-gray-800 text-xs text-gray-400 hover:text-gray-300 cursor-grab active:cursor-grabbing select-none transition-colors ${
            isDragging ? 'opacity-40' : ''
          }`}
          style={{ touchAction: 'none' }}
          aria-label="Drag to Planning Grid"
          title="Drag to Planning Grid"
        >
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="3" cy="4" r="1.5" />
            <circle cx="3" cy="8" r="1.5" />
            <circle cx="3" cy="12" r="1.5" />
            <circle cx="8" cy="4" r="1.5" />
            <circle cx="8" cy="8" r="1.5" />
            <circle cx="8" cy="12" r="1.5" />
            <circle cx="13" cy="4" r="1.5" />
            <circle cx="13" cy="8" r="1.5" />
            <circle cx="13" cy="12" r="1.5" />
          </svg>
        </div>

        {/* Idea Row Content */}
        <div className="flex-1 min-w-0">
          <IdeaRow
            idea={idea}
            isExpanded={isExpanded}
            onToggle={onToggle}
          />
        </div>
        
        {/* POSTED Button */}
        <button
          onClick={onPosted}
          className="px-4 py-2 text-sm rounded-lg font-semibold bg-brand hover:bg-brand/80 text-white transition-colors flex-shrink-0 shadow-lg shadow-brand/20"
          title="Mark as posted and move to Done"
        >
          POSTED
        </button>
      </div>

              {/* Editor (expanded) - centered */}
              {isExpanded && (
                <div className="mx-auto w-full max-w-3xl">
                  <IdeaEditor
                    idea={idea}
                    onUpdate={onUpdate}
                    onStatusChange={onStatusChange}
                    onDelete={onDelete}
                    onMinimize={onToggle}
                  />
                </div>
              )}
    </div>
  );
}
