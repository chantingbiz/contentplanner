# Content Grid Web

A content planning and scheduling tool for managing short-form video ideas across multiple workspaces with cloud backup and cross-device sync.

## Features

- **Multi-workspace support**: Separate content streams for different brands/personas
- **Planning Grid**: Drag-and-drop 9:16 vertical tiles for visual scheduling
- **Idea pipeline**: Brainstorming → Working Ideas → Done
- **Cloud backup**: Automatic Supabase backup with cross-device sync
- **Mobile-first**: Full responsive design with touch-friendly interactions
- **Offline-first**: localStorage primary, cloud is a mirror

## Cloud Backup & Sync

### Setup

1. **Environment Variables**

Create a `.env.local` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

2. **Supabase Table**

Create the `backups` table in your Supabase project:

```sql
CREATE TABLE backups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace text NOT NULL UNIQUE,
  data jsonb NOT NULL,
  version int DEFAULT 1,
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX idx_backups_workspace ON backups(workspace);
```

### Features

- **Auto-backup**: Debounced saves (2.5s) with 10s max-wait guarantee
- **Manual backup**: "Backup Now" button in Settings
- **Pull Latest**: Fetch cloud state manually (confirms if you have local changes)
- **Auto-Sync** (default ON): Polls every 30s and auto-pulls if cloud is newer
- **Safety flushes**: Saves on tab hide, browser close, and 60s watchdog

### How It Works

- **localStorage is primary**: All data lives in localStorage first
- **Supabase is the mirror**: Cloud row updated after local changes
- **Per-workspace**: Each workspace (@MotherboardSmoke, @StephenJoking) has its own backup row
- **Case-insensitive keys**: Workspace names normalized (trim + lowercase)
- **Cross-device sync**: Device A saves → Device B auto-pulls within ~30s

### Deployment (Netlify)

Set environment variables in **Site Settings → Build & Deploy → Environment**:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

The app includes `public/_redirects` for SPA routing support.

## Development

### Tech Stack

- **React 19** + TypeScript + Vite
- **Tailwind CSS 4** for styling
- **React Router 7** for navigation
- **@dnd-kit** for drag-and-drop
- **Supabase** for cloud backup
- **localStorage** for primary persistence

### Scripts

```bash
npm install        # Install dependencies
npm run dev        # Start dev server
npm run build      # Build for production
npm run preview    # Preview production build
```

## React + Vite

This project uses Vite with HMR and React Fast Refresh.

Plugins available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
