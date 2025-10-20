/**
 * Minimal monitor bar so routing works even if store is missing.
 * You can hook in real counts later.
 */
export default function MonitorBar() {
  return (
    <div className="text-xs text-white/70 bg-black/20 border-t border-white/10 safe-y">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2">
        Planned Out: <span className="font-semibold">0</span>
        <span className="mx-3 opacity-40">|</span>
        Next open date: <span className="font-semibold">—</span>
      </div>
    </div>
  );
}
