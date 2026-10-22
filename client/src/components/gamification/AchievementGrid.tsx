import { CheckCircle2, Lock } from 'lucide-react';
import type { AchievementView } from '../../types';

const RARITY_PILL: Record<AchievementView['rarity'], string> = {
  legendary: 'bg-amber-500/10 text-amber-600 dark:bg-amber-400/15 dark:text-amber-300',
  epic: 'bg-purple-500/10 text-purple-600 dark:bg-purple-400/15 dark:text-purple-300',
  rare: 'bg-blue-500/10 text-blue-600 dark:bg-blue-400/15 dark:text-blue-300',
  common: 'bg-gray-500/10 text-gray-600 dark:bg-gray-400/15 dark:text-gray-300',
};

/**
 * Shared achievement badge grid. Used by the English achievements page/tab and
 * the Urdu progress page so both courses render identical badge layouts. The
 * caller supplies the already language-scoped list — this component never
 * mixes English and Urdu achievements.
 */
export function AchievementGrid({ achievements }: { achievements: AchievementView[] }) {
  if (achievements.length === 0) {
    return (
      <div className="card p-8 text-center text-muted text-sm">
        No achievements found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {achievements.map((item) => {
        const unlocked = item.unlocked;
        const inProgress = !unlocked && item.progress > 0;
        const notStarted = !unlocked && item.progress === 0;
        const threshold = item.condition.threshold;
        const progressPct = unlocked ? 100 : Math.min(100, Math.round((item.progress / threshold) * 100));
        return (
          <div
            key={item._id}
            data-state={notStarted ? 'locked' : inProgress ? 'progress' : 'unlocked'}
            className={`card p-5 flex items-start gap-4 transition-all ${
              unlocked
                ? 'border-[var(--color-accent)] shadow-md'
                : inProgress
                  ? 'border-[var(--color-border)]'
                  : 'opacity-50 grayscale bg-[var(--color-page)]'
            }`}
          >
            <div
              className="text-2xl sm:text-3xl p-1.5 sm:p-2 rounded-xl flex items-center justify-center shrink-0 relative border"
              style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}
            >
              {item.icon}
              {notStarted && (
                <div className="absolute -top-1 -right-1 bg-black/60 text-white rounded-full p-1">
                  <Lock size={12} />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h3 className="font-bold text-sm sm:text-base truncate" style={{ color: 'var(--color-text-primary)' }}>{item.name}</h3>
                <span className={`text-[0.625rem] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${RARITY_PILL[item.rarity]}`}>
                  {item.rarity}
                </span>
              </div>
              <p className="text-xs text-secondary mb-2 line-clamp-2 sm:line-clamp-none">{item.description}</p>
              {inProgress && (
                <div className="h-1 rounded-full bg-[var(--color-border)] mb-2">
                  <div
                    className="h-full rounded-full bg-[var(--color-accent)]"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              )}
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold" style={{ color: 'var(--color-accent-text)' }}>+{item.xpReward} XP</span>
                {unlocked ? (
                  <span className="inline-flex items-center gap-1 font-medium" style={{ color: 'var(--color-correct)' }}>
                    <CheckCircle2 size={12} /> Unlocked
                  </span>
                ) : (
                  <span className="text-muted tabular-nums">{item.progress} / {threshold}</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
