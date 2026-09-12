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
  // Render the box in rem so it scales with the app's fluid root font-size
  // (identical below 1280px, scales up on wide monitors). Icons are sized as a
  // percentage of the box so they stay proportionally centered at any size.
  return (
    <div
      className={cn('icon-badge', className)}
      style={{ width: `${size / 16}rem`, height: `${size / 16}rem` }}
      aria-hidden
    >
      <Icon style={{ width: '55%', height: '55%' }} />
    </div>
  );
}
