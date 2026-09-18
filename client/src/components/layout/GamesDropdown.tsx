import React, { useLayoutEffect, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Gamepad2, ChevronDown } from 'lucide-react';

export function GamesDropdown() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const gamesActive = location.pathname.startsWith('/games');

  useLayoutEffect(() => { setOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="relative">
      <button
        type="button"
        data-testid="games-dropdown-trigger"
        onClick={() => setOpen((v) => !v)}
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
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div
            data-testid="games-dropdown"
            className="navbar-dropdown absolute right-0 top-full mt-2 w-60 max-w-[calc(100vw-2rem)] card p-1.5 z-50 shadow-xl border border-[var(--color-border)]"
          >
            <Link
              to="/games"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-[var(--color-accent-light)]"
            >
              <Gamepad2 size={15} style={{ color: 'var(--color-accent-text)' }} /> Typing Games
            </Link>
          </div>
        </>
      )}
    </div>
  );
}