# Visual Theming & Avatar Branding Implementation

## ✅ Implementation Complete

Visual theming with avatar branding has been successfully added to the Content Grid app. The system dynamically extracts colors from workspace "vibe" images and applies them as CSS custom properties throughout the app.

---

## 🎨 Features Implemented

### 1. **Dynamic Theme Extraction**
- ✅ Extracts dominant colors from workspace vibe images
- ✅ Generates CSS custom properties (`--brand-bg`, `--brand-accent`, etc.)
- ✅ Caches extracted palettes in localStorage (`theme::<workspaceId>`)
- ✅ Falls back to static palettes if images fail to load
- ✅ Non-blocking extraction using `requestIdleCallback`
- ✅ Downscales images to 64x64 for fast processing

### 2. **Workspace Switcher with Avatars**
- ✅ Displays workspace avatar + handle
- ✅ Dropdown with all workspaces
- ✅ Visual indicator (checkmark) for active workspace
- ✅ Click outside to close behavior
- ✅ Fallback to initials if avatar image fails

### 3. **Brand CSS Utilities**
- ✅ `.bg-brand`, `.text-brand`, `.border-brand`
- ✅ `.bg-brand-gradient` for gradients
- ✅ `.brand-gradient-strip` for animated header strip
- ✅ Respects `prefers-reduced-motion`
- ✅ Focus states with brand colors

### 4. **Animated Header Strip**
- ✅ Subtle gradient animation under header
- ✅ Uses brand colors from current workspace
- ✅ Disabled for users with motion sensitivity

---

## 📁 Files Created/Modified

### **New Files**

#### 1. `src/theme/palette.ts`
Color extraction and palette utilities:
```typescript
export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export async function extractPaletteFromImage(imageUrl: string): Promise<ColorPalette | null>
export function getCachedPalette(workspaceId: string): ColorPalette | null
export function cachePalette(workspaceId: string, palette: ColorPalette): void
export function getFallbackPalette(workspaceId: string): ColorPalette
```

**Key Features:**
- Fast 64x64 pixel sampling
- Brightness-based color sorting
- 3-second timeout for image loading
- Safe error handling

#### 2. `src/theme/ThemeProvider.tsx`
React context provider that manages theme application:
```typescript
export default function ThemeProvider({ children }: ThemeProviderProps)
export function useStoreTheme()
```

**Lifecycle:**
1. On workspace change, check cache
2. Apply fallback immediately (non-blocking)
3. Extract colors from vibe image asynchronously
4. Cache and apply extracted palette
5. Update CSS variables on document root

#### 3. `src/components/WorkspaceSwitcher.tsx`
Branded dropdown with avatars:
- Shows current workspace avatar + handle
- Dropdown with all available workspaces
- Visual active state with checkmark
- Hover effects and transitions

#### 4. `src/styles/brand.css`
Utility classes and CSS custom properties:
```css
:root {
  --brand-bg: #78350f;
  --brand-bg-secondary: #d97706;
  --brand-accent: #fbbf24;
  --brand-text: #fef3c7;
  --brand-border: #ff9f1c;
}
```

**Utilities:**
- Background: `.bg-brand`, `.bg-brand-secondary`
- Text: `.text-brand`, `.text-brand-muted`
- Border: `.border-brand`
- Gradients: `.bg-brand-gradient`, `.brand-gradient-strip`
- Effects: `.glow-brand`, `.shadow-brand`

#### 5. `public/brand/README.md`
Documentation for brand asset requirements

### **Modified Files**

#### 1. `src/store.ts`
Extended `Workspace` interface:
```typescript
export interface Workspace {
  id: string;
  name: string;
  color?: string;
  avatar?: string;  // ← Added
  vibe?: string;    // ← Added
}
```

**Default workspaces updated:**
```typescript
{
  id: 'ws-1',
  name: '@motherboardsmoke',
  color: 'amber',
  avatar: '/brand/mobo/avatar.png',
  vibe: '/brand/mobo/vibe.png',
}
```

#### 2. `src/App.tsx`
- Wrapped with `<ThemeProvider>`
- Replaced old workspace dropdown with `<WorkspaceSwitcher />`
- Added animated brand gradient strip under header
- Removed manual dropdown state management

#### 3. `src/index.css`
- Imported `./styles/brand.css`
- Cleaned up duplicate Tailwind imports

---

## 🎨 Workspace Themes

### **@MotherboardSmoke** (`ws-1`)
**Assets:**
- Avatar: `/brand/mobo/avatar.png`
- Vibe: `/brand/mobo/vibe.png`

