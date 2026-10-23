import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Lightbulb, RefreshCw, SlidersHorizontal, Timer } from 'lucide-react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { LiveStatsCard } from '../components/typing/LiveStatsCard';
import { UrduTypingDisplay } from '../components/typing/UrduTypingDisplay';
import { UrduTypingHeader } from '../components/typing/UrduTypingHeader';
import { UrduStartHint } from '../components/typing/UrduStartHint';
import { UrduVirtualKeyboard } from '../components/typing/UrduVirtualKeyboard';
import { useTypingEngine } from '../hooks/useTypingEngine';
import { useScrollLock } from '../hooks/useScrollLock';
import { useSeo } from '../hooks/useSeo';
import { computeUrduSession, type UrduSession } from '../utils/urduStats';
import { typingService } from '../services/typing.service';
import { useAuthStore } from '../store/authStore';
import type { TypedWord } from '../types';
import {
  createUrduTextSource,
  recordShownPassages,
  type UrduTextSource,
} from '../utils/urduPassageSelector';
import type { UrduDuration } from '../data/urduPassages';
import { ensureUrduContentLoaded } from '../utils/urduContentSync';
import {
  urduKeyFromEvent,
  tokenizeUrdu,
  URDU_CHAR_TO_KEY,
  urduKeyNeedsShift,
} from '../utils/urduPhonetic';

