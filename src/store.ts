import { useSyncExternalStore, useRef } from 'react';

// ============================================================================
// Types
// ============================================================================

export type PostStatus =
  | 'Idea'
  | 'Scripting'
  | 'Pre-Prod'
  | 'Shooting'
  | 'Editing'
  | 'Review/QC'
  | 'Ready'
  | 'Scheduled'
  | 'Posted'
  | 'Done';

export interface Workspace {
  id: string;
  name: string;
  color?: string;
  avatar?: string;
  vibe?: string;
}

export interface BinPreset {
  id: string;
  name: string;
  tagsText: string;
}

export interface Bin {
  id: string;
  workspace_id: string;
  name: string;
  color?: string;
  presets: BinPreset[];
  sort_order: number;
  createdAt?: number;
  updatedAt?: number;
  ideaIds?: string[];
  hashtagDefaults?: {
    youtube?: string[];
    tiktok?: string[];
    instagram?: string[];
  };
}

export type IdeaStatus = 'brainstorming' | 'working' | 'done';

export interface Idea {
  id: string;
  workspace_id: string;
  bin_id: string | null;
  text: string; // original quick note
  status: IdeaStatus; // "brainstorming" or "working" or "done"
  createdAt: number;
  updatedAt?: number;
  tags?: string[];
  
  // Working fields (empty in brainstorming; editable in working)
  title?: string; // YouTube Shorts title
  description?: string;
  hashtags?: {
    youtube?: string[];
    tiktok?: string[];
    instagram?: string[];
  };
  script?: string;
  shotlist?: string;
  thumbnail?: string; // URL or notes
}

export interface Post {
  id: string;
  workspace_id: string;
  idea_id: string | null;
  bin_id: string | null;
  title: string;
  type: string;
  status: PostStatus;
  post_date: string | null; // YYYY-MM-DD or null
  platforms: {
    tiktok: boolean;
    instagram: boolean;
    yt_shorts: boolean;
    yt_long: boolean;
  };
  caption: string;
  hashtagsText: string;
  thumbnail_name: string;
  video_final_name: string;
  premiere_project_name: string;
  assets_keywords: string;
  location_note: string;
  preview_base64?: string | null;
}

export interface DoneRecord {
  id: string; // idea id
  movedAt: number; // Date.now() when posted
  workspaceId?: string;
  snapshot: {
    title?: string;
    description?: string;
    hashtags?: {
      youtube?: string[];
      tiktok?: string[];
      instagram?: string[];
    };
    script?: string;
    shotlist?: string;
    thumbnail?: string;
    binId?: string;
    text?: string; // original quick note
  };
}

export type GridCell = { 
  id: string; 
  row: number; 
  col: number; 
  ideaId?: string; // ideaId is string
};

export type GridState = { 
  columns: number; 
  rows: number; 
  cells: Record<string, GridCell>;
};

export interface AppData {
  version: number;
  workspaces: Workspace[];
  bins: Bin[];
  ideas: Idea[];
  posts: Post[];
  currentWorkspaceId: string;
  done?: Record<string, DoneRecord>;
  gridsByWorkspace?: Record<string, GridState>;
}

export interface AppStore extends AppData {
  // Actions (accessible via selectors for backward compatibility)
  setWorkspace: (id: string) => void;
  addBin: (name: string) => void;
  updateBin: (id: string, updates: Partial<Bin>) => void;
  deleteBin: (id: string) => void;
  addIdea: (bin_id: string | null, text: string) => void;
  updateIdea: (id: string, updates: Partial<Idea>) => void;
  deleteIdea: (id: string) => void;
  setIdeaStatus: (id: string, status: IdeaStatus) => void;
  updateIdeaFields: (id: string, patch: Partial<Idea>) => void;
  moveIdeaToBin: (ideaId: string, binId: string | null) => void;
  updateBinHashtagDefaults: (binId: string, patch: { youtube?: string[]; tiktok?: string[]; instagram?: string[] }) => void;
  promoteIdeaToPost: (idea_id: string) => void;
  updatePost: (id: string, updates: Partial<Post>) => void;
  deletePost: (id: string) => void;
  markIdeaPosted: (ideaId: string) => void;
  unpostIdea: (ideaId: string) => void;
  gridAssign: (cellId: string, ideaId?: string) => void;
  gridMoveWithin: (fromId: string, toId: string) => void;
  gridClear: (cellId: string) => void;
  gridResetTo1x3: () => void;
  addGridRows: (count?: number) => void;
  clearAll: () => void;
  importState: (snapshot: Partial<AppData>) => void;
}

