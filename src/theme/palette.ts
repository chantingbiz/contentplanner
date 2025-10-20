/**
 * Color Palette Extraction & Theme Generation
 * 
 * Extracts dominant colors from workspace vibe images and generates CSS variables.
 * Uses canvas API for fast pixel sampling, caches results in localStorage.
 */

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export interface ThemeVars {
  '--brand-bg': string;
  '--brand-bg-secondary': string;
  '--brand-accent': string;
  '--brand-text': string;
  '--brand-border': string;
}

// Static fallback palettes (used when images fail to load or for initial render)
const FALLBACK_PALETTES: Record<string, ColorPalette> = {
  'ws-1': {
    // @MotherboardSmoke: deep amber, warm smoke, metallic
    primary: '#ff9f1c',      // Bright amber
    secondary: '#d97706',    // Deep amber
    accent: '#fbbf24',       // Light amber/gold
    background: '#78350f',   // Dark amber brown
    text: '#fef3c7',         // Warm cream
  },
  'ws-2': {
    // @StephenJoking: magenta, violet, electric blue
    primary: '#d946ef',      // Bright magenta
    secondary: '#a855f7',    // Purple
    accent: '#3b82f6',       // Electric blue
    background: '#7e22ce',   // Deep purple
    text: '#fae8ff',         // Light lavender
  },
};

/**
 * Extract dominant colors from an image
 * Uses canvas pixel sampling on a downscaled version for performance
 */
export async function extractPaletteFromImage(imageUrl: string): Promise<ColorPalette | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    const timeout = setTimeout(() => {
      console.warn('[Palette] Image load timeout:', imageUrl);
      resolve(null);
    }, 3000);

    img.onload = () => {
      clearTimeout(timeout);
      
      try {
        // Create small canvas for fast processing (64x64)
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        if (!ctx) {
          resolve(null);
          return;
        }

        const maxSize = 64;
        const scale = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        
        // Sample every 4th pixel for speed
        const colors: { r: number; g: number; b: number; brightness: number }[] = [];
        
        for (let i = 0; i < pixels.length; i += 16) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const a = pixels[i + 3];
          
          // Skip transparent pixels
          if (a < 128) continue;
          
          const brightness = (r + g + b) / 3;
          colors.push({ r, g, b, brightness });
        }

        if (colors.length === 0) {
          resolve(null);
          return;
        }

        // Sort by brightness
        colors.sort((a, b) => b.brightness - a.brightness);

        // Extract palette
        const bright = colors[Math.floor(colors.length * 0.1)] || colors[0];
        const mid = colors[Math.floor(colors.length * 0.4)] || colors[0];
        const dark = colors[Math.floor(colors.length * 0.8)] || colors[0];
        const accent = colors[Math.floor(colors.length * 0.25)] || colors[0];

        const palette: ColorPalette = {
          primary: rgbToHex(mid.r, mid.g, mid.b),
          secondary: rgbToHex(dark.r, dark.g, dark.b),
          accent: rgbToHex(accent.r, accent.g, accent.b),
          background: rgbToHex(
            Math.floor(dark.r * 0.3),
            Math.floor(dark.g * 0.3),
            Math.floor(dark.b * 0.3)
          ),
          text: rgbToHex(bright.r, bright.g, bright.b),
        };

        resolve(palette);
      } catch (error) {
        console.error('[Palette] Extraction error:', error);
        resolve(null);
      }
    };

    img.onerror = () => {
      clearTimeout(timeout);
      console.warn('[Palette] Failed to load image:', imageUrl);
      resolve(null);
    };

    img.src = imageUrl;
  });
}

/**
 * Convert RGB to hex color
 */
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * Generate CSS custom properties from palette
 */
export function paletteToVars(palette: ColorPalette): ThemeVars {
  return {
    '--brand-bg': palette.background,
    '--brand-bg-secondary': palette.secondary,
    '--brand-accent': palette.accent,
    '--brand-text': palette.text,
    '--brand-border': palette.primary,
  };
}

/**
 * Get cached palette from localStorage
 */
export function getCachedPalette(workspaceId: string): ColorPalette | null {
  try {
    const cached = localStorage.getItem(`theme::${workspaceId}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      // Validate structure
      if (parsed.primary && parsed.secondary && parsed.accent) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn('[Palette] Cache read error:', error);
  }
  return null;
}

/**
 * Cache palette to localStorage
 */
export function cachePalette(workspaceId: string, palette: ColorPalette): void {
  try {
    localStorage.setItem(`theme::${workspaceId}`, JSON.stringify(palette));
  } catch (error) {
    console.warn('[Palette] Cache write error:', error);
  }
}

/**
 * Get fallback palette for a workspace
 */
export function getFallbackPalette(workspaceId: string): ColorPalette {
  return FALLBACK_PALETTES[workspaceId] || FALLBACK_PALETTES['ws-1'];
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}





