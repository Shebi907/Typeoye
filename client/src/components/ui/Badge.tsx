import React from 'react';
import { cn } from '../../utils/cn';

type Variant = 'default' | 'accent' | 'success' | 'warning' | 'error' | 'common' | 'rare' | 'epic' | 'legendary';

interface BadgeProps {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}

const variantStyles: Record<Variant, string> = {
  default:    'bg-[var(--color-border)] text-[var(--color-text-secondary)]',
  accent:     'bg-[var(--color-accent-light)] text-[var(--color-accent-text)]',
  success:    'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  warning:    'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  error:      'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
  common:     'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  rare:       'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  epic:       'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
  legendary:  'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
