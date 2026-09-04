import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, ArrowRight, Check } from 'lucide-react';
import { PageWrapper } from '../components/layout/PageWrapper';

const DURATIONS = [
  { seconds: 60, label: '1 min' },
  { seconds: 120, label: '2 min' },
  { seconds: 300, label: '5 min' },
  { seconds: 600, label: '10 min' },
  { seconds: 900, label: '15 min' },
];

const STEPS = ['Enter your name', 'Choose test duration', 'Complete the typing test', 'Get your certificate'];

const INCLUDED = [
  'Your name on the certificate',
  'Typing speed (WPM)',
  'Accuracy',
  'Test duration',
  'Certificate ID',
  'Date of achievement',
];

/**
 * Certificate landing page: collects the recipient name + duration, then
 * hands off to the existing timed test flow (?cert=1). The certificate PDF
 * itself is only generated after the test completes (from the Test page's
 * result modal) — never before.
 */
export default function CertificatePage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [duration, setDuration] = useState(60);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    document.title = 'Certificate — TypeOye';
  }, []);

  const start = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setTouched(true);
      return;
    }
    sessionStorage.setItem('typeoye_cert_name', trimmed);
    navigate(`/test?cert=1&duration=${duration}`);
  };

  return (
    <PageWrapper fullWidth className="py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 items-start">
        {/* Main form card */}
        <div className="w-full lg:flex-1 card p-8 sm:p-10">
          <div
            className="w-12 h-12 rounded-xl grid place-items-center mb-5"
            style={{ backgroundColor: 'var(--color-accent-light)' }}
          >
            <Award size={24} style={{ color: 'var(--color-accent-text)' }} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Get Your Typing Certificate</h1>
          <p className="text-secondary mb-8">Reach at least 30 WPM and 90% accuracy in one test to earn your TypeOye certificate.</p>

          <label htmlFor="cert-name" className="block text-left text-base font-semibold mb-5">
            Your Name
            <input
              id="cert-name"
              data-testid="cert-page-name"
              value={name}
              maxLength={60}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="Enter your full name"
              className={`input-base block w-full mt-2 ${touched && !name.trim() ? 'input-error' : ''}`}
              style={{ fontSize: '1.05rem', padding: '12px 14px' }}
            />
            {touched && !name.trim() && (
              <span className="text-sm font-normal mt-1.5 block" style={{ color: 'var(--color-error)' }}>
                Please enter your name to continue.
              </span>
            )}
          </label>

          <div className="mb-8">
            <span className="block text-base font-semibold mb-3">Duration</span>
            <div className="flex flex-wrap gap-2" data-testid="cert-page-durations">
              {DURATIONS.map(({ seconds, label }) => (
                <button
                  key={seconds}
                  type="button"
                  onClick={() => setDuration(seconds)}
                  data-testid={`cert-page-duration-${seconds}`}
                  aria-pressed={duration === seconds}
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold border transition-colors ${
                    duration === seconds
                      ? 'bg-[var(--color-accent-light)] border-[var(--color-accent)] text-[var(--color-accent-text)]'
                      : 'bg-transparent border-[var(--color-border)] text-secondary hover:bg-[var(--color-border)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <button
            data-testid="cert-page-start"
            onClick={start}
            className="btn btn-primary w-full justify-center px-6 py-4 rounded-full text-lg"
          >
            Start Certificate Test <ArrowRight size={20} />
          </button>
        </div>

        {/* Info cards */}
        <aside className="w-full lg:w-[320px] shrink-0 space-y-6">
          <div className="card p-6">
            <h2 className="font-bold text-lg mb-4">How It Works</h2>
            <ol className="space-y-3">
              {STEPS.map((step, i) => (
                <li key={step} className="flex items-center gap-3">
                  <span
                    className="w-7 h-7 rounded-lg grid place-items-center text-xs font-bold shrink-0"
                    style={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent-text)' }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-sm">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="card p-6">
            <h2 className="font-bold text-lg mb-4">What You'll Get</h2>
            <ul className="space-y-2.5">
              {INCLUDED.map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm">
                  <Check size={15} style={{ color: 'var(--color-correct)' }} className="shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </PageWrapper>
  );
}
