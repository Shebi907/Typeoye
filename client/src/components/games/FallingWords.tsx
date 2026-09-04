import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCw, Heart, CloudLightning, ArrowLeft, AlertTriangle, Gamepad2, Keyboard, ShieldAlert, Play, Type, Gauge, Target, Trophy, Clock } from 'lucide-react';
import { COMMON_WORDS } from '../../data/wordLists';
import { gamesService, type GameSubmitResponse } from '../../services/games.service';
import { useAuthStore } from '../../store/authStore';
import { applySessionRewards } from '../../utils/rewards';
import { computeWpm, computeAccuracy } from '../../utils/wpm';
import { cn } from '../../utils/cn';
import { Link } from 'react-router-dom';
import GameOverOverlay from './GameOverOverlay';
import { BackToGames } from './GameControls';
import type { EngineResult, TypedWord } from '../../types';

interface FallingWord {
  id: number;
  text: string;
  x: number;
  y: number;
  speed: number;
  completed?: boolean;
}

interface Bullet {
  id: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  progress: number;
  wordId: number;
}

interface Spark {
  angle: number;
  dist: number;
  size: number;
  color: string;
}

interface HitEffect {
  id: number;
  x: number;
  y: number;
  progress: number;
  sparks: Spark[];
}

interface GameResult {
  score: number;
  wpm: number;
  accuracy: number;
  elapsed: number;
}

const CANVAS_W = 800;
const CANVAS_H = 240;
const DANGER_Y = CANVAS_H - 6;
const BASE_SPEED = 45;
const SPEED_INCREMENT = 5;
const WORDS_PER_LEVEL = 5;
const INITIAL_LIVES = 3;
const SPAWN_INTERVAL_BASE = 1800;
const SPAWN_INTERVAL_MIN = 500;
const BULLET_SPEED = 8;
const BULLET_BURST = 4;
const HIT_DURATION = 0.3;
const SPARK_COLORS = ['#93C5FD', '#A5B4FC', '#C4B5FD', '#FDE68A', '#FEF3C7'];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeSparks(): Spark[] {
  const count = 7 + Math.floor(Math.random() * 3);
  const sparks: Spark[] = [];
  for (let i = 0; i < count; i++) {
    sparks.push({
      angle: Math.random() * Math.PI * 2,
      dist: 14 + Math.random() * 26,
      size: 2 + Math.random() * 3,
      color: SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)],
    });
  }
  return sparks;
}

