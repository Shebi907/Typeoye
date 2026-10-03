import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Keyboard, Rocket, RefreshCw, Trophy } from 'lucide-react';
import { cn } from '../utils/cn';
import { useSeo } from '../hooks/useSeo';

interface Step {
  label: string;
  title: string;
  description: string;
  icon: typeof Keyboard;
  color: string;
  textClass: string;
  gradient: string;
}

const STEPS: Step[] = [
  {
    label: 'STEP 1',
    title: 'Pick your path',
    description:
      'Test your speed, start the 16-level course, or jump into a game — all open instantly, no account needed.',
    icon: Keyboard,
    color: '#4F46E5',
    textClass: 'text-[#4F46E5] dark:text-[#8b9dff]',
    gradient: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
  },
  {
    label: 'STEP 2',
    title: 'Practice consistently',
    description:
      'Come back daily — focused drills adapt to your weak keys, and games keep it from feeling like a chore.',
    icon: RefreshCw,
    color: '#22C55E',
    textClass: 'text-[#16a34a] dark:text-[#5ae095]',
    gradient: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
  },
  {
    label: 'STEP 3',
    title: 'Watch it pay off',
    description:
      'Track your WPM climb, earn a certificate, and see your name rise on the leaderboard.',
    icon: Trophy,
    color: '#F5A623',
    textClass: 'text-[#b45309] dark:text-[#ffc85c]',
    gradient: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
  },
];

const CHECKLIST = [
  'Free typing test, no sign-up',
  '16-level guided course',
  '4 typing games',
  'Free certificate at 30+ WPM',
  'Weak-key focused practice',
  'Progress tracking (sign in)',
];

export default function HowItWorks() {
  useSeo({
    title: 'How It Works | Typeoye',
    description:
      'Learn how Typeoye works — take a typing test, follow guided lessons, practice your weak keys, play typing games, and earn a typing certificate.',
    canonicalPath: '/how-it-works',
  });

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6">
      {/* Hero */}
      <section className="mx-auto max-w-3xl py-8 text-center sm:py-12">
        <div
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-white"
          style={{
            background: 'linear-gradient(135deg, #4F46E5 0%, #7C6EF2 100%)',
            boxShadow: '0 8px 20px -6px rgba(79, 70, 229, 0.5)',
          }}
        >
          <Rocket size={26} strokeWidth={2} />
        </div>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-5xl" style={{ color: 'var(--color-text-primary)' }}>
          Three steps. That's it.
        </h1>
        <p className="readable-text mx-auto mt-4 max-w-xl text-base leading-relaxed text-[var(--color-text-secondary)] sm:text-lg">
          No complicated setup — just open a lesson and start typing.
        </p>
      </section>

      {/* Three-step section */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {STEPS.map((step) => {
          const Icon = step.icon;
          return (
            <div key={step.label} className="card relative p-5 sm:p-7" data-testid="how-step">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ background: step.gradient, boxShadow: '0 6px 14px -6px rgba(15, 23, 42, 0.15)' }}
              >
                <Icon size={24} strokeWidth={1.8} style={{ color: step.color }} />
              </div>
              <p className={cn('mt-5 text-xs font-bold tracking-widest', step.textClass)}>
                {step.label}
              </p>
              <h3 className="mt-1.5 text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                {step.description}
              </p>
            </div>
          );
        })}
      </section>

      {/* Everything included */}
      <section
        className="hiw-section mt-16 rounded-[1.5rem] px-5 py-12 sm:px-10 sm:py-14"
        data-testid="how-checklist"
      >
        <h2
          className="text-center text-2xl font-extrabold tracking-tight sm:text-3xl"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Everything included, at every level
        </h2>
        <div className="mx-auto mt-8 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2">
          {CHECKLIST.map((item) => (
            <div
              key={item}
              className={cn(
                'flex items-center gap-3 rounded-xl border border-[#E4E7F5] bg-white p-5 dark:border-[var(--color-border)] dark:bg-[var(--color-card)]',
                'shadow-[0_2px_10px_-4px_rgba(15,23,42,0.08)]'
              )}
            >
              <CheckCircle2 size={20} className="shrink-0" style={{ color: '#22C55E' }} />
              <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                {item}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section
        className="hiw-cta mt-8 rounded-[1.5rem] px-6 py-10 text-center sm:px-10 sm:py-12"
        data-testid="how-cta"
      >
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: 'var(--color-text-primary)' }}>
          No account needed to get started
        </h2>
        <Link
          to="/test"
          data-testid="how-cta-button"
          className="mt-7 inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-base font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 active:scale-[0.98]"
          style={{
            background: 'linear-gradient(135deg, #4F46E5 0%, #7C6EF2 100%)',
            boxShadow: '0 10px 26px -8px rgba(79, 70, 229, 0.55)',
          }}
        >
          Try It Now <ArrowRight size={18} />
        </Link>
      </section>
    </main>
  );
}