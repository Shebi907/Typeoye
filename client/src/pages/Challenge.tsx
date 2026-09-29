import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Swords, Copy, Check, Link2, Users, Clock, LogOut, RotateCcw, Loader2,
  ArrowLeft, Trophy, Gauge, Target, AlertTriangle, ShieldAlert, ShieldCheck,
  Keyboard, Zap, Timer, ArrowRight, Globe, Info, Share2, TrendingUp,
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
  const accent = tone === 'blue' ? '#4361ee' : '#7c3aed';
  const rows = [
    ['Q', 'W', 'E', 'R', 'T'],
    ['A', 'S', 'D', 'F', 'G'],
    ['Z', 'X', 'C', 'V', 'B'],
  ];
  return (
    <div className="flex-1 min-w-0" style={{ transform: `rotate(${tilt}deg)` }}>
      <div
        className="rounded-xl sm:rounded-2xl p-2 sm:p-2.5"
        style={{ border: '1px solid rgba(99, 102, 241, 0.18)', backgroundColor: '#fbfbfe', boxShadow: '0 12px 28px -14px rgba(23, 23, 31, 0.22)' }}
      >
        <div className="flex flex-col gap-1">
          {rows.map((row, rowIdx) => (
            <div key={rowIdx} className="flex justify-center gap-1">
              {row.map((key) => (
                <span
                  key={key}
                  className="grid h-3 w-[1.125rem] sm:h-3.5 sm:w-[1.375rem] place-items-center rounded-[3px] text-[0.4rem] sm:text-[0.5rem] font-bold"
                  style={{ backgroundColor: `${accent}16`, color: accent }}
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
        <p className="mt-2 text-[0.55rem] sm:text-[0.6rem] font-bold uppercase tracking-[0.14em] text-center" style={{ color: accent }}>
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
        className="relative rounded-[1.75rem] p-5 sm:p-7 overflow-hidden"
        style={{ border: '1px solid rgba(99, 102, 241, 0.18)', backgroundColor: '#ffffff', boxShadow: '0 24px 60px -24px rgba(67, 97, 238, 0.30)' }}
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
            style={{ background: 'linear-gradient(135deg, #4361ee, #7c3aed)', boxShadow: '0 0 0 6px rgba(255, 255, 255, 0.85), 0 0 26px rgba(124, 58, 237, 0.55)' }}
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

            {/* Decorative preview — visual example only, not wired up. */}
            <div className="mt-4 rounded-xl border border-dashed p-3.5" style={{ borderColor: 'rgba(99, 102, 241, 0.28)', backgroundColor: 'rgba(67, 97, 238, 0.04)' }}>
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg" style={{ backgroundColor: 'rgba(67, 97, 238, 0.10)', color: '#4361ee' }}>
                  <Link2 size={15} />
                </span>
                <div className="min-w-0">
                  <p className="text-[0.65rem] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Challenge Code</p>
                  <p className="font-mono text-base font-extrabold tracking-wide" style={{ color: '#4361ee' }}>TY-8K4P2</p>
                </div>
              </div>
              <div className="mt-2.5 flex items-center gap-2 rounded-lg border px-2.5 py-1.5" style={{ borderColor: 'var(--color-border)', backgroundColor: '#ffffff' }}>
                <Globe size={12} style={{ color: 'var(--color-text-muted)' }} />
                <span className="truncate font-mono text-xs" style={{ color: 'var(--color-text-secondary)' }}>typeoye.com/challenge/TY-8K4P2</span>
              </div>
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

type RoomPhase = 'loading' | 'error' | 'expired' | 'lobby' | 'countdown' | 'typing' | 'waitingResults' | 'results';

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
  const [mySummary, setMySummary] = useState<MySummary | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const codeRef = useRef(code);
  const phaseRef = useRef<RoomPhase>(phase);
  const engagedRef = useRef(false);
  const submittedRef = useRef(false);
  const timerIdRef = useRef<number | null>(null);
  const roundRef = useRef<number | null>(null);

  phaseRef.current = phase;

  const currentCode = codeRef.current;

  const emitLeave = useCallback(() => {
    emit('challenge:leave', { code: codeRef.current });
  }, []);

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

    setChallenge(next);
    setOpponentLeft(false);

    // A brand-new round must never inherit the previous round's live state.
    if (roundChanged) {
      setOpponentProgress(null);
      setMySummary(null);
      submittedRef.current = false;
      engagedRef.current = false;
    }

    const status = next.status;
    if (status === 'COMPLETED') {
      submittedRef.current = true;
      setPhase('results');
      return;
    }
    if (status === 'RUNNING') {
      const startAt = next.startAt ? new Date(next.startAt).getTime() : Date.now();
      engagedRef.current = true;
      setPhase(startAt - Date.now() > 2000 ? 'countdown' : 'typing');
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
    setErrorTitle('This challenge has expired.');
    setErrorBody('Create a new challenge to keep the race going.');
    setPhase('expired');
  }, [ownUserId]);

  const loadChallenge = useCallback(async () => {
    let next: ChallengePublic;
    try {
      next = await challengeService.get(codeRef.current);
    } catch (err) {
      goToError('Challenge not found.', getApiErrorMessage(err, 'This challenge does not exist yet.'));
      return;
    }
    if (next.status === 'EXPIRED') {
      setErrorTitle('This challenge has expired.');
      setErrorBody('Create a new challenge to keep the race going.');
      setPhase('expired');
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
          setErrorTitle('This challenge has expired.');
          setErrorBody('Create a new challenge to keep the race going.');
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
      setErrorTitle('This challenge has expired.');
      setErrorBody('Create a new challenge to keep the race going.');
      setPhase('expired');
      return;
    }
    const normalized = applyOwnSlot(next, ownUserId);
    if (roundRef.current != null && normalized.round < roundRef.current) return;
    applyChallenge(normalized);
  }, [applyChallenge, ownUserId]);

  useEffect(() => {
    if (phase !== 'lobby') {
      const pendingRematch = phase === 'results' && challenge
        && ((mePlayer(challenge)?.rematchReady ?? false) || (opponentOf(challenge, challenge.me)?.rematchReady ?? false));
      if (!pendingRematch) return;
    }
    const id = window.setInterval(() => void refreshLobbyState(), 3000);
    return () => window.clearInterval(id);
  }, [phase, challenge, refreshLobbyState]);

  useEffect(() => {
    setOpponentProgress(null);
    setOpponentLeft(false);
    setMySummary(null);
    submittedRef.current = false;
    engagedRef.current = false;
    setPhase('loading');

    if (token) connectChallengeSocket(token);

    const onState = (payload: { challenge: ChallengePublic }) => {
      if (!payload?.challenge) return;
      const next = applyOwnSlot(payload.challenge, ownUserId);
      // Stale snapshots from an older round must never overwrite the current
      // round's UI (e.g. a delayed round-1 broadcast during round 2).
      if (roundRef.current != null && next.round < roundRef.current) return;
      applyChallenge(next);
    };

    const onStarted = (payload: { startAtMs?: number; durationSeconds?: number; text?: string; challenge?: ChallengePublic }) => {
      if (payload?.challenge) {
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
        setPhase(startAtMs - Date.now() > 2000 ? 'countdown' : 'typing');
      }
    };

    const onOpponentLeft = () => {
      setOpponentLeft(true);
      if (phaseRef.current === 'lobby' || phaseRef.current === 'countdown') {
        setErrorTitle('Your opponent has left the challenge.');
        setErrorBody('The room is no longer active. Create a fresh challenge to race again.');
        setPhase('expired');
      }
    };

    const onOpponentProgress = (payload: OpponentProgress) => {
      if (!payload) return;
      // Round-scoped: a live update tagged for a previous round is stale and
      // must be dropped so round-1 stats can never appear in round 2.
      if (roundRef.current != null && payload.round !== roundRef.current) return;
      // The server already excludes the sender, but guard client-side too so a
      // stale/self echo can never overwrite the real opponent's stats.
      if (ownUserId && payload.userId === ownUserId) return;
      setOpponentProgress(payload);
    };

    const onResults = (payload: { challenge: ChallengePublic }) => {
      if (payload?.challenge) {
        const next = applyOwnSlot(payload.challenge, ownUserId);
        if (roundRef.current != null && next.round < roundRef.current) return;
        applyChallenge(next);
      }
    };

    const onRematch = (payload: { challenge: ChallengePublic }) => {
      if (!payload?.challenge) return;
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
      off('challenge:results', onResults);
      off('challenge:rematch', onRematch);
      if (engagedRef.current) emitLeave();
      engagedRef.current = false;
      if (timerIdRef.current !== null) {
        window.clearInterval(timerIdRef.current);
        timerIdRef.current = null;
      }
    };
  }, [token, loadChallenge, ownUserId]);

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
    if (phase !== 'countdown' && phase !== 'typing') return;
    if (timerIdRef.current !== null) window.clearInterval(timerIdRef.current);
    const id = window.setInterval(() => setNow(Date.now()), 200);
    timerIdRef.current = id;
    return () => {
      window.clearInterval(id);
      timerIdRef.current = null;
    };
  }, [phase]);

  const handleSubmitDone = useCallback(async (typedWords: TypedWord[]) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    const submittedCode = codeRef.current;
    const challengeSnapshot = challengeRefSafe.current;
    if (!challengeSnapshot) return;
    const startAtIso = challengeSnapshot.startAt ?? new Date().toISOString();
    const requested = await challengeService.submitResults(submittedCode, {
      round: challengeSnapshot.round,
      startTime: startAtIso,
      endTime: new Date(Date.now()).toISOString(),
      typedWords,
    }).catch((err) => {
      setErrorTitle('Could not submit your results.');
      setErrorBody(getApiErrorMessage(err, 'Something went wrong saving the race. Please try again.'));
      setPhase('error');
      return null;
    });
    if (!requested) return;
    if (requested.final) {
      setChallenge(requested.challenge);
      setPhase('results');
    } else {
      const mine = mePlayer(requested.challenge) ?? mePlayer(challengeSnapshot);
      setMySummary({
        wpm: mine?.stats?.wpm ?? 0,
        accuracy: mine?.stats?.accuracy ?? 100,
        correctWords: mine?.stats?.correctWords ?? 0,
        errorsCount: mine?.stats?.errorsCount ?? 0,
      });
      setPhase('waitingResults');
    }
  }, []);

  const rematch = useCallback(async () => {
    const submittedCode = codeRef.current;
    try {
      const { challenge: next, advanced } = await challengeService.rematch(submittedCode);
      if (advanced || (roundRef.current != null && next.round > roundRef.current)) {
        // Round 2 (or later) is live: reset the previous round's transient
        // state and re-enter the room so the fresh text + startTime flow in.
        submittedRef.current = false;
        engagedRef.current = false;
        setOpponentProgress(null);
        setOpponentLeft(false);
        setMySummary(null);
        void ensureSocketJoined(submittedCode);
        applyChallenge(next);
      } else {
        // I requested a rematch but the opponent hasn't clicked yet — the room
        // stays COMPLETED; just mirror the authoritative snapshot so the
        // results card shows the "waiting for opponent" state.
        const normalized = applyOwnSlot(next, ownUserId);
        if (roundRef.current != null && normalized.round < roundRef.current) return;
        setChallenge(normalized);
      }
    } catch (err) {
      goToError('Could not start a rematch.', getApiErrorMessage(err, 'Please try again.'));
    }
  }, [applyChallenge, goToError, ownUserId]);

  const exitRoom = useCallback(async () => {
    engagedRef.current = false;
    submittedRef.current = true;
    emitLeave();
    try { await challengeService.leave(codeRef.current); } catch { /* ignore */ }
    navigate('/challenge');
  }, [emitLeave, navigate]);

  const copyableUrl = `${window.location.origin}/challenge/${currentCode}`;

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

    if (phase === 'error' || phase === 'expired') {
      return (
        <div className="max-w-[30rem] mx-auto w-full">
          <div className="card p-7 text-center">
            <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-3" style={{ backgroundColor: phase === 'expired' ? 'rgba(245, 158, 11, 0.16)' : 'rgba(239, 68, 68, 0.12)', color: phase === 'expired' ? '#d97706' : '#dc2626' }}>
              {phase === 'expired' ? <Clock size={22} /> : <AlertTriangle size={22} />}
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
        <div className="max-w-[30rem] mx-auto w-full">
          <div className="card p-7 text-center">
            <div className="text-4xl mb-2">⏳</div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>You&apos;re done!</h2>
            <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
              Waiting for your opponent to finish the race…
            </p>
            {mySummary && (
              <div className="grid grid-cols-3 gap-3 mt-5">
                <StatBox label="WPM" value={String(mySummary.wpm)} tone="#60A5FA" />
                <StatBox label="Accuracy" value={`${mySummary.accuracy}%`} tone="#F472B6" />
                <StatBox label="Words" value={String(mySummary.correctWords)} tone="#4ADE80" />
              </div>
            )}
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={() => void exitRoom()}
                className="py-2.5 px-5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-150"
                style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', backgroundColor: 'transparent' }}
              >
                <LogOut size={15} /> Exit
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (phase === 'results') {
      return <ResultsCard challenge={challenge} opponentLeft={opponentLeft} onRematch={() => void rematch()} onExit={() => void exitRoom()} />;
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
          opponentLeft={opponentLeft}
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
          isCreator={Boolean(authUser && challenge.players.some((p) => p.slot === 'player1' && p.userId === String(authUser._id)))}
          onBack={() => navigate('/challenge')}
          onReady={() => void readyNow()}
          onExit={() => void exitRoom()}
        />
        {opponentLeft && (
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

  return (
    <PageWrapper fullWidth className="py-8 sm:py-10 px-3 sm:px-4 md:px-6" title={undefined}>
      <div className="max-w-[106.25rem] mx-auto w-full">{render}</div>
    </PageWrapper>
  );
}

function StatBox({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-xl p-3 flex flex-col items-center" style={{ background: `${tone}1f` }}>
      <span className="text-xl font-extrabold tabular-nums" style={{ color: '#fff' }}>{value}</span>
      <span className="text-[0.625rem] font-bold uppercase tracking-wider mt-1" style={{ color: tone }}>{label}</span>
    </div>
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
      className="flex flex-col items-center justify-center rounded-xl border px-2 py-2.5"
      style={{
        borderColor: prominent ? 'rgba(67, 97, 238, 0.25)' : 'var(--color-border)',
        backgroundColor: prominent ? 'rgba(67, 97, 238, 0.06)' : 'rgba(251, 250, 254, 0.6)',
      }}
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

function LobbyCard({ challenge, code, shareUrl, isCreator, onReady, onExit, onBack }: {
  challenge: ChallengePublic;
  code: string;
  shareUrl: string;
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

  const copy = async (target: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(target === 'code' ? code : shareUrl);
      setCopied(target);
      window.setTimeout(() => setCopied(null), 1500);
    } catch { /* clipboard unavailable */ }
  };

  const shortLink = shareUrl.replace(/^https?:\/\//, '');

  return (
    <div
      className="challenge-fade-in relative card p-6 sm:p-8"
      data-testid="challenge-lobby"
      style={{
        borderRadius: '1.75rem',
        borderColor: 'rgba(99, 102, 241, 0.16)',
        boxShadow: '0 28px 70px -30px rgba(67, 97, 238, 0.32)',
      }}
    >
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-1 rounded-t-[1.75rem]"
        style={{ background: 'linear-gradient(90deg, #4361ee, #7c3aed, #4361ee)' }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -top-12 -right-10 h-44 w-44 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(124, 58, 237, 0.06) 0%, transparent 70%)' }}
      />
      <span aria-hidden className="pointer-events-none absolute bottom-8 left-5 hidden lg:block" style={{ color: 'rgba(124, 58, 237, 0.10)' }}>
        <Keyboard size={84} />
      </span>

      <div className="relative">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs font-bold transition-colors hover:brightness-110"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <ArrowLeft size={14} /> Back to Challenges
            </button>
            <div className="mt-4 flex items-center gap-3.5">
              <span
                className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl"
                style={{ background: 'linear-gradient(135deg, #4361ee, #7c3aed)', boxShadow: '0 14px 24px -10px rgba(67, 97, 238, 0.55)' }}
              >
                <Swords size={22} color="#fff" />
              </span>
              <div className="min-w-0">
                <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
                  {isCreator ? 'Challenge Created!' : 'Challenge Room'}
                </h2>
                <p className="mt-0.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  {isCreator ? 'Share the code or link with your friend to start the match.' : 'You\'ve joined the challenge!'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-start gap-2">
            <span
              className="inline-flex w-fit items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold"
              style={{ backgroundColor: 'rgba(139, 92, 246, 0.10)', color: '#7c3aed' }}
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
              className="inline-flex w-fit items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-bold"
              style={{
                backgroundColor: isCreator ? (hasOpponent ? 'rgba(34, 197, 94, 0.10)' : 'rgba(245, 158, 11, 0.12)') : 'rgba(34, 197, 94, 0.10)',
                color: isCreator ? (hasOpponent ? '#15803d' : '#b45309') : '#15803d',
              }}
            >
              <span className="relative flex h-2 w-2">
                <span
                  className="challenge-waiting-dot absolute inline-flex h-full w-full rounded-full"
                  style={{ backgroundColor: isCreator ? (hasOpponent ? '#22c55e' : '#f59e0b') : '#22c55e' }}
                />
                <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: isCreator ? (hasOpponent ? '#22c55e' : '#f59e0b') : '#22c55e' }} />
              </span>
              {isCreator ? (hasOpponent ? 'Opponent joined' : 'Waiting for opponent…') : 'Both players connected'}
            </span>
          </div>
        </div>

        <div className={`mt-7 grid grid-cols-1 gap-5 ${isCreator ? 'items-stretch lg:grid-cols-[1.05fr_1fr]' : ''}`}>
          {isCreator && (
            <div className="flex flex-col gap-4">
              <div
                className="rounded-2xl border p-5"
                style={{ borderColor: 'rgba(99, 102, 241, 0.18)', background: 'linear-gradient(135deg, rgba(67, 97, 238, 0.05), rgba(124, 58, 237, 0.05))' }}
              >
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Challenge Code</p>
                <div
                  className="mt-3 rounded-xl border px-4 py-3"
                  style={{ background: 'var(--color-card)', borderColor: 'rgba(99, 102, 241, 0.20)' }}
                >
                  <p
                    className="truncate text-3xl font-extrabold tracking-[0.08em] sm:text-4xl"
                    style={{ color: 'var(--color-accent-text)', fontFamily: '"JetBrains Mono", "Fira Code", monospace' }}
                  >
                    {code}
                  </p>
                </div>
                <button
                  onClick={() => void copy('code')}
                  data-testid="copy-code"
                  className="mt-3.5 inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-all duration-150 hover:-translate-y-0.5 hover:brightness-110"
                  style={{ background: 'linear-gradient(135deg, #4361ee, #7c3aed)', color: '#fff', boxShadow: '0 6px 16px -6px rgba(67, 97, 238, 0.55)' }}
                >
                  {copied === 'code' ? <Check size={13} /> : <Copy size={13} />} {copied === 'code' ? 'Copied!' : 'Copy Code'}
                </button>
              </div>

              <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
                <p className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--color-text-muted)' }}>
                  <Link2 size={13} /> Challenge Link
                </p>
                <div className="mt-3 flex items-center gap-2 truncate rounded-xl border px-3.5 py-2.5" style={{ borderColor: 'rgba(99, 102, 241, 0.20)', backgroundColor: 'rgba(251, 250, 254, 0.6)' }}>
                  <Globe size={14} className="shrink-0" style={{ color: 'var(--color-text-muted)' }} />
                  <span className="truncate font-mono text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{shortLink}</span>
                </div>
                <button
                  onClick={() => void copy('link')}
                  data-testid="copy-link"
                  className="mt-3.5 inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-all duration-150 hover:-translate-y-0.5 hover:brightness-110"
                  style={{ background: 'linear-gradient(135deg, #4361ee, #7c3aed)', color: '#fff', boxShadow: '0 6px 16px -6px rgba(67, 97, 238, 0.55)' }}
                >
                  {copied === 'link' ? <Check size={13} /> : <Copy size={13} />} {copied === 'link' ? 'Copied!' : 'Copy Link'}
                </button>
              </div>

              <p className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                <Share2 size={13} /> Share the code or link with your friend.
              </p>

              <div
                className="flex items-center gap-2.5 rounded-xl px-4 py-3"
                style={{ backgroundColor: 'rgba(67, 97, 238, 0.08)', border: '1px solid rgba(99, 102, 241, 0.18)' }}
              >
                <Info size={16} className="shrink-0" style={{ color: 'var(--color-accent-text)' }} />
                <p className="text-xs font-semibold" style={{ color: 'var(--color-accent-text)' }}>
                  Keep this page open. We&apos;ll notify you when your friend joins.
                </p>
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1.5 px-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                <span className="flex items-center gap-1.5"><Timer size={13} /> {durationLabel(challenge.durationSeconds)} race</span>
                <span className="flex items-center gap-1.5"><Zap size={13} /> Real-time</span>
                <span className="flex items-center gap-1.5"><Users size={13} /> 2 Players</span>
              </div>
            </div>
          )}

          <div
            className={`relative flex flex-col overflow-hidden rounded-2xl border p-5 sm:p-6 ${isCreator ? '' : 'mx-auto w-full max-w-md'}`}
            style={{ borderColor: 'rgba(99, 102, 241, 0.18)', backgroundColor: 'rgba(251, 250, 254, 0.6)' }}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute -top-14 -right-14 h-44 w-44 rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(124, 58, 237, 0.10) 0%, transparent 70%)' }}
            />
            <span aria-hidden className="absolute right-4 top-3" style={{ color: 'rgba(67, 97, 238, 0.16)' }}><Zap size={16} /></span>
            <span aria-hidden className="absolute bottom-3 left-4" style={{ color: 'rgba(124, 58, 237, 0.16)' }}><Keyboard size={18} /></span>

            <p className="mb-6 text-center text-[0.65rem] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--color-text-muted)' }}>
              <Swords size={12} className="mr-1 inline" style={{ color: 'var(--color-accent-text)' }} /> Ready to battle?
            </p>

            <div className="flex flex-1 flex-col items-center gap-5 sm:flex-row sm:items-stretch sm:justify-between sm:gap-2">
              <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center">
                <span
                  className="grid h-14 w-14 shrink-0 place-items-center rounded-full text-lg font-bold text-white sm:h-16 sm:w-16 sm:text-xl"
                  style={{ background: 'linear-gradient(135deg, #4361ee, #7c3aed)', boxShadow: '0 10px 20px -8px rgba(67, 97, 238, 0.5)' }}
                >
                  {(me?.username ?? '?').slice(0, 1).toUpperCase()}
                </span>
                <span className="mt-1 rounded px-1.5 py-0.5 text-[0.625rem] font-bold uppercase tracking-wide" style={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent-text)' }}>You</span>
                <span className="max-w-full truncate text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>{me?.username ?? 'You'}</span>
                <span className="text-xs font-bold" style={{ color: myReady ? '#16a34a' : 'var(--color-text-muted)' }}>
                  {myReady ? '🟢 Ready' : '⚪ Not Ready'}
                </span>
              </div>

              <div className="flex shrink-0 flex-col items-center justify-center px-0.5">
                <span className="challenge-vs-pulse grid h-11 w-11 place-items-center rounded-full text-sm font-extrabold text-white sm:h-12 sm:w-12">
                  VS
                </span>
              </div>

              <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center">
                <span
                  className="grid h-14 w-14 shrink-0 place-items-center rounded-full text-lg font-bold sm:h-16 sm:w-16 sm:text-xl"
                  style={{
                    background: opponent ? 'linear-gradient(135deg, #8b5cf6, #d946ef)' : 'rgba(148, 163, 184, 0.22)',
                    color: opponent ? '#fff' : 'var(--color-text-muted)',
                    boxShadow: opponent ? '0 10px 20px -8px rgba(139, 92, 246, 0.5)' : 'none',
                  }}
                >
                  {opponent ? opponent.username.slice(0, 1).toUpperCase() : <Clock size={20} />}
                </span>
                <span className="mt-1 rounded px-1.5 py-0.5 text-[0.625rem] font-bold uppercase tracking-wide" style={{ backgroundColor: opponent ? 'rgba(139, 92, 246, 0.12)' : 'rgba(148, 163, 184, 0.15)', color: opponent ? '#7c3aed' : 'var(--color-text-muted)' }}>Opponent</span>
                <span className="max-w-full truncate text-sm font-bold" style={{ color: opponent ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                  {opponent ? opponent.username : 'Waiting…'}
                </span>
                <span className="text-xs font-bold" style={{ color: opponent?.ready ? '#16a34a' : 'var(--color-text-muted)' }}>
                  {opponent ? (opponent.ready ? '🟢 Ready' : '⚪ Not Ready') : 'Waiting'}
                </span>
              </div>
            </div>

            {isCreator ? (
              hasOpponent ? (
                <div className="mt-5 flex items-center justify-center gap-2 rounded-xl px-3 py-2.5" style={{ backgroundColor: 'rgba(34, 197, 94, 0.08)' }}>
                  <p className="text-xs font-bold" style={{ color: '#15803d' }}>🎉 Opponent Joined!</p>
                </div>
              ) : (
                <div className="mt-5 flex flex-col items-center gap-1 rounded-xl px-3 py-2.5" style={{ backgroundColor: 'rgba(245, 158, 11, 0.10)' }}>
                  <p className="flex items-center gap-1.5 text-xs font-bold" style={{ color: '#b45309' }}>
                    <Loader2 size={14} className="animate-spin" /> ⏳ Waiting for opponent...
                  </p>
                  <p className="text-[0.6875rem] font-semibold" style={{ color: '#b45309' }}>
                    Share your challenge code or link with a friend.
                  </p>
                </div>
              )
            ) : (
              <div className="mt-5 flex items-center justify-center gap-2 rounded-xl px-3 py-2.5" style={{ backgroundColor: 'rgba(34, 197, 94, 0.08)' }}>
                <p className="text-xs font-bold" style={{ color: '#15803d' }}>🎉 You&apos;ve joined the challenge!</p>
              </div>
            )}

            {myReady ? (
              <p
                className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-bold"
                style={{ backgroundColor: 'rgba(34, 197, 94, 0.10)', color: '#15803d' }}
              >
                <Check size={15} /> You&apos;re ready — waiting for your opponent to click ready…
              </p>
            ) : (
              <button
                data-testid="challenge-ready"
                onClick={onReady}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-extrabold transition-all duration-150 hover:-translate-y-0.5 hover:brightness-110"
                style={{ background: 'linear-gradient(135deg, #4361EE, #8B5CF6)', color: '#fff', boxShadow: '0 10px 24px -10px rgba(67, 97, 238, 0.6)' }}
              >
                <Zap size={17} /> I&apos;m Ready
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            <Clock size={13} /> ◷ Room expires 30 minutes after creation
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
      </div>
    </div>
  );
}

/***** DUEL *****/

function DuelArea({ round, text, duration, startAtMs, opponentName, opponentProgress, opponentLeft, onProgress, onTextDone, onExit }: {
  round: number;
  text: string;
  duration: number;
  startAtMs: number;
  opponentName: string;
  opponentProgress: OpponentProgress | null;
  opponentLeft: boolean;
  onProgress: (p: { correct: number; attempted: number; errors: number; typedChars: number; wpm: number; accuracy: number; progress: number }) => void;
  onTextDone: (typedWords: TypedWord[]) => void;
  onExit: () => void;
}) {
  const endAtMs = startAtMs + duration * 1000;
  const [now, setNow] = useState(() => Date.now());
  const doneRef = useRef(false);
  const engineRef = useRef<ReturnType<typeof useTypingEngine> | null>(null);

  const engine = useTypingEngine({
    text,
    durationSeconds: duration + 120,
    onComplete: () => finishNow(),
  });
  engineRef.current = engine;

  const syncRemaining = Math.max(0, Math.ceil((endAtMs - now) / 1000));
  const myProgress = engine.wordStates.length ? Math.min(100, Math.round((engine.currentWordIndex / engine.wordStates.length) * 100)) : 0;

  const finishNow = useCallback(() => {
    if (doneRef.current) return;
    const current = engineRef.current;
    if (!current) return;
    doneRef.current = true;
    const typedWords = snapshotTypedWords(current.wordStates, current.currentWordIndex);
    onTextDone(typedWords);
  }, [onTextDone]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (doneRef.current) return;
    if (engine.phase === 'finished') {
      finishNow();
      return;
    }
    if (now >= endAtMs) {
      finishNow();
      return;
    }
  }, [engine.phase, now, endAtMs, finishNow]);

  useEffect(() => {
    if (engine.phase !== 'running') return;
    // Throttled realtime publish (~3x/second): socket-only fan-out, no DB
    // writes per keystroke, so the opponent's WPM/accuracy/progress stays live
    // and smooth without hammering the database.
    const id = window.setInterval(() => {
      const current = engineRef.current;
      if (!current) return;
      const correct = current.wordStates.filter((w) => w.status === 'correct').length;
      const attempted = current.wordStates.filter((w) => w.status !== 'pending').length;
      const total = current.wordStates.length;
      const progress = total > 0 ? Math.min(100, Math.round((current.currentWordIndex / total) * 100)) : 0;
      const typedChars = current.wordStates.reduce((n, w) => n + (w.status !== 'pending' ? w.typed.length : 0), 0);
      onProgress({
        correct,
        attempted,
        errors: liveErrorsFrom(current.wordStates),
        typedChars,
        wpm: current.liveWpm,
        accuracy: current.liveAccuracy,
        progress,
      });
    }, 300);
    return () => window.clearInterval(id);
  }, [engine.phase, onProgress]);

  const active = engine.wordStates[engine.currentWordIndex];
  const nextChar = active?.chars.find((c) => c.status === 'current' || c.status === 'pending');
  const currentKey = active && active.typed.length >= active.word.length ? ' ' : nextChar?.char;
  const lastChar = active?.chars[active.typed.length - 1];
  const errorKey = (lastChar?.status === 'error' || lastChar?.status === 'extra') ? active?.typed[active.typed.length - 1] : undefined;

  const liveErrors = liveErrorsFrom(engine.wordStates);
  const liveCorrectChars = liveCorrectCharsFrom(engine.wordStates);
  const timeCritical = syncRemaining <= 10 && engine.phase === 'running';

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
            ) : (
              <p className="mt-0.5 text-sm normal-case" style={{ color: 'var(--color-text-secondary)' }}>
                Race against <b style={{ color: '#7c3aed' }}>{opponentName}</b> — type fast, type clean.
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold"
            style={{ backgroundColor: 'rgba(139, 92, 246, 0.12)', color: '#7c3aed' }}
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
              <p className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--color-accent-text)' }}>
                {timeCritical ? 'Almost done — finish strong!' : 'The clock is ticking.'}
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
              <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[0.625rem] font-extrabold uppercase tracking-wider" style={{ backgroundColor: opponentProgress ? 'rgba(239, 68, 68, 0.10)' : 'rgba(148, 163, 184, 0.14)', color: opponentProgress ? '#dc2626' : 'var(--color-text-muted)' }}>
                <span className="relative flex h-1.5 w-1.5">
                  <span className="live-dot absolute inline-flex h-full w-full rounded-full" style={{ backgroundColor: opponentProgress ? '#dc2626' : 'currentColor' }} />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ backgroundColor: opponentProgress ? '#dc2626' : 'currentColor' }} />
                </span>
                {opponentProgress ? 'Live' : 'Idle'}
              </span>
            </div>
            <div className="flex items-center gap-2.5 mb-3">
              <span className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: 'linear-gradient(135deg, #8b5cf6, #d946ef)', boxShadow: '0 8px 16px -6px rgba(139, 92, 246, 0.5)' }}>
                {opponentName.slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>{opponentName}</p>
                <p className="text-xs" style={{ color: opponentProgress ? 'var(--color-accent-text)' : 'var(--color-text-muted)' }}>
                  {opponentProgress ? (
                    <>
                      Typing…
                      {opponentProgress.errors > 0 && (
                        <span className="font-semibold" style={{ color: 'var(--color-error)' }}>
                          {' · '}{opponentProgress.errors} error{opponentProgress.errors === 1 ? '' : 's'}
                        </span>
                      )}
                    </>
                  ) : (
                    'Waiting…'
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
                <p className="text-xl font-extrabold tabular-nums" style={{ color: '#F472B6', fontFamily: '"JetBrains Mono", "Fira Code", monospace' }}>{opponentProgress?.accuracy ?? 100}%</p>
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

function ResultsCard({ challenge, opponentLeft, onRematch, onExit }: {
  challenge: ChallengePublic;
  opponentLeft: boolean;
  onRematch: () => void;
  onExit: () => void;
}) {
  const me = mePlayer(challenge);
  const opponent = opponentOf(challenge, challenge.me);
  const myWon = challenge.winner === challenge.me;
  const draw = challenge.winner === 'draw';
  const myRematch = me?.rematchReady ?? false;
  const oppRematch = opponent?.rematchReady ?? false;

  const headline = opponentLeft
    ? myWon
      ? 'You win the race!'
      : 'Race ended'
    : myWon
      ? 'You win — nice typing!'
      : draw
        ? 'It\'s a tie — evenly matched!'
        : 'Solid game — keep practicing!';

  const subHeadline = opponentLeft
    ? 'Your opponent left the challenge.'
    : myWon
      ? draw
        ? 'Both players finished on the same WPM.'
        : 'You finished with the higher WPM.'
      : draw
        ? 'Well raced to the very end.'
        : 'Your opponent edged you out this time.';

  return (
    <div className="max-w-[46rem] mx-auto w-full">
      <div className="card p-6 sm:p-8 text-center" data-testid="challenge-results">
        <div className="text-5xl mb-2">{myWon ? '🏆' : draw ? '🤝' : '💪'}</div>
        <h2 className="text-2xl font-extrabold" style={{ color: 'var(--color-text-primary)' }}>{headline}</h2>
        <p className="text-sm mt-1.5" style={{ color: 'var(--color-text-secondary)' }}>{subHeadline}</p>

        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold" style={{ backgroundColor: 'rgba(139, 92, 246, 0.12)', color: '#7c3aed' }}>
          <Swords size={13} /> Round {challenge.round} complete
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[me, opponent].filter((p): p is ChallengePlayerView => Boolean(p)).map((player) => {
            const isMe = player.slot === challenge.me;
            const isWinner = challenge.winner === player.slot;
            return (
              <div
                key={player.slot}
                className="rounded-2xl p-5 text-left"
                style={{
                  border: isWinner ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                  backgroundColor: isMe ? 'rgba(67, 97, 238, 0.06)' : 'rgba(124, 58, 237, 0.08)',
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                      style={{ background: isMe ? 'linear-gradient(135deg, #4361ee, #7c3aed)' : 'linear-gradient(135deg, #8b5cf6, #d946ef)' }}
                    >
                      {player.username.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="text-sm font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>
                      {player.username}
                      {isMe && <span className="ml-1.5 text-xs font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent-text)' }}>You</span>}
                    </span>
                  </div>
                  {isWinner && <Trophy size={17} style={{ color: 'var(--color-accent-text)' }} />}
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-2xl font-extrabold tabular-nums" style={{ color: '#60A5FA', fontFamily: '"JetBrains Mono", "Fira Code", monospace' }}>{player.stats?.wpm ?? 0}</p>
                    <p className="text-[0.625rem] font-bold uppercase tracking-wider mt-0.5" style={{ color: 'var(--color-text-muted)' }}>WPM</p>
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold tabular-nums" style={{ color: '#F472B6', fontFamily: '"JetBrains Mono", "Fira Code", monospace' }}>{player.stats?.accuracy ?? 0}%</p>
                    <p className="text-[0.625rem] font-bold uppercase tracking-wider mt-0.5" style={{ color: 'var(--color-text-muted)' }}>ACC</p>
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold tabular-nums" style={{ color: '#4ADE80', fontFamily: '"JetBrains Mono", "Fira Code", monospace' }}>{player.stats?.correctWords ?? 0}</p>
                    <p className="text-[0.625rem] font-bold uppercase tracking-wider mt-0.5" style={{ color: 'var(--color-text-muted)' }}>WORDS</p>
                  </div>
                </div>
                <p className="text-xs mt-2.5" style={{ color: 'var(--color-text-muted)' }}>
                  {player.stats?.errorsCount ?? 0} errors · {player.stats?.attemptedWords ?? 0} words attempted
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3">
          <button
            data-testid="challenge-rematch"
            onClick={onRematch}
            disabled={myRematch && !oppRematch}
            className="py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-150 hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #4361EE, #8B5CF6)', color: '#fff', boxShadow: '0 6px 18px rgba(67, 97, 238, 0.35)' }}
          >
            <RotateCcw size={15} /> {myRematch && !oppRematch ? 'Rematch requested…' : oppRematch && !myRematch ? 'Accept Rematch' : 'Rematch'}
          </button>
          <button
            onClick={onExit}
            className="py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-150"
            style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', backgroundColor: 'transparent' }}
          >
            <LogOut size={15} /> Exit
          </button>
        </div>

        {(myRematch || oppRematch) && (
          <p className="mt-4 text-xs font-semibold flex items-center justify-center gap-1.5 text-center" style={{ color: 'var(--color-text-muted)' }}>
            {myRematch && !oppRematch ? (
              <>
                <Loader2 size={13} className="animate-spin" /> Waiting for {opponent?.username ?? 'your opponent'} to rematch…
              </>
            ) : oppRematch && !myRematch ? (
              <>
                <ShieldCheck size={13} /> {opponent?.username ?? 'Your opponent'} wants a rematch — accept to play Round {challenge.round + 1}!
              </>
            ) : (
              <>&nbsp;</>
            )}
          </p>
        )}
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