export default function UrduTypingTest() {
  useSeo({
    title: 'Urdu Typing Test – Measure Urdu WPM | Typeoye',
    description:
      'Measure your Urdu typing speed and accuracy in words per minute using the Typeoye phonetic Urdu keyboard mapping.',
    canonicalPath: '/urdu-typing-test',
  });
  const [searchParams] = useSearchParams();
  const durationSec = Number(searchParams.get('duration')) || 60;
  const difficulty: 'easy' | 'medium' | 'hard' = (() => {
    const value = searchParams.get('difficulty');
    return value === 'medium' || value === 'hard' ? value : 'easy';
  })();
  // Map the raw seconds to the passage-pool bucket the test draws from.
  const durationMin: UrduDuration = durationSec >= 300 ? 5 : durationSec >= 120 ? 2 : 1;

  // Each test session owns a text source that draws fresh passages and never
  // repeats text within the session. Passages handed out are remembered so the
  // next session avoids them.
  const sessionRef = useRef<UrduTextSource | null>(null);
  const beginSession = useCallback((): string => {
    const source = createUrduTextSource(difficulty, durationMin);
    sessionRef.current = source;
    recordShownPassages(source.usedPassageIds());
    return source.initialText;
  }, [difficulty, durationMin]);

  const [text, setText] = useState<string>(() => {
    const source = createUrduTextSource(difficulty, durationMin);
    sessionRef.current = source;
    return source.initialText;
  });
  const [summary, setSummary] = useState<UrduSession | null>(null);
  const frozen = useRef(false);
  const appending = useRef(false);
  const [shiftHeld, setShiftHeld] = useState(false);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  // Wall-clock start of the current run, captured on the first keystroke. The
  // engine only exposes elapsed seconds, so we track the real start here to send
  // an accurate startTime/endTime to the server.
  const runStartRef = useRef<number | null>(null);

  // Persist the passages used by the first session once (the initial source is
  // created before effects run so the initializer can stay side-effect free).
  useEffect(() => {
    if (sessionRef.current) {
      recordShownPassages(sessionRef.current.usedPassageIds());
    }
  }, []);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.key === 'Shift') setShiftHeld(true);
    };
    const up = (event: KeyboardEvent) => {
      if (event.key === 'Shift') setShiftHeld(false);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  // A new session (fresh passage) whenever duration or difficulty changes.
  // Skipped on the first render because the source is already built above.
  const sessionStarted = useRef(false);
  useEffect(() => {
    if (!sessionStarted.current) {
      sessionStarted.current = true;
      return;
    }
    frozen.current = false;
    runStartRef.current = null;
    setSummary(null);
    setText(beginSession());
  }, [beginSession, durationSec]);

  // Pull the next batch of never-before-shown text from the active session.
  const newChunk = useCallback(() => {
    const source = sessionRef.current;
    if (!source) return '';
    const chunk = source.nextText();
    recordShownPassages(source.usedPassageIds());
    return chunk;
  }, []);

  const handleComplete = useCallback(() => {}, []);

  const engine = useTypingEngine({
    text,
    durationSeconds: durationSec,
    onComplete: handleComplete,
    extendContent: true,
    mapKey: urduKeyFromEvent,
  });

  // Re-fetch published passages on mount; if that changed the bank and the test
  // has not started, rebuild the session so newly published content shows up
  // immediately (even when arriving via in-app navigation, not a full reload).
  const idleRef = useRef(true);
  idleRef.current = engine.phase === 'idle';
  useEffect(() => {
    let alive = true;
    void ensureUrduContentLoaded(true).then((changed) => {
      if (alive && changed && idleRef.current) {
        frozen.current = false;
        runStartRef.current = null;
        setSummary(null);
        setText(beginSession());
      }
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Freeze the final result exactly once when the timer reaches zero. The
  // session is derived from the engine's word states (never the raw typedWords
  // array) so the trailing, still-active word is judged with the same rule as
  // every committed word.
  useEffect(() => {
    if (engine.phase === 'running' && runStartRef.current === null) {
      runStartRef.current = Date.now() - Math.round(engine.elapsed * 1000);
    }
  }, [engine.phase, engine.elapsed]);

  useEffect(() => {
    if (engine.phase === 'finished' && !frozen.current) {
      frozen.current = true;
      setSummary(computeUrduSession(engine.wordStates, engine.elapsed || durationSec));

      // Persist Urdu typing-test results separately from English. Guests are
      // never stored (mirrors the English test); signed-in users get a row
      // tagged language:'ur' so it feeds only Urdu progress/achievements.
      if (isAuthenticated) {
        const typedWords: TypedWord[] = engine.wordStates
          .filter((w) => w.status === 'correct' || w.status === 'error')
          .map((w) => ({ word: w.word, typed: w.typed, correct: w.word === w.typed, timeTakenMs: w.timeTakenMs ?? 0 }));
        if (typedWords.length) {
          const start = runStartRef.current ?? Date.now();
          const end = start + Math.round((engine.elapsed || durationSec) * 1000);
          const derived = computeUrduSession(engine.wordStates, engine.elapsed || durationSec);
          void typingService
            .submitSession({
              mode: 'test',
              startTime: new Date(start).toISOString(),
              endTime: new Date(end).toISOString(),
              typedWords,
              textSource: 'generated',
              clientWpm: derived.wpm,
              clientAccuracy: derived.accuracy,
              language: 'ur',
            })
            .catch(() => {
              /* best-effort: the result is already shown locally */
            });
        }
      }
    }
  }, [engine.phase, engine.wordStates, engine.elapsed, durationSec, isAuthenticated]);

  useEffect(() => {
    if (
      engine.phase === 'running' &&
      engine.wordStates.length - engine.currentWordIndex < 40 &&
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
    frozen.current = false;
    runStartRef.current = null;
    setSummary(null);
    setText(beginSession());
  }, [beginSession]);

  const finished = engine.phase === 'finished' && !!summary;
  const running = engine.phase === 'running';
  const difficultyLabel = difficulty === 'easy' ? 'Easy' : difficulty === 'medium' ? 'Medium' : 'Hard';

  useScrollLock(finished);

  const durationLabel = durationSec >= 60 ? `${durationSec / 60} min` : `${durationSec}s`;


  return (
    <PageWrapper fullWidth noHeader className="py-8 sm:py-10 px-3 sm:px-4 md:px-6">
      <div className="max-w-[106.25rem] mx-auto w-full">
        <div className="mb-4">
          <Link
            to="/urdu-typing-test/setup"
            data-testid="back-to-urdu-setup"
            className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-lg text-sm font-semibold transition-colors hover:brightness-105 shrink-0"
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
            <div className="card p-4 sm:p-5 lg:p-7 w-full" data-testid="urdu-typing-card">
              <UrduTypingHeader
                englishTitle="Urdu Typing Test"
                subtitle="Type the Urdu passage below as accurately and quickly as you can."
                badges={
                  <>
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[0.6875rem] font-bold"
                      style={{ backgroundColor: 'rgba(67, 97, 238, 0.10)', color: 'var(--color-accent-text)' }}
                    >
                      <Timer size={12} /> {durationSec >= 60 ? `${durationSec / 60} Min` : `${durationSec}s`}
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
                  <button onClick={restart} className="btn btn-secondary text-sm px-4 py-2 flex items-center gap-1.5">
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
              duration={durationSec}
            />

            <div className="card p-4">
              <div className="flex items-center gap-2 mb-2.5">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(245, 158, 11, 0.16)', color: '#d97706' }}
                >
                  <Lightbulb size={14} />
                </div>
                <h2 className="text-sm font-bold">Quick Tips</h2>
              </div>
              <ul dir="rtl" lang="ur" className="flex flex-col gap-1.5 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                {[
                  'آن اسکرین کی بورڈ استعمال کرکے حروف کی ترتیب سیکھیں۔',
                  'کوئی لفظ مکمل ٹائپ ہونے پر ہی درست شمار ہوگا۔',
                  'اگلے لفظ پر جانے کے لیے Space دبائیں۔',
                  'Backspace صرف موجودہ لفظ میں ترمیم کرے گا۔',
                ].map((tip) => (
                  <li key={tip} className="flex gap-1.5 font-urdu text-right leading-loose">
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
              <div className="grid place-items-start sm:place-items-center min-h-full px-3 sm:px-4">
                <div
                  className="result-card w-full text-center overflow-hidden max-w-[calc(100vw-1.5rem)] sm:max-w-md"
                  data-testid="urdu-result-card"
                  style={{ borderRadius: 20, background: 'var(--color-card)', boxShadow: '0 20px 50px -12px rgba(0,0,0,0.25), 0 8px 20px -6px rgba(0,0,0,0.12)' }}
                >
                  <div className="px-4 sm:px-6 pt-5 pb-3">
                    <div className="text-3xl mb-1">🎉</div>
                    <h2 className="text-2xl font-extrabold" data-testid="urdu-result-heading" style={{ color: 'var(--color-text-primary)' }}>
                      Test Completed!
                    </h2>
                  </div>

                  <div className="px-4 sm:px-6 pb-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl p-3 flex flex-col items-center" style={{ background: 'linear-gradient(135deg, rgba(96,165,250,0.12) 0%, rgba(59,130,246,0.08) 100%)' }}>
                        <span data-testid="urdu-result-wpm" className="text-3xl font-extrabold tabular-nums rs-wpm" style={{ fontFamily: '"JetBrains Mono", "Fira Code", monospace' }}>{summary.wpm}</span>
                        <span className="text-[0.625rem] font-bold uppercase tracking-wider mt-1" style={{ color: '#60A5FA' }}>WPM</span>
                      </div>
                      <div className="rounded-xl p-3 flex flex-col items-center" style={{ background: 'linear-gradient(135deg, rgba(244,114,182,0.12) 0%, rgba(236,72,153,0.08) 100%)' }}>
                        <span data-testid="urdu-result-accuracy" className="text-3xl font-extrabold tabular-nums rs-acc" style={{ fontFamily: '"JetBrains Mono", "Fira Code", monospace' }}>{summary.accuracy}%</span>
                        <span className="text-[0.625rem] font-bold uppercase tracking-wider mt-1" style={{ color: '#F472B6' }}>Accuracy</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-3">
                      <div className="rounded-xl p-2.5 sm:p-3 flex flex-col items-center min-w-0" style={{ background: 'rgba(139, 92, 246, 0.08)' }}>
                        <span data-testid="urdu-result-correct" className="text-xl sm:text-2xl font-bold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>{summary.correctWords}</span>
                        <span className="text-[0.5625rem] sm:text-[0.625rem] font-bold uppercase tracking-normal sm:tracking-wider mt-0.5 text-center" style={{ color: 'var(--color-text-muted)' }}>Correct Words</span>
                      </div>
                      <div className="rounded-xl p-2.5 sm:p-3 flex flex-col items-center min-w-0" style={{ background: 'rgba(239, 68, 68, 0.08)' }}>
                        <span data-testid="urdu-result-incorrect" className="text-xl sm:text-2xl font-bold tabular-nums" style={{ color: 'var(--color-error)' }}>{summary.incorrectWords}</span>
                        <span className="text-[0.5625rem] sm:text-[0.625rem] font-bold uppercase tracking-normal sm:tracking-wider mt-0.5 text-center" style={{ color: 'var(--color-text-muted)' }}>Incorrect Words</span>
                      </div>
                      <div className="rounded-xl p-2.5 sm:p-3 flex flex-col items-center min-w-0" style={{ background: 'rgba(34, 197, 94, 0.08)' }}>
                        <span data-testid="urdu-result-duration" className="text-xl sm:text-2xl font-bold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>{durationLabel}</span>
                        <span className="text-[0.5625rem] sm:text-[0.625rem] font-bold uppercase tracking-normal sm:tracking-wider mt-0.5 text-center" style={{ color: 'var(--color-text-muted)' }}>Test Duration</span>
                      </div>
                      <div className="rounded-xl p-2.5 sm:p-3 flex flex-col items-center min-w-0" style={{ background: 'rgba(245, 158, 11, 0.10)' }}>
                        <span data-testid="urdu-result-difficulty" className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{difficultyLabel}</span>
                        <span className="text-[0.5625rem] sm:text-[0.625rem] font-bold uppercase tracking-normal sm:tracking-wider mt-0.5 text-center" style={{ color: 'var(--color-text-muted)' }}>Difficulty</span>
                      </div>
                    </div>
                  </div>

                  <div className="px-4 sm:px-6 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      data-testid="urdu-result-retry"
                      onClick={restart}
                      className="py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-150 hover:brightness-110"
                      style={{ background: 'linear-gradient(135deg, #4361EE, #8B5CF6)', color: '#fff', boxShadow: '0 6px 18px rgba(67, 97, 238, 0.35)' }}
                    >
                      <RefreshCw size={15} /> Retry Test
                    </button>
                    <Link
                      data-testid="urdu-result-back-to-test"
                      to="/urdu-typing-test/setup"
                      className="py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-150 hover:brightness-105"
                      style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', backgroundColor: 'transparent' }}
                    >
                      <ArrowLeft size={15} /> Back to Test
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
