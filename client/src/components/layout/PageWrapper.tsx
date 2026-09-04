import React, { useEffect } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
import { IconBadge } from '../ui/IconBadge';

interface PageWrapperProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
  fullWidth?: boolean;
  /** Skip rendering the visible heading block (keeps the document title). */
  noHeader?: boolean;
  /** Optional icon rendered in a gradient badge next to the page title. */
  icon?: LucideIcon;
  /** Decorative corner dot-grid for prominent header sections (not typing screens). */
  dotGrid?: boolean;
}

export function PageWrapper({
  children,
  title,
  description,
  className,
  fullWidth = false,
  noHeader = false,
  icon: Icon,
  dotGrid = false,
}: PageWrapperProps) {
  useEffect(() => {
    if (title) {
      document.title = `${title} — Typeoye`;
    } else {
      document.title = 'Typeoye — Master the Keyboard';
    }
  }, [title]);

  return (
    <main
      className={cn(
        'flex-1 py-8 px-4 sm:px-6',
        !fullWidth && 'max-w-5xl mx-auto w-full',
        className
      )}
    >
      {(title || description) && !noHeader && (
        <div className="relative mb-8 flex items-start gap-4">
          {dotGrid && <span className="dot-grid dot-grid-tr" aria-hidden="true" />}
          {Icon && <IconBadge icon={Icon} size={44} className="mt-0.5" />}
          <div>
            {title && (
              <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {title}
              </h1>
            )}
            {description && (
              <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {description}
              </p>
            )}
          </div>
        </div>
      )}
      {children}
    </main>
  );
}
