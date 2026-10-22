import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle2, LockKeyhole, Play, BookOpen, GraduationCap,
  Keyboard, Blocks, Waves, Rocket, ArrowRight, Lightbulb, RefreshCw, AlertCircle,
} from 'lucide-react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { ProseSection } from '../components/content/ProseSection';
import { useSeo } from '../hooks/useSeo';
import { Modal } from '../components/ui/Modal';
import { Skeleton } from '../components/ui/Skeleton';
import { urduLessonService } from '../services/urduLesson.service';
import { getApiErrorMessage } from '../services/api';
import { useAuthStore } from '../store/authStore';
import type { CourseLesson } from '../types';
import { cn } from '../utils/cn';

type StageIcon = typeof Keyboard;

/** Urdu course sections in curriculum order; lessons render grouped by category. */
const SECTIONS: { category: string; label: string; labelUr: string; subtitle: string; icon: StageIcon }[] = [
  { category: 'foundation', label: 'Foundation', labelUr: 'بنیاد', subtitle: 'Levels 1–5 · حروف اور کی بورڈ', icon: Keyboard },
  { category: 'building-blocks', label: 'Building Blocks', labelUr: 'تعمیری حصے', subtitle: 'Levels 6–10 · جوڑ اور الفاظ', icon: Blocks },
  { category: 'flow-rhythm', label: 'Flow & Rhythm', labelUr: 'روانی اور تال', subtitle: 'Levels 11–14 · جملے، اوقاف اور پیراگراف', icon: Waves },
  { category: 'advanced', label: 'Advanced', labelUr: 'اعلیٰ درجہ', subtitle: 'Levels 15–16 · ہندسے، علامات اور پیشہ ورانہ متن', icon: Rocket },
];

const GRADIENT = 'linear-gradient(135deg, #4361EE 0%, #8B5CF6 100%)';

function progressPct(lesson: CourseLesson): number {
  if (lesson.completed) return 100;
  if (lesson.exerciseCount > 0) return Math.round((lesson.completedExercises / lesson.exerciseCount) * 100);
  return Math.min(90, lesson.completedExercises * 45);
}

