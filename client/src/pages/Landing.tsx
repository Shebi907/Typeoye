import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Keyboard, BookOpen, Pencil, Gamepad2, Zap, Target, Trophy, Award,
  ArrowRight, ChevronRight,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useSeo } from '../hooks/useSeo';

const features = [
  {
    icon: Keyboard,
    title: 'Typing Test',
    description: 'Test your speed and accuracy with real-time results.',
    cta: 'Start Test',
    to: '/test',
  },
  {
    icon: Pencil,
    title: 'Practice',
    description: 'Practice with custom text and track steady improvement.',
    cta: 'Start Practice',
    to: '/practice',
  },
  {
    icon: BookOpen,
    title: 'Learn',
    description: 'Structured lessons that teach the best typing techniques.',
    cta: 'Start Learning',
    to: '/lessons',
  },
  {
    icon: Gamepad2,
    title: 'Games',
    description: 'Make typing fun with engaging typing games.',
    cta: 'Play Games',
    to: '/games',
  },
];

const benefits = [
  {
    icon: Zap,
    title: 'Build Speed',
    description: 'Quick tests and targeted drills help you type faster, one session at a time.',
  },
  {
    icon: Target,
    title: 'Improve Accuracy',
    description: 'Instant feedback highlights your weak keys so you can correct them early.',
  },
  {
    icon: Trophy,
    title: 'Track Progress',
    description: 'Watch your WPM and accuracy improve with clear, simple results.',
  },
];

/**
 * Marketing landing — guest Home page. Rendered inside the shared AppLayout
 * shell (navbar + footer), so it must stay a plain content block: no own
 * page wrapper, header, or footer (the shared layout provides those).
 */
