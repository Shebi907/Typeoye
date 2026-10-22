import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Keyboard, Lightbulb } from 'lucide-react';
import { PageWrapper } from '../components/layout/PageWrapper';
import {
  UrduSetupInfoCard,
  UrduSetupSelect,
  UrduSetupStartButton,
} from '../components/typing/UrduSetupCards';
import {
  URDU_PRACTICE_CATEGORY_BY_SLUG,
  URDU_PRACTICE_DIFFICULTIES,
  URDU_PRACTICE_DURATIONS,
} from '../data/urduPracticeTypes';
import type { UrduPracticeDifficulty } from '../data/urduPracticeTypes';
import { urduKeyFromEvent } from '../utils/urduPhonetic';
import { ensureUrduContentLoaded } from '../utils/urduContentSync';

const durationOptions = URDU_PRACTICE_DURATIONS.map((d) => ({ value: d.value, label: d.label }));
const difficultyOptions = URDU_PRACTICE_DIFFICULTIES.map((d) => ({ value: d.value, label: d.label }));

const tips = [
  'ہر حرف کی صحیح جگہ سمجھ کر ٹائپ کریں۔',
  'پہلے درستگی، پھر رفتار بڑھائیں۔',
  'اردو فونٹک کی بورڈ میپنگ استعمال کریں۔',
  'روزانہ چند منٹ مشق کریں تاکہ رفتار بہتر ہو۔',
];

export default function UrduPracticeSetup() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const meta = slug ? URDU_PRACTICE_CATEGORY_BY_SLUG[slug] : undefined;

  const [duration, setDuration] = useState<60 | 120 | 300>(60);
  const [difficulty, setDifficulty] = useState<UrduPracticeDifficulty>('easy');
  const [customText, setCustomText] = useState('');
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const caretRef = useRef<number | null>(null);

  // Refresh published Urdu practice content so the session we launch next sees
  // the latest admin content without a full page reload.
  useEffect(() => {
    void ensureUrduContentLoaded(true);
  }, []);

  useLayoutEffect(() => {
    if (caretRef.current === null) return;
    const el = textareaRef.current;
    if (el) el.setSelectionRange(caretRef.current, caretRef.current);
    caretRef.current = null;
  }, [customText]);

  const onCustomKeyDown = (e: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const mapped = urduKeyFromEvent(e.nativeEvent);
    if (mapped === null || mapped === 'Backspace') return;
    e.preventDefault();
    const el = e.currentTarget;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? start;
    caretRef.current = start + mapped.length;
    setCustomText(el.value.slice(0, start) + mapped + el.value.slice(end));
    setMessage('');
  };

  if (!meta) {
    return <Navigate to="/urdu-practice" replace />;
  }

  const isCustom = meta.key === 'custom';

  const start = () => {
    if (isCustom) {
      const trimmed = customText.trim();
      if (!trimmed) {
        setMessage('Please paste or type some Urdu text to practise.');
        return;
      }
      if (!/[\u0600-\u06FF]/.test(trimmed)) {
        setMessage('Please enter Urdu text (the text did not contain any Urdu characters).');
        return;
      }
      navigate(`/urdu-practice/${meta.slug}/session`, {
        state: { duration, difficulty, customText: trimmed },
      });
      return;
    }
    navigate(`/urdu-practice/${meta.slug}/session`, {
      state: { duration, difficulty },
    });
  };

  return (
    <PageWrapper
      title={meta.labelEn}
      noHeader
      fullWidth
      className="flex flex-col min-h-0 !py-4 sm:!py-5 px-3 sm:px-4 md:px-6"
    >
      <div className="w-full max-w-6xl mx-auto flex flex-1 flex-col min-h-0">
        {/* ── Back to Practice — compact, top-left ── */}
        <div className="shrink-0 mb-[clamp(0.5rem,1.4vh,1rem)]">
          <Link
            to="/urdu-practice"
            data-testid="back-to-urdu-practice"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors hover:brightness-105 shrink-0"
            style={{
              color: 'var(--color-accent-text)',
              backgroundColor: 'var(--color-accent-light)',
              border: '1px solid var(--color-border)',
            }}
          >
            <ArrowLeft size={13} />
            Back to Practice
          </Link>
        </div>

        {/* ── Equal two-column setup, vertically centred under the navbar ── */}
        <div className="flex-1 min-h-0 flex items-center justify-center">
          <div className="w-full grid lg:grid-cols-2 items-stretch gap-[clamp(1rem,2vh,1.75rem)]">
            {/* Left — the setup card */}
            <div
              className="card relative flex flex-col text-center p-[clamp(1.5rem,3vh,2.5rem)]"
              data-testid="urdu-practice-setup"
            >
              <span className="dot-grid dot-grid-tl" aria-hidden="true" />
              <h1
                className="text-[clamp(1.9rem,3vw,2.75rem)] font-bold leading-tight mb-[clamp(0.35rem,0.9vh,0.75rem)]"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {meta.heroTitleEn}
              </h1>
              <p className="text-[clamp(1rem,1.3vw,1.25rem)] text-secondary mb-[clamp(1rem,2.2vh,2rem)]">
                {meta.heroDesc}
              </p>

              <UrduSetupSelect
                id="urdu-practice-duration"
                testid="urdu-practice-duration"
                label="Duration"
                value={duration}
                options={durationOptions}
                onChange={(v) => { setDuration(Number(v) as 60 | 120 | 300); setMessage(''); }}
                labelClassName="block text-left text-[clamp(0.9rem,1.1vw,1.05rem)] font-bold mb-[clamp(0.5rem,1.1vh,0.9rem)]"
                selectClassName="input-base block w-full mt-2"
                selectStyle={{ padding: 'clamp(0.85rem,2.2vh,1.3rem) 1rem', fontSize: 'clamp(1rem,1.25vw,1.2rem)' }}
                wrapInLabel
              />

              <UrduSetupSelect
                id="urdu-practice-difficulty"
                testid="urdu-practice-difficulty"
                label="Difficulty"
                value={difficulty}
                options={difficultyOptions}
                onChange={(v) => { setDifficulty(v as UrduPracticeDifficulty); setMessage(''); }}
                labelClassName={`block text-left text-[clamp(0.9rem,1.1vw,1.05rem)] font-bold ${isCustom ? 'mb-[clamp(0.5rem,1.1vh,0.9rem)]' : 'mb-[clamp(1rem,2.2vh,2rem)]'}`}
                selectClassName="input-base block w-full mt-2"
                selectStyle={{ padding: 'clamp(0.85rem,2.2vh,1.3rem) 1rem', fontSize: 'clamp(1rem,1.25vw,1.2rem)' }}
                wrapInLabel
              />

              {isCustom && (
                <div className="text-left mb-[clamp(1rem,2.2vh,2rem)]">
                  <label
                    htmlFor="urdu-practice-custom-input"
                    className="block text-[clamp(0.9rem,1.1vw,1.05rem)] font-bold"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    Your Urdu text
                  </label>
                  <textarea
                    id="urdu-practice-custom-input"
                    data-testid="urdu-practice-custom-input"
                    ref={textareaRef}
                    dir="rtl"
                    lang="ur"
                    value={customText}
                    onChange={(e) => { setCustomText(e.target.value); setMessage(''); }}
                    onKeyDown={onCustomKeyDown}
                    className="input-base font-urdu block w-full mt-2 min-h-28 text-base leading-[2]"
                    placeholder="یہاں اپنی اردو عبارت لکھیں یا پیسٹ کریں…"
                  />
                </div>
              )}

              {message && (
                <p
                  className="text-sm mb-3"
                  style={{ color: 'var(--color-error)' }}
                  data-testid="urdu-practice-setup-message"
                >
                  {message}
                </p>
              )}

              <UrduSetupStartButton
                label="Start Practice"
                onClick={start}
                testid="urdu-practice-start"
                className="tt-start-btn btn w-full justify-center px-6 py-[clamp(0.9rem,2.4vh,1.4rem)] rounded-full mt-auto"
                arrowSize={18}
                style={{ fontSize: 'clamp(1rem,1.3vw,1.25rem)' }}
              />
            </div>

            {/* Right — info cards: phonetic auto, Quick Tips fills remaining height */}
            <div className="flex flex-col gap-[clamp(1rem,2vh,1.75rem)]">
              <UrduSetupInfoCard
                icon={Keyboard}
                title="Urdu Phonetic Typing"
                className="card p-[clamp(1.25rem,2.5vh,2rem)]"
              >
                <p
                  dir="rtl"
                  lang="ur"
                  className="font-urdu text-right text-[clamp(0.95rem,1.15vw,1.1rem)] leading-[1.9]"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  انگریزی کی بورڈ استعمال کرتے ہوئے اردو فونٹک میپنگ کے ساتھ ٹائپ کریں۔ نیچے دی گئی اردو متن کو دیکھ کر مشق کریں۔
                </p>
              </UrduSetupInfoCard>

              <UrduSetupInfoCard
                icon={Lightbulb}
                title="Quick Tips"
                tone={{ backgroundColor: 'rgba(245, 158, 11, 0.18)', color: '#d97706' }}
                className="card p-[clamp(1.25rem,2.5vh,2rem)] flex-1"
              >
                <ul dir="rtl" lang="ur" className="flex flex-col">
                  {tips.map((tip) => (
                    <li key={tip} className="tt-tip-row">
                      <span className="tt-tip-check" aria-hidden="true">✓</span>
                      <span className="font-urdu text-right text-[clamp(0.9rem,1.05vw,1.05rem)] leading-[1.9]">{tip}</span>
                    </li>
                  ))}
                </ul>
              </UrduSetupInfoCard>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
