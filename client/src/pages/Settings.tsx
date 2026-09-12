import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Settings as SettingsIcon, Check } from 'lucide-react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { useAuthStore } from '../store/authStore';
import { userService } from '../services/user.service';

/**
 * Account typing preferences. Persists through the existing settings API and
 * mirrors into the auth store so the rest of the app picks changes up live.
 */
export default function Settings() {
  const { settings, setSettings } = useAuthStore();
  const [fontSize, setFontSize] = useState(settings?.fontSize ?? 22);
  const [includeNumbers, setIncludeNumbers] = useState(settings?.includeNumbers ?? false);
  const [includePunctuation, setIncludePunctuation] = useState(settings?.includePunctuation ?? false);
  const [soundEnabled, setSoundEnabled] = useState(settings?.soundEnabled ?? false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    setSaved(false);
    try {
      const next = await userService.updateSettings({ fontSize, includeNumbers, includePunctuation, soundEnabled });
      setSettings(next);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const toggles: { label: string; hint: string; value: boolean; set: (v: boolean) => void }[] = [
    { label: 'Include numbers', hint: 'Add digits to generated test text', value: includeNumbers, set: setIncludeNumbers },
    { label: 'Include punctuation', hint: 'Add punctuation marks to test text', value: includePunctuation, set: setIncludePunctuation },
    { label: 'Keypress sound', hint: 'Play a subtle click while typing', value: soundEnabled, set: setSoundEnabled },
  ];

  return (
    <PageWrapper title="Settings" description="Tune your typing experience." icon={SettingsIcon}>
      <div className="max-w-2xl mx-auto flex flex-col gap-4">
        <div className="card p-6">
          <h2 className="font-bold mb-4">Typing preferences</h2>

          <label className="block text-sm font-semibold mb-1.5">Text size</label>
          <select
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="input-base w-full sm:w-56 mb-5"
          >
            {[18, 20, 22, 26, 30].map((size) => (
              <option key={size} value={size}>{size}px</option>
            ))}
          </select>

          <div className="flex flex-col gap-3">
            {toggles.map(({ label, hint, value, set }) => (
              <button
                key={label}
                type="button"
                role="switch"
                aria-checked={value}
                onClick={() => set(!value)}
                className="flex items-center justify-between text-left p-3 rounded-xl border transition-colors"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <span>
                  <b className="block text-sm">{label}</b>
                  <span className="text-xs text-secondary">{hint}</span>
                </span>
                <span
                  className="w-10 h-6 rounded-full relative transition-colors flex-shrink-0"
                  style={{ backgroundColor: value ? 'var(--color-accent)' : 'var(--color-border)' }}
                >
                  <span
                    className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
                    style={{ left: value ? '1.125rem' : '0.125rem' }}
                  />
                </span>
              </button>
            ))}
          </div>

          <button onClick={() => void save()} disabled={saving || !settings} className="btn btn-primary px-5 py-2 mt-5">
            {saved ? <><Check size={16} /> Saved</> : saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>

        <p className="text-sm text-secondary px-1">
          Avatar, display name and password can be changed from{' '}
          <Link to={`/profile/${useAuthStore.getState().user?._id ?? ''}`} className="font-semibold" style={{ color: 'var(--color-accent-text)' }}>
            your profile page
          </Link>.
        </p>
      </div>
    </PageWrapper>
  );
}
