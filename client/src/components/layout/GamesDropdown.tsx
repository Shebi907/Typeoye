import React, { useLayoutEffect, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Gamepad2, Swords, Globe, ChevronDown, Lock } from 'lucide-react';

function supportsHover(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

export function GamesDropdown() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gamesActive = location.pathname.startsWith('/games') || location.pathname.startsWith('/challenge');
  const challengeActive = location.pathname.startsWith('/challenge');

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 140);
  };
  useEffect(() => () => cancelClose(), []);

  useLayoutEffect(() => { setOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    const onPointerDown = (e: PointerEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    window.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  return (
    <div
      className="relative"
      ref={ref}
      onMouseEnter={() => {
        if (!supportsHover()) return;
        cancelClose();
        setOpen(true);
      }}
      onMouseLeave={() => { if (supportsHover()) scheduleClose(); }}
    >
      <button
        type="button"
        data-testid="games-dropdown-trigger"
        onClick={(event) => { if (!supportsHover() || event.detail === 0) setOpen((v) => !v); }}
        aria-expanded={open}
        aria-haspopup="menu"
        className={`relative px-3.5 py-2 rounded-full text-sm font-semibold transition-all duration-200 navbar-link flex items-center gap-1${gamesActive ? ' navbar-link-active' : ''}`}
        style={{
          color: gamesActive ? '#1B2340' : '#ffffff',
          backgroundColor: gamesActive ? '#ffffff' : 'transparent',
          fontWeight: gamesActive ? 800 : 600,
          border: gamesActive ? '1px solid rgba(27, 35, 64, 0.12)' : '1px solid transparent',
          boxShadow: gamesActive
            ? '0 2px 6px rgba(27, 35, 64, 0.25), 0 6px 18px rgba(15, 23, 42, 0.18)'
            : 'none',
        }}
      >
        Games
        <ChevronDown size={14} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div aria-hidden="true" className="absolute left-0 right-0 top-full h-2" />
          <div
            data-testid="games-dropdown"
            className="navbar-dropdown navbar-dropdown-surface absolute right-0 top-full mt-2 w-60 max-w-[calc(100vw-2rem)] card p-1.5 z-50 shadow-xl border border-[var(--color-border)]"
            onMouseEnter={cancelClose}
          >
            <Link
              to="/games"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-700 transition-colors hover:bg-slate-50"
            >
              <Gamepad2 size={15} style={{ color: 'var(--color-accent-text)' }} /> Typing Games
            </Link>
            <Link
              to="/challenge"
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors${challengeActive ? ' bg-blue-50 font-bold text-blue-700' : ' text-slate-700 hover:bg-slate-50'}`}
            >
              <Swords size={15} style={{ color: 'var(--color-accent-text)' }} /> Typing Challenge
              {challengeActive && <span className="ml-auto h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'var(--color-accent-text)' }} />}
            </Link>
            <button
              disabled
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-700 cursor-not-allowed opacity-50 w-full text-left"
            >
              <Globe size={15} style={{ color: 'var(--color-accent-text)' }} /> Random Match
              <span className="ml-auto text-[0.6rem] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">Soon</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
