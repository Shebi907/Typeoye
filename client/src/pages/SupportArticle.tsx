import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, ArrowRight, ChevronRight, Clock, ThumbsDown, ThumbsUp } from 'lucide-react';
import { SUPPORT_ARTICLES, SUPPORT_CATEGORY_META } from '../data/support';
import type { SupportArticle } from '../data/support';
import { cn } from '../utils/cn';
import { useSeo } from '../hooks/useSeo';

type BodyLine =
  | { kind: 'step'; number: number; text: string }
  | { kind: 'bullet'; text: string }
  | { kind: 'paragraph'; text: string };

/** Consecutive steps/bullets are grouped so they render as one contiguous list. */
function buildBody(lines: string[]): (BodyLine | BodyLine[])[] {
  const groups: (BodyLine | BodyLine[])[] = [];
  let pending: BodyLine[] = [];
  let pendingKind: 'step' | 'bullet' | null = null;
  const flush = () => {
    if (pending.length > 0) {
      groups.push(pending);
      pending = [];
      pendingKind = null;
    }
  };
  for (const raw of lines) {
    const step = raw.match(/^(\d+)\.\s+(.*)$/);
    if (step) {
      if (pendingKind !== 'step') flush();
      pendingKind = 'step';
      pending.push({ kind: 'step', number: Number(step[1]), text: step[2] });
      continue;
    }
    if (raw.startsWith('- ')) {
      if (pendingKind !== 'bullet') flush();
      pendingKind = 'bullet';
      pending.push({ kind: 'bullet', text: raw.replace(/^- /, '') });
      continue;
    }
    flush();
    groups.push({ kind: 'paragraph', text: raw });
  }
  flush();
  return groups;
}

type StepLine = Extract<BodyLine, { kind: 'step' }>;
type BulletLine = Extract<BodyLine, { kind: 'bullet' }>;

function isStepGroup(group: BodyLine | BodyLine[]): group is StepLine[] {
  return Array.isArray(group) && group[0].kind === 'step';
}

function isBulletGroup(group: BodyLine | BodyLine[]): group is BulletLine[] {
  return Array.isArray(group) && group[0].kind === 'bullet';
}

/** Converts the data's `**bold**` markers to styled <strong> for rich text. */
function toHtml(text: string): string {
  return text.replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--color-text-primary)">$1</strong>');
}

/** Related picks: prefer same-category siblings, then fill from other categories. */
function getRelated(article: SupportArticle): SupportArticle[] {
  return SUPPORT_ARTICLES.filter((a) => a.slug !== article.slug)
    .sort((a, b) => Number(b.category === article.category) - Number(a.category === article.category))
    .slice(0, 3);
}

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
  const bodyGroups = buildBody(article.body);
  const related = getRelated(article);

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
          {bodyGroups.map((group, gi) => {
            if (isStepGroup(group)) {
              return (
                <ol key={gi} className="flex flex-col gap-1.5">
                  {group.map((step, si) => (
                      <li
                        key={step.number}
                        className="flex items-start gap-3 rounded-lg px-3 py-2.5"
                        style={si % 2 === 1 ? { backgroundColor: 'var(--color-page)' } : undefined}
                      >
                        <span
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold text-white"
                          style={{ background: 'var(--color-accent)', boxShadow: '0 2px 6px rgba(67, 97, 238, 0.35)' }}
                        >
                          {step.number}
                        </span>
                        <span dangerouslySetInnerHTML={{ __html: toHtml(step.text) }} />
                      </li>
))}
                </ol>
              );
            }
            if (isBulletGroup(group)) {
              return (
                <ul key={gi} className="flex flex-col gap-1.5">
                  {group.map((item, si) => (
                    <li key={si} className="ml-3 list-disc" dangerouslySetInnerHTML={{ __html: toHtml(item.text) }} />
                  ))}
                </ul>
              );
            }
            return <p key={gi} dangerouslySetInnerHTML={{ __html: toHtml((group as BodyLine).text) }} />;
          })}

          {/* Important notes — amber callouts */}
          {article.notes && article.notes.length > 0 && (
            <div className="flex flex-col gap-3">
              {article.notes.map((note, ni) => (
                <aside key={ni} className="support-note" role="note">
                  <AlertCircle size={18} className="support-note-icon" />
                  <p className="text-[0.9375rem] leading-relaxed" dangerouslySetInnerHTML={{ __html: toHtml(note) }} />
                </aside>
              ))}
            </div>
          )}
        </div>
      </article>

      {/* Feedback — its own card */}
      <section
        className="card mt-6 flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7"
        data-testid="support-feedback"
      >
        <div>
          <h2 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Was this article helpful?
          </h2>
          <p className="mt-0.5 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Your feedback helps us improve our guides.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFeedback(feedback === 'up' ? null : 'up')}
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-xl border text-sm transition-all',
              feedback === 'up'
                ? 'border-[#22C55E] bg-[rgba(34,197,94,0.12)] text-[#16A34A]'
                : 'text-[var(--color-text-muted)] hover:border-[#22C55E] hover:bg-[rgba(34,197,94,0.08)] hover:text-[#22C55E]'
            )}
            style={{ borderColor: feedback !== 'up' ? 'var(--color-border)' : undefined, backgroundColor: feedback !== 'up' ? 'var(--color-card)' : undefined }}
            aria-label="Yes, this was helpful"
            data-testid="feedback-up"
          >
            <ThumbsUp size={17} />
          </button>
          <button
            type="button"
            onClick={() => setFeedback(feedback === 'down' ? null : 'down')}
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-xl border text-sm transition-all',
              feedback === 'down'
                ? 'border-[#EF4444] bg-[rgba(239,68,68,0.12)] text-[#DC2626]'
                : 'text-[var(--color-text-muted)] hover:border-[#EF4444] hover:bg-[rgba(239,68,68,0.08)] hover:text-[#EF4444]'
            )}
            style={{ borderColor: feedback !== 'down' ? 'var(--color-border)' : undefined, backgroundColor: feedback !== 'down' ? 'var(--color-card)' : undefined }}
            aria-label="No, this was not helpful"
            data-testid="feedback-down"
          >
            <ThumbsDown size={17} />
          </button>
          {feedback && (
            <span className="ml-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {feedback === 'up' ? 'Thanks for your feedback!' : 'Sorry to hear that. We will work on improving this article.'}
            </span>
          )}
        </div>
      </section>

      {/* Related articles */}
      {related.length > 0 && (
        <section className="card mt-6 p-6 sm:p-7" data-testid="support-related">
          <h2 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Related Articles
          </h2>
          <ul className="mt-4 flex flex-col gap-3">
            {related.map((a) => (
              <li key={a.slug}>
                <Link
                  to={`/support/${a.slug}`}
                  className="group inline-flex items-center gap-2 text-sm font-semibold transition-colors"
                  style={{ color: 'var(--color-accent-text)' }}
                >
                  <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                  {a.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Back link */}
      <Link to="/support" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold transition-colors hover:text-[var(--color-accent-text)]" style={{ color: 'var(--color-accent-text)' }}>
        <ArrowLeft size={15} /> Back to Support Center
      </Link>
    </main>
  );
}