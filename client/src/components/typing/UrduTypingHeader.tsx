import type { ReactNode } from 'react';
import { urduTitleFor } from '../../data/urduTitles';

interface UrduTypingHeaderProps {
  /** Exact English title shown on the left. */
  englishTitle: string;
  /** Urdu (Nastaliq) translation shown on the right. Defaults to the shared lookup. */
  urduTitle?: string;
  /** Duration / difficulty badge elements shown next to the English title. */
  badges?: ReactNode;
  /** Subtitle line rendered under the English title. */
  subtitle: ReactNode;
}

/**
 * Bilingual header shared by every Urdu typing screen (test + all practice
 * types). The English title, its badges and subtitle sit on the left; the Urdu
 * (Nastaliq) title sits on the right. On small screens the Urdu title stacks
 * under the English one, right-aligned. Header styling only — no typing logic.
 */
export function UrduTypingHeader({
  englishTitle,
  urduTitle = urduTitleFor(englishTitle),
  badges,
  subtitle,
}: UrduTypingHeaderProps) {
  return (
    <div
      data-testid="urdu-header-row"
      className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {englishTitle}
          </h1>
          {badges}
        </div>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          {subtitle}
        </p>
      </div>

      <p
        dir="rtl"
        lang="ur"
        data-testid="urdu-header-title"
        className="font-urdu text-2xl font-bold leading-[1.9] text-right sm:shrink-0"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {urduTitle}
      </p>
    </div>
  );
}
