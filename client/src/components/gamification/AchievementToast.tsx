import React, { useEffect, useRef } from 'react';
import type { Achievement } from '../../types';
import { Badge } from '../ui/Badge';
import { X } from 'lucide-react';

interface AchievementToastProps {
  achievements: Achievement[];
  onClose: () => void;
}

const rarityVariant = {
  common: 'common' as const,
  rare: 'rare' as const,
  epic: 'epic' as const,
  legendary: 'legendary' as const,
};

export function AchievementToast({ achievements, onClose }: AchievementToastProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    timerRef.current = setTimeout(onClose, 5000);
    return () => clearTimeout(timerRef.current);
  }, [onClose]);

  if (!achievements.length) return null;

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-3 pointer-events-none">
      {achievements.map((a) => (
        <div
          key={a._id}
          className="card p-4 w-72 pointer-events-auto toast-enter flex items-start gap-3"
          style={{
            boxShadow: '0 8px 32px rgba(0,0,0,0.16)',
            borderLeft: '4px solid var(--color-accent)',
          }}
        >
          <div className="text-2xl flex-shrink-0">{a.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-sm font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>
                Achievement Unlocked!
              </p>
              <Badge variant={rarityVariant[a.rarity]}>{a.rarity}</Badge>
            </div>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-accent-text)' }}>
              {a.name}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              {a.description}
            </p>
            <p className="text-xs mt-1 font-semibold" style={{ color: 'var(--color-correct)' }}>
              +{a.xpReward} XP
            </p>
          </div>
          <button onClick={onClose} className="flex-shrink-0 p-0.5" aria-label="Dismiss">
            <X size={14} style={{ color: 'var(--color-text-muted)' }} />
          </button>
        </div>
      ))}
    </div>
  );
}
