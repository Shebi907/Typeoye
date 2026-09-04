import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCw, Zap, Shield, Trophy, ArrowLeft, Gauge, Target, Clock, Square, Info } from 'lucide-react';
import { useAccuracyEngine } from '../../hooks/useAccuracyEngine';
import { TypingDisplay } from '../typing/TypingDisplay';
import { generateWordList } from '../../data/wordLists';
import { gamesService, type GameSubmitResponse } from '../../services/games.service';
import { computeWpm, computeAccuracy } from '../../utils/wpm';
import { useAuthStore } from '../../store/authStore';
import { applySessionRewards } from '../../utils/rewards';
import { cn } from '../../utils/cn';
import { Link } from 'react-router-dom';
import GameOverOverlay from './GameOverOverlay';
import { BackToGames } from './GameControls';
import type { EngineResult } from '../../types';

const WORD_COUNT = 300;
const SHIELD_INTERVAL = 25;
const MAX_SHIELDS = 3;
const STREAK_SEGMENTS = 10;

interface SprintResult {
  streak: number;
  wpm: number;
  accuracy: number;
  elapsed: number;
}

const BEST_KEY = 'typeoye_sudden_death_best';

function getBest(): number {
  try { return parseInt(localStorage.getItem(BEST_KEY) || '0', 10) || 0; } catch { return 0; }
}

function setBest(val: number) {
  try { localStorage.setItem(BEST_KEY, String(val)); } catch { /* noop */ }
}

function generateInitialText(): string {
  return generateWordList(WORD_COUNT, false, false);
}