export default function FallingWords({ onBack }: { onBack?: () => void }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [view, setView] = useState<'setup' | 'playing' | 'done'>('setup');
  const [result, setResult] = useState<GameResult | null>(null);
  const [saved, setSaved] = useState<GameSubmitResponse | null>(null);
  const [saving, setSaving] = useState(false);
  const submitted = useRef(false);

  // Game state (all refs for the animation loop)
  const wordsRef = useRef<FallingWord[]>([]);
  const livesRef = useRef(INITIAL_LIVES);
  const scoreRef = useRef(0);
  const inputRef = useRef('');
  const startTimeRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const levelRef = useRef(0);
  const activeTargetRef = useRef<number | null>(null);
  const typedWordsRef = useRef<TypedWord[]>([]);
  const idCounterRef = useRef(0);
  const bulletIdRef = useRef(0);
  const hitIdRef = useRef(0);
  const bulletsRef = useRef<Bullet[]>([]);
  const hitsRef = useRef<HitEffect[]>([]);
  const wordPoolRef = useRef<string[]>([]);
  const poolIndexRef = useRef(0);
  const frameRef = useRef<number>(0);

  // React state for display (updated via ref polling)
  const [displayLives, setDisplayLives] = useState(INITIAL_LIVES);
  const [displayScore, setDisplayScore] = useState(0);
  const [displayWords, setDisplayWords] = useState<FallingWord[]>([]);
  const [displayInput, setDisplayInput] = useState('');
  const [displayTargetId, setDisplayTargetId] = useState<number | null>(null);
  const [displayBullets, setDisplayBullets] = useState<Bullet[]>([]);
  const [displayHits, setDisplayHits] = useState<HitEffect[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [bestScore, setBestScore] = useState<{ wpm: number; accuracy: number; score: number } | null>(null);

  // Display-only "longest streak" (consecutive words cleared). Tracked purely
  // for the stats bar; does not affect scoring, lives, or game mechanics.
  const streakRef = useRef(0);
  const longestStreakRef = useRef(0);
  const [displayStreak, setDisplayStreak] = useState(0);

  const getNextWord = useCallback(() => {
    if (poolIndexRef.current >= wordPoolRef.current.length) {
      wordPoolRef.current = shuffleArray(COMMON_WORDS);
      poolIndexRef.current = 0;
    }
    return wordPoolRef.current[poolIndexRef.current++];
  }, []);

  const startGame = useCallback(() => {
    submitted.current = false;
    setResult(null);
    setSaved(null);
    setSaving(false);
    wordsRef.current = [];
    livesRef.current = INITIAL_LIVES;
    scoreRef.current = 0;
    inputRef.current = '';
    startTimeRef.current = performance.now();
    lastSpawnRef.current = 0;
    levelRef.current = 0;
    activeTargetRef.current = null;
    typedWordsRef.current = [];
    idCounterRef.current = 0;
    wordPoolRef.current = shuffleArray(COMMON_WORDS);
    poolIndexRef.current = 0;

    streakRef.current = 0;
    longestStreakRef.current = 0;
    setDisplayStreak(0);

    setDisplayLives(INITIAL_LIVES);
    setDisplayScore(0);
    setDisplayWords([]);
    setDisplayInput('');
    setDisplayTargetId(null);
    setDisplayBullets([]);
    setDisplayHits([]);
    setElapsed(0);
    setBestScore(null);
    setView('playing');
  }, []);

  const endGame = useCallback(async () => {
    if (submitted.current) return;
    submitted.current = true;

    const now = performance.now();
    const elapsedSec = (now - startTimeRef.current) / 1000;
    const correctWords = typedWordsRef.current.filter((w) => w.correct).length;
    const attemptedWords = typedWordsRef.current.length;
    const wpm = computeWpm(correctWords, elapsedSec);
    const accuracy = computeAccuracy(correctWords, attemptedWords);

    const gameResult: GameResult = { score: scoreRef.current, wpm, accuracy, elapsed: Math.round(elapsedSec) };
    setResult(gameResult);
    setView('done');

    if (isAuthenticated) {
      setSaving(true);
      try {
        const startISO = new Date(startTimeRef.current).toISOString();
        const endISO = new Date(now).toISOString();
        const response = await gamesService.completeGame({
          mode: 'game',
          game: 'fallingWords',
          score: scoreRef.current,
          startTime: startISO,
          endTime: endISO,
          typedWords: typedWordsRef.current.length > 0 ? typedWordsRef.current : [{ word: '', typed: '', correct: false, timeTakenMs: 0 }],
          textSource: 'generated',
          clientWpm: wpm,
          clientAccuracy: accuracy,
        });
        setSaved(response);
        applySessionRewards(response.result, response);
      } catch {
        // silently fail
      } finally {
        setSaving(false);
      }
    }
  }, [isAuthenticated]);

  // Main game loop
  useEffect(() => {
    if (view !== 'playing') return;

    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      const elapsedSec = (now - startTimeRef.current) / 1000;
      setElapsed(Math.floor(elapsedSec));

      // Difficulty
      const level = Math.floor(scoreRef.current / WORDS_PER_LEVEL);
      levelRef.current = level;
      const speed = BASE_SPEED + level * SPEED_INCREMENT;
      const maxActive = level >= 4 ? 3 : level >= 2 ? 2 : 1;
      const spawnInterval = Math.max(SPAWN_INTERVAL_MIN, SPAWN_INTERVAL_BASE - level * 150);

      // Spawn new words
      if (now - lastSpawnRef.current > spawnInterval && wordsRef.current.length < maxActive + 1) {
        lastSpawnRef.current = now;
        const text = getNextWord();
        const x = 40 + Math.random() * (CANVAS_W - 160);
        wordsRef.current.push({
          id: idCounterRef.current++,
          text,
          x,
          y: -20,
          speed: speed + Math.random() * 10,
        });
      }

      // Move words (skip completed/frozen ones)
      const toRemove: number[] = [];
      for (const w of wordsRef.current) {
        if (w.completed) continue;
        w.y += w.speed * dt;
        if (w.y >= DANGER_Y) {
          toRemove.push(w.id);
          livesRef.current = Math.max(0, livesRef.current - 1);
          streakRef.current = 0;
          setDisplayStreak(longestStreakRef.current);
          typedWordsRef.current.push({ word: w.text, typed: '', correct: false, timeTakenMs: 0 });
          if (activeTargetRef.current === w.id) {
            activeTargetRef.current = null;
            inputRef.current = '';
            setDisplayInput('');
          }
        }
      }
      wordsRef.current = wordsRef.current.filter((w) => !toRemove.includes(w.id));

      // Auto-target: if no active target, pick the closest NON-completed word to danger
      if (activeTargetRef.current === null || !wordsRef.current.find((w) => w.id === activeTargetRef.current)) {
        const candidates = wordsRef.current.filter((w) => !w.completed);
        if (candidates.length > 0) {
          const closest = candidates.reduce((a, b) => (a.y > b.y ? a : b));
          activeTargetRef.current = closest.id;
          setDisplayTargetId(closest.id);
        } else {
          activeTargetRef.current = null;
          setDisplayTargetId(null);
        }
      }

      // Sync display
      setDisplayWords([...wordsRef.current]);
      setDisplayLives(livesRef.current);
      setDisplayScore(scoreRef.current);

      // Animate bullets
      const completedBulletIds: number[] = [];
      for (const b of bulletsRef.current) {
        b.progress = Math.min(1, b.progress + BULLET_SPEED * dt);
        if (b.progress >= 1) completedBulletIds.push(b.id);
      }
      // On arrival: spawn one particle burst per word, then remove it
      const burstWords = new Set<number>();
      for (const bId of completedBulletIds) {
        const bullet = bulletsRef.current.find((b) => b.id === bId);
        if (!bullet) continue;
        if (burstWords.has(bullet.wordId)) continue;
        if (wordsRef.current.some((w) => w.id === bullet.wordId)) {
          burstWords.add(bullet.wordId);
          hitsRef.current.push({ id: hitIdRef.current++, x: bullet.toX, y: bullet.toY, progress: 0, sparks: makeSparks() });
          wordsRef.current = wordsRef.current.filter((w) => w.id !== bullet.wordId);
        }
      }
      bulletsRef.current = bulletsRef.current.filter((b) => !completedBulletIds.includes(b.id));

      // Animate hit effects
      for (const h of hitsRef.current) {
        h.progress = Math.min(1, h.progress + dt / HIT_DURATION);
      }
      hitsRef.current = hitsRef.current.filter((h) => h.progress < 1);

      setDisplayBullets([...bulletsRef.current]);
      setDisplayHits([...hitsRef.current]);

      // Check game over
      if (livesRef.current <= 0) {
        void endGame();
        return;
      }

      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameRef.current);
  }, [view, getNextWord, endGame]);

  // Keyboard handler
  useEffect(() => {
    if (view !== 'playing') return;

    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.key === 'Tab') return;

      if (e.key === 'Backspace') {
        e.preventDefault();
        inputRef.current = inputRef.current.slice(0, -1);
        setDisplayInput(inputRef.current);
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        activeTargetRef.current = null;
        inputRef.current = '';
        setDisplayInput('');
        setDisplayTargetId(null);
        return;
      }

      if (e.key.length !== 1) return;
      e.preventDefault();

      const newInput = inputRef.current + e.key;
      inputRef.current = newInput;
      setDisplayInput(newInput);

      // Check if input matches any word (exact match = word cleared)
      const targetId = activeTargetRef.current!;
      const target = wordsRef.current.find((w) => w.id === targetId);
      if (target && newInput === target.text) {
        // Word cleared — score/state update immediately, then fire a burst of
        // bullets toward the word. The animation is purely visual.
        scoreRef.current++;
        streakRef.current++;
        if (streakRef.current > longestStreakRef.current) longestStreakRef.current = streakRef.current;
        setDisplayStreak(longestStreakRef.current);
        typedWordsRef.current.push({ word: target.text, typed: newInput, correct: true, timeTakenMs: 0 });
        target.completed = true;
        for (let i = 0; i < BULLET_BURST; i++) {
          bulletsRef.current.push({
            id: bulletIdRef.current++,
            fromX: CANVAS_W / 2 + (i - (BULLET_BURST - 1) / 2) * 16,
            fromY: CANVAS_H - 60,
            toX: target.x + (i - (BULLET_BURST - 1) / 2) * 5,
            toY: target.y,
            progress: 0,
            wordId: targetId,
          });
        }
        // Clear input but keep the word visible until the burst arrives
        activeTargetRef.current = null;
        inputRef.current = '';
        setDisplayInput('');
        setDisplayTargetId(null);
      } else if (target && target.text.startsWith(newInput)) {
        // Partial match — continue typing
      } else {
        // No match — check if any other word starts with this input
        const otherMatch = wordsRef.current.find((w) => w.text.startsWith(newInput) && w.id !== targetId);
        if (otherMatch) {
          activeTargetRef.current = otherMatch.id;
          setDisplayTargetId(otherMatch.id);
        }
        // If no match at all, keep input (user might backspace)
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [view]);

  // Fetch best score when game ends (authenticated only)
  useEffect(() => {
    if (view !== 'done' || !isAuthenticated) return;
    gamesService.getHistory('fallingWords')
      .then((results) => {
        if (results.length > 0) {
          const best = results.reduce((b, r) => r.wpm > b.wpm ? r : b, results[0]);
          setBestScore({ wpm: best.wpm, accuracy: best.accuracy, score: best.score });
        }
      })
      .catch(() => undefined);
  }, [view, isAuthenticated]);

  // ── Setup ──────────────────────────────────────────────────────────
  if (view === 'setup') {
    return (
      <div>
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
                <CloudLightning size={22} color="#ffffff" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-white leading-tight">Falling Words</h1>
                <p className="text-sm text-white/85 mt-0.5">Type words before they fall too far. Speed picks up the longer you survive.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-5">

          {/* Left: Game preview panel */}
          <div className="flex-1 min-w-0">
            <div className="relative overflow-hidden rounded-2xl border w-full" style={{ borderColor: '#1e293b' }}>

              {/* Play area preview */}
              <div
                className="relative overflow-hidden"
                style={{ height: 200, background: 'radial-gradient(ellipse at 50% 30%, #141e33 0%, #0c1322 50%, #080e1a 100%)' }}
              >
                {/* Dotted grid pattern overlay */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  aria-hidden="true"
                  style={{
                    backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.06) 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                  }}
                />

                {/* Lives indicator (top-right) */}
                <div className="absolute top-3 right-3 flex items-center gap-1 z-10">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Heart key={i} size={16} className={cn(i < 3 ? 'fill-red-500 text-red-500' : 'text-gray-600 dark:text-gray-400')} />
                  ))}
                </div>

                {/* Score indicator (top-left) */}
                <div className="absolute top-3 left-3 z-10">
                  <span className="text-xs font-bold text-slate-400 tabular-nums">0 words</span>
                </div>

                {/* Danger line (glowing) */}
                <div className="absolute left-0 right-0" style={{ top: 'calc(100% - 6px)' }}>
                  <div
                    className="absolute inset-x-0 -top-2 h-6 pointer-events-none"
                    style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(239,68,68,0.0) 30%, rgba(239,68,68,0.18) 50%, rgba(239,68,68,0.0) 70%, transparent 100%)' }}
                  />
                  <div
                    className="absolute inset-x-0 h-[2px]"
                    style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(239,68,68,0.15) 15%, rgba(239,68,68,0.7) 50%, rgba(239,68,68,0.15) 85%, transparent 100%)', boxShadow: '0 0 12px 2px rgba(239,68,68,0.25)' }}
                  />
                  <span className="absolute right-2 -top-4 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(239,68,68,0.55)' }}>
                    ⚠ Danger Zone
                  </span>
                </div>

                {/* Simulated falling words at different heights */}
                <div
                  className="absolute font-mono text-lg font-bold rounded-lg px-2.5 py-1"
                  style={{ left: '15%', top: '12%', background: 'rgba(99,102,241,0.14)', color: '#c7d2fe', border: '1px solid rgba(139,92,246,0.32)' }}
                >
                  apple
                </div>
                <div
                  className="absolute font-mono text-lg font-bold rounded-lg px-2.5 py-1"
                  style={{ left: '55%', top: '28%', background: 'linear-gradient(135deg, rgba(59,130,246,0.4), rgba(99,102,241,0.4))', color: '#ffffff', border: '1px solid rgba(96,165,250,0.85)', boxShadow: '0 0 16px 3px rgba(96,165,250,0.45)', textShadow: '0 0 10px rgba(255,255,255,0.35)' }}
                >
                  <span className="text-white">he</span>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>llo</span>
                </div>
                <div
                  className="absolute font-mono text-lg font-bold rounded-lg px-2.5 py-1"
                  style={{ left: '72%', top: '45%', background: 'rgba(99,102,241,0.14)', color: '#c7d2fe', border: '1px solid rgba(139,92,246,0.32)', opacity: 0.7 }}
                >
                  world
                </div>
                <div
                  className="absolute font-mono text-lg font-bold rounded-lg px-2.5 py-1"
                  style={{ left: '30%', top: '58%', background: 'rgba(99,102,241,0.14)', color: '#c7d2fe', border: '1px solid rgba(139,92,246,0.32)', opacity: 0.5 }}
                >
                  quick
                </div>
                <div
                  className="absolute font-mono text-lg font-bold rounded-lg px-2.5 py-1"
                  style={{ left: '60%', top: '72%', background: 'rgba(99,102,241,0.14)', color: '#c7d2fe', border: '1px solid rgba(139,92,246,0.32)', opacity: 0.35 }}
                >
                  brown
                </div>
              </div>

              {/* Input footer strip preview */}
              <div
                className="flex items-center justify-center px-4 py-3"
                style={{ height: 90, background: 'linear-gradient(180deg, #0c1426 0%, #090f1d 100%)', borderTop: '1px solid rgba(99,102,241,0.2)' }}
              >
                <div className="bg-slate-900/90 border border-indigo-400/50 rounded-xl px-5 py-2 text-center backdrop-blur-sm">
                  <span className="font-mono text-lg text-slate-500 tracking-wide">
                    Words will fall here once you start.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Instructions + start */}
          <div className="w-full lg:w-[340px] shrink-0 flex flex-col">
            <div className="card p-5 flex flex-col gap-4">
              {/* Heading */}
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent-text)' }}
                >
                  <Gamepad2 size={17} />
                </div>
                <h2 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>Ready to play?</h2>
              </div>

              {/* Instruction rows */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg" style={{ backgroundColor: 'var(--color-accent-light)' }}>
                  <Keyboard size={15} className="shrink-0 mt-0.5" style={{ color: 'var(--color-accent-text)' }} />
                  <p className="text-sm leading-snug" style={{ color: 'var(--color-text-secondary)' }}>
                    Type the highlighted word before it reaches the danger line.
                  </p>
                </div>
                <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg" style={{ backgroundColor: 'var(--color-accent-light)' }}>
                  <ShieldAlert size={15} className="shrink-0 mt-0.5" style={{ color: 'var(--color-accent-text)' }} />
                  <p className="text-sm leading-snug" style={{ color: 'var(--color-text-secondary)' }}>
                    Press <kbd className="px-1.5 py-0.5 rounded border text-xs font-mono" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>Esc</kbd> to switch targets.
                  </p>
                </div>
                <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                  <Heart size={15} className="shrink-0 mt-0.5 fill-red-500 text-red-500" />
                  <p className="text-sm leading-snug" style={{ color: 'var(--color-text-secondary)' }}>
                    You have <span className="font-bold text-red-500">{INITIAL_LIVES} lives</span> — lose them all and the game ends.
                  </p>
                </div>
              </div>

              {/* Start button */}
              <button
                onClick={startGame}
                className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 mt-1 transition-all duration-150 hover:brightness-110"
                style={{ background: 'linear-gradient(135deg, #4361EE, #8B5CF6)', color: '#fff', boxShadow: '0 6px 18px rgba(67, 97, 238, 0.35)' }}
              >
                <Play size={16} fill="currentColor" /> Start Game
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Done result card (used inside GameOverOverlay) ──────────────────
  const targetWord = displayWords.find((w) => w.id === displayTargetId);
  const liveWpm = elapsed > 0 ? Math.round((displayScore / (elapsed / 60)) || 0) : 0;
  const currentLevel = Math.floor(displayScore / WORDS_PER_LEVEL) + 1;
  const levelProgress = (displayScore % WORDS_PER_LEVEL) / WORDS_PER_LEVEL;
  const gameOver = view === 'done' && result;

  // Live accuracy from existing game state (correct / attempted words).
  const attemptedWords = typedWordsRef.current.length;
  const correctWords = typedWordsRef.current.filter((t) => t.correct).length;
  const liveAccuracy = attemptedWords > 0 ? Math.round((correctWords / attemptedWords) * 100) : 100;
  const timeElapsed = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`;

  const resultCard = gameOver ? (
    <div className="w-full max-w-[400px]">
      <div className="card result-card overflow-hidden" style={{ boxShadow: '0 20px 50px -15px rgba(0,0,0,0.25)' }}>

        {/* Light-gradient header section */}
        <div
          className="px-5 py-4 text-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(67,97,238,0.06) 0%, rgba(139,92,246,0.06) 100%)' }}
        >
          <div className="w-11 h-11 rounded-xl mx-auto flex items-center justify-center" style={{ backgroundColor: 'rgba(139,92,246,0.12)', boxShadow: '0 4px 12px rgba(139,92,246,0.15)' }}>
            <Keyboard size={20} style={{ color: '#8B5CF6' }} />
          </div>
          <h2 className="text-xl font-extrabold mt-2" style={{ color: 'var(--color-text-primary)' }}>Game Over!</h2>
          <p className="text-[13px] mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Survived {result!.elapsed}s · Game complete
          </p>
        </div>

        {/* Stats mini-cards */}
        <div className="px-5 pt-3 pb-4">
          <div className="grid grid-cols-3 gap-2.5">
            <div className="rounded-xl p-2.5 text-center" style={{ backgroundColor: 'rgba(67,97,238,0.08)' }}>
              <div className="w-7 h-7 rounded-lg mx-auto flex items-center justify-center mb-1.5" style={{ backgroundColor: 'rgba(67,97,238,0.15)' }}>
                <Type size={14} style={{ color: '#4361EE' }} />
              </div>
              <div className="text-xl font-extrabold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>{result!.score}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Words</div>
            </div>
            <div className="rounded-xl p-2.5 text-center" style={{ backgroundColor: 'rgba(217,119,6,0.08)' }}>
              <div className="w-7 h-7 rounded-lg mx-auto flex items-center justify-center mb-1.5" style={{ backgroundColor: 'rgba(217,119,6,0.15)' }}>
                <Gauge size={14} style={{ color: '#d97706' }} />
              </div>
              <div className="text-xl font-extrabold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>{result!.wpm}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: 'var(--color-text-muted)' }}>WPM</div>
            </div>
            <div className="rounded-xl p-2.5 text-center" style={{ backgroundColor: 'rgba(34,197,94,0.08)' }}>
              <div className="w-7 h-7 rounded-lg mx-auto flex items-center justify-center mb-1.5" style={{ backgroundColor: 'rgba(34,197,94,0.15)' }}>
                <Target size={14} style={{ color: 'var(--color-correct)' }} />
              </div>
              <div className="text-xl font-extrabold tabular-nums" style={{ color: 'var(--color-correct)' }}>{result!.accuracy}%</div>
              <div className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Accuracy</div>
            </div>
          </div>
        </div>

        {/* Best-score comparison / Sign-in prompt */}
        <div className="px-5 pt-1 pb-3">
          {isAuthenticated ? (
            bestScore ? (
              <div className="flex items-center justify-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm" style={{ backgroundColor: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.18)' }}>
                <Trophy size={15} style={{ color: '#8B5CF6' }} />
                <span style={{ color: 'var(--color-text-secondary)' }}>
                  Your best: <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{bestScore.wpm} WPM</span> · <span className="font-bold" style={{ color: 'var(--color-correct)' }}>{bestScore.accuracy}% acc</span>
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm" style={{ backgroundColor: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.18)' }}>
                <Trophy size={15} style={{ color: '#8B5CF6' }} />
                <span style={{ color: 'var(--color-text-secondary)' }}>This is your first game — no previous runs yet!</span>
              </div>
            )
          ) : (
            <div className="flex items-center justify-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm" style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
              <Trophy size={15} style={{ color: '#d97706' }} />
              <span style={{ color: 'var(--color-text-secondary)' }}>
                Sign in to track your best score.{' '}
                <Link to="/login" className="font-semibold" style={{ color: 'var(--color-accent-text)' }}>Sign in</Link>
              </span>
            </div>
          )}
        </div>

        {/* Saving status (authenticated) */}
        {isAuthenticated && (
          <div className="px-5 pb-2">
            <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
              {saving ? 'Saving…' : saved ? 'Saved — XP added to your stats' : ''}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="px-5 pb-5 flex gap-2.5">
          <button
            onClick={startGame}
            className="flex-1 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all duration-150 hover:brightness-110"
            style={{ background: 'linear-gradient(135deg, #4361EE, #8B5CF6)', color: '#fff', boxShadow: '0 4px 12px rgba(67,97,238,0.3)' }}
          >
            <RefreshCw size={15} /> Play Again
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

  // ── Game content (shared for playing + blurred background during done) ──
  const gameContent = (
    <div className="relative overflow-hidden" style={{ width: '100vw', marginLeft: 'calc((100vw - 100%) / -2)' }}>
      {/* Ambient background accents */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute rounded-full" style={{ top: -120, left: -100, width: 460, height: 460, background: 'radial-gradient(circle, rgba(99,102,241,0.08), transparent 70%)' }} />
        <div className="absolute rounded-full" style={{ top: 120, right: -140, width: 500, height: 500, background: 'radial-gradient(circle, rgba(139,92,246,0.10), transparent 70%)' }} />
        <div className="absolute rounded-full" style={{ bottom: -160, left: '32%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(67,97,238,0.06), transparent 70%)' }} />
      </div>

      <div className="relative mx-auto w-full max-w-[1200px] px-4 sm:px-2">
        {/* Back to games */}
        <div className="mb-5">
          <BackToGames onBack={onBack} />
        </div>

        {/* Main game dashboard container */}
        <div
          className="w-full rounded-3xl overflow-hidden border"
          style={{ borderColor: 'rgba(99, 102, 241, 0.22)', boxShadow: '0 30px 70px -30px rgba(15, 23, 42, 0.35)' }}
        >
          {/* ── In-game gradient header ── */}
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
                  <CloudLightning size={22} color="#ffffff" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-white leading-tight">Falling Words</h1>
                  <p className="text-xs sm:text-sm text-white/80 mt-0.5">Type the falling words before they reach the bottom!</p>
                </div>
                <span className="inline-flex items-center gap-1.5 ml-1 px-2.5 py-1 rounded-full bg-white/20 ring-1 ring-white/25 text-[11px] font-bold text-white whitespace-nowrap">
                  <Gamepad2 size={11} />
                  Level {currentLevel}
                </span>
              </div>

              <div className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-white/70">Words</span>
                  <span className="text-sm font-bold text-white tabular-nums">{displayScore}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-white/70">WPM</span>
                  <span className="text-sm font-bold text-white tabular-nums">{liveWpm}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-widest text-white/70 mr-0.5">Lives</span>
                  {Array.from({ length: INITIAL_LIVES }).map((_, i) => (
                    <Heart
                      key={i}
                      size={16}
                      className={cn(
                        'transition-all',
                        i < displayLives
                          ? 'fill-red-400 text-red-400 drop-shadow-[0_0_4px_rgba(248,113,113,0.5)]'
                          : 'fill-none text-red-400/35',
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Level progress bar */}
            <div className="relative mt-3 h-[3px] rounded-full" style={{ background: 'rgba(255,255,255,0.18)' }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${levelProgress * 100}%`,
                  background: 'linear-gradient(90deg, #FDE047, #F59E0B)',
                  boxShadow: '0 0 8px rgba(253,224,71,0.6)',
                }}
              />
            </div>
          </div>

          {/* ── Light surface ── */}
          <div style={{ backgroundColor: 'var(--color-card)' }}>

            {/* ── Play canvas ── */}
            <div
              className="relative overflow-hidden"
              style={{
                height: CANVAS_H,
                background: 'radial-gradient(ellipse at 50% 30%, #141e33 0%, #0c1322 50%, #080e1a 100%)',
              }}
            >
          {/* Soft glow accents */}
          <div
            className="absolute inset-0 pointer-events-none"
            aria-hidden="true"
            style={{
              background:
                'radial-gradient(circle at 12% 16%, rgba(99,102,241,0.16), transparent 42%), radial-gradient(circle at 88% 80%, rgba(239,68,68,0.12), transparent 42%), radial-gradient(circle at 70% 30%, rgba(59,130,246,0.10), transparent 40%)',
            }}
          />

          {/* Dotted grid pattern overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            aria-hidden="true"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.06) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* ── Danger line (glowing) ── */}
          <div className="absolute left-0 right-0" style={{ top: DANGER_Y }}>
            <div
              className="absolute inset-x-0 -top-2 h-6 pointer-events-none"
              style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(239,68,68,0.0) 30%, rgba(239,68,68,0.18) 50%, rgba(239,68,68,0.0) 70%, transparent 100%)' }}
            />
            <div
              className="absolute inset-x-0 h-[2px]"
              style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(239,68,68,0.15) 15%, rgba(239,68,68,0.7) 50%, rgba(239,68,68,0.15) 85%, transparent 100%)', boxShadow: '0 0 12px 2px rgba(239,68,68,0.25)' }}
            />
            <span
              className="absolute right-3 -top-4 text-[10px] font-bold uppercase tracking-widest"
              style={{ color: 'rgba(239,68,68,0.55)' }}
            >
              ⚠ Danger Zone
            </span>
          </div>

          {/* ── Falling words ── */}
          {displayWords.map((w) => {
            const isActive = w.id === displayTargetId;
            const isFrozen = !!w.completed;
            const matched = isActive && displayInput.length > 0 && w.text.startsWith(displayInput);
            const progressRatio = Math.min(1, w.y / DANGER_Y);
            const proximityOpacity = isActive || isFrozen ? 1 : 0.45 + progressRatio * 0.55;

            return (
              <div
                key={w.id}
                className="absolute font-mono text-lg font-bold rounded-lg px-2.5 py-1"
                style={{
                  left: w.x,
                  top: w.y,
                  transform: 'translateX(-50%)',
                  opacity: proximityOpacity,
                  ...(isFrozen ? {
                    background: 'linear-gradient(135deg, rgba(34,197,94,0.35), rgba(74,222,128,0.35))',
                    color: '#4ade80',
                    border: '1px solid rgba(74,222,128,0.5)',
                    boxShadow: '0 0 18px 4px rgba(34,197,94,0.35), 0 0 0 1px rgba(34,197,94,0.25)',
                    textShadow: '0 0 8px rgba(74,222,128,0.4)',
                  } : isActive ? {
                    background: 'linear-gradient(135deg, rgba(59,130,246,0.4), rgba(99,102,241,0.4))',
                    color: '#ffffff',
                    border: '1px solid rgba(96,165,250,0.85)',
                    boxShadow: '0 0 16px 3px rgba(96,165,250,0.45), 0 0 0 1px rgba(96,165,250,0.2)',
                    textShadow: '0 0 10px rgba(255,255,255,0.35)',
                  } : {
                    background: 'rgba(99,102,241,0.14)',
                    color: '#c7d2fe',
                    border: '1px solid rgba(139,92,246,0.32)',
                  }),
                }}
              >
                {isFrozen ? (
                  <span className="text-green-400">{w.text}</span>
                ) : matched ? (
                  <>
                    <span className="text-white">{w.text.slice(0, displayInput.length)}</span>
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>{w.text.slice(displayInput.length)}</span>
                  </>
                ) : isActive ? (
                  <span className="text-white">{w.text}</span>
                ) : (
                  w.text
                )}
              </div>
            );
          })}

          {/* ── Bullets (glowing streaks, fanned toward the target) ── */}
          {displayBullets.map((b) => {
            const dx = b.toX - b.fromX;
            const dy = b.toY - b.fromY;
            const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
            const x = b.fromX + dx * b.progress;
            const y = b.fromY + dy * b.progress;
            return (
              <div
                key={b.id}
                className="fw-bullet absolute pointer-events-none"
                style={{ left: x, top: y, transform: `translate(-50%, -50%) rotate(${angle}deg)` }}
              >
                <div
                  className="absolute rounded-full"
                  style={{
                    top: -1.5,
                    left: -28,
                    width: 28,
                    height: 3,
                    background: 'linear-gradient(90deg, rgba(165,180,252,0) 0%, rgba(165,180,252,0.55) 55%, #E0E7FF 100%)',
                    boxShadow: '0 0 8px 1px rgba(129,140,248,0.7)',
                  }}
                />
                <div
                  className="absolute rounded-full"
                  style={{
                    top: -2.5,
                    left: -3,
                    width: 5,
                    height: 5,
                    background: '#ffffff',
                    boxShadow: '0 0 8px 2px rgba(165,180,252,0.9), 0 0 18px 5px rgba(99,102,241,0.5)',
                  }}
                />
              </div>
            );
          })}

          {/* ── Hit effects (particle burst on impact) ── */}
          {displayHits.map((h) => {
            const scale = 1 + h.progress * 1.2;
            const opacity = 1 - h.progress;
            const ease = 1 - Math.pow(1 - h.progress, 2);
            return (
              <div
                key={h.id}
                className="fw-hit absolute pointer-events-none"
                style={{ left: h.x, top: h.y, opacity }}
              >
                <div
                  className="absolute rounded-full"
                  style={{
                    width: 40,
                    height: 40,
                    left: -20,
                    top: -20,
                    transform: `scale(${scale})`,
                    border: '2px solid rgba(253,224,71,0.55)',
                    boxShadow: '0 0 14px 4px rgba(253,224,71,0.25)',
                  }}
                />
                <div
                  className="absolute rounded-full"
                  style={{
                    width: 12,
                    height: 12,
                    left: -6,
                    top: -6,
                    background: 'radial-gradient(circle, rgba(253,224,71,0.9) 0%, rgba(254,240,138,0) 70%)',
                  }}
                />
                {h.sparks.map((s, i) => {
                  const sx = Math.cos(s.angle) * s.dist * ease;
                  const sy = Math.sin(s.angle) * s.dist * ease;
                  return (
                    <div
                      key={i}
                      className="absolute rounded-full"
                      style={{
                        left: sx - s.size / 2,
                        top: sy - s.size / 2,
                        width: s.size,
                        height: s.size,
                        background: s.color,
                        boxShadow: `0 0 6px 1px ${s.color}`,
                      }}
                    />
                  );
                })}
              </div>
            );
          })}

          </div>

          {/* ── Typing input + target + restart ── */}
          <div className="px-4 sm:px-7 pt-6 pb-5 flex flex-col items-center">
            {/* Typing input */}
            <div
              className="w-full max-w-[520px] rounded-2xl px-6 py-3.5 text-center transition-shadow duration-200"
              style={{
                background: 'linear-gradient(180deg, #0c1426 0%, #090f1d 100%)',
                border: '1.5px solid rgba(99,102,241,0.6)',
                boxShadow: '0 0 0 1px rgba(99,102,241,0.08), 0 8px 24px rgba(0,0,0,0.25), 0 0 18px rgba(67,97,238,0.18), inset 0 1px 0 rgba(255,255,255,0.04)',
              }}
            >
              <span className="inline-flex items-center gap-0.5 font-mono text-xl tracking-wide leading-8">
                {displayInput ? (
                  <span className="text-white font-bold">{displayInput}</span>
                ) : (
                  <span className="italic text-slate-500">{'\u00a0'}type here...</span>
                )}
                <span
                  className="inline-block w-[3px] h-6 rounded bg-[#4F46E5] ml-1 caret-blink"
                  style={{ boxShadow: '0 0 10px rgba(99,102,241,0.9)' }}
                />
              </span>
            </div>

            {/* Target information */}
            <p className="mt-3 text-sm text-center leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              {targetWord ? (
                <>
                  Currently targeting:{' '}
                  <span className="font-bold" style={{ color: 'var(--color-accent-text)' }}>{targetWord.text}</span>{' '}
                  <span style={{ color: 'var(--color-text-muted)' }}>•</span> Press{' '}
                  <kbd
                    className="inline-flex items-center justify-center min-w-[1.6rem] px-1.5 py-0.5 rounded text-xs font-mono font-semibold border"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-page)', color: 'var(--color-text-secondary)' }}
                  >
                    Esc
                  </kbd>{' '}
                  to switch
                </>
              ) : (
                <span style={{ color: 'var(--color-text-muted)' }}>Waiting for words…</span>
              )}
            </p>

            {/* Restart */}
            <button
              onClick={startGame}
              className="mt-5 inline-flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-150 hover:brightness-110 active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #4361EE, #8B5CF6)', boxShadow: '0 6px 18px rgba(67,97,238,0.35)' }}
            >
              <RefreshCw size={15} /> Restart
            </button>
          </div>

          {/* ── Stats row ── */}
          <div className="flex flex-col sm:flex-row" style={{ borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--color-page)' }}>
            {[
              { label: 'WPM', value: String(liveWpm), Icon: Gauge, color: 'var(--color-accent-text)' },
              { label: 'Accuracy', value: `${liveAccuracy}%`, Icon: Target, color: 'var(--color-correct)' },
              { label: 'Longest Streak', value: String(displayStreak), Icon: Trophy, color: '#D97706' },
              { label: 'Time Elapsed', value: timeElapsed, Icon: Clock, color: '#8B5CF6' },
            ].map((s, i) => (
              <React.Fragment key={s.label}>
                {i > 0 && <div className="hidden sm:block w-px self-stretch my-5" style={{ backgroundColor: 'var(--color-border)' }} />}
                <div className="flex sm:flex-col items-center sm:items-center justify-center flex-1 min-w-0 gap-2 sm:gap-0 px-3 py-4 text-center">
                  <s.Icon size={17} className="sm:mx-auto shrink-0" style={{ color: s.color }} />
                  <div className="sm:mt-1.5 text-2xl sm:text-3xl font-extrabold tabular-nums font-mono leading-none" style={{ color: s.color }}>
                    {s.value}
                  </div>
                  <div className="sm:mt-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                    {s.label}
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
  );

  // ── Render ─────────────────────────────────────────────────────────
  if (gameOver) {
    return (
      <GameOverOverlay result={resultCard}>
        {gameContent}
      </GameOverOverlay>
    );
  }

  return gameContent;
}
