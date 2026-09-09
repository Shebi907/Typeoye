import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Target, Lightbulb } from 'lucide-react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { TypingDisplay } from '../components/typing/TypingDisplay';
import { StartTypingHint } from '../components/typing/StartTypingHint';
import { VirtualKeyboard } from '../components/typing/VirtualKeyboard';
import { LiveStatsCard } from '../components/typing/LiveStatsCard';
import { Skeleton, SkeletonText } from '../components/ui/Skeleton';
import { useTypingEngine } from '../hooks/useTypingEngine';
import { practiceService } from '../services/practice.service';
import { typingService } from '../services/typing.service';
import { computeWpm, computeAccuracy } from '../utils/wpm';
import { applySessionRewards } from '../utils/rewards';
import { useAuthStore } from '../store/authStore';
import { PRACTICE_TYPE_BY_SLUG, PRACTICE_TIPS } from '../data/practiceTypes';
import type { EngineResult, PracticeExercise } from '../types';

const levelNumber = (difficulty: string) =>
  difficulty === 'advanced' ? 3 : difficulty === 'intermediate' ? 2 : 1;

interface SetupState {
  duration?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  customText?: string;
  exercise?: PracticeExercise | null;
}

export default function PracticeSession() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const meta = slug ? PRACTICE_TYPE_BY_SLUG[slug] : undefined;
  const { settings, isAuthenticated } = useAuthStore();

  const setup = (location.state ?? {}) as SetupState;
  const duration = setup.duration ?? 300;
  const difficulty = setup.difficulty ?? 'beginner';
  const customText = setup.customText ?? '';

  const [exercise, setExercise] = useState<PracticeExercise | null>(() => setup.exercise ?? null);
  const [lastResult, setLastResult] = useState<EngineResult | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error' | 'guest'>('idle');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [runId, setRunId] = useState(0);
  const appending = useRef(false);
  // First value wins: seeded from the setup payload for the initial run; the
  // fetch handler replaces them on restart/direct-URL runs.
  const queueRef = useRef<string[]>([...(setup.exercise?.queue ?? [])]);
  const seenRef = useRef<Set<string>>(setup.exercise ? new Set([setup.exercise.content]) : new Set());
  const hasSeedRef = useRef(!!setup.exercise);
  const fetchRef = useRef<Promise<PracticeExercise> | null>(null);
  const fetchRunRef = useRef<number>(-1);

  /* ── Practice generation on mount ─────────────────────────────────────── */

  useEffect(() => {
    if (!meta) return;
    let mounted = true;
    setLastResult(null);
    setSaveState('idle');
    setLoadError(null);
    if (meta.key === 'custom' && !customText.trim()) {
      setLoadError('Add some text to practice first.');
      return;
    }

    // The initial render already holds the prepared content, seeded from the
    // setup page BEFORE navigation (see PracticeSetup.start). Doing nothing
    // here keeps the typing screen a single stable render — StrictMode
    // re-invoking this effect is a safe no-op for the seeded flow.
    if (hasSeedRef.current && runId === 0) {
      return;
    }

    // No seed (direct URL) or "Practice again": clear and fetch fresh content.
    // The in-flight promise is shared across StrictMode's double invocation so
    // a session never issues duplicate requests or double-advances rotation.
    setExercise(null);
    if (fetchRunRef.current !== runId) {
      fetchRunRef.current = runId;
      fetchRef.current = practiceService.generate({
        type: meta.key,
        difficulty,
        duration,
        wordCount: 200,
        customText: meta.key === 'custom' ? customText : undefined,
        session: true,
      });
    }
    fetchRef.current!
      .then((generated) => {
        if (!mounted) return;
        setExercise(generated);
        queueRef.current = [...(generated.queue ?? [])];
        seenRef.current = new Set([generated.content]);
        practiceService.commitRotation(generated);
      })
      .catch((error: any) => {
        if (!mounted) return;
        setLoadError(error.response?.data?.error || 'Unable to generate practice.');
      });
    return () => {
      mounted = false;
    };
  }, [meta, difficulty, duration, customText, runId]);

  const onComplete = useCallback(async (result: EngineResult) => {
    setLastResult(result);
    if (!exercise || !result.typedWords.length) return;
    if (!isAuthenticated) {
      setSaveState('guest');
      return;
    }
    setSaveState('saving');
    try {
      const response = await typingService.submitSession({
        mode: 'practice',
        startTime: result.startTime,
        endTime: result.endTime,
        typedWords: result.typedWords,
        textSource: exercise.type === 'custom' ? 'custom' : 'generated',
        clientWpm: result.clientWpm,
        clientAccuracy: result.clientAccuracy,
        practiceType: exercise.type,
        practiceDifficulty: levelNumber(exercise.difficulty),
        focusKeys: exercise.focusKeys,
      });
      applySessionRewards(response.result, response);
      setSaveState('saved');
    } catch {
      setSaveState('error');
    }
  }, [exercise, isAuthenticated]);

  const engine = useTypingEngine({
    text: exercise?.content ?? '',
    durationSeconds: exercise?.duration ?? duration,
    onComplete,
    extendContent: true,
  });

  useEffect(() => {
    if (!exercise || engine.phase !== 'running' || engine.wordStates.length - engine.currentWordIndex >= 60 || appending.current) return;
    appending.current = true;
    const advance = async () => {
      try {
        if (exercise.type === 'custom') {
          const nextCustom = queueRef.current.shift() ?? exercise.content;
          engine.appendText(nextCustom);
          return;
        }
        let pool = queueRef.current.filter((chunk) => !seenRef.current.has(chunk));
        if (!pool.length) {
          const fresh = await practiceService.generate({ type: exercise.type, difficulty, duration, wordCount: 200, session: true });
          practiceService.commitRotation(fresh);
          pool = (fresh.queue ?? []).filter((chunk) => !seenRef.current.has(chunk));
          if (!pool.length) {
            engine.appendText('steady practice builds reliable habits and careful rhythm');
            return;
          }
        }
        const nextChunk = pool[0];
        queueRef.current = pool.slice(1);
        seenRef.current.add(nextChunk);
        engine.appendText(nextChunk);
        if (queueRef.current.length < 2) {
          const fresh = await practiceService.generate({ type: exercise.type, difficulty, duration, wordCount: 200, session: true });
          practiceService.commitRotation(fresh);
          const more = (fresh.queue ?? []).filter((chunk) => !seenRef.current.has(chunk));
          queueRef.current = [...queueRef.current, ...more];
        }
      } catch {
        engine.appendText('steady practice builds reliable habits and careful rhythm');
      } finally {
        appending.current = false;
      }
    };
    void advance();
  }, [exercise, difficulty, duration, engine.phase, engine.wordStates.length, engine.currentWordIndex, engine.appendText]);

  const active = engine.wordStates[engine.currentWordIndex];
  const nextChar = active?.chars.find((char) => char.status === 'current' || char.status === 'pending');
  const currentKey = active && active.typed.length >= active.word.length ? ' ' : nextChar?.char;
  const lastChar = active?.chars[active.typed.length - 1];
  const errorKey = lastChar?.status === 'error' || lastChar?.status === 'extra'
    ? active?.typed[active.typed.length - 1]
    : undefined;

  const running = engine.phase === 'running';
  const finished = engine.phase === 'finished' && !!exercise && !loadError;
  const timeCritical = running && engine.remaining <= 10;

  const resultCorrectWords = lastResult ? lastResult.typedWords.filter((word) => word.word === word.typed).length : 0;
  const resultAttemptedWords = lastResult?.typedWords.length ?? 0;
  const resultWpm = computeWpm(resultCorrectWords, lastResult?.durationSeconds ?? 0);
  const resultAccuracy = computeAccuracy(resultCorrectWords, resultAttemptedWords);
  const resultErrors = resultAttemptedWords - resultCorrectWords;

  if (!meta) {
    return <PageWrapper title={undefined} fullWidth><div /></PageWrapper>;
  }

  const restartSame = () => setRunId((n) => n + 1);

  /* ── Loading / error states ───────────────────────────────────────────── */

  if (loadError) {
    return (
      <PageWrapper fullWidth className="py-8 px-4 sm:px-6" title={undefined}>
        <div className="max-w-md mx-auto text-center">
          <div className="card p-8">
            <p className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              {loadError}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                className="btn btn-primary px-4 py-2"
                onClick={() => navigate(`/practice/${meta.slug}`)}
              >
                Back to setup
              </button>
              <button
                type="button"
                onClick={restartSame}
                className="btn btn-ghost px-4 py-2"
                style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
              >
                <RefreshCw size={16} /> Try again
              </button>
            </div>
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (finished) {
    const statsGrid = [
      { value: `${resultWpm}`, label: 'WPM', background: 'linear-gradient(135deg, rgba(96,165,250,0.12) 0%, rgba(59,130,246,0.08) 100%)', color: '#2563EB', labelColor: '#60A5FA' },
      { value: `${resultAccuracy}%`, label: 'ACCURACY', background: 'linear-gradient(135deg, rgba(244,114,182,0.12) 0%, rgba(236,72,153,0.08) 100%)', color: '#DB2777', labelColor: '#F472B6' },
      { value: `${Math.round(engine.elapsed)}s`, label: 'TIME', background: 'linear-gradient(135deg, rgba(74,222,128,0.12) 0%, rgba(34,197,94,0.08) 100%)', color: '#16A34A', labelColor: '#4ADE80' },
    ];
    return (
      <PageWrapper fullWidth className="tt-page py-6 px-4 sm:px-6" title={undefined}>
        <div className="max-w-6xl mx-auto w-full">
          <div className="flex flex-col lg:flex-row gap-5 w-full items-start">
            {/* ── Result card ── */}
            <div className="flex-1 min-w-0 w-full">
              <div className="card result-card tt-main-card p-5 sm:p-7 w-full" data-testid="practice-result">
                <div className="text-center">
                  <div className="text-3xl mb-1">🎉</div>
                  <h2 className="text-2xl font-extrabold" style={{ color: 'var(--color-text-primary)' }}>
                    Practice Complete!
                  </h2>
                  <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                    {exercise?.summary ?? 'Practice'}
                  </p>
                </div>

                <div className="mt-5">
                  <div className="grid grid-cols-3 gap-3">
                    {statsGrid.map((stat) => (
                      <div key={stat.label} className="rounded-xl p-3 flex flex-col items-center" style={{ background: stat.background }}>
                        <span className="text-2xl font-extrabold tabular-nums" style={{ color: stat.color, fontFamily: '"JetBrains Mono", "Fira Code", monospace' }}>
                          {stat.value}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider mt-1" style={{ color: stat.labelColor }}>{stat.label}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 border-t border-b py-3" style={{ borderColor: 'var(--color-border)' }}>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center justify-between">
                        <span style={{ color: 'var(--color-text-secondary)' }}>Correct words</span>
                        <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{resultCorrectWords}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span style={{ color: 'var(--color-text-secondary)' }}>Errors</span>
                        <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{resultErrors}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {saveState === 'saving' && (
                  <p className="text-sm mt-4 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                    Saving your results…
                  </p>
                )}
                {saveState === 'saved' && (
                  <div
                    className="mt-4 rounded-xl border p-3 text-sm text-center"
                    style={{ borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.08)', color: '#16A34A' }}
                  >
                    Saved — added to your stats. Your weak-key profile and recommendations have been updated.
                  </div>
                )}
                {saveState === 'error' && (
                  <p className="text-sm mt-4 text-center" style={{ color: '#EF4444' }}>
                    Practice finished, but saving failed. Please try again.
                  </p>
                )}
                {saveState === 'guest' && (
                  <div
                    className="mt-4 rounded-xl border p-3 text-sm text-center"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-accent-light)' }}
                  >
                    Practice complete — sign in to save your results and update your weak-key profile.
                  </div>
                )}

                <div className="mt-5 flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={restartSame}
                    data-testid="practice-again"
                    className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-150 hover:brightness-110"
                    style={{ background: 'linear-gradient(135deg, #4361EE, #8B5CF6)', color: '#fff', boxShadow: '0 6px 18px rgba(67, 97, 238, 0.35)' }}
                  >
                    <RefreshCw size={16} /> Practice again
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/practice')}
                    data-testid="choose-another"
                    className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-150"
                    style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', backgroundColor: 'transparent' }}
                  >
                    <ArrowLeft size={15} /> Choose another practice
                  </button>
                </div>
              </div>
            </div>

            {/* ── Right column ── */}
            <aside className="w-full lg:w-[260px] shrink-0 flex flex-col gap-4 lg:sticky lg:top-24">
              <LiveStatsCard
                wpm={engine.liveWpm}
                accuracy={engine.liveAccuracy}
                remaining={engine.remaining}
                elapsed={engine.elapsed}
                phase={engine.phase}
                duration={duration}
              />
              <div className="card tt-tips-card p-4">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(245, 158, 11, 0.16)', color: '#d97706' }}>
                    <Lightbulb size={14} />
                  </div>
                  <h2 className="text-sm font-bold">Tips for Better Practice</h2>
                </div>
                <ul className="flex flex-col gap-1.5">
                  {PRACTICE_TIPS.map((tip) => (
                    <li key={tip} className="tt-tip-row">
                      <span className="tt-tip-check" aria-hidden="true">✓</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (!exercise || engine.wordStates.length === 0) {
    const keyBlock = { width: 'clamp(17px, 5.4vw, 34px)', height: 'clamp(17px, 5.4vw, 34px)' } as const;
    return (
      <PageWrapper fullWidth className="tt-page py-6 px-4 sm:px-6" title={undefined}>
        <div className="max-w-6xl mx-auto w-full" data-testid="session-loading">
          <div className="mb-4">
            <button
              type="button"
              onClick={() => navigate(`/practice/${meta.slug}`)}
              data-testid="back-to-practice-setup"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors hover:brightness-105 shrink-0"
              style={{
                color: 'var(--color-accent-text)',
                backgroundColor: 'var(--color-accent-light)',
                border: '1px solid var(--color-border)',
              }}
            >
              <ArrowLeft size={15} />
              Back to setup
            </button>
          </div>
          <div className="flex flex-col lg:flex-row gap-5 w-full items-start">
            {/* Main card skeleton — mirrors the real typing card so the footer stays put */}
            <div className="flex-1 min-w-0 w-full">
              <div className="card tt-main-card p-5 sm:p-7 w-full" aria-busy="true">
                <span className="sr-only">Preparing your practice…</span>
                <div className="flex items-start gap-3.5 mb-5">
                  <Skeleton rounded="full" width="44px" height="44px" className="flex-shrink-0" />
                  <div className="flex-1 space-y-2 pt-1">
                    <Skeleton width="140px" height="1.25rem" />
                    <Skeleton width="55%" height="0.8rem" />
                  </div>
                </div>
                <div className="tt-text-shell relative">
                  <div className="space-y-2.5 pt-1">
                    <SkeletonText lines={6} />
                  </div>
                </div>
                {/* Keyboard placeholder — same clamp sizing as VirtualKeyboard 'premium' */}
                <div className="w-full mx-auto mt-4 px-2 max-w-3xl" aria-hidden="true">
                  {[13, 13, 11, 10].map((count, rowIdx) => (
                    <div key={rowIdx} className="flex justify-center gap-[5px] mb-[5px]" style={{ paddingLeft: `${rowIdx * 14}px` }}>
                      {Array.from({ length: count }).map((_, i) => (
                        <Skeleton key={i} width={keyBlock.width} height={keyBlock.height} rounded />
                      ))}
                    </div>
                  ))}
                  <div className="flex justify-center gap-[5px] mt-[5px]">
                    <Skeleton width="clamp(24px, 6vw, 40px)" height="28px" rounded />
                    <Skeleton width="clamp(24px, 6vw, 40px)" height="28px" rounded />
                    <Skeleton width="clamp(110px, 42vw, 200px)" height="28px" rounded />
                    <Skeleton width="clamp(24px, 6vw, 40px)" height="28px" rounded />
                    <Skeleton width="clamp(24px, 6vw, 40px)" height="28px" rounded />
                  </div>
                </div>
              </div>
            </div>

            {/* Right column skeleton */}
            <aside className="w-full lg:w-[260px] shrink-0 flex flex-col gap-4 lg:sticky lg:top-24">
              <div className="card p-4 w-full">
                <Skeleton width="90px" height="0.7rem" className="mb-4" />
                <div className="flex flex-col gap-3.5">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Skeleton width="32px" height="32px" rounded />
                        <Skeleton width="72px" height="0.8rem" />
                      </div>
                      <Skeleton width="46px" height="1.5rem" />
                    </div>
                  ))}
                </div>
                <Skeleton height="6px" width="100%" className="mt-3.5" rounded="full" />
              </div>
              <div className="card p-4">
                <Skeleton width="110px" height="0.8rem" className="mb-3.5" />
                <div className="flex flex-col gap-2.5">
                  {[0, 1, 2, 3].map((i) => (
                    <Skeleton key={i} height="0.85rem" width={i === 3 ? '62%' : '100%'} />
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </PageWrapper>
    );
  }

  /* ── ACTIVE EXERCISE VIEW ────────────────────────────────────────────── */

  return (
    <PageWrapper fullWidth className="tt-page py-6 px-4 sm:px-6" title={undefined}>
      <div className="max-w-6xl mx-auto w-full">
        <div className="mb-4">
          <button
            type="button"
            onClick={() => navigate(`/practice/${meta.slug}`)}
            data-testid="back-to-practice-setup"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors hover:brightness-105 shrink-0"
            style={{
              color: 'var(--color-accent-text)',
              backgroundColor: 'var(--color-accent-light)',
              border: '1px solid var(--color-border)',
            }}
          >
            <ArrowLeft size={15} />
            Back to setup
          </button>
        </div>

        {!isAuthenticated && !finished && (
          <p className="mb-4 text-sm text-secondary text-center">
            Guest mode — results are shown here but not saved.{' '}
            <span className="font-semibold" style={{ color: 'var(--color-accent-text)' }}>
              Create a free account
            </span>{' '}
            to track your progress.
          </p>
        )}

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-5 w-full items-start">
          {/* ── Main column ── */}
          <div className="flex-1 min-w-0 w-full">
            <div className="card tt-main-card p-5 sm:p-7 w-full" data-testid="typing-card">
              {/* Header */}
              <div className="flex items-start gap-3.5 mb-5">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 tt-header-icon">
                  <Target size={20} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold leading-tight">Practice</h1>
                  <p className="text-sm text-secondary mt-1">{exercise.summary}</p>
                </div>
              </div>

              {/* Typing text area */}
              <div className="tt-text-shell relative">
                <div className="relative pt-1">
                  {engine.phase === 'idle' && <StartTypingHint className="-top-1 left-0" />}
                  <TypingDisplay
                    wordStates={engine.wordStates}
                    currentWordIndex={engine.currentWordIndex}
                    fontSize={settings?.fontSize || 22}
                  />
                </div>
              </div>

              {/* Mid-test status / restart */}
              {(running || finished) && (
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  {running && (
                    <p className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--color-accent-text)' }}>
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${timeCritical ? 'bg-[var(--color-error)]' : 'animate-pulse'}`}
                        style={timeCritical ? undefined : { backgroundColor: 'var(--color-accent)' }}
                      />
                      {timeCritical ? 'Almost done — finish strong!' : 'Keep going — the clock is ticking.'}
                    </p>
                  )}
                  <button
                    onClick={() => navigate('/practice')}
                    className="btn btn-ghost tt-restart-btn px-4 py-2 ml-auto"
                  >
                    <RefreshCw size={16} /> Choose another
                  </button>
                </div>
              )}

              {/* Virtual keyboard */}
              <VirtualKeyboard currentKey={currentKey} errorKey={errorKey} highlightKeys={exercise.focusKeys} variant="premium" />
            </div>
          </div>

          {/* ── Right column: live stats + tips ── */}
          <aside className="w-full lg:w-[260px] shrink-0 flex flex-col gap-4 lg:sticky lg:top-24">
            <LiveStatsCard
              wpm={engine.liveWpm}
              accuracy={engine.liveAccuracy}
              remaining={engine.remaining}
              elapsed={engine.elapsed}
              phase={engine.phase}
              duration={duration}
            />

            <div className="card tt-tips-card p-4">
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(245, 158, 11, 0.16)', color: '#d97706' }}>
                  <Lightbulb size={14} />
                </div>
                <h2 className="text-sm font-bold">Tips for Better Practice</h2>
              </div>
              <ul className="flex flex-col gap-1.5">
                {PRACTICE_TIPS.map((tip) => (
                  <li key={tip} className="tt-tip-row">
                    <span className="tt-tip-check" aria-hidden="true">✓</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </PageWrapper>
  );
}