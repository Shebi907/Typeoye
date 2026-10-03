import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Swords, Copy, Check, Link2, Users, Clock, LogOut, RotateCcw, Loader2,
  ArrowLeft, Trophy, Gauge, Target, AlertTriangle, ShieldAlert, ShieldCheck,
  Keyboard, Zap, Timer, ArrowRight, Globe, Info, Share2, TrendingUp, CheckCircle2,
  Plus, UserX, WifiOff, Home, Heart,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { useSeo } from '../hooks/useSeo';
import { useAuthStore } from '../store/authStore';
import { challengeService } from '../services/challenge.service';
import {
  connectChallengeSocket,
  ensureSocketJoined,
  on,
  off,
  emit,
} from '../services/challenge.socket';
import { getApiErrorMessage } from '../services/api';
import { useTypingEngine } from '../hooks/useTypingEngine';
import { ChallengeChat } from '../components/challenge/ChallengeChat';
import '../styles/challenge-results.css';
import '../styles/challenge-waiting.css';
import '../styles/challenge-rematch-overlay.css';
import { TypingDisplay } from '../components/typing/TypingDisplay';
import { VirtualKeyboard } from '../components/typing/VirtualKeyboard';
import type { ChallengePublic, ChallengePlayerView, ChallengeStatus } from '../types/challenge';
import type { TypedWord } from '../types';

const CODE_PATTERN = /^TY-[A-Z0-9]{5}$/i;

function normalizeCode(value: string): string {
  return value.trim().toUpperCase();
}

function liveErrorsFrom(wordStates: Array<{ status: string; chars: Array<{ status: string }> }>): number {
  let count = 0;
  for (const word of wordStates) {
    if (word.status === 'error') { count += 1; continue; }
    for (const char of word.chars) {
      if (char.status === 'error' || char.status === 'extra') count += 1;
    }
  }
  return count;
}

function liveCorrectCharsFrom(wordStates: Array<{ chars: Array<{ status: string }> }>): number {
  let count = 0;
  for (const word of wordStates) {
    for (const char of word.chars) {
      if (char.status === 'correct') count += 1;
    }
  }
  return count;
}

type LiveEngine = ReturnType<typeof useTypingEngine>;

/* The live snapshot a player publishes to the opponent every ~200ms while the
   race runs (socket-only fan-out; never persisted per keystroke). */
function buildLiveProgress(current: LiveEngine) {
  const correct = current.wordStates.filter((w) => w.status === 'correct').length;
  const attempted = current.wordStates.filter((w) => w.status !== 'pending').length;
  const total = current.wordStates.length;
  const progress = total > 0 ? Math.min(100, Math.round((current.currentWordIndex / total) * 100)) : 0;
  const typedChars = current.wordStates.reduce((n, w) => n + (w.status !== 'pending' ? w.typed.length : 0), 0);
  return {
    correct,
    attempted,
    errors: liveErrorsFrom(current.wordStates),
    typedChars,
    wpm: current.liveWpm,
    accuracy: current.liveAccuracy,
    progress,
  };
}

function snapshotTypedWords(wordStates: Array<{ word: string; typed: string; status: string; timeTakenMs?: number }>, currentIndex: number): TypedWord[] {
  const completed = wordStates
    .filter((w) => w.status === 'correct' || w.status === 'error')
    .map((w) => ({ word: w.word, typed: w.typed, correct: w.word === w.typed, timeTakenMs: w.timeTakenMs ?? 0 }));
  const active = wordStates[currentIndex];
  if (active && active.status === 'active' && active.typed) {
    completed.push({ word: active.word, typed: active.typed, correct: false, timeTakenMs: 0 });
  }
  return completed;
}

function opponentOf(challenge: ChallengePublic, me: 'player1' | 'player2' | null): ChallengePlayerView | null {
  if (!challenge) return null;
  if (me === 'player2') return challenge.players.find((p) => p.slot === 'player1') ?? null;
  return challenge.players.find((p) => p.slot === 'player2') ?? null;
}

function mePlayer(challenge: ChallengePublic): ChallengePlayerView | null {
  if (!challenge || !challenge.me) return null;
  return challenge.players.find((p) => p.slot === challenge.me) ?? null;
}

/* Socket broadcast payloads are built server-side with the `me` slot of the
   player who TRIGGERED the event, so the passive client would see the wrong
   slot. Re-derive `me` from our own user id before treating the state as
   authoritative. Players are matched by id, never by username. */
function applyOwnSlot(challenge: ChallengePublic, ownUserId: string | undefined): ChallengePublic {
  if (!challenge || !ownUserId) return challenge;
  const me = challenge.players.find((p) => p.userId === ownUserId)?.slot ?? challenge.me;
  return me === challenge.me ? challenge : { ...challenge, me };
}

/* ═══════════════════════════ HOME (create / join) ═══════════════════════════ */

/* Decorative mini-keyboard used in the hero illustration. Visual only. */
function MiniKeyboard({ tone, tilt }: { tone: 'blue' | 'purple'; tilt: number }) {
  const accentClass = tone === 'blue' ? 'text-[#4361ee] dark:text-[#8ba2ff]' : 'text-[#7c3aed] dark:text-[#c4a5ff]';
  const rows = [
    ['Q', 'W', 'E', 'R', 'T'],
    ['A', 'S', 'D', 'F', 'G'],
    ['Z', 'X', 'C', 'V', 'B'],
  ];
  return (
    <div className="flex-1 min-w-0" style={{ transform: `rotate(${tilt}deg)` }}>
      <div
        className="rounded-xl sm:rounded-2xl p-2 sm:p-2.5 border border-[rgba(99,102,241,0.18)] bg-[#fbfbfe] dark:border-[rgba(124,140,248,0.24)] dark:bg-[#1c1c25]"
        style={{ boxShadow: '0 12px 28px -14px rgba(23, 23, 31, 0.22)' }}
      >
        <div className="flex flex-col gap-1">
          {rows.map((row, rowIdx) => (
            <div key={rowIdx} className="flex justify-center gap-1">
              {row.map((key) => (
                <span
                  key={key}
                  className={`grid h-3 w-[1.125rem] sm:h-3.5 sm:w-[1.375rem] place-items-center rounded-[3px] text-[0.4rem] sm:text-[0.5rem] font-bold ${accentClass}`}
                  style={{ backgroundColor: 'color-mix(in srgb, currentColor 12%, transparent)' }}
                >
                  {key}
                </span>
              ))}
            </div>
          ))}
          <div className="flex justify-center">
            <span className="h-2 w-9 sm:h-2.5 sm:w-12 rounded-[3px]" style={{ background: `linear-gradient(90deg, rgba(67, 97, 238, 0.5), rgba(124, 58, 237, 0.35))` }} />
          </div>
        </div>
        <p className={`mt-2 text-[0.55rem] sm:text-[0.6rem] font-bold uppercase tracking-[0.14em] text-center ${accentClass}`}>
          {tone === 'blue' ? 'Player 1' : 'Player 2'}
        </p>
      </div>
    </div>
  );
}

/* Two-column hero visual: facing keyboards, glowing VS badge, decorative text. */
function ChallengeHeroVisual() {
  return (
    <div className="challenge-fade-in relative" style={{ animationDelay: '90ms' }}>
      <div
        className="relative rounded-[1.75rem] p-5 sm:p-7 overflow-hidden border border-[rgba(99,102,241,0.18)] bg-white dark:border-[rgba(124,140,248,0.24)] dark:bg-[#1c1c25]"
        style={{ boxShadow: '0 24px 60px -24px rgba(67, 97, 238, 0.30)' }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 -left-16 h-48 w-48 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(67, 97, 238, 0.16) 0%, transparent 70%)', filter: 'blur(24px)' }}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-20 -right-14 h-52 w-52 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(124, 58, 237, 0.16) 0%, transparent 70%)', filter: 'blur(24px)' }}
        />

        <div className="challenge-float relative flex items-center justify-center gap-2.5 sm:gap-4">
          <MiniKeyboard tone="blue" tilt={-6} />
          <span
            aria-hidden="true"
            className="relative z-10 grid h-12 w-12 sm:h-14 sm:w-14 shrink-0 place-items-center rounded-full text-sm sm:text-base font-extrabold text-white"
            style={{ background: 'linear-gradient(135deg, #4361ee, #7c3aed)', boxShadow: '0 0 0 6px var(--color-card), 0 0 26px rgba(124, 58, 237, 0.55)' }}
          >
            VS
          </span>
          <MiniKeyboard tone="purple" tilt={6} />
        </div>

        <div className="relative mt-6 flex flex-col items-center gap-0.5">
          <p
            className="bg-clip-text text-transparent text-base sm:text-lg font-extrabold tracking-wide"
            style={{ backgroundImage: 'linear-gradient(135deg, #4361ee 0%, #7c3aed 100%)' }}
          >
            Type Together.
          </p>
          <p className="text-sm sm:text-base font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
            Compete Better.
          </p>
        </div>
      </div>
    </div>
  );
}

const CHALLENGE_BENEFITS = [
  { icon: Zap, title: 'Same Text', sub: 'Both players get the exact same text' },
  { icon: Timer, title: 'Synchronized Start', sub: 'Fair and accurate timing' },
  { icon: ShieldCheck, title: 'Real-time Updates', sub: "See your opponent's progress" },
  { icon: Trophy, title: 'Track & Improve', sub: 'Build your skills and track achievements' },
] as const;

const CREATE_FEATURES = [
  'Get a unique challenge code',
  'Share the link with your friend',
  'Start when your friend joins',
];

export const DURATION_OPTIONS = [
  { seconds: 60, label: '1 Minute' },
  { seconds: 120, label: '2 Minutes' },
  { seconds: 300, label: '5 Minutes' },
] as const;

export function durationLabel(seconds: number): string {
  return DURATION_OPTIONS.find((o) => o.seconds === seconds)?.label ?? `${seconds}s`;
}

