import { NavLink, Routes, Route, Navigate } from "react-router-dom";
import Brainstorming from "./pages/Brainstorming";
import Working from "./pages/Working";
import Done from "./pages/Done";
import Settings from "./pages/Settings";
import ThemeProvider from "./theme/ThemeProvider";
import WorkspaceSwitcher from "./components/WorkspaceSwitcher";

export default function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-[#0b0c0f] text-white">
        {/* Top nav */}
        <header className="sticky top-0 z-40 bg-[#0b0c0f]/90 backdrop-blur border-b border-white/10 safe-y">
          <div className="mx-auto w-full max-w-6xl px-3 sm:px-4">
            {/* Top row: brand + workspace */}
            <div className="flex items-center justify-between py-2">
              <div className="text-sm sm:text-base font-semibold">Content Planner</div>
              <WorkspaceSwitcher />
            </div>

            {/* Nav row: responsive horizontal scroll */}
            <nav
              className="relative -mx-3 px-3 pb-2 sm:pb-3"
              aria-label="Primary navigation"
            >
              <div
                className="
                  flex gap-2 sm:gap-3
                  overflow-x-auto overscroll-x-contain
                  snap-x snap-mandatory
                  scrollbar-thin scrollbar-thumb-gray-700/60
                  md:overflow-x-visible
                  md:flex-wrap md:snap-none
                "
              >
                <NavLink
                  to="/brainstorming"
                  className={({ isActive }) =>
                    [
                      "snap-start shrink-0",
                      "px-3 py-2 rounded-md border",
                      "min-h-[44px] text-xs sm:text-sm flex items-center",
                      isActive
                        ? "border-amber-500/60 bg-amber-500/10 text-amber-300"
                        : "border-white/10 bg-white/5 hover:bg-white/10 text-gray-200"
                    ].join(" ")
                  }
                >
                  Brainstorming
                </NavLink>
                <NavLink
                  to="/working"
                  className={({ isActive }) =>
                    [
                      "snap-start shrink-0",
                      "px-3 py-2 rounded-md border",
                      "min-h-[44px] text-xs sm:text-sm flex items-center",
                      isActive
                        ? "border-amber-500/60 bg-amber-500/10 text-amber-300"
                        : "border-white/10 bg-white/5 hover:bg-white/10 text-gray-200"
                    ].join(" ")
                  }
                >
                  Working Ideas
                </NavLink>
                <NavLink
                  to="/done"
                  className={({ isActive }) =>
                    [
                      "snap-start shrink-0",
                      "px-3 py-2 rounded-md border",
                      "min-h-[44px] text-xs sm:text-sm flex items-center",
                      isActive
                        ? "border-amber-500/60 bg-amber-500/10 text-amber-300"
                        : "border-white/10 bg-white/5 hover:bg-white/10 text-gray-200"
                    ].join(" ")
                  }
                >
                  Done
                </NavLink>
                <NavLink
                  to="/settings"
                  className={({ isActive }) =>
                    [
                      "snap-start shrink-0",
                      "px-3 py-2 rounded-md border",
                      "min-h-[44px] text-xs sm:text-sm flex items-center",
                      isActive
                        ? "border-amber-500/60 bg-amber-500/10 text-amber-300"
                        : "border-white/10 bg-white/5 hover:bg-white/10 text-gray-200"
                    ].join(" ")
                  }
                >
                  Settings
                </NavLink>
              </div>
            </nav>
          </div>
        
          {/* Animated brand gradient strip */}
          <div className="brand-gradient-strip" aria-hidden="true" />
        </header>

      {/* Routes */}
      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 overscroll-contain">
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
