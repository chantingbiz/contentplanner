export default function Workboard() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Workboard</h1>
      <p className="text-white/70">
        Kanban and post workflow will go here. (Stub page)
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {["Scripting", "Pre-Prod", "Shooting"].map((col) => (
          <div key={col} className="bg-white/5 rounded p-4 border border-white/10">
            <div className="font-medium mb-2">{col}</div>
            <div className="text-sm text-white/60">No cards yet.</div>
          </div>
        ))}
      </div>
    </div>
  );
}
