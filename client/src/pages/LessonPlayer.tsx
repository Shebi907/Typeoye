import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, CheckCircle2, ChevronRight, LockKeyhole,
  RotateCcw, XCircle, Clock, Target, AlertCircle, Pause, Play,
  SkipForward, Trophy, BookOpen,
} from 'lucide-react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { Modal } from '../components/ui/Modal';
import { TypingDisplay } from '../components/typing/TypingDisplay';
import { StartTypingHint } from '../components/typing/StartTypingHint';
import { VirtualKeyboard } from '../components/typing/VirtualKeyboard';
import { LiveStatsCard } from '../components/typing/LiveStatsCard';
import { computeWpm, computeAccuracy } from '../utils/wpm';
import { useTypingEngine } from '../hooks/useTypingEngine';
import { lessonService, type ExerciseCompletion } from '../services/lesson.service';
import { applySessionRewards } from '../utils/rewards';
import { useAuthStore } from '../store/authStore';
import type { CourseLesson, EngineResult, Exercise, Lesson, LessonProgress } from '../types';

export default function LessonPlayer() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { settings, isAuthenticated } = useAuthStore();
  const cached = lessonService.getLessonCached(id);
  const [lesson, setLesson] = useState<Lesson | null>(cached?.lesson || null);
  const [exercises, setExercises] = useState<Exercise[]>(cached?.exercises || []);
  const [progress, setProgress] = useState<LessonProgress | null>(cached?.progress || null);
  const [nextLesson, setNextLesson] = useState<CourseLesson | null>(null);
  const [guestDone, setGuestDone] = useState<string[]>([]);
  // Guests can finish Level 1 but may not advance — tapping "Continue to Next
  // Level" opens this sign-in prompt instead of navigating/unlocking anything.
  const [showGuestNextPrompt, setShowGuestNextPrompt] = useState(false);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [feedback, setFeedback] = useState<ExerciseCompletion | null>(null);
  const [error, setError] = useState('');
  const [isPaused, setIsPaused] = useState(false);
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

        const { lesson: l, exercises: exs, progress: saved } = await lessonService.getLesson(id);
        if (!isMounted) return;
        setLesson(l); setExercises(exs); setProgress(saved || null);
        const done = new Set(saved?.completedExerciseIds ?? []);
        const next = exs.findIndex((e) => !done.has(e._id));
        
        let initialIndex = next === -1 ? 0 : next;
        
        // Only restore from sessionStorage if the user has already completed exercise 1 in a prior session.
        // For a fresh/first-time level (exercise 1 not completed), it must always start at exercise 1.
        const exercise1Completed = exs.length > 0 && done.has(exs[0]._id);
        if (exercise1Completed) {
          const savedIndexStr = sessionStorage.getItem(`lesson_${id}_exercise`);
          if (savedIndexStr !== null) {
            const idx = parseInt(savedIndexStr, 10);
            if (idx >= 0 && idx < exs.length) {
              initialIndex = idx;
            }
          }
        } else {
          initialIndex = 0;
          sessionStorage.removeItem(`lesson_${id}_exercise`);
        }
        
        setActiveExerciseIndex(initialIndex);

        // Fetch course lessons list to identify next level
        const allLessons = await lessonService.getLessons();
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
  }, [id]);

  useEffect(() => {
    if (lesson && exercises.length > 0) {
      sessionStorage.setItem(`lesson_${lesson._id}_exercise`, activeExerciseIndex.toString());
    }
  }, [activeExerciseIndex, lesson, exercises]);

  const currentExercise = exercises[activeExerciseIndex];
  const completedExerciseIds = isAuthenticated ? (progress?.completedExerciseIds ?? []) : guestDone;
  const completedSet = new Set(completedExerciseIds);
  const isReplay = isAuthenticated && exercises.length > 0 && completedExerciseIds.length === exercises.length;
  const progressPct = exercises.length ? (completedExerciseIds.length / exercises.length) * 100 : 0;
  const isLastExercise = activeExerciseIndex === exercises.length - 1;

  const onComplete = useCallback(async (result: EngineResult) => {
    if (!currentExercise || !result.typedWords.length) return;
    if (completingRef.current) return;
    completingRef.current = true;
    setError('');

    const attemptedWords = result.typedWords.length;
    const correctWords = result.typedWords.filter((word) => word.word === word.typed).length;
    const accuracy = computeAccuracy(correctWords, attemptedWords);
    const wpm = computeWpm(correctWords, result.durationSeconds);
    const expectedWords = currentExercise.content.trim().split(/\s+/).length;
    const passed = attemptedWords === expectedWords && accuracy >= (lesson?.accuracyThreshold ?? 90);

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
      const response = await lessonService.completeExercise(lesson!._id, currentExercise._id, {
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
  }, [lesson, currentExercise, isAuthenticated]);

  const engine = useTypingEngine({ text: currentExercise?.content ?? '', durationSeconds: 999999, onComplete, extendContent: false });

  const mistakeCount = engine.wordStates.filter((w) => w.status === 'error').length;

  const handleRestart = useCallback(() => {
    setFeedback(null);
    setError('');
    setIsPaused(false);
    pausedElapsedRef.current = 0;
    completingRef.current = false;
    const current = exercises[activeExerciseIndex];
    if (current?.variants?.length) {
      const others = current.variants
        .map((text, index) => ({ text, index }))
        .filter((variant) => variant.index !== current.variantIndex && variant.text !== current.content);
      const choice = others.length ? others[Math.floor(Math.random() * others.length)] : { text: current.variants[0], index: 0 };
      setExercises((prev) => prev.map((ex, i) => (i === activeExerciseIndex ? { ...ex, content: choice.text, variantIndex: choice.index } : ex)));
    } else {
      engine.resetEngine();
    }
  }, [exercises, activeExerciseIndex, engine]);

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
    setFeedback(null);
    setError('');
    setIsPaused(false);
    pausedElapsedRef.current = 0;
    completingRef.current = false;
    if (activeExerciseIndex + 1 < exercises.length) {
      setActiveExerciseIndex(activeExerciseIndex + 1);
    } else {
      navigate('/lessons');
    }
  }, [activeExerciseIndex, exercises.length, navigate]);

  const continueLesson = useCallback(() => {
    setFeedback(null);
    setIsPaused(false);
    pausedElapsedRef.current = 0;
    completingRef.current = false;
    if (activeExerciseIndex + 1 < exercises.length) {
      setActiveExerciseIndex(activeExerciseIndex + 1);
    } else {
      navigate('/lessons');
    }
  }, [activeExerciseIndex, exercises.length, navigate]);

  const displayElapsed = isPaused ? pausedElapsedRef.current : engine.elapsed;
  const displayRemaining = Math.max(0, 999999 - displayElapsed);

  if (!lesson && error) {
    return <PageWrapper title="" fullWidth className="py-4 sm:py-6 px-4 sm:px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto w-full overflow-hidden">
        <nav className="flex items-center justify-between mb-5">
          <Link to="/lessons" className="flex items-center gap-1.5 text-sm font-semibold transition-colors hover:opacity-80" style={{ color: 'var(--color-accent-text)' }}>
            <ArrowLeft size={15} />
            Back to Learn
          </Link>
        </nav>
        <div className="card p-4 sm:p-6 lg:p-8 text-center max-w-md mx-auto overflow-hidden">
          {!isAuthenticated ? (
            <>
              <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center" style={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent-text)' }}>
                <LockKeyhole size={26} />
              </div>
              <h2 className="text-lg font-bold mt-4">Sign in to unlock the rest of the course</h2>
              <p className="text-sm text-secondary mt-2 leading-relaxed">As a guest only Level 1 — Keyboard Basics is open. Create a free account to keep practicing and save your progress.</p>
              <div className="flex flex-col gap-2.5 mt-6">
                <Link to="/login" className="btn btn-primary px-5 py-2.5 w-full justify-center">Sign in</Link>
                <Link to="/register" className="btn btn-secondary px-5 py-2.5 w-full justify-center">Create free account</Link>
                <button className="btn btn-ghost px-5 py-2 w-full justify-center" onClick={() => navigate('/lessons')}><ArrowLeft size={16} /> Back to Learn</button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-lg font-bold">Lesson unavailable</h2>
              <p className="text-sm text-secondary mt-2">{error}</p>
              <button className="btn btn-primary px-4 py-2 mt-6" onClick={() => navigate('/lessons')}><ArrowLeft size={16} /> Back to Learn</button>
            </>
          )}
        </div>
      </div>
    </PageWrapper>;
  }

  if (!lesson) {
    return (
      <PageWrapper title="" fullWidth className="py-4 sm:py-6 px-4 sm:px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto w-full overflow-hidden">
          <nav className="flex items-center justify-between mb-5">
            <Link to="/lessons" className="flex items-center gap-1.5 text-sm font-semibold transition-colors hover:opacity-80" style={{ color: 'var(--color-accent-text)' }}>
              <ArrowLeft size={15} />
              Back to Learn
            </Link>
          </nav>
          <div className="flex items-center justify-center py-24 text-secondary" data-testid="lesson-loading">
            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
            Loading lesson…
          </div>
        </div>
      </PageWrapper>
    );
  }

  const active = engine.wordStates[engine.currentWordIndex];
  const nextChar = active?.chars.find((c) => c.status === 'current' || c.status === 'pending');
  const currentKey = active && active.typed.length >= active.word.length ? ' ' : nextChar?.char;
  const lastChar = active?.chars[active.typed.length - 1];
  const errorKey = lastChar?.status === 'error' || lastChar?.status === 'extra' ? active?.typed[active.typed.length - 1] : undefined;

  return (
    <PageWrapper title="" fullWidth className="py-4 sm:py-6 px-4 sm:px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto w-full overflow-hidden">

        {/* ── Top Navigation ── */}
        <nav className="flex items-center justify-between mb-5">
          <Link
            to="/lessons"
            className="flex items-center gap-1.5 text-sm font-semibold transition-colors hover:opacity-80"
            style={{ color: 'var(--color-accent-text)' }}
          >
            <ArrowLeft size={15} />
            Back to Learn
          </Link>
          {lesson && exercises.length > 0 && (
            <span className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
              Level {lesson.order} &bull; Exercise {activeExerciseIndex + 1} of {exercises.length}
            </span>
          )}
        </nav>

        {/* ── Lesson Header ── */}
        {lesson && (
          <div className="flex items-center gap-3 mb-5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #4361ee, #8B5CF6)', color: '#fff' }}
            >
              <BookOpen size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  {lesson.order}. {lesson.title}
                </h1>
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full leading-none"
                  style={{ background: 'linear-gradient(135deg, #4361EE, #8B5CF6)', color: '#fff' }}
                >
                  Level {lesson.order}
                </span>
                {isReplay && (
                  <span
                    data-testid="replay-badge"
                    className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full leading-none"
                    style={{ backgroundColor: 'rgba(34, 197, 94, 0.12)', color: 'var(--color-correct)' }}
                  >
                    Replay
                  </span>
                )}
              </div>
              <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                {lesson.description}
              </p>
            </div>
          </div>
        )}

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
                  <h2 className="text-lg font-bold mt-1" style={{ color: 'var(--color-text-primary)' }}>
                    {currentExercise.title}
                  </h2>
                  <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                    Reach at least {lesson!.accuracyThreshold}% accuracy to pass.
                  </p>
                </div>
              )}

              {/* Typing text area */}
              <div className="tt-text-shell relative">
                {currentExercise ? (
                  <div className="relative pt-1">
                    {engine.phase === 'idle' && !isPaused && <StartTypingHint className="-top-1 left-0" />}
                    <TypingDisplay
                      wordStates={engine.wordStates}
                      currentWordIndex={engine.currentWordIndex}
                      fontSize={settings?.fontSize || 22}
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

              {/* Start typing button (idle state) */}
              {engine.phase === 'idle' && !feedback && !isPaused && (
                <div className="mt-5 text-center">
                  <p className="text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>
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
                <div className="mt-5 flex items-center gap-2">
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

              {/* Exercise Progress */}
              {exercises.length > 0 && (
                <div className="mt-5 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>Exercise progress</span>
                    <span className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                      {completedExerciseIds.length} of {exercises.length} exercises
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${progressPct}%`,
                        background: 'linear-gradient(135deg, #4361EE, #8B5CF6)',
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    {exercises.map((ex, i) => (
                      <span
                        key={ex._id}
                        className="inline-block w-2 h-2 rounded-full transition-colors"
                        style={{
                          backgroundColor: completedSet.has(ex._id)
                            ? '#16a34a'
                            : i === activeExerciseIndex
                              ? '#4361ee'
                              : 'var(--color-border)',
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Exercise completion overlay */}
              {engine.phase === 'finished' && feedback && (
                <div className="absolute inset-0 grid place-items-center p-3 sm:p-5 bg-[var(--color-page)]/95 rounded-2xl z-10 overflow-hidden">
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
                            : 'Keep practicing'}
                        </h2>
                        <p className="text-sm text-secondary mt-1.5">
                          {feedback.passed
                            ? isLastExercise
                              ? feedback.nextLessonUnlocked ? 'Great work — the next level is now unlocked.' : 'You have completed every exercise in this lesson.'
                              : `You reached ${feedback.stats.accuracy}% accuracy.`
                            : `You reached ${feedback.stats.accuracy}% accuracy. You need at least ${lesson!.accuracyThreshold}%.`}
                        </p>

                        <div className="grid grid-cols-3 gap-3 mt-5">
                          <div className="rounded-xl p-3" style={{ background: 'var(--color-accent-light)' }}>
                            <div className="text-xl font-bold" style={{ color: 'var(--color-accent-text)' }}>{feedback.stats.wpm}</div>
                            <div className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: 'var(--color-text-muted)' }}>WPM</div>
                          </div>
                          <div className="rounded-xl p-3" style={{ background: 'var(--color-accent-light)' }}>
                            <div className="text-xl font-bold" style={{ color: 'var(--color-accent-text)' }}>{feedback.stats.accuracy}%</div>
                            <div className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: 'var(--color-text-muted)' }}>Accuracy</div>
                          </div>
                          <div className="rounded-xl p-3" style={{ background: 'var(--color-accent-light)' }}>
                            <div className="text-xl font-bold" style={{ color: 'var(--color-accent-text)' }}>{feedback.stats.correctWords}/{feedback.stats.attemptedWords}</div>
                            <div className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: 'var(--color-text-muted)' }}>Correct</div>
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

                        <div className="flex w-full gap-2.5 mt-6">
                          {feedback.passed ? (
                            isLastExercise ? (
                              <>
                                <Link to="/lessons" className="btn flex-1 px-3 py-2.5 text-sm" style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                                  <ArrowLeft size={16} className="mr-1.5 shrink-0" /> Back to Learn
                                </Link>
                                {nextLesson ? (
                                  <Link to={`/lessons/${nextLesson._id}`} onClick={async (e) => {
                                    e.preventDefault();
                                    // Guests must not advance past the open level. The next
                                    // level would reject them server-side (403), so instead of
                                    // silently failing we surface the sign-in prompt.
                                    if (!isAuthenticated) {
                                      setShowGuestNextPrompt(true);
                                      return;
                                    }
                                    document.body.style.cursor = 'wait';
                                    try {
                                      await lessonService.getLesson(nextLesson._id);
                                      navigate(`/lessons/${nextLesson._id}`);
                                    } finally {
                                      document.body.style.cursor = 'default';
                                    }
                                  }} className="btn btn-primary flex-1 px-3 py-2.5 text-sm">
                                    Continue to Next Level <ArrowRight size={16} className="ml-1.5 shrink-0" />
                                  </Link>
                                ) : (
                                  <Link to="/lessons" className="btn btn-primary flex-1 px-3 py-2.5 text-sm">
                                    <Trophy size={16} className="mr-1.5 shrink-0" /> Course Complete
                                  </Link>
                                )}
                              </>
                            ) : (
                              <>
                                <Link to={`/lessons?focus=${lesson!.order}`} className="btn flex-1 px-3 py-2.5 text-sm" style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                                  <ArrowLeft size={16} className="mr-1.5 shrink-0" /> Back to Learn
                                </Link>
                                <button className="btn btn-primary flex-1 px-3 py-2.5 text-sm" onClick={continueLesson}>
                                  Next Exercise <ArrowRight size={16} className="ml-1.5 shrink-0" />
                                </button>
                              </>
                            )
                          ) : (
                            <>
                              <Link to={`/lessons?focus=${lesson!.order}`} className="btn flex-1 px-3 py-2.5 text-sm" style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                                <ArrowLeft size={16} className="mr-1.5 shrink-0" /> Back to Learn
                              </Link>
                              <button className="btn btn-primary flex-1 px-3 py-2.5 text-sm" onClick={handleRestart}>
                                <RotateCcw size={16} className="mr-1.5 shrink-0" /> Try Again
                              </button>
                            </>
                          )}
                        </div>
                  </div>
                </div>
              )}
            </div>

            {/* Virtual keyboard */}
            {currentExercise && <VirtualKeyboard currentKey={currentKey} errorKey={errorKey} highlightKeys={currentExercise.targetKeys} variant="premium" />}
          </div>

          {/* RIGHT: Live Performance Card */}
          <aside className="w-full lg:w-[260px] shrink-0 flex flex-col gap-4 lg:sticky lg:top-24">
            <LiveStatsCard
              wpm={engine.liveWpm}
              accuracy={engine.liveAccuracy}
              remaining={displayRemaining}
              elapsed={displayElapsed}
              phase={isPaused ? 'idle' : engine.phase}
              duration={999999}
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
                    navigate('/lessons');
                  }}
                >
                  <ArrowLeft size={16} /> Back to Learn
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </PageWrapper>
  );
}