// ============================================================================
// Grid Helpers
// ============================================================================

function initGrid1x3(): GridState {
  const cells: Record<string, GridCell> = {};
  for (let c = 0; c < 3; c++) {
    const id = `r0-c${c}`;
    cells[id] = { id, row: 0, col: c, ideaId: undefined };
  }
  return { columns: 3, rows: 1, cells };
}

// ============================================================================
// Storage Configuration
// ============================================================================

const STORAGE_KEY = 'content-grid-web::state';
const SNAPSHOT_VERSION = 3; // Bumped for grid and done features

/**
 * MIGRATION HOOK - Update this when adding new fields or changing state shape
 * 
 * When incrementing SNAPSHOT_VERSION:
 * - Add logic to handle previous versions
 * - Ensure all required keys exist (workspaces, bins, ideas, posts, currentWorkspaceId)
 * - Set version = SNAPSHOT_VERSION
 * 
 * For future prompts (G/H/I): Add field migrations here.
 */
function migrate(old: any): AppData {
  // Handle missing or invalid input
  if (!old || typeof old !== 'object') {
    return getDefaultState();
  }

  // Start with defaults and merge what we have
  const migrated: AppData = {
    version: SNAPSHOT_VERSION,
    workspaces: Array.isArray(old.workspaces) ? old.workspaces : [],
    bins: Array.isArray(old.bins) ? old.bins : [],
    ideas: Array.isArray(old.ideas) ? old.ideas : [],
    posts: Array.isArray(old.posts) ? old.posts : [],
    currentWorkspaceId: old.currentWorkspaceId || 'ws-1',
    done: old.done && typeof old.done === 'object' ? old.done : {},
  };
  
  // Drop old board state from previous versions
  if ((old as any).board) delete (old as any).board;
  
  // Migrate to workspace-scoped grids
  if (!migrated.gridsByWorkspace) {
    migrated.gridsByWorkspace = {};
  }
  
  const ws = migrated.currentWorkspaceId || 'ws-1';
  
  // Move legacy single grid to current workspace
  if ((old as any).grid) {
    migrated.gridsByWorkspace[ws] = (old as any).grid;
    delete (old as any).grid;
  }
  
  // Ensure active workspace has a grid
  if (!migrated.gridsByWorkspace[ws]) {
    migrated.gridsByWorkspace[ws] = initGrid1x3();
  }
  
  // Coerce ideaId to string in all workspace grids
  for (const [workspaceId, gridState] of Object.entries(migrated.gridsByWorkspace)) {
    if (gridState && gridState.cells) {
      const cleanedCells: Record<string, GridCell> = {};
      Object.entries(gridState.cells).forEach(([key, cell]: [string, any]) => {
        cleanedCells[key] = {
          id: cell.id,
          row: cell.row,
          col: cell.col,
          ideaId: cell.ideaId != null ? String(cell.ideaId) : undefined,
        };
      });
      migrated.gridsByWorkspace[workspaceId] = {
        columns: gridState.columns ?? 3,
        rows: gridState.rows ?? 1,
        cells: cleanedCells,
      };
    }
  }

  // Migrate bins: ensure hashtagDefaults exists
  migrated.bins = migrated.bins.map(bin => ({
    ...bin,
    hashtagDefaults: bin.hashtagDefaults || {
      youtube: [],
      tiktok: [],
      instagram: [],
    },
    ideaIds: bin.ideaIds || [],
    createdAt: bin.createdAt || Date.now(),
  }));

  // Migrate ideas: ensure status field and convert old format to new
  migrated.ideas = migrated.ideas.map(idea => {
    // Handle old format (title/notes) → new format (text)
    const text = (idea as any).text || (idea as any).title || '';
    const status = idea.status || 'brainstorming';
    
    return {
      ...idea,
      text,
      status,
      createdAt: idea.createdAt || Date.now(),
      // Ensure hashtags object exists for working ideas
      hashtags: status === 'working' ? (idea.hashtags || {
        youtube: [],
        tiktok: [],
        instagram: [],
      }) : idea.hashtags,
    };
  });

  // If no workspaces, add defaults
  if (migrated.workspaces.length === 0) {
    migrated.workspaces = [
      { 
        id: 'ws-1', 
        name: '@motherboardsmoke', 
        color: 'amber',
        avatar: '/brand/mobo/avatar.png',
        vibe: '/brand/mobo/vibe.png',
      },
      { 
        id: 'ws-2', 
        name: '@StephenJoking', 
        color: 'red',
        avatar: '/brand/stephen/avatar.png',
        vibe: '/brand/stephen/vibe.png',
      },
    ];
  }

  // If no bins, add defaults
  if (migrated.bins.length === 0) {
    migrated.bins = [
  { id: 'bin-1', workspace_id: 'ws-1', name: 'Tech Talk', color: 'blue', presets: [], sort_order: 0 },
  { id: 'bin-2', workspace_id: 'ws-1', name: 'Skit', color: 'red', presets: [], sort_order: 1 },
  { id: 'bin-3', workspace_id: 'ws-1', name: 'Short Form Model', color: 'amber', presets: [], sort_order: 2 },
  { id: 'bin-4', workspace_id: 'ws-1', name: 'Long Form Model', color: 'emerald', presets: [], sort_order: 3 },
  { id: 'bin-5', workspace_id: 'ws-1', name: 'Meme', color: 'purple', presets: [], sort_order: 4 },
  { id: 'bin-6', workspace_id: 'ws-2', name: 'Skit', color: 'red', presets: [], sort_order: 0 },
  { id: 'bin-7', workspace_id: 'ws-2', name: 'Meme', color: 'purple', presets: [], sort_order: 1 },
];
  }

  return migrated;
}

