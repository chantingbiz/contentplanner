import HashtagDefaultsPanel from '../components/settings/HashtagDefaultsPanel';

export default function Settings() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-white/60">
          Configure your application preferences and defaults.
        </p>
      </div>

      <HashtagDefaultsPanel />
    </div>
  );
}


