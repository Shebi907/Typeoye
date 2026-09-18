import { Link } from 'react-router-dom';
import { ArrowRight, Gamepad2, GraduationCap, Heart, LineChart, Play, Target } from 'lucide-react';
import { useSeo } from '../hooks/useSeo';

const STATS = [
  { value: '16', label: 'Guided lessons' },
  { value: '100%', label: 'Free, always' },
  { value: '0', label: 'Sign-up required to start' },
];

const DIFFERENTIATORS = [
  {
    title: 'A real curriculum, not just drills',
    description:
      'Sixteen lessons in four stages — Foundation, Building Blocks, Flow & Rhythm, and Advanced — take you from the home row to numbers, symbols, and professional text in a sensible order. You never have to wonder what to do next.',
    icon: GraduationCap,
    color: '#4F46E5',
    bg: 'rgba(79, 70, 229, 0.1)',
  },
  {
    title: 'Practice that targets your actual gaps',
    description:
      'Drill characters, key combinations, words, sentences, paragraphs, or your own text at easy, medium, or hard difficulty. Quick Practice reads your recent results and recommends a session aimed at exactly what you need.',
    icon: Target,
    color: '#22C55E',
    bg: 'rgba(34, 197, 94, 0.1)',
  },
  {
    title: 'Feedback that tells you what to fix',
    description:
      'Every session reports your WPM, your accuracy, and the weak keys hiding behind your errors. Your progress is charted over time, so improvement is visible — and so is the one key that still needs work.',
    icon: LineChart,
    color: '#0EA5E9',
    bg: 'rgba(14, 165, 233, 0.12)',
  },
  {
    title: 'Practice that sometimes feels like play',
    description:
      'Typing Race, Falling Words, and Sudden Death keep the drill playful. Consistency is easier when practice doesn’t always feel like practice.',
    icon: Gamepad2,
    color: '#F5A623',
    bg: 'rgba(245, 166, 35, 0.12)',
  },
];

const STEPS = [
  { title: 'Take a real test', body: 'A timed test from one to ten minutes gives you an honest WPM and accuracy number.' },
  { title: 'Find your weak spots', body: 'Every result shows the weak keys behind your errors, so you know what to practice.' },
  { title: 'Learn in order', body: 'Follow the sixteen lessons from Foundation to Advanced, and drill any keys or patterns that trip you up.' },
  { title: 'Watch the trend move', body: 'With a free account, every session is saved and charted, so progress over weeks is visible.' },
  { title: 'Earn your certificate', body: 'Pass the 30 WPM / 90% accuracy bar in a single test to unlock a free downloadable certificate.' },
];