export default function Landing() {
  useSeo({
    title: 'Free Typing Test & Learn Touch Typing Online | Typeoye',
    description: 'Take a free typing test, measure your WPM and accuracy, and learn touch typing online with structured lessons and real-time feedback.',
    canonicalPath: '/',
  });
  const [demoText] = useState('the quick brown fox jumps over');
  const [demoTyped] = useState('the quick brown ');

  return (
    <>
      {/* Hero */}
      <section className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-16 sm:pb-20 text-center overflow-hidden">
        <span className="dot-grid dot-grid-tl" aria-hidden="true" />
        <span className="dot-grid dot-grid-br" aria-hidden="true" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-28 -left-28 h-96 w-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(67, 97, 238, 0.18) 0%, transparent 70%)', filter: 'blur(48px)' }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-32 -right-24 h-80 w-80 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(124, 140, 248, 0.16) 0%, transparent 70%)', filter: 'blur(48px)' }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 h-56 w-full max-w-[36rem] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(67, 97, 238, 0.1) 0%, transparent 70%)', filter: 'blur(48px)' }}
        />
        <div className="relative z-10">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-6"
            style={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent-text)' }}
          >
            <Zap size={14} />
            Built for serious typists
          </div>

          <h1
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Master the Keyboard.
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #4361ee 0%, #7c8cf8 55%, #a5b4fc 100%)' }}
            >
              One Word at a Time.
            </span>
          </h1>

          <p className="readable-text text-base sm:text-lg max-w-2xl mx-auto mb-10 px-2" style={{ color: 'var(--color-text-secondary)' }}>
            Typeoye combines structured lessons, real-time feedback, and adaptive practice
            to make you a faster, more accurate typist — starting today.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-12 sm:mb-16">
            <Link to="/test">
              <Button size="lg" variant="primary" icon={<Keyboard size={18} />}>
                Start Typing Test <ArrowRight size={18} />
              </Button>
            </Link>
            <Link to="/lessons">
              <Button size="lg" variant="ghost" icon={<ChevronRight size={18} />}>
                Browse Lessons
              </Button>
            </Link>
          </div>

          {/* Demo typing preview */}
          <div
            className="card p-5 sm:p-8 max-w-2xl mx-auto text-left overflow-hidden"
            style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '1.25rem', lineHeight: 2 }}
          >
            <div className="text-xs font-semibold uppercase tracking-widest mb-4"
              style={{ color: 'var(--color-text-muted)', fontFamily: 'Inter, sans-serif' }}>
              Live preview
            </div>
            <div>
              {demoText.split('').map((char, i) => {
                const typedChar = demoTyped[i];
                const isCurrent = i === demoTyped.length;
                let cls = 'char-pending';
                if (isCurrent) cls = 'char-current';
                else if (typedChar !== undefined) cls = typedChar === char ? 'char-correct' : 'char-error';
                return (
                  <span key={i} className="relative">
                    {isCurrent && <span className="typing-caret" />}
                    <span className={cls}>{char}</span>
                  </span>
                );
              })}
            </div>
            <div className="mt-4 flex gap-6 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
              <span style={{ color: 'var(--color-accent-text)' }}>72 WPM</span>
              <span style={{ color: 'var(--color-correct)' }}>96% accuracy</span>
              <span style={{ color: 'var(--color-text-muted)' }}>42s remaining</span>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20">
        <h2
          className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-3"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Everything You Need to Improve
        </h2>
        <p className="readable-text text-center max-w-2xl mx-auto mb-12 sm:mb-14" style={{ color: 'var(--color-text-secondary)' }}>
          Powerful tools and fun games to make typing practice enjoyable and effective.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {features.map(({ icon: Icon, title, description, cta, to }) => (
            <div key={title} className="card card-hover p-6 flex flex-col">
              <div className="land-feature-icon w-11 h-11 rounded-xl flex items-center justify-center mb-4">
                <Icon size={20} />
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                {title}
              </h3>
              <p className="text-sm mb-5 flex-1" style={{ color: 'var(--color-text-secondary)' }}>
                {description}
              </p>
              <Link
                to={to}
                className="group inline-flex items-center gap-1.5 text-sm font-bold"
                style={{ color: 'var(--color-accent-text)' }}
              >
                {cta}
                <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* WHY CHOOSE TYPEOYE */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-8">
        <div className="rounded-[1.25rem] sm:rounded-[1.75rem] px-4 sm:px-6 py-12 sm:py-16 lg:py-20" style={{ backgroundColor: 'var(--color-accent-light)' }}>
          <h2
            className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-2"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Why Choose TypeOye?
          </h2>
          <p className="readable-text text-lg text-center mb-12 sm:mb-14" style={{ color: 'var(--color-text-secondary)' }}>
            Simple. Effective. Free.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
            {benefits.map(({ icon: Icon, title, description }) => (
              <div key={title} className="card card-hover p-8 text-center">
                <div className="land-benefit-icon w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-5"
                  style={{
                    background: 'linear-gradient(135deg, rgba(67, 97, 238, 0.12) 0%, rgba(139, 92, 246, 0.16) 100%)',
                  }}
                >
                  <Icon size={24} />
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                  {title}
                </h3>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CERTIFICATE CTA */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20">
        <div
          className="cert-cta relative overflow-hidden rounded-[1.25rem] sm:rounded-[1.75rem] px-4 sm:px-6 py-12 sm:py-16 lg:py-20 text-center"
        >
          <span className="dot-grid dot-grid-tl" aria-hidden="true" />
          <span className="dot-grid dot-grid-br" aria-hidden="true" />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(139, 92, 246, 0.16) 0%, transparent 70%)', filter: 'blur(40px)' }}
          />

          <div
            className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-5"
            style={{
              background: 'linear-gradient(135deg, #4361EE 0%, #7C3AED 100%)',
              color: '#ffffff',
              boxShadow: '0 8px 20px -6px rgba(67, 97, 238, 0.5)',
            }}
          >
            <Award size={26} />
          </div>

          <h2
            className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Get Your Typing Certificate
          </h2>
          <p className="readable-text text-lg max-w-xl mx-auto mb-8" style={{ color: 'var(--color-text-secondary)' }}>
            Prove your typing skills with a TypeOye typing certificate.
          </p>
          <Link to="/certificate" className="landing-cta">
            Learn More
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </>
  );
}