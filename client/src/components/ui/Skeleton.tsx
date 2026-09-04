import React from 'react';
import { cn } from '../../utils/cn';

interface SkeletonProps {
  width?: string;
  height?: string;
  className?: string;
  rounded?: boolean | 'full';
}

export function Skeleton({ width, height, className, rounded = false }: SkeletonProps) {
  return (
    <div
      className={cn(
        'skeleton',
        rounded === 'full' && 'rounded-full',
        rounded === true && 'rounded-lg',
        className
      )}
      style={{ width, height: height ?? '1rem' }}
      aria-hidden="true"
    />
  );
}

/** A block of stacked skeleton lines */
export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={i === lines - 1 ? '70%' : '100%'} />
      ))}
    </div>
  );
}

/** Skeleton for a StatCard */
export function SkeletonCard() {
  return (
    <div className="card p-6 space-y-3">
      <Skeleton width="40%" height="0.8rem" />
      <Skeleton width="60%" height="2rem" />
      <Skeleton width="50%" height="0.7rem" />
    </div>
  );
}
