import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, CheckCircle2, RotateCcw, XCircle,
  AlertCircle, Pause, Play, SkipForward, Trophy, LockKeyhole, Lightbulb,
} from 'lucide-react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { Modal } from '../components/ui/Modal';
import { UrduTypingDisplay } from '../components/typing/UrduTypingDisplay';
import { UrduTypingHeader } from '../components/typing/UrduTypingHeader';
import { UrduStartHint } from '../components/typing/UrduStartHint';
import { UrduVirtualKeyboard } from '../components/typing/UrduVirtualKeyboard';
import { LiveStatsCard } from '../components/typing/LiveStatsCard';
import { useScrollLock } from '../hooks/useScrollLock';
import { computeWpm, computeAccuracy } from '../utils/wpm';
import { useTypingEngine } from '../hooks/useTypingEngine';
import { urduLessonService } from '../services/urduLesson.service';
import type { ExerciseCompletion } from '../services/lesson.service';
import { applySessionRewards } from '../utils/rewards';
import { useAuthStore } from '../store/authStore';
import {
  tokenizeUrdu,
  URDU_CHAR_TO_KEY,
  urduKeyFromEvent,
  urduKeyNeedsShift,
} from '../utils/urduPhonetic';
import type { CourseLesson, EngineResult, Exercise, Lesson, LessonProgress } from '../types';

