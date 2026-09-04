import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Calendar, Keyboard, Sparkles, Target, TrendingUp, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { CATEGORIES, CATEGORY_BADGE, CATEGORY_COUNTS, formatDate, POSTS } from '../../data/blog';
import type { BlogCategory, BlogPost } from '../../data/blog';
import { cn } from '../../utils/cn';

const CATEGORY_ICONS: Record<BlogCategory, LucideIcon> = {
  'Typing Tips': Zap,
  'Guides': BookOpen,
  'Practice': Target,
  'Productivity': TrendingUp,
  'News & Updates': Sparkles,
};

const POPULAR_SLUGS = ['typing-speed-tips', 'home-row-technique', 'typing-accuracy-exercises'];

interface BlogSidebarProps {
  active: 'All Posts' | BlogCategory;
  onSelect: (category: 'All Posts' | BlogCategory) => void;
}

export function BlogSidebar({ active, onSelect }: BlogSidebarProps) {
  const popularPosts: BlogPost[] = POPULAR_SLUGS.map((slug) => POSTS.find((p) => p.slug === slug)).filter(
    (p): p is BlogPost => Boolean(p)
  );

  return (
    <aside className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
      {/* Categories */}
      <section className="card p-5 sm:p-6" data-testid="blog-sidebar-categories">
        <h2 className="mb-4 text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Categories
        </h2>
        <ul className="flex flex-col gap-1">
          {CATEGORIES.filter((c) => c !== 'All Posts').map((category) => {
            const Icon = CATEGORY_ICONS[category];
            const isActive = active === category;
            return (
              <li key={category}>
                <button
                  type="button"
                  onClick={() => onSelect(category)}
                  data-testid={`blog-sidebar-cat-${category.replace(/[^a-z0-9]/gi, '').toLowerCase()}`}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors',
                    isActive ? 'bg-[var(--color-accent-light)]' : 'hover:bg-[var(--color-accent-light)]'
                  )}
                >
                  <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', CATEGORY_BADGE[category])}>
                    <Icon size={16} />
                  </span>
                  <span
                    className="flex-1 truncate text-sm font-semibold"
                    style={{ color: isActive ? 'var(--color-accent-text)' : 'var(--color-text-primary)' }}
                  >
                    {category}
                  </span>
                  <span className="text-xs font-bold" style={{ color: 'var(--color-text-muted)' }}>
                    {CATEGORY_COUNTS[category]}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Popular posts */}
      <section className="card p-5 sm:p-6" data-testid="blog-sidebar-popular">
        <h2 className="mb-3 text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Popular Posts
        </h2>
        <ul className="flex flex-col" style={{ borderColor: 'var(--color-border)' }}>
          {popularPosts.map((post, index) => (
            <li
              key={post.slug}
              className={cn('py-3.5', index > 0 && 'border-t')}
              style={index > 0 ? { borderColor: 'var(--color-border)' } : undefined}
            >
              <Link to={`/blog/${post.slug}`} className="group flex items-center gap-3">
                <img
                  src={post.image}
                  alt={post.imageAlt}
                  loading="lazy"
                  decoding="async"
                  className="h-14 w-14 shrink-0 rounded-lg object-cover"
                />
                <span className="min-w-0 flex-1">
                  <span
                    className="block line-clamp-2 text-sm font-semibold leading-snug transition-colors group-hover:text-[var(--color-accent-text)]"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {post.title}
                  </span>
                  <span className="mt-0.5 flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    <Calendar size={11} /> {formatDate(post.publishedAt)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* CTA card */}
      <section
        className="relative overflow-hidden rounded-2xl p-5 sm:p-6"
        style={{ background: 'linear-gradient(135deg, #4361EE 0%, #7C3AED 100%)' }}
        data-testid="blog-sidebar-cta"
      >
        <span aria-hidden="true" className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10" />
        <span aria-hidden="true" className="pointer-events-none absolute -bottom-12 -left-8 h-36 w-36 rounded-full bg-white/10" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.25) 1.3px, transparent 1.4px)',
            backgroundSize: '18px 18px',
            opacity: 0.3,
          }}
        />
        <div className="relative z-10">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl text-white"
            style={{ background: 'rgba(255,255,255,0.18)', boxShadow: '0 8px 20px -6px rgba(0,0,0,0.25)' }}
          >
            <Keyboard size={22} />
          </div>
          <h3 className="mt-4 text-lg font-extrabold text-white">Improve Your Typing Skills</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-white/85">
            Practice regularly and track your progress with Typeoye.
          </p>
          <Link
            to="/test"
            className="mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 hover:brightness-95 active:scale-[0.98]"
            style={{ backgroundColor: '#fff', color: '#4361ee', boxShadow: '0 10px 24px -8px rgba(0,0,0,0.35)' }}
          >
            Start Typing Test <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </aside>
  );
}