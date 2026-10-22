import { useEffect, useState } from 'react';
import { AchievementGrid } from './AchievementGrid';
import { userService } from '../../services/user.service';
import type { AchievementView } from '../../types';

/**
 * Self-loading achievements panel for a single course. The `language` prop
 * decides which achievement set is fetched, so embedding it on the English
 * progress page shows English achievements and on the Urdu page shows Urdu
 * achievements — the two never mix.
 */
export function AchievementsPanel({ language }: { language: 'en' | 'ur' }) {
  const [achievements, setAchievements] = useState<AchievementView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    userService
      .getAchievements(language)
      .then((list) => { if (alive) setAchievements(list); })
      .catch(() => { if (alive) setError('Could not load achievements. Please try again later.'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [language]);

  if (error) {
    return <div className="card p-8 text-center text-[var(--color-error)] text-sm">{error}</div>;
  }
  if (loading) {
    return <div className="card p-12 text-center text-muted text-sm">Loading achievements…</div>;
  }

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const pct = achievements.length ? Math.round((unlockedCount / achievements.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Achievement Progress</h2>
          <p className="text-sm text-secondary mt-1">Unlock server-verified milestones as you practice, test, and level up.</p>
        </div>
        <div className="text-left sm:text-right sm:shrink-0 min-w-0">
          <div className="text-xl sm:text-2xl font-extrabold tabular-nums" style={{ color: 'var(--color-accent-text)' }}>
            {unlockedCount} of {achievements.length} unlocked
          </div>
          <p className="text-xs text-muted mt-0.5">{pct}% complete</p>
        </div>
      </div>

      <AchievementGrid achievements={achievements} />
    </div>
  );
}