export default function UrduLessonPlayer() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const cached = urduLessonService.getLessonCached(id);
  const [lesson, setLesson] = useState<Lesson | null>(cached?.lesson || null);
  const [exercises, setExercises] = useState<Exercise[]>(cached?.exercises || []);
  const [progress, setProgress] = useState<LessonProgress | null>(cached?.progress || null);
  const [nextLesson, setNextLesson] = useState<CourseLesson | null>(null);
  const [guestDone, setGuestDone] = useState<string[]>([]);
  // Guests can finish Level 1 but may not advance — tapping "Continue to Next
  // Level" opens this sign-in prompt instead of navigating/unlocking anything.
  const [showGuestNextPrompt, setShowGuestNextPrompt] = useState(false);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [showLevelComplete, setShowLevelComplete] = useState(false);
  const [feedback, setFeedback] = useState<ExerciseCompletion | null>(null);
  const [error, setError] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [shiftHeld, setShiftHeld] = useState(false);
  const pausedElapsedRef = useRef(0);
  const completingRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setError('');
        setLesson(null);
        setExercises([]);
        setProgress(null);
        setFeedback(null);
        setIsPaused(false);
        setNextLesson(null);
        pausedElapsedRef.current = 0;
        completingRef.current = false;

        const { lesson: l, exercises: exs, progress: saved } = await urduLessonService.getLesson(id);
        if (!isMounted) return;
        // Guests have no server-side progress, so choose an unseen variant per
        // exercise locally (persisted in localStorage) to avoid repeats across
        // navigation and refreshes.
        const resolvedExercises = !isAuthenticated
          ? exs.map((ex) => {
              if (!ex.variants || ex.variants.length <= 1) return ex;
              const idx = urduLessonService.pickGuestVariantIndex(l._id, ex.order, ex.variants.length);
              return { ...ex, content: ex.variants[idx], variantIndex: idx };
            })
          : exs;
        setLesson(l); setExercises(resolvedExercises); setProgress(saved || null);
        // Resume from the first incomplete exercise in THIS level, using the
        // per-user, per-lesson `completedExerciseIds` the server persists. This
        // survives refreshes, logout/login and other devices (req. 6). When every
        // exercise is done, `next` is -1 and we open exercise 1 in the existing
        // replay/completion state (req. 4). Replaying a completed exercise never
        // removes it from `completedExerciseIds`, so saved progress is preserved
        // (req. 5) and incomplete exercises are never marked complete (req. 7).
        const done = new Set(saved?.completedExerciseIds ?? []);
        const next = resolvedExercises.findIndex((e) => !done.has(e._id));
        setShowLevelComplete(isAuthenticated && resolvedExercises.length > 0 && next === -1);
        setActiveExerciseIndex(next === -1 ? 0 : next);

        const allLessons = await urduLessonService.getLessons();
        if (!isMounted) return;
        const nextLevel = allLessons.find((item) => item.order === l.order + 1);
        setNextLesson(nextLevel || null);
      } catch (err: any) {
        if (!isMounted) return;
        setError(err.response?.data?.error || 'This lesson is locked or unavailable.');
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [id, isAuthenticated]);

  useEffect(() => {
    const down = (event: KeyboardEvent) => { if (event.key === 'Shift') setShiftHeld(true); };
    const up = (event: KeyboardEvent) => { if (event.key === 'Shift') setShiftHeld(false); };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  const currentExercise = exercises[activeExerciseIndex];
  const completedExerciseIds = isAuthenticated ? (progress?.completedExerciseIds ?? []) : guestDone;
  const isReplay = isAuthenticated && exercises.length > 0 && completedExerciseIds.length === exercises.length;
  const isLastExercise = activeExerciseIndex === exercises.length - 1;

  const [resultDuration, setResultDuration] = useState(0);
  const formatClock = (totalSeconds: number) => {
    const secs = Math.max(0, Math.ceil(totalSeconds));
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const onComplete = useCallback(async (result: EngineResult) => {
    if (!currentExercise || !result.typedWords.length) return;
    if (completingRef.current) return;
    completingRef.current = true;
    setError('');

    // Word-level accuracy, identical to the server's authoritative rule
    // (`wpm.service.computeStats`): a word counts only when typed exactly.
    const attemptedWords = result.typedWords.length;
    const correctWords = result.typedWords.filter((word) => word.word === word.typed).length;
    const accuracy = computeAccuracy(correctWords, attemptedWords);
    const wpm = computeWpm(correctWords, result.durationSeconds);
    const expectedWords = currentExercise.content.trim().split(/\s+/).length;
    const passed = attemptedWords === expectedWords && accuracy >= (lesson?.accuracyThreshold ?? 90);

    const durationSeconds = Number.isFinite(result.durationSeconds) ? Math.max(0, result.durationSeconds) : 0;
    setResultDuration(durationSeconds);

    setFeedback({
      stats: { wpm, accuracy, correctWords, attemptedWords, errorsCount: attemptedWords - correctWords },
      passed,
      lessonCompleted: false,
      progress: progress ?? ({} as LessonProgress),
      nextLessonUnlocked: false,
      xpEarned: 0,
      xpBreakdown: [],
      newAchievements: [],
      leveledUp: false,
      prevXP: 0,
      newXP: 0,
      level: 1,
      levelTitle: '',
      prevLevel: 1,
    });

    if (!isAuthenticated) {
      if (passed) setGuestDone((prev) => (prev.includes(currentExercise._id) ? prev : [...prev, currentExercise._id]));
      return;
    }

    try {
      const response = await urduLessonService.completeExercise(lesson!._id, currentExercise._id, {
        startTime: result.startTime,
        endTime: result.endTime,
        typedWords: result.typedWords,
        variantIndex: currentExercise.variantIndex,
      });
      applySessionRewards(null, response);
      setProgress(response.progress);
      setFeedback(response);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Unable to save your progress. Please try again.');
    }
  }, [lesson, currentExercise, isAuthenticated, progress]);

  const engine = useTypingEngine({
    text: currentExercise?.content ?? '',
    durationSeconds: 999999,
    onComplete,
    extendContent: false,
    mapKey: (event: KeyboardEvent) => urduKeyFromEvent(event, { urduNumerals: true }),
  });

  const mistakeCount = engine.wordStates.filter((w) => w.status === 'error').length;

  const active = engine.wordStates[engine.currentWordIndex];
  const { activeKey, shiftActive } = useMemo(() => {
    if (!active) return { activeKey: undefined, shiftActive: false };
    const units = tokenizeUrdu(active.word);
    const typedUnits = tokenizeUrdu(active.typed).length;
    const key = typedUnits >= units.length ? ' ' : URDU_CHAR_TO_KEY[units[typedUnits]];
    return { activeKey: key, shiftActive: urduKeyNeedsShift(key) };
  }, [active]);

  const handleRestart = useCallback(() => {
    setShowLevelComplete(false);
    setFeedback(null);
    setResultDuration(0);
    setError('');
    setIsPaused(false);
    pausedElapsedRef.current = 0;
    completingRef.current = false;
    const current = exercises[activeExerciseIndex];
    if (current?.variants?.length) {
      if (!isAuthenticated && lesson) {
        // Guests: pick an unseen variant and persist it locally so repeats are
        // avoided across restarts, navigation and refreshes too.
        const idx = urduLessonService.pickGuestVariantIndex(lesson._id, current.order, current.variants.length);
        setExercises((prev) => prev.map((ex, i) => (i === activeExerciseIndex ? { ...ex, content: current.variants![idx], variantIndex: idx } : ex)));
      } else {
        const others = current.variants
          .map((text, index) => ({ text, index }))
          .filter((variant) => variant.index !== current.variantIndex && variant.text !== current.content);
        const choice = others.length ? others[Math.floor(Math.random() * others.length)] : { text: current.variants[0], index: 0 };
        setExercises((prev) => prev.map((ex, i) => (i === activeExerciseIndex ? { ...ex, content: choice.text, variantIndex: choice.index } : ex)));
      }
    } else {
      engine.resetEngine();
    }
  }, [exercises, activeExerciseIndex, engine, isAuthenticated, lesson]);

  const handlePause = useCallback(() => {
    if (isPaused) {
      setIsPaused(false);
      pausedElapsedRef.current = 0;
    } else {
      setIsPaused(true);
      pausedElapsedRef.current = engine.elapsed;
    }
  }, [isPaused, engine.elapsed]);

  const handleSkip = useCallback(() => {
    setShowLevelComplete(false);
    setFeedback(null);
    setResultDuration(0);
    setError('');
    setIsPaused(false);
    pausedElapsedRef.current = 0;
    completingRef.current = false;
    if (activeExerciseIndex + 1 < exercises.length) {
      setActiveExerciseIndex(activeExerciseIndex + 1);
    } else {
      navigate('/urdu-lessons');
    }
  }, [activeExerciseIndex, exercises.length, navigate]);

  const continueLesson = useCallback(() => {
    setShowLevelComplete(false);
    setFeedback(null);
    setResultDuration(0);
    setIsPaused(false);
    pausedElapsedRef.current = 0;
    completingRef.current = false;
    if (activeExerciseIndex + 1 < exercises.length) {
      setActiveExerciseIndex(activeExerciseIndex + 1);
    } else {
      navigate('/urdu-lessons');
    }
  }, [activeExerciseIndex, exercises.length, navigate]);

  const displayElapsed = isPaused ? pausedElapsedRef.current : engine.elapsed;

  // The completion result is rendered as a full-viewport overlay so the card is
  // always fully visible WITHOUT moving the page: we never scroll the document,
  // so the user's scroll position stays exactly where it was. When the card is
  // taller than the viewport the overlay itself scrolls. Background scroll is
  // locked while the overlay is open and restored on close.
  const showResult = engine.phase === 'finished' && !!feedback;
  useScrollLock(showResult);

  if (!lesson && error) {
    return <PageWrapper title="" fullWidth className="py-4 sm:py-6 px-4 sm:px-6 overflow-hidden">
      <div className="max-w-[106.25rem] mx-auto w-full overflow-hidden">
        <nav className="flex items-center justify-between mb-5">
          <Link to="/urdu-lessons" className="flex items-center gap-1.5 text-sm font-semibold transition-colors hover:opacity-80" style={{ color: 'var(--color-accent-text)' }}>
            <ArrowLeft size={15} />
            Back to Urdu Learn
          </Link>
        </nav>
        <div className="card p-4 sm:p-6 lg:p-8 text-center max-w-md mx-auto overflow-hidden">
          {!isAuthenticated ? (
            <>
              <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center" style={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent-text)' }}>
                <LockKeyhole size={26} />
              </div>
              <h2 className="text-lg font-bold mt-4">Sign in to unlock the rest of the Urdu course</h2>
              <p className="text-sm text-secondary mt-2 leading-relaxed">As a guest only Level 1 is open. Create a free account to keep practising and save your Urdu progress.</p>
              <div className="flex flex-col gap-2.5 mt-6">
                <Link to="/login" className="btn btn-primary px-5 py-2.5 w-full justify-center">Sign in</Link>
                <Link to="/register" className="btn btn-secondary px-5 py-2.5 w-full justify-center">Create free account</Link>
                <button className="btn btn-ghost px-5 py-2 w-full justify-center" onClick={() => navigate('/urdu-lessons')}><ArrowLeft size={16} /> Back to Urdu Learn</button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-lg font-bold">Lesson unavailable</h2>
              <p className="text-sm text-secondary mt-2">{error}</p>
              <button className="btn btn-primary px-4 py-2 mt-6" onClick={() => navigate('/urdu-lessons')}><ArrowLeft size={16} /> Back to Urdu Learn</button>
            </>
          )}
        </div>
      </div>
    </PageWrapper>;
  }

  if (!lesson) {
    return (
      <PageWrapper title="" fullWidth className="py-4 sm:py-6 px-4 sm:px-6 overflow-hidden">
        <div className="max-w-[106.25rem] mx-auto w-full overflow-hidden">
          <nav className="flex items-center justify-between mb-5">
            <Link to="/urdu-lessons" className="flex items-center gap-1.5 text-sm font-semibold transition-colors hover:opacity-80" style={{ color: 'var(--color-accent-text)' }}>
              <ArrowLeft size={15} />
              Back to Urdu Learn
            </Link>
          </nav>
          <div className="flex items-center justify-center py-24 text-secondary" data-testid="urdu-lesson-loading">
            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
            Loading lesson…
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (showLevelComplete) {
    return (
      <PageWrapper title="" fullWidth className="tt-page py-4 sm:py-6 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto w-full">
          <nav className="mb-5">
            <Link to="/urdu-lessons" className="flex items-center gap-1.5 text-sm font-semibold transition-colors hover:opacity-80" style={{ color: 'var(--color-accent-text)' }}>
              <ArrowLeft size={15} /> Back to Urdu Learn
            </Link>
          </nav>
          <div className="card p-6 sm:p-8 text-center">
            <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center" style={{ backgroundColor: 'rgba(34, 197, 94, 0.12)', color: '#16a34a' }}>
              <Trophy size={28} />
            </div>
            <h1 className="text-2xl font-bold mt-4">Level Complete!</h1>
            <p className="text-sm text-secondary mt-2">You have completed every exercise in Level {lesson.order}. Choose an exercise below to practise it again.</p>
            <div className="grid sm:grid-cols-2 gap-2 mt-6">
              {exercises.map((exercise, index) => (
                <button key={exercise._id} className="btn btn-secondary justify-start px-4 py-3 text-left" onClick={() => { setActiveExerciseIndex(index); setShowLevelComplete(false); }}>
                  Exercise {index + 1}: {exercise.title}
                </button>
              ))}
            </div>
            <div className="flex justify-center gap-3 mt-6">
              <Link to="/urdu-lessons" className="btn btn-ghost px-4 py-2">Back to levels</Link>
              {nextLesson && <Link to={`/urdu-lessons/${nextLesson._id}`} className="btn btn-primary px-4 py-2">Continue to next level <ArrowRight size={16} /></Link>}
            </div>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="" fullWidth className="tt-page py-4 sm:py-6 px-4 sm:px-6">
      <div className="max-w-[106.25rem] mx-auto w-full">

        {/* ── Top Navigation ── */}
        <nav className="flex items-center justify-between gap-2 mb-5">
          <Link
            to="/urdu-lessons"
            className="flex items-center gap-1.5 text-sm font-semibold shrink-0 transition-colors hover:opacity-80"
            style={{ color: 'var(--color-accent-text)' }}
          >
            <ArrowLeft size={15} />
            <span className="hidden sm:inline">Back to Urdu Learn</span>
            <span className="sm:hidden">Back</span>
          </Link>
          {exercises.length > 0 && (
            <span className="text-xs font-semibold truncate text-right" style={{ color: 'var(--color-text-muted)' }}>
              Level {lesson.order} &bull; Exercise {activeExerciseIndex + 1} of {exercises.length}
            </span>
          )}
        </nav>

        {/* ── Lesson Header (bilingual) ── */}
        <div className="mb-5">
          <UrduTypingHeader
            englishTitle={`Level ${lesson.order}${lesson.titleEn ? ` — ${lesson.titleEn}` : ''}`}
            urduTitle={lesson.title}
            badges={
              isReplay ? (
                <span
                  data-testid="replay-badge"
                  className="text-[0.625rem] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full leading-none"
                  style={{ backgroundColor: 'rgba(34, 197, 94, 0.12)', color: 'var(--color-correct)' }}
                >
                  Replay
                </span>
              ) : undefined
            }
            subtitle={
              <>
                {lesson.description} &middot; Reach at least {lesson.accuracyThreshold}% accuracy to pass.
              </>
            }
          />
        </div>

        {/* Guest mode banner */}
        {!isAuthenticated && !feedback && (
          <p className="mb-4 text-sm text-secondary text-center">
            Guest mode — results are shown here but not saved.{' '}
            <Link to="/register" className="font-semibold" style={{ color: 'var(--color-accent-text)' }}>
              Create a free account
            </Link>{' '}
            to save progress.
          </p>
        )}

        {/* ── Two-Column Layout ── */}
        <div className="flex flex-col lg:flex-row gap-5 w-full items-start">

          {/* LEFT: Main exercise card */}
          <div className="flex-1 min-w-0 w-full">
            <div className="card tt-main-card p-5 sm:p-7 w-full overflow-hidden">
              {/* Exercise header */}
              {currentExercise && (
                <div className="mb-5">
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                    Exercise {activeExerciseIndex + 1} of {exercises.length}
                  </p>
                  <h2 dir="rtl" lang="ur" className="font-urdu text-xl font-bold mt-1 leading-loose" style={{ color: 'var(--color-text-primary)' }}>
                    {currentExercise.title}
                  </h2>
                </div>
              )}

              {/* Typing text area */}
              <div
                onPaste={(event) => event.preventDefault()}
                onCut={(event) => event.preventDefault()}
                onDrop={(event) => event.preventDefault()}
                className="tt-text-shell relative"
              >
                {currentExercise ? (
                  <div className="relative pt-12">
                    {engine.phase === 'idle' && !isPaused && <UrduStartHint className="top-0 right-0" />}
                    <UrduTypingDisplay
                      wordStates={engine.wordStates}
                      currentWordIndex={engine.currentWordIndex}
                      fontSize={30}
                      lineHeight={2.8}
                    />
                  </div>
                ) : (
                  <div className="h-24 flex items-center justify-center text-muted">Loading exercise…</div>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="mt-4 flex items-center gap-2 p-3 rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <AlertCircle size={15} style={{ color: 'var(--color-error)' }} />
                  <p className="text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>
                </div>
              )}

              {/* Start typing hint (idle state) */}
              {engine.phase === 'idle' && !feedback && !isPaused && (
                <div className="mt-5 text-center">
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Press any key or click below to begin.
                  </p>
                </div>
              )}

              {/* Paused state */}
              {isPaused && (
                <div className="mt-5 text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{ backgroundColor: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                    <Pause size={14} style={{ color: '#d97706' }} />
                    <span className="text-sm font-semibold" style={{ color: '#d97706' }}>Paused — press Resume to continue</span>
                  </div>
                </div>
              )}

              {/* Exercise controls */}
              {engine.phase !== 'idle' && !feedback && (
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleRestart}
                    className="btn btn-ghost px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    <RotateCcw size={13} /> Restart
                  </button>
                  <button
                    onClick={handlePause}
                    className="btn btn-ghost px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5"
                    style={{ color: isPaused ? '#d97706' : 'var(--color-text-secondary)' }}
                  >
                    {isPaused ? <><Play size={13} /> Resume</> : <><Pause size={13} /> Pause</>}
                  </button>
                  {!isLastExercise && (
                    <button
                      onClick={handleSkip}
                      className="btn btn-ghost px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 ml-auto"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      Skip <SkipForward size={13} />
                    </button>
                  )}
                </div>
              )}

              {/* Exercise completion overlay — fixed full-viewport so the card is
                  always fully visible without scrolling the page. The overlay
                  scrolls internally when the card is taller than the viewport. */}
              {engine.phase === 'finished' && feedback && (
                <div className="fixed inset-0 z-30 overflow-y-auto" style={{ paddingTop: 'calc(var(--navbar-h, 4rem) + 1rem)', paddingBottom: '1rem' }}>
                  <div className="grid place-items-start sm:place-items-center min-h-full px-3 sm:px-4" dir="rtl">
                  <div className="w-full max-w-md card result-card p-4 sm:p-6 text-center shadow-xl border border-[var(--color-border)] overflow-hidden">
                    {feedback.passed ? (
                      <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center" style={{ backgroundColor: 'rgba(34, 197, 94, 0.12)' }}>
                        <CheckCircle2 size={28} style={{ color: '#16a34a' }} />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                        <XCircle size={28} style={{ color: 'var(--color-error)' }} />
                      </div>
                    )}
                    <h2 className="text-2xl font-bold mt-4">
                      {feedback.passed
                        ? isLastExercise ? '🎉 Lesson Complete!' : '🎉 Exercise Complete!'
                        : 'Keep practising'}
                    </h2>
                    <p className="text-sm text-secondary mt-1.5">
                      {feedback.passed
                        ? isLastExercise
                          ? feedback.nextLessonUnlocked ? 'Great work — the next level is now unlocked.' : 'You have completed every exercise in this lesson.'
                          : `You reached ${feedback.stats.accuracy}% accuracy.`
                        : `You reached ${feedback.stats.accuracy}% accuracy. You need at least ${lesson.accuracyThreshold}%.`}
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                      <div className="rounded-xl p-3" style={{ background: 'var(--color-accent-light)' }}>
                        <div className="text-xl font-bold" style={{ color: 'var(--color-accent-text)' }}>{feedback.stats.wpm}</div>
                        <div className="text-[0.625rem] uppercase tracking-widest font-semibold" style={{ color: 'var(--color-text-muted)' }}>WPM</div>
                      </div>
                      <div className="rounded-xl p-3" style={{ background: 'var(--color-accent-light)' }}>
                        <div className="text-xl font-bold" style={{ color: 'var(--color-accent-text)' }}>{feedback.stats.accuracy}%</div>
                        <div className="text-[0.625rem] uppercase tracking-widest font-semibold" style={{ color: 'var(--color-text-muted)' }}>Accuracy</div>
                      </div>
                      <div className="rounded-xl p-3" style={{ background: 'var(--color-accent-light)' }}>
                        <div className="text-xl font-bold" style={{ color: 'var(--color-accent-text)' }}>{feedback.stats.correctWords}/{feedback.stats.attemptedWords}</div>
                        <div className="text-[0.625rem] uppercase tracking-widest font-semibold" style={{ color: 'var(--color-text-muted)' }}>Correct</div>
                      </div>
                      <div className="rounded-xl p-3" style={{ background: 'var(--color-accent-light)' }}>
                        <div className="text-xl font-bold tabular-nums" style={{ color: 'var(--color-accent-text)' }}>{formatClock(resultDuration)}</div>
                        <div className="text-[0.625rem] uppercase tracking-widest font-semibold" style={{ color: 'var(--color-text-muted)' }}>Time</div>
                      </div>
                    </div>

                    {isReplay && progress?.bestAccuracy != null && progress.bestAccuracy > 0 && (
                      <p className="text-xs mt-3 font-semibold" style={{ color: feedback.stats.accuracy >= progress.bestAccuracy ? '#16a34a' : 'var(--color-text-muted)' }}>
                        {feedback.stats.accuracy >= progress.bestAccuracy
                          ? `New personal best! Previous best: ${progress.bestAccuracy}%`
                          : `This attempt: ${feedback.stats.accuracy}% · Best: ${progress.bestAccuracy}%`}
                      </p>
                    )}

                    {feedback.xpEarned > 0 && (
                      <p className="text-xs mt-3" style={{ color: 'var(--color-text-muted)' }}>
                        +{feedback.xpEarned} XP{feedback.newAchievements.length ? ` · ${feedback.newAchievements.map((a) => a.name).join(', ')}` : ''}
                      </p>
                    )}
                    {!isAuthenticated && (
                      <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
                        Not saved — sign in to keep this lesson's progress.
                      </p>
                    )}

                    <div className="flex flex-col sm:flex-row w-full gap-2.5 mt-6" dir="ltr">
                      {feedback.passed ? (
                        isLastExercise ? (
                          <>
                            <Link to="/urdu-lessons" className="btn flex-1 px-3 py-2.5 text-sm" style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                              <ArrowLeft size={16} className="mr-1.5 shrink-0" /> Back to Urdu Learn
                            </Link>
                            {nextLesson ? (
                              <Link to={`/urdu-lessons/${nextLesson._id}`} onClick={async (e) => {
                                e.preventDefault();
                                if (!isAuthenticated) {
                                  setShowGuestNextPrompt(true);
                                  return;
                                }
                                document.body.style.cursor = 'wait';
                                try {
                                  await urduLessonService.getLesson(nextLesson._id);
                                  navigate(`/urdu-lessons/${nextLesson._id}`);
                                } finally {
                                  document.body.style.cursor = 'default';
                                }
                              }} className="btn btn-primary flex-1 px-3 py-2.5 text-sm">
                                Continue to Next Level <ArrowRight size={16} className="ml-1.5 shrink-0" />
                              </Link>
                            ) : (
                              <Link to="/urdu-lessons" className="btn btn-primary flex-1 px-3 py-2.5 text-sm">
                                <Trophy size={16} className="mr-1.5 shrink-0" /> Course Complete
                              </Link>
                            )}
                          </>
                        ) : (
                          <>
                            <Link to={`/urdu-lessons?focus=${lesson.order}`} className="btn flex-1 px-3 py-2.5 text-sm" style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                              <ArrowLeft size={16} className="mr-1.5 shrink-0" /> Back to Urdu Learn
                            </Link>
                            <button className="btn btn-primary flex-1 px-3 py-2.5 text-sm" onClick={continueLesson}>
                              Next Exercise <ArrowRight size={16} className="ml-1.5 shrink-0" />
                            </button>
                          </>
                        )
                      ) : (
                        <>
                          <Link to={`/urdu-lessons?focus=${lesson.order}`} className="btn flex-1 px-3 py-2.5 text-sm" style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                            <ArrowLeft size={16} className="mr-1.5 shrink-0" /> Back to Urdu Learn
                          </Link>
                          <button className="btn btn-primary flex-1 px-3 py-2.5 text-sm" onClick={handleRestart}>
                            <RotateCcw size={16} className="mr-1.5 shrink-0" /> Try Again
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  </div>
                </div>
              )}
            </div>

            {/* Virtual keyboard */}
            {currentExercise && (
              <div dir="rtl" className="mt-4 font-urdu">
                <UrduVirtualKeyboard activeKey={activeKey} shiftActive={shiftActive || shiftHeld} urduDigits />
              </div>
            )}
          </div>

          {/* RIGHT: Live Performance Card */}
          <aside className="w-full lg:w-[16.25rem] shrink-0 flex flex-col gap-4 lg:sticky lg:top-24">
            <LiveStatsCard
              wpm={engine.liveWpm}
              accuracy={engine.liveAccuracy}
              remaining={0}
              elapsed={displayElapsed}
              phase={isPaused ? 'idle' : engine.phase}
              duration={999999}
              mode="elapsed"
            />

            {/* Mistakes card */}
            <div className="card p-4 tt-stats-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-error)' }}>
                    <AlertCircle size={15} />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
                    Mistakes
                  </span>
                </div>
                <b className="text-2xl font-bold tabular-nums leading-none" style={{ color: 'var(--color-text-primary)' }}>
                  {engine.phase === 'idle' && !isPaused ? '0' : mistakeCount}
                </b>
              </div>
            </div>

            {/* Tips */}
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(245, 158, 11, 0.16)', color: '#d97706' }}>
                  <Lightbulb size={14} />
                </div>
                <h2 className="text-sm font-bold">Tips</h2>
              </div>
              <ul dir="rtl" lang="ur" className="flex flex-col gap-1.5 text-xs">
                {[
                  'اردو فونٹک کی بورڈ میپنگ استعمال کریں۔',
                  'الفاظ مکمل ٹائپ کرنے پر ہی درست شمار ہوتے ہیں۔',
                  'اگلے لفظ کے لیے اسپیس دبائیں۔',
                ].map((tip) => (
                  <li key={tip} className="flex gap-1.5 font-urdu text-right leading-loose" style={{ color: 'var(--color-text-secondary)' }}>
                    <span className="font-sans" style={{ color: 'var(--color-correct)' }}>✓</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>

        {/* Guest sign-in prompt — next level requires an account */}
        {!isAuthenticated && (
          <Modal isOpen={showGuestNextPrompt} onClose={() => setShowGuestNextPrompt(false)} title="Sign in to Continue" size="sm">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center" style={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent-text)' }}>
                <LockKeyhole size={26} />
              </div>
              <p className="text-sm text-secondary mt-4 leading-relaxed">
                You've completed this level! Sign in to unlock and continue to the next level.
              </p>
              <div className="flex flex-col gap-2.5 mt-6">
                <Link to="/login" className="btn btn-primary px-5 py-2.5 w-full justify-center">Sign In</Link>
                <button
                  type="button"
                  className="btn btn-ghost px-5 py-2 w-full justify-center"
                  onClick={() => {
                    setShowGuestNextPrompt(false);
                    navigate('/urdu-lessons');
                  }}
                >
                  <ArrowLeft size={16} /> Back to Urdu Learn
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </PageWrapper>
  );
}
