import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../../utils/cn';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  accentColor?: string;
  /** Distinct pastel icon-circle tone (highlight-strip pattern). */
  tone?: 'indigo' | 'green' | 'amber' | 'violet';
  className?: string;
}

const TONES: Record<NonNullable<StatCardProps['tone']>, { bg: string; fg: string }> = {
  indigo: { bg: 'rgba(67, 97, 238, 0.12)', fg: '#4361ee' },
  green: { bg: 'rgba(34, 197, 94, 0.14)', fg: '#16a34a' },
  amber: { bg: 'rgba(245, 158, 11, 0.18)', fg: '#d97706' },
  violet: { bg: 'rgba(139, 92, 246, 0.14)', fg: '#7c3aed' },
};

export function StatCard({
  label,
  value,
  subtext,
  icon: Icon,
  trend,
  accentColor,
  tone = 'indigo',
  className,
}: StatCardProps) {
  const TrendIcon =
    trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  const trendColor =
    trend === 'up'
      ? 'var(--color-correct)'
      : trend === 'down'
      ? 'var(--color-error)'
      : 'var(--color-text-muted)';

  const circle: React.CSSProperties = accentColor
    ? { backgroundColor: `${accentColor}1F`, color: accentColor }
    : { backgroundColor: TONES[tone].bg, color: TONES[tone].fg };

  return (
    <div className={cn('card p-6', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>
            {label}
          </p>
          <p
            className="text-3xl font-bold tracking-tight truncate"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {value}
          </p>
          {subtext && (
            <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: trendColor }}>
              {trend && <TrendIcon size={12} />}
              {subtext}
            </p>
          )}
        </div>
        {/* Pastel icon circle — consistent with the highlight-strip pattern */}
        {Icon && (
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ml-4"
            style={circle}
          >
            <Icon size={20} />
          </div>
        )}
      </div>
    </div>
  );
}
