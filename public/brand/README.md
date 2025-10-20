# Brand Assets

This directory contains workspace branding assets (avatars and vibe images).

## Required Images

### @MotherboardSmoke (`mobo/`)
- **avatar.png** - Workspace avatar (recommended: 256x256px, square)
- **vibe.png** - Theme color source image (any size, will be sampled for colors)
  - Color mood: deep amber, warm smoke, metallic highlights
  - Keywords: futuristic / industrial / tech / smoldering yellow-orange

### @StephenJoking (`stephen/`)
- **avatar.png** - Workspace avatar (recommended: 256x256px, square)
- **vibe.png** - Theme color source image (any size, will be sampled for colors)
  - Color mood: magenta, violet, electric blue
  - Keywords: playful / comedian / studio light / bold gradient

## Color Extraction

The `vibe.png` images are used to extract dominant colors for theming:
- Colors are sampled from a 64x64 downscaled version (fast)
- Extracted palettes are cached in localStorage as `theme::<workspaceId>`
- Fallback to static colors if image is missing or fails to load

## Fallback Behavior

If images are missing, the app will:
- Use initials from workspace name for avatar placeholder
- Use predefined color palettes for theming
- Continue to function normally

## Image Specifications

- **Format**: PNG (with transparency support)
- **Avatar size**: 256x256px (square, will be displayed as circle)
- **Vibe size**: Any size (will be downscaled for color extraction)
- **File size**: Keep under 200KB each for fast loading





