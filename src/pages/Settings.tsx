import HashtagDefaultsPanel from '../components/settings/HashtagDefaultsPanel';

export default function Settings() {
  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">Settings</h1>
        <p className="text-sm sm:text-base text-white/60">
          Configure your application preferences and defaults.
        </p>
      </div>

      <HashtagDefaultsPanel />
    </div>
  );
}


