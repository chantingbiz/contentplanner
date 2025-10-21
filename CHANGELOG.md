# Changelog

All notable changes to this project will be documented in this file.

## v0.2.1 — Cloud backup + cross-device sync

- **Supabase backup adapter**: Auto-save with debounce (2.5s) and max-wait (10s) guarantees
- **Settings → Cloud Backup panel**: 
  - "Backup Now" button for immediate cloud backup
  - "Pull Latest" button to fetch latest cloud state
  - Auto-Sync toggle for 30s polling (ON by default)
- **Cross-device sync**: 30s polling for updates (visible tab only)
- **Safety flushes**: visibilitychange, beforeunload, 60s watchdog
- **Workspace normalization**: Case-insensitive workspace keys
- **Production log gating**: Debug logs only run in development mode
- **Environment hygiene**: .env.local properly ignored
- **Mobile optimizations**: Full mobile responsiveness maintained
- **Netlify SPA support**: Added _redirects for client-side routing

## v0.1.0 — Initial release

- Content Grid web application
- Multiple workspaces (@MotherboardSmoke, @StephenJoking)
- Brainstorming, Working Ideas, Done, Settings pages
- Planning Grid with drag-and-drop
- localStorage persistence
- Mobile-first responsive design

