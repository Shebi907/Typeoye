import React, { useEffect, useState } from 'react';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  name?: string;
  size?: number;
}

/** Single source of truth for avatars across the app (navbar, profile banner,
 *  leaderboard, …). Renders the profile picture when available; otherwise a
 *  brand-colored initial. If the image fails to load (broken URL, stale remote
 *  photo, offline) it switches to the initial fallback instead of showing a
 *  broken icon — so every surface shows the same fallback style and the same
 *  color for the same user. */
export function Avatar({ src, name, size = 48, className = '', ...rest }: AvatarProps) {
  const [errored, setErrored] = useState(false);

  // A new src gets a fresh chance to render (e.g. after the user uploads a new
  // picture or switches accounts) — clear any previous load failure.
  useEffect(() => {
    setErrored(false);
  }, [src]);

  if (src && !errored) {
    return (
      <img
        src={src}
        alt={name ?? 'User avatar'}
        onError={() => setErrored(true)}
        className={`rounded-full object-cover shrink-0 ${className}`}
        style={{ width: size, height: size }}
        {...rest}
      />
    );
  }
  return (
    <div
      {...rest}
      className={`rounded-full grid place-items-center font-bold text-white shrink-0 ${className}`}
      style={{ width: size, height: size, backgroundColor: 'var(--color-accent)', fontSize: Math.round(size * 0.42) }}
    >
      {(name ?? 'U')[0].toUpperCase()}
    </div>
  );
}