import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCw, Coins, Flag, Gauge, Target, Clock, ArrowLeft } from 'lucide-react';
import { useTypingEngine } from '../../hooks/useTypingEngine';
import { TypingDisplay } from '../typing/TypingDisplay';
import { generateWordList } from '../../data/wordLists';
import { analyticsService } from '../../services/analytics.service';
import { gamesService, type GameSubmitResponse } from '../../services/games.service';
import { applySessionRewards } from '../../utils/rewards';
import { computeWpm, computeAccuracy } from '../../utils/wpm';
import { Link } from 'react-router-dom';
import GameOverOverlay from './GameOverOverlay';
import { BackToGames } from './GameControls';
import type { EngineResult } from '../../types';

const TOTAL_WORDS = 60;
const RACE_WINDOW_SECONDS = 1800;

interface RaceResult {
  winner: 'user' | 'opponent';
  wpm: number;
  accuracy: number;
  correctWords: number;
  attemptedWords: number;
  errorsCount: number;
  elapsed: number;
}

function provisional(engineResult: EngineResult): RaceResult {
  const correctWords = engineResult.typedWords.filter((word) => word.correct).length;
  const attemptedWords = engineResult.typedWords.length;
  return {
    winner: 'user',
    wpm: computeWpm(correctWords, engineResult.durationSeconds),
    accuracy: computeAccuracy(correctWords, attemptedWords),
    correctWords,
    attemptedWords,
    errorsCount: attemptedWords - correctWords,
    elapsed: Math.round(engineResult.durationSeconds),
  };
}

