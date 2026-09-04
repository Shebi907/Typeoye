import React, { useEffect, useState } from 'react';
import { CheckCircle2, Lock } from 'lucide-react';
import { userService } from '../../services/user.service';
import type { AchievementView } from '../../types';

export function AchievementsGrid() {
  const [achievements, setAchievements] = useState<AchievementView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userService.getAchievements()
      .then(setAchievements)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="card p-12 text-center text-muted">Loading achievements...</div>;

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const pct = achievements.length ? Math.round((unlockedCount / achievements.length) * 100) : 0;

  return (
    <div>
      <div className="card p-6 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold">Achievement Progress</h3>
          <p className="text-sm text-secondary mt-1">Unlock server-verified milestones as you practice, test, and level up.</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-[var(--color-accent-text)]">{unlockedCount} / {achievements.length}</div>
          <p className="text-xs text-muted">{pct}% completed</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievements.map((item) => {
          const unlocked = item.unlocked;
          const threshold = item.condition.threshold;
          const progressPct = unlocked ? 100 : Math.min(100, Math.round((item.progress / threshold) * 100));
          return (
            <div
              key={item._id}
              className={`card p-5 flex items-start gap-4 transition-all ${unlocked ? 'border-[var(--color-accent)] shadow-md' : 'opacity-50 grayscale bg-[var(--color-page)]'}`}
            >
              <div className="text-3xl p-2 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] flex items-center justify-center shrink-0 relative">
                {item.icon}
                {!unlocked && (
                  <div className="absolute -top-1 -right-1 bg-black/60 text-white rounded-full p-1">
                    <Lock size={12} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className="font-bold text-base truncate">{item.name}</h4>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                    item.rarity === 'legendary' ? 'bg-amber-500/10 text-amber-600 dark:bg-amber-400/15 dark:text-amber-300' :
                    item.rarity === 'epic' ? 'bg-purple-500/10 text-purple-600 dark:bg-purple-400/15 dark:text-purple-300' :
                    item.rarity === 'rare' ? 'bg-blue-500/10 text-blue-600 dark:bg-blue-400/15 dark:text-blue-300' :
                    'bg-gray-500/10 text-gray-600 dark:bg-gray-400/15 dark:text-gray-300'
                  }`}>
                    {item.rarity}
                  </span>
                </div>
                <p className="text-xs text-secondary mb-2">{item.description}</p>
                {!unlocked && (
                  <div className="h-1 rounded-full bg-[var(--color-border)] mb-2">
                    <div
                      className="h-full rounded-full bg-[var(--color-accent)]"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                )}
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[var(--color-accent-text)]">+{item.xpReward} XP</span>
                  {unlocked ? (
                    <span className="text-[var(--color-correct)] flex items-center gap-1 font-medium">
                      <CheckCircle2 size={12} /> Unlocked
                    </span>
                  ) : (
                    <span className="text-muted">
                      {item.progress} / {threshold}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}