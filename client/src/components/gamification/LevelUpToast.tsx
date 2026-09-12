import React, { useEffect, useRef } from 'react';
import { useTypingStore } from '../../store/typingStore';
import { Sparkles, X } from 'lucide-react';
import { Badge } from '../ui/Badge';

/**
 * Level-up notification. Rendered only after a session's server response
 * arrives, so it never interrupts an active typing session.
 */
export function LevelUpToast() {
  const { leveledUp, level, levelTitle, xpEarned, clearLevelUp } = useTypingStore();
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!leveledUp) return;
    timerRef.current = setTimeout(clearLevelUp, 6000);
    return () => clearTimeout(timerRef.current);
  }, [leveledUp, clearLevelUp]);

  if (!leveledUp) return null;

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 levelup-pop" style={{ width: 'min(92vw, 23.75rem)' }}>
      <div
        className="card p-5 text-center relative pointer-events-auto"
        style={{
          boxShadow: '0 12px 48px rgba(67,97,238,0.25)',
          borderColor: 'var(--color-accent)',
          borderWidth: '1.5px',
        }}
      >
        <button
          onClick={clearLevelUp}
          className="absolute top-3 right-3 p-1"
          aria-label="Dismiss"
        >
          <X size={14} style={{ color: 'var(--color-text-muted)' }} />
        </button>

        <div
          className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
          style={{
            background: 'linear-gradient(135deg, #4361ee, #6a8bff)',
            color: '#fff',
          }}
        >
          <Sparkles size={26} />
        </div>

        <Badge variant="accent">Level Up!</Badge>

        <h2 className="text-lg font-bold mt-2" style={{ color: 'var(--color-text-primary)' }}>
          Level {level} · {levelTitle}
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
          {xpEarned > 0 ? `You earned +${xpEarned} XP this session.` : 'You reached a new level.'}
        </p>
      </div>
    </div>
  );
}