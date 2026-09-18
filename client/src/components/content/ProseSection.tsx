import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface ProseSectionProps {
  /** Heading shown inside the expanded content block. */
  title: string;
  /** Text for the always-visible clickable header (e.g. "Learn more about the typing test"). */
  learnMoreLabel: string;
  eyebrow?: string;
  icon?: React.ElementType;
  children: React.ReactNode;
}

/**
 * Collapsible "Learn more" section used below feature tools.
 *
 * Content is always present in the DOM (height-animated collapse via
 * `grid-template-rows: 0fr/1fr` + `overflow-hidden`) so it remains
 * fully crawlable and indexable by search engines even while closed.
 */
export function ProseSection({ title, learnMoreLabel, eyebrow = 'About', icon, children }: ProseSectionProps) {
  const Icon = icon;
  const [open, setOpen] = useState(false);

  return (
    <section
      className="mt-8 sm:mt-10 rounded-3xl overflow-hidden border bg-[var(--color-card)] transition-shadow duration-200"
      style={{
        borderColor: 'var(--color-border)',
        boxShadow: open ? '0 12px 32px -18px rgba(67, 97, 238, 0.35)' : '0 10px 28px -20px rgba(23, 23, 31, 0.28)',
      }}
    >
      {/* ── Trigger button ───────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-5 sm:px-6 py-4 text-left"
      >
        {Icon && (
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-colors duration-200"
            style={{
              backgroundColor: open ? 'rgba(67, 97, 238, 0.16)' : 'var(--color-accent-light)',
              color: open ? '#4361EE' : 'var(--color-accent-text)',
            }}
          >
            <Icon size={19} />
          </span>
        )}
        <span className="flex-1 min-w-0">
          <span
            className="block text-sm sm:text-base font-bold"
            style={{ color: open ? '#17171F' : 'var(--color-text-primary)' }}
          >
            {learnMoreLabel}
          </span>
          {!open && (
            <span className="mt-0.5 block truncate text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {title}
            </span>
          )}
        </span>
        <ChevronDown
          size={18}
          className="shrink-0 transition-transform duration-300"
          style={{
            color: open ? '#4361EE' : 'var(--color-text-muted)',
            transform: open ? 'rotate(180deg)' : 'none',
          }}
        />
      </button>

      {/* ── Collapsible content ──────────────────────────────────────── */}
      <div
        className="grid transition-all duration-300 ease-in-out"
        style={{ gridTemplateRows: open ? '1fr' : '0fr', opacity: open ? 1 : 0 }}
      >
        <div className="overflow-hidden">
          <div className="px-5 sm:px-6 pb-6">
            <p className="text-[0.6875rem] font-bold uppercase tracking-wider" style={{ color: 'var(--color-accent-text)' }}>
              {eyebrow}
            </p>
            <h2 className="mt-1 text-lg sm:text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {title}
            </h2>
            <div
              className="mt-3 space-y-3 text-[0.9375rem] leading-relaxed [&_strong]:text-[var(--color-text-primary)]"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}