import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Lightbulb, RefreshCw, SlidersHorizontal, Timer } from 'lucide-react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { LiveStatsCard } from '../components/typing/LiveStatsCard';
import { UrduTypingDisplay } from '../components/typing/UrduTypingDisplay';
import { UrduTypingHeader } from '../components/typing/UrduTypingHeader';
import { UrduStartHint } from '../components/typing/UrduStartHint';
import { UrduVirtualKeyboard } from '../components/typing/UrduVirtualKeyboard';
import { useTypingEngine } from '../hooks/useTypingEngine';
import { useScrollLock } from '../hooks/useScrollLock';
import { computeUrduSession, type UrduSession } from '../utils/urduStats';
import { typingService } from '../services/typing.service';
import { useAuthStore } from '../store/authStore';
import type { TypedWord } from '../types';
import {
  createUrduPracticeSource,
  recordUrduPracticeIds,
  urduPracticeHistoryKey,
  type UrduPracticeSource,
} from '../utils/urduPracticeGenerator';
import {
  URDU_PRACTICE_CATEGORY_BY_SLUG,
  urduPracticeDifficultyLabel,
  urduPracticeDurationLabel,
} from '../data/urduPracticeTypes';
import type { UrduPracticeDifficulty } from '../data/urduPracticeTypes';
import { ensureUrduContentLoaded } from '../utils/urduContentSync';
import {
  tokenizeUrdu,
  URDU_CHAR_TO_KEY,
  urduKeyFromEvent,
  urduKeyNeedsShift,
} from '../utils/urduPhonetic';

interface SetupState {
  duration?: number;
  difficulty?: UrduPracticeDifficulty;
  customText?: string;
}

