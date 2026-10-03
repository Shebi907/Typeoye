import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Calendar, ChevronDown, Clock } from 'lucide-react';
import { formatDate } from '../../data/blog';
import type { BlogPost } from '../../data/blog';
import { cn } from '../../utils/cn';
import { RelatedArticles } from './RelatedArticles';

interface BlogDetailProps {
  post: BlogPost;
  related: BlogPost[];
}

const TOOLS_LINKS = [
  { label: 'Typing Practice', to: '/practice' },
  { label: 'Typing Lessons', to: '/lessons' },
  { label: 'Typing Games', to: '/games' },
  { label: 'Get Certificate', to: '/certificate' },
];

/** "1. Learn Proper Finger Placement" → "learn-proper-finger-placement" */
function headingId(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/^\d+\.\s+/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** "1. Learn Proper Finger Placement" → "Learn Proper Finger Placement" */
function headingText(heading: string): string {
  return heading.replace(/^\d+\.\s+/, '').trim();
}

export function BlogDetail({ post, related }: BlogDetailProps) {
  const sections = post.content;

  const headings = useMemo(
    () =>
      sections.map((section, index) => ({
        id: headingId(section.heading),
        text: headingText(section.heading),
        index,
      })),
    [sections]
  );

  const [activeId, setActiveId] = useState(headings[0]?.id ?? '');
  const [tocOpen, setTocOpen] = useState(false);

  // Scrollspy — keep the TOC entry for the section currently in view highlighted.
  useEffect(() => {
    if (headings.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => ({ id: entry.target.id, top: entry.boundingClientRect.top }))
          .sort((a, b) => a.top - b.top);
        if (visible.length > 0) setActiveId(visible[0].id);
      },
      { rootMargin: '-15% 0px -70% 0px', threshold: 0 }
    );
    headings.forEach((heading) => {
      const el = document.getElementById(heading.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [headings]);

  const pullQuoteIndex = sections.length > 0 ? Math.floor(sections.length / 2) : -1;

  return (
    <article className="animate-fade-in" data-testid="blog-post">
      {/* Back to blog */}
      <Link
        to="/blog"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-75"
        style={{ color: 'var(--color-accent-text)' }}
      >
        <ArrowLeft size={15} /> Back to Blog
      </Link>

      {/* ── Header card ── */}
      <header className="bp-header-card rounded-2xl px-[1.5rem] py-[1.625rem] sm:px-[1.875rem] sm:py-7">
        <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#6d28d9] shadow-sm">
          {post.category}
        </span>
        <h1
          className="mt-3 max-w-[30ch] text-2xl font-extrabold leading-tight sm:text-3xl lg:text-4xl"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {post.title}
        </h1>
        <p className="mt-3 max-w-prose text-base leading-relaxed sm:text-lg" style={{ color: 'var(--color-text-secondary)' }}>
          {post.intro}
        </p>

        {/* Author row */}
        <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
          <span className="inline-flex items-center gap-2 font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold text-white"
              style={{ background: 'linear-gradient(135deg, #4361EE 0%, #7C3AED 100%)' }}
            >
              T
            </span>
            Typeoye Team
          </span>
          <span className="bp-header-chip">
            <Calendar size={14} /> {formatDate(post.publishedAt)}
          </span>
          <span className="bp-header-chip">
            <Clock size={14} /> {post.readTime} min read
          </span>
        </div>
      </header>

      {/* ── Two-column layout: main content + sticky sidebar ── */}
      <div className="mt-8 lg:mt-10 lg:flex lg:items-start lg:gap-8">
        {/* Main column */}
        <div className="min-w-0 flex-1">
          {/* Image + body share the text column, capped at 72ch so neither ever
              exceeds a readable width on ultra-wide screens. */}
          <div className="readable-text">
            {/* Featured image — matched to the text column, never wider */}
            <figure
              className="relative w-full overflow-hidden rounded-[1.25rem] border"
              style={{ borderColor: 'var(--color-border)', aspectRatio: '16 / 8' }}
            >
              <img src={post.image} alt={post.imageAlt} className="absolute inset-0 h-full w-full object-cover" />
            </figure>

            {/* Numbered sections + pull-quote */}
            <div className="mt-8 space-y-10 sm:mt-10">
              {sections.map((section, index) => {
                const heading = headings[index];
                return (
                  <div key={heading.id}>
                    <section id={heading.id} className="scroll-mt-24">
                      <div className="flex items-baseline gap-4">
                        <span
                          aria-hidden="true"
                          className="bp-section-num shrink-0 text-3xl font-extrabold leading-none tracking-tight sm:text-4xl"
                        >
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <h2 className="text-xl font-bold sm:text-2xl" style={{ color: 'var(--color-text-primary)' }}>
                          {heading.text}
                        </h2>
                      </div>
                      <p className="mt-3 text-[1.0625rem] leading-[1.75]" style={{ color: 'var(--color-text-secondary)' }}>
                        {section.body}
                      </p>
                    </section>

                    {index === pullQuoteIndex && post.pullQuote && (
                      <aside className="bp-quote mt-10 overflow-hidden rounded-r-xl px-5 py-4 sm:px-6 sm:py-5">
                        <p className="text-lg font-medium italic leading-relaxed sm:text-xl">“{post.pullQuote}”</p>
                      </aside>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Closing CTA — per-post when provided, generic fallback otherwise */}
            <div className="bp-cta mt-12 rounded-2xl px-6 py-8 text-center sm:px-8 sm:py-10">
              <h3 className="text-xl font-extrabold text-white sm:text-2xl">
                {post.cta?.heading ?? 'Ready to improve your typing?'}
              </h3>
              <p className="mt-2 text-sm text-white/85 sm:text-base">
                {post.cta?.blurb ?? 'Practice your speed and accuracy with Typeoye'}
              </p>
              <Link
                to={post.cta?.to ?? '/test'}
                data-testid="article-cta"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-[#1B2340] shadow-lg transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
              >
                {post.cta?.label ?? 'Start Typing Test'} <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>

        {/* Sidebar — stacks below content < lg; sticky beside it on desktop.
            No height cap or overflow: the sidebar's natural height is used and
            it scrolls with the page as a single scroll experience. */}
        <aside className="mt-8 lg:sticky lg:top-20 lg:mt-0 lg:w-56 lg:shrink-0 lg:self-start">
          {/* On this page */}
          <div className="card p-5">
            <button
              type="button"
              onClick={() => setTocOpen((v) => !v)}
              aria-expanded={tocOpen}
              className="flex w-full items-center justify-between gap-2 lg:pointer-events-none lg:cursor-default"
            >
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                On this page
              </span>
              <ChevronDown
                size={16}
                className={cn('lg:hidden transition-transform duration-200', tocOpen && 'rotate-180')}
                style={{ color: 'var(--color-text-muted)' }}
              />
            </button>
            <nav className={cn('mt-3 lg:block', tocOpen ? 'block' : 'hidden')}>
              <ul className="flex flex-col gap-1">
                {headings.map((heading) => (
                  <li key={heading.id}>
                    <a
                      href={`#${heading.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById(heading.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                      className={cn(
                        'block border-l-2 py-1 pl-3 text-sm leading-snug transition-colors',
                        activeId === heading.id
                          ? 'border-l-[var(--color-accent-text)] font-semibold text-[var(--color-accent-text)]'
                          : 'border-l-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-accent-text)]'
                      )}
                    >
                      {heading.text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Written by */}
          <div className="card mt-4 p-5">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
              Written by
            </p>
            <div className="mt-3 flex items-center gap-3">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white"
                style={{ background: 'linear-gradient(135deg, #4361EE 0%, #7C3AED 100%)' }}
              >
                T
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  Typeoye Team
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  Typing Guides
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              We write practical guides on touch typing, speed, accuracy, and productivity.
            </p>
          </div>

          {/* More tools */}
          <div className="bp-tools-card mt-4 rounded-2xl p-5">
            <p className="bp-tools-heading text-xs font-bold uppercase tracking-widest">More tools</p>
            <ul className="mt-3 flex flex-col gap-2">
              {TOOLS_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="bp-tools-link group flex items-center justify-between gap-2 text-sm font-semibold transition-opacity"
                  >
                    {link.label}
                    <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      {/* Related articles — full width below the two columns */}
      <RelatedArticles posts={related} />
    </article>
  );
}