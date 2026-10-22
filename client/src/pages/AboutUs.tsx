import { Link } from 'react-router-dom';
import { ArrowRight, Gamepad2, GraduationCap, Heart, LineChart, Play, Target } from 'lucide-react';
import { useSeo } from '../hooks/useSeo';

const STATS = [
  { value: '16', label: 'English guided lessons' },
  { value: '100%', label: 'Free, always' },
  { value: '0', label: 'Sign-up required to start' },
];

const DIFFERENTIATORS = [
  {
    title: 'Structured English typing lessons',
    description:
      'Sixteen lessons in four stages — Foundation, Building Blocks, Flow & Rhythm, and Advanced — take you from the home row to numbers, symbols, and professional text in a sensible order.',
    icon: GraduationCap,
    color: '#4F46E5',
    bg: 'rgba(79, 70, 229, 0.1)',
  },
  {
    title: 'Learn and practise Urdu typing',
    description:
      'Use Urdu Learn, Urdu typing tests, and focused practice to build speed and accuracy with the phonetic keyboard. Work through guided lessons and grow more confident typing Urdu online.',
    icon: GraduationCap,
    color: '#0F9F91',
    bg: 'rgba(20, 184, 166, 0.12)',
  },
  {
    title: 'Practice that targets your actual gaps',
    description:
      'Practise English or Urdu with focused exercises, from characters and words to sentences and longer passages. Choose the available drills and difficulty that fit what you want to work on.',
    icon: Target,
    color: '#22C55E',
    bg: 'rgba(34, 197, 94, 0.1)',
  },
  {
    title: 'Typing tests and useful feedback',
    description:
      'Take English or Urdu typing tests to check your speed and accuracy. Session results and weak-key feedback help you see where to focus next.',
    icon: LineChart,
    color: '#0EA5E9',
    bg: 'rgba(14, 165, 233, 0.12)',
  },
  {
    title: 'Live one-on-one typing challenges',
    description:
      'Create a challenge and invite another player with a code or shareable link. Race in real time, compare speed and accuracy, and make practice more interactive.',
    icon: Gamepad2,
    color: '#F5A623',
    bg: 'rgba(245, 166, 35, 0.12)',
  },
  {
    title: 'Progress, achievements, and milestones',
    description:
      'Signed-in users can follow their English and Urdu progress separately and earn achievements. English typing milestones can also qualify for a downloadable certificate.',
    icon: LineChart,
    color: '#7C3AED',
    bg: 'rgba(124, 58, 237, 0.1)',
  },
];

const STEPS = [
  { title: 'Take a real test', body: 'A timed test from one to ten minutes gives you an honest WPM and accuracy number.' },
  { title: 'Find your weak spots', body: 'Every result shows the weak keys behind your errors, so you know what to practice.' },
  { title: 'Learn in either language', body: 'Follow English or Urdu guided lessons, then practise the keys and patterns you want to improve.' },
  { title: 'Track your progress', body: 'Sign in to review your English and Urdu progress and achievements separately over time.' },
  { title: 'Reach typing milestones', body: 'Build your English typing skills and work toward an eligible downloadable certificate.' },
];

export default function AboutUs() {
  useSeo({
    title: 'About Typeoye | English and Urdu Typing Practice, Tests & Lessons',
    description:
      'Typeoye helps you improve English and Urdu typing with online practice, guided lessons, typing tests, live challenges, separate progress tracking, achievements, and English typing certificates.',
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
          Typeoye helps people improve English and Urdu typing through online typing practice, guided learning,
          and typing tests. Build speed and accuracy, track your progress, and practise in a way that suits you.
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
            Typeoye is an online typing practice platform for both English and Urdu. English Learn offers
            sixteen guided lessons, while Urdu Learn gives learners a dedicated path to practise Urdu typing
            with a phonetic keyboard. Typing tests in both languages help you assess speed and accuracy, and
            focused practice exercises give you a place to build those skills at your own pace.
          </p>
          <p>
            For a more interactive way to practise, create a live one-on-one Typing Challenge and invite
            another player with a challenge code or shared link. Signed-in users can review English and Urdu
            progress and achievements separately, and eligible English typing results can earn a downloadable
            certificate. Typeoye is for learners, students, job seekers, and anyone who wants to type with
            greater confidence.
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
            Typeoye exists to be a useful, ad-free place to practise both English and Urdu typing. Our goal is
            to give people clear ways to learn, test their skills, and build confidence, with progress and
            achievements kept distinct for each language.
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
          Ready to improve your English or Urdu typing?
        </h2>
        <p className="readable-text mx-auto mt-3 max-w-xl text-base leading-relaxed text-[#3A3A46] dark:text-[#9294B0]">
          Start with a typing test or explore a guided lesson, then keep practising at your own pace.
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
