import React, { useLayoutEffect, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { TrendingUp, Medal, ChevronDown } from 'lucide-react';

export function ProgressDropdown() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const progressActive = location.pathname.startsWith('/progress');

  // Close the dropdown on navigation or Escape. Layout effect: the destination
  // page's first frame must never still show the open dropdown overlay.
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
        data-testid="progress-dropdown-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={`relative px-3.5 py-2 rounded-full text-sm font-semibold transition-all duration-200 navbar-link flex items-center gap-1${progressActive ? ' navbar-link-active' : ''}`}
        style={{
          color: progressActive ? '#1B2340' : '#ffffff',
          backgroundColor: progressActive ? '#ffffff' : 'transparent',
          fontWeight: progressActive ? 800 : 600,
          border: progressActive ? '1px solid rgba(27, 35, 64, 0.12)' : '1px solid transparent',
          boxShadow: progressActive
            ? '0 2px 6px rgba(27, 35, 64, 0.25), 0 6px 18px rgba(15, 23, 42, 0.18)'
            : 'none',
        }}
      >
        Progress
        <ChevronDown size={14} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          {/* Click-outside catcher — sits under the button and the menu */}
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div
            data-testid="progress-dropdown"
            className="navbar-dropdown absolute right-0 top-full mt-2 w-60 max-w-[calc(100vw-2rem)] card p-1.5 z-50 shadow-xl border border-[var(--color-border)]"
          >
            <Link
              to="/progress"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-[var(--color-accent-light)]"
            >
              <TrendingUp size={15} style={{ color: 'var(--color-accent-text)' }} /> My Progress
            </Link>
            <Link
              to="/progress/achievements"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-[var(--color-accent-light)]"
            >
              <Medal size={15} style={{ color: 'var(--color-accent-text)' }} /> Achievements
            </Link>
          </div>
        </>
      )}
    </div>
  );
}