// ============================================================================
// Utilities
// ============================================================================

function shallowEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  if (typeof a !== 'object' || typeof b !== 'object') return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (a[key] !== b[key]) return false;
  }

  return true;
}

function safeParse(json: string): any | null {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function safeStringify(data: any): string | null {
  try {
    return JSON.stringify(data);
  } catch {
    return null;
  }
}

function isLocalStorageAvailable(): boolean {
  try {
    const test = '__test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Default State
// ============================================================================

function getDefaultState(): AppData {
  return {
    version: SNAPSHOT_VERSION,
    workspaces: [
      { 
        id: 'ws-1', 
        name: '@motherboardsmoke', 
        color: 'amber',
        avatar: '/brand/mobo/avatar.png',
        vibe: '/brand/mobo/vibe.png',
      },
      { 
        id: 'ws-2', 
        name: '@StephenJoking', 
        color: 'red',
        avatar: '/brand/stephen/avatar.png',
        vibe: '/brand/stephen/vibe.png',
      },
    ],
    bins: [
      { id: 'bin-1', workspace_id: 'ws-1', name: 'Tech Talk', color: 'blue', presets: [], sort_order: 0 },
      { id: 'bin-2', workspace_id: 'ws-1', name: 'Skit', color: 'red', presets: [], sort_order: 1 },
      { id: 'bin-3', workspace_id: 'ws-1', name: 'Short Form Model', color: 'amber', presets: [], sort_order: 2 },
      { id: 'bin-4', workspace_id: 'ws-1', name: 'Long Form Model', color: 'emerald', presets: [], sort_order: 3 },
      { id: 'bin-5', workspace_id: 'ws-1', name: 'Meme', color: 'purple', presets: [], sort_order: 4 },
      { id: 'bin-6', workspace_id: 'ws-2', name: 'Skit', color: 'red', presets: [], sort_order: 0 },
      { id: 'bin-7', workspace_id: 'ws-2', name: 'Meme', color: 'purple', presets: [], sort_order: 1 },
    ],
  ideas: [],
  posts: [],
  currentWorkspaceId: 'ws-1',
    done: {},
    gridsByWorkspace: {
      'ws-1': initGrid1x3(),
      'ws-2': initGrid1x3(),
    },
  };
}

// ============================================================================
// Store Implementation with localStorage Persistence
// ============================================================================

let state: AppStore;
const listeners = new Set<() => void>();
let saveTimer: ReturnType<typeof setTimeout> | null = null;
const hasLocalStorage = isLocalStorageAvailable();

// Hydrate state from localStorage on first import
function hydrateState(): AppData {
  if (!hasLocalStorage) {
    return getDefaultState();
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return getDefaultState();
  }

  const parsed = safeParse(stored);
  return migrate(parsed);
}

// Initialize with placeholder state (actions will be attached below)
state = { ...hydrateState() } as AppStore;

// Schedule initial save to ensure key exists (debounced, won't block UI)
if (hasLocalStorage) {
  scheduleSave();
}

function notifyListeners() {
  listeners.forEach(listener => listener());
}

function scheduleSave() {
  // Clear any pending save
  if (saveTimer !== null) {
    clearTimeout(saveTimer);
  }

  // Debounce: wait 200ms, then attempt save
  saveTimer = setTimeout(() => {
    saveTimer = null;
    
    // Prefer requestIdleCallback for non-blocking writes
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(doSave, { timeout: 500 });
    } else {
      doSave();
    }
  }, 200);
}

function doSave() {
  if (!hasLocalStorage) return;

  try {
    // Only serialize data properties, not action methods
    const dataToSave: AppData = {
      version: state.version,
      workspaces: state.workspaces,
      bins: state.bins,
      ideas: state.ideas,
      posts: state.posts,
      currentWorkspaceId: state.currentWorkspaceId,
      done: state.done,
      gridsByWorkspace: state.gridsByWorkspace,
    };
    
    const serialized = safeStringify(dataToSave);
    if (serialized) {
      localStorage.setItem(STORAGE_KEY, serialized);
    }
  } catch (error) {
    // Silently ignore storage errors to avoid UI crashes
    console.warn('[Store] Failed to save to localStorage:', error);
  }
}

function emitChange() {
  notifyListeners();
  scheduleSave();
}

// ============================================================================
// Core Store API
// ============================================================================

export const store = {
  getState(): AppStore {
    return state;
  },

  setState(updater: Partial<AppData> | ((s: AppStore) => Partial<AppData>)): void {
    const partial = typeof updater === 'function' ? updater(state) : updater;
    
    // Only update data properties, preserve action methods
    const nextData: AppData = {
      version: partial.version ?? state.version,
      workspaces: partial.workspaces ?? state.workspaces,
      bins: partial.bins ?? state.bins,
      ideas: partial.ideas ?? state.ideas,
      posts: partial.posts ?? state.posts,
      currentWorkspaceId: partial.currentWorkspaceId ?? state.currentWorkspaceId,
      done: partial.done ?? state.done,
      gridsByWorkspace: partial.gridsByWorkspace ?? state.gridsByWorkspace,
    };

    // Skip if data shallowly equal (prevents no-op updates)
    const currentData: AppData = {
      version: state.version,
      workspaces: state.workspaces,
      bins: state.bins,
      ideas: state.ideas,
      posts: state.posts,
      currentWorkspaceId: state.currentWorkspaceId,
      done: state.done,
      gridsByWorkspace: state.gridsByWorkspace,
    };
    
    if (shallowEqual(currentData, nextData)) {
      return;
    }

    // Update state with new data, preserving action methods
    state = { ...state, ...nextData };
    emitChange();
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

// ============================================================================
// Selector-based Hook (useSyncExternalStore pattern)
// ============================================================================

export function useAppStore<T>(
  selector: (state: AppStore) => T,
  equalityFn?: (a: T, b: T) => boolean
): T {
  const lastSelectedRef = useRef<T | undefined>(undefined);
  const lastStateRef = useRef<AppStore | undefined>(undefined);

  const getSnapshot = () => {
    const currentState = store.getState();
    
    // If state hasn't changed, return cached selection
    if (currentState === lastStateRef.current && lastSelectedRef.current !== undefined) {
      return lastSelectedRef.current;
    }

    const selected = selector(currentState);
    
    // If selected value hasn't changed (by equality check), return cached
    if (lastSelectedRef.current !== undefined) {
      const areEqual = equalityFn 
        ? equalityFn(lastSelectedRef.current, selected)
        : typeof selected === 'object' && selected !== null
          ? shallowEqual(lastSelectedRef.current, selected)
          : Object.is(lastSelectedRef.current, selected);
      
      if (areEqual) {
        return lastSelectedRef.current;
      }
    }

    // Update cache
    lastSelectedRef.current = selected;
    lastStateRef.current = currentState;
    
    return selected;
  };

  return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}

// ============================================================================
// Actions (Domain Logic)
// ============================================================================

// Attach action methods to state object
state.setWorkspace = function(id: string) {
  store.setState({ currentWorkspaceId: id });
};

state.addBin = function(name: string) {
  const currentState = store.getState();
  const workspaceBins = currentState.bins.filter(
    b => b.workspace_id === currentState.currentWorkspaceId
  );
    const maxSortOrder = workspaceBins.length > 0
      ? Math.max(...workspaceBins.map(b => b.sort_order))
      : -1;
    
    const newBin: Bin = {
      id: `bin-${Date.now()}`,
    workspace_id: currentState.currentWorkspaceId,
      name,
    color: undefined,
      presets: [],
      sort_order: maxSortOrder + 1,
    };
    
  store.setState({
    bins: [...currentState.bins, newBin],
  });
};

state.updateBin = function(id: string, updates: Partial<Bin>) {
  const currentState = store.getState();
  store.setState({
    bins: currentState.bins.map(bin =>
      bin.id === id ? { ...bin, ...updates } : bin
    ),
  });
};

state.deleteBin = function(id: string) {
  const currentState = store.getState();
  
  // Remove bin
  const nextBins = currentState.bins.filter(b => b.id !== id);
  
  // Clear bin_id from ideas that referenced this bin
  const nextIdeas = currentState.ideas.map(idea =>
    idea.bin_id === id ? { ...idea, bin_id: null } : idea
  );
  
  // Clear bin_id from posts that referenced this bin
  const nextPosts = currentState.posts.map(post =>
    post.bin_id === id ? { ...post, bin_id: null } : post
  );

  store.setState({
    bins: nextBins,
    ideas: nextIdeas,
    posts: nextPosts,
  });
};

state.addIdea = function(bin_id: string | null, text: string) {
  const currentState = store.getState();
    const newIdea: Idea = {
      id: `idea-${Date.now()}`,
    workspace_id: currentState.currentWorkspaceId,
      bin_id,
    text,
    status: 'brainstorming',
    createdAt: Date.now(),
    tags: [],
  };

  store.setState({
    ideas: [...currentState.ideas, newIdea],
  });
};

state.updateIdea = function(id: string, updates: Partial<Idea>) {
  const currentState = store.getState();
  store.setState({
    ideas: currentState.ideas.map(idea =>
      idea.id === id ? { ...idea, ...updates } : idea
    ),
  });
};

state.deleteIdea = function(id: string) {
  const currentState = store.getState();
  store.setState({
    ideas: currentState.ideas.filter(i => i.id !== id),
  });
};

// New brainstorming/working actions
state.setIdeaStatus = function(id: string, status: IdeaStatus) {
  const currentState = store.getState();
  const idea = currentState.ideas.find(i => i.id === id);
  
  if (!idea) return;

  const updates: Partial<Idea> = {
    status,
    updatedAt: Date.now(),
  };

  // When moving to "working", initialize hashtags from bin defaults
  if (status === 'working' && !idea.hashtags && idea.bin_id) {
    const bin = currentState.bins.find(b => b.id === idea.bin_id);
    if (bin?.hashtagDefaults) {
      updates.hashtags = {
        youtube: [...(bin.hashtagDefaults.youtube || [])],
        tiktok: [...(bin.hashtagDefaults.tiktok || [])],
        instagram: [...(bin.hashtagDefaults.instagram || [])],
      };
    } else {
      updates.hashtags = {
        youtube: [],
        tiktok: [],
        instagram: [],
      };
    }
  }

  store.setState({
    ideas: currentState.ideas.map(i =>
      i.id === id ? { ...i, ...updates } : i
    ),
  });
};

state.updateIdeaFields = function(id: string, patch: Partial<Idea>) {
  const currentState = store.getState();
  store.setState({
    ideas: currentState.ideas.map(idea =>
      idea.id === id ? { ...idea, ...patch, updatedAt: Date.now() } : idea
    ),
  });
};

state.moveIdeaToBin = function(ideaId: string, binId: string | null) {
  const currentState = store.getState();
  store.setState({
    ideas: currentState.ideas.map(idea =>
      idea.id === ideaId ? { ...idea, bin_id: binId, updatedAt: Date.now() } : idea
    ),
  });
};

state.updateBinHashtagDefaults = function(binId: string, patch: { youtube?: string[]; tiktok?: string[]; instagram?: string[] }) {
  const currentState = store.getState();
  store.setState({
    bins: currentState.bins.map(bin =>
      bin.id === binId ? {
        ...bin,
        hashtagDefaults: {
          youtube: patch.youtube !== undefined ? patch.youtube : (bin.hashtagDefaults?.youtube || []),
          tiktok: patch.tiktok !== undefined ? patch.tiktok : (bin.hashtagDefaults?.tiktok || []),
          instagram: patch.instagram !== undefined ? patch.instagram : (bin.hashtagDefaults?.instagram || []),
        },
        updatedAt: Date.now(),
      } : bin
    ),
  });
};

state.promoteIdeaToPost = function(idea_id: string) {
  const currentState = store.getState();
  const idea = currentState.ideas.find(i => i.id === idea_id);
    
    if (!idea) return;
    
    const newPost: Post = {
      id: `post-${Date.now()}`,
      workspace_id: idea.workspace_id,
      idea_id: idea.id,
      bin_id: idea.bin_id,
    title: idea.title || idea.text,
      type: '',
      status: 'Idea',
      post_date: null,
      platforms: {
        tiktok: false,
        instagram: false,
        yt_shorts: false,
        yt_long: false,
      },
    caption: idea.description || '',
      hashtagsText: '',
      thumbnail_name: '',
      video_final_name: '',
      premiere_project_name: '',
      assets_keywords: '',
      location_note: '',
      preview_base64: null,
    };
    
  store.setState({
    posts: [...currentState.posts, newPost],
  });
};

state.updatePost = function(id: string, updates: Partial<Post>) {
  const currentState = store.getState();
  store.setState({
    posts: currentState.posts.map(post =>
        post.id === id ? { ...post, ...updates } : post
      ),
  });
};

state.deletePost = function(id: string) {
  const currentState = store.getState();
  store.setState({
    posts: currentState.posts.filter(p => p.id !== id),
  });
};

// Done/Posted actions
state.markIdeaPosted = function(ideaId: string) {
  const currentState = store.getState();
  const idea = currentState.ideas.find(i => i.id === ideaId);
  
  if (!idea || idea.status === 'done') return;
  
  // Create snapshot
  const snapshot: DoneRecord = {
    id: ideaId,
    movedAt: Date.now(),
    workspaceId: idea.workspace_id,
    snapshot: {
      title: idea.title,
      description: idea.description,
      hashtags: idea.hashtags,
      script: idea.script,
      shotlist: idea.shotlist,
      thumbnail: idea.thumbnail,
      binId: idea.bin_id || undefined,
      text: idea.text,
    },
  };
  
  // Update idea status
  const nextIdeas = currentState.ideas.map(i =>
    i.id === ideaId ? { ...i, status: 'done' as IdeaStatus, updatedAt: Date.now() } : i
  );
  
  store.setState({
    ideas: nextIdeas,
    done: {
      ...(currentState.done || {}),
      [ideaId]: snapshot,
    },
  });
};

state.unpostIdea = function(ideaId: string) {
  const currentState = store.getState();
  const idea = currentState.ideas.find(i => i.id === ideaId);
  
  if (!idea) return;
  
  // Revert idea status to working AND remove from done state
  const nextIdeas = currentState.ideas.map(i =>
    i.id === ideaId ? { ...i, status: 'working' as IdeaStatus, updatedAt: Date.now() } : i
  );
  
  // Remove from done by destructuring to omit the ideaId key
  const { [ideaId]: _removed, ...restDone } = currentState.done || {};
  
  store.setState({
    ideas: nextIdeas,
    done: restDone,
  });
};

// Grid actions (workspace-scoped, immutable)
state.gridAssign = function(cellId: string, ideaId?: string) {
  const currentState = store.getState();
  const ws = currentState.currentWorkspaceId;
  const grid = currentState.gridsByWorkspace?.[ws];
  
  if (!grid) {
    store.setState({
      gridsByWorkspace: { ...(currentState.gridsByWorkspace ?? {}), [ws]: initGrid1x3() },
    });
    return;
  }
  
  const cell = grid.cells[cellId];
  if (!cell) return;
  
  const nextId = ideaId ? String(ideaId) : undefined;
  const nextCells = { ...grid.cells, [cellId]: { ...cell, ideaId: nextId } };
  
  store.setState({
    gridsByWorkspace: { ...currentState.gridsByWorkspace!, [ws]: { ...grid, cells: nextCells } },
  });
};

state.gridMoveWithin = function(fromId: string, toId: string) {
  const currentState = store.getState();
  const ws = currentState.currentWorkspaceId;
  const grid = currentState.gridsByWorkspace?.[ws];
  if (!grid) return;
  
  const cellA = grid.cells[fromId];
  const cellB = grid.cells[toId];
  if (!cellA || !cellB) return;
  
  // Move if target empty; otherwise swap
  const nextCells = { ...grid.cells };
  if (!cellB.ideaId) {
    nextCells[toId] = { ...cellB, ideaId: cellA.ideaId };
    nextCells[fromId] = { ...cellA, ideaId: undefined };
  } else {
    nextCells[toId] = { ...cellB, ideaId: cellA.ideaId };
    nextCells[fromId] = { ...cellA, ideaId: cellB.ideaId };
  }
  
  store.setState({
    gridsByWorkspace: { ...currentState.gridsByWorkspace!, [ws]: { ...grid, cells: nextCells } },
  });
};

state.gridClear = function(cellId: string) {
  const currentState = store.getState();
  const ws = currentState.currentWorkspaceId;
  const grid = currentState.gridsByWorkspace?.[ws];
  if (!grid) return;
  
  const cell = grid.cells[cellId];
  if (!cell) return;
  
  const nextCells = { ...grid.cells, [cellId]: { ...cell, ideaId: undefined } };
  
  store.setState({
    gridsByWorkspace: { ...currentState.gridsByWorkspace!, [ws]: { ...grid, cells: nextCells } },
  });
};

state.gridResetTo1x3 = function() {
  const currentState = store.getState();
  const ws = currentState.currentWorkspaceId;
  
  store.setState({
    gridsByWorkspace: { ...currentState.gridsByWorkspace!, [ws]: initGrid1x3() },
  });
};

state.addGridRows = function(count: number = 1) {
  const currentState = store.getState();
  const ws = currentState.currentWorkspaceId;
  const grid = currentState.gridsByWorkspace?.[ws] ?? initGrid1x3();
  
  const newRows = grid.rows + count;
  const cells = { ...grid.cells };
  
  // Add new cells for new rows (always 3 columns)
  for (let r = grid.rows; r < newRows; r++) {
    for (let c = 0; c < 3; c++) {
      const id = `r${r}-c${c}`;
      cells[id] = { id, row: r, col: c, ideaId: undefined };
    }
  }
  
  store.setState({
    gridsByWorkspace: { ...currentState.gridsByWorkspace!, [ws]: { ...grid, rows: newRows, cells } },
  });
};

state.clearAll = function() {
  store.setState(getDefaultState());
};

/**
 * OFFICIAL IMPORT ENTRY for future import/export features (Prompt G/H/I)
 * 
 * Accepts a partial snapshot, merges with defaults, runs through migration,
 * and replaces the entire state.
 */
state.importState = function(snapshot: Partial<AppData>) {
  const merged = { ...getDefaultState(), ...snapshot };
  const migrated = migrate(merged);
  
  // Update state with migrated data, preserving action methods
  state = {
    ...state,
    version: migrated.version,
    workspaces: migrated.workspaces,
    bins: migrated.bins,
    ideas: migrated.ideas,
    posts: migrated.posts,
    currentWorkspaceId: migrated.currentWorkspaceId,
    done: migrated.done,
    gridsByWorkspace: migrated.gridsByWorkspace,
  };
  
  emitChange();
};

// Export actions object for direct use if needed
export const actions = {
  setWorkspace: state.setWorkspace,
  addBin: state.addBin,
  updateBin: state.updateBin,
  deleteBin: state.deleteBin,
  addIdea: state.addIdea,
  updateIdea: state.updateIdea,
  deleteIdea: state.deleteIdea,
  setIdeaStatus: state.setIdeaStatus,
  updateIdeaFields: state.updateIdeaFields,
  moveIdeaToBin: state.moveIdeaToBin,
  updateBinHashtagDefaults: state.updateBinHashtagDefaults,
  promoteIdeaToPost: state.promoteIdeaToPost,
  updatePost: state.updatePost,
  deletePost: state.deletePost,
  markIdeaPosted: state.markIdeaPosted,
  unpostIdea: state.unpostIdea,
  gridAssign: state.gridAssign,
  gridMoveWithin: state.gridMoveWithin,
  gridClear: state.gridClear,
  gridResetTo1x3: state.gridResetTo1x3,
  addGridRows: state.addGridRows,
  clearAll: state.clearAll,
  importState: state.importState,
};

// ============================================================================
// Pure Selector Functions (stable and memoizable for components)
// ============================================================================

export const selectWorkspaceId = (state: AppData) => state.currentWorkspaceId;
export const selectWorkspaces = (state: AppData) => state.workspaces || [];
export const selectBins = (state: AppData) => state.bins || [];
export const selectIdeas = (state: AppData) => state.ideas || [];
export const selectPosts = (state: AppData) => state.posts || [];

export const selectScheduledCount = (state: AppData) => {
  const posts = state.posts || [];
  return posts.filter(
    p => p.workspace_id === state.currentWorkspaceId && p.post_date !== null && p.post_date !== ''
  ).length;
};

export const selectNextOpenDate = (state: AppData) => {
  const posts = state.posts || [];
  const timestamps = posts
    .filter(p => p.workspace_id === state.currentWorkspaceId && p.post_date)
    .map(p => new Date(p.post_date!).getTime())
    .filter(t => !isNaN(t));
  
  if (timestamps.length === 0) {
    return '—';
  }
  
  const maxTimestamp = Math.max(...timestamps);
  const nextDay = new Date(maxTimestamp + 86400000);
  return nextDay.toISOString().slice(0, 10);
};

export const selectCurrentWorkspace = (state: AppData) => {
  const workspaces = state.workspaces || [];
  return workspaces.find(w => w.id === state.currentWorkspaceId);
};

// ============================================================================
// Brainstorming/Working Selectors and Helpers
// ============================================================================

/**
 * Get brainstorming ideas for current workspace
 */
export function useBrainstormingIdeas(): Idea[] {
  const currentWorkspaceId = useAppStore(state => state.currentWorkspaceId);
  const ideas = useAppStore(state => state.ideas || []);
  
  return ideas.filter(
    idea => idea.workspace_id === currentWorkspaceId && idea.status === 'brainstorming'
  ).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)); // Most recent first
}

/**
 * Get working ideas for current workspace
 */
export function useWorkingIdeas(): Idea[] {
  const currentWorkspaceId = useAppStore(state => state.currentWorkspaceId);
  const ideas = useAppStore(state => state.ideas || []);
  
  return ideas.filter(
    idea => idea.workspace_id === currentWorkspaceId && idea.status === 'working'
  ).sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
}

/**
 * Get hashtag defaults for a bin
 */
export function useBinHashtagDefaults(binId?: string | null): {
  youtube: string[];
  tiktok: string[];
  instagram: string[];
} {
  const bins = useAppStore(state => state.bins || []);
  
  if (!binId) {
    return { youtube: [], tiktok: [], instagram: [] };
  }
  
  const bin = bins.find(b => b.id === binId);
  const defaults = bin?.hashtagDefaults;
  
  return {
    youtube: defaults?.youtube || [],
    tiktok: defaults?.tiktok || [],
    instagram: defaults?.instagram || [],
  };
}

/**
 * Compute completion status for an idea
 */
export function computeIdeaCompletion(idea: Idea): {
  title: boolean;
  description: boolean;
  youtube: boolean;
  tiktok: boolean;
  instagram: boolean;
  script: boolean;
  shotlist: boolean;
  thumbnail: boolean;
  percent: number;
} {
  const title = !!idea.title && idea.title.trim().length > 0;
  const description = !!idea.description && idea.description.trim().length > 0;
  const youtube = (idea.hashtags?.youtube?.length || 0) > 0;
  const tiktok = (idea.hashtags?.tiktok?.length || 0) > 0;
  const instagram = (idea.hashtags?.instagram?.length || 0) > 0;
  const script = !!idea.script && idea.script.trim().length > 0;
  const shotlist = !!idea.shotlist && idea.shotlist.trim().length > 0;
  const thumbnail = !!idea.thumbnail && idea.thumbnail.trim().length > 0;
  
  const completed = [
    title, description, youtube, tiktok, instagram, script, shotlist, thumbnail
  ].filter(Boolean).length;
  
  const percent = Math.round((completed / 8) * 100);
  
  return {
    title,
    description,
    youtube,
    tiktok,
    instagram,
    script,
    shotlist,
    thumbnail,
    percent,
  };
}

/**
 * Get done ideas with their records
 */
export function useDoneIdeas(): { idea: Idea | undefined; record: DoneRecord }[] {
  const currentWorkspaceId = useAppStore(state => state.currentWorkspaceId);
  const ideas = useAppStore(state => state.ideas || []);
  const done = useAppStore(state => state.done || {});
  
  // Get all done records, optionally filtered by workspace
  const records = Object.values(done)
    .filter(record => !record.workspaceId || record.workspaceId === currentWorkspaceId)
    .sort((a, b) => b.movedAt - a.movedAt); // Newest first
  
  return records.map(record => ({
    idea: ideas.find(i => i.id === record.id),
    record,
  }));
}

/**
 * Get active workspace's grid
 */
export function useActiveGrid(): GridState {
  const currentWorkspaceId = useAppStore(state => state.currentWorkspaceId);
  const gridsByWorkspace = useAppStore(state => state.gridsByWorkspace ?? {});
  
  return gridsByWorkspace[currentWorkspaceId] ?? initGrid1x3();
}
