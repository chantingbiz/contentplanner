import { NavLink, Routes, Route, Navigate } from "react-router-dom";
import Brainstorming from "./pages/Brainstorming";
import Working from "./pages/Working";
import Done from "./pages/Done";
import Settings from "./pages/Settings";
import ThemeProvider from "./theme/ThemeProvider";
import WorkspaceSwitcher from "./components/WorkspaceSwitcher";

export default function App() {
  const linkBase =
    "px-3 py-2 rounded text-sm hover:bg-white/10 transition-colors";
  const linkActive = "bg-white/10";

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-[#0b0c0f] text-white">
        {/* Top nav */}
        <header className="border-b border-white/10 relative">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
            <div className="font-semibold">Content Planner</div>
            
            {/* Workspace Switcher with Avatar */}
            <WorkspaceSwitcher />
            
            <nav className="flex items-center gap-2 ml-auto">
            <NavLink
              to="/brainstorming"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : ""}`
              }
            >
              Brainstorming
            </NavLink>
            <NavLink
              to="/working"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : ""}`
              }
            >
              Working Ideas
            </NavLink>
            <NavLink
              to="/done"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : ""}`
              }
            >
              Done
            </NavLink>
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : ""}`
              }
            >
              Settings
            </NavLink>
          </nav>
        </div>
        
        {/* Animated brand gradient strip */}
        <div className="brand-gradient-strip" aria-hidden="true" />
      </header>

      {/* Routes */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Navigate to="/working" replace />} />
          <Route path="/brainstorming" element={<Brainstorming />} />
          <Route path="/working" element={<Working />} />
          <Route path="/done" element={<Done />} />
          <Route path="/settings" element={<Settings />} />
          {/* Legacy redirects */}
          <Route path="/ideas" element={<Navigate to="/brainstorming" replace />} />
          <Route path="/workboard" element={<Navigate to="/brainstorming" replace />} />
          <Route path="/scheduler" element={<Navigate to="/working" replace />} />
          <Route path="*" element={<Navigate to="/working" replace />} />
        </Routes>
      </main>
    </div>
    </ThemeProvider>
  );
}