export default function SuddenDeath({ onBack }: { onBack?: () => void }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [view, setView] = useState<'intro' | 'playing' | 'done'>('intro');
  const [result, setResult] = useState<SprintResult | null>(null);
  const [saved, setSaved] = useState<GameSubmitResponse | null>(null);
  const [saving, setSaving] = useState(false);
  const [best, setBestState] = useState(getBest);
  const submitted = useRef(false);
  const appendedRef = useRef(0);

  const [streak, setStreak] = useState(0);
  const [shields, setShields] = useState(0);
  const [shieldAbsorbed, setShieldAbsorbed] = useState(false);
  const [text, setText] = useState(generateInitialText);
  const [hasStartedTyping, setHasStartedTyping] = useState(false);

  const streakRef = useRef(0);
  const shieldsRef = useRef(0);
  const startTimeRef = useRef(0);
  const engineRef = useRef<ReturnType<typeof useAccuracyEngine> | null>(null);

  const handleComplete = useCallback(
    async (engineResult: EngineResult) => {
      if (submitted.current) return;

      const lastWord = engineResult.typedWords[engineResult.typedWords.length - 1];

      if (lastWord && !lastWord.correct) {
        // Error occurred — check shields
        if (shieldsRef.current > 0) {
          shieldsRef.current--;
          setShields(shieldsRef.current);
          setShieldAbsorbed(true);
          setTimeout(() => setShieldAbsorbed(false), 600);

          // Reset engine with fresh text and continue
          const freshText = generateWordList(WORD_COUNT, false, false);
          setText(freshText);
          engineRef.current?.resetEngine(freshText);
          return;
        }

        // No shields — game over
        submitted.current = true;
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        const gameResult: SprintResult = {
          streak: streakRef.current,
          wpm: engineResult.clientWpm,
          accuracy: engineResult.clientAccuracy,
          elapsed: Math.round(elapsed),
        };
        setResult(gameResult);
        setView('done');

        if (streakRef.current > best) {
          setBest(streakRef.current);
          setBestState(streakRef.current);
        }

        if (isAuthenticated) {
          setSaving(true);
          try {
            const response = await gamesService.completeGame({
              mode: 'game',
              game: 'suddenDeath',
              score: streakRef.current,
              startTime: engineResult.startTime,
              endTime: engineResult.endTime,
              typedWords: engineResult.typedWords,
              textSource: 'generated',
              clientWpm: engineResult.clientWpm,
              clientAccuracy: engineResult.clientAccuracy,
            });
            setSaved(response);
            applySessionRewards(response.result, response);
          } catch {
            // silently fail
          } finally {
            setSaving(false);
          }
        }
      }
    },
    [isAuthenticated, best],
  );

  const engine = useAccuracyEngine({ text, onComplete: handleComplete });
  engineRef.current = engine;

  // Presentational: hide the "Start typing to begin" pill once the user begins
  useEffect(() => {
    if (engine.phase === 'running') setHasStartedTyping(true);
  }, [engine.phase]);

  // Track correct words for streak + shields
  useEffect(() => {
    if (engine.phase !== 'running') return;
    const correctWords = engine.correctWordsCount;
    if (correctWords > streakRef.current) {
      streakRef.current = correctWords;
      setStreak(correctWords);

      // Check for shield award
      const prevStreak = streakRef.current;
      if (correctWords > 0 && correctWords % SHIELD_INTERVAL === 0 && shieldsRef.current < MAX_SHIELDS) {
        shieldsRef.current++;
        setShields(shieldsRef.current);
      }
    }
  }, [engine.phase, engine.correctWordsCount]);

  // Append more text as user approaches end
  useEffect(() => {
    if (engine.phase !== 'running') return;
    const total = engine.wordStates.length;
    const progress = engine.currentWordIndex / total;
    if (progress > 0.6 && appendedRef.current < 5) {
      appendedRef.current++;
      const more = generateWordList(WORD_COUNT, false, false);
      const combined = text + ' ' + more;
      setText(combined);
      engine.resetEngine(combined);
    }
  }, [engine.phase, engine.currentWordIndex, engine.wordStates.length]);

  const startGame = () => {
    submitted.current = false;
    setResult(null);
    setSaved(null);
    setSaving(false);
    appendedRef.current = 0;
    streakRef.current = 0;
    shieldsRef.current = 0;
    startTimeRef.current = Date.now();
    setStreak(0);
    setShields(0);
    setHasStartedTyping(false);
    setText(generateInitialText());
    setView('playing');
    engine.resetEngine(generateInitialText());
  };

  const stopGame = useCallback(() => {
    if (submitted.current) return;
    submitted.current = true;
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    const typedWords = engine.wordStates
      .filter((w) => w.status === 'correct' || w.status === 'error')
      .map((w) => ({ word: w.word, typed: w.typed, correct: w.word === w.typed, timeTakenMs: w.timeTakenMs ?? 0 }));
    const correctWords = typedWords.filter((w) => w.correct).length;
    const now = Date.now();
    const gameResult: SprintResult = {
      streak: streakRef.current,
      wpm: computeWpm(correctWords, elapsed),
      accuracy: computeAccuracy(correctWords, typedWords.length),
      elapsed: Math.round(elapsed),
    };
    setResult(gameResult);
    setView('done');

    if (streakRef.current > best) {
      setBest(streakRef.current);
      setBestState(streakRef.current);
    }

    if (isAuthenticated) {
      setSaving(true);
      void (async () => {
        try {
          const response = await gamesService.completeGame({
            mode: 'game',
            game: 'suddenDeath',
            score: streakRef.current,
            startTime: new Date(now - elapsed * 1000).toISOString(),
            endTime: new Date(now).toISOString(),
            typedWords: typedWords.length > 0 ? typedWords : [{ word: '', typed: '', correct: false, timeTakenMs: 0 }],
            textSource: 'generated',
            clientWpm: computeWpm(correctWords, elapsed),
            clientAccuracy: computeAccuracy(correctWords, typedWords.length),
          });
          setSaved(response);
          applySessionRewards(response.result, response);
        } catch {
          // silently fail
        } finally {
          setSaving(false);
        }
      })();
    }
  }, [engine, isAuthenticated, best]);

  const active = engine.wordStates[engine.currentWordIndex];

  const mins = Math.floor(engine.elapsed / 60);
  const secs = Math.floor(engine.elapsed % 60);

  // ── Intro ──────────────────────────────────────────────────────────
  if (view === 'intro') {
    return (
      <div className="relative overflow-hidden" style={{ width: '100vw', marginLeft: 'calc((100vw - 100%) / -2)' }}>
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute rounded-full" style={{ top: -120, left: -120, width: 420, height: 420, background: 'radial-gradient(circle, rgba(99,102,241,0.08), transparent 70%)' }} />
          <div className="absolute rounded-full" style={{ top: 80, right: -140, width: 460, height: 460, background: 'radial-gradient(circle, rgba(139,92,246,0.09), transparent 70%)' }} />
        </div>

        <div className="relative mx-auto w-full max-w-[94vw] px-4 sm:px-2">
          <div className="mb-5">
            <BackToGames onBack={onBack} />
          </div>

        {/* Gradient header */}
        <div
          className="rounded-2xl p-5 sm:p-6 mb-5 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #3730A3 0%, #4361EE 55%, #8B5CF6 100%)', boxShadow: '0 14px 34px -10px rgba(67, 97, 238, 0.45)' }}
        >
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[inherit]" aria-hidden="true">
            <span className="navbar-gradient-circle w-48 h-48 -right-16 -top-24" />
            <span className="navbar-gradient-circle w-36 h-36 -left-12 -bottom-20" style={{ opacity: 0.6 }} />
          </div>
          <div className="relative flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/20 ring-1 ring-white/30 flex items-center justify-center flex-none">
                <Zap size={22} color="#ffffff" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-white leading-tight">Sudden Death Sprint</h1>
                <p className="text-sm text-white/85 mt-0.5">One mistake ends it — unless you've earned a shield. How long can you last?</p>
              </div>
            </div>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-5 lg:items-stretch">

          {/* Left: game preview panel — centered bolt + sample passage */}
          <div className="flex-1 min-w-0 flex">
            <div
              className="w-full rounded-2xl border flex flex-col items-center justify-center px-8 py-12"
              style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)', minHeight: 400 }}
            >
              <div
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #3730A3 0%, #4361EE 55%, #8B5CF6 100%)', boxShadow: '0 16px 36px -12px rgba(67, 97, 238, 0.45)' }}
              >
                <Zap size={52} color="#ffffff" fill="#ffffff" />
              </div>
              <p className="font-mono text-lg text-center mt-8" style={{ color: 'var(--color-text-secondary)' }}>
                the quick brown fox jumps over the lazy dog and runs...
              </p>
            </div>
          </div>

          {/* Right: Instructions + start */}
          <div className="w-full lg:w-[340px] shrink-0 flex">
            <div
              className="w-full rounded-2xl border p-6 sm:p-7 flex flex-col gap-4"
              style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}
            >
              {/* Heading */}
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent-text)' }}
                >
                  <Zap size={17} />
                </div>
                <h2 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>Ready to sprint?</h2>
              </div>

              {/* Instruction rows */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl" style={{ backgroundColor: 'rgba(99, 102, 241, 0.10)' }}>
                  <Zap size={15} className="shrink-0 mt-0.5" style={{ color: '#6366F1' }} />
                  <p className="text-sm leading-snug" style={{ color: 'var(--color-text-secondary)' }}>
                    Type fast. The sprint ends on your first mistake.
                  </p>
                </div>
                <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl" style={{ backgroundColor: 'rgba(99, 102, 241, 0.10)' }}>
                  <Shield size={15} className="shrink-0 mt-0.5" style={{ color: '#6366F1' }} />
                  <p className="text-sm leading-snug" style={{ color: 'var(--color-text-secondary)' }}>
                    Every <span className="font-bold">{SHIELD_INTERVAL}</span> correct words earns a shield that absorbs one mistake.
                  </p>
                </div>
                <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl" style={{ backgroundColor: 'rgba(234, 179, 8, 0.10)' }}>
                  <Trophy size={15} className="shrink-0 mt-0.5" style={{ color: '#EAB308' }} />
                  <p className="text-sm leading-snug" style={{ color: 'var(--color-text-secondary)' }}>
                    Your best streak: <span className="font-bold" style={{ color: '#EAB308' }}>{best} words</span>
                  </p>
                </div>
              </div>

              {/* Start button */}
              <button
                onClick={startGame}
                className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 mt-auto transition-all duration-150 hover:brightness-110"
                style={{ background: 'linear-gradient(135deg, #4361EE, #8B5CF6)', color: '#fff', boxShadow: '0 6px 18px rgba(67, 97, 238, 0.35)' }}
              >
                <Zap size={16} fill="currentColor" /> Start sprint
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>
    );
  }

  // ── Done / game-over state ────────────────────────────────────────
  const gameOver = view === 'done' && result;
  const isNewBest = gameOver ? result!.streak >= best : false;

  const resultCard = gameOver ? (
    <div className="w-full max-w-[400px]">
      <div className="card result-card overflow-hidden" style={{ boxShadow: '0 20px 50px -15px rgba(0,0,0,0.25)' }}>
        <div
          className="px-5 py-4 text-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.04) 100%)' }}
        >
          <div className="w-11 h-11 rounded-xl mx-auto flex items-center justify-center" style={{ backgroundColor: 'var(--color-accent-light)', boxShadow: '0 4px 12px rgba(67,97,238,0.18)' }}>
            <Zap size={20} style={{ color: 'var(--color-accent-text)' }} />
          </div>
          <h2 className="text-xl font-extrabold mt-2" style={{ color: 'var(--color-text-primary)' }}>Round Over!</h2>
          <p className="text-[13px] mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Survived {Math.floor(result!.elapsed / 60)}m {result!.elapsed % 60}s · Sprint complete
          </p>
          {isNewBest && <p className="text-sm font-bold mt-2" style={{ color: '#EAB308' }}>New personal best!</p>}
          {!isNewBest && best > 0 && <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>Personal best: {best} words</p>}
        </div>
        <div className="px-5 pt-3 pb-4">
          <div className="grid grid-cols-3 gap-2.5">
            <div className="rounded-xl p-2.5 text-center" style={{ backgroundColor: 'var(--color-accent-light)' }}>
              <div className="w-7 h-7 rounded-lg mx-auto flex items-center justify-center mb-1.5" style={{ backgroundColor: 'rgba(67,97,238,0.14)' }}>
                <Zap size={14} style={{ color: 'var(--color-accent-text)' }} />
              </div>
              <div className="text-xl font-extrabold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>{result!.streak}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: 'var(--color-text-muted, var(--color-text-secondary))' }}>Streak</div>
            </div>
            <div className="rounded-xl p-2.5 text-center" style={{ backgroundColor: 'rgba(217,119,6,0.08)' }}>
              <div className="w-7 h-7 rounded-lg mx-auto flex items-center justify-center mb-1.5" style={{ backgroundColor: 'rgba(217,119,6,0.15)' }}>
                <Gauge size={14} style={{ color: '#d97706' }} />
              </div>
              <div className="text-xl font-extrabold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>{result!.wpm}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: 'var(--color-text-muted, var(--color-text-secondary))' }}>WPM</div>
            </div>
            <div className="rounded-xl p-2.5 text-center" style={{ backgroundColor: 'rgba(34,197,94,0.08)' }}>
              <div className="w-7 h-7 rounded-lg mx-auto flex items-center justify-center mb-1.5" style={{ backgroundColor: 'rgba(34,197,94,0.15)' }}>
                <Target size={14} style={{ color: 'var(--color-correct)' }} />
              </div>
              <div className="text-xl font-extrabold tabular-nums" style={{ color: 'var(--color-correct)' }}>{result!.accuracy}%</div>
              <div className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: 'var(--color-text-muted, var(--color-text-secondary))' }}>Accuracy</div>
            </div>
          </div>
        </div>
        {!isAuthenticated && (
          <div className="px-5 pt-1 pb-3">
            <div className="flex items-center justify-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm" style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
              <Trophy size={15} style={{ color: '#d97706' }} />
              <span style={{ color: 'var(--color-text-secondary)' }}>
                Sign in to save this score and track your best streak.{' '}
                <Link to="/login" className="font-semibold" style={{ color: 'var(--color-accent-text)' }}>Sign in</Link>
              </span>
            </div>
          </div>
        )}
        {isAuthenticated && (
          <div className="px-5 pb-2">
            <p className="text-xs text-center" style={{ color: 'var(--color-text-secondary)' }}>
              {saving ? 'Saving\u2026' : saved ? 'Saved \u2014 XP added to your stats' : ''}
            </p>
          </div>
        )}
        <div className="px-5 pb-5 flex gap-2.5">
          <button
            onClick={startGame}
            className="flex-1 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all duration-150 hover:brightness-110"
            style={{ background: 'linear-gradient(135deg, #4361EE, #8B5CF6)', color: '#fff', boxShadow: '0 4px 12px rgba(67,97,238,0.3)' }}
          >
            <RefreshCw size={15} /> Sprint again
          </button>
          <button
            onClick={onBack}
            className="flex-1 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all duration-150"
            style={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent-text)', border: '1px solid var(--color-border)' }}
          >
            <ArrowLeft size={15} /> Back to Games
          </button>
        </div>
      </div>
    </div>
  ) : null;

  // ── Playing ────────────────────────────────────────────────────────
  const gameContent = (
    <div className="relative overflow-hidden" style={{ width: '100vw', marginLeft: 'calc((100vw - 100%) / -2)' }}>
      {/* Ambient background accents */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute rounded-full" style={{ top: -120, left: -100, width: 420, height: 420, background: 'radial-gradient(circle, rgba(99,102,241,0.08), transparent 70%)' }} />
        <div className="absolute rounded-full" style={{ top: 120, right: -120, width: 480, height: 480, background: 'radial-gradient(circle, rgba(139,92,246,0.10), transparent 70%)' }} />
        <div className="absolute rounded-full" style={{ bottom: -160, left: '32%', width: 380, height: 380, background: 'radial-gradient(circle, rgba(67,97,238,0.06), transparent 70%)' }} />
      </div>

      <div className="relative mx-auto w-full max-w-[94vw] px-4 sm:px-2">
        {/* Back to games — aligned with the container */}
        <div className="mb-5">
          <BackToGames onBack={onBack} />
        </div>

        {/* Main game dashboard container */}
        <div
          className="w-full rounded-3xl overflow-hidden border"
          style={{ borderColor: 'rgba(99, 102, 241, 0.22)', boxShadow: '0 30px 70px -30px rgba(15, 23, 42, 0.35)' }}
        >
          {/* ── Game header ── */}
          <div
            className="relative overflow-hidden px-5 py-4 sm:px-7 sm:py-5"
            style={{ background: 'linear-gradient(135deg, #3730A3 0%, #4361EE 55%, #8B5CF6 100%)' }}
          >
            <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
              <span className="navbar-gradient-circle w-56 h-56 -right-20 -top-28" />
              <span className="navbar-gradient-circle w-44 h-44 -left-16 -bottom-24" style={{ opacity: 0.5 }} />
            </div>
            <div className="relative flex flex-wrap items-center gap-x-4 gap-y-3">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-white/20 ring-1 ring-white/30 flex items-center justify-center flex-none">
                  <Zap size={22} color="#ffffff" fill="#ffffff" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-white leading-tight">Sudden Death Sprint</h1>
                  <p className="text-xs sm:text-sm text-white/80 mt-0.5">One mistake ends it — unless you've earned a shield.</p>
                </div>
                <span className="inline-flex items-center gap-1.5 ml-1 px-2.5 py-1 rounded-full bg-white/20 ring-1 ring-white/25 text-[11px] font-bold text-white whitespace-nowrap">
                  <Shield size={11} className="fill-[#FDE047] text-[#FDE047]" />
                  {shields === 1 ? '1 life left' : `${shields} lives left`}
                </span>
              </div>

              <div className="ml-auto flex items-center gap-2">
                <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-widest text-white/70 mr-1">Lives</span>
                {Array.from({ length: MAX_SHIELDS }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'w-9 h-9 rounded-xl flex items-center justify-center ring-1 transition-all duration-300',
                      i < shields ? 'bg-white/25 ring-white/40 scale-110' : 'bg-white/5 ring-white/20',
                    )}
                  >
                    <Shield size={18} className={i < shields ? 'fill-[#FDE047] text-[#FDE047] drop-shadow-[0_1px_3px_rgba(253,224,71,0.5)]' : 'text-white/35'} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Light surface ── */}
          <div style={{ backgroundColor: 'var(--color-card)' }}>
            {/* Stats bar */}
            <div className="flex" style={{ backgroundColor: 'var(--color-page)' }}>
              {[
                { label: 'WPM', value: engine.liveWpm, sub: 'Speed', color: 'var(--color-accent-text)', Icon: Gauge },
                { label: 'Accuracy', value: `${engine.liveAccuracy}%`, sub: 'Accuracy', color: 'var(--color-correct)', Icon: Target },
                { label: 'Time', value: `${mins}:${secs.toString().padStart(2, '0')}`, sub: 'Time', color: '#D97706', Icon: Clock },
              ].map((s, i) => (
                <React.Fragment key={s.label}>
                  {i > 0 && <div className="w-px self-stretch my-4" style={{ backgroundColor: 'var(--color-border)' }} />}
                  <div className="flex-1 min-w-0 px-3 sm:px-5 py-4 text-center">
                    <s.Icon size={16} className="mx-auto" style={{ color: s.color }} />
                    <div className="mt-1.5 text-2xl sm:text-3xl font-extrabold tabular-nums font-mono leading-none" style={{ color: s.color }}>
                      {s.value}
                    </div>
                    <div className="mt-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                      {s.sub}
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>

            {/* Word streak bar */}
            <div
              className="flex flex-wrap items-center gap-x-3 gap-y-2 px-5 py-3.5 sm:px-7"
              style={{ backgroundColor: 'var(--color-accent-light)', borderTop: '1px solid var(--color-border)' }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: 'var(--color-card)', color: 'var(--color-accent-text)', boxShadow: 'var(--shadow-card)' }}
                >
                  <Zap size={18} />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-extrabold tabular-nums font-mono leading-none" style={{ color: 'var(--color-text-primary)' }}>
                    {streak}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                    Word streak
                  </span>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 ml-2" aria-hidden="true">
                  {Array.from({ length: STREAK_SEGMENTS }).map((_, i) => (
                    <span
                      key={i}
                      className="w-2 h-2 rounded-full transition-all duration-200"
                      style={{
                        backgroundColor: streak % STREAK_SEGMENTS > i ? 'var(--color-accent)' : 'var(--color-border)',
                      }}
                    />
                  ))}
                </div>
              </div>
              <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-medium whitespace-nowrap" style={{ color: 'var(--color-text-muted)' }}>
                <Info size={12} /> One mistake ends the sprint
              </span>
            </div>

            {/* Typing area with controls */}
            <div className="relative">
              {/* Controls — right-aligned above the text card */}
              <div className="flex justify-end gap-2.5 px-5 sm:px-7 pt-5">
                <button
                  onClick={startGame}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 hover:brightness-105"
                  style={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent-text)', border: '1px solid var(--color-border)' }}
                >
                  <RefreshCw size={14} /> Restart
                </button>
                <button
                  onClick={stopGame}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-150 hover:brightness-105"
                  style={{ backgroundColor: 'transparent', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
                >
                  <Square size={13} fill="currentColor" /> Stop Sprint
                </button>
              </div>

              {/* Typing inner container — main focus */}
              <div className="px-5 sm:px-7 pt-2">
                <div
                  className="relative rounded-2xl"
                  style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.09) 0%, rgba(139,92,246,0.07) 100%)', border: '1px solid rgba(99,102,241,0.18)' }}
                >
                  <div className="sd-typing px-6 sm:px-10 py-7 w-full">
                    <div className="relative">
                      {engine.phase === 'idle' && (
                        <div
                          data-testid="start-typing-hint"
                          aria-hidden
                          className="pointer-events-none absolute z-20 select-none bottom-full left-0 mb-1.5"
                        >
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-accent)] px-3 py-1 text-xs font-semibold text-white shadow-md">
                            <Zap size={12} fill="currentColor" /> Start typing
                          </span>
                        </div>
                      )}
                      <TypingDisplay
                        wordStates={engine.wordStates}
                        currentWordIndex={engine.currentWordIndex}
                        fontSize={22}
                        lineHeight={1.9}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (gameOver) {
    return (
      <GameOverOverlay result={resultCard}>
        {gameContent}
      </GameOverOverlay>
    );
  }

  return gameContent;
}
