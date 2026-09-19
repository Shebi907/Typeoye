import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, LockKeyhole, Play, BookOpen, GraduationCap, 
  Keyboard, Blocks, Waves, Rocket, ArrowRight, Lightbulb 
} from 'lucide-react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { ProseSection } from '../components/content/ProseSection';
import { useSeo } from '../hooks/useSeo';
import { Modal } from '../components/ui/Modal';
import { Skeleton } from '../components/ui/Skeleton';
import { lessonService } from '../services/lesson.service';
import { useAuthStore } from '../store/authStore';
import type { CourseLesson } from '../types';
import { cn } from '../utils/cn';

type StageIcon = typeof Keyboard;

/** Course sections in curriculum order; lessons render grouped by category. */
const SECTIONS: { category: string; label: string; subtitle: string; icon: StageIcon }[] = [
  { category: 'foundation', label: 'Foundation', subtitle: 'Levels 1–5 · Hand position and key layout', icon: Keyboard },
  { category: 'building-blocks', label: 'Building Blocks', subtitle: 'Levels 6–10 · Letter patterns and everyday vocabulary', icon: Blocks },
  { category: 'flow-rhythm', label: 'Flow & Rhythm', subtitle: 'Levels 11–14 · Sentences, punctuation and paragraphs', icon: Waves },
  { category: 'advanced', label: 'Advanced', subtitle: 'Levels 15–16 · Numbers, symbols and professional text', icon: Rocket },
];

const GRADIENT = 'linear-gradient(135deg, #4361EE 0%, #8B5CF6 100%)';
const GREEN_GRADIENT = 'linear-gradient(135deg, #16A34A 0%, #22C55E 100%)';

function progressPct(lesson: CourseLesson): number {
  if (lesson.completed) return 100;
  if (lesson.exerciseCount > 0) return Math.round((lesson.completedExercises / lesson.exerciseCount) * 100);
  return Math.min(90, lesson.completedExercises * 45);
}

/** Stable shell that mirrors the loaded Learn layout so the footer never
 *  jumps while lesson data loads. */
