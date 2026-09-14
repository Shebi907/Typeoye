import { useMemo, useState } from 'react';
import { ArrowRight, BookOpen, Calendar, Clock, LifeBuoy, Search, SearchX } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SUPPORT_CATEGORIES, SUPPORT_ARTICLES, SUPPORT_CATEGORY_META, SUPPORT_CATEGORY_COUNTS } from '../data/support';
import type { SupportArticle, SupportCategory } from '../data/support';
import { SUPPORT_EMAIL } from '../config';
import { cn } from '../utils/cn';
import { useSeo } from '../hooks/useSeo';

const CATEGORIES = ['All Articles', ...SUPPORT_CATEGORIES] as const;

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function matchesSearch(article: SupportArticle, query: string): boolean {
  const q = normalize(query);
  if (!q) return true;
  const haystacks = [
    normalize(article.title),
    normalize(article.description),
    normalize(article.category),
    ...(article.keywords ?? []).map(normalize),
    ...article.body.map((line) => normalize(line.replace(/\*\*/g, ''))),
  ].join(' ');
  return q.split(' ').every((word) => haystacks.includes(word));
}

export default function SupportCenter() {
  const [category, setCategory] = useState<'All Articles' | SupportCategory>('All Articles');
  const [query, setQuery] = useState('');

  useSeo({
    title: 'Help Center & Support | TypeOye',
    description:
      'Get help with TypeOye — account setup, typing test and practice questions, Learn course, certificates, and troubleshooting guides.',
    canonicalPath: '/support',
  });

  const filtered = useMemo(() => {
    const byCategory =
      category === 'All Articles' ? SUPPORT_ARTICLES : SUPPORT_ARTICLES.filter((a) => a.category === category);
    if (!query.trim()) return byCategory;
    const q = normalize(query);
    if (!q) return byCategory;
    return byCategory.filter((a) => matchesSearch(a, q));
  }, [category, query]);

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
      {/* Header */}
      <section className="relative mb-8 overflow-hidden rounded-[1.5rem] border px-4 pt-10 pb-8 text-center sm:px-8" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
        <span className="dot-grid dot-grid-tl" aria-hidden="true" />
        <span className="dot-grid dot-grid-tr" aria-hidden="true" />
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-white" style={{ background: 'linear-gradient(135deg, #4361EE 0%, #7C3AED 100%)', boxShadow: '0 10px 24px -8px rgba(67, 97, 238, 0.55)' }}>
          <LifeBuoy size={30} strokeWidth={2} />
        </div>
        <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: 'var(--color-text-primary)' }}>
          Support Center
        </h1>
        <p className="readable-text mx-auto mt-3 max-w-xl text-base leading-relaxed sm:text-lg" style={{ color: 'var(--color-text-secondary)' }}>
          Answers and guides to help you get the most out of Typeoye.
        </p>

        {/* Search */}
        <div className="relative mx-auto mt-7 w-full max-w-xl">
          <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for articles, guides, or questions..."
            data-testid="support-search"
            className="w-full rounded-2xl border bg-[var(--color-card)] py-3.5 pl-12 pr-4 text-sm outline-none transition-all duration-200 placeholder:text-[var(--color-text-muted)] focus:border-transparent focus:ring-2 sm:text-base"
            style={{ borderColor: 'var(--color-border)', boxShadow: '0 4px 14px -8px rgba(23, 23, 31, 0.12)', ['--tw-ring-color' as string]: 'rgba(67, 97, 238, 0.45)' }}
          />
        </div>
      </section>

      {/* Filter bar */}
      <div className="card mb-8 flex flex-col gap-4 rounded-2xl px-4 py-3.5 sm:px-5 xl:flex-row xl:items-center xl:justify-between xl:gap-5" data-testid="support-filter-bar">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-1 md:mx-0 md:px-0">
          {CATEGORIES.map((cat) => {
            const isActive = cat === category;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => { setCategory(cat); setQuery(''); }}
                className={cn(
                  'shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-150',
                  isActive
                    ? 'text-white'
                    : 'border bg-[var(--color-card)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent-text)]'
                )}
                style={isActive ? { background: 'linear-gradient(135deg, #4361EE 0%, #7C3AED 100%)', boxShadow: '0 6px 16px -6px rgba(67, 97, 238, 0.55)' } : { borderColor: 'var(--color-border)' }}
              >
                {cat}
              </button>
            );
          })}
        </div>
        <div className="flex shrink-0 items-center gap-3 border-t pt-3 xl:border-l xl:border-t-0 xl:pl-5 xl:pt-0" style={{ borderColor: 'var(--color-border)' }}>
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
            {filtered.length} {filtered.length === 1 ? 'article' : 'articles'}
          </span>
        </div>
      </div>

      {/* 70/30 layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* Main column */}
        <div className="min-w-0">
          {filtered.length === 0 ? (
            <div className="card flex flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent-text)' }}>
                <SearchX size={26} strokeWidth={2} />
              </span>
              <h2 className="mt-4 text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>No results found</h2>
              <p className="mt-1.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>Try searching with different keywords.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {filtered.map((article) => {
                const meta = SUPPORT_CATEGORY_META[article.category];
                const Icon = article.icon;
                const href = `/support/${article.slug}`;
                return (
                  <article
                    key={article.slug}
                    className="group card card-hover flex h-full flex-col rounded-[1rem] transition-all duration-200 hover:-translate-y-0.5"
                  >
                    <div className="flex min-w-0 flex-1 flex-col p-5 sm:p-6">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.6875rem] font-bold uppercase tracking-wide" style={{ backgroundColor: meta.bg, color: meta.color }}>
                          <Icon size={12} /> {article.category}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          <Clock size={13} /> {article.readTime} min read
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          <Calendar size={13} /> Updated {article.updatedAt}
                        </span>
                      </div>
                      <Link to={href} className="group/title mt-3">
                        <h3 className="line-clamp-2 text-lg font-bold leading-snug transition-colors group-hover/title:text-[var(--color-accent-text)]" style={{ color: 'var(--color-text-primary)' }}>
                          {article.title}
                        </h3>
                      </Link>
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                        {article.description}
                      </p>
                      <div className="mt-auto pt-4">
                        <Link to={href} className="inline-flex items-center gap-1.5 text-sm font-bold transition-colors" style={{ color: 'var(--color-accent-text)' }}>
                          Read Article
                          <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-24 lg:self-start" data-testid="support-sidebar">
          <section className="card p-5 sm:p-6">
            <h2 className="mb-4 flex items-center gap-2 text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>
              <BookOpen size={16} style={{ color: 'var(--color-accent-text)' }} /> Categories
            </h2>
            <ul className="flex flex-col gap-1">
              {SUPPORT_CATEGORIES.map((cat) => {
                const meta = SUPPORT_CATEGORY_META[cat];
                const Icon = meta.icon;
                const isActive = category === cat;
                return (
                  <li key={cat}>
                    <button
                      type="button"
                      onClick={() => { setCategory(cat); setQuery(''); }}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors',
                        isActive ? 'bg-[var(--color-accent-light)]' : 'hover:bg-[var(--color-accent-light)]'
                      )}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: meta.bg, color: meta.color }}>
                        <Icon size={16} />
                      </span>
                      <span className="flex-1 truncate text-sm font-semibold" style={{ color: isActive ? 'var(--color-accent-text)' : 'var(--color-text-primary)' }}>
                        {cat}
                      </span>
                      <span className="text-xs font-bold" style={{ color: 'var(--color-text-muted)' }}>
                        {SUPPORT_CATEGORY_COUNTS[cat]}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        </aside>
      </div>

      {/* FAQ + Contact section */}
      <section className="mx-auto mt-12 max-w-7xl" data-testid="support-faq-cta">
        <div className="flex flex-col items-center justify-between gap-5 rounded-[1.25rem] border px-6 py-6 text-center sm:flex-row sm:px-8 sm:text-left" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
          <div>
            <h2 className="text-lg font-extrabold tracking-tight sm:text-xl" style={{ color: 'var(--color-text-primary)' }}>
              Still need help?
            </h2>
            <p className="mt-0.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Find more answers in our FAQ or contact us for assistance.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-center gap-3">
            <Link
              to="/faq"
              data-testid="faq-button"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-200 hover:-translate-y-0.5"
              style={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent-text)' }}
            >
              <BookOpen size={16} /> Visit FAQ
            </Link>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              data-testid="contact-button"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #4361EE 0%, #7C3AED 100%)', boxShadow: '0 8px 20px -8px rgba(67, 97, 238, 0.55)' }}
            >
              <LifeBuoy size={16} /> Contact Us
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