export default function UrduPracticeSession() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const meta = slug ? URDU_PRACTICE_CATEGORY_BY_SLUG[slug] : undefined;

  const setup = (location.state ?? {}) as SetupState;
  const duration = setup.duration ?? 60;
  const difficulty: UrduPracticeDifficulty =
    setup.difficulty === 'medium' || setup.difficulty === 'hard' ? setup.difficulty : 'easy';
  const customText = setup.customText ?? '';
  const durationMinutes = (duration >= 300 ? 5 : duration >= 120 ? 2 : 1) as 1 | 2 | 5;
  const isCustom = meta?.key === 'custom';

  const customMissing = Boolean(isCustom && !customText.trim());

  // Per-session content source. Built synchronously so the first render already
  // has text — there is never an empty typing area.
  const sourceRef = useRef<UrduPracticeSource | null>(null);
  const makeSource = useCallback((): UrduPracticeSource | null => {
    if (!meta || (meta.key === 'custom' && !customText.trim())) return null;
    return createUrduPracticeSource({
      category: meta.key,
      difficulty,
      durationMinutes,
      customText: meta.key === 'custom' ? customText : undefined,
    });
  }, [meta, difficulty, durationMinutes, customText]);

  const [text, setText] = useState<string>(() => {
    const source = makeSource();
    sourceRef.current = source;
    return source?.initialText ?? '';
  });
  const [summary, setSummary] = useState<UrduSession | null>(null);
  const [shiftHeld, setShiftHeld] = useState(false);
  const frozen = useRef(false);
  const appending = useRef(false);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  // Wall-clock start of the current run (the engine exposes only elapsed secs).
  const runStartRef = useRef<number | null>(null);

  const historyKey = meta ? urduPracticeHistoryKey(meta.key, difficulty) : '';

  // Persist the first batch's content ids so later sessions avoid repeating it.
  useEffect(() => {
    if (sourceRef.current) {
      recordUrduPracticeIds(historyKey, sourceRef.current.usedIds());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const newChunk = useCallback((): string => {
    const source = sourceRef.current;
    if (!source) return '';
    const chunk = source.nextText();
    recordUrduPracticeIds(historyKey, source.usedIds());
    return chunk;
  }, [historyKey]);

  const engine = useTypingEngine({
    text,
    durationSeconds: duration,
    onComplete: () => {},
    extendContent: true,
    mapKey: urduKeyFromEvent,
  });

  // Freeze the final result exactly once when the timer reaches zero.
  useEffect(() => {
    if (engine.phase === 'running' && runStartRef.current === null) {
      runStartRef.current = Date.now() - Math.round(engine.elapsed * 1000);
    }
  }, [engine.phase, engine.elapsed]);

  useEffect(() => {
    if (engine.phase === 'finished' && !frozen.current) {
      frozen.current = true;
      setSummary(computeUrduSession(engine.wordStates, engine.elapsed || duration));

      // Persist Urdu practice results separately from English (language:'ur').
      // Guests are never stored, mirroring the English practice flow.
      if (isAuthenticated && meta && meta.key !== 'custom') {
        const typedWords: TypedWord[] = engine.wordStates
          .filter((w) => w.status === 'correct' || w.status === 'error')
          .map((w) => ({ word: w.word, typed: w.typed, correct: w.word === w.typed, timeTakenMs: w.timeTakenMs ?? 0 }));
        if (typedWords.length) {
          const start = runStartRef.current ?? Date.now();
          const end = start + Math.round((engine.elapsed || duration) * 1000);
          const derived = computeUrduSession(engine.wordStates, engine.elapsed || duration);
          void typingService
            .submitSession({
              mode: 'practice',
              startTime: new Date(start).toISOString(),
              endTime: new Date(end).toISOString(),
              typedWords,
              textSource: 'generated',
              clientWpm: derived.wpm,
              clientAccuracy: derived.accuracy,
              practiceType: meta.key,
              practiceDifficulty: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
              language: 'ur',
            })
            .catch(() => {
              /* best-effort: the result is already shown locally */
            });
        }
      }
    }
  }, [engine.phase, engine.wordStates, engine.elapsed, duration, isAuthenticated, meta, difficulty]);

  // Pull more content when the visible text runs low.
  useEffect(() => {
    if (
      engine.phase === 'running' &&
      engine.wordStates.length - engine.currentWordIndex < 50 &&
      !appending.current
    ) {
      appending.current = true;
      engine.appendText(newChunk());
      appending.current = false;
    }
  }, [engine.phase, engine.wordStates.length, engine.currentWordIndex, engine.appendText, newChunk]);

  const active = engine.wordStates[engine.currentWordIndex];
  const { activeKey, shiftActive } = useMemo(() => {
    if (!active) return { activeKey: undefined, shiftActive: false };
    const units = tokenizeUrdu(active.word);
    const typedUnits = tokenizeUrdu(active.typed).length;
    const key = typedUnits >= units.length ? ' ' : URDU_CHAR_TO_KEY[units[typedUnits]];
    return { activeKey: key, shiftActive: urduKeyNeedsShift(key) };
  }, [active]);

  const live = useMemo(
    () => computeUrduSession(engine.wordStates, engine.elapsed),
    [engine.wordStates, engine.elapsed],
  );

  const restart = useCallback(() => {
    const source = makeSource();
    sourceRef.current = source;
    recordUrduPracticeIds(historyKey, source?.usedIds() ?? []);
    frozen.current = false;
    runStartRef.current = null;
    setSummary(null);
    setText(source?.initialText ?? '');
  }, [makeSource, historyKey]);

  // Re-fetch published content on mount; for managed categories, if that changed
  // the pool and the session has not started, rebuild it so newly published
  // items show up (including on in-app navigation rather than a full reload).
  const idleRef = useRef(true);
  idleRef.current = engine.phase === 'idle';
  useEffect(() => {
    let alive = true;
    void ensureUrduContentLoaded(true).then((changed) => {
      if (alive && changed && idleRef.current && meta && meta.key !== 'custom') restart();
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finished = engine.phase === 'finished' && !!summary;
  const running = engine.phase === 'running';
  const difficultyLabel = urduPracticeDifficultyLabel(difficulty);
  const durationLabel = urduPracticeDurationLabel(duration);

  useScrollLock(finished);

  if (!meta) {
    return <Navigate to="/urdu-practice" replace />;
  }

  if (customMissing) {
    return (
      <PageWrapper noHeader fullWidth className="py-10 px-3 sm:px-4 md:px-6">
        <div className="max-w-md mx-auto text-center">
          <div className="card p-6">
            <p className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              Add some Urdu text to practise first.
            </p>
            <Link
              to={`/urdu-practice/${meta.slug}`}
              className="btn btn-primary px-4 py-2 inline-flex"
            >
              Back to setup
            </Link>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper noHeader fullWidth className="py-8 sm:py-10 px-3 sm:px-4 md:px-6">
      <div className="max-w-[106.25rem] mx-auto w-full">
        <div className="mb-4">
          <Link
            to={`/urdu-practice/${meta.slug}`}
            data-testid="back-to-urdu-practice-setup"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors hover:brightness-105 shrink-0"
            style={{
              color: 'var(--color-accent-text)',
              backgroundColor: 'var(--color-accent-light)',
              border: '1px solid var(--color-border)',
            }}
          >
            <ArrowLeft size={15} />
            Back to setup
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-5 w-full items-start">
          <div className="flex-1 min-w-0 w-full">
            <div className="card p-4 sm:p-5 lg:p-7 w-full" data-testid="urdu-practice-card">
              <UrduTypingHeader
                englishTitle={meta.heroTitleEn}
                subtitle={`${meta.labelEn} practice · type the Urdu text as accurately and quickly as you can.`}
                badges={
                  <>
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[0.6875rem] font-bold"
                      style={{ backgroundColor: 'rgba(67, 97, 238, 0.10)', color: 'var(--color-accent-text)' }}
                    >
                      <Timer size={12} /> {durationLabel}
                    </span>
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[0.6875rem] font-bold"
                      style={{ backgroundColor: 'rgba(139, 92, 246, 0.10)', color: 'var(--color-accent-text)' }}
                    >
                      <SlidersHorizontal size={12} /> {difficultyLabel}
                    </span>
                  </>
                }
              />

              <div
                onPaste={(event) => event.preventDefault()}
                onCut={(event) => event.preventDefault()}
                onDrop={(event) => event.preventDefault()}
                className="relative"
              >
                <div className="relative pt-12">
                  {engine.phase === 'idle' && <UrduStartHint className="top-0 right-0" />}
                  <UrduTypingDisplay
                    wordStates={engine.wordStates}
                    currentWordIndex={engine.currentWordIndex}
                    fontSize={30}
                    lineHeight={2.8}
                  />
                </div>
              </div>

              {(running || finished) && (
                <div className="flex justify-end mt-2">
                  <button
                    type="button"
                    data-testid="urdu-practice-restart"
                    onClick={restart}
                    className="btn btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
                  >
                    <RefreshCw size={14} /> Restart
                  </button>
                </div>
              )}

              <div dir="rtl" className="mt-4 font-urdu">
                <UrduVirtualKeyboard activeKey={activeKey} shiftActive={shiftActive || shiftHeld} />
              </div>
            </div>
          </div>

          <aside className="w-full lg:w-[16.25rem] shrink-0 flex flex-col gap-4 lg:sticky lg:top-24">
            <LiveStatsCard
              wpm={live.wpm}
              accuracy={live.accuracy}
              remaining={engine.remaining}
              elapsed={engine.elapsed}
              phase={engine.phase}
              duration={duration}
            />

            <div className="card p-4">
              <div className="flex items-center gap-2 mb-2.5">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(245, 158, 11, 0.16)', color: '#d97706' }}
                >
                  <Lightbulb size={14} />
                </div>
                <h2 className="text-sm font-bold">Tips</h2>
              </div>
              <ul dir="rtl" lang="ur" className="flex flex-col gap-1.5 text-xs">
                {[
                  'اردو فونٹک کی بورڈ میپنگ استعمال کریں۔',
                  'الفاظ مکمل ٹائپ کرنے پر ہی درست شمار ہوتے ہیں۔',
                  'اگلے لفظ کے لیے اسپیس دبائیں۔',
                  'بیک اسپیس صرف موجودہ لفظ میں ترمیم کرتا ہے۔',
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

        {finished && summary && (
          <>
            <div className="fixed inset-0 z-20 backdrop-blur-md bg-black/40" aria-hidden="true" />
            <div className="fixed inset-0 z-30 overflow-y-auto" style={{ paddingTop: 'calc(var(--navbar-h, 4rem) + 1rem)', paddingBottom: '1rem' }}>
              <div className="grid place-items-center min-h-full px-3 sm:px-4">
                <div
                  className="result-card w-full text-center overflow-hidden max-w-[calc(100vw-1.5rem)] sm:max-w-md"
                  data-testid="urdu-practice-result"
                  style={{ borderRadius: 20, background: 'var(--color-card)', boxShadow: '0 20px 50px -12px rgba(0,0,0,0.25), 0 8px 20px -6px rgba(0,0,0,0.12)' }}
                >
                  <div className="px-6 pt-5 pb-3">
                    <div className="text-3xl mb-1">🎉</div>
                    <h2 className="text-2xl font-extrabold" data-testid="urdu-practice-result-heading" style={{ color: 'var(--color-text-primary)' }}>
                      Practice Complete!
                    </h2>
                    <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                      {meta.labelEn} · {difficultyLabel} · {durationLabel}
                    </p>
                  </div>

                  <div className="px-6 pb-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl p-3 flex flex-col items-center" style={{ background: 'linear-gradient(135deg, rgba(96,165,250,0.12) 0%, rgba(59,130,246,0.08) 100%)' }}>
                        <span data-testid="urdu-practice-result-wpm" className="text-3xl font-extrabold tabular-nums rs-wpm" style={{ fontFamily: '"JetBrains Mono", "Fira Code", monospace' }}>{summary.wpm}</span>
                        <span className="text-[0.625rem] font-bold uppercase tracking-wider mt-1" style={{ color: '#60A5FA' }}>WPM</span>
                      </div>
                      <div className="rounded-xl p-3 flex flex-col items-center" style={{ background: 'linear-gradient(135deg, rgba(244,114,182,0.12) 0%, rgba(236,72,153,0.08) 100%)' }}>
                        <span data-testid="urdu-practice-result-accuracy" className="text-3xl font-extrabold tabular-nums rs-acc" style={{ fontFamily: '"JetBrains Mono", "Fira Code", monospace' }}>{summary.accuracy}%</span>
                        <span className="text-[0.625rem] font-bold uppercase tracking-wider mt-1" style={{ color: '#F472B6' }}>Accuracy</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div className="rounded-xl p-3 flex flex-col items-center" style={{ background: 'rgba(34, 197, 94, 0.08)' }}>
                        <span data-testid="urdu-practice-result-correct" className="text-2xl font-bold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>{summary.correctWords}</span>
                        <span className="text-[0.625rem] font-bold uppercase tracking-wider mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Correct Words</span>
                      </div>
                      <div className="rounded-xl p-3 flex flex-col items-center" style={{ background: 'rgba(239, 68, 68, 0.08)' }}>
                        <span data-testid="urdu-practice-result-incorrect" className="text-2xl font-bold tabular-nums" style={{ color: 'var(--color-error)' }}>{summary.incorrectWords}</span>
                        <span className="text-[0.625rem] font-bold uppercase tracking-wider mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Incorrect Words</span>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 pb-5 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      data-testid="urdu-practice-again"
                      onClick={restart}
                      className="py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-150 hover:brightness-110"
                      style={{ background: 'linear-gradient(135deg, #4361EE, #8B5CF6)', color: '#fff', boxShadow: '0 6px 18px rgba(67, 97, 238, 0.35)' }}
                    >
                      <RefreshCw size={15} /> Practice again
                    </button>
                    <Link
                      data-testid="urdu-practice-choose-another"
                      to="/urdu-practice"
                      className="py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-150 hover:brightness-105"
                      style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', backgroundColor: 'transparent' }}
                    >
                      <ArrowLeft size={15} /> Choose another
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </PageWrapper>
  );
}