function LearnSkeleton() {
  return (
    <div aria-busy="true" data-testid="learn-loading">
      <div className="card p-6 md:p-8 mb-8 flex flex-col md:flex-row justify-between gap-6 bg-[var(--color-card)] border border-[var(--color-border)]">
        <div className="space-y-3 flex-1">
           <Skeleton width="100px" height="0.8rem" />
           <Skeleton width="60%" height="1.8rem" />
           <Skeleton width="140px" height="1rem" />
        </div>
        <Skeleton width="120px" height="48px" rounded />
      </div>
      
      <div className="relative pl-3 md:pl-10 space-y-6">
        {[0, 1, 2, 3].map((row) => (
          <div key={row} className="flex items-stretch gap-5 md:gap-8">
            <div className="flex flex-col items-center pt-6">
               <Skeleton width="24px" height="24px" rounded="full" />
            </div>
            <div className="flex-1 min-w-0 card p-5 border border-[var(--color-border)] bg-[var(--color-card)]">
               <div className="flex items-center gap-5">
                 <Skeleton width="48px" height="48px" rounded />
                 <div className="space-y-2 flex-1">
                   <Skeleton width="40%" height="1.2rem" />
                   <Skeleton width="80%" height="0.8rem" />
                 </div>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Learn() {
  useSeo({
    title: 'Learn Touch Typing Online – Typing Lessons | TypeOye',
    description: 'Learn touch typing online with structured lessons and practice. Build typing accuracy, improve speed, and develop better keyboard skills with TypeOye.',
    canonicalPath: '/lessons',
  });
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isSessionChecked = useAuthStore((state) => state.isSessionChecked);
  const [lessons, setLessons] = useState<CourseLesson[]>(lessonService.getLessonsCached() ?? []);
  const [loading, setLoading] = useState(true);
  const [lockedPrompt, setLockedPrompt] = useState<CourseLesson | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const lessonsRef = useRef(lessons);
  lessonsRef.current = lessons;

  const handleLessonClick = async (e: React.MouseEvent, lessonId: string) => {
    e.preventDefault();
    document.body.style.cursor = 'wait';
    try {
      await lessonService.getLesson(lessonId);
      navigate(`/lessons/${lessonId}`);
    } finally {
      document.body.style.cursor = 'default';
    }
  };

  const hero = lessons.find((lesson) => lesson.unlocked && !lesson.completed) ?? null;

  // Track the active category to show (defaults to 'all')
  const [activeCategory, setActiveCategory] = useState<string>('all');

  useEffect(() => { lessonService.getLessons().then(setLessons).finally(() => setLoading(false)); }, []);

  // Auto-scroll + highlight when ?focus=N is present
  useEffect(() => {
    const focusOrder = searchParams.get('focus');
    if (!focusOrder || loading || !activeCategory) return;
    
    // Switch to the correct category if focused lesson is not in the current one
    const focusLesson = lessons.find(l => l.order === Number(focusOrder));
    if (focusLesson && focusLesson.category !== activeCategory) {
      setActiveCategory(focusLesson.category);
    }

    const timer = setTimeout(() => {
      const el = document.querySelector(`[data-testid="lesson-card-${focusOrder}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('lesson-highlight-pulse');
        const removeTimer = setTimeout(() => el.classList.remove('lesson-highlight-pulse'), 2200);
        return () => clearTimeout(removeTimer);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [searchParams, loading, lessons, activeCategory]);

  // ── Render Completed Card ─────────────────────────────────────────────
  const renderCompletedCard = (lesson: CourseLesson) => (
    <Link to={`/lessons/${lesson._id}`} onClick={(e) => handleLessonClick(e, lesson._id)} className="block card p-5 border border-[rgba(34,197,94,0.3)] hover:shadow-lg hover:-translate-y-0.5 transition-all group relative overflow-hidden bg-[var(--color-card)]" data-testid={`completed-level-${lesson.order}`}>
       <div className="absolute top-0 right-0 w-24 h-24 bg-[rgba(34,197,94,0.05)] rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />
       <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 relative z-10">
         <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[rgba(34,197,94,0.15)] text-[var(--color-correct)] flex-shrink-0 group-hover:scale-110 transition-transform">
           <CheckCircle2 size={24} />
         </div>
         <div className="flex-1 w-full">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
               <h3 className="text-base font-bold text-[var(--color-text-primary)]">{lesson.order}. {lesson.title}</h3>
               <span className="text-[0.625rem] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-[rgba(34,197,94,0.1)] text-[var(--color-correct)]" data-testid="completed-pill">Completed</span>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] mb-2.5">{lesson.description}</p>
            <div className="flex items-center gap-3">
              <p className="text-xs font-semibold text-[var(--color-correct)]">
                {lesson.exerciseCount} exercises · best accuracy {lesson.bestAccuracy}%
              </p>
              <span className="text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity text-[var(--color-accent-text)]">
                Replay →
              </span>
            </div>
         </div>
       </div>
    </Link>
  );

  // ── Render Current/Active Card ─────────────────────────────────────────
  const renderCurrentCard = (lesson: CourseLesson) => {
    const pct = progressPct(lesson);
    return (
      <Link to={`/lessons/${lesson._id}`} onClick={(e) => handleLessonClick(e, lesson._id)} className="block card p-5 border-2 border-[var(--color-accent-text)] shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all relative overflow-hidden bg-[var(--color-card)] group" data-testid="hero-level">
         <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
           <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white flex-shrink-0 group-hover:scale-105 transition-transform shadow-md" style={{ background: GRADIENT }}>
             <Play size={22} fill="currentColor" className="ml-0.5" />
           </div>
           <div className="flex-1 w-full min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                 <h3 className="text-base font-extrabold text-[var(--color-text-primary)] truncate">{lesson.order}. {lesson.title}</h3>
                 <span className="text-[0.625rem] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full text-white flex-shrink-0" style={{ background: GRADIENT }} data-testid="hero-pill">
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

  // ── Render Locked Card ────────────────────────────────────────────────
  const renderLockedCard = (lesson: CourseLesson) => {
    const row = (
      <div className="card p-5 border border-[var(--color-border)] bg-[var(--color-page)] opacity-70 group hover:opacity-100 transition-opacity" data-testid="locked-row">
         <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
           <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-[var(--color-border)] text-[var(--color-text-muted)] flex-shrink-0">
             <LockKeyhole size={20} />
           </div>
           <div className="flex-1 w-full min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                 <h3 className="text-base font-bold text-[var(--color-text-secondary)] truncate">{lesson.order}. {lesson.title}</h3>
                 <span className="text-[0.625rem] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-[var(--color-border)] text-[var(--color-text-muted)] flex-shrink-0" data-testid="locked-pill">Locked</span>
              </div>
              <p className="text-sm text-[var(--color-text-muted)] line-clamp-1">{lesson.description}</p>
           </div>
         </div>
      </div>
    );
    return isAuthenticated ? (
      <div className="block">{row}</div>
    ) : (
      <button type="button" onClick={() => setLockedPrompt(lesson)} className="block w-full text-left cursor-pointer">{row}</button>
    );
  };

  const activeSectionInfo = activeCategory !== 'all' ? SECTIONS.find(s => s.category === activeCategory) : null;
  const sectionLessons = activeCategory !== 'all' ? lessons.filter(l => l.category === activeCategory) : [];
  const doneCount = sectionLessons.filter(l => l.completed).length;

  if (!isSessionChecked || loading) {
    return (
      <PageWrapper title="Learn to Type" noHeader fullWidth className="py-8 sm:py-12 px-4 sm:px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto w-full overflow-hidden">
          <LearnSkeleton />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Learn to Type" noHeader fullWidth className="py-8 sm:py-12 px-4 sm:px-6 overflow-hidden">
      <div className="max-w-5xl mx-auto w-full overflow-hidden">
        
        {/* ── 1. Page Header ────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-white flex-shrink-0" style={{ background: GRADIENT, boxShadow: '0 8px 24px rgba(67,97,238,0.3)' }}>
               <GraduationCap size={32} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-primary)] tracking-tight">Learn Touch Typing</h1>
              <p className="text-sm sm:text-base text-[var(--color-text-secondary)] mt-0.5 sm:mt-1 max-w-[25rem] leading-relaxed">Follow structured typing lessons and improve your speed and accuracy step by step.</p>
            </div>
          </div>
          <div className="flex items-center gap-3.5 p-3 sm:p-4 rounded-xl flex-shrink-0" style={{ backgroundColor: 'rgba(139, 92, 246, 0.06)', border: '1px solid rgba(139, 92, 246, 0.15)' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--color-accent-text)] bg-[var(--color-page)] shadow-sm flex-shrink-0">
               <Lightbulb size={20} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Typing Faster Starts Here</h3>
              <p className="text-[0.6875rem] sm:text-xs text-[var(--color-text-secondary)] mt-0.5 max-w-[11.25rem] sm:max-w-[12.5rem] leading-snug">Practice regularly, build confidence and see real improvement.</p>
            </div>
          </div>
        </div>

        {!isAuthenticated && (
          <div className="mb-8">
            <div className="rounded-xl px-5 py-4 text-sm flex items-start gap-3 border shadow-sm" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
              <BookOpen size={18} className="flex-none mt-0.5" style={{ color: 'var(--color-accent-text)' }} />
              <span className="text-[var(--color-text-secondary)] leading-relaxed">
                You're browsing as a guest — Level 1 is free to try. <Link to="/register" className="font-semibold" style={{ color: 'var(--color-accent-text)' }}>Sign in to unlock the rest of the course</Link> and save your lesson progress.
              </span>
            </div>
          </div>
        )}

        {/* ── 2. Recommended Lesson Card ─────────────────────────────────── */}
        {hero && (
          <section
            className="mb-10 p-5 sm:p-7 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden"
            style={{ background: GRADIENT, boxShadow: '0 14px 34px -10px rgba(67, 97, 238, 0.45)' }}
            data-testid="recommended-next"
          >
            {/* Background decor */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[inherit]" aria-hidden="true">
              <span className="navbar-gradient-circle w-48 h-48 -right-16 -top-24 opacity-80" />
              <span className="navbar-gradient-circle w-36 h-36 -left-12 -bottom-20 opacity-60" />
            </div>
            
            <div className="flex items-start sm:items-center gap-5 relative z-10 w-full md:w-auto flex-1">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center bg-white/20 text-white flex-shrink-0 shadow-inner" style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.3)' }}>
                <Play size={28} fill="currentColor" className="ml-1" />
              </div>
              <div className="flex-1 min-w-0">
                 <p className="text-[0.625rem] sm:text-xs font-bold uppercase tracking-widest text-[#FFD98E] mb-1">
                   Recommended Next Lesson
                 </p>
                 <h2 className="text-xl sm:text-2xl font-bold text-white mb-1.5 truncate">Level {hero.order} — {hero.title}</h2>
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
               to={`/lessons/${hero._id}`}
               onClick={(e) => handleLessonClick(e, hero._id)}
               className="relative z-10 w-full md:w-auto flex-shrink-0 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold bg-white text-[var(--color-accent-text)] shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
               Continue <ArrowRight size={16} />
            </Link>
          </section>
        )}

        {/* ── 3. Category Navigation ─────────────────────────────────────── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 sm:mb-8 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            onClick={() => setActiveCategory('all')}
            className={cn(
              "whitespace-nowrap px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex-shrink-0",
              activeCategory === 'all' 
                ? "text-[var(--color-accent-text)] bg-[rgba(67,97,238,0.08)] border border-[rgba(67,97,238,0.2)] shadow-sm" 
                : "text-[var(--color-text-secondary)] bg-[var(--color-card)] border border-[var(--color-border)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border)] hover:bg-[var(--color-page)] hover:shadow-sm"
            )}
            data-testid="category-tab-all"
          >
            All
          </button>
          {SECTIONS.map(({ category, label }) => {
            const isSelected = activeCategory === category;
            return (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={cn(
                  "whitespace-nowrap px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex-shrink-0",
                  isSelected 
                    ? "text-[var(--color-accent-text)] bg-[rgba(67,97,238,0.08)] border border-[rgba(67,97,238,0.2)] shadow-sm" 
                    : "text-[var(--color-text-secondary)] bg-[var(--color-card)] border border-[var(--color-border)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border)] hover:bg-[var(--color-page)] hover:shadow-sm"
                )}
                data-testid={`category-tab-${category}`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* ── 4. Stage Section & Lesson List ─────────────────────────────── */}
        {loading || !activeCategory ? (
          <LearnSkeleton />
        ) : activeCategory === 'all' ? (
          <div className="space-y-12">
            {SECTIONS.map((section, sIndex) => {
              const sLessons = lessons.filter(l => l.category === section.category);
              const sDone = sLessons.filter(l => l.completed).length;
              const StageIconComponent = section.icon;
              return (
                <div key={section.category} className="mb-10" data-testid={`stage-section-${section.category}`}>
                  {/* Stage Header Card */}
                  <div className="card p-4 sm:p-6 md:p-8 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden bg-[var(--color-card)] border border-[var(--color-border)]">
                    <div className="absolute -right-8 -bottom-10 opacity-[0.03] pointer-events-none text-[var(--color-text-primary)]">
                       <StageIconComponent size={160} />
                    </div>
                    <div className="relative z-10">
                      <div className="text-[0.625rem] font-bold uppercase tracking-widest text-[var(--color-accent-text)] mb-2">STAGE {sIndex + 1} — {section.label.toUpperCase()}</div>
                      <h2 className="text-2xl font-extrabold text-[var(--color-text-primary)] mb-1">
                        {section.subtitle.split('·')[1]?.trim() || section.subtitle}
                      </h2>
                      <p className="text-[var(--color-text-secondary)]">
                        {section.subtitle.split('·')[0]?.trim()}
                      </p>
                    </div>
                    <div className="relative z-10 md:text-right flex items-center md:flex-col gap-4 md:gap-1">
                      <div className="inline-block px-4 py-2 rounded-xl bg-[rgba(34,197,94,0.1)] text-[var(--color-correct)] font-bold text-lg border border-[rgba(34,197,94,0.15)]">
                        {sDone} / {sLessons.length} <span className="text-xs uppercase tracking-wider opacity-90 ml-1">Done</span>
                      </div>
                    </div>
                  </div>

                  {/* Lesson List & Timeline */}
                  <div className="relative pl-3 md:pl-10">
                    <div className="absolute left-[1.3125rem] md:left-[3.0625rem] top-8 bottom-8 w-0.5 bg-[var(--color-border)] z-0" />
                    <div className="space-y-5 md:space-y-6 relative z-10">
                      {sLessons.map((lesson) => {
                        const isCompleted = lesson.completed;
                        const isLocked = !lesson.unlocked;
                        const isCurrent = !isCompleted && !isLocked;

                        return (
                          <div key={lesson._id} className="flex items-stretch gap-4 md:gap-8" data-testid={`lesson-card-${lesson.order}`}>
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
                </div>
              );
            })}
          </div>
        ) : activeSectionInfo && (
          <div className="mb-10">
            {/* Stage Header Card */}
            <div className="card p-4 sm:p-6 md:p-8 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden bg-[var(--color-card)] border border-[var(--color-border)]">
              <div className="absolute -right-8 -bottom-10 opacity-[0.03] pointer-events-none text-[var(--color-text-primary)]">
                 <activeSectionInfo.icon size={160} />
              </div>
              <div className="relative z-10">
                <div className="text-[0.625rem] font-bold uppercase tracking-widest text-[var(--color-accent-text)] mb-2">STAGE {SECTIONS.indexOf(activeSectionInfo) + 1} — {activeSectionInfo.label.toUpperCase()}</div>
                <h2 className="text-2xl font-extrabold text-[var(--color-text-primary)] mb-1">
                  {activeSectionInfo.subtitle.split('·')[1]?.trim() || activeSectionInfo.subtitle}
                </h2>
                <p className="text-[var(--color-text-secondary)]">
                  {activeSectionInfo.subtitle.split('·')[0]?.trim()}
                </p>
              </div>
              <div className="relative z-10 md:text-right flex items-center md:flex-col gap-4 md:gap-1">
                <div className="inline-block px-4 py-2 rounded-xl bg-[rgba(34,197,94,0.1)] text-[var(--color-correct)] font-bold text-lg border border-[rgba(34,197,94,0.15)]">
                  {doneCount} / {sectionLessons.length} <span className="text-xs uppercase tracking-wider opacity-90 ml-1">Done</span>
                </div>
              </div>
            </div>

            {/* 5 & 6. Lesson List & Timeline */}
            <div className="relative pl-3 md:pl-10">
              {/* Vertical connecting line */}
              <div className="absolute left-[1.3125rem] md:left-[3.0625rem] top-8 bottom-8 w-0.5 bg-[var(--color-border)] z-0" />
              
              <div className="space-y-5 md:space-y-6 relative z-10">
                {sectionLessons.map((lesson) => {
                  const isCompleted = lesson.completed;
                  const isLocked = !lesson.unlocked;
                  const isCurrent = !isCompleted && !isLocked;

                  return (
                    <div key={lesson._id} className="flex items-stretch gap-4 md:gap-8" data-testid={`lesson-card-${lesson.order}`}>
                      {/* Timeline Dot */}
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
                      
                      {/* Lesson Card */}
                      <div className="flex-1 min-w-0">
                        {isCompleted ? renderCompletedCard(lesson) : isCurrent ? renderCurrentCard(lesson) : renderLockedCard(lesson)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <ProseSection title="About the Learn course" learnMoreLabel="Learn more about the Learn course" icon={GraduationCap}>
          <p>
            The Learn course is Typeoye's structured path to touch typing — 16 lessons organized into four
            stages that build on each other. You can't skip ahead: lessons unlock in order, and finishing a
            lesson opens the next one, so skills accumulate in a deliberate sequence.
          </p>
          <p>
            <strong>The four stages.</strong> Foundation (Levels 1–5) covers hand position and keyboard
            layout, establishing home-row technique before speed. Building Blocks (Levels 6–10) moves into
            letter patterns and everyday vocabulary, training your fingers to recognize common combinations.
            Flow &amp; Rhythm (Levels 11–14) introduces sentences, punctuation, and paragraphs to build a
            natural, even pace. Advanced (Levels 15–16) finishes with numbers, symbols, and professional
            text — the skills behind spreadsheets, code, and formal writing.
          </p>
          <p>
            Progress is tracked per lesson — completed exercises, accuracy, and attempts — so you can see
            exactly where you've improved. Progress saves when you're signed in; as a guest, Level 1 is free
            to try and the rest of the course unlocks once you create an account.
          </p>
          <p>
            <strong>Who benefits most.</strong> A structured course is especially valuable for beginners
            learning correct technique from the start, and for anyone who has typed for years but wants to
            rebuild proper habits. If you already type fluently and want focused work on specific weaknesses,
            free practice may suit you better — but even experienced typists enjoy the course as a way to
            measure steady, stage-by-stage progress.
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
                As a guest you can practice Level 1 — Keyboard Basics. Create a free account to track progress and unlock all {lessons.length} levels.
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