import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Award } from 'lucide-react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { AchievementGrid } from '../components/gamification/AchievementGrid';
import { userService } from '../services/user.service';
import type { AchievementView } from '../types';

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<AchievementView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    userService.getAchievements('en')
      .then(setAchievements)
      .catch(() => setError('Could not load your achievements. Please try again later.'))
      .finally(() => setLoading(false));
  }, []);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const pct = achievements.length ? Math.round((unlockedCount / achievements.length) * 100) : 0;

  return (
    <PageWrapper title="Achievements" description="Unlock server-verified milestones as you practice, test, and level up." icon={Award} dotGrid>
      <Link
        to="/progress"
        className="inline-flex items-center gap-1.5 text-sm font-semibold mb-6 transition-colors hover:opacity-80"
        style={{ color: 'var(--color-accent-text)' }}
      >
        <ArrowLeft size={15} /> Back to My Progress
      </Link>

      {error && <div className="card p-8 text-center text-[var(--color-error)] text-sm">{error}</div>}

      {loading && !error && <div className="card p-12 text-center text-muted text-sm">Loading your achievements…</div>}

      {!loading && !error && (
        <>
          {/* Summary */}
          <div className="card p-6 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Achievement Progress</h2>
              <p className="text-sm text-secondary mt-1">Unlock server-verified milestones as you practice, test, and level up.</p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-2xl font-extrabold tabular-nums" style={{ color: 'var(--color-accent-text)' }}>
                {unlockedCount} of {achievements.length} unlocked
              </div>
              <p className="text-xs text-muted mt-0.5">{pct}% complete</p>
            </div>
          </div>

          {/* Badge grid */}
          <AchievementGrid achievements={achievements} />
        </>
      )}
    </PageWrapper>
  );
}