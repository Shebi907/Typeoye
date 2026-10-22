import React, { useLayoutEffect, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { TrendingUp, Languages, ChevronDown } from 'lucide-react';

function supportsHover(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

export function ProgressDropdown() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressActive = location.pathname.startsWith('/progress');

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 140);
  };
  useEffect(() => () => cancelClose(), []);

  // Close the dropdown on navigation or Escape. Layout effect: the destination
  // page's first frame must never still show the open dropdown overlay.
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
        data-testid="progress-dropdown-trigger"
        onClick={(event) => { if (!supportsHover() || event.detail === 0) setOpen((v) => !v); }}
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
          <div aria-hidden="true" className="absolute left-0 right-0 top-full h-2" />
          <div
            data-testid="progress-dropdown"
            className="navbar-dropdown navbar-dropdown-surface absolute right-0 top-full mt-2 w-60 max-w-[calc(100vw-2rem)] card p-1.5 z-50 shadow-xl border border-[var(--color-border)]"
            onMouseEnter={cancelClose}
          >
            <Link
              to="/progress"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-700 transition-colors hover:bg-slate-50"
            >
              <TrendingUp size={15} style={{ color: 'var(--color-accent-text)' }} /> English Typing Progress
            </Link>
            <Link
              to="/progress/urdu"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-700 transition-colors hover:bg-slate-50"
            >
              <Languages size={15} style={{ color: 'var(--color-accent-text)' }} /> Urdu Typing Progress
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
