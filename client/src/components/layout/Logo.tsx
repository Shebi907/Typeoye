import React from 'react';
import typeoyeLogo from '../../assets/typeoye-logo-transparent.png';

interface LogoProps {
  /** Height of the logo mark in pixels (default 33). Width auto-scales to keep the original aspect ratio. */
  size?: number;
  /** Horizontal gap between the mark and the wordmark, in pixels (default 5). */
  gap?: number;
}

/**
 * Shared Typeoye logo — transparent PNG mark + wordmark.
 * Used identically in the navbar and footer.
 *
 * Mark:       speech-bubble/audio-wave logo on a transparent background
 *             (typeoye-logo-transparent.png) — no box, no cropped square.
 * "Type":     white       #FFFFFF  bold
 * "oye":      lavender    #C7B8FF
 */
export function Logo({ size = 33, gap = 5 }: LogoProps) {
  return (
    <span className="flex items-center select-none" style={{ gap }}>
      {/* Transparent logo mark — height-based so the aspect ratio is preserved */}
      <img
        src={typeoyeLogo}
        alt="Typeoye"
        width={size}
        height={size}
        className="flex-shrink-0"
        style={{ height: size, width: 'auto', filter: 'drop-shadow(0 1px 2px rgba(10, 20, 60, 0.4))' }}
      />

      {/* Wordmark */}
      <span className="text-lg font-bold leading-none">
        <span style={{ color: '#ffffff' }}>Type</span>
        <span className="logo-wordmark-oye" style={{ color: '#C7B8FF' }}>oye</span>
      </span>
    </span>
  );
}