function LearnSkeleton() {
  return (
    <div className="animate-pulse" aria-busy="true" data-testid="urdu-learn-loading">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <Skeleton width="64px" height="56px" rounded />
          <div className="space-y-2.5 flex-1 min-w-0">
            <Skeleton width="180px" height="1.9rem" />
            <Skeleton width="240px" height="0.9rem" />
          </div>
        </div>
        <Skeleton width="132px" height="42px" rounded />
      </div>
      <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar pb-2 mb-6">
        {['all', ...SECTIONS.map((s) => s.category)].map((cat, i) => (
          <Skeleton key={cat} width={i === 0 ? '72px' : '120px'} height="42px" rounded />
        ))}
      </div>
      {SECTIONS.map((section) => (
        <div key={section.category} className="mb-10">
          <div className="card p-4 sm:p-6 md:p-8 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden"
               style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
            <div className="space-y-3 flex-1">
              <Skeleton width="130px" height="0.7rem" />
              <Skeleton width="55%" height="1.7rem" />
              <Skeleton width="70%" height="0.9rem" />
            </div>
            <Skeleton width="104px" height="40px" rounded />
          </div>
          <div className="space-y-5 md:space-y-6">
            {[0, 1].map((row) => (
              <div key={row} className="flex items-stretch gap-4 md:gap-8">
                <div className="flex flex-col items-center pt-6 flex-shrink-0">
                  <Skeleton width="24px" height="24px" rounded="full" />
                </div>
                <div className="flex-1 min-w-0 card p-5" style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
                  <Skeleton width="45%" height="1.1rem" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function UrduLearn() {
  useSeo({
    title: 'Learn Urdu Typing Online – Urdu Typing Lessons | Typeoye',
    description: 'Learn Urdu typing online with structured lessons. Build Urdu typing accuracy, improve speed, and develop better keyboard skills with Typeoye.',
    canonicalPath: '/urdu-lessons',
  });
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isSessionChecked = useAuthStore((state) => state.isSessionChecked);
  const [lessons, setLessons] = useState<CourseLesson[]>(urduLessonService.getLessonsCached() ?? []);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [lockedPrompt, setLockedPrompt] = useState<CourseLesson | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const lessonsRef = useRef(lessons);
  lessonsRef.current = lessons;

  const handleLessonClick = async (e: React.MouseEvent, lessonId: string) => {
    e.preventDefault();
    document.body.style.cursor = 'wait';
    try {
      await urduLessonService.getLesson(lessonId);
      navigate(`/urdu-lessons/${lessonId}`);
    } finally {
      document.body.style.cursor = 'default';
    }
  };

  const hero = lessons.find((lesson) => lesson.unlocked && !lesson.completed) ?? null;
  const [activeCategory, setActiveCategory] = useState<string>('all');

  useEffect(() => {
    if (!isSessionChecked) return;
    let current = true;
    setLoading(true);
    setLoadError('');
    urduLessonService.getLessons()
      .then((result) => { if (current) setLessons(result); })
      .catch((err) => {
        if (!current) return;
        setLessons([]);
        setLoadError(err?.isAxiosError
          ? getApiErrorMessage(err, 'Unable to load Urdu Learn levels.')
          : (err instanceof Error ? err.message : 'Unable to load Urdu Learn levels.'));
      })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [isSessionChecked, isAuthenticated, reloadKey]);

  useEffect(() => {
    const focusOrder = searchParams.get('focus');
    if (!focusOrder || loading || !activeCategory) return;
    const focusLesson = lessons.find((l) => l.order === Number(focusOrder));
    if (focusLesson && focusLesson.category !== activeCategory) setActiveCategory(focusLesson.category);
    const timer = setTimeout(() => {
      const el = document.querySelector(`[data-testid="urdu-lesson-card-${focusOrder}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('lesson-highlight-pulse');
        const removeTimer = setTimeout(() => el.classList.remove('lesson-highlight-pulse'), 2200);
        return () => clearTimeout(removeTimer);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [searchParams, loading, lessons, activeCategory]);

  const renderCompletedCard = (lesson: CourseLesson) => (
    <Link to={`/urdu-lessons/${lesson._id}`} onClick={(e) => handleLessonClick(e, lesson._id)} className="block card p-5 border border-[rgba(34,197,94,0.3)] hover:shadow-lg hover:-translate-y-0.5 transition-all group relative overflow-hidden bg-[var(--color-card)]" data-testid={`urdu-completed-level-${lesson.order}`}>
      <div className="absolute top-0 right-0 w-24 h-24 bg-[rgba(34,197,94,0.05)] rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 relative z-10">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[rgba(34,197,94,0.15)] text-[var(--color-correct)] flex-shrink-0 group-hover:scale-110 transition-transform">
          <CheckCircle2 size={24} />
        </div>
        <div className="flex-1 w-full">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
            <h3 className="text-base font-bold text-[var(--color-text-primary)]">{lesson.order}. <span dir="rtl" className="font-urdu">{lesson.title}</span>{lesson.titleEn ? <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}> · {lesson.titleEn}</span> : null}</h3>
            <span className="text-[0.625rem] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-[rgba(34,197,94,0.1)] text-[var(--color-correct)]" data-testid="urdu-completed-pill">Completed</span>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] mb-2.5">{lesson.description}</p>
          <div className="flex items-center gap-3">
            <p className="text-xs font-semibold text-[var(--color-correct)]">
              {lesson.exerciseCount} exercises · best accuracy {lesson.bestAccuracy}%
            </p>
            <span className="text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity text-[var(--color-accent-text)]">Replay →</span>
          </div>
        </div>
      </div>
    </Link>
  );

  const renderCurrentCard = (lesson: CourseLesson) => {
    const pct = progressPct(lesson);
    return (
      <Link to={`/urdu-lessons/${lesson._id}`} onClick={(e) => handleLessonClick(e, lesson._id)} className="block card p-5 border-2 border-[var(--color-accent-text)] shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all relative overflow-hidden bg-[var(--color-card)] group" data-testid="urdu-hero-level">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white flex-shrink-0 group-hover:scale-105 transition-transform shadow-md" style={{ background: GRADIENT }}>
            <Play size={22} fill="currentColor" className="ml-0.5" />
          </div>
          <div className="flex-1 w-full min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <h3 className="text-base font-extrabold text-[var(--color-text-primary)] truncate">{lesson.order}. <span dir="rtl" className="font-urdu">{lesson.title}</span>{lesson.titleEn ? <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}> · {lesson.titleEn}</span> : null}</h3>
              <span className="text-[0.625rem] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full text-white flex-shrink-0" style={{ background: GRADIENT }} data-testid="urdu-hero-pill">
                {pct > 0 ? 'In Progress' : 'Ready'}
              </span>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] mb-3">{lesson.description}</p>
            <div className="flex items-center gap-3 w-full">
              <div className="h-2 rounded-full bg-[var(--color-border)] flex-1 max-w-[12.5rem] overflow-hidden">
                <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: GRADIENT }} />
              </div>
              <span className="text-xs font-bold text-[var(--color-accent-text)]">{pct}%</span>
              <span className="text-xs text-[var(--color-text-secondary)] font-medium ml-auto hidden sm:inline-block">
                {lesson.completedExercises}/{lesson.exerciseCount} exercises
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  };

  const renderLockedCard = (lesson: CourseLesson) => {
    const row = (
      <div className="card p-5 border border-[var(--color-border)] bg-[var(--color-page)] opacity-70 group hover:opacity-100 transition-opacity" data-testid="urdu-locked-row">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-[var(--color-border)] text-[var(--color-text-muted)] flex-shrink-0">
            <LockKeyhole size={20} />
          </div>
          <div className="flex-1 w-full min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <h3 className="text-base font-bold text-[var(--color-text-secondary)] truncate">{lesson.order}. <span dir="rtl" className="font-urdu">{lesson.title}</span>{lesson.titleEn ? <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}> · {lesson.titleEn}</span> : null}</h3>
              <span className="text-[0.625rem] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-[var(--color-border)] text-[var(--color-text-muted)] flex-shrink-0" data-testid="urdu-locked-pill">Locked</span>
            </div>
            <p className="text-sm text-[var(--color-text-muted)] line-clamp-1">{lesson.description}</p>
          </div>
        </div>
      </div>
    );
    return isAuthenticated
      ? <div className="block">{row}</div>
      : <button type="button" onClick={() => setLockedPrompt(lesson)} className="block w-full text-left cursor-pointer">{row}</button>;
  };

  const activeSectionInfo = activeCategory !== 'all' ? SECTIONS.find((s) => s.category === activeCategory) : null;
  const sectionLessons = activeCategory !== 'all' ? lessons.filter((l) => l.category === activeCategory) : [];
  const doneCount = sectionLessons.filter((l) => l.completed).length;

  const renderTimeline = (list: CourseLesson[]) => (
    <div className="relative pl-3 md:pl-10">
      <div className="absolute left-[1.3125rem] md:left-[3.0625rem] top-8 bottom-8 w-0.5 bg-[var(--color-border)] z-0" />
      <div className="space-y-5 md:space-y-6 relative z-10">
        {list.map((lesson) => {
          const isCompleted = lesson.completed;
          const isLocked = !lesson.unlocked;
          const isCurrent = !isCompleted && !isLocked;
          return (
            <div key={lesson._id} className="flex items-stretch gap-4 md:gap-8" data-testid={`urdu-lesson-card-${lesson.order}`}>
              <div className="flex flex-col items-center pt-6">
                {isCompleted ? (
                  <div className="w-6 h-6 rounded-full bg-[var(--color-correct)] text-white flex items-center justify-center flex-shrink-0 relative z-10 shadow-sm border-2 border-white dark:border-[var(--color-page)]">
                    <CheckCircle2 size={14} />
                  </div>
                ) : isCurrent ? (
                  <div className="w-6 h-6 rounded-full border-[0.375rem] border-[var(--color-accent-text)] bg-white dark:bg-[var(--color-page)] flex-shrink-0 relative z-10 shadow-sm" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-[var(--color-border)] bg-[var(--color-page)] flex-shrink-0 relative z-10 mt-0.5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                {isCompleted ? renderCompletedCard(lesson) : isCurrent ? renderCurrentCard(lesson) : renderLockedCard(lesson)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (!isSessionChecked || loading) {
    return (
      <PageWrapper title="Learn Urdu Typing" noHeader fullWidth className="py-8 sm:py-12 px-4 sm:px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto w-full overflow-hidden">
          <LearnSkeleton />
        </div>
      </PageWrapper>
    );
  }

  if (loadError || lessons.length === 0) {
    return (
      <PageWrapper title="Learn Urdu Typing" noHeader fullWidth className="py-8 sm:py-12 px-4 sm:px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto w-full">
          <div className="card p-6 sm:p-8 text-center" role={loadError ? 'alert' : undefined}>
            <AlertCircle size={28} className="mx-auto" style={{ color: 'var(--color-accent-text)' }} />
            <h1 className="text-xl font-bold mt-3">{loadError ? 'Urdu Learn levels could not be loaded' : 'No Urdu Learn levels are available'}</h1>
            <p className="text-sm text-secondary mt-2">{loadError || 'Please try again in a moment.'}</p>
            <button type="button" className="btn btn-primary px-4 py-2 mt-5" onClick={() => { urduLessonService.clearCache(); setReloadKey((key) => key + 1); }}>
              <RefreshCw size={15} /> Try again
            </button>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Learn Urdu Typing" noHeader fullWidth className="py-8 sm:py-12 px-4 sm:px-6 overflow-hidden">
      <div className="max-w-5xl mx-auto w-full overflow-hidden">

        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-white flex-shrink-0" style={{ background: GRADIENT, boxShadow: '0 8px 24px rgba(67,97,238,0.3)' }}>
              <GraduationCap size={32} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-primary)] tracking-tight">Learn Urdu Typing</h1>
              <p dir="rtl" className="font-urdu text-base sm:text-lg text-[var(--color-text-secondary)] mt-1 max-w-[25rem] leading-loose">مرحلہ وار اسباق کے ساتھ اردو ٹائپنگ سیکھیں۔</p>
            </div>
          </div>
          <div className="flex items-center gap-3.5 p-3 sm:p-4 rounded-xl flex-shrink-0" style={{ backgroundColor: 'rgba(139, 92, 246, 0.06)', border: '1px solid rgba(139, 92, 246, 0.15)' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--color-accent-text)] bg-[var(--color-page)] shadow-sm flex-shrink-0">
              <Lightbulb size={20} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Built for Urdu learners</h3>
              <p className="text-[0.6875rem] sm:text-xs text-[var(--color-text-secondary)] mt-0.5 max-w-[12.5rem] leading-snug">Start with letters and build up to full paragraphs, step by step.</p>
            </div>
          </div>
        </div>

        {!isAuthenticated && (
          <div className="mb-8">
            <div className="rounded-xl px-5 py-4 text-sm flex items-start gap-3 border shadow-sm" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
              <BookOpen size={18} className="flex-none mt-0.5" style={{ color: 'var(--color-accent-text)' }} />
              <span className="text-[var(--color-text-secondary)] leading-relaxed">
                You're browsing as a guest — Level 1 is free to try. <Link to="/register" className="font-semibold" style={{ color: 'var(--color-accent-text)' }}>Sign in to unlock the rest of the course</Link> and save your Urdu lesson progress.
              </span>
            </div>
          </div>
        )}

        {/* Recommended lesson */}
        {hero && (
          <section
            className="mb-10 p-5 sm:p-7 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden"
            style={{ background: GRADIENT, boxShadow: '0 14px 34px -10px rgba(67, 97, 238, 0.45)' }}
            data-testid="urdu-recommended-next"
          >
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[inherit]" aria-hidden="true">
              <span className="navbar-gradient-circle w-48 h-48 -right-16 -top-24 opacity-80" />
              <span className="navbar-gradient-circle w-36 h-36 -left-12 -bottom-20 opacity-60" />
            </div>
            <div className="flex items-start sm:items-center gap-5 relative z-10 w-full md:w-auto flex-1">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center bg-white/20 text-white flex-shrink-0 shadow-inner" style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.3)' }}>
                <Play size={28} fill="currentColor" className="ml-1" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[0.625rem] sm:text-xs font-bold uppercase tracking-widest text-[#FFD98E] mb-1">Recommended Next Level</p>
                <h2 className="text-lg sm:text-2xl font-bold text-white mb-1.5 line-clamp-2">Level {hero.order} — <span dir="rtl" className="font-urdu">{hero.title}</span>{hero.titleEn ? <span className="font-medium text-white/80"> · {hero.titleEn}</span> : null}</h2>
                <p className="text-sm text-white/85 line-clamp-1 mb-3">{hero.description}</p>
                <div className="flex items-center gap-3">
                  <div className="h-1.5 sm:h-2 rounded-full bg-white/20 flex-1 max-w-[15rem] overflow-hidden">
                    <div className="h-full rounded-full bg-white transition-all duration-300" style={{ width: `${progressPct(hero)}%` }} />
                  </div>
                  <span className="text-xs font-bold text-white/90">{progressPct(hero)}%</span>
                </div>
              </div>
            </div>
            <Link
              to={`/urdu-lessons/${hero._id}`}
              onClick={(e) => handleLessonClick(e, hero._id)}
              className="relative z-10 w-full md:w-auto flex-shrink-0 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold bg-white text-[#4361EE] shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              Continue <ArrowRight size={16} />
            </Link>
          </section>
        )}

        {/* Category navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 sm:mb-8 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            onClick={() => setActiveCategory('all')}
            className={cn(
              'whitespace-nowrap px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex-shrink-0',
              activeCategory === 'all'
                ? 'text-[var(--color-accent-text)] bg-[rgba(67,97,238,0.08)] border border-[rgba(67,97,238,0.2)] shadow-sm'
                : 'text-[var(--color-text-secondary)] bg-[var(--color-card)] border border-[var(--color-border)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-page)] hover:shadow-sm'
            )}
            data-testid="urdu-category-tab-all"
          >
            All
          </button>
          {SECTIONS.map(({ category, label, labelUr }) => {
            const isSelected = activeCategory === category;
            return (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={cn(
                  'whitespace-nowrap px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex-shrink-0',
                  isSelected
                    ? 'text-[var(--color-accent-text)] bg-[rgba(67,97,238,0.08)] border border-[rgba(67,97,238,0.2)] shadow-sm'
                    : 'text-[var(--color-text-secondary)] bg-[var(--color-card)] border border-[var(--color-border)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-page)] hover:shadow-sm'
                )}
                data-testid={`urdu-category-tab-${category}`}
              >
                {label} · <span dir="rtl" className="font-urdu opacity-80">{labelUr}</span>
              </button>
            );
          })}
        </div>

        {/* Sections */}
        {loading || !activeCategory ? (
          <LearnSkeleton />
        ) : activeCategory === 'all' ? (
          <div className="space-y-12">
            {SECTIONS.map((section, sIndex) => {
              const sLessons = lessons.filter((l) => l.category === section.category);
              if (sLessons.length === 0) return null;
              const sDone = sLessons.filter((l) => l.completed).length;
              const StageIconComponent = section.icon;
              return (
                <div key={section.category} className="mb-10" data-testid={`urdu-stage-section-${section.category}`}>
                  <div className="card p-4 sm:p-6 md:p-8 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden bg-[var(--color-card)] border border-[var(--color-border)]">
                    <div className="absolute -right-8 -bottom-10 opacity-[0.03] pointer-events-none text-[var(--color-text-primary)]">
                      <StageIconComponent size={160} />
                    </div>
                    <div className="relative z-10">
                      <div className="text-[0.625rem] font-bold uppercase tracking-widest text-[var(--color-accent-text)] mb-2">
                        STAGE {sIndex + 1} — {section.label.toUpperCase()} · <span dir="rtl" className="font-urdu">{section.labelUr}</span>
                      </div>
                      <h2 className="text-2xl font-extrabold text-[var(--color-text-primary)] mb-1">
                        {section.subtitle.split('·')[1]?.trim() || section.subtitle}
                      </h2>
                      <p className="text-[var(--color-text-secondary)]">{section.subtitle.split('·')[0]?.trim()}</p>
                    </div>
                    <div className="relative z-10 md:text-right flex items-center md:flex-col gap-4 md:gap-1">
                      <div className="inline-block px-4 py-2 rounded-xl bg-[rgba(34,197,94,0.1)] text-[var(--color-correct)] font-bold text-lg border border-[rgba(34,197,94,0.15)]">
                        {sDone} / {sLessons.length} <span className="text-xs uppercase tracking-wider opacity-90 ml-1">Done</span>
                      </div>
                    </div>
                  </div>
                  {renderTimeline(sLessons)}
                </div>
              );
            })}
          </div>
        ) : activeSectionInfo && sectionLessons.length > 0 ? (
          <div className="mb-10">
            <div className="card p-4 sm:p-6 md:p-8 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden bg-[var(--color-card)] border border-[var(--color-border)]">
              <div className="absolute -right-8 -bottom-10 opacity-[0.03] pointer-events-none text-[var(--color-text-primary)]">
                <activeSectionInfo.icon size={160} />
              </div>
              <div className="relative z-10">
                <div className="text-[0.625rem] font-bold uppercase tracking-widest text-[var(--color-accent-text)] mb-2">
                  STAGE {SECTIONS.indexOf(activeSectionInfo) + 1} — {activeSectionInfo.label.toUpperCase()} · <span dir="rtl" className="font-urdu">{activeSectionInfo.labelUr}</span>
                </div>
                <h2 className="text-2xl font-extrabold text-[var(--color-text-primary)] mb-1">
                  {activeSectionInfo.subtitle.split('·')[1]?.trim() || activeSectionInfo.subtitle}
                </h2>
                <p className="text-[var(--color-text-secondary)]">{activeSectionInfo.subtitle.split('·')[0]?.trim()}</p>
              </div>
              <div className="relative z-10 md:text-right flex items-center md:flex-col gap-4 md:gap-1">
                <div className="inline-block px-4 py-2 rounded-xl bg-[rgba(34,197,94,0.1)] text-[var(--color-correct)] font-bold text-lg border border-[rgba(34,197,94,0.15)]">
                  {doneCount} / {sectionLessons.length} <span className="text-xs uppercase tracking-wider opacity-90 ml-1">Done</span>
                </div>
              </div>
            </div>
            {renderTimeline(sectionLessons)}
          </div>
        ) : (
          <div className="card p-6 text-center text-sm text-secondary">No levels are currently available in this stage.</div>
        )}

        <ProseSection title="About the Urdu Learn course" learnMoreLabel="Learn more about the Urdu Learn course" icon={GraduationCap}>
          <p>
            The Urdu Learn course is a structured path to Urdu touch typing — 16 lessons organized into four
            stages that build on each other. Like the English course, levels unlock in order: finish a lesson
            and the next one opens, so your skills accumulate in a deliberate sequence.
          </p>
          <p>
            <strong>The four stages.</strong> Foundation (Levels 1–5) covers the home row, top row, bottom row,
            shift-layer letters and the number/punctuation keys. Building Blocks (Levels 6–10) moves into letter
            combinations and everyday vocabulary. Flow &amp; Rhythm (Levels 11–14) introduces sentences,
            punctuation and paragraphs. Advanced (Levels 15–16) finishes with numbers, symbols and longer
            real-world text.
          </p>
          <p>
            Typing uses the same phonetic Urdu keyboard layout as the Urdu Typing Test and Urdu Practice, so
            what you learn here carries over directly. Your Urdu progress is tracked separately from the English
            course and saves when you're signed in; as a guest, Level 1 is free to try.
          </p>
        </ProseSection>

        {!isAuthenticated && (
          <Modal isOpen={lockedPrompt !== null} onClose={() => setLockedPrompt(null)} title={lockedPrompt ? `Level ${lockedPrompt.order} is locked` : 'Level locked'} size="sm">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center" style={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent-text)' }}>
                <LockKeyhole size={26} />
              </div>
              <h3 className="text-lg font-bold mt-4">Sign in to unlock the rest of the course</h3>
              <p className="text-sm text-secondary mt-2 leading-relaxed">
                As a guest you can practice Level 1. Create a free account to track your Urdu progress and unlock all {lessons.length} levels.
              </p>
              <div className="flex flex-col gap-2.5 mt-6">
                <Link to="/login" className="btn btn-primary px-5 py-2.5 w-full justify-center">Sign in</Link>
                <Link to="/register" className="btn btn-secondary px-5 py-2.5 w-full justify-center">Create free account</Link>
                <button type="button" className="btn btn-ghost px-5 py-2 w-full justify-center" onClick={() => setLockedPrompt(null)}>Not now</button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </PageWrapper>
  );
}