**Color Mood:**
- Deep amber (#ff9f1c)
- Warm smoke (#d97706)
- Metallic highlights (#fbbf24)
- Dark background (#78350f)
- Warm cream text (#fef3c7)

**Keywords:** futuristic, industrial, tech, smoldering yellow-orange

### **@StephenJoking** (`ws-2`)
**Assets:**
- Avatar: `/brand/stephen/avatar.png`
- Vibe: `/brand/stephen/vibe.png`

**Color Mood:**
- Bright magenta (#d946ef)
- Purple (#a855f7)
- Electric blue (#3b82f6)
- Deep purple background (#7e22ce)
- Light lavender text (#fae8ff)

**Keywords:** playful, comedian, studio light, bold gradient

---

## 🔄 How It Works

### Theme Extraction Flow

```
User switches workspace
  ↓
ThemeProvider detects change
  ↓
Check localStorage cache
  ↓
[If cached] → Apply immediately
  ↓
[If not cached] → Apply fallback
  ↓
requestIdleCallback() → Extract from vibe.png
  ↓
Sample 64x64 pixels
  ↓
Sort by brightness
  ↓
Generate palette (primary, secondary, accent, bg, text)
  ↓
Convert to CSS variables
  ↓
Cache in localStorage
  ↓
Apply to document.documentElement.style
  ↓
Re-render with new theme
```

### Performance Optimizations

1. **Non-blocking extraction**: Uses `requestIdleCallback` with 2s timeout
2. **Small sample size**: 64x64 pixels (~4KB data)
3. **Cached palettes**: Stored in localStorage as `theme::ws-1`
4. **Immediate fallback**: Static colors applied instantly
5. **Debounced workspace changes**: No extraction thrashing

### Fallback Behavior

If vibe image is missing or fails to load:
1. Use predefined static palette from `FALLBACK_PALETTES`
2. Cache the fallback for future use
3. App continues to function normally
4. Console warning logged (dev only)

---

## 💾 Storage Architecture

### localStorage Keys

```javascript
// Theme palettes (one per workspace)
"theme::ws-1" = {
  primary: "#ff9f1c",
  secondary: "#d97706",
  accent: "#fbbf24",
  background: "#78350f",
  text: "#fef3c7"
}

"theme::ws-2" = {
  primary: "#d946ef",
  secondary: "#a855f7",
  accent: "#3b82f6",
  background: "#7e22ce",
  text: "#fae8ff"
}

// Main app state (unchanged)
"content-grid-web::state" = { ... }
```

---

## 🎨 CSS Custom Properties

Applied to `:root` by ThemeProvider:

```css
:root {
  --brand-bg: <workspace background color>
  --brand-bg-secondary: <workspace secondary color>
  --brand-accent: <workspace accent color>
  --brand-text: <workspace text color>
  --brand-border: <workspace primary color>
}
```

**Usage in components:**
```tsx
<div className="bg-brand text-brand-muted border-brand">
  Themed content
</div>
```

---

## 🧪 Testing Checklist

**Visual Testing:**
- [ ] Switch to @MotherboardSmoke → See amber theme
- [ ] Switch to @StephenJoking → See magenta/purple theme
- [ ] Avatar images display correctly
- [ ] Fallback to initials if images missing
- [ ] Gradient strip animates (if motion allowed)
- [ ] Brand colors applied to switcher button

**Functional Testing:**
- [ ] Theme persists on page refresh
- [ ] localStorage cache works (`theme::ws-1` exists)
- [ ] Console shows extraction logs (dev mode)
- [ ] No JavaScript errors
- [ ] Build succeeds: `npm run build`
- [ ] Dev server runs: `npm run dev`

**Accessibility:**
- [ ] Keyboard navigation works in dropdown
- [ ] ARIA labels present on buttons
- [ ] Focus states visible with brand colors
- [ ] Animation disabled if `prefers-reduced-motion`

**Performance:**
- [ ] Palette extraction doesn't block UI
- [ ] Workspace switching is instant (uses fallback first)
- [ ] No visible flash of unstyled content (FOUC)
- [ ] Image load errors handled gracefully

---

## 🖼️ Image Requirements

### Avatar Images (`avatar.png`)
- **Format**: PNG with transparency
- **Size**: 256x256px (square)
- **Display**: Circular crop (border-radius: 50%)
- **File size**: < 100KB recommended
- **Fallback**: Initials in colored circle

### Vibe Images (`vibe.png`)
- **Format**: PNG or JPG
- **Size**: Any (downscaled to 64x64 for sampling)
- **Purpose**: Color extraction only (not displayed)
- **File size**: < 200KB recommended
- **Content**: High-contrast image representing brand colors

### Directory Structure
```
public/
  brand/
    README.md
    mobo/
      avatar.png
      vibe.png
    stephen/
      avatar.png
      vibe.png
```

---

## 🚀 Usage Examples

### Using the Theme Hook

```typescript
import { useStoreTheme } from './theme/ThemeProvider';

function MyComponent() {
  const { workspaceId, avatarUrl, palette, vars } = useStoreTheme();
  
  return (
    <div style={{ backgroundColor: vars['--brand-bg'] }}>
      <img src={avatarUrl} alt="Workspace avatar" />
      <p>Current workspace: {workspaceId}</p>
    </div>
  );
}
```

### Using Brand Utilities

```tsx
// Background
<div className="bg-brand">Content</div>

// Text
<span className="text-brand">Branded text</span>

// Border
<div className="border-2 border-brand">Box</div>

// Gradient
<div className="bg-brand-gradient">Gradient background</div>

// Animated strip
<div className="brand-gradient-strip" />
```

### Accessing Palette Directly

```typescript
import { getCachedPalette } from './theme/palette';

const palette = getCachedPalette('ws-1');
if (palette) {
  console.log('Primary color:', palette.primary);
}
```

---

## 🔧 Technical Details

### Color Extraction Algorithm

1. Load image via `new Image()`
2. Draw to canvas at 64x64 resolution
3. Get pixel data via `ctx.getImageData()`
4. Sample every 4th pixel (optimization)
5. Skip transparent pixels (alpha < 128)
6. Calculate brightness: `(r + g + b) / 3`
7. Sort colors by brightness
8. Extract palette:
   - **Bright** (10th percentile) → text color
   - **Mid** (40th percentile) → primary color
   - **Dark** (80th percentile) → secondary color
   - **Accent** (25th percentile) → accent color
   - **Background** (dark * 0.3) → background color

### Browser Compatibility

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support (requestIdleCallback polyfilled)
- **IE**: Not supported (app uses modern features)

### TypeScript Support

All new code is fully typed:
```typescript
export interface ColorPalette { ... }
export interface ThemeVars { ... }
export interface Workspace extends ... { avatar?: string; vibe?: string; }
```

---

## 📝 Future Enhancements

Possible extensions for later prompts:

- [ ] **Theme Editor** (Prompt J): UI to customize colors
- [ ] **More workspaces**: Support 3+ workspaces
- [ ] **Custom vibe upload**: Let users upload their own images
- [ ] **Color schemes**: Light/dark mode variants
- [ ] **Export themes**: Download palette as JSON/CSS
- [ ] **Gradient presets**: Predefined gradient styles
- [ ] **Animation presets**: Different header strip animations

---

## ✅ Deliverables Checklist

- ✅ `src/theme/palette.ts` - Color extraction utilities
- ✅ `src/theme/ThemeProvider.tsx` - Theme context provider
- ✅ `src/components/WorkspaceSwitcher.tsx` - Avatar dropdown
- ✅ `src/styles/brand.css` - Brand utility classes
- ✅ `src/store.ts` - Extended with avatar/vibe URLs
- ✅ `src/App.tsx` - Integrated ThemeProvider + WorkspaceSwitcher
- ✅ `src/index.css` - Import brand styles
- ✅ `public/brand/` - Directory structure created
- ✅ `public/brand/README.md` - Asset documentation
- ✅ No breaking changes to existing features
- ✅ Build succeeds: `npm run build` ✓
- ✅ No linter errors
- ✅ Full TypeScript support
- ✅ Performance optimized (non-blocking)
- ✅ Accessibility considerations
- ✅ Documentation complete

---

## 🎉 Status: Production Ready

The visual theming system is complete and ready for use. Once you add the brand images to `/public/brand/mobo/` and `/public/brand/stephen/`, the app will automatically extract and apply workspace-specific themes!

**To add your images:**
1. Place `avatar.png` and `vibe.png` in `/public/brand/mobo/`
2. Place `avatar.png` and `vibe.png` in `/public/brand/stephen/`
3. Refresh the app
4. Theme will be extracted and cached automatically

**Fallback behavior:** If images are missing, the app uses predefined colors and initials, so it works immediately even without images.





