import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, LineChart, RefreshCw, Target } from 'lucide-react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { PRACTICE_TYPE_BY_SLUG } from '../data/practiceTypes';
import { practiceService } from '../services/practice.service';

const durationOptions = [
  { label: '1 Minute', value: 60 },
  { label: '2 Minutes', value: 120 },
  { label: '5 Minutes', value: 300 },
  { label: '10 Minutes', value: 600 },
  { label: '15 Minutes', value: 900 },
];

const difficultyOptions = [
  { label: 'Easy', value: 'beginner' },
  { label: 'Medium', value: 'intermediate' },
  { label: 'Hard', value: 'advanced' },
];

const perks: { icon: typeof Target; tone: React.CSSProperties; title: string; description: string }[] = [
  { icon: Target, tone: { backgroundColor: 'rgba(67, 97, 238, 0.12)', color: '#4361ee' }, title: 'Focused Practice', description: 'Targets your weak keys' },
  { icon: LineChart, tone: { backgroundColor: 'rgba(34, 197, 94, 0.14)', color: '#16a34a' }, title: 'Track Progress', description: 'See improvements over time' },
  { icon: RefreshCw, tone: { backgroundColor: 'rgba(245, 158, 11, 0.18)', color: '#d97706' }, title: 'Repeat Anytime', description: 'Practice as often as you like' },
];

export default function PracticeSetup() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const meta = slug ? PRACTICE_TYPE_BY_SLUG[slug] : undefined;

  const [time, setTime] = useState(300);
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [customText, setCustomText] = useState('');
  const [message, setMessage] = useState('');
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    setMessage('');
  }, [time, difficulty, customText]);

  useEffect(() => {
    if (!meta || (isCustom && !customText.trim())) return;
    const t = setTimeout(() => {
      practiceService.preload({
        type: meta.key,
        difficulty,
        duration: time,
        wordCount: 200,
        customText: isCustom ? customText.trim() : undefined,
      });
    }, 300);
    return () => clearTimeout(t);
  }, [meta, time, difficulty, customText]);

  if (!meta) {
    return <Navigate to="/practice" replace />;
  }

  const isCustom = meta.key === 'custom';

  const start = async () => {
    if (starting) return;
    if (isCustom && !customText.trim()) {
      setMessage('Add some text to practice first.');
      return;
    }
    const trimmedText = customText.trim();
    // Prepare the content BEFORE navigating so the typing screen opens with the
    // text already visible (never an empty typing area). Reuse the preload if
    // it matches; otherwise wait for a fresh generation before transitioning.
    setStarting(true);
    try {
      const preloaded = practiceService.getPreloaded({
        type: meta.key,
        difficulty,
        duration: time,
        customText: isCustom ? trimmedText : undefined,
      });
      const exercise = preloaded ?? await practiceService.generate({
        type: meta.key,
        difficulty,
        duration: time,
        wordCount: 200,
        customText: isCustom ? trimmedText : undefined,
        session: true,
      });
      // Advance the no-repeat rotation exactly here — once, on the user's Start
      // click (an event handler, never double-invoked). The session screen no
      // longer commits it for seeded runs, so the rotation can't advance twice.
      practiceService.commitRotation(exercise);
      navigate(`/practice/${meta.slug}/session`, {
        state: { duration: time, difficulty, customText: trimmedText, exercise },
      });
    } catch {
      setMessage('Unable to prepare practice content. Please try again.');
    } finally {
      setStarting(false);
    }
  };

  return (
    <PageWrapper title={meta.label} noHeader fullWidth className="py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto w-full">

        {/* ── Back to Practice — standalone, above the setup card (page header area) ── */}
        <div className="mb-6">
          <Link
            to="/practice"
            data-testid="back-to-practice"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors hover:brightness-105 shrink-0"
            style={{
              color: 'var(--color-accent-text)',
              backgroundColor: 'var(--color-accent-light)',
              border: '1px solid var(--color-border)',
            }}
          >
            <ArrowLeft size={15} />
            Back to Practice
          </Link>
        </div>

        {/* ── Two-column setup (matches Test setup page) ── */}
        <div
          className="max-w-6xl mx-auto flex items-center justify-center"
          style={{ minHeight: 'calc(100dvh - 200px)' }}
        >
          <div className="flex flex-col lg:flex-row items-center lg:items-stretch justify-center gap-10 w-full">
            {/* Center — setup card */}
            <div className="w-full max-w-[540px]">
              <div className="card relative p-6 sm:p-[34px_38px] text-center" data-testid="practice-setup">
                <span className="dot-grid dot-grid-tl" aria-hidden="true" />
                <h1 className="text-[32px] font-bold leading-tight mb-2">{meta.heroTitle}</h1>
                <p className="text-[15px] text-secondary mb-[26px]">{meta.heroDesc}</p>

                <label className="block text-left text-sm font-bold mb-[22px]">
                  Duration
                  <select
                    data-testid="setup-duration"
                    value={time}
                    onChange={(e) => setTime(Number(e.target.value))}
                    className="input-base block w-full mt-2"
                    style={{ padding: '13px 14px' }}
                  >
                    {durationOptions.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </label>

                <label className="block text-left text-sm font-bold mb-[26px]">
                  Difficulty
                  <select
                    data-testid="setup-difficulty"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as 'beginner' | 'intermediate' | 'advanced')}
                    className="input-base block w-full mt-2"
                    style={{ padding: '13px 14px' }}
                  >
                    {difficultyOptions.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </label>

                {isCustom && (
                  <div className="text-left mb-[26px]">
                    <label className="block text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                      Your text
                    </label>
                    <textarea
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      className="input-base block w-full mt-2 min-h-28 text-sm"
                      placeholder="Paste English text to practice…"
                    />
                  </div>
                )}

                {message && <p className="text-sm mb-3" style={{ color: 'var(--color-error)' }}>{message}</p>}

                <button
                  type="button"
                  data-testid="start-practice"
                  onClick={start}
                  disabled={starting}
                  className="tt-start-btn btn w-full justify-center px-6 py-[15px] rounded-full"
                  style={{ fontSize: 15, fontWeight: 700, color: '#fff', opacity: starting ? 0.75 : 1 }}
                >
                  {starting ? 'Preparing practice…' : 'Start Practice'} {!starting && <ArrowRight size={19} />}
                </button>
              </div>
            </div>

            {/* Right — Practice highlights (stretch to match the card's height) */}
            <aside className="w-full max-w-[270px] shrink-0 self-stretch flex flex-col gap-[14px]">
              {perks.map(({ icon: Icon, tone, title, description }) => (
                <div key={title} className="card p-5 flex-1 flex flex-col items-center justify-center gap-1.5 text-center">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={tone}
                  >
                    <Icon size={20} />
                  </div>
                  <p className="text-sm font-bold leading-tight">{title}</p>
                  <span className="text-xs text-secondary">{description}</span>
                </div>
              ))}
            </aside>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}