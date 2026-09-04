import React from 'react';

interface AvatarProps {
  src?: string;
  name?: string;
  size?: number;
  className?: string;
}

/** Renders the profile picture when available, otherwise a colored initial. */
export function Avatar({ src, name, size = 48, className = '' }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name ?? 'User avatar'}
        className={`rounded-full object-cover shrink-0 ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className={`rounded-full grid place-items-center font-bold text-white shrink-0 ${className}`}
      style={{ width: size, height: size, backgroundColor: 'var(--color-accent)', fontSize: Math.round(size * 0.42) }}
    >
      {(name ?? 'U')[0].toUpperCase()}
    </div>
  );
}