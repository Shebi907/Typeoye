import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

interface IconBadgeProps {
  icon: LucideIcon;
  /** Badge box size in px (icon scales to ~55% of it). */
  size?: number;
  className?: string;
}

export function IconBadge({ icon: Icon, size = 40, className }: IconBadgeProps) {
  return (
    <div
      className={cn('icon-badge', className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Icon size={Math.round(size * 0.55)} />
    </div>
  );
}
