import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";

interface Option { label: string; href: string; }

interface NavDropdownProps { label: string; options: Option[]; }

function supportsHover(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

export function NavDropdown({ label, options }: NavDropdownProps) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 140);
  };

  useEffect(() => () => cancelClose(), []);
  useEffect(() => { setOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const onClick = (e: PointerEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onClick);
    };
  }, [open]);

  const isActive = options.some((o) => location.pathname === o.href || location.pathname.startsWith(o.href));

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
        onClick={(event) => {
          // Pointer clicks do not toggle desktop menus; keyboard activation
          // and touch devices retain an explicit tap/click interaction.
          if (!supportsHover() || event.detail === 0) setOpen((v) => !v);
        }}
        className={`relative px-3.5 py-2 rounded-full text-sm font-semibold transition-all duration-200 navbar-link flex items-center gap-1 ${isActive ? "navbar-link-active" : ""}`}
        style={{
          color: isActive ? "#1B2340" : "#ffffff",
          backgroundColor: isActive ? "#ffffff" : "transparent",
          fontWeight: isActive ? 800 : 600,
          border: isActive ? "1px solid rgba(27, 35, 64, 0.12)" : "1px solid transparent",
          boxShadow: isActive
            ? "0 2px 6px rgba(27, 35, 64, 0.25), 0 6px 18px rgba(15, 23, 42, 0.18)"
            : "none",
        }}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {label}
        <ChevronDown size={16} className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <div aria-hidden="true" className="absolute left-0 right-0 top-full h-2" />
          <div
            role="menu"
            className="navbar-dropdown-surface absolute left-0 top-full mt-2 z-40 min-w-[220px] rounded-xl shadow-lg border border-white/10 bg-white/95 backdrop-blur-xl p-1"
            onMouseEnter={cancelClose}
          >
            {options.map((opt) => {
              const active = location.pathname === opt.href;
              return (
                <Link
                  key={opt.href}
                  to={opt.href}
                  onClick={() => setOpen(false)}
                  role="menuitem"
                  className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${active ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50"}`}
                >
                  {opt.label}
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
