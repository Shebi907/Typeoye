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
 *  color for the same user.
 *
 *  The `size` prop is still a pixel value, but it is rendered in rem so avatars
 *  scale with the app's fluid root font-size (16px ≤1280px viewport, then up
 *  to 22px). This keeps every avatar in proportion with the rem-based UI
 *  around it — including absolutely-positioned badges — at any screen size. */
export function Avatar({ src, name, size = 48, className = '', ...rest }: AvatarProps) {
  const [errored, setErrored] = useState(false);

  /** px → rem. Root is exactly 16px below 1280px, so rendering is identical
   *  there; above 1280px the avatar scales with the rest of the UI. */
  const toRem = (px: number) => `${px / 16}rem`;

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
        style={{ width: toRem(size), height: toRem(size) }}
        {...rest}
      />
    );
  }
  return (
    <div
      {...rest}
      className={`rounded-full grid place-items-center font-bold text-white shrink-0 ${className}`}
      style={{ width: toRem(size), height: toRem(size), backgroundColor: 'var(--color-accent)', fontSize: toRem(Math.round(size * 0.42)) }}
    >
      {(name ?? 'U')[0].toUpperCase()}
    </div>
  );
}