export function formatClock(totalSeconds: number): string {
  const secs = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const CANONICAL_SITE_URL = 'https://www.typeoye.com';

/* Challenge share links must always point at a real, clickable site. The URL is
   derived from the ACTUAL serving origin so it is correct on localhost dev
   (http://localhost:5173/challenge/{code}) and on any deployed/preview host. On
   the production typeoye.com domain the link is normalized to the canonical
   https://www.typeoye.com root, so a shared link is identical whether the
   sender opened the site with or without "www". */
function buildChallengeLink(code: string): string {
  const { hostname, origin } = window.location;
  if (hostname === 'localhost' || hostname === '127.0.0.1' || !hostname.endsWith('typeoye.com')) {
    return `${origin}/challenge/${code}`;
  }
  return `${CANONICAL_SITE_URL}/challenge/${code}`;
}

function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function ChallengeHome() {
  useSeo({
    title: 'Typing Challenge – Race a Friend in Real-Time | Typeoye',
    description: 'Create a typing challenge, share your code, and race a friend in a real-time typing battle. Compare WPM and accuracy live on Typeoye.',
    canonicalPath: '/challenge',
  });
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [createDuration, setCreateDuration] = useState(60);
  const [codeInput, setCodeInput] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const createChallenge = async () => {
    setCreating(true);
    setCreateError(null);
    try {
      const challenge = await challengeService.create(createDuration);
      navigate(`/challenge/${challenge.code}`, { replace: true });
    } catch (err) {
      setCreateError(getApiErrorMessage(err, 'Could not create a challenge. Please try again.'));
      setCreating(false);
    }
  };

  const joinChallenge = () => {
    const code = normalizeCode(codeInput);
    if (!CODE_PATTERN.test(code)) {
      setJoinError('Enter a valid challenge code like TY-8K4P2.');
      return;
    }
    navigate(`/challenge/${code}`, { replace: true });
  };

  return (
    <PageWrapper fullWidth noHeader title="Typing Challenge" className="py-10 sm:py-14 px-3 sm:px-4 md:px-6">
      <div className="max-w-[68rem] mx-auto w-full">
        {/* HERO */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div className="challenge-fade-in">
            <span
              className="inline-flex items-center justify-center rounded-[1.25rem]"
              style={{ width: '4.25rem', height: '4.25rem', background: 'linear-gradient(135deg, #4361ee, #7c3aed)', boxShadow: '0 16px 32px -12px rgba(67, 97, 238, 0.55)' }}
            >
              <Swords size={30} color="#fff" />
            </span>
            <h1
              className="mt-5 bg-clip-text text-transparent text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight"
              style={{ backgroundImage: 'linear-gradient(135deg, #4361ee 0%, #7c3aed 100%)' }}
            >
              Typing Challenge
            </h1>
            <p className="mt-3 text-base sm:text-lg" style={{ color: 'var(--color-text-secondary)' }}>
              Challenge your friend in a real-time typing battle.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold" style={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent-text)' }}>
                <Zap size={14} /> Real-time
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold" style={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent-text)' }}>
                <Users size={14} /> 2 Players
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold" style={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent-text)' }}>
                <ShieldCheck size={14} /> Fair &amp; Secure
              </span>
            </div>
          </div>

          <ChallengeHeroVisual />
        </section>

        {/* CREATE / JOIN */}
        <section className="mt-10 sm:mt-12 grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
          <section
            className="challenge-fade-in card p-6 sm:p-7 flex flex-col"
            style={{ animationDelay: '40ms', borderRadius: '1.375rem', borderColor: 'rgba(99, 102, 241, 0.18)', boxShadow: '0 20px 46px -20px rgba(67, 97, 238, 0.28)' }}
            data-testid="challenge-create-card"
          >
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl" style={{ background: 'linear-gradient(135deg, #4361ee, #7c3aed)', boxShadow: '0 10px 20px -8px rgba(67, 97, 238, 0.5)' }}>
                <Link2 size={20} color="#fff" />
              </span>
              <div>
                <h2 className="text-xl font-extrabold" style={{ color: 'var(--color-text-primary)' }}>Create Challenge</h2>
                <p className="mt-0.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Create a private typing challenge and invite your friend using a code or shareable link.
                </p>
              </div>
            </div>

            <ul className="mt-4 flex flex-col gap-1.5">
              {CREATE_FEATURES.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full text-white" style={{ background: 'linear-gradient(135deg, #4361ee, #7c3aed)' }}>
                    <Check size={11} strokeWidth={3} />
                  </span>
                  {feature}
                </li>
              ))}
            </ul>

            {/* Challenge duration selector */}
            <div className="mt-5">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Challenge Duration</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {DURATION_OPTIONS.map((opt) => {
                  const active = createDuration === opt.seconds;
                  return (
                    <button
                      key={opt.seconds}
                      type="button"
                      data-testid={`challenge-duration-${opt.seconds}`}
                      onClick={() => setCreateDuration(opt.seconds)}
                      aria-pressed={active}
                      className="flex flex-col items-center justify-center gap-0.5 rounded-xl border px-2 py-2.5 text-sm font-bold transition-all duration-150"
                      style={active
                        ? { borderColor: 'transparent', background: 'linear-gradient(135deg, #4361ee, #7c3aed)', color: '#fff', boxShadow: '0 8px 18px -8px rgba(67, 97, 238, 0.55)' }
                        : { borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)', color: 'var(--color-text-secondary)' }}
                    >
                      <span className="text-[0.625rem] font-bold uppercase tracking-wider" style={{ color: active ? 'rgba(255, 255, 255, 0.85)' : 'var(--color-text-muted)' }}>{opt.label}</span>
                      <span className="text-sm font-extrabold tabular-nums">{opt.seconds}s</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                <Timer size={13} /> Choose how long the typing race will last.
              </p>
            </div>

            {createError && (
              <p className="mt-3 text-sm" style={{ color: 'var(--color-error)' }}>{createError}</p>
            )}

            <button
              data-testid="challenge-create"
              onClick={() => void createChallenge()}
              disabled={creating}
              className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all duration-150 hover:-translate-y-0.5 hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #4361EE, #8B5CF6)', color: '#fff', boxShadow: '0 10px 24px -10px rgba(67, 97, 238, 0.6)' }}
            >
              {creating ? <Loader2 size={16} className="animate-spin" /> : null}
              {creating ? 'Creating…' : 'Create Challenge'}
              {!creating && <ArrowRight size={16} />}
            </button>
          </section>

          <section
            className="challenge-fade-in card p-6 sm:p-7 flex flex-col"
            style={{ animationDelay: '100ms', borderRadius: '1.375rem', borderColor: 'rgba(99, 102, 241, 0.18)', boxShadow: '0 20px 46px -20px rgba(67, 97, 238, 0.28)' }}
            data-testid="challenge-join-card"
          >
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', boxShadow: '0 10px 20px -8px rgba(124, 58, 237, 0.5)' }}>
                <Users size={20} color="#fff" />
              </span>
              <div>
                <h2 className="text-xl font-extrabold" style={{ color: 'var(--color-text-primary)' }}>Join Challenge</h2>
                <p className="mt-0.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Enter the challenge code or open a shared link to join a friend&apos;s typing challenge.
                </p>
              </div>
            </div>

            <label className="mt-5 block text-xs font-bold" htmlFor="challenge-code-input" style={{ color: 'var(--color-text-muted)' }}>Challenge code</label>
            <input
              id="challenge-code-input"
              data-testid="challenge-code-input"
              value={codeInput}
              onChange={(e) => {
                setCodeInput(e.target.value.toUpperCase());
                setJoinError(null);
              }}
              onKeyDown={(e) => { if (e.key === 'Enter') joinChallenge(); }}
              placeholder="Enter challenge code (e.g. TY-8K4P2)"
              maxLength={9}
              className="input-base mt-1.5 block w-full font-mono"
              style={{ padding: '0.75rem 0.875rem' }}
              autoComplete="off"
              spellCheck={false}
            />
            {joinError && (
              <p className="mt-2 text-sm" style={{ color: 'var(--color-error)' }}>{joinError}</p>
            )}

            <button
              data-testid="challenge-join"
              onClick={joinChallenge}
              className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all duration-150 hover:-translate-y-0.5 hover:brightness-110"
              style={{ background: 'linear-gradient(135deg, #4361EE, #8B5CF6)', color: '#fff', boxShadow: '0 10px 24px -10px rgba(67, 97, 238, 0.6)' }}
            >
              Join Challenge
              <ArrowRight size={16} />
            </button>

            <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs" style={{ color: 'var(--color-text-muted)' }}>
              <Link2 size={12} /> Have a shared link? Open it to join instantly.
            </p>
          </section>
        </section>

        {/* BENEFITS */}
        <section className="challenge-fade-in card mt-10 sm:mt-12 p-5 sm:p-6" style={{ animationDelay: '160ms', borderRadius: '1.375rem', borderColor: 'rgba(99, 102, 241, 0.18)' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-5">
            {CHALLENGE_BENEFITS.map((benefit, index) => (
              <div
                key={benefit.title}
                className={`flex items-start gap-3 sm:px-4 sm:py-1.5${index > 0 ? ' lg:border-l lg:border-[var(--color-border)]' : ''}`}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ backgroundColor: 'rgba(67, 97, 238, 0.10)', color: '#4361ee' }}>
                  <benefit.icon size={18} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>{benefit.title}</p>
                  <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{benefit.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs" style={{ color: 'var(--color-text-muted)' }}>
          <Trophy size={13} /> Every race records WPM, accuracy, and correct words for both players.
        </p>
      </div>
    </PageWrapper>
  );
}

/* ═══════════════════════════ ROOM ═══════════════════════════ */

type RoomPhase = 'loading' | 'error' | 'expired' | 'lobby' | 'countdown' | 'typing' | 'waitingResults' | 'opponentLeft' | 'results';

type LiveProgressStatus = 'waiting' | 'ready' | 'typing' | 'finished' | 'disconnected';

interface OpponentProgress {
  userId: string;
  username: string;
  round: number;
  correct: number;
  attempted: number;
  errors: number;
  typedChars: number;
  wpm: number;
  accuracy: number;
  progress: number;
  status?: LiveProgressStatus;
  updatedAt?: string;
}

interface MySummary {
  wpm: number;
  accuracy: number;
  correctWords: number;
  errorsCount: number;
}

function ChallengeRoom({ code }: { code: string }) {
  const navigate = useNavigate();
  const { token, user: authUser } = useAuthStore();
  const ownUserId = authUser?._id != null ? String(authUser._id) : undefined;
  const [challenge, setChallenge] = useState<ChallengePublic | null>(null);
  const [phase, setPhase] = useState<RoomPhase>('loading');
  const [errorTitle, setErrorTitle] = useState<string>('');
  const [errorBody, setErrorBody] = useState<string>('');
  const [opponentProgress, setOpponentProgress] = useState<OpponentProgress | null>(null);
  const [opponentLeft, setOpponentLeft] = useState(false);
  const [opponentLeftMessage, setOpponentLeftMessage] = useState<string | null>(null);
  const [opponentLeaveToast, setOpponentLeaveToast] = useState(false);
  const [opponentLeaveToastCopy, setOpponentLeaveToastCopy] = useState<{ title: string; body: string } | null>(null);
  const [mySummary, setMySummary] = useState<MySummary | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const codeRef = useRef(code);
  const phaseRef = useRef<RoomPhase>(phase);
  const engagedRef = useRef(false);
  const submittedRef = useRef(false);
  const timerIdRef = useRef<number | null>(null);
  const roundRef = useRef<number | null>(null);
  const rematchPendingRef = useRef(false);
  const handledOpponentLeaveRef = useRef(false);
  const opponentLeaveToastTimerRef = useRef<number | null>(null);
  // Guards the one-shot authoritative re-read we fire the moment the solo
  // waiting clock hits 0:00, so a slow network can't turn the ticker into a
  // GET storm.
  const expiryProbeRef = useRef(false);
  // One-shot latch for the CASE 1 solo-lobby teardown.
  const expiredLobbyHandledRef = useRef(false);

  const showOpponentLeftToastAndRedirect = useCallback((copy?: { title: string; body: string }) => {
    if (handledOpponentLeaveRef.current) return;
    handledOpponentLeaveRef.current = true;
    rematchPendingRef.current = false;
    if (copy) setOpponentLeaveToastCopy(copy);
    setOpponentLeaveToast(true);
    if (opponentLeaveToastTimerRef.current !== null) {
      window.clearTimeout(opponentLeaveToastTimerRef.current);
    }
    opponentLeaveToastTimerRef.current = window.setTimeout(() => {
      opponentLeaveToastTimerRef.current = null;
      navigate('/challenge');
    }, 2000);
  }, [navigate]);

  /* Mid-race departure = NO CONTEST. The server is authoritative and marks the
     room `endedBy: 'opponent_left'` (winner stays null) the moment the opponent
     intentionally leaves, or after the reconnection grace lapses on a dropped
     socket. Every path into that state (socket event, state echo, a refresh
     re-reading the room) funnels through here so the survivor always gets the
     same outcome: the race freezes where it stands, no result/winner is ever
     rendered, and the popup + redirect is shown exactly once. */
  const endRunForOpponentLeft = useCallback((next: ChallengePublic, message?: string | null) => {
    // A snapshot from an older round can never void the current race.
    if (roundRef.current != null && next.round < roundRef.current) return;
    // Stop the machine first: no auto-submit, no progress publishing, no more
    // keystrokes counted — the race is over, nothing is being scored.
    submittedRef.current = true;
    engagedRef.current = false;
    setChallenge(next);
    setOpponentLeft(true);
    setOpponentLeftMessage(message ?? 'Your opponent has left the challenge.');
    setPhase('opponentLeft');
    showOpponentLeftToastAndRedirect({
      title: '⚠️ Opponent Left the Challenge',
      body: 'Your opponent has left the challenge.',
    });
  }, [showOpponentLeftToastAndRedirect]);

  phaseRef.current = phase;

  const currentCode = codeRef.current;

  const liveOpponent = challenge ? opponentOf(challenge, challenge.me) : null;
  /* Chat visibility gate: the widget (and its floating button) only exist while
     a REAL opponent is seated AND connected in this room AND the challenge is
     actually RUNNING (the authoritative shared status from the server, never a
     purely local flag). This makes chat an ACTIVE-MATCH feature: it is hidden
     throughout the lobby (WAITING / PLAYER_JOINED / READY) — before the
     opponent joins, while waiting for them to ready up, and even when both
     players are ready — and only appears once the race has started. Before the
     opponent joins ("Waiting for opponent…"), and again if they leave or their
     socket drops, chat is fully hidden — no pill, no panel. The recipient is
     always the actual opponent (slots re-derived from each user's own id). */
  const chatOpponent = liveOpponent && liveOpponent.connected ? liveOpponent : null;
  const chatEnabled = Boolean(challenge && chatOpponent && challenge.status === 'RUNNING');
  /* An abandoned race tells us WHO gave up: the opponent (winner = me) or me.
     Combined with the live opponentLeft event this drives both the results
     messaging and the red/amber connection banners. */
  const abandonedByOpponent = Boolean(
    challenge && challenge.endedBy === 'abandoned' && challenge.abandonedBy !== challenge.me
  );
  /* The opponent is treated as permanently gone when either the room told us
     (opponentLeft event / abandoned room) OR the authoritative server-side
     presence reads "left" on the CURRENT, not-yet-advanced round — a page
     refresh or reconnect echo must never resurrect a departed opponent on the
     results screen. */
  const opponentPresenceLeft = Boolean(
    challenge &&
      challenge.status === 'COMPLETED' &&
      liveOpponent &&
      liveOpponent.presence === 'left'
  );
  const showOpponentLeft = opponentLeft || abandonedByOpponent || opponentPresenceLeft;
  const opponentDisconnected = Boolean(liveOpponent && !liveOpponent.connected);

  /* `exit` is a deliberate player action (Leave / Exit button) and the server
     ends a live race immediately on it. `unmount` is only the page going away
     (close, refresh, navigation): that is a PRESENCE event, not an intent, so
     the server applies the same reconnection grace as any other drop and a
     refresh can never void a race. */
  const emitLeave = useCallback((reason: 'exit' | 'unmount') => {
    emit('challenge:leave', { code: codeRef.current, reason });
  }, []);

  /* CASE 1 — the solo waiting window elapsed with nobody ever having joined.
     This is NOT an error and NOT a result: the room simply stopped being
     interesting, so the client tears the whole thing down and returns the
     player to the main Typing Challenge page (Create / Join) to start again.
     There is deliberately no "Challenge Expired" card and no error screen —
     the only visible outcome is being back on the challenge home page.
     Guarded by a ref so a slow network (the authoritative re-read plus the
     3s lobby poller) can never fire it twice or race the navigation.
     Declared AFTER `emitLeave` on purpose: referencing it above its `const`
     would be a temporal-dead-zone ReferenceError on every render. */
  const expireSoloLobbyAndReturn = useCallback(() => {
    if (expiredLobbyHandledRef.current) return;
    expiredLobbyHandledRef.current = true;
    // Stop every machine this room owns before we move on.
    submittedRef.current = true;
    engagedRef.current = false;
    rematchPendingRef.current = false;
    if (timerIdRef.current !== null) {
      window.clearInterval(timerIdRef.current);
      timerIdRef.current = null;
    }
    if (opponentLeaveToastTimerRef.current !== null) {
      window.clearTimeout(opponentLeaveToastTimerRef.current);
      opponentLeaveToastTimerRef.current = null;
    }
    // Drop the room-scoped state: opponent, progress, results, error copy.
    setOpponentProgress(null);
    setOpponentLeft(false);
    setOpponentLeftMessage(null);
    setMySummary(null);
    setErrorTitle('');
    setErrorBody('');
    setChallenge(null);
    setPhase('expired');
    // Stop listening to this room, then leave it entirely. The mount effect's
    // cleanup removes the socket listeners when the component unmounts.
    emitLeave('exit');
    navigate('/challenge');
  }, [emitLeave, navigate]);

  const goToError = useCallback((title: string, body: string) => {
    setErrorTitle(title);
    setErrorBody(body);
    setPhase('error');
    setChallenge(null);
  }, []);

  const applyChallenge = useCallback((raw: ChallengePublic) => {
    const next = applyOwnSlot(raw, ownUserId);
    const prevRound = roundRef.current;
    roundRef.current = next.round;
    const roundChanged = prevRound != null && next.round > prevRound;

    // A voided race must be intercepted BEFORE any status mapping: the room is
    // COMPLETED on the server but nobody won it, so the results screen (and any
    // winner/trophy messaging) must never be reached.
    if (next.endedBy === 'opponent_left') {
      if (prevRound != null && next.round < prevRound) return;
      endRunForOpponentLeft(next, 'Your opponent has left the challenge.');
      return;
    }

    setChallenge(next);

    // A brand-new round must never inherit the previous round's live state —
    // including the opponent-left flag, which only ever applies to the CURRENT
    // round's results screen. Same-round snapshots (e.g. a reconnect echo with
    // an updated presence) must NOT wipe it.
    if (roundChanged) {
      setOpponentProgress(null);
      setMySummary(null);
      setOpponentLeft(false);
      setOpponentLeftMessage(null);
      submittedRef.current = false;
      engagedRef.current = false;
      rematchPendingRef.current = false;
      // A new round starts a completely fresh lifecycle. The opponent-left toast
      // latch only applies to the round (or the teardown path) where it was
      // triggered; a subsequent round must be able to emit its own departure
      // state. Do NOT let it survive the round change.
      handledOpponentLeaveRef.current = false;
    }

    const status = next.status;
    if (status === 'COMPLETED') {
      submittedRef.current = true;
      setPhase('results');
      const nextOpp = opponentOf(next, next.me);
      const rematchWasPending = rematchPendingRef.current ||
        Boolean(challengeRefSafe.current && mePlayer(challengeRefSafe.current)?.rematchReady);
      if (rematchWasPending && nextOpp && nextOpp.presence === 'left') {
        showOpponentLeftToastAndRedirect();
      }
      return;
    }
    if (status === 'RUNNING') {
      const startAt = next.startAt ? new Date(next.startAt).getTime() : Date.now();
      // A reconnected/echoed RUNNING snapshot must NOT yank a player who has
      // already submitted their results back into the typing screen — they stay
      // on the waiting card (their stats are read from the submitted snapshot).
      if (phaseRef.current !== 'waitingResults') {
        engagedRef.current = true;
        // A snapshot that arrives with little lead time must NOT skip the
        // countdown: `countdown` renders the shared "Get Ready" clock and flips
        // to `typing` exactly at startAt, whereas `typing` would mount a live
        // board before the race began. Anything that reaches `typing` this way
        // (a refresh, a slow load or a late socket delivery inside the final
        // seconds) would let that player type while the opponent is still on
        // the countdown. Keep both players on the same pre-race view instead.
        setPhase(startAt - Date.now() > 0 ? 'countdown' : 'typing');
      }
      return;
    }
    if (status === 'WAITING' || status === 'PLAYER_JOINED' || status === 'READY') {
      // Pre-run snapshot: go to the lobby, but never yank a player back out of
      // an active race (unless this is a genuinely new round).
      const currentPhase = phaseRef.current;
      if (roundChanged || currentPhase === 'loading' || currentPhase === 'lobby' || currentPhase === 'results' || currentPhase === 'waitingResults') {
        setPhase('lobby');
      }
      return;
    }
    /* Two genuinely different endings, and this is the LAST branch on purpose.
       A room that ever had an opponent — or a client that is already past the
       waiting lobby — must never be treated as a solo timeout: "no opponent
       joined" is only true for a room that never had one. Such a snapshot means
       the opponent is gone, so it is OPPONENT_LEFT. Only a room that sat alone
       the whole 1-minute window is a silent lobby teardown back to the main
       Typing Challenge page. */
    const opponentWasSeated = next.players.some((player) => player.slot === 'player2');
    const pastLobby = !['loading', 'lobby', 'expired', 'error'].includes(phaseRef.current);
    if (opponentWasSeated || pastLobby) {
      endRunForOpponentLeft(next, 'Your opponent has left the challenge.');
      return;
    }
    expireSoloLobbyAndReturn();
  }, [ownUserId, showOpponentLeftToastAndRedirect, endRunForOpponentLeft, expireSoloLobbyAndReturn]);

  /* Sticky opponent-gone state for the rematch window: the server emits
     challenge:opponentLeft (with the authoritative post-cancel snapshot) when a
     pending rematch is cancelled because the opponent is permanently gone. We
     remember the flag AND the reason so a same-round state echo can never undo
     it, show the fresh snapshot (both rematchReady flags now false), and pin
     the results screen with the left-opponent messaging. */
  const applyOpponentLeftState = (next: ChallengePublic, message?: string | null) => {
    const prev = challengeRefSafe.current;
    // Mid-race departure: same no-contest path as the state echo above. This
    // event is the PRIMARY signal (a dropped socket past the grace window, or
    // an explicit Leave) so it is handled before the rematch-window logic.
    if (next.endedBy === 'opponent_left') {
      endRunForOpponentLeft(next, message ?? 'Your opponent has left the challenge.');
      return;
    }
    const rematchWasPending = rematchPendingRef.current ||
      Boolean(prev && prev.status === 'COMPLETED' && mePlayer(prev)?.rematchReady);
    setChallenge(next);
    setOpponentLeft(true);
    setOpponentLeftMessage(message ?? null);
    roundRef.current = next.round;
    if (next.status === 'COMPLETED') {
      setPhase('results');
      if (rematchWasPending) showOpponentLeftToastAndRedirect();
      return;
    }
    if (next.status === 'RUNNING') {
      const startAt = next.startAt ? new Date(next.startAt).getTime() : Date.now();
      if (phaseRef.current !== 'waitingResults') {
        engagedRef.current = true;
        // Same rule as the live `challenge:started` path: show the shared
        // countdown whenever the start is still in the future, so a slow load
        // never drops one player straight into the duel.
        setPhase(startAt - Date.now() > 0 ? 'countdown' : 'typing');
      }
    }
  };

  const loadChallenge = useCallback(async () => {
    let next: ChallengePublic;
    try {
      next = await challengeService.get(codeRef.current);
    } catch (err) {
      goToError('Challenge not found.', getApiErrorMessage(err, 'This challenge does not exist yet.'));
      return;
    }
    if (next.status === 'EXPIRED') {
      // Loading (or re-reading) a room whose solo window already elapsed —
      // including a stale link opened after the fact. Same CASE 1 outcome:
      // tear down and return to the main Typing Challenge page.
      expireSoloLobbyAndReturn();
      return;
    }
    if (!next.me) {
      if (next.players.length >= 2) {
        setErrorTitle('This challenge is already full.');
        setErrorBody('A challenge can only have two players. Ask your friend for a fresh code.');
        setPhase('error');
        return;
      }
      try {
        next = await challengeService.join(codeRef.current);
      } catch (err) {
        const message = getApiErrorMessage(err, 'This challenge is already full.');
        if (message.includes('full')) {
          setErrorTitle('This challenge is already full.');
          setErrorBody('A challenge can only have two players. Ask your friend for a fresh code.');
        } else if (message.includes('expired')) {
          // The room lapsed between our read and our join attempt: CASE 1, so
          // return to the main Typing Challenge page rather than show a card.
          expireSoloLobbyAndReturn();
          return;
        } else {
          setErrorTitle('Could not join this challenge.');
          setErrorBody(message);
        }
        setPhase('error');
        return;
      }
    }
    applyChallenge(next);
    void ensureSocketJoined(codeRef.current);
  }, [applyChallenge, goToError]);

  /* Lightweight lobby self-heal: re-reads authoritative state every few
     seconds while in the lobby. If a start event was ever missed (socket join
     raced the start, or the connection dropped mid-lobby), this pulls the
     RUNNING snapshot so no player can get stuck on the lobby screen forever. */
  const refreshLobbyState = useCallback(async () => {
    let next: ChallengePublic;
    try {
      next = await challengeService.get(codeRef.current);
    } catch {
      return; // transient network issue — keep polling
    }
    if (next.status === 'EXPIRED') {
      // The lobby poller saw the solo window lapse: CASE 1 teardown.
      expireSoloLobbyAndReturn();
      return;
    }
    const normalized = applyOwnSlot(next, ownUserId);
    if (roundRef.current != null && normalized.round < roundRef.current) return;
    applyChallenge(normalized);
  }, [applyChallenge, ownUserId, expireSoloLobbyAndReturn]);

  useEffect(() => {
    if (phase !== 'lobby') {
      const pendingRematch = phase === 'results' && challenge
        && ((mePlayer(challenge)?.rematchReady ?? false) || (opponentOf(challenge, challenge.me)?.rematchReady ?? false));
      if (!pendingRematch) return;
    }
    const id = window.setInterval(() => void refreshLobbyState(), 3000);
    return () => window.clearInterval(id);
  }, [phase, challenge, refreshLobbyState]);

  /* An EXPIRED room is a dead end: the server will never move it forward, so
     drop the realtime subscription and the room-scoped state as soon as the
     authoritative status arrives. No API leave call — the room is already
     finished, we just stop listening and let the screen offer the way back to
     the Typing Challenge page. */
  useEffect(() => {
    if (phase !== 'expired') return;
    engagedRef.current = false;
    emitLeave('unmount');
  }, [phase, emitLeave]);

  /* The room is void the moment the opponent leaves: drop out of the socket
     room, stop the lobby clock and make sure nothing further can be published
     or submitted. The socket LISTENERS themselves are removed by the mount
     effect's cleanup when the popup redirects away ~2s later, so no duplicate
     handler can ever be attached. */
  useEffect(() => {
    if (phase !== 'opponentLeft') return;
    engagedRef.current = false;
    submittedRef.current = true;
    emitLeave('unmount');
    if (timerIdRef.current !== null) {
      window.clearInterval(timerIdRef.current);
      timerIdRef.current = null;
    }
  }, [phase, emitLeave]);

  /* The results screen is designed to fit entirely in the desktop viewport —
     the persistent site footer would push it below the fold, so it is hidden
     for exactly as long as this screen is active (removed again on exit). */
  useEffect(() => {
    if (phase !== 'results') return;
    document.body.classList.add('challenge-results-active');
    return () => document.body.classList.remove('challenge-results-active');
  }, [phase]);

  useEffect(() => {
    setOpponentProgress(null);
    setOpponentLeft(false);
    setMySummary(null);
    setOpponentLeaveToast(false);
    submittedRef.current = false;
    engagedRef.current = false;
    rematchPendingRef.current = false;
    handledOpponentLeaveRef.current = false;
    if (opponentLeaveToastTimerRef.current !== null) {
      window.clearTimeout(opponentLeaveToastTimerRef.current);
      opponentLeaveToastTimerRef.current = null;
    }
    setPhase('loading');

    if (token) connectChallengeSocket(token);

    /* The challenge socket is a single shared connection, so a broadcast for
       the room this client just abandoned can still arrive after "New Challenge"
       has already mounted the replacement room. The round guards below cannot
       catch that - both rooms are round 1 - so the abandoned room's EXPIRED
       snapshot would be applied to the fresh lobby and the player would be
       thrown straight back onto the old expired card. Every payload that
       carries a room is therefore matched against the mounted room's code
       first; anything else is not ours. */
    const forThisRoom = (incoming?: ChallengePublic | null) => {
      if (!incoming?.code) return true;
      return normalizeCode(incoming.code) === codeRef.current;
    };

    const onState = (payload: { challenge: ChallengePublic }) => {
      if (!payload?.challenge) return;
      if (!forThisRoom(payload.challenge)) return;
      const next = applyOwnSlot(payload.challenge, ownUserId);
      // Stale snapshots from an older round must never overwrite the current
      // round's UI (e.g. a delayed round-1 broadcast during round 2).
      if (roundRef.current != null && next.round < roundRef.current) return;
      applyChallenge(next);
    };

    const onStarted = (payload: { startAtMs?: number; durationSeconds?: number; text?: string; challenge?: ChallengePublic }) => {
      // A voided room can never be (re)started: the departure is terminal.
      if (phaseRef.current === 'opponentLeft') return;
      if (payload?.challenge) {
        if (!forThisRoom(payload.challenge)) return;
        const next = applyOwnSlot(payload.challenge, ownUserId);
        if (roundRef.current != null && next.round < roundRef.current) return;
        applyChallenge(next);
      } else if (typeof payload?.startAtMs === 'number' && challengeRefSafe.current?.text) {
        const startAtMs = payload.startAtMs;
        const durSecs = payload.durationSeconds;
        const txt = payload.text;
        setChallenge((prev) => prev ? {
          ...prev,
          status: 'RUNNING' as ChallengeStatus,
          startAt: new Date(startAtMs).toISOString(),
          durationSeconds: durSecs ?? prev.durationSeconds,
          text: txt ?? prev.text,
        } : prev);
        engagedRef.current = true;
        // Always show the shared countdown while the start is still ahead;
        // DuelArea's input lock is what makes a late-arriving start safe.
        setPhase(startAtMs - Date.now() > 0 ? 'countdown' : 'typing');
      }
    };

    const onOpponentLeft = (payload: { challenge?: ChallengePublic; message?: string } = {}) => {
      if (payload?.challenge) {
        if (!forThisRoom(payload.challenge)) return;
        const next = applyOwnSlot(payload.challenge, ownUserId);
        if (roundRef.current != null && next.round < roundRef.current) return;
        applyOpponentLeftState(next, payload.message);
      } else {
        // A departure with no snapshot attached. This is still CASE 2 - an
        // opponent who was IN the room left - so it gets the departure popup
        // and the automatic return, never an error/expiry card. Fall back to
        // the last snapshot we hold for this room; if we truly have none there
        // is no race to freeze, so the popup + redirect is still the outcome.
        const known = challengeRefSafe.current;
        if (known) {
          endRunForOpponentLeft(known, 'Your opponent has left the challenge.');
        } else {
          showOpponentLeftToastAndRedirect({
            title: '⚠️ Opponent Left the Challenge',
            body: 'Your opponent has left the challenge.',
          });
        }
      }
    };

    const onOpponentProgress = (payload: OpponentProgress) => {
      if (!payload) return;
      // The race is void: late progress packets must not animate a frozen board.
      if (phaseRef.current === 'opponentLeft') return;
      // Round-scoped: a live update tagged for a previous round is stale and
      // must be dropped so round-1 stats can never appear in round 2.
      if (roundRef.current != null && payload.round !== roundRef.current) return;
      // The server already excludes the sender, but guard client-side too so a
      // stale/self echo can never overwrite the real opponent's stats.
      if (ownUserId && payload.userId === ownUserId) return;
      setOpponentProgress(payload);
    };

    // Replay of the opponent's LAST published state, sent by the server when a
    // player (re)joins an already-running race (page refresh / reconnect). Same
    // guards as the live broadcast; crucially it must NEVER zero out progress.
    const onOpponentProgressSync = onOpponentProgress;

    const onResults = (payload: { challenge: ChallengePublic }) => {
      if (payload?.challenge) {
        if (!forThisRoom(payload.challenge)) return;
        const next = applyOwnSlot(payload.challenge, ownUserId);
        if (roundRef.current != null && next.round < roundRef.current) return;
        applyChallenge(next);
      }
    };

    const onRematch = (payload: { challenge: ChallengePublic }) => {
      if (!payload?.challenge) return;
      if (phaseRef.current === 'opponentLeft') return;
      if (!forThisRoom(payload.challenge)) return;
      const next = applyOwnSlot(payload.challenge, ownUserId);
      // Only a genuinely NEWER round starts a rematch; re-hearing the same
      // round (or an echo) is a no-op.
      if (roundRef.current != null && next.round <= roundRef.current) return;
      applyChallenge(next);
    };

    on('challenge:state', onState);
    on('challenge:started', onStarted);
    on('challenge:opponentLeft', onOpponentLeft);
    on('challenge:opponentProgress', onOpponentProgress);
    on('challenge:progressSync', onOpponentProgressSync);
    on('challenge:results', onResults);
    on('challenge:rematch', onRematch);

    const connected = connectChallengeSocket(token ?? '');

    // Runs on the initial connection AND every automatic reconnection: re-enter
    // the challenge room (the server re-broadcasts authoritative state on join)
    // and re-read the current challenge from the API.
    const syncAfterConnect = () => {
      void ensureSocketJoined(codeRef.current);
      void loadChallenge();
    };
    connected.on('connect', syncAfterConnect);
    if (connected.connected) {
      syncAfterConnect();
    }

    void loadChallenge();

    return () => {
      connected.off('connect', syncAfterConnect);
      off('challenge:state', onState);
      off('challenge:started', onStarted);
      off('challenge:opponentLeft', onOpponentLeft);
      off('challenge:opponentProgress', onOpponentProgress);
      off('challenge:progressSync', onOpponentProgressSync);
      off('challenge:results', onResults);
      off('challenge:rematch', onRematch);
      engagedRef.current = false;
    };
  }, [token, loadChallenge, ownUserId]);

  /* This effect re-runs legitimately (token hydration, loader identity), so its
     cleanup may only release what IT created. Stopping the room ticker or the
     popup timer from here would be unrecoverable: the ticker effect keys off
     `phase` alone, so clearing its interval while the phase stays 'lobby' left
     the waiting-room countdown frozen at whatever it last showed. Each timer
     is cleared by the effect that created it. */

  /* Leaving the ROOM is tied to leaving the PAGE, not to this effect re-running.
     The effect above legitimately re-subscribes whenever the auth identity or
     the loader identity changes (token hydration), and its cleanup used to emit
     a leave from that re-run - which, mid-race, reads as "the player pressed
     Leave" and would void a race they are still playing. The teardown signal
     therefore lives in its own unmount-only effect.

     That teardown is DEFERRED by a tick on purpose. React StrictMode
     deliberately mounts, unmounts and remounts every component in development,
     which used to emit a REAL `challenge:leave` one millisecond after the room
     was created. The server honours it exactly like a pressed Leave button, so
     a brand new solo lobby was expired before anybody could join it - "Create
     Challenge" produced a room that was dead on arrival. Counting mounts lets us
     tell the simulated unmount (the effect runs again, so the count moves)
     apart from a real one (nothing remounts, so it is safe to report). */
  const leaveMountCountRef = useRef(0);
  useEffect(() => {
    const thisMount = ++leaveMountCountRef.current;
    const leftCode = normalizeCode(code);
    return () => {
      window.setTimeout(() => {
        if (leaveMountCountRef.current !== thisMount) return; // remounted: not a real departure
        if (!leftCode) return;
        emit('challenge:leave', { code: leftCode, reason: 'unmount' });
      }, 0);
    };
  }, [code]);

  const challengeRefSafe = useRef<ChallengePublic | null>(null);
  challengeRefSafe.current = challenge;

  const startAtMs = challenge?.startAt ? new Date(challenge.startAt).getTime() : 0;
  const durationSec = challenge?.durationSeconds ?? 60;
  const countdownLeft = startAtMs ? Math.max(0, Math.ceil((startAtMs - now) / 1000)) : 0;

  useEffect(() => {
    if (phase === 'countdown' && startAtMs && now >= startAtMs) {
      engagedRef.current = true;
      setPhase('typing');
    }
  }, [phase, startAtMs, now]);

  useEffect(() => {
    if (phase !== 'lobby' && phase !== 'countdown' && phase !== 'typing') return;
    if (timerIdRef.current !== null) window.clearInterval(timerIdRef.current);
    // The lobby only needs a half-second heartbeat to drive the waiting-room
    // countdown; the race keeps the fast tick for the live clock.
    const id = window.setInterval(() => setNow(Date.now()), phase === 'lobby' ? 500 : 200);
    timerIdRef.current = id;
    return () => {
      window.clearInterval(id);
      timerIdRef.current = null;
    };
  }, [phase]);

  /* Solo-lobby expiry countdown. The deadline is the server's `expiresAt`
     (stamped at creation, re-stamped to the full match TTL the moment an
     opponent joins), so this only *renders* the authoritative remaining time —
     it never decides expiry. That keeps it correct across refreshes, minimized
     windows and extra tabs, because every re-mount re-reads the server value. */
  const waitingExpiresAtMs = challenge ? new Date(challenge.expiresAt).getTime() : 0;
  const waitingForOpponent = Boolean(
    challenge && !challenge.players.some((player) => player.slot === 'player2'),
  );
  const waitingSecondsLeft = waitingExpiresAtMs > 0
    ? Math.max(0, Math.ceil((waitingExpiresAtMs - now) / 1000))
    : 0;

  // Reaching 0:00 triggers an immediate authoritative re-read instead of
  // declaring the room dead locally: the server decides EXPIRED and broadcasts
  // it. The existing 3s lobby poll remains the fallback if that GET fails.
  useEffect(() => {
    if (phase !== 'lobby' || !challenge || !waitingForOpponent) return;
    if (waitingExpiresAtMs <= 0 || now < waitingExpiresAtMs) return;
    if (expiryProbeRef.current) return;
    expiryProbeRef.current = true;
    void loadChallenge();
  }, [phase, challenge, now, waitingExpiresAtMs, waitingForOpponent, loadChallenge]);

  const handleSubmitDone = useCallback(async (typedWords: TypedWord[]) => {
    if (submittedRef.current) return;
    // A voided race is never submitted: the opponent left, nothing is scored.
    if (phaseRef.current === 'opponentLeft') return;
    submittedRef.current = true;
    const submittedCode = codeRef.current;
    const challengeSnapshot = challengeRefSafe.current;
    if (!challengeSnapshot) return;
    const startAtIso = challengeSnapshot.startAt ?? new Date().toISOString();
    let requested: Awaited<ReturnType<typeof challengeService.submitResults>> | null = null;
    try {
      requested = await challengeService.submitResults(submittedCode, {
        round: challengeSnapshot.round,
        startTime: startAtIso,
        endTime: new Date(Date.now()).toISOString(),
        typedWords,
      });
    } catch (err) {
      /* A rejected submit is NOT proof that saving failed. The common cause is
         that the room already closed while we were typing - typically because
         the OPPONENT LEFT - and the server rightly refuses a result for a race
         that is no longer RUNNING. Reporting that as a generic "could not
         submit" error is a lie that also strands the player on a dead screen
         (and the dead screen survives a New Challenge click). So re-read the
         authoritative room and render whatever it actually says: opponent_left
         gets the departure flow, EXPIRED gets the lobby card, and only a room
         that is genuinely still RUNNING is a real submission failure. */
      let authoritative: ChallengePublic | null = null;
      try {
        authoritative = await challengeService.get(submittedCode);
      } catch {
        authoritative = null;
      }
      if (authoritative && submittedCode === codeRef.current) {
        if (authoritative.endedBy === 'opponent_left') {
          endRunForOpponentLeft(authoritative, 'Your opponent has left the challenge.');
          return;
        }
        if (authoritative.status === 'EXPIRED') {
          expireSoloLobbyAndReturn();
          return;
        }
        if (authoritative.status === 'COMPLETED') {
          // Closed as a normal result while we were submitting: show it.
          setChallenge(authoritative);
          setPhase('results');
          return;
        }
      }
      setErrorTitle('Could not submit your results.');
      setErrorBody(getApiErrorMessage(err, 'Something went wrong saving the race. Please try again.'));
      setPhase('error');
      return;
    }
    if (!requested) return;
    if (requested.final) {
      setChallenge(requested.challenge);
      setPhase('results');
    } else if (requested.challenge.status === 'EXPIRED') {
      // The room was swept while we were submitting: CASE 1 teardown.
      expireSoloLobbyAndReturn();
    } else {
      const mine = mePlayer(requested.challenge) ?? mePlayer(challengeSnapshot);
      setMySummary({
        wpm: mine?.stats?.wpm ?? 0,
        accuracy: mine?.stats?.accuracy ?? 0,
        correctWords: mine?.stats?.correctWords ?? 0,
        errorsCount: mine?.stats?.errorsCount ?? 0,
      });
      setPhase('waitingResults');
    }
  }, []);

  const rematch = useCallback(async () => {
    const submittedCode = codeRef.current;
    try {
      const { challenge: next, advanced, opponentGone } = await challengeService.rematch(submittedCode);
      if (opponentGone) {
        // The opponent left (or passed the reconnect grace) before/during my
        // request — the server cancelled my ask. Surface the gone-opponent
        // toast and auto-redirect instead of leaving me on "waiting".
        rematchPendingRef.current = true;
        const normalized = applyOwnSlot(next, ownUserId);
        if (roundRef.current != null && normalized.round < roundRef.current) return;
        applyOpponentLeftState(normalized, 'Your opponent is no longer available.');
        return;
      }
      if (advanced || (roundRef.current != null && next.round > roundRef.current)) {
        // Round 2 (or later) is live: reset the previous round's transient
        // state and re-enter the room so the fresh text + startTime flow in.
        submittedRef.current = false;
        engagedRef.current = false;
        rematchPendingRef.current = false;
        setOpponentProgress(null);
        setOpponentLeft(false);
        setOpponentLeftMessage(null);
        setMySummary(null);
        void ensureSocketJoined(submittedCode);
        applyChallenge(next);
      } else {
        // I requested a rematch but the opponent hasn't clicked yet — the room
        // stays COMPLETED; just mirror the authoritative snapshot so the
        // results card shows the "waiting for opponent" state.
        rematchPendingRef.current = true;
        const normalized = applyOwnSlot(next, ownUserId);
        if (roundRef.current != null && normalized.round < roundRef.current) return;
        setOpponentLeft(false);
        setOpponentLeftMessage(null);
        setChallenge(normalized);
      }
    } catch (err) {
      goToError('Could not start a rematch.', getApiErrorMessage(err, 'Please try again.'));
    }
  }, [applyChallenge, goToError, ownUserId]);

  const exitRoom = useCallback(async () => {
    engagedRef.current = false;
    submittedRef.current = true;
    emitLeave('exit');
    try { await challengeService.leave(codeRef.current); } catch { /* ignore */ }
    navigate('/challenge');
  }, [emitLeave, navigate]);

  const copyableUrl = buildChallengeLink(currentCode);

  const render = (() => {
    if (phase === 'loading') {
      return (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={28} className="animate-spin" style={{ color: 'var(--color-accent-text)' }} />
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Joining your challenge…</p>
          </div>
        </div>
      );
    }

    /* `expired` is a TRANSIENT teardown state, not a screen: the solo waiting
       window lapsed, so we are already navigating back to the main Typing
       Challenge page. Rendering anything here - least of all the old
       "Challenge Expired" card - would flash a dead end on the way out. A
       quiet spinner is the honest placeholder for the moment before the
       navigation lands. */
    if (phase === 'expired') {
      return (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={28} className="animate-spin" style={{ color: 'var(--color-accent-text)' }} />
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Returning to Typing Challenge…</p>
          </div>
        </div>
      );
    }

    if (phase === 'error') {
      return (
        <div className="max-w-[30rem] mx-auto w-full">
          <div className="card p-7 text-center">
            <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-3" style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', color: 'var(--status-danger)' }}>
              <AlertTriangle size={22} />
            </span>
            <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{errorTitle}</h2>
            <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>{errorBody}</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Link
                to="/challenge"
                className="py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-150"
                style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', backgroundColor: 'transparent' }}
              >
                <ArrowLeft size={15} /> Back
              </Link>
              <button
                onClick={() => void createAndGo()}
                className="py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-150 hover:brightness-110"
                style={{ background: 'linear-gradient(135deg, #4361EE, #8B5CF6)', color: '#fff', boxShadow: '0 6px 18px rgba(67, 97, 238, 0.35)' }}
              >
                <Swords size={15} /> New Challenge
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (!challenge) return null;

    if (phase === 'waitingResults') {
      return (
        <WaitingCard
          challenge={challenge}
          mySummary={mySummary}
          opponentProgress={opponentProgress}
          opponentDisconnected={opponentDisconnected && !showOpponentLeft}
          opponentLeft={showOpponentLeft}
          onExit={() => void exitRoom()}
        />
      );
    }

    if (phase === 'results') {
      return <ResultsCard challenge={challenge} opponentLeft={showOpponentLeft} opponentLeftMessage={opponentLeftMessage} onRematch={() => void rematch()} onNewChallenge={() => void createAndGo()} onExit={() => void exitRoom()} />;
    }

    if (phase === 'opponentLeft') {
      /* The race is void: keep the frozen duel area exactly where it stopped
         (it is what the player was looking at when the opponent left) with the
         clock and input locked, and let the popup + redirect own the screen.
         No ResultsCard, no winner, no trophy — nothing is scored. */
      return (
        <div data-testid="challenge-opponent-left-run">
          <DuelArea
            key={`${challenge.round}-${startAtMs}`}
            round={challenge.round}
            text={challenge.text ?? ''}
            duration={durationSec}
            startAtMs={startAtMs}
            opponentName={opponentOf(challenge, challenge.me)?.username ?? 'Opponent'}
            opponentProgress={opponentProgress}
            opponentLeft
            opponentDisconnected={false}
            frozen
            onProgress={() => undefined}
            onTextDone={() => undefined}
            onExit={() => void exitRoom()}
          />
        </div>
      );
    }

    if (phase === 'countdown' && challenge.status === 'RUNNING') {
      return (
        <RaceCountdown
          round={challenge.round}
          secondsLeft={countdownLeft}
          opponentName={opponentOf(challenge, challenge.me)?.username ?? 'Opponent'}
        />
      );
    }

    if (phase === 'typing') {
      return (
        <DuelArea
          key={`${challenge.round}-${startAtMs}`}
          round={challenge.round}
          text={challenge.text ?? ''}
          duration={durationSec}
          startAtMs={startAtMs}
          opponentName={opponentOf(challenge, challenge.me)?.username ?? 'Opponent'}
          opponentProgress={opponentProgress}
          opponentLeft={showOpponentLeft}
          opponentDisconnected={opponentDisconnected && !showOpponentLeft}
          onProgress={(p) => emit('challenge:progress', { ...p, round: challengeRefSafe.current?.round })}
          onTextDone={(typedWords) => void handleSubmitDone(typedWords)}
          onExit={() => void exitRoom()}
        />
      );
    }

    return (
      <div className="relative max-w-[72rem] mx-auto w-full">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2rem]">
          <span
            className="absolute -top-24 -left-20 h-72 w-72 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(67, 97, 238, 0.10) 0%, transparent 70%)', filter: 'blur(32px)' }}
          />
          <span
            className="absolute -bottom-28 -right-24 h-80 w-80 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(124, 58, 237, 0.10) 0%, transparent 70%)', filter: 'blur(32px)' }}
          />
          <span
            className="absolute top-16 right-[14%] h-24 w-24 rounded-full opacity-[0.05]"
            style={{ background: 'linear-gradient(135deg, #4361ee, #7c3aed)' }}
          />
          <span
            className="absolute bottom-14 left-[10%] h-3 w-3 rounded-full bg-indigo-500/20"
          />
          <span
            className="absolute top-8 left-[38%] h-2 w-2 rounded-full bg-purple-500/20"
          />
        </div>
        <LobbyCard
          challenge={challenge}
          code={code}
          shareUrl={copyableUrl}
          waitingSecondsLeft={waitingSecondsLeft}
          isCreator={Boolean(authUser && challenge.players.some((p) => p.slot === 'player1' && p.userId === String(authUser._id)))}
          onBack={() => navigate('/challenge')}
          onReady={() => void readyNow()}
          onExit={() => void exitRoom()}
        />
        {showOpponentLeft && (
          <p className="mt-3 text-sm flex items-center justify-center gap-1.5" style={{ color: 'var(--color-error)' }}>
            <ShieldAlert size={14} /> Your opponent has left the challenge.
          </p>
        )}
        {phase === 'countdown' && (
          <div className="card mt-4 p-6 flex flex-col items-center rounded-[1.5rem]" style={{ borderColor: 'rgba(99, 102, 241, 0.18)' }}>
            <p className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--color-text-muted)' }}>Get Ready</p>
            <div className="text-6xl font-extrabold tabular-nums" style={{ color: 'var(--color-accent-text)', fontFamily: '"JetBrains Mono", "Fira Code", monospace' }}>
              {countdownLeft > 0 ? countdownLeft : 'GO!'}
            </div>
          </div>
        )}
      </div>
    );
  })();

  async function readyNow() {
    const current = codeRef.current;
    try {
      const res = await challengeService.ready(current);
      // The server decides the next phase (READY lobby → RUNNING countdown/
      // typing). We never shortcut to 'typing' from local state alone.
      applyChallenge(res.challenge);
    } catch (err) {
      goToError('Could not mark you ready.', getApiErrorMessage(err, 'Please try again.'));
    }
  }

  async function createAndGo() {
    try {
      const challenge = await challengeService.create();
      navigate(`/challenge/${challenge.code}`, { replace: true });
    } catch {
      // stays on the error card
    }
  }

  const resultsBottomPad = phase === 'results' ? 'pb-2 sm:pb-3 md:pb-3' : 'pb-6 sm:pb-7 md:pb-6';

  return (
    <PageWrapper
      fullWidth
      className={`px-3 pt-4 ${resultsBottomPad} sm:px-4 sm:pt-5 md:px-6`}
      title={undefined}
    >
      <div className="max-w-[106.25rem] mx-auto w-full">{render}</div>
      {opponentLeaveToast && (
        <OpponentLeaveToast
          title={opponentLeaveToastCopy?.title}
          body={opponentLeaveToastCopy?.body}
        />
      )}
      {challenge && chatEnabled && phase !== 'results' && phase !== 'opponentLeft' && (
        <ChallengeChat
          code={currentCode}
          round={challenge.round}
          me={mePlayer(challenge)}
          opponent={chatOpponent}
        />
      )}
    </PageWrapper>
  );
}

function DuelStat({ icon: Icon, label, value, tone, prominent }: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: string;
  prominent?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border px-2 py-2.5 ${
        prominent
          ? 'border-[rgba(67,97,238,0.25)] bg-[rgba(67,97,238,0.06)] dark:bg-[rgba(86,103,238,0.16)]'
          : 'border-[var(--color-border)] bg-[rgba(251,250,254,0.6)] dark:bg-white/5'
      }`}
    >
      <span className="flex items-center gap-1 text-[0.625rem] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
        <Icon size={11} style={{ color: tone }} /> {label}
      </span>
      <b className="mt-0.5 text-xl font-extrabold tabular-nums leading-none" style={{ color: tone, fontFamily: '"JetBrains Mono", "Fira Code", monospace' }}>
        {value}
      </b>
    </div>
  );
}

/***** LOBBY *****/

function LobbyCard({ challenge, code, shareUrl, waitingSecondsLeft, isCreator, onReady, onExit, onBack }: {
  challenge: ChallengePublic;
  code: string;
  shareUrl: string;
  waitingSecondsLeft: number;
  isCreator: boolean;
  onReady: () => void;
  onExit: () => void;
  onBack: () => void;
}) {
  const me = mePlayer(challenge);
  const opponent = opponentOf(challenge, challenge.me);
  const myReady = me?.ready ?? false;
  const hasOpponent = Boolean(opponent);
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);
  const [readyPending, setReadyPending] = useState(false);

  const copy = async (target: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(target === 'code' ? code : shareUrl);
      setCopied(target);
      window.setTimeout(() => setCopied(null), 1500);
    } catch { /* clipboard unavailable */ }
  };

  const shortLink = shareUrl.replace(/^https?:\/\//, '');

  const opponentConnected = opponent?.connected ?? true;

  const conn = !hasOpponent
    ? { label: 'Waiting for opponent…', bg: 'var(--status-warning-bg)', fg: 'var(--status-warning)', dot: '#f59e0b', ping: true }
    : !opponentConnected
      ? { label: 'Opponent disconnected', bg: 'var(--status-danger-bg)', fg: 'var(--status-danger)', dot: '#ef4444', ping: false }
      : { label: 'Both players connected', bg: 'var(--status-success-bg)', fg: 'var(--status-success)', dot: '#22c55e', ping: false };

  let info: { icon: string; title: string; body: string; bg: string; fg: string; border: string };
  if (!hasOpponent) {
    info = {
      icon: '⏳',
      title: 'Waiting for your opponent to join…',
      body: 'Share your challenge code or link with a friend to get started.',
      bg: 'var(--status-warning-bg)',
      fg: 'var(--status-warning)',
      border: 'rgba(245, 158, 11, 0.22)',
    };
  } else if (!myReady) {
    const opponentReady = opponent?.ready ?? false;
    info = opponentReady
      ? {
          icon: '🚀',
          title: 'Your opponent is ready!',
          body: 'Click "I\'m Ready" below to start the battle.',
          bg: 'rgba(67, 97, 238, 0.08)',
          fg: 'var(--color-accent-text)',
          border: 'rgba(99, 102, 241, 0.20)',
        }
      : {
          icon: '🚀',
          title: isCreator ? 'Opponent joined!' : 'You\'ve joined the challenge!',
          body: 'Click "I\'m Ready" when you\'re all set to start.',
          bg: 'rgba(67, 97, 238, 0.08)',
          fg: 'var(--color-accent-text)',
          border: 'rgba(99, 102, 241, 0.20)',
        };
  } else if (opponent?.ready) {
    info = {
      icon: '⚡',
      title: 'Both ready — starting the challenge!',
      body: 'You\'re seconds away from battle.',
      bg: 'var(--status-success-bg)',
      fg: 'var(--status-success)',
      border: 'rgba(34, 197, 94, 0.22)',
    };
  } else {
    info = {
      icon: '👍',
      title: 'You\'re ready — waiting for your opponent…',
      body: 'The race will begin the moment both players click ready.',
      bg: 'rgba(67, 97, 238, 0.08)',
      fg: 'var(--color-accent-text)',
      border: 'rgba(99, 102, 241, 0.20)',
    };
  }

  const handleReady = () => {
    setReadyPending(true);
    onReady();
  };

  return (
    <div className="challenge-fade-in relative" data-testid="challenge-lobby">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all duration-150 hover:-translate-y-0.5 hover:brightness-110"
        style={{ backgroundColor: 'rgba(139, 92, 246, 0.10)', color: 'var(--color-accent-text)', border: '1px solid rgba(99, 102, 241, 0.20)' }}
      >
        <ArrowLeft size={14} /> Back to Games
      </button>

      <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <span
            className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl"
            style={{ background: 'linear-gradient(135deg, #4361ee, #7c3aed)', boxShadow: '0 16px 28px -12px rgba(67, 97, 238, 0.6)' }}
          >
            <Swords size={26} color="#fff" />
          </span>
          <div className="min-w-0">
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: 'var(--color-text-primary)' }}>
              Challenge Room
            </h2>
            <p className="mt-1 text-sm font-bold" style={{ color: 'var(--color-accent-text)' }}>
              {isCreator ? 'Challenge Created!' : 'You\'ve joined the challenge!'}
            </p>
            <p className="mt-1.5 max-w-xl text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Compete with your friend in a real-time typing battle. Be faster. Be more accurate. Win!
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <span
            className="inline-flex w-fit items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold"
            style={{ backgroundColor: 'var(--status-purple-bg)', color: 'var(--status-purple)' }}
          >
            <Swords size={13} /> Round {challenge.round}
          </span>
          <span
            className="inline-flex w-fit items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold"
            style={{ backgroundColor: 'rgba(67, 97, 238, 0.08)', color: 'var(--color-accent-text)' }}
          >
            <Timer size={13} /> {durationLabel(challenge.durationSeconds)} Challenge
          </span>
          <span
            className="inline-flex w-fit items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold"
            style={{ backgroundColor: conn.bg, color: conn.fg }}
          >
            <span className="relative flex h-2 w-2">
              {conn.ping && <span className="challenge-waiting-dot absolute inline-flex h-full w-full rounded-full" style={{ backgroundColor: conn.dot }} />}
              <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: conn.dot }} />
            </span>
            {conn.label}
          </span>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <div
          className="relative flex flex-col overflow-hidden rounded-[1.75rem] p-6 sm:p-9"
          style={{ backgroundColor: 'var(--color-card)', border: '1px solid rgba(99, 102, 241, 0.18)', boxShadow: '0 28px 70px -30px rgba(67, 97, 238, 0.3)' }}
        >
          <span
            aria-hidden
            className="absolute inset-x-0 top-0 h-1"
            style={{ background: 'linear-gradient(90deg, #4361ee, #7c3aed, #4361ee)' }}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -top-16 -right-14 h-52 w-52 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(124, 58, 237, 0.08) 0%, transparent 70%)' }}
          />
          <span aria-hidden className="pointer-events-none absolute bottom-6 left-5 hidden lg:block" style={{ color: 'rgba(124, 58, 237, 0.10)' }}>
            <Keyboard size={84} />
          </span>
          <span aria-hidden className="absolute right-4 top-4" style={{ color: 'rgba(67, 97, 238, 0.16)' }}><Zap size={18} /></span>

          <div className="relative flex flex-1 flex-col">
            <p className="text-center text-xs font-extrabold uppercase tracking-[0.22em]" style={{ color: 'var(--color-accent-text)' }}>
              ⚔ Ready to battle?
            </p>

            <div className="mt-8 flex flex-1 flex-col items-center gap-5 sm:flex-row sm:items-stretch sm:justify-between sm:gap-2">
              <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
                <span
                  className="grid h-16 w-16 shrink-0 place-items-center rounded-full text-xl font-bold text-white sm:h-20 sm:w-20 sm:text-2xl"
                  style={{ background: 'linear-gradient(135deg, #4361ee, #7c3aed)', boxShadow: '0 14px 26px -10px rgba(67, 97, 238, 0.55)' }}
                >
                  {(me?.username ?? '?').slice(0, 1).toUpperCase()}
                </span>
                <span className="mt-1.5 rounded-full px-2.5 py-0.5 text-[0.625rem] font-extrabold uppercase tracking-wide" style={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent-text)' }}>You</span>
                <span className="max-w-full truncate text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>{me?.username ?? 'You'}</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold" style={{ color: myReady ? '#16a34a' : 'var(--color-text-muted)' }}>
                  <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: myReady ? '#22c55e' : 'rgba(148, 163, 184, 0.55)' }} />
                  {myReady ? 'Ready' : 'Not Ready'}
                </span>
              </div>

              <div className="flex shrink-0 flex-col items-center justify-center px-1">
                <span className="relative inline-grid place-items-center">
                  <span
                    aria-hidden
                    className="absolute h-20 w-20 rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(124, 58, 237, 0.35), transparent 70%)', filter: 'blur(6px)' }}
                  />
                  <span className="challenge-vs-pulse relative grid h-14 w-14 place-items-center rounded-full text-base font-extrabold text-white sm:h-16 sm:w-16">
                    VS
                  </span>
                </span>
              </div>

              <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
                <span
                  className="grid h-16 w-16 shrink-0 place-items-center rounded-full text-xl font-bold sm:h-20 sm:w-20 sm:text-2xl"
                  style={{
                    background: opponent ? 'linear-gradient(135deg, #8b5cf6, #d946ef)' : 'rgba(148, 163, 184, 0.22)',
                    color: opponent ? '#fff' : 'var(--color-text-muted)',
                    boxShadow: opponent ? '0 14px 26px -10px rgba(139, 92, 246, 0.55)' : 'none',
                  }}
                >
                  {opponent ? opponent.username.slice(0, 1).toUpperCase() : <Clock size={22} />}
                </span>
                <span className="mt-1.5 rounded-full px-2.5 py-0.5 text-[0.625rem] font-extrabold uppercase tracking-wide" style={{ backgroundColor: opponent ? 'rgba(139, 92, 246, 0.12)' : 'rgba(148, 163, 184, 0.15)', color: opponent ? '#7c3aed' : 'var(--color-text-muted)' }}>Opponent</span>
                <span className="max-w-full truncate text-sm font-bold" style={{ color: opponent ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                  {opponent ? opponent.username : 'Waiting…'}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold" style={{ color: opponent?.ready ? '#16a34a' : 'var(--color-text-muted)' }}>
                  <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: opponent?.ready ? '#22c55e' : 'rgba(148, 163, 184, 0.55)' }} />
                  {opponent ? (opponent.ready ? 'Ready' : 'Not Ready') : 'Waiting'}
                </span>
              </div>
            </div>

            <div className="mt-8 rounded-2xl px-4 py-3.5 text-center" style={{ backgroundColor: info.bg, border: `1px solid ${info.border}` }}>
              <p className="text-sm font-bold" style={{ color: info.fg }}>
                {info.icon} {info.title}
              </p>
              <p className="mt-1 text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{info.body}</p>
              {!hasOpponent && (
                <div className="mt-3 flex items-center justify-center gap-2 border-t pt-3" style={{ borderColor: info.border }}>
                  <Clock size={15} style={{ color: info.fg }} />
                  <span className="text-sm font-bold" style={{ color: info.fg }}>Room expires in</span>
                  <b
                    data-testid="challenge-waiting-countdown"
                    className="text-2xl font-extrabold tabular-nums leading-none"
                    style={{ color: info.fg, fontFamily: '"JetBrains Mono", "Fira Code", monospace' }}
                  >
                    {formatCountdown(waitingSecondsLeft)}
                  </b>
                </div>
              )}
            </div>

            {myReady ? (
              <p
                className="mt-6 flex w-full items-center justify-center gap-1.5 rounded-2xl py-3.5 text-sm font-bold"
                style={{ backgroundColor: 'rgba(34, 197, 94, 0.10)', color: '#15803d' }}
              >
                <Check size={16} /> You&apos;re ready — waiting for your opponent to click ready…
              </p>
            ) : (
              <button
                data-testid="challenge-ready"
                onClick={handleReady}
                disabled={readyPending}
                className="group mt-6 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-extrabold text-white transition-all duration-150 hover:-translate-y-0.5 hover:scale-[1.01] hover:brightness-110 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:scale-100"
                style={{ background: 'linear-gradient(135deg, #4361EE, #8B5CF6)', boxShadow: '0 18px 38px -14px rgba(67, 97, 238, 0.7)' }}
              >
                {readyPending ? <Loader2 size={19} className="animate-spin" /> : <Zap size={19} />} I&apos;m Ready
                {!readyPending && <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />}
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <ChallengeInfoCard challenge={challenge} />

          {isCreator && (
            <div className="rounded-2xl border p-5" style={{ borderColor: 'rgba(99, 102, 241, 0.18)', backgroundColor: 'var(--color-card)' }}>
              <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.18em]" style={{ color: 'var(--color-text-muted)' }}>
                <Share2 size={13} /> Invite your friend
              </p>

              <div
                className="mt-4 flex items-center justify-between gap-3 rounded-xl border px-4 py-3"
                style={{ borderColor: 'rgba(99, 102, 241, 0.20)', background: 'linear-gradient(135deg, rgba(67, 97, 238, 0.06), rgba(124, 58, 237, 0.06))' }}
              >
                <div className="min-w-0">
                  <p className="text-[0.625rem] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Challenge Code</p>
                  <p
                    className="truncate text-2xl font-extrabold tracking-[0.08em]"
                    style={{ color: 'var(--color-accent-text)', fontFamily: '"JetBrains Mono", "Fira Code", monospace' }}
                  >
                    {code}
                  </p>
                </div>
                <button
                  onClick={() => void copy('code')}
                  data-testid="copy-code"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-all duration-150 hover:-translate-y-0.5 hover:brightness-110"
                  style={{ background: 'linear-gradient(135deg, #4361ee, #7c3aed)', color: '#fff', boxShadow: '0 6px 16px -6px rgba(67, 97, 238, 0.55)' }}
                >
                  {copied === 'code' ? <Check size={13} /> : <Copy size={13} />} {copied === 'code' ? 'Copied!' : 'Copy'}
                </button>
              </div>

              <div className="mt-3 flex items-center gap-2 truncate rounded-xl border border-[rgba(99,102,241,0.20)] bg-[rgba(251,250,254,0.6)] px-3.5 py-2.5 dark:border-[rgba(124,140,248,0.24)] dark:bg-white/5">
                <Globe size={14} className="shrink-0" style={{ color: 'var(--color-text-muted)' }} />
                <span className="truncate font-mono text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{shortLink}</span>
              </div>
              <button
                onClick={() => void copy('link')}
                data-testid="copy-link"
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-all duration-150 hover:-translate-y-0.5 hover:brightness-110"
                style={{ background: 'linear-gradient(135deg, #4361ee, #7c3aed)', color: '#fff', boxShadow: '0 6px 16px -6px rgba(67, 97, 238, 0.55)' }}
              >
                {copied === 'link' ? <Check size={13} /> : <Copy size={13} />} {copied === 'link' ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center justify-between gap-3 sm:flex-row">
        <p className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          <Clock size={13} /> ◷ {hasOpponent
            ? 'Room expires 30 minutes after your opponent joined'
            : `Room expires in ${formatCountdown(waitingSecondsLeft)} if no one joins`}
        </p>
        <button
          onClick={onExit}
          data-testid="challenge-exit"
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors hover:brightness-110"
          style={{ color: 'var(--color-error)', backgroundColor: 'rgba(239, 68, 68, 0.06)' }}
        >
          <LogOut size={13} /> Leave Challenge
        </button>
      </div>

      <div className="mt-8 hidden select-none items-end justify-between gap-6 xl:flex" aria-hidden>
        <span className="flex flex-col items-center gap-1">
          <span className="text-xs italic" style={{ color: 'var(--color-text-muted)' }}>Same text. Same rules. Real competition.</span>
          <svg width="130" height="8" viewBox="0 0 130 8" fill="none">
            <path d="M2 5.5 C 22 1.5, 44 7.5, 70 4.5 S 110 2, 128 4.5" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
        <span className="flex flex-col items-center gap-1">
          <span className="text-xs italic" style={{ color: 'var(--color-text-muted)' }}>
            Type Better Every Day <span style={{ color: 'var(--color-accent-text)' }}>♥</span>
          </span>
          <svg width="110" height="8" viewBox="0 0 110 8" fill="none">
            <path d="M2 4.5 C 20 1.5, 40 7.5, 62 4.5 S 92 2, 108 4" stroke="var(--color-accent-text)" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
      </div>
    </div>
  );
}

function ChallengeInfoCard({ challenge }: { challenge: ChallengePublic }) {
  const rows: { key: string; icon: LucideIcon; label: string; value: string }[] = [
    { key: 'duration', icon: Timer, label: 'Duration', value: durationLabel(challenge.durationSeconds) },
    { key: 'mode', icon: Swords, label: 'Mode', value: '1v1 Real-time' },
    { key: 'goal', icon: Trophy, label: 'Goal', value: 'Higher WPM & Accuracy' },
  ];

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-[rgba(99,102,241,0.18)] bg-[rgba(251,250,254,0.65)] p-5 dark:border-[rgba(124,140,248,0.24)] dark:bg-white/5"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -top-14 -right-12 h-40 w-40 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(124, 58, 237, 0.10) 0%, transparent 70%)' }}
      />
      <span aria-hidden className="absolute right-4 top-3" style={{ color: 'rgba(67, 97, 238, 0.16)' }}><Trophy size={16} /></span>

      <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.18em]" style={{ color: 'var(--color-text-muted)' }}>
        <Trophy size={14} style={{ color: 'var(--color-accent-text)' }} /> Challenge Info
      </p>

      <div className="mt-4 flex flex-col">
        {rows.map((row, i) => (
          <div key={row.key} className={i > 0 ? 'mt-4 border-t pt-4' : ''} style={i > 0 ? { borderColor: 'rgba(99, 102, 241, 0.12)' } : undefined}>
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full" style={{ backgroundColor: 'rgba(99, 102, 241, 0.10)', color: 'var(--color-accent-text)' }}>
                <row.icon size={16} />
              </span>
              <span className="flex-1 text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>{row.label}</span>
              <span className="text-sm font-extrabold" style={{ color: 'var(--color-text-primary)' }}>{row.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/***** DUEL *****/

/* The pre-start countdown for a race that is ALREADY scheduled server-side — a
   rematch skips the "Ready to Battle?" lobby, so this is the only pre-race
   view either player sees. DuelArea is deliberately NOT mounted here: it only
   locks input at the END of a race, so mounting it during the lead time would
   let a player type before the shared startAt. The room flips to 'typing' the
   moment startAt is reached, which mounts DuelArea for real. */
function RaceCountdown({ round, secondsLeft, opponentName }: {
  round: number;
  secondsLeft: number;
  opponentName: string;
}) {
  return (
    <div className="mx-auto w-full max-w-[46rem]" data-testid="challenge-countdown">
      <div className="card p-8 sm:p-10 flex flex-col items-center text-center">
        <span
          className="grid w-12 h-12 place-items-center rounded-2xl text-white"
          style={{ background: 'linear-gradient(135deg, #4361EE, #8B5CF6)', boxShadow: '0 10px 24px -12px rgba(99, 102, 241, 0.6)' }}
        >
          <Swords size={22} />
        </span>
        <p className="mt-3 text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Get Ready</p>
        <div
          className="mt-1 text-6xl sm:text-7xl font-extrabold tabular-nums"
          style={{ color: 'var(--color-accent-text)', fontFamily: '"JetBrains Mono", "Fira Code", monospace' }}
        >
          {secondsLeft > 0 ? secondsLeft : 'GO!'}
        </div>
        <p className="mt-2 text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
          Round {round} vs {opponentName}
        </p>
        <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          No ready-up needed — the race starts as soon as the countdown ends.
        </p>
      </div>
    </div>
  );
}

function DuelArea({ round, text, duration, startAtMs, opponentName, opponentProgress, opponentLeft, opponentDisconnected, frozen, onProgress, onTextDone, onExit }: {
  round: number;
  text: string;
  duration: number;
  startAtMs: number;
  opponentName: string;
  opponentProgress: OpponentProgress | null;
  opponentLeft: boolean;
  opponentDisconnected: boolean;
  /** The race was voided (opponent left): freeze the clock, kill every timer,
      block input and never submit. The board is kept on screen, motionless,
      under the opponent-left popup. */
  frozen?: boolean;
  onProgress: (p: { correct: number; attempted: number; errors: number; typedChars: number; wpm: number; accuracy: number; progress: number; status: LiveProgressStatus }) => void;
  onTextDone: (typedWords: TypedWord[]) => void;
  onExit: () => void;
}) {
  const endAtMs = startAtMs + duration * 1000;
  const [now, setNow] = useState(() => Date.now());
  const doneRef = useRef(false);
  const textDoneRef = useRef(false);
  const [textDone, setTextDone] = useState(false);
  const engineRef = useRef<ReturnType<typeof useTypingEngine> | null>(null);
  // The realtime publish callback is recreated on every ChallengeRoom render
  // (the room re-renders ~5x/second from its clock tick). If the publish
  // interval listed it as a dependency it would be torn down and rebuilt
  // faster than its own delay and almost never fire — the opponent would only
  // ever see a single stale snapshot. Keeping it behind a ref lets the
  // interval live for the whole race and always read the latest callback.
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;
  const finalSentRef = useRef(false);
  // Exactly one terminal "finished" broadcast per race (guarded so the submit
  // path and the publish interval can never send two).
  const publishFinal = useCallback((current: LiveEngine) => {
    if (finalSentRef.current) return;
    finalSentRef.current = true;
    onProgressRef.current?.({ ...buildLiveProgress(current), status: 'finished' });
  }, []);

  const engine = useTypingEngine({
    text,
    // +120s gives a hard ceiling far past any challenge duration; the RACE is
    // decided by the authoritative endAtMs (below), never by this ceiling.
    durationSeconds: duration + 120,
    // Exhausting the text does NOT submit: the timer is the judge. The phase
    // effect below simply records "done" and keeps the clock visible.
    // Input is gated by the phase machine, not by a clock compare here: every
    // path into `typing` now requires startAt to have passed, and `countdown`
    // does not mount DuelArea at all. A client-clock compare against startAt
    // would instead lock a player out of their own race whenever their clock
    // runs behind the server's.
    locked: frozen || now >= endAtMs,
    onComplete: () => { /* text done: keep racing the clock */ },
  });
  engineRef.current = engine;

  const syncRemaining = Math.max(0, Math.ceil((endAtMs - now) / 1000));
  const myProgress = engine.wordStates.length ? Math.min(100, Math.round((engine.currentWordIndex / engine.wordStates.length) * 100)) : 0;

  const finishNow = useCallback(() => {
    if (frozen) return;
    if (doneRef.current) return;
    const current = engineRef.current;
    if (!current) return;
    doneRef.current = true;
    // Push the exact final snapshot to the opponent as "finished" so their UI
    // flips to ✓ Finished immediately (their own timer still races).
    publishFinal(current);
    const typedWords = snapshotTypedWords(current.wordStates, current.currentWordIndex);
    onTextDone(typedWords);
  }, [onTextDone, publishFinal, frozen]);

  // The clock is the race. Once the race is voided it stops dead: no interval,
  // so the displayed time stays frozen exactly where the opponent left.
  useEffect(() => {
    if (frozen) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [frozen]);

  // Text exhaustion is graceful: mark it done (banner + locked input) but keep
  // the timer running. Only the authoritative endAtMs may submit results.
  useEffect(() => {
    if (textDoneRef.current) return;
    if (engine.phase === 'finished') {
      textDoneRef.current = true;
      setTextDone(true);
    }
  }, [engine.phase]);

  useEffect(() => {
    if (frozen) return;
    if (doneRef.current) return;
    if (now >= endAtMs) {
      finishNow();
    }
  }, [now, endAtMs, finishNow, frozen]);

  useEffect(() => {
    // Created ONCE for the whole race. The running-state check happens inside
    // each tick against the live engine so a changing engine.phase or a fresh
    // onProgress identity can never reset this interval.
    // Throttled realtime publish (~5x/second): socket-only fan-out, no DB
    // writes per keystroke, so the opponent's WPM/accuracy/progress stays live
    // and smooth without hammering the database.
    if (frozen) return;
    const id = window.setInterval(() => {
      const current = engineRef.current;
      if (!current) return;
      // Once the player has finished typing OR submitted (doneRef), their
      // numbers are final: publish a single "finished" snapshot so the
      // opponent renders ✓ Finished instead of a frozen "typing" state.
      if (doneRef.current || current.phase === 'finished') {
        publishFinal(current);
        return;
      }
      onProgressRef.current?.({ ...buildLiveProgress(current), status: 'typing' });
    }, 200);
    return () => window.clearInterval(id);
  }, [publishFinal, frozen]);

  useEffect(() => {
    // Publish the terminal "finished" snapshot at the exact commit where the
    // engine reports completion — NOT from the interval alone. The opponent
    // view is replaced the instant the engine flips out of "running", which
    // clears the publish interval before its next tick, so the finished
    // snapshot must go out here (idempotent via finalSentRef).
    if (frozen) return;
    if (engine.phase === 'finished' && engineRef.current) {
      publishFinal(engineRef.current);
    }
  }, [engine.phase, publishFinal, frozen]);

  const active = engine.wordStates[engine.currentWordIndex];
  const nextChar = active?.chars.find((c) => c.status === 'current' || c.status === 'pending');
  const currentKey = active && active.typed.length >= active.word.length ? ' ' : nextChar?.char;
  const lastChar = active?.chars[active.typed.length - 1];
  const errorKey = (lastChar?.status === 'error' || lastChar?.status === 'extra') ? active?.typed[active.typed.length - 1] : undefined;

  const liveErrors = liveErrorsFrom(engine.wordStates);
  const liveCorrectChars = liveCorrectCharsFrom(engine.wordStates);
  const timeCritical = syncRemaining <= 10 && engine.phase === 'running';

  const oppStatus = opponentProgress?.status;
  const oppIdle = !opponentProgress;
  const oppFinished = !oppIdle && oppStatus === 'finished';
  const oppTyping = !oppIdle && !oppFinished && oppStatus !== 'disconnected';

  return (
    <div className="w-full">
      {/* header */}
      <div className="challenge-fade-in flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl" style={{ background: 'linear-gradient(135deg, #4361ee, #7c3aed)', boxShadow: '0 12px 22px -10px rgba(67, 97, 238, 0.5)' }}>
            <Swords size={20} color="#fff" />
          </span>
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>Typing Challenge</h1>
            {opponentLeft ? (
              <p className="mt-0.5 text-sm font-semibold" style={{ color: 'var(--color-error)' }}>
                Your opponent has left the challenge.
              </p>
            ) : opponentDisconnected ? (
              <p className="mt-0.5 text-sm font-semibold" style={{ color: 'var(--status-warning)' }}>
                Your opponent lost connection — waiting for them to reconnect…
              </p>
            ) : (
              <p className="mt-0.5 text-sm normal-case" style={{ color: 'var(--color-text-secondary)' }}>
                Race against <b style={{ color: 'var(--status-purple)' }}>{opponentName}</b> — type fast, type clean.
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold"
            style={{ backgroundColor: 'var(--status-purple-bg)', color: 'var(--status-purple)' }}
          >
            <Swords size={13} /> Round {round}
          </span>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-extrabold tabular-nums"
            style={{
              backgroundColor: timeCritical ? 'rgba(239, 68, 68, 0.14)' : 'rgba(67, 97, 238, 0.10)',
              color: timeCritical ? 'var(--color-error)' : 'var(--color-accent-text)',
              fontFamily: '"JetBrains Mono", "Fira Code", monospace',
            }}
          >
            <Clock size={15} /> {formatClock(syncRemaining)}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold" style={{ backgroundColor: 'rgba(34, 197, 94, 0.12)', color: '#16a34a' }}>
            <Target size={13} /> {liveCorrectChars} chars
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold" style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', color: 'var(--color-error)' }}>
            ✗ {liveErrors} {liveErrors === 1 ? 'error' : 'errors'}
          </span>
        </div>
      </div>

      <div className="mt-6 flex flex-col lg:flex-row gap-5 w-full items-stretch">
        <div className="flex-1 min-w-0 w-full">
          <div className="card p-4 sm:p-6 lg:p-7 w-full duel-typing-card" data-testid="typing-card" style={{ borderRadius: '1.5rem', borderColor: 'rgba(99, 102, 241, 0.16)', boxShadow: '0 24px 60px -28px rgba(67, 97, 238, 0.28)' }}>
            <div className="tt-text-shell relative duel-text-shell">
              <TypingDisplay
                wordStates={engine.wordStates}
                currentWordIndex={engine.currentWordIndex}
                fontSize={22}
              />
            </div>

            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <DuelStat icon={Gauge} label="WPM" value={String(engine.liveWpm)} tone="#60A5FA" />
              <DuelStat icon={Target} label="Accuracy" value={`${engine.liveAccuracy}%`} tone="#16a34a" />
              <DuelStat icon={Timer} label="Time Left" value={formatClock(syncRemaining)} tone={timeCritical ? 'var(--color-error)' : '#4361ee'} prominent />
              <DuelStat icon={TrendingUp} label="Progress" value={`${myProgress}%`} tone="#8b5cf6" />
            </div>
            <div className="mt-2.5">
              <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border)' }}>
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${myProgress}%`, background: 'linear-gradient(90deg, #4361ee, #8b5cf6)' }} />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold flex items-center gap-2" style={{ color: textDone ? '#16a34a' : 'var(--color-accent-text)' }}>
                {textDone ? (
                  <>
                    <CheckCircle2 size={15} /> Text complete — the clock keeps running. Your pace is locked in!
                  </>
                ) : timeCritical ? (
                  'Almost done — finish strong!'
                ) : (
                  'The clock is ticking.'
                )}
              </p>
              <button onClick={onExit} data-testid="challenge-abandon" className="text-xs font-bold flex items-center gap-1 transition-colors hover:brightness-110" style={{ color: 'var(--color-error)' }}>
                <LogOut size={13} /> Leave
              </button>
            </div>

            <VirtualKeyboard currentKey={currentKey} errorKey={errorKey} variant="premium" />
          </div>
        </div>

        <aside className="w-full lg:w-[19.5rem] shrink-0 flex flex-col gap-4">
          <div className="card px-4 py-3 flex items-center justify-center gap-2.5" data-testid="challenge-vs-chip" style={{ borderRadius: '1rem', borderColor: 'rgba(99, 102, 241, 0.18)', boxShadow: '0 12px 30px -18px rgba(67, 97, 238, 0.35)' }}>
            <span className="text-xs font-extrabold uppercase tracking-wider" style={{ color: 'var(--color-accent-text)' }}>You</span>
            <span className="challenge-vs-pulse grid h-7 w-7 place-items-center rounded-full text-[0.6rem] font-extrabold text-white">VS</span>
            <span className="max-w-[7rem] truncate text-xs font-extrabold uppercase tracking-wider" style={{ color: '#7c3aed' }}>{opponentName}</span>
          </div>

          <div className="card p-4" data-testid="challenge-opponent-card">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Opponent</p>
              <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[0.625rem] font-extrabold uppercase tracking-wider" style={{ backgroundColor: oppIdle ? 'rgba(148, 163, 184, 0.14)' : oppFinished ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.10)', color: oppIdle ? 'var(--color-text-muted)' : oppFinished ? '#16a34a' : '#dc2626' }}>
                <span className="relative flex h-1.5 w-1.5">
                  <span className={oppIdle || oppFinished ? 'relative inline-flex h-1.5 w-1.5 rounded-full' : 'live-dot absolute inline-flex h-full w-full rounded-full'} style={{ backgroundColor: oppIdle ? 'currentColor' : oppFinished ? '#16a34a' : '#dc2626' }} />
                  {!oppIdle && !oppFinished && <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ backgroundColor: '#dc2626' }} />}
                </span>
                {oppIdle ? 'Idle' : oppFinished ? 'Finished' : 'Live'}
              </span>
            </div>
            <div className="flex items-center gap-2.5 mb-3">
              <span className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: oppFinished ? 'linear-gradient(135deg, #16a34a, #22c55e)' : 'linear-gradient(135deg, #8b5cf6, #d946ef)', boxShadow: oppFinished ? '0 8px 16px -6px rgba(34, 197, 94, 0.45)' : '0 8px 16px -6px rgba(139, 92, 246, 0.5)' }}>
                {opponentName.slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>{opponentName}</p>
                <p className="text-xs" style={{ color: oppIdle ? 'var(--color-text-muted)' : oppFinished ? '#16a34a' : 'var(--color-accent-text)' }}>
                  {oppIdle ? (
                    'Waiting…'
                  ) : oppFinished ? (
                    <><CheckCircle2 size={13} className="inline -mt-0.5 mr-1" /> Finished</>
                  ) : (
                    <>
                      <span className="inline-flex items-center gap-1"><span className="relative flex h-1.5 w-1.5"><span className="live-dot absolute inline-flex h-full w-full rounded-full" style={{ backgroundColor: '#dc2626' }} /><span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ backgroundColor: '#dc2626' }} /></span> Typing…</span>
                      {opponentProgress!.errors > 0 && (
                        <span className="font-semibold" style={{ color: 'var(--color-error)' }}>
                          {' · '}{opponentProgress!.errors} error{opponentProgress!.errors === 1 ? '' : 's'}
                        </span>
                      )}
                    </>
                  )}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl p-2.5" style={{ backgroundColor: 'rgba(96, 165, 250, 0.10)' }}>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>WPM</p>
                <p className="text-xl font-extrabold tabular-nums" style={{ color: '#60A5FA', fontFamily: '"JetBrains Mono", "Fira Code", monospace' }}>{opponentProgress?.wpm ?? 0}</p>
              </div>
              <div className="rounded-xl p-2.5" style={{ backgroundColor: 'rgba(244, 114, 182, 0.10)' }}>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Accuracy</p>
                <p className="text-xl font-extrabold tabular-nums" style={{ color: '#F472B6', fontFamily: '"JetBrains Mono", "Fira Code", monospace' }}>{opponentProgress?.accuracy ?? 0}%</p>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between text-[0.6875rem] font-semibold" style={{ color: 'var(--color-text-muted)' }}>
              <span>{opponentProgress?.typedChars ?? 0} chars</span>
              <span>{opponentProgress?.correct ?? 0} correct</span>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span style={{ color: 'var(--color-text-muted)' }}>Progress</span>
                <span className="font-bold tabular-nums" style={{ color: 'var(--color-accent-text)' }}>{opponentProgress?.progress ?? 0}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${opponentProgress?.progress ?? 0}%`, background: 'linear-gradient(90deg, #8b5cf6, #d946ef)' }}
                />
              </div>
            </div>
          </div>

          <div className="card p-4">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--color-text-muted)' }}>
              Your stats
            </p>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--color-text-muted)' }}><Gauge size={13} /> WPM</span>
              <b className="text-lg tabular-nums" style={{ color: 'var(--color-accent-text)' }}>{engine.liveWpm}</b>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--color-text-muted)' }}><Target size={13} /> Accuracy</span>
              <b className="text-lg tabular-nums" style={{ color: 'var(--color-correct)' }}>{engine.liveAccuracy}%</b>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--color-text-muted)' }}><Zap size={13} /> Words</span>
              <b className="text-lg tabular-nums" style={{ color: 'var(--color-text-primary)' }}>{engine.wordStates.filter((w) => w.status === 'correct').length}</b>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

/***** RESULTS *****/

/* ═══════════════════════ WAITING ═══════════════════════ */

function WaitingCard({ challenge, mySummary, opponentProgress, opponentDisconnected, opponentLeft, onExit }: {
  challenge: ChallengePublic;
  mySummary: MySummary | null;
  opponentProgress: OpponentProgress | null;
  opponentDisconnected: boolean;
  opponentLeft: boolean;
  onExit: () => void;
}) {
  const me = mePlayer(challenge);
  const opponent = opponentOf(challenge, challenge.me);
  const oppName = opponent?.username ?? opponentProgress?.username ?? 'Your opponent';

  // Authoritative stats: the in-memory summary is preferred, but the submitted
  // snapshot on the challenge always carries the truth (e.g. after a reconnect
  // re-reads the URL state and `mySummary` was reset). Never zeroed while
  // waiting.
  const wpm = mySummary?.wpm ?? me?.stats?.wpm ?? 0;
  const accuracy = mySummary?.accuracy ?? me?.stats?.accuracy ?? 0;
  const words = mySummary?.correctWords ?? me?.stats?.correctWords ?? 0;
  const errors = mySummary?.errorsCount ?? me?.stats?.errorsCount ?? 0;

  const liveWpm = opponentProgress?.wpm ?? 0;
  const liveAccuracy = opponentProgress?.accuracy ?? 0;
  const liveProgress = opponentProgress ? Math.max(0, Math.min(100, opponentProgress.progress)) : 0;
  const hasLive = Boolean(opponentProgress);
  const livePct = `${liveProgress}%`;

  const status = opponentLeft
    ? { dot: '#ef4444', chipBg: 'var(--status-danger-bg)', fg: 'var(--status-danger)', label: 'Opponent left', text: 'Your opponent has left the challenge — finishing up the race…' }
    : opponentDisconnected
      ? { dot: '#f59e0b', chipBg: 'var(--status-warning-bg)', fg: 'var(--status-warning)', label: 'Reconnecting…', text: 'Your opponent lost connection — waiting for them to return…' }
      : opponentProgress?.status === 'finished'
        ? { dot: '#22c55e', chipBg: 'var(--status-success-bg)', fg: 'var(--status-success)', label: 'Finished', text: `${oppName} has finished — the clock decides the rest.` }
        : { dot: '#22c55e', chipBg: 'var(--status-success-bg)', fg: 'var(--status-success)', label: 'Still typing', text: hasLive ? `${oppName} is mid-race — live stats below.` : `${oppName} will appear below as they type.` };

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="card relative overflow-hidden p-5 text-center sm:p-8" data-testid="challenge-waiting">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-20 -left-20 h-56 w-56 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(245, 158, 11, 0.10) 0%, transparent 70%)', filter: 'blur(26px)' }}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -right-20 h-64 w-64 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(124, 58, 237, 0.14) 0%, transparent 70%)', filter: 'blur(28px)' }}
        />

        <div className="relative">
          {/* ── hero ── */}
          <div className="wr-fade-up">
            <span
              className="wr-hourglass wr-halo inline-grid h-16 w-16 place-items-center rounded-2xl text-4xl"
              style={{ backgroundColor: 'rgba(99, 102, 241, 0.10)', border: '1px solid rgba(99, 102, 241, 0.18)' }}
              aria-hidden="true"
            >
              ⌛
            </span>
            <h2 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: 'var(--color-text-primary)' }}>
              You&apos;re done!
            </h2>
            <p className="mt-1 text-base font-extrabold" style={{ color: 'var(--color-accent-text)' }}>Nice typing!</p>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Your result is locked in — your opponent is still racing…
            </p>
            <p className="mt-2.5 flex items-center justify-center gap-1.5 text-xs font-bold" style={{ color: 'var(--color-text-muted)' }}>
              Waiting for {oppName}
              <span className="wr-dots" aria-hidden="true">
                <span /><span /><span />
              </span>
            </p>
          </div>

          {/* ── my result / opponent live ── */}
          <div className="wr-fade-up mt-6 grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2" style={{ animationDelay: '80ms' }}>
            {/* YOUR RESULT */}
            <div
              className="flex flex-col rounded-2xl border p-5 text-left"
              style={{ borderColor: 'rgba(67, 97, 238, 0.22)', backgroundColor: 'rgba(67, 97, 238, 0.05)' }}
            >
              <div className="mb-4 flex items-center justify-between">
                <p className="text-[0.65rem] font-extrabold uppercase tracking-[0.18em]" style={{ color: 'var(--color-text-muted)' }}>
                  Your Result
                </p>
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.6rem] font-extrabold uppercase tracking-wider" style={{ backgroundColor: 'rgba(34, 197, 94, 0.12)', color: '#15803d' }}>
                  <CheckCircle2 size={11} /> Completed
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <ResultMetric value={String(wpm)} label="WPM" color="#60A5FA" />
                <ResultMetric value={`${accuracy}%`} label="Accuracy" color="#F472B6" />
                <ResultMetric value={String(words)} label="Words" color="#4ADE80" />
                <ResultMetric value={String(errors)} label="Errors" color="#F87171" />
              </div>
              <p className="mt-auto pt-3 text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                Here&apos;s how you finished. Your opponent&apos;s score will settle the winner.
              </p>
            </div>

            {/* OPPONENT LIVE */}
            <div
              className="flex flex-col rounded-2xl border p-5 text-left"
              style={{ borderColor: 'rgba(139, 92, 246, 0.22)', backgroundColor: 'rgba(139, 92, 246, 0.05)' }}
            >
              <div className="mb-4 flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full text-xs font-extrabold text-white"
                    style={{ background: 'linear-gradient(135deg, #8b5cf6, #d946ef)' }}
                  >
                    {(oppName.trim().slice(0, 1) || '?').toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold truncate" style={{ color: 'var(--color-text-primary)' }}>{oppName}</p>
                    <p className="text-[0.6rem] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Opponent</p>
                  </div>
                </div>
                <span className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.6rem] font-extrabold uppercase tracking-wider" style={{ backgroundColor: status.chipBg, color: status.fg }}>
                  <span className="wr-pulse-dot h-2 w-2 rounded-full" style={{ backgroundColor: status.dot }} />
                  {status.label}
                </span>
              </div>

              {opponentLeft ? (
                <div
                  className="flex flex-1 items-center justify-center rounded-xl border px-3 py-4 text-center"
                  style={{ borderColor: 'rgba(239, 68, 68, 0.18)', backgroundColor: 'rgba(239, 68, 68, 0.04)' }}
                >
                  <p className="text-xs font-semibold" style={{ color: status.fg }}>{status.text}</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2.5">
                    <DuelStat icon={Gauge} label="Opponent WPM" value={hasLive ? String(liveWpm) : '—'} tone="#60A5FA" />
                    <DuelStat icon={Target} label="Opponent Accuracy" value={hasLive ? `${liveAccuracy}%` : '—'} tone="#F472B6" />
                  </div>

                  <div className="mt-3">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-[0.6rem] font-extrabold uppercase tracking-wider" style={{ color: hasLive ? '#4361ee' : 'var(--color-text-muted)' }}>
                        <TrendingUp size={11} /> Progress
                      </span>
                      <span className="text-xs font-extrabold tabular-nums" style={{ color: '#4361ee', fontFamily: '"JetBrains Mono", "Fira Code", monospace' }}>
                        {hasLive ? livePct : '0%'}
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full" style={{ backgroundColor: 'rgba(139, 92, 246, 0.12)' }}>
                      <div
                        className="wr-progress-fill h-full rounded-full"
                        style={{
                          width: hasLive ? livePct : '0%',
                          background: 'linear-gradient(90deg, #4361ee, #7c3aed)',
                          boxShadow: '0 0 10px rgba(99, 102, 241, 0.45)',
                        }}
                      />
                    </div>
                  </div>

                  <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold" style={{ color: status.fg }}>
                    <Keyboard size={13} />
                    {hasLive ? 'Still typing…' : 'Live stats appear as your opponent types.'}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* ── competition-feel note ── */}
          <div
            className="wr-fade-up mt-6 rounded-2xl px-5 py-3.5"
            style={{ background: 'linear-gradient(135deg, rgba(67, 97, 238, 0.08), rgba(124, 58, 237, 0.11))', border: '1px solid rgba(99, 102, 241, 0.16)' }}
          >
            <p className="text-sm font-extrabold" style={{ color: 'var(--color-accent-text)' }}>
              Your race is complete. The final result is almost ready.
            </p>
            <p className="mt-1 text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
              Can your opponent beat it?
            </p>
          </div>

          {/* ── exit ── */}
          <div className="wr-fade-up mt-6 flex justify-center" style={{ animationDelay: '120ms' }}>
            <button
              onClick={onExit}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-8 py-3 text-sm font-bold transition-all duration-150"
              style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', backgroundColor: 'transparent' }}
            >
              <LogOut size={16} /> Exit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════ RESULTS ═══════════════════════ */

function ResultStat({ value, label, color, tint, delay }: {
  value: string;
  label: string;
  color: string;
  tint: string;
  delay: string;
}) {
  return (
    <div
      className="rr-stat rounded-xl px-2 py-1.5 text-center"
      style={{ backgroundColor: tint, animationDelay: delay }}
    >
      <b
        className="block text-base font-extrabold tabular-nums leading-none sm:text-[1.05rem]"
        style={{ color, fontFamily: '"JetBrains Mono", "Fira Code", monospace' }}
      >
        {value}
      </b>
      <span className="mt-1 block text-[0.5rem] font-extrabold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </span>
    </div>
  );
}

function ResultMetric({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div
      className="rounded-lg border px-2 py-2 text-center"
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'rgba(124, 58, 237, 0.05)' }}
    >
      <p className="text-base sm:text-lg font-extrabold tabular-nums leading-none" style={{ color, fontFamily: '"JetBrains Mono", "Fira Code", monospace' }}>
        {value}
      </p>
      <p className="mt-1 text-[0.55rem] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
      </p>
    </div>
  );
}

function ResultDetailChip({ icon: Icon, label, value, accent }: {
  icon: LucideIcon;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <Icon size={13} style={{ color: 'var(--color-accent-text)' }} />
      <span className="font-bold" style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
      <span className="font-extrabold" style={{ color: accent ? 'var(--color-accent-text)' : 'var(--color-text-primary)' }}>{value}</span>
    </span>
  );
}

function VSBadge() {
  return (
    <div
      className="rr-vs mx-auto grid w-9 h-9 sm:w-10 sm:h-10 shrink-0 place-items-center rounded-full"
      style={{ background: 'linear-gradient(135deg, #4361ee, #7c3aed)', color: '#fff', boxShadow: '0 10px 24px -10px rgba(99, 102, 241, 0.6)' }}
      aria-hidden="true"
    >
      <span className="text-[0.6rem] font-extrabold tracking-wide">VS</span>
    </div>
  );
}

type ResultMood = 'happy' | 'sad' | 'calm';

/* Lightweight inline-SVG cartoon. No image assets and no animation library:
   the three moods share one body and differ only in the face + arms, so the
   winner/loser/tie treatments stay visually consistent. Wrapped in a
   size-locked box (.rr-char) so swapping moods never shifts layout. */
function ResultCharacter({ mood, uid }: { mood: ResultMood; uid: string }) {
  const grad = `rr-body-${uid}`;
  const happy = mood === 'happy';
  const sad = mood === 'sad';

  return (
    <span className="rr-char" aria-hidden="true">
      {happy && (
        <span className="rr-crown">
          <svg viewBox="0 0 24 24">
            <path d="M3 8.5l4.2 3L12 4.5l4.8 7L21 8.5 18.8 19H5.2z" fill="#FBBF24" stroke="#D97706" strokeWidth="1.5" strokeLinejoin="round" />
            <circle cx="12" cy="3.4" r="1.7" fill="#FDE68A" />
            <circle cx="3.4" cy="7.4" r="1.5" fill="#FDE68A" />
            <circle cx="20.6" cy="7.4" r="1.5" fill="#FDE68A" />
          </svg>
        </span>
      )}

      <svg viewBox="0 0 64 64">
        <defs>
          <linearGradient id={grad} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4361EE" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>

        {/* arms — raised and cheering when happy, one raised to wipe a tear
            when sad, relaxed at the sides when tied */}
        {happy ? (
          <g stroke="#4361EE" strokeWidth="4.6" strokeLinecap="round" fill="none">
            <path d="M19 52 L9 39" />
            <path d="M45 52 L55 39" />
          </g>
        ) : sad ? (
          <g stroke="#8B5CF6" strokeWidth="4.6" strokeLinecap="round" fill="none">
            <path d="M19 52 L13 44" />
            <path d="M45 52 L52 37" />
          </g>
        ) : (
          <g stroke="#7C6BF0" strokeWidth="4.6" strokeLinecap="round" fill="none">
            <path d="M19 52 L14 44" />
            <path d="M45 52 L50 44" />
          </g>
        )}
        <circle cx="9" cy="38" r="3.4" fill="#FFD9BC" stroke="#F0B98A" strokeWidth="1.2" />
        <circle cx={sad ? '52' : '55'} cy={sad ? '36' : '43'} r="3.4" fill="#FFD9BC" stroke="#F0B98A" strokeWidth="1.2" />

        {/* body */}
        <path d="M15 64c0-11.5 7.6-19 17-19s17 7.5 17 19z" fill={`url(#${grad})`} />

        {/* head */}
        <circle cx="18" cy="27" r="3.6" fill="#FFD9BC" stroke="#F0B98A" strokeWidth="1.2" />
        <circle cx="46" cy="27" r="3.6" fill="#FFD9BC" stroke="#F0B98A" strokeWidth="1.2" />
        <circle cx="32" cy="26" r="14.5" fill="#FFE3C8" stroke="#F0B98A" strokeWidth="1.4" />
        <path d="M19.5 19.5q12.5-8 25 0-4-7-12.5-7t-12.5 7z" fill="#3B2F57" />

        {happy ? (
          <>
            <path d="M23.5 25.5q2.8-3.4 5.6 0" fill="none" stroke="#3B2F2F" strokeWidth="1.9" strokeLinecap="round" />
            <path d="M34.9 25.5q2.8-3.4 5.6 0" fill="none" stroke="#3B2F2F" strokeWidth="1.9" strokeLinecap="round" />
            <path d="M25.5 30.5q6.5 7 13 0" fill="none" stroke="#3B2F2F" strokeWidth="1.9" strokeLinecap="round" />
            <circle cx="22.5" cy="29.5" r="2.6" fill="#FF9AA2" opacity="0.55" />
            <circle cx="41.5" cy="29.5" r="2.6" fill="#FF9AA2" opacity="0.55" />
          </>
        ) : sad ? (
          <>
            <path d="M22.5 24.5q3 1.6 5.8-0.6" fill="none" stroke="#3B2F2F" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M35.7 23.9q2.8 2.2 5.8 0.6" fill="none" stroke="#3B2F2F" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M27 33.5q5-4.5 10 0" fill="none" stroke="#3B2F2F" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="22.5" cy="30" r="2.4" fill="#FF9AA2" opacity="0.4" />
            <circle cx="41.5" cy="30" r="2.4" fill="#FF9AA2" opacity="0.4" />
            <circle className="rr-tear" cx="37.5" cy="30.5" r="2.3" fill="#67C7F5" />
          </>
        ) : (
          <>
            <circle cx="26.4" cy="25.8" r="1.9" fill="#3B2F2F" />
            <circle cx="37.6" cy="25.8" r="1.9" fill="#3B2F2F" />
            <path d="M27 31q5 4.5 10 0" fill="none" stroke="#3B2F2F" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="22.5" cy="29.5" r="2.5" fill="#FF9AA2" opacity="0.45" />
            <circle cx="41.5" cy="29.5" r="2.5" fill="#FF9AA2" opacity="0.45" />
          </>
        )}
      </svg>
    </span>
  );
}

type PlayerResultBadge = 'WINNER' | 'DEFEATED' | 'DRAW';

function youResultWord(result: PlayerResultBadge) {
  return result === 'WINNER' ? 'won' : result === 'DEFEATED' ? 'was defeated' : 'tied';
}

function ResultPlayerCard({ player, isMe, result, nameFallback, charId }: {
  player: ChallengePlayerView | null;
  isMe: boolean;
  result: PlayerResultBadge;
  nameFallback: string;
  charId: string;
}) {
  const username = player?.username ?? nameFallback;
  const initial = (username.trim().slice(0, 1) || '?').toUpperCase();
  const wpm = player?.stats?.wpm ?? 0;
  const acc = player?.stats?.accuracy ?? 0;
  const words = player?.stats?.correctWords ?? 0;
  const errors = player?.stats?.errorsCount ?? 0;
  const isWinner = result === 'WINNER';
  const isLoser = result === 'DEFEATED';
  const isTie = result === 'DRAW';

  // PERSONALIZATION (the core of this screen): the illustration, the outcome
  // badge, the crown, the confetti and the highlights belong to the VIEWER'S
  // OWN card only. The opponent's card is deliberately reduced to identity +
  // statistics so nobody sees the other person's personal celebration, and a
  // tie never shows a WINNER/DEFEATED badge at all.
  // `result` is viewer-relative: the parent derives it from `challenge.me`
  // (the authenticated user), never from card position or username.
  const isOwn = isMe;
  const showArt = isOwn;
  const showBadge = isOwn && !isTie;

  // Only the viewer's own card carries the outcome tint; the opponent's card
  // stays neutral so the emphasis always sits on "your" result.
  const mood: ResultMood = isWinner ? 'happy' : isLoser ? 'sad' : 'calm';

  const accent = isWinner ? '#059669' : isLoser ? '#E11D48' : '#7C3AED';
  const shell = isWinner
    ? { background: 'linear-gradient(150deg, #ECFDF5 0%, #F0FDFA 55%, #EFF6FF 100%)', border: '1px solid rgba(16, 185, 129, 0.32)' }
    : isLoser
      ? { background: 'linear-gradient(150deg, #FDF2F8 0%, #FAF5FF 60%, #FDF4FF 100%)', border: '1px solid rgba(244, 63, 94, 0.24)' }
      : { background: 'linear-gradient(150deg, #F8FAFF 0%, #F5F3FF 100%)', border: '1px solid rgba(124, 58, 237, 0.22)' };

  const badge =
    result === 'WINNER'
      ? { background: 'linear-gradient(135deg, #10B981, #059669)', color: '#fff', border: '1px solid rgba(255,255,255,0.35)', shadow: '0 6px 14px -6px rgba(5, 150, 105, 0.7)' }
      : result === 'DEFEATED'
        ? { background: 'linear-gradient(135deg, #FB7185, #E11D48)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', shadow: '0 6px 14px -6px rgba(225, 29, 72, 0.6)' }
        : { background: 'rgba(139, 92, 246, 0.14)', color: '#6D28D9', border: '1px solid rgba(139, 92, 246, 0.28)', shadow: 'none' };

  const badgeLabel = result === 'WINNER' ? 'Winner' : result === 'DEFEATED' ? 'Defeated' : 'Draw';

  // Winner → green/blue stat tones, defeated → pink tones, tie → violet.
  const tint = isWinner
    ? 'rgba(16, 185, 129, 0.10)'
    : isLoser
      ? 'rgba(244, 63, 94, 0.09)'
      : 'rgba(139, 92, 246, 0.08)';
  const statColor = (hex: { green: string; pink: string; violet: string }) =>
    isWinner ? hex.green : isLoser ? hex.pink : hex.violet;

  return (
    <div
      className={`rr-card relative flex flex-col overflow-hidden rounded-2xl ${isOwn ? '' : 'justify-center'} ${isOwn && isWinner ? 'rr-winner-glow-green' : ''}`}
      style={{ ...shell, boxShadow: isOwn && !isTie ? undefined : '0 10px 26px -20px rgba(30, 41, 59, 0.35)' }}
      data-testid={isMe ? 'challenge-result-me' : 'challenge-result-opponent'}
      data-result={result}
      data-own={isOwn ? 'true' : 'false'}
    >
      {isOwn && isWinner && <ResultsSideConfetti />}

      {/* header: avatar + identity + outcome badge (own card only) */}
      <div className="rr-card-head relative z-[3] flex items-center gap-2.5 px-3 pt-3 sm:px-4 sm:pt-3.5">
        <span
          className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full text-xs font-extrabold text-white sm:h-10 sm:w-10 sm:text-sm"
          style={{ background: isMe ? 'linear-gradient(135deg, #4361EE, #7C3AED)' : 'linear-gradient(135deg, #8B5CF6, #D946EF)', boxShadow: '0 6px 14px -8px rgba(79, 70, 229, 0.9)' }}
        >
          {initial}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.82rem] font-extrabold sm:text-[0.9rem]" style={{ color: 'var(--color-text-primary)' }}>{username}</p>
          <span
            className="mt-0.5 inline-flex items-center rounded-full px-1.5 py-px text-[0.52rem] font-extrabold uppercase tracking-wider"
            style={{
              backgroundColor: isMe ? 'var(--color-accent-light)' : 'rgba(139, 92, 246, 0.12)',
              color: isMe ? 'var(--color-accent-text)' : '#7C3AED',
            }}
          >
            {isMe ? 'You' : 'Opponent'}
          </span>
        </div>
        {showBadge && (
          <span className="rr-winner-badge flex flex-shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[0.55rem] font-extrabold uppercase tracking-wider" style={badge}>
            {result === 'WINNER' && <Trophy size={11} strokeWidth={2.6} />}
            {result === 'DEFEATED' && <Heart size={11} strokeWidth={2.6} />}
            {badgeLabel}
          </span>
        )}
      </div>

      {/* celebratory / consoling character — the viewer's own card only */}
      {showArt && (
        <div className="rr-char-wrap relative z-[3] mt-1.5">
          {isWinner && (
            <span
              className="rr-halo"
              style={{ background: 'radial-gradient(circle, rgba(52, 211, 153, 0.30) 0%, rgba(59, 130, 246, 0.16) 45%, transparent 70%)' }}
            />
          )}
          {isLoser && (
            <span
              className="rr-halo"
              style={{ background: 'radial-gradient(circle, rgba(244, 114, 182, 0.22) 0%, transparent 68%)', animationDelay: '-1.3s' }}
            />
          )}
          <span className={`relative ${isWinner ? 'rr-char-happy' : isLoser ? 'rr-char-sad' : ''}`}>
            <ResultCharacter mood={mood} uid={charId} />
          </span>
        </div>
      )}

      {/* compact 2x2 stats */}
      <div className="rr-stats relative z-[3] mt-1.5 grid grid-cols-2 gap-1.5 px-3 pb-3 sm:px-4 sm:pb-4">
        <ResultStat value={String(wpm)} label="WPM" color={statColor({ green: '#059669', pink: '#DB2777', violet: '#6D28D9' })} tint={tint} delay="120ms" />
        <ResultStat value={`${acc}%`} label="Accuracy" color={statColor({ green: '#0284C7', pink: '#C026D3', violet: '#7C3AED' })} tint={tint} delay="180ms" />
        <ResultStat value={String(words)} label="Typed Words" color={statColor({ green: '#16A34A', pink: '#E11D48', violet: '#8B5CF6' })} tint={tint} delay="240ms" />
        <ResultStat value={String(errors)} label="Errors" color={statColor({ green: '#0EA5E9', pink: '#F43F5E', violet: '#A855F7' })} tint={tint} delay="300ms" />
      </div>

      <span className="sr-only">{`${username}: ${youResultWord(result)}`}</span>
      {isOwn && <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1" style={{ background: accent, opacity: 0.55 }} aria-hidden="true" />}
    </div>
  );
}


function ResultsSideConfetti() {
  const colors = ['#4361ee', '#7c3aed', '#a78bfa', '#34d399', '#facc15', '#f472b6'];
  return (
    <div className="rr-confetti-side" aria-hidden="true">
      {Array.from({ length: 12 }, (_, i) => (
        <span
          key={i}
          style={{
            left: `${(i * 8.3 + 4) % 94}%`,
            width: `${4 + (i % 3) * 2}px`,
            height: `${8 + (i % 4) * 2}px`,
            backgroundColor: colors[i % colors.length],
            borderRadius: i % 2 === 0 ? '3px' : '50%',
            animationDelay: `${(i % 6) * 0.22}s`,
            animationDuration: `${2.1 + (i % 4) * 0.22}s`,
          }}
        />
      ))}
    </div>
  );
}

function OpponentLeaveToast({ title, body }: { title?: string; body?: string }) {
  return (
    <div
      className="challenge-overlay-in fixed inset-0 z-[999] grid place-items-center bg-[rgba(23,23,31,0.45)] px-4 backdrop-blur-[2px]"
      data-testid="challenge-opponent-left-toast"
    >
      <div
        className="challenge-toast-in relative w-full max-w-sm overflow-hidden rounded-[1.5rem] bg-white dark:bg-[var(--color-card)] p-6 text-center"
        style={{ boxShadow: '0 30px 70px -24px rgba(67, 97, 238, 0.55), 0 16px 34px -18px rgba(23, 23, 31, 0.42)' }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-1"
          style={{ background: 'linear-gradient(90deg, #4361ee, #8b5cf6, #4361ee)' }}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 -right-14 h-44 w-44 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(124, 58, 237, 0.12) 0%, transparent 70%)', filter: 'blur(22px)' }}
        />
        <span
          className="relative mx-auto grid h-14 w-14 place-items-center rounded-2xl text-white"
          style={{ background: 'linear-gradient(135deg, #4361ee, #7c3aed)', boxShadow: '0 14px 28px -10px rgba(67, 97, 238, 0.55)' }}
        >
          <UserX size={26} />
        </span>
        <h3 className="mt-3.5 text-lg font-extrabold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
          {title ?? 'Opponent Left the Challenge'}
        </h3>
        <p className="mt-1.5 text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
          {body ?? 'Your opponent has left the challenge. Returning you to Typing Challenge...'}
        </p>
        <div className="mt-4 h-1 overflow-hidden rounded-full" style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)' }}>
          <div className="challenge-toast-progress h-full rounded-full" style={{ background: 'linear-gradient(90deg, #4361ee, #8b5cf6)' }} />
        </div>
        <p className="mt-2 text-[0.65rem] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--color-text-muted)' }}>
          Redirecting you to Typing Challenge…
        </p>
      </div>
    </div>
  );
}

function ResultsCard({ challenge, opponentLeft, opponentLeftMessage, onRematch, onNewChallenge, onExit }: {
  challenge: ChallengePublic;
  opponentLeft: boolean;
  opponentLeftMessage?: string | null;
  onRematch: () => void;
  onNewChallenge: () => void;
  onExit: () => void;
}) {
  const me = mePlayer(challenge);
  const opponent = opponentOf(challenge, challenge.me);
  const myWon = challenge.winner === challenge.me;
  // The server records an equal-WPM result as winner === null ("draw"), the
  // only path that yields null on a COMPLETED race. Deriving the tie from that
  // existing state lets the same card render Win / Lose / Tie correctly.
  const isTie = challenge.winner === null;
  const myRematch = me?.rematchReady ?? false;
  const oppRematch = opponent?.rematchReady ?? false;
  // Authoritative opponent availability on the results screen: "left" is a
  // permanent gone (only a create-new/back escape remains), "offline" is a drop
  // still inside the reconnection grace (give it a moment, don't murder the
  // pending rematch yet).
  const oppPresence = opponent?.presence ?? 'left';
  const oppGone = opponentLeft || oppPresence === 'left';
  const oppOffline = !oppGone && (oppPresence === 'offline' || !opponent?.connected);

  const abandoned = challenge.endedBy === 'abandoned';
  const abandonedByMe = abandoned && challenge.abandonedBy === challenge.me;

  // Outcome state is derived ONLY from server data (challenge.winner / me), never
  // hardcoded: win → WINNER + "You Won", loss → DEFEATED + "You Lost", and the
  // existing draw path (winner === null) maps to DRAW + "You Tied".
  const celebrate = myWon && !abandonedByMe;
  const winnerSlot = isTie || challenge.winner === null ? null : challenge.winner;
  const meResult: PlayerResultBadge = myWon ? 'WINNER' : isTie ? 'DRAW' : 'DEFEATED';
  const oppResult: PlayerResultBadge =
    winnerSlot !== null && winnerSlot !== challenge.me ? 'WINNER' : isTie ? 'DRAW' : 'DEFEATED';
  const youResult = abandonedByMe ? 'You Forfeited' : myWon ? 'You Won' : isTie ? 'You Tied' : 'You Lost';

  // Dynamic heading driven by the ACTUAL outcome. A departure must never be
  // dressed up as a win: the opponent-left copy wins outright over celebration.
  const heading = abandonedByMe
    ? { title: 'Race Forfeited', sub: 'You left this race before it finished.' }
    : oppGone
      ? { title: 'Opponent Left', sub: opponentLeftMessage ?? 'Your opponent left the challenge.' }
      : isTie
        ? { title: "It's a Tie!", sub: 'Dead heat — nicely typed by both of you!' }
        : myWon
          ? { title: 'Match Finished!', sub: 'Outstanding typing — you took the win!' }
          : { title: 'Match Finished!', sub: 'Great effort — your opponent took this one.' };

  return (
    <div className="rr-screen mx-auto w-full max-w-[64rem]">
      <div
        className="rr-panel relative overflow-hidden p-3.5 text-center sm:p-5"
        style={{ borderRadius: '1.5rem', boxShadow: '0 32px 70px -28px rgba(15, 23, 42, 0.55), 0 12px 28px -18px rgba(15, 23, 42, 0.35)' }}
        data-testid="challenge-results"
        data-outcome={oppGone ? 'opponent-left' : abandonedByMe ? 'forfeited' : isTie ? 'tie' : myWon ? 'win' : 'loss'}
        data-my-result={meResult}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-20 -left-20 h-56 w-56 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(67, 97, 238, 0.12) 0%, transparent 70%)', filter: 'blur(26px)' }}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -right-20 h-64 w-64 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(124, 58, 237, 0.12) 0%, transparent 70%)', filter: 'blur(28px)' }}
        />

        <div className="relative">
          {/* ── dynamic heading ── */}
          <div className="rr-hero rr-fade-up">
            <div
              className={`rr-trophy ${celebrate ? 'rr-trophy-bounce ' : ''}mx-auto grid h-11 w-11 place-items-center rounded-full text-white sm:h-12 sm:w-12`}
              style={{ background: 'linear-gradient(135deg, #4361EE, #8B5CF6)', boxShadow: '0 12px 26px -12px rgba(99, 102, 241, 0.7)' }}
            >
              <Trophy size={21} />
            </div>
            <h2
              className="rr-heading mt-2 text-xl font-extrabold tracking-tight sm:text-2xl"
              style={{ color: 'var(--color-text-primary)' }}
              data-testid="challenge-result-heading"
            >
              {heading.title}
            </h2>
            <p
              className="rr-subtitle mt-0.5 text-xs font-semibold sm:text-[0.8rem]"
              style={{ color: 'var(--color-text-secondary)' }}
              data-testid="challenge-result-subtitle"
            >
              {heading.sub}
            </p>
          </div>

          {/* ── players ── */}
          <div className="rr-players rr-fade-up mt-3.5 grid grid-cols-1 items-stretch gap-2.5 sm:mt-4 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:gap-3">
            <ResultPlayerCard
              player={me}
              isMe
              result={meResult}
              nameFallback="You"
              charId="me"
            />
            <div className="flex items-center justify-center">
              <VSBadge />
            </div>
            <ResultPlayerCard
              player={opponent}
              isMe={false}
              result={oppResult}
              nameFallback="Opponent"
              charId="opp"
            />
          </div>

          {/* ── single compact challenge-details row ── */}
          <div className="rr-details-wrap rr-fade-up mt-3" style={{ animationDelay: '200ms' }}>
            <div
              className="rr-details flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 rounded-xl border px-3 py-1.5 sm:gap-x-3 sm:py-2"
              style={{ borderColor: 'var(--color-border)' }}
              data-testid="challenge-result-details"
            >
              <ResultDetailChip icon={Clock} label="Duration" value={durationLabel(challenge.durationSeconds)} />
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>·</span>
              <ResultDetailChip icon={Swords} label="Round" value={String(challenge.round)} />
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>·</span>
              <ResultDetailChip icon={Users} label="Opponent" value={opponent?.username ?? '—'} />
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>·</span>
              <ResultDetailChip icon={Trophy} label="Result" value={youResult} accent />
            </div>
          </div>

          {/* ── rematch / back to games ── */}
          <div className="rr-actions rr-fade-up mt-3 flex flex-col justify-center gap-2 sm:mt-3.5 sm:flex-row">
            {oppGone ? (
              <>
                <button
                  data-testid="create-new-challenge"
                  onClick={onNewChallenge}
                  className="rr-btn inline-flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-extrabold transition-all duration-150 hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0"
                  style={{ background: 'linear-gradient(135deg, #4361EE, #8B5CF6)', color: '#fff', boxShadow: '0 10px 24px -10px rgba(67, 97, 238, 0.6)' }}
                >
                  <Plus size={16} /> Create New Challenge
                </button>
                <button
                  data-testid="back-to-games"
                  onClick={onExit}
                  className="rr-btn inline-flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold transition-all duration-150"
                  style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', backgroundColor: 'transparent' }}
                >
                  <Home size={15} /> Back to Games
                </button>
              </>
            ) : (
              <>
                <button
                  data-testid="challenge-rematch"
                  onClick={onRematch}
                  disabled={myRematch && !oppRematch}
                  className="rr-btn inline-flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-extrabold transition-all duration-150 hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #4361EE, #8B5CF6)', color: '#fff', boxShadow: '0 10px 24px -10px rgba(67, 97, 238, 0.6)' }}
                >
                  <RotateCcw size={16} />
                  {myRematch && !oppRematch ? 'Rematch requested…' : oppRematch && !myRematch ? 'Accept Rematch' : 'Rematch'}
                </button>
                <button
                  data-testid="back-to-games"
                  onClick={onExit}
                  className="rr-btn inline-flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold transition-all duration-150"
                  style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', backgroundColor: 'transparent' }}
                >
                  <Home size={15} /> Back to Games
                </button>
              </>
            )}
          </div>

          {/* ── rematch status / opponent availability ── */}
          {oppGone ? (
            <div className="rr-fade-up mt-2 flex flex-col items-center gap-0.5 text-center" style={{ animationDelay: '280ms' }}>
              <p className="flex items-center gap-1.5 text-xs font-extrabold" style={{ color: '#F87171' }}>
                <UserX size={13} /> {opponentLeftMessage ?? 'Your opponent left the challenge.'}
              </p>
              <p className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                Your opponent is no longer available.
              </p>
            </div>
          ) : oppOffline && myRematch ? (
            <div className="rr-fade-up mt-2 flex flex-col items-center gap-0.5 text-center" style={{ animationDelay: '280ms' }}>
              <p className="flex items-center gap-1.5 text-xs font-extrabold" style={{ color: '#FBBF24' }}>
                <WifiOff size={13} /> Opponent disconnected
              </p>
              <p className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                Waiting for opponent to reconnect…
              </p>
            </div>
          ) : ((myRematch || oppRematch) && (
            <div className="rr-fade-up mt-2 flex flex-col items-center gap-0.5 text-center" style={{ animationDelay: '280ms' }}>
              {myRematch && !oppRematch ? (
                <>
                  <p className="flex items-center gap-1.5 text-xs font-extrabold" style={{ color: 'var(--color-accent-text)' }}>
                    <CheckCircle2 size={13} /> Your rematch request has been sent.
                  </p>
                  <p className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                    Waiting for your opponent…
                  </p>
                </>
              ) : oppRematch && !myRematch ? (
                <p className="flex items-center gap-1.5 text-xs font-extrabold" style={{ color: 'var(--color-accent-text)' }}>
                  <ShieldCheck size={13} /> {opponent?.username ?? 'Your opponent'} wants a rematch — accept to play Round {challenge.round + 1}!
                </p>
              ) : (
                <p className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                  <Loader2 size={13} className="animate-spin" /> Starting Round {challenge.round + 1}…
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════ PAGE ═══════════════════════════ */

export default function ChallengePage() {
  const { code } = useParams<{ code: string }>();
  if (code) {
    return <ChallengeRoom key={code} code={normalizeCode(code)} />;
  }
  return <ChallengeHome />;
}