export default function TypingRace({ onBack }: { onBack?: () => void }) {
  const [text, setText] = useState(() => generateWordList(TOTAL_WORDS, false, false));
  const [opponentWpm, setOpponentWpm] = useState(40);
  const [over, setOver] = useState(false);
  const [result, setResult] = useState<RaceResult | null>(null);
  const [saved, setSaved] = useState<GameSubmitResponse | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const submitted = useRef(false);

  useEffect(() => {
    analyticsService.getSummary()
      .then(({ progress }) => {
        if (progress.avgWpm > 0) setOpponentWpm(Math.max(20, Math.min(120, progress.avgWpm)));
      })
      .catch(() => undefined);
  }, []);

  const totalWords = TOTAL_WORDS;
  const opponentFinishSeconds = opponentWpm > 0 ? totalWords / (opponentWpm / 60) : Infinity;

  const handleUserFinish = useCallback(async (engineResult: EngineResult) => {
    if (submitted.current) return;
    submitted.current = true;
    setOver(true);
    setResult(provisional(engineResult));
    if (!engineResult.typedWords.length) return;
    const winner = engineResult.durationSeconds <= opponentFinishSeconds ? 'user' : 'opponent';
    setSaving(true);
    setSaveError(null);
    try {
      const response = await gamesService.completeGame({
        mode: 'game',
        game: 'typingRace',
        winner,
        opponentWpm,
        score: engineResult.typedWords.filter((word) => word.correct).length,
        startTime: engineResult.startTime,
        endTime: engineResult.endTime,
        typedWords: engineResult.typedWords,
        textSource: 'generated',
        clientWpm: engineResult.clientWpm,
        clientAccuracy: engineResult.clientAccuracy,
      });
      setSaved(response);
      response.winner = winner;
      applySessionRewards(response.result, response);
    } catch {
      setSaveError('Results could not be saved. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  }, [opponentFinishSeconds, opponentWpm]);

  const engine = useTypingEngine({ text, durationSeconds: RACE_WINDOW_SECONDS, onComplete: handleUserFinish, extendContent: false });

  // Opponent crosses the finish line first
  useEffect(() => {
    if (engine.phase !== 'running' || over) return;
    if (engine.elapsed < opponentFinishSeconds) return;
    if (submitted.current) return;
    submitted.current = true;
    setOver(true);

    const elapsed = engine.elapsed;
    const committed = engine.wordStates.filter((w) => w.status === 'correct' || w.status === 'error')
      .map((w) => ({ word: w.word, typed: w.typed, correct: w.word === w.typed, timeTakenMs: w.timeTakenMs ?? 0 }));
    const end = Date.now();
    const fake: EngineResult = {
      typedWords: committed,
      durationSeconds: elapsed,
      startTime: new Date(end - elapsed * 1000).toISOString(),
      endTime: new Date(end).toISOString(),
      clientWpm: computeWpm(committed.filter((w) => w.correct).length, elapsed),
      clientAccuracy: computeAccuracy(committed.filter((w) => w.correct).length, committed.length),
    };
    const p = provisional(fake);
    setResult({ ...p, winner: 'opponent' });
    void activeSubmit(fake, 'opponent');
  }, [engine.phase, engine.elapsed, opponentFinishSeconds, over]);

  async function activeSubmit(engineResult: EngineResult, winner: 'user' | 'opponent') {
    if (!engineResult.typedWords.length) return;
    setSaving(true);
    setSaveError(null);
    try {
      const response = await gamesService.completeGame({
        mode: 'game',
        game: 'typingRace',
        winner,
        opponentWpm,
        score: engineResult.typedWords.filter((word) => word.correct).length,
        startTime: engineResult.startTime,
        endTime: engineResult.endTime,
        typedWords: engineResult.typedWords,
        textSource: 'generated',
        clientWpm: engineResult.clientWpm,
        clientAccuracy: engineResult.clientAccuracy,
      });
      setSaved(response);
      response.winner = winner;
      applySessionRewards(response.result, response);
    } catch {
      setSaveError('Results could not be saved. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  }

  const restart = useCallback(() => {
    submitted.current = false;
    setOver(false);
    setResult(null);
    setSaved(null);
    setSaveError(null);
    const next = generateWordList(TOTAL_WORDS, false, false);
    setText(next);
    engine.resetEngine(next);
  }, [engine]);

  const winner = saved?.winner ?? result?.winner ?? 'pending';
  const userProgress = totalWords > 0 ? engine.currentWordIndex / totalWords : 0;
  const opponentProgress = opponentFinishSeconds > 0 ? Math.min(1, (opponentWpm / 60) * engine.elapsed / totalWords) : 0;
  const displayResult: RaceResult | null = saved ? {
    winner: (saved.winner ?? result?.winner ?? 'user') as 'user' | 'opponent',
    wpm: saved.result?.wpm ?? result?.wpm ?? 0,
    accuracy: saved.result?.accuracy ?? result?.accuracy ?? 0,
    correctWords: saved.result?.correctWords ?? result?.correctWords ?? 0,
    attemptedWords: saved.result?.attemptedWords ?? result?.attemptedWords ?? 0,
    errorsCount: saved.result?.errorsCount ?? result?.errorsCount ?? 0,
    elapsed: Math.round(saved.gameResult?.duration ?? result?.elapsed ?? 0),
  } : result;

  const gameOver = over && !!displayResult;

  const resultCard = gameOver && displayResult ? (
    <div className="w-full max-w-[25rem]">
      <div className="card result-card overflow-hidden" style={{ boxShadow: '0 20px 50px -15px rgba(0,0,0,0.25)' }}>
        <div className="px-5 py-4 text-center relative overflow-hidden" style={{ background: winner === 'user' ? 'linear-gradient(135deg, rgba(34,197,94,0.06) 0%, rgba(34,197,94,0.03) 100%)' : 'linear-gradient(135deg, rgba(239,68,68,0.06) 0%, rgba(239,68,68,0.03) 100%)' }}>
          <div className="w-11 h-11 rounded-xl mx-auto flex items-center justify-center" style={{ backgroundColor: winner === 'user' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', boxShadow: winner === 'user' ? '0 4px 12px rgba(34,197,94,0.15)' : '0 4px 12px rgba(239,68,68,0.15)' }}>
            <Coins size={20} style={{ color: winner === 'user' ? '#16a34a' : '#EF4444' }} />
          </div>
          <h2 className="text-xl font-extrabold mt-2" style={{ color: 'var(--color-text-primary)' }}>
            {winner === 'user' ? 'You win!' : 'Opponent wins'}
          </h2>
          <p className="text-[0.8125rem] mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Race complete · {displayResult.elapsed}s
          </p>
        </div>
        <div className="px-5 pt-3 pb-4">
          <div className="grid grid-cols-3 gap-2.5">
            <div className="rounded-xl p-2.5 text-center" style={{ backgroundColor: 'rgba(99,102,241,0.08)' }}>
              <div className="w-7 h-7 rounded-lg mx-auto flex items-center justify-center mb-1.5" style={{ backgroundColor: 'rgba(99,102,241,0.15)' }}>
                <Gauge size={14} style={{ color: '#4361EE' }} />
              </div>
              <div className="text-xl font-extrabold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>{displayResult.wpm}</div>
              <div className="text-[0.625rem] font-bold uppercase tracking-widest mt-0.5" style={{ color: 'var(--color-text-muted, var(--color-text-secondary))' }}>WPM</div>
            </div>
            <div className="rounded-xl p-2.5 text-center" style={{ backgroundColor: 'rgba(34,197,94,0.08)' }}>
              <div className="w-7 h-7 rounded-lg mx-auto flex items-center justify-center mb-1.5" style={{ backgroundColor: 'rgba(34,197,94,0.15)' }}>
                <Target size={14} style={{ color: '#16a34a' }} />
              </div>
              <div className="text-xl font-extrabold tabular-nums" style={{ color: '#16a34a' }}>{displayResult.accuracy}%</div>
              <div className="text-[0.625rem] font-bold uppercase tracking-widest mt-0.5" style={{ color: 'var(--color-text-muted, var(--color-text-secondary))' }}>Accuracy</div>
            </div>
            <div className="rounded-xl p-2.5 text-center" style={{ backgroundColor: 'rgba(217,119,6,0.08)' }}>
              <div className="w-7 h-7 rounded-lg mx-auto flex items-center justify-center mb-1.5" style={{ backgroundColor: 'rgba(217,119,6,0.15)' }}>
                <Clock size={14} style={{ color: '#d97706' }} />
              </div>
              <div className="text-xl font-extrabold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>{displayResult.elapsed}s</div>
              <div className="text-[0.625rem] font-bold uppercase tracking-widest mt-0.5" style={{ color: 'var(--color-text-muted, var(--color-text-secondary))' }}>Time</div>
            </div>
          </div>
        </div>
        <div className="px-5 pb-4">
          <div className="grid grid-cols-3 gap-2.5">
            <div className="rounded-xl p-2 text-center" style={{ backgroundColor: 'rgba(34,197,94,0.08)' }}>
              <div className="text-lg font-extrabold tabular-nums" style={{ color: '#16a34a' }}>{displayResult.correctWords}</div>
              <div className="text-[0.625rem] font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted, var(--color-text-secondary))' }}>Correct</div>
            </div>
            <div className="rounded-xl p-2 text-center" style={{ backgroundColor: 'rgba(239,68,68,0.08)' }}>
              <div className="text-lg font-extrabold tabular-nums" style={{ color: '#EF4444' }}>{displayResult.errorsCount}</div>
              <div className="text-[0.625rem] font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted, var(--color-text-secondary))' }}>Incorrect</div>
            </div>
            <div className="rounded-xl p-2 text-center" style={{ backgroundColor: 'var(--color-accent-light)' }}>
              <div className="text-lg font-extrabold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>{displayResult.attemptedWords}</div>
              <div className="text-[0.625rem] font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted, var(--color-text-secondary))' }}>Words</div>
            </div>
          </div>
        </div>
        <div className="px-5 pb-2">
          <p className="text-xs text-center" style={{ color: 'var(--color-text-secondary)' }}>
            {saving ? 'Saving results\u2026' : saveError ?? (saved ? 'Saved \u2014 WPM and XP added to your stats' : 'Race complete')}
          </p>
        </div>
        <div className="px-5 pb-5 flex gap-2.5">
          <button
            onClick={() => void restart()}
            className="flex-1 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all duration-150 hover:brightness-110"
            style={{ background: 'linear-gradient(135deg, #4361EE, #3730A3)', color: '#fff', boxShadow: '0 4px 12px rgba(67, 97, 238, 0.3)' }}
          >
            <RefreshCw size={15} /> Race again
          </button>
          <button
            onClick={onBack}
            className="flex-1 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all duration-150"
            style={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent-text)', border: '1px solid var(--color-border)' }}
          >
            <ArrowLeft size={15} /> Back to games
          </button>
        </div>
      </div>
    </div>
  ) : null;

  const gameContent = (
    <div className="flex flex-col pt-1">
      <div className="mb-5">
        <BackToGames onBack={onBack} />
      </div>

      {/* ── Gradient header card ── */}
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
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-none bg-white/20 ring-1 ring-white/30">
              <Flag size={24} color="#ffffff" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-extrabold tracking-tight text-white leading-tight">Typing Race</h1>
              <p className="text-sm text-white/85 mt-0.5">Race to {TOTAL_WORDS} words against a {opponentWpm} WPM opponent</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Progress card (You vs Opponent) ── */}
      <div className="card p-5 mb-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1.5">
              <span
                className="w-8 h-8 rounded-full grid place-items-center text-sm flex-none"
                style={{ background: 'rgba(67, 97, 238, 0.12)', color: 'var(--color-accent-text)' }}
              >
                🏃
              </span>
              <span className="text-xs font-bold capitalize" style={{ color: 'var(--color-text-primary)' }}>You</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border)' }}>
              <div
                className="h-full rounded-full transition-all duration-150"
                style={{ width: `${Math.min(100, Math.max(0, userProgress * 100))}%`, background: 'linear-gradient(90deg, #4361EE, #7C3AED)' }}
              />
            </div>
            <p className="text-[0.6875rem] mt-1.5" style={{ color: 'var(--color-text-muted)' }}>
              {Math.round(userProgress * TOTAL_WORDS)} / {TOTAL_WORDS} words
            </p>
          </div>

          <div className="hidden sm:block w-px flex-none" style={{ backgroundColor: 'var(--color-border)' }} />

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1.5">
              <span
                className="w-8 h-8 rounded-full grid place-items-center text-sm flex-none"
                style={{ background: 'rgba(217, 119, 6, 0.14)', color: '#D97706' }}
              >
                🤖
              </span>
              <span className="text-xs font-bold capitalize" style={{ color: 'var(--color-text-primary)' }}>Opponent</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border)' }}>
              <div
                className="h-full rounded-full transition-all duration-150"
                style={{ width: `${Math.min(100, Math.max(0, opponentProgress * 100))}%`, background: 'linear-gradient(90deg, #F59E0B, #FBBF24)' }}
              />
            </div>
            <p className="text-[0.6875rem] mt-1.5" style={{ color: 'var(--color-text-muted)' }}>
              {Math.round(opponentProgress * TOTAL_WORDS)} / {TOTAL_WORDS} words &middot; {opponentWpm} WPM pace
            </p>
          </div>
        </div>
      </div>

      {/* ── Stats row: three individual cards ── */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
        <div
          className="card p-4 text-center"
          style={{ border: '1px solid var(--color-border)' }}
        >
          <div className="text-3xl font-extrabold tabular-nums leading-none" style={{ color: 'var(--color-accent-text)' }}>
            {engine.liveWpm}
          </div>
          <div className="mt-2 text-[0.625rem] font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
            WPM
          </div>
        </div>
        <div
          className="card p-4 text-center"
          style={{ border: '2px solid var(--color-accent)', boxShadow: '0 6px 18px -8px rgba(67, 97, 238, 0.45)' }}
        >
          <div className="text-3xl font-extrabold tabular-nums leading-none" style={{ color: 'var(--color-text-primary)' }}>
            {Math.max(0, Math.ceil(opponentFinishSeconds - engine.elapsed))}
          </div>
          <div className="mt-2 text-[0.625rem] font-bold uppercase tracking-widest" style={{ color: 'var(--color-accent-text)' }}>
            Seconds
          </div>
        </div>
        <div
          className="card p-4 text-center"
          style={{ border: '1px solid var(--color-border)' }}
        >
          <div className="text-3xl font-extrabold tabular-nums leading-none" style={{ color: 'var(--color-correct)' }}>
            {engine.liveAccuracy}%
          </div>
          <div className="mt-2 text-[0.625rem] font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
            Accuracy
          </div>
        </div>
      </div>

      {/* ── Typing text card ── */}
      <div className="card relative p-8 mb-8" style={{ minHeight: '240px' }}>
        {engine.phase === 'idle' && (
          <span
            className="absolute left-8 top-6 z-10 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
            style={{ backgroundColor: 'rgba(67, 97, 238, 0.12)', color: '#4361EE' }}
          >
            Start typing!
          </span>
        )}
        <div className="pt-8">
          <TypingDisplay wordStates={engine.wordStates} currentWordIndex={engine.currentWordIndex} fontSize={22} />
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