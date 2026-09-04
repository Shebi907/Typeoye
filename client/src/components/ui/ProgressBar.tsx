import React, { useState } from 'react';
import { cn } from '../../utils/cn';

interface ProgressBarProps {
  value: number; // 0–100
  color?: 'accent' | 'correct' | 'error' | 'warning';
  size?: 'sm' | 'md';
  className?: string;
  showLabel?: boolean;
}

const colorMap = {
  accent:  'var(--color-accent)',
  correct: 'var(--color-correct)',
  error:   'var(--color-error)',
  warning: '#f59e0b',
};

export function ProgressBar({
  value,
  color = 'accent',
  size = 'md',
  className,
  showLabel = false,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
          <span>Progress</span>
          <span>{pct.toFixed(0)}%</span>
        </div>
      )}
      <div
        className={cn(
          'w-full rounded-full overflow-hidden',
          size === 'sm' ? 'h-1.5' : 'h-2.5'
        )}
        style={{ backgroundColor: 'var(--color-border)' }}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%`, backgroundColor: colorMap[color] }}
        />
      </div>
    </div>
  );
}

// ── Tooltip (lightweight, pure CSS-driven) ──────────────────────────
interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom';
}

export function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span
          className={cn(
            'absolute z-50 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium text-white pointer-events-none animate-fade-in',
            position === 'top'
              ? 'bottom-full mb-2 left-1/2 -translate-x-1/2'
              : 'top-full mt-2 left-1/2 -translate-x-1/2'
          )}
          style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
        >
          {content}
        </span>
      )}
    </span>
  );
}
