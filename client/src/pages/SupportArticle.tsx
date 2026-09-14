import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Clock, ThumbsDown, ThumbsUp } from 'lucide-react';
import { SUPPORT_ARTICLES, SUPPORT_CATEGORY_META } from '../data/support';
import { cn } from '../utils/cn';
import { useSeo } from '../hooks/useSeo';

export default function SupportArticle() {
  const { slug } = useParams<{ slug: string }>();
  const article = SUPPORT_ARTICLES.find((a) => a.slug === slug);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  useSeo(
    article
      ? {
          title: `${article.title} | TypeOye Support`,
          description: article.description,
          canonicalPath: `/support/${article.slug}`,
        }
      : {
          title: 'Article Not Found | TypeOye Support',
          description:
            'The support article you are looking for does not exist or may have been moved. Visit the TypeOye Support Center.',
          canonicalPath: '/support',
          robots: 'noindex, nofollow',
        }
  );

  useEffect(() => {
    setFeedback(null);
  }, [article]);

  if (!article) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <div className="card p-10 text-center">
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Article not found</h1>
          <p className="mx-auto mt-2 max-w-md text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            The article you are looking for does not exist or may have been moved.
          </p>
          <Link to="/support" className="mt-6 inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110" style={{ background: 'linear-gradient(135deg, #4361EE 0%, #7C3AED 100%)' }}>
            <ArrowLeft size={15} /> Back to Support Center
          </Link>
        </div>
      </main>
    );
  }

  const meta = SUPPORT_CATEGORY_META[article.category];
  const Icon = meta.icon;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
      {/* Breadcrumb */}
      <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-sm" style={{ color: 'var(--color-text-muted)' }} data-testid="support-breadcrumb">
        <Link to="/support" className="font-semibold transition-colors hover:text-[var(--color-accent-text)]" style={{ color: 'var(--color-accent-text)' }}>
          Support Center
        </Link>
        <ChevronRight size={13} />
        <Link to="/support" className="font-semibold transition-colors hover:text-[var(--color-accent-text)]" style={{ color: 'var(--color-accent-text)' }}>
          {article.category}
        </Link>
        <ChevronRight size={13} />
        <span style={{ color: 'var(--color-text-primary)' }}>{article.title}</span>
      </nav>

      {/* Article */}
      <article className="card overflow-hidden p-6 sm:p-8" data-testid="support-article">
        <div className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.6875rem] font-bold uppercase tracking-wide" style={{ backgroundColor: meta.bg, color: meta.color }}>
          <Icon size={12} /> {article.category}
        </div>

        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: 'var(--color-text-primary)' }}>
          {article.title}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          <span>Last updated {article.updatedAt}</span>
          <span className="inline-flex items-center gap-1.5">
            <Clock size={14} /> {article.readTime} min read
          </span>
        </div>

        <div className="readable-text mt-8 flex flex-col gap-4 text-[0.9375rem] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          {article.body.map((paragraph, index) => {
            if (paragraph.startsWith('- ')) {
              return (
                <li key={index} className="ml-4 list-disc" dangerouslySetInnerHTML={{ __html: paragraph.replace(/^- /, '').replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--color-text-primary)">$1</strong>') }} />
              );
            }
            return (
              <p key={index} dangerouslySetInnerHTML={{ __html: paragraph.replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--color-text-primary)">$1</strong>') }} />
            );
          })}
        </div>

        {/* Feedback row */}
        <div className="mt-10 flex items-center gap-4 border-t pt-6" style={{ borderColor: 'var(--color-border)' }}>
          <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Was this article helpful?</span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setFeedback(feedback === 'up' ? null : 'up')} className={cn('flex h-9 w-9 items-center justify-center rounded-lg border transition-all', feedback === 'up' ? 'border-[#22C55E] bg-[rgba(34,197,94,0.1)] text-[#22C55E]' : 'text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent-text)]')} style={{ borderColor: feedback !== 'up' ? 'var(--color-border)' : undefined, backgroundColor: feedback !== 'up' ? 'var(--color-card)' : undefined }} aria-label="Yes, helpful" data-testid="feedback-up">
              <ThumbsUp size={16} />
            </button>
            <button type="button" onClick={() => setFeedback(feedback === 'down' ? null : 'down')} className={cn('flex h-9 w-9 items-center justify-center rounded-lg border transition-all', feedback === 'down' ? 'border-[#EF4444] bg-[rgba(239,68,68,0.1)] text-[#EF4444]' : 'text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent-text)]')} style={{ borderColor: feedback !== 'down' ? 'var(--color-border)' : undefined, backgroundColor: feedback !== 'down' ? 'var(--color-card)' : undefined }} aria-label="No, not helpful" data-testid="feedback-down">
              <ThumbsDown size={16} />
            </button>
          </div>
          {feedback && (
            <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {feedback === 'up' ? 'Thanks for your feedback!' : 'Sorry to hear that. We will work on improving this article.'}
            </span>
          )}
        </div>
      </article>

      {/* Back link */}
      <Link to="/support" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold transition-colors hover:text-[var(--color-accent-text)]" style={{ color: 'var(--color-accent-text)' }}>
        <ArrowLeft size={15} /> Back to Support Center
      </Link>
    </main>
  );
}
