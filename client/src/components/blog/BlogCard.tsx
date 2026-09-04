import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Clock } from 'lucide-react';
import { formatDate } from '../../data/blog';
import type { BlogPost } from '../../data/blog';
import { cn } from '../../utils/cn';

interface BlogCardProps {
  post: BlogPost;
  /** 'horizontal' puts the image on the side (blog list); 'vertical' stacks it on top (related grid). */
  variant?: 'horizontal' | 'vertical';
}

export function BlogCard({ post, variant = 'horizontal' }: BlogCardProps) {
  const href = `/blog/${post.slug}`;
  const horizontal = variant === 'horizontal';

  return (
    <article
      data-testid={`blog-card-${post.slug}`}
      className={cn('group card card-hover flex h-full overflow-hidden', horizontal ? 'flex-col sm:flex-row' : 'flex-col')}
    >
      {/* Thumbnail */}
      <Link
        to={href}
        aria-label={post.title}
        className={cn(
          'relative block shrink-0 overflow-hidden',
          horizontal
            ? 'aspect-[16/10] sm:aspect-auto sm:w-56 sm:self-stretch md:w-60 lg:w-72'
            : 'aspect-[16/10] w-full'
        )}
      >
        <img
          src={post.image}
          alt={post.imageAlt}
          loading="lazy"
          decoding="async"
          className={cn(
            'h-full w-full object-cover transition-transform duration-500 group-hover:scale-105',
            horizontal && 'absolute inset-0'
          )}
        />
        <span
          className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#4361ee] shadow-sm"
          style={{ backgroundColor: 'rgba(255,255,255,0.94)' }}
        >
          {post.category}
        </span>
      </Link>

      {/* Body */}
      <div className="flex min-w-0 flex-1 flex-col p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          <span className="inline-flex items-center gap-1.5">
            <Calendar size={13} /> {formatDate(post.publishedAt)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock size={13} /> {post.readTime} min read
          </span>
        </div>

        <Link to={href} className="group/title mt-2.5">
          <h3
            className="line-clamp-2 text-lg font-bold leading-snug transition-colors group-hover/title:text-[var(--color-accent-text)]"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {post.title}
          </h3>
        </Link>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          {post.description}
        </p>

        <div className="mt-auto flex items-center gap-3 border-t pt-4" style={{ borderColor: 'var(--color-border)' }}>
          <Link
            to={href}
            className="ml-auto inline-flex items-center gap-1.5 text-sm font-bold transition-colors"
            style={{ color: 'var(--color-accent-text)' }}
          >
            Read Article
            <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}