import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Keyboard, Lightbulb, Timer } from 'lucide-react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { ProseSection } from '../components/content/ProseSection';
import { ensureUrduContentLoaded } from '../utils/urduContentSync';
import {
  UrduSetupInfoCard,
  UrduSetupSelect,
  UrduSetupStartButton,
} from '../components/typing/UrduSetupCards';

type Difficulty = 'easy' | 'medium' | 'hard';

const durationOptions = [
  { value: 60, label: '1 Min' },
  { value: 120, label: '2 Min' },
  { value: 300, label: '5 Min' },
];

const difficultyOptions: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

const tips = [
  'ہر حرف کی صحیح جگہ کو سمجھ کر ٹائپ کریں۔',
  'آہستہ آہستہ ٹائپنگ کی مشق کریں۔',
  'اردو فونٹک کی بورڈ میپنگ کا استعمال کریں۔',
  'ٹائپ کرتے وقت درست حروف اور الفاظ پر دھیان دیں۔',
];

export default function UrduTypingTestSetup() {
  const navigate = useNavigate();
  const [duration, setDuration] = useState<number>(300);
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');

  // Refresh published Urdu test passages so the session we launch next sees the
  // latest admin content without a full page reload.
  useEffect(() => {
    void ensureUrduContentLoaded(true);
  }, []);

  const handleStart = () => {
    navigate('/urdu-typing-test?duration=' + duration + '&difficulty=' + difficulty);
  };

  return (
    <PageWrapper fullWidth noHeader title="Urdu Typing Test" className="py-8 sm:py-10 px-3 sm:px-4 md:px-6">
      <div className="max-w-[106.25rem] mx-auto w-full">
        <div className="flex flex-col lg:flex-row items-stretch justify-center gap-5 w-full">
          {/* Left — setup card */}
          <section className="w-full max-w-[33.75rem] flex">
            <div className="card w-full p-6 sm:p-8 lg:p-10 flex flex-col" data-testid="urdu-setup">
              <div className="text-center">
                <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
                  Urdu Typing Test
                </h1>
                <p
                  dir="rtl"
                  lang="ur"
                  className="font-urdu text-sm mt-2 leading-[1.9]"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  اپنی اردو ٹائپنگ کی رفتار اور درستگی جانچیں
                </p>
              </div>

              <div className="mt-8 flex flex-col flex-1">
                <UrduSetupSelect
                  id="urdu-setup-duration"
                  testid="urdu-setup-duration"
                  label="Duration"
                  value={duration}
                  options={durationOptions}
                  onChange={(v) => setDuration(Number(v))}
                />

                <UrduSetupSelect
                  id="urdu-setup-difficulty"
                  testid="urdu-setup-difficulty"
                  label="Difficulty"
                  value={difficulty}
                  options={difficultyOptions}
                  onChange={(v) => setDifficulty(v as Difficulty)}
                  wrapperClassName="mt-6"
                />

                <UrduSetupStartButton
                  label="Start Test"
                  onClick={handleStart}
                  testid="urdu-setup-start"
                  className="btn tt-start-btn w-full justify-center px-6 py-4 rounded-full text-base mt-8"
                  arrowSize={18}
                />
              </div>
            </div>
          </section>

          {/* Right — highlights / tips */}
          <aside className="w-full lg:w-[21.25rem] shrink-0 flex flex-col gap-4">
            <UrduSetupInfoCard icon={Keyboard} title="Urdu Phonetic Typing">
              <p
                dir="rtl"
                lang="ur"
                className="font-urdu text-right text-sm leading-[1.9]"
                style={{ color: 'var(--color-text-primary)' }}
              >
                اردو فونٹک کی مدد سے انگریزی کی بورڈ پر اردو حروف ٹائپ کیجیے۔ یہ طریقہ نئے سیکھنے والوں کے لیے بہت آسان اور تیز ہے۔
              </p>
            </UrduSetupInfoCard>

            <UrduSetupInfoCard
              icon={Lightbulb}
              title="Quick Tips"
              tone={{ backgroundColor: 'rgba(245, 158, 11, 0.18)', color: '#d97706' }}
            >
              <ul dir="rtl" lang="ur" className="flex flex-col">
                {tips.map((tip) => (
                  <li key={tip} className="tt-tip-row">
                    <span className="tt-tip-check" aria-hidden="true">✓</span>
                    <span className="font-urdu text-right leading-[1.9]">{tip}</span>
                  </li>
                ))}
              </ul>
            </UrduSetupInfoCard>
          </aside>
        </div>

        <ProseSection
          title="About the Urdu typing test"
          learnMoreLabel="Learn more about the Urdu typing test"
          icon={Timer}
        >
          <p>
            This Urdu typing test measures two things: your speed, expressed in words per minute (WPM),
            and your accuracy, expressed as a percentage. Both are calculated from what you actually
            type using the on-screen Urdu phonetic keyboard mapping.
          </p>
          <p>
            <strong>How WPM is calculated.</strong> A word counts as correct only if you type it exactly —
            every character in the right order. At the end, the number of fully correct words is divided
            by the elapsed time in minutes. Accuracy is the share of attempted words you got right.
          </p>
          <p>
            <strong>Duration and difficulty.</strong> You can run the test for 1, 2, or 5 minutes. A short
            test is a quick snapshot; a longer test gives a more representative reading of your sustained
            pace. Difficulty — Easy, Medium, or Hard — changes the complexity of the Urdu text you type.
          </p>
          <p>
            <strong>Typing in Urdu.</strong> Type Urdu through the Latin keyboard using the phonetic
            mapping shown on screen. Start slowly and focus on accuracy — speed follows naturally as your
            fingers learn the key positions.
          </p>
        </ProseSection>
      </div>
    </PageWrapper>
  );
}
