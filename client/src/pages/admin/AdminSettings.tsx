import React, { useEffect, useState } from 'react';
import { getPlatformSettings, updatePlatformSettings } from '../../services/admin.service';
import type { PlatformSettings } from '../../types';
import { AdminPage, Field, FlashMessages, inputCls, inputStyle } from '../../components/admin/ui';

export default function AdminSettings() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [defaults, setDefaults] = useState<Partial<PlatformSettings>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    getPlatformSettings()
      .then(({ settings, defaults }) => {
        setSettings(settings);
        setDefaults(defaults ?? {});
      })
      .catch(() => setFlash({ type: 'error', text: 'Failed to load settings.' }))
      .finally(() => setLoading(false));
  }, []);

  const set = (key: keyof PlatformSettings, value: number) =>
    setSettings((s) => (s ? { ...s, [key]: value } : s));

  const save = async () => {
    if (!settings) return;
    setBusy(true);
    try {
      const res = await updatePlatformSettings({
        'leaderboard.minAccuracy': settings['leaderboard.minAccuracy'],
        'leaderboard.topLimit': settings['leaderboard.topLimit'],
        'certificate.durationSeconds': settings['certificate.durationSeconds'] ?? 60,
      });
      setSettings(res.settings);
      setFlash({ type: 'success', text: 'Settings saved.' });
    } catch (err: any) {
      setFlash({ type: 'error', text: err?.response?.data?.error ?? 'Failed to save settings.' });
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <AdminPage title="Settings"><div className="py-10 text-center text-sm text-secondary animate-pulse">Loading…</div></AdminPage>;
  }

  return (
    <AdminPage title="Settings" description="Platform configuration. Changes apply immediately and do not require a code change.">
      <FlashMessages
        success={flash?.type === 'success' ? flash.text : null}
        error={flash?.type === 'error' ? flash.text : null}
        onDismiss={() => setFlash(null)}
      />

      <div className="card p-6 max-w-xl">
        <h3 className="font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
          Leaderboard eligibility
        </h3>
        <p className="text-xs mb-5" style={{ color: 'var(--color-text-muted)' }}>
          Only saved results at or above the minimum accuracy appear on the leaderboard.
        </p>
        <div className="space-y-5">
          <Field
            label="Minimum accuracy (%)"
            hint={defaults['leaderboard.minAccuracy'] !== undefined ? `Default: ${defaults['leaderboard.minAccuracy']}` : undefined}
          >
            <input
              data-testid="settings-accuracy"
              type="number"
              min={60}
              max={100}
              className={inputCls}
              style={inputStyle}
              value={settings?.['leaderboard.minAccuracy'] ?? 90}
              onChange={(e) => set('leaderboard.minAccuracy', Number(e.target.value))}
            />
          </Field>
          <Field
            label="Max entries shown"
            hint={defaults['leaderboard.topLimit'] !== undefined ? `Default: ${defaults['leaderboard.topLimit']}` : undefined}
          >
            <input
              data-testid="settings-toplimit"
              type="number"
              min={10}
              max={200}
              className={inputCls}
              style={inputStyle}
              value={settings?.['leaderboard.topLimit'] ?? 50}
              onChange={(e) => set('leaderboard.topLimit', Number(e.target.value))}
            />
          </Field>
        </div>
        <div className="flex justify-end mt-6">
          <button data-testid="settings-save" onClick={() => void save()} className="btn btn-primary px-5 py-2" disabled={busy}>
            Save Settings
          </button>
        </div>
      </div>

      <div className="card p-6 max-w-xl mt-6">
        <h3 className="font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
          Certificate test
        </h3>
        <p className="text-xs mb-5" style={{ color: 'var(--color-text-muted)' }}>
          Fixed duration of the open-access certificate typing test on the homepage.
        </p>
        <div className="space-y-5">
          <Field
            label="Test duration (seconds)"
            hint={defaults['certificate.durationSeconds'] !== undefined ? `Default: ${defaults['certificate.durationSeconds']}` : 'Default: 60'}
          >
            <input
              data-testid="settings-cert-duration"
              type="number"
              min={30}
              max={900}
              step={30}
              className={inputCls}
              style={inputStyle}
              value={settings?.['certificate.durationSeconds'] ?? 60}
              onChange={(e) => set('certificate.durationSeconds', Number(e.target.value))}
            />
          </Field>
        </div>
        <div className="flex justify-end mt-6">
          <button onClick={() => void save()} className="btn btn-primary px-5 py-2" disabled={busy}>
            Save Settings
          </button>
        </div>
      </div>
    </AdminPage>
  );
}