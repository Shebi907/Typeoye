import { Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Calendar, Clock } from 'lucide-react';
import { CATEGORY_BADGE, formatDate } from '../../data/blog';
import type { BlogPost } from '../../data/blog';
import { RelatedArticles } from './RelatedArticles';

interface BlogDetailProps {
  post: BlogPost;
  related: BlogPost[];
}

export function BlogDetail({ post, related }: BlogDetailProps) {
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

      {/* Header */}
      <header className="readable-text max-w-3xl">
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${CATEGORY_BADGE[post.category]}`}
        >
          {post.category}
        </span>
        <h1
          className="mt-3 text-2xl font-extrabold leading-tight sm:text-4xl"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {post.title}
        </h1>
        <p className="mt-3 text-base leading-relaxed sm:text-lg" style={{ color: 'var(--color-text-secondary)' }}>
          {post.intro}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          <span className="inline-flex items-center gap-1.5 font-medium" style={{ color: 'var(--color-text-primary)' }}>
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full text-[0.6875rem] font-extrabold text-white"
              style={{ background: 'linear-gradient(135deg, #4361EE 0%, #7C3AED 100%)' }}
            >
              T
            </span>
            Typeoye Team
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Calendar size={14} /> {formatDate(post.publishedAt)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock size={14} /> {post.readTime} min read
          </span>
        </div>
      </header>

      {/* Featured image */}
      <div
        className="readable-text relative mt-7 w-full overflow-hidden rounded-[1.25rem] border"
        style={{ borderColor: 'var(--color-border)', aspectRatio: '16 / 7' }}
      >
        <img
          src={post.image}
          alt={post.imageAlt}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <span
          className="absolute bottom-4 left-4 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#4361ee] shadow-sm"
          style={{ backgroundColor: 'rgba(255,255,255,0.94)' }}
        >
          {post.category}
        </span>
      </div>

      {/* Article body */}
      <div className="readable-text mt-8 max-w-3xl">
        {post.content.map((section, index) => (
          <section key={section.heading} className="mb-8">
            <h2
              className="mb-3 flex items-baseline gap-3 text-xl font-bold sm:text-2xl"
              style={{ color: 'var(--color-text-primary)' }}
            >
              <span
                className="h-6 w-1 shrink-0 translate-y-0.5 rounded-full"
                style={{ background: 'linear-gradient(135deg, #4361EE 0%, #7C3AED 100%)' }}
              />
              {section.heading}
            </h2>
            <p className="pl-4 text-[1.0625rem] leading-[1.75]" style={{ color: 'var(--color-text-secondary)' }}>
              {section.body}
            </p>
          </section>
        ))}

        {/* Closing CTA */}
        <div
          className="mt-9 mx-auto max-w-3xl rounded-2xl px-6 pt-6 pb-8 text-center sm:px-7 sm:pt-7 sm:pb-8"
          style={{ backgroundColor: 'var(--color-accent-light)' }}
        >
          <h3 className="text-lg font-extrabold sm:text-xl" style={{ color: 'var(--color-text-primary)' }}>
            Ready to improve your typing?
          </h3>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Practice your speed and accuracy with Typeoye.
          </p>
          <Link
            to="/test"
            data-testid="article-cta"
            className="mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #4361EE 0%, #7C3AED 100%)',
              boxShadow: '0 8px 22px -6px rgba(67, 97, 238, 0.5)',
            }}
          >
            Start Typing Test <ArrowRight size={16} />
          </Link>

          {/* Internal links to key Typeoye features */}
          <div className="mt-7 border-t pt-5" style={{ borderColor: 'var(--color-border)' }}>
            <p className="text-[0.625rem] font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
              More free typing tools
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-semibold">
              <Link to="/practice" className="transition-opacity hover:opacity-75" style={{ color: 'var(--color-accent-text)' }}>
                Typing Practice
              </Link>
              <Link to="/lessons" className="transition-opacity hover:opacity-75" style={{ color: 'var(--color-accent-text)' }}>
                Typing Lessons
              </Link>
              <Link to="/games" className="transition-opacity hover:opacity-75" style={{ color: 'var(--color-accent-text)' }}>
                Typing Games
              </Link>
              <Link to="/certificate" className="transition-opacity hover:opacity-75" style={{ color: 'var(--color-accent-text)' }}>
                Typing Certificate
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Related articles */}
      <RelatedArticles posts={related} />
    </article>
  );
}