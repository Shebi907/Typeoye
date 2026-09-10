import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Heart, Target, Unlock } from 'lucide-react';

const STATS = [
  { value: '16', label: 'Guided lessons' },
  { value: '100%', label: 'Free, always' },
  { value: '0', label: 'Sign-up required to start' },
];

const VALUES = [
  {
    title: 'Open by default',
    description: 'Full access as a guest, no account required.',
    icon: Unlock,
    color: '#4F46E5',
    bg: 'rgba(79, 70, 229, 0.1)',
  },
  {
    title: 'Built to teach, not just test',
    description: 'Real feedback that actually improves your technique.',
    icon: Target,
    color: '#22C55E',
    bg: 'rgba(34, 197, 94, 0.1)',
  },
  {
    title: 'Made with care',
    description: 'Built and maintained independently, not by committee.',
    icon: Heart,
    color: '#F5A623',
    bg: 'rgba(245, 166, 35, 0.12)',
  },
];

export default function AboutUs() {
  useEffect(() => {
    document.title = 'About Us — Typeoye';
  }, []);

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6">
      {/* Hero */}
      <section className="mx-auto max-w-3xl py-6 text-center sm:py-10">
        <div
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-white"
          style={{
            background: 'linear-gradient(135deg, #4361EE 0%, #7C3AED 100%)',
            boxShadow: '0 8px 20px -6px rgba(67, 97, 238, 0.5)',
          }}
        >
          <Heart size={26} strokeWidth={2} />
        </div>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-5xl" style={{ color: 'var(--color-text-primary)' }}>
          About Typeoye
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[var(--color-text-secondary)] sm:text-lg">
          We believe typing well shouldn't require a paywall. Typeoye is a free, open typing platform
          built to help anyone — student, professional, or beginner — type faster and more accurately.
        </p>
      </section>

      {/* Stats row */}
      <section className="mx-auto grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3" data-testid="about-stats">
        {STATS.map((stat) => (
          <div key={stat.label} className="card flex flex-col items-center py-7 text-center" data-testid="about-stat">
            <span
              className="bg-clip-text text-4xl font-extrabold tracking-tight sm:text-5xl"
              style={{ background: 'linear-gradient(135deg, #4361EE 0%, #7C3AED 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}
            >
              {stat.value}
            </span>
            <span className="mt-2 text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
              {stat.label}
            </span>
          </div>
        ))}
      </section>

      {/* Why we built this */}
      <section
        className="mx-auto mt-14 max-w-5xl rounded-[24px] bg-[#F5F6FC] px-5 py-12 sm:px-10 sm:py-14 dark:border dark:border-[#333340] dark:bg-[#1C1E2E]"
        data-testid="about-why"
      >
        <h2 className="text-center text-2xl font-extrabold tracking-tight sm:text-3xl text-[#17171F] dark:text-white">
          Why we built this
        </h2>
        <div className="mx-auto mt-6 flex max-w-3xl flex-col gap-5 text-base leading-relaxed text-[#3A3A46] dark:text-[#9294B0]">
          <p>
            Most typing platforms lock the good stuff behind a login wall before you even know if it's
            worth your time. We wanted something different — a place where anyone can open a lesson,
            take a test, or play a game the moment they land on the page.
          </p>
          <p>
            Typeoye combines structured lessons, real-time feedback, and adaptive practice into one
            place, so you can go from hunting for keys to typing on instinct — at your own pace.
          </p>
        </div>
      </section>

      {/* What we stand for */}
      <section className="mx-auto mt-14 max-w-5xl">
        <h2 className="text-center text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: 'var(--color-text-primary)' }}>
          What we stand for
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3" data-testid="about-values">
          {VALUES.map((value) => {
            const Icon = value.icon;
            return (
              <div key={value.title} className="card flex flex-col p-5 sm:p-6" data-testid="about-value">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: value.bg, color: value.color }}>
                  <Icon size={24} strokeWidth={1.8} />
                </span>
                <h3 className="mt-4 text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  {value.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  {value.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom CTA */}
      <section
        className="mt-14 rounded-[24px] bg-[#EEF0FF] px-6 py-10 text-center sm:px-10 sm:py-12 dark:border dark:border-[#333340] dark:bg-[#1C1E2E]"
        data-testid="about-cta"
      >
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-[#17171F] dark:text-white">
          Have a question or feedback?
        </h2>
        <Link
          to="/contact"
          data-testid="about-cta-button"
          className="mt-7 inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-base font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 active:scale-[0.98]"
          style={{
            background: 'linear-gradient(135deg, #4361EE 0%, #7C3AED 100%)',
            boxShadow: '0 10px 26px -8px rgba(67, 97, 238, 0.55)',
          }}
        >
          Contact Us <ArrowRight size={18} />
        </Link>
      </section>
    </main>
  );
}