export default function AboutUs() {
  useSeo({
    title: 'About TypeOye | Free Typing Platform for Tests, Lessons & Practice',
    description:
      'TypeOye is a free, ad-free typing platform with honest typing tests, 16 guided lessons, focused practice drills, typing games, certificates, and progress tracking.',
    canonicalPath: '/about',
  });

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
        <p className="readable-text mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[var(--color-text-secondary)] sm:text-lg">
          Typeoye is a free typing platform with one job: to make fast, accurate typing something anyone can
          learn. Everything here — tests, lessons, practice drills, and games — exists to help you type better,
          and none of it is locked behind ads or a paywall.
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

      {/* What Typeoye is */}
      <section className="mx-auto mt-14 max-w-5xl" data-testid="about-intro">
        <h2 className="text-center text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: 'var(--color-text-primary)' }}>
          What Typeoye is
        </h2>
        <div className="readable-text mx-auto mt-6 flex max-w-3xl flex-col gap-5 text-base leading-relaxed text-[var(--color-text-secondary)]">
<p>
            Typeoye is a complete typing practice platform. A timed test — one to ten minutes — gives you
            instant WPM and accuracy, measured honestly: one correctly typed word counts, whatever its
            length. Sixteen guided lessons take you from the home row up to professional text, and focused
            drills let you practice characters, combinations, words, sentences, paragraphs, or your own
            pasted text.
          </p>
          <p>
            When you want practice that feels like play, there are typing games. And because improvement sticks best when you can see it, accounts save every
            result, chart it over time, and award a free certificate once you cross the 30 WPM / 90%
            accuracy bar. Typeoye is for students, job seekers, working professionals, and anyone who
            has decided to finally learn to touch type.
          </p>
        </div>
      </section>

      {/* Why we built this */}
      <section
        className="mx-auto mt-14 max-w-5xl rounded-[1.5rem] bg-[#F5F6FC] px-5 py-12 sm:px-10 sm:py-14 dark:border dark:border-[#333340] dark:bg-[#1C1E2E]"
        data-testid="about-why"
      >
        <h2 className="text-center text-2xl font-extrabold tracking-tight sm:text-3xl text-[#17171F] dark:text-white">
          Why Typeoye exists
        </h2>
        <div className="readable-text mx-auto mt-6 flex max-w-3xl flex-col gap-5 text-base leading-relaxed text-[#3A3A46] dark:text-[#9294B0]">
          <p>
            Most of us were never actually taught to type. School handed us a keyboard and told us to get on with
            it, so we invented our own habits — hunting for keys, typing with two fingers, never looking at the
            screen long enough to build real muscle memory. The usual tools don’t fix that. Free typing sites bury
            the practice under ads and pop-ups; premium courses lock even basic lessons behind a subscription.
          </p>
          <p>
            Typeoye exists to be the middle path: a genuinely useful, ad-free place where the product is the
            practice, not the distraction. Our goal is deliberately uncomplicated — give people a clear path from
            hunt-and-peck to confident touch typing, and let them watch real, honest progress along the way.
          </p>
        </div>
      </section>

      {/* What makes us different */}
      <section className="mx-auto mt-14 max-w-5xl">
        <h2 className="text-center text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: 'var(--color-text-primary)' }}>
          What makes Typeoye different
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2" data-testid="about-values">
          {DIFFERENTIATORS.map((value) => {
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

      {/* How it works */}
      <section className="mx-auto mt-14 max-w-5xl" data-testid="about-how">
        <h2 className="text-center text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: 'var(--color-text-primary)' }}>
          How it works
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((step, i) => (
            <div key={step.title} className="card flex flex-col p-5" data-testid="about-step">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-extrabold text-white"
                style={{ background: 'linear-gradient(135deg, #4361EE 0%, #7C3AED 100%)' }}
              >
                {i + 1}
              </span>
              <h3 className="mt-3 text-sm font-bold leading-tight" style={{ color: 'var(--color-text-primary)' }}>
                {step.title}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                {step.body}
              </p>
            </div>
          ))}
        </div>
        <p className="readable-text mx-auto mt-6 max-w-3xl text-center text-base leading-relaxed text-[var(--color-text-secondary)]">
          It’s a simple loop on purpose: test, find the gap, practice, repeat — with no subscription and
          nothing to buy.
        </p>
      </section>

      {/* Bottom CTA */}
      <section
        className="mt-14 rounded-[1.5rem] bg-[#EEF0FF] px-6 py-10 text-center sm:px-10 sm:py-12 dark:border dark:border-[#333340] dark:bg-[#1C1E2E]"
        data-testid="about-cta"
      >
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-[#17171F] dark:text-white">
          Ready to see what you can actually type?
        </h2>
        <p className="readable-text mx-auto mt-3 max-w-xl text-base leading-relaxed text-[#3A3A46] dark:text-[#9294B0]">
          No sign-up required to start — take a real test and get a real number, or begin with the very first lesson.
        </p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/test"
            data-testid="about-cta-button"
            className="inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-base font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #4361EE 0%, #7C3AED 100%)',
              boxShadow: '0 10px 26px -8px rgba(67, 97, 238, 0.55)',
            }}
          >
            Take a Typing Test <ArrowRight size={18} />
          </Link>
          <Link
            to="/lessons"
            className="inline-flex items-center gap-2 rounded-xl border border-[#4361EE]/30 bg-white/70 px-8 py-3.5 text-base font-bold text-[#4361EE] transition-all duration-200 hover:-translate-y-0.5 hover:bg-white active:scale-[0.98] dark:bg-transparent dark:text-[#A5B4FF] dark:hover:bg-white/5"
          >
            <Play size={16} /> Explore the Lessons
          </Link>
        </div>
      </section>
    </main>
  );
}