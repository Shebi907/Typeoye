import { ChevronDown } from 'lucide-react';
import { CATEGORIES } from '../../data/blog';
import type { BlogCategory, BlogSort } from '../../data/blog';

interface CategoryFilterProps {
  active: 'All Posts' | BlogCategory;
  onSelect: (category: 'All Posts' | BlogCategory) => void;
  sort: BlogSort;
  onSortChange: (sort: BlogSort) => void;
  count: number;
}

const SORT_LABELS: Record<BlogSort, string> = {
  latest: 'Latest',
  oldest: 'Oldest',
  popular: 'Most Popular',
};

export function CategoryFilter({ active, onSelect, sort, onSortChange, count }: CategoryFilterProps) {
  return (
    <div className="card mb-8 flex flex-col gap-3 rounded-2xl px-4 py-3 md:px-5 xl:flex-row xl:items-center xl:justify-between xl:gap-5">
      {/* Category pills — horizontally scrollable on small screens */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-1 md:mx-0 md:px-0">
        {CATEGORIES.map((category) => {
          const isActive = category === active;
          return (
            <button
              key={category}
              type="button"
              data-testid={`blog-cat-${category.replace(/[^a-z0-9]/gi, '').toLowerCase()}`}
              onClick={() => onSelect(category)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-150 ${
                isActive
                  ? 'text-white'
                  : 'border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent-text)]'
              }`}
              style={
                isActive
                  ? {
                      background: 'linear-gradient(135deg, #4361EE 0%, #7C3AED 100%)',
                      boxShadow: '0 6px 16px -4px rgba(67, 97, 238, 0.5)',
                    }
                  : { backgroundColor: 'transparent' }
              }
            >
              {category}
            </button>
          );
        })}
      </div>

      {/* Sort + results */}
      <div
        className="flex shrink-0 items-center gap-3 border-t pt-3 xl:border-l xl:border-t-0 xl:pl-5 xl:pt-0"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
          {count} {count === 1 ? 'post' : 'posts'}
        </span>
        <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
          Sort by
          <div className="relative">
            <select
              data-testid="blog-sort"
              value={sort}
              onChange={(e) => onSortChange(e.target.value as BlogSort)}
              className="input-base w-auto cursor-pointer appearance-none py-2 pl-3 pr-8 text-xs font-semibold normal-case text-[var(--color-text-primary)]"
              aria-label="Sort posts"
            >
              {(Object.keys(SORT_LABELS) as BlogSort[]).map((key) => (
                <option key={key} value={key}>
                  {SORT_LABELS[key]}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--color-text-muted)' }}
            />
          </div>
        </label>
      </div>
    </div>
  );
}