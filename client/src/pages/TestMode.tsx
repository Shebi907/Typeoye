import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { LineChart, RefreshCw, Award, Loader2, Keyboard, Target, Lightbulb, ArrowRight, Zap, UserPlus, ArrowLeft, Timer, SlidersHorizontal } from 'lucide-react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { LiveStatsCard } from '../components/typing/LiveStatsCard';
import { useTypingEngine } from '../hooks/useTypingEngine';
import { TypingDisplay } from '../components/typing/TypingDisplay';
import { StartTypingHint } from '../components/typing/StartTypingHint';
import { VirtualKeyboard } from '../components/typing/VirtualKeyboard';
import { generateWordList } from '../data/wordLists';
import { computeWpm, computeAccuracy } from '../utils/wpm';
import { useAuthStore } from '../store/authStore';
import { typingService } from '../services/typing.service';
import { downloadGuestCertificate } from '../services/certificate.service';
import { getApiErrorMessage } from '../services/api';
import { applySessionRewards } from '../utils/rewards';
import type { EngineResult, TypingResult } from '../types';

const VALID_DURATIONS = [60, 120, 300, 600, 900];

// Certificate qualification thresholds — both must be met by the same test.
const CERT_MIN_WPM = 30;
const CERT_MIN_ACCURACY = 90;

const TYPING_TIPS = [
  'Keep your fingers on the home row',
  'Use all fingers',
  'Maintain a steady rhythm',
  'Practice regularly',
];

function localResult(result: EngineResult): Pick<TypingResult, 'wpm' | 'accuracy' | 'correctWords' | 'attemptedWords' | 'errorsCount'> {
  const correctWords = result.typedWords.filter((word) => word.word === word.typed).length;
  const attemptedWords = result.typedWords.length;
  return {
    wpm: computeWpm(correctWords, result.durationSeconds),
    accuracy: computeAccuracy(correctWords, attemptedWords),
    correctWords,
    attemptedWords,
    errorsCount: attemptedWords - correctWords,
  };
}

/**
 * Duration for certificate runs comes from the Certificate page via
 * `?duration=` on the URL, falling back to the session's last selection
 * (default 1 minute). `?cert=1` marks the run as certificate-eligible.
 */
function readDurationParam(searchParams: URLSearchParams): number {
  const raw = Number(searchParams.get('duration'));
  if (VALID_DURATIONS.includes(raw)) return raw;
  const stored = Number(sessionStorage.getItem('typeoye_duration'));
  return VALID_DURATIONS.includes(stored) ? stored : 60;
}

function storedCertName(): string {
  return sessionStorage.getItem('typeoye_cert_name') ?? '';
}

/** Difficulty arrives from the setup page via `?difficulty=` or the session. */
function readDifficultyParam(searchParams: URLSearchParams): 'simple' | 'medium' | 'hard' {
  const raw = searchParams.get('difficulty');
  if (raw === 'simple' || raw === 'medium' || raw === 'hard') return raw;
  const stored = sessionStorage.getItem('typeoye_difficulty');
  return stored === 'medium' || stored === 'hard' ? stored : 'simple';
}

/** Last text shown per difficulty — each new test must differ from it. */
const lastTextByDifficulty = new Map<string, string>();

export default function TestMode() {
  const { settings, isAuthenticated, profile, user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const certificateMode = searchParams.get('cert') === '1';
  // Certificate links preselect everything via URL and skip straight to typing;
  // plain "Test" always shows the setup screen first.
  const [view, setView] = useState<'setup' | 'typing'>(() => (certificateMode ? 'typing' : 'setup'));

  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [duration, setDuration] = useState<number>(() => readDurationParam(searchParams));
  const [difficulty, setDifficulty] = useState<'simple' | 'medium' | 'hard'>(() =>
    readDifficultyParam(searchParams)
  );
  const [pendingDuration, setPendingDuration] = useState<number>(duration);
  const [pendingDifficulty, setPendingDifficulty] = useState<'simple' | 'medium' | 'hard'>(() =>
    readDifficultyParam(searchParams)
  );
  const [summary, setSummary] = useState<ReturnType<typeof localResult> | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // The recipient name was already collected earlier (Certificate page input,
  // or the signed-in profile) — never ask for it again on the results screen.
  const certificateName =
    (certificateMode ? storedCertName() : '') ||
    profile?.displayName ||
    user?.username ||
    'Guest';
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [certError, setCertError] = useState<string | null>(null);
  const resultRef = useRef<EngineResult | null>(null);
  const appending = useRef(false);

  const newChunk = useCallback(
    () => generateWordList(300, settings?.includeNumbers, settings?.includePunctuation, difficulty),
    [settings, difficulty]
  );

  /** Fresh text for this difficulty, guaranteed different from the last one shown. */
  const loadFreshText = useCallback(async (): Promise<string> => {
    let candidate = '';
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const paragraph = await typingService.getRandomParagraph(difficulty);
        candidate = `${paragraph.content} ${newChunk()}`;
      } catch {
        candidate = newChunk();
      }
      if (candidate !== lastTextByDifficulty.get(difficulty)) break;
    }
    lastTextByDifficulty.set(difficulty, candidate);
    return candidate;
  }, [newChunk, difficulty]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    void loadFreshText().then((next) => {
      if (mounted) {
        setSummary(null);
        setSaveError(null);
        setText(next);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [loadFreshText]);

  // Remember selections for later runs this session (and certificate links).
  useEffect(() => {
    sessionStorage.setItem('typeoye_duration', String(duration));
  }, [duration]);
  useEffect(() => {
    sessionStorage.setItem('typeoye_difficulty', difficulty);
  }, [difficulty]);

  const handleComplete = useCallback(
    async (result: EngineResult) => {
      resultRef.current = result;
      setSummary(localResult(result));
      // A fresh result must never inherit a stale "downloaded" state from a
      // previous run (prevents the false success message on unearned cards).
      setDownloaded(false);
      setCertError(null);
      if (!result.typedWords.length) return;

      if (!isAuthenticated) {
        // Guests never submit/stored sessions — the result is local only and
        // certificate mode uses the separate one-shot guest generator.
        return;
      }

      setSaving(true);
      setSaveError(null);
      try {
        const response = await typingService.submitSession({
          mode: 'test',
          startTime: result.startTime,
          endTime: result.endTime,
          typedWords: result.typedWords,
          textSource: 'generated',
          clientWpm: result.clientWpm,
          clientAccuracy: result.clientAccuracy,
        });
        setSummary(response.result);
        applySessionRewards(response.result, response);
      } catch {
        setSaveError('Results could not be saved. Please check your connection and try another test.');
      } finally {
        setSaving(false);
      }
    },
    [isAuthenticated]
  );

  const engine = useTypingEngine({
    text,
    durationSeconds: duration,
    onComplete: handleComplete,
    extendContent: true,
  });

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

  // Lock page scroll while the blurred result modal is open.
  useEffect(() => {
    if (engine.phase === 'finished' && summary) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [engine.phase, summary]);

  const restart = useCallback(() => {
    setSummary(null);
    setSaveError(null);
    setDownloaded(false);
    setCertError(null);
    resultRef.current = null;
    void loadFreshText().then((next) => setText(next));
  }, [loadFreshText]);

  // "Back to Test" returns to the setup screen. We are already on /test, so a
  // <Link to="/test"> pushes the same route and React never remounts us — the
  // results modal must be closed via local state instead (same pattern as Retry).
  // Also abandons any in-progress run so a stale timer/completion can't fire.
  const backToTest = useCallback(() => {
    setSummary(null);
    setSaveError(null);
    setDownloaded(false);
    setCertError(null);
    resultRef.current = null;
    engine.resetEngine();
    void loadFreshText().then((next) => setText(next));
    setView('setup');
  }, [engine, loadFreshText]);

  // Apply the setup-screen choices and enter the typing view.
  const startTest = useCallback(() => {
    setDuration(pendingDuration);
    setDifficulty(pendingDifficulty);
    sessionStorage.setItem('typeoye_duration', String(pendingDuration));
    sessionStorage.setItem('typeoye_difficulty', pendingDifficulty);
    setSummary(null);
    setSaveError(null);
    setDownloaded(false);
    setCertError(null);
    resultRef.current = null;
    engine.resetEngine();
    setView('typing');
  }, [engine, pendingDuration, pendingDifficulty]);

  const downloadCertificate = async () => {
    const result = resultRef.current;
    const recipientName = certificateName.trim();
    if (!result || !recipientName || !summary) return;
    // Never generate/download when the requirements weren't met — the server
    // enforces this too, but the trigger itself must stay behind the earned check.
    if (certificateMode && !certEarned) return;
    setDownloading(true);
    setCertError(null);
    try {
      await downloadGuestCertificate({
        startTime: result.startTime,
        endTime: result.endTime,
        recipientName,
        typedWords: result.typedWords,
      });
      setDownloaded(true);
    } catch (err) {
      setCertError(getApiErrorMessage(err, 'Could not generate your certificate. Please try again.'));
    } finally {
      setDownloading(false);
    }
  };

  const active = engine.wordStates[engine.currentWordIndex];
  const nextChar = active?.chars.find((char) => char.status === 'current' || char.status === 'pending');
  const currentKey = active && active.typed.length >= active.word.length ? ' ' : nextChar?.char;
  const lastChar = active?.chars[active.typed.length - 1];
  const errorKey =
    lastChar?.status === 'error' || lastChar?.status === 'extra'
      ? active?.typed[active.typed.length - 1]
      : undefined;

  const finished = engine.phase === 'finished' && !!summary;
  const running = engine.phase === 'running';
  const timeCritical = running && engine.remaining <= 10;
  // Live error tally: wrong completed words + wrong chars in the current word.
  const liveErrors = (() => {
    let count = 0;
    for (const word of engine.wordStates) {
      if (word.status === 'error') { count += 1; continue; }
      for (const char of word.chars) {
        if (char.status === 'error' || char.status === 'extra') count += 1;
      }
    }
    return count;
  })();
  const difficultyLabel = difficulty === 'simple' ? 'Easy' : difficulty === 'medium' ? 'Medium' : 'Hard';
  const certEarned =
    certificateMode && finished && summary
      ? summary.wpm >= CERT_MIN_WPM && summary.accuracy >= CERT_MIN_ACCURACY
      : false;

  if (view === 'setup') {
    const perks: { icon: typeof Zap; tone: React.CSSProperties; title: string; description: string }[] = [
      { icon: Zap, tone: { backgroundColor: 'rgba(67, 97, 238, 0.12)', color: '#4361ee' }, title: 'Instant WPM', description: 'See your speed live' },
      { icon: Target, tone: { backgroundColor: 'rgba(34, 197, 94, 0.14)', color: '#16a34a' }, title: 'Accuracy Score', description: 'Track every keystroke' },
      { icon: Award, tone: { backgroundColor: 'rgba(245, 158, 11, 0.18)', color: '#d97706' }, title: 'Earn a Certificate', description: 'At 30+ WPM and 90% accuracy' },
    ];

    const durationOptions = VALID_DURATIONS.map((sec) => ({ value: sec, label: sec === 60 ? '1 Minute' : `${sec / 60} Minutes` }));

    return (
      <PageWrapper fullWidth noHeader title="Typing Test" className="py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto w-full">
          <div className="flex flex-col lg:flex-row items-stretch justify-center gap-5 w-full" style={{ minHeight: 'calc(100dvh - 240px)' }}>
            {/* Left — setup card */}
            <section className="w-full max-w-[540px] flex">
              <div className="card w-full p-8 sm:p-10 flex flex-col" data-testid="test-setup">
                <div className="text-center">
                  <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>Test Your Typing Speed</h1>
                  <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>Check your WPM and accuracy instantly.</p>
                </div>

                <div className="mt-8 flex flex-col flex-1">
                  <div>
                    <label className="block text-sm font-bold mb-2" htmlFor="setup-duration">Duration</label>
                    <select
                      id="setup-duration"
                      data-testid="setup-duration"
                      value={pendingDuration}
                      onChange={(e) => setPendingDuration(Number(e.target.value))}
                      className="input-base block w-full"
                      style={{ padding: '13px 14px' }}
                    >
                      {durationOptions.map((d) => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-bold mb-2" htmlFor="setup-difficulty">Difficulty</label>
                    <select
                      id="setup-difficulty"
                      data-testid="setup-difficulty"
                      value={pendingDifficulty}
                      onChange={(e) => setPendingDifficulty(e.target.value as 'simple' | 'medium' | 'hard')}
                      className="input-base block w-full"
                      style={{ padding: '13px 14px' }}
                    >
                      {(['simple', 'medium', 'hard'] as const).map((d) => (
                        <option key={d} value={d}>{d === 'simple' ? 'Easy' : d === 'medium' ? 'Medium' : 'Hard'}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    data-testid="start-test"
                    onClick={startTest}
                    className="btn tt-start-btn w-full justify-center px-6 py-4 rounded-full text-base mt-8"
                    style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}
                  >
                    Start Test <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            </section>

            {/* Right — perks stretch to match the main card's exact height */}
            <aside className="w-full lg:w-[340px] shrink-0 flex flex-col gap-4">
              {perks.map(({ icon: Icon, tone, title, description }) => (
                <div key={title} className="card p-5 flex items-center gap-3 flex-1">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                    style={tone}
                  >
                    <Icon size={20} />
                  </div>
                  <div>
                    <b className="block text-sm">{title}</b>
                    <span className="text-xs text-secondary">{description}</span>
                  </div>
                </div>
              ))}
            </aside>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper fullWidth className="tt-page py-6 px-4 sm:px-6" title={undefined}>
      <div className="max-w-6xl mx-auto w-full">
        {certificateMode ? (
          <div className="mb-4">
            <Link
              to="/certificate"
              data-testid="back-to-certificate-header"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors hover:brightness-105 shrink-0"
              style={{
                color: 'var(--color-accent-text)',
                backgroundColor: 'var(--color-accent-light)',
                border: '1px solid var(--color-border)',
              }}
            >
              <ArrowLeft size={15} />
              Back to Certificate
            </Link>
          </div>
        ) : (
          <div className="mb-4">
            <button
              type="button"
              onClick={backToTest}
              data-testid="back-to-setup"
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
        )}

        {!isAuthenticated && !certificateMode && !finished && (
          <p className="mb-4 text-sm text-secondary text-center">
            Guest mode — your score is shown here but never saved. Sign in to save your results and climb the{' '}
            <Link to="/leaderboard" className="font-semibold" style={{ color: 'var(--color-accent-text)' }}>leaderboard</Link>.
          </p>
        )}

        {certificateMode && !finished && (
          <div
            data-testid="cert-banner"
            className="mb-4 rounded-xl border px-4 py-2.5 text-sm font-semibold flex items-center justify-center gap-2"
            style={{ borderColor: '#4361EE', backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent-text)' }}
          >
            <Award size={15} /> Certificate test — finish to see if you earned your certificate.
          </div>
        )}

        {/* Two-column layout: typing test + live stats/tips */}
        <div className="flex flex-col lg:flex-row gap-5 w-full items-start">
          {/* ── Main column ─────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 w-full">
            <div className="card tt-main-card p-5 sm:p-7 w-full" data-testid="typing-card">
              {/* Header */}
              <div className="flex items-start gap-3.5 mb-5">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 tt-header-icon">
                  <Keyboard size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <h1 className="text-2xl font-bold leading-tight">Typing Test</h1>
                    <div className="flex flex-wrap items-center gap-2" data-testid="live-meta">
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold"
                        style={{ backgroundColor: 'rgba(67, 97, 238, 0.10)', color: 'var(--color-accent-text)' }}
                      >
                        <Timer size={12} /> {duration / 60} min
                      </span>
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold"
                        style={{ backgroundColor: 'rgba(139, 92, 246, 0.10)', color: 'var(--color-accent-text)' }}
                      >
                        <SlidersHorizontal size={12} /> {difficultyLabel}
                      </span>
                      {(running || finished) && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold"
                          style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', color: 'var(--color-error)' }}
                        >
                          ✗ {liveErrors} {liveErrors === 1 ? 'error' : 'errors'}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-secondary mt-1">
                    Type the text below as accurately and quickly as you can.
                  </p>
                </div>
              </div>

              {/* Typing text area */}
              <div className="tt-text-shell relative">
                {text && !loading ? (
                  <div className="relative pt-1">
                    {engine.phase === 'idle' && <StartTypingHint className="-top-1 left-0" />}
                    <TypingDisplay
                      wordStates={engine.wordStates}
                      currentWordIndex={engine.currentWordIndex}
                      fontSize={settings?.fontSize || 22}
                    />
                  </div>
                ) : (
                  <div className="h-24 flex items-center justify-center text-muted">Loading test…</div>
                )}
              </div>

              {/* Mid-test status / restart (the run itself starts on first keystroke) */}
              {(running || finished) && (
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  {running && (
                    <p className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--color-accent-text)' }}>
                      <span className={`inline-block w-2 h-2 rounded-full ${timeCritical ? 'bg-[var(--color-error)]' : 'animate-pulse'}`}
                        style={timeCritical ? undefined : { backgroundColor: 'var(--color-accent)' }} />
                      {timeCritical ? 'Almost done — finish strong!' : 'Keep going — the clock is ticking.'}
                    </p>
                  )}
                  <button onClick={restart} className="btn btn-ghost tt-restart-btn px-4 py-2 ml-auto">
                    <RefreshCw size={16} /> Restart
                  </button>
                </div>
              )}

              {/* Virtual keyboard */}
              <VirtualKeyboard currentKey={currentKey} errorKey={errorKey} variant="premium" />
            </div>
          </div>

          {/* ── Right column: live stats + tips ─────────────────────────── */}
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
                <h2 className="text-sm font-bold">Tips for Better Results</h2>
              </div>
              <ul className="flex flex-col gap-1.5">
                {TYPING_TIPS.map((tip) => (
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

      {/* Result modal — blurs and dims everything behind it, blocks interaction. */}
      {finished && (
        <>
          <div className="fixed inset-0 z-20 backdrop-blur-md bg-black/40" aria-hidden="true" />
          <div className="fixed inset-0 z-30 overflow-y-auto" style={{ paddingTop: 'calc(var(--navbar-h, 64px) + 1.5rem)', paddingBottom: '1.5rem' }}>
            <div className="grid place-items-center min-h-full px-4">
            <div
              className="result-card w-full max-w-md text-center overflow-hidden"
              data-testid="result-card"
              style={{ borderRadius: 20, background: 'var(--color-card)', boxShadow: '0 20px 50px -12px rgba(0,0,0,0.25), 0 8px 20px -6px rgba(0,0,0,0.12)' }}
            >
              {/* Certificate badge */}
              {certificateMode && (
                <div className="pt-4 pb-0">
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold rs-cert"
                    style={{ backgroundColor: 'rgba(139, 92, 246, 0.12)' }}
                  >
                    <Award size={13} /> Certificate test
                  </span>
                </div>
              )}

              {/* Header section */}
              <div className="px-6 pt-3 pb-4">
                <div className="text-3xl mb-1">{certificateMode ? (certEarned ? '🎉' : '❌') : '🎉'}</div>
                <h2 className="text-2xl font-extrabold" style={{ color: 'var(--color-text-primary)' }}>
                  {certificateMode
                    ? certEarned
                      ? 'Certificate Earned!'
                      : 'Certificate Not Earned'
                    : 'Test complete!'}
                </h2>
                {certificateMode && (
                  <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                    {certEarned
                      ? 'Congratulations! You have met the minimum requirements.'
                      : 'You need at least 30 WPM and 90% accuracy to earn this certificate.'}
                  </p>
                )}
              </div>

              {/* Stat cards */}
              <div className="px-6 pb-4">
                <div className="grid grid-cols-3 gap-3">
                  {/* WPM */}
                  <div
                    className="rounded-xl p-3 flex flex-col items-center"
                    style={{ background: 'linear-gradient(135deg, rgba(96,165,250,0.12) 0%, rgba(59,130,246,0.08) 100%)' }}
                  >
                    <span
                      className="text-2xl font-extrabold tabular-nums rs-wpm"
                      style={{ fontFamily: '"JetBrains Mono", "Fira Code", monospace' }}
                    >
                      {summary!.wpm}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider mt-1" style={{ color: '#60A5FA' }}>WPM</span>
                  </div>
                  {/* Accuracy */}
                  <div
                    className="rounded-xl p-3 flex flex-col items-center"
                    style={{ background: 'linear-gradient(135deg, rgba(244,114,182,0.12) 0%, rgba(236,72,153,0.08) 100%)' }}
                  >
                    <span
                      className="text-2xl font-extrabold tabular-nums rs-acc"
                      style={{ fontFamily: '"JetBrains Mono", "Fira Code", monospace' }}
                    >
                      {summary!.accuracy}%
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider mt-1" style={{ color: '#F472B6' }}>ACCURACY</span>
                  </div>
                  {/* Time */}
                  <div
                    className="rounded-xl p-3 flex flex-col items-center"
                    style={{ background: 'linear-gradient(135deg, rgba(74,222,128,0.12) 0%, rgba(34,197,94,0.08) 100%)' }}
                  >
                    <span
                      className="text-2xl font-extrabold tabular-nums rs-time"
                      style={{ fontFamily: '"JetBrains Mono", "Fira Code", monospace' }}
                    >
                      {Math.round(engine.elapsed)}s
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider mt-1" style={{ color: '#4ADE80' }}>TIME</span>
                  </div>
                </div>
                {certificateMode ? (
                  <div
                    className="rounded-xl border mt-3 text-sm"
                    style={{ borderColor: 'var(--color-border)' }}
                  >
                    <div className="p-3 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Minimum speed</span>
                        <span className="font-bold tabular-nums" style={{ color: summary!.wpm >= CERT_MIN_WPM ? 'var(--color-correct)' : 'var(--color-error)' }}>
                          {summary!.wpm >= CERT_MIN_WPM ? '✓' : '✗'} {summary!.wpm} / {CERT_MIN_WPM} WPM
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Minimum accuracy</span>
                        <span className="font-bold tabular-nums" style={{ color: summary!.accuracy >= CERT_MIN_ACCURACY ? 'var(--color-correct)' : 'var(--color-error)' }}>
                          {summary!.accuracy >= CERT_MIN_ACCURACY ? '✓' : '✗'} {summary!.accuracy}% / {CERT_MIN_ACCURACY}%
                        </span>
                      </div>
                    </div>
                    <div className="border-t px-3 py-2 grid grid-cols-2 gap-4" style={{ borderColor: 'var(--color-border)' }}>
                      <div className="flex items-center justify-between">
                        <span style={{ color: 'var(--color-text-secondary)' }}>Correct words</span>
                        <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{summary!.correctWords}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span style={{ color: 'var(--color-text-secondary)' }}>Errors</span>
                        <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{summary!.errorsCount}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mx-6 border-t border-b py-3" style={{ borderColor: 'var(--color-border)' }}>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center justify-between">
                        <span style={{ color: 'var(--color-text-secondary)' }}>Correct words</span>
                        <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{summary!.correctWords}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span style={{ color: 'var(--color-text-secondary)' }}>Errors</span>
                        <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{summary!.errorsCount}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {saving && <p className="text-sm mt-3" style={{ color: 'var(--color-text-secondary)' }}>Saving your result…</p>}
              {saveError && <p className="text-sm mt-3" style={{ color: 'var(--color-error)' }}>{saveError}</p>}
              {!isAuthenticated && !certificateMode && (
                <p
                  className="text-sm mt-3 text-center rounded-lg px-3 py-2"
                  style={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent-text)' }}
                >
                  This score was not saved — create a free account to save it and see it on the leaderboard.
                </p>
              )}

              {/* Certificate download */}
              {certificateMode && !saveError && (
                <div className="px-6 pt-3" data-testid="cert-section">
                  {certError && <p className="text-sm mb-2" style={{ color: 'var(--color-error)' }}>{certError}</p>}
                  {certEarned && downloaded && (
                    <div
                      className="mb-2 rounded-xl border p-2.5 text-sm text-center"
                      style={{ borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.08)', color: 'var(--color-correct)' }}
                    >
                      Certificate downloaded successfully!
                    </div>
                  )}
                  {certEarned ? (
                    <button
                      data-testid="cert-download"
                      onClick={() => void downloadCertificate()}
                      disabled={downloading}
                      className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-150 hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{ background: 'linear-gradient(135deg, #4361EE, #8B5CF6)', color: '#fff', boxShadow: '0 6px 18px rgba(67, 97, 238, 0.35)' }}
                    >
                      {downloading ? <Loader2 size={16} className="animate-spin" /> : <Award size={16} />}
                      Download Certificate
                    </button>
                  ) : (
                    <p className="text-sm text-secondary">
                      Your certificate was not earned — retake the test to meet both requirements above.
                    </p>
                  )}
                </div>
              )}

              {/* Buttons */}
              <div className="px-6 pt-3 pb-5 flex flex-col gap-2.5">
                {/* Primary action */}
                {certificateMode ? (
                  /* Certificate primary — handled above via download button */
                  null
                ) : isAuthenticated ? (
                  <Link
                    to="/progress"
                    className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-150 hover:brightness-110"
                    style={{ background: 'linear-gradient(135deg, #4361EE, #8B5CF6)', color: '#fff', boxShadow: '0 6px 18px rgba(67, 97, 238, 0.35)' }}
                  >
                    <LineChart size={16} /> View your progress
                  </Link>
                ) : (
                  <Link
                    to="/register"
                    className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-150 hover:brightness-110"
                    style={{ background: 'linear-gradient(135deg, #4361EE, #8B5CF6)', color: '#fff', boxShadow: '0 6px 18px rgba(67, 97, 238, 0.35)' }}
                  >
                    <UserPlus size={16} /> Create account & save your results
                  </Link>
                )}

                {/* Secondary actions */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={restart}
                    className="py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-150"
                    style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', backgroundColor: 'transparent' }}
                  >
                    <RefreshCw size={15} /> Retry
                  </button>
                  {certificateMode ? (
                    <Link
                      to="/certificate"
                      data-testid="back-to-certificate"
                      className="py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-150"
                      style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', backgroundColor: 'transparent' }}
                    >
                      <ArrowLeft size={15} /> Back to Certificate
                    </Link>
                  ) : (
                    <button
                      onClick={backToTest}
                      data-testid="back-to-test"
                      className="py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-150"
                      style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', backgroundColor: 'transparent' }}
                    >
                      <ArrowLeft size={15} /> Back to Test
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          </div>
        </>
      )}
    </PageWrapper>
  );
}
