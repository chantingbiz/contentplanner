import { useEffect, useState, type ReactNode } from 'react';
import { useAppStore } from '../store';
import {
  extractPaletteFromImage,
  paletteToVars,
  getCachedPalette,
  cachePalette,
  getFallbackPalette,
  type ColorPalette,
  type ThemeVars,
} from './palette';

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * ThemeProvider - Watches workspace changes and applies branded CSS variables
 * 
 * - Extracts colors from workspace vibe images
 * - Caches extracted palettes in localStorage
 * - Falls back to static palettes during load or on error
 * - Never blocks initial render
 */
export default function ThemeProvider({ children }: ThemeProviderProps) {
  const currentWorkspaceId = useAppStore(state => state.currentWorkspaceId);
  const workspaces = useAppStore(state => state.workspaces);

  useEffect(() => {
    // Find current workspace config
    const workspace = workspaces.find(w => w.id === currentWorkspaceId);
    if (!workspace) {
      console.warn('[Theme] Workspace not found:', currentWorkspaceId);
      applyThemeVars(paletteToVars(getFallbackPalette(currentWorkspaceId)));
      return;
    }

    // Check cache first
    const cached = getCachedPalette(currentWorkspaceId);
    if (cached) {
      applyThemeVars(paletteToVars(cached));
      return;
    }

    // Apply fallback immediately (non-blocking)
    applyThemeVars(paletteToVars(getFallbackPalette(currentWorkspaceId)));

    // Extract palette asynchronously
    const vibeUrl = (workspace as any).vibe;
    if (!vibeUrl) {
      console.warn('[Theme] No vibe image for workspace:', currentWorkspaceId);
      return;
    }

    // Use requestIdleCallback if available for non-blocking extraction
    const extractTask = async () => {
      try {
        const palette = await extractPaletteFromImage(vibeUrl);
        
        if (palette) {
          // Cache the extracted palette
          cachePalette(currentWorkspaceId, palette);
          
          // Apply the extracted theme
          applyThemeVars(paletteToVars(palette));
        } else {
          // Extraction failed, keep fallback
          const fallback = getFallbackPalette(currentWorkspaceId);
          cachePalette(currentWorkspaceId, fallback);
        }
      } catch (error) {
        console.error('[Theme] Extraction failed:', error);
      }
    };

    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => {
        extractTask();
      }, { timeout: 2000 });
    } else {
      // Fallback: use setTimeout with delay
      setTimeout(extractTask, 100);
    }
  }, [currentWorkspaceId, workspaces]);

  return <>{children}</>;
}

/**
 * Apply theme CSS variables to document root
 */
function applyThemeVars(vars: ThemeVars): void {
  const root = document.documentElement;
  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}

/**
 * Hook to access current theme data
 * Returns workspace info, URLs, and derived palette
 */
export function useStoreTheme() {
  const currentWorkspaceId = useAppStore(state => state.currentWorkspaceId);
  const workspaces = useAppStore(state => state.workspaces);
  
  const workspace = workspaces.find(w => w.id === currentWorkspaceId);
  
  const [palette, setPalette] = useState<ColorPalette>(() => {
    return getCachedPalette(currentWorkspaceId) || getFallbackPalette(currentWorkspaceId);
  });

  useEffect(() => {
    const cached = getCachedPalette(currentWorkspaceId);
    if (cached) {
      setPalette(cached);
    } else {
      setPalette(getFallbackPalette(currentWorkspaceId));
    }
  }, [currentWorkspaceId]);

  return {
    workspaceId: currentWorkspaceId,
    workspace: workspace,
    avatarUrl: (workspace as any)?.avatar || null,
    vibeUrl: (workspace as any)?.vibe || null,
    palette,
    vars: paletteToVars(palette),
  };
}

