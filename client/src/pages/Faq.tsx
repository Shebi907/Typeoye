import { useState } from 'react';
import { ArrowRight, ChevronDown, Headphones } from 'lucide-react';
import { SUPPORT_EMAIL } from '../config';
import { cn } from '../utils/cn';
import { useSeo } from '../hooks/useSeo';
import { useJsonLd } from '../hooks/useJsonLd';

const SITE_URL = 'https://www.typeoye.com';

const FAQS = [
  {
    q: 'Do I need an account to use Typeoye?',
    a: "No, you can use most of Typeoye's features without creating an account. However, creating a free account allows you to save your progress, track statistics, and earn certificates.",
  },
  {
    q: 'Is Typeoye free?',
    a: 'Yes, Typeoye provides free typing tests, practice exercises, lessons, and other features to help you improve your typing skills.',
  },
  {
    q: 'How is WPM calculated?',
    a: 'WPM (Words Per Minute) measures how many standard words you type in one minute. Your result is calculated based on your typing speed and accuracy.',
  },
  {
    q: 'What do I need to earn a certificate?',
    a: 'Complete the required typing test and meet the certificate requirements shown on the Certificate page to earn your Typeoye typing certificate.',
  },
  {
    q: 'Can I use Typeoye on mobile?',
    a: 'Yes, Typeoye is responsive and can be accessed on mobile devices. For the best typing experience, a desktop or laptop keyboard is recommended.',
  },
  {
    q: 'How do I improve my typing speed?',
    a: "Practice regularly, focus on accuracy first, learn proper finger placement, and gradually increase your typing speed through Typeoye's tests, practice exercises, and lessons.",
  },
  {
    q: 'Is my guest progress saved?',
    a: 'Guest progress may be limited. Create an account to securely save your typing results, progress, statistics, and achievements.',
  },
];

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  useSeo({
    title: 'Typing FAQ | TypeOye',
    description:
      'Answers to common questions about TypeOye typing tests, lessons, practice drills, WPM and accuracy, certificates, and account management.',
    canonicalPath: '/faq',
  });

  useJsonLd({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${SITE_URL}/faq#faqpage`,
    url: `${SITE_URL}/faq`,
    mainEntity: FAQS.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  });

  const toggle = (index: number) => setOpen((prev) => (prev === index ? null : index));

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
      {/* Header */}
      <section className="relative mx-auto max-w-3xl pb-10 pt-6 text-center sm:pt-10">
        <span className="dot-grid dot-grid-tl" aria-hidden="true" />
        <span className="dot-grid dot-grid-tr" aria-hidden="true" />
        <div
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-white"
          style={{
            background: 'linear-gradient(135deg, #4361EE 0%, #7C3AED 100%)',
            boxShadow: '0 8px 20px -6px rgba(67, 97, 238, 0.5)',
          }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <path d="M12 17h.01" />
          </svg>
        </div>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: 'var(--color-text-primary)' }}>
          Frequently Asked <span style={{ background: 'linear-gradient(135deg, #4361EE 0%, #7C3AED 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>Questions</span>
        </h1>
        <p className="readable-text mt-3 text-base leading-relaxed text-[var(--color-text-secondary)] sm:text-lg">
          Everything you need to know about Typeoye.
        </p>
        <div className="mx-auto mt-5 h-0.5 w-16 rounded-full" style={{ background: 'linear-gradient(90deg, #4361EE 0%, #7C3AED 100%)' }} />
      </section>

      {/* Accordion */}
      <section className="mx-auto flex max-w-[64rem] flex-col gap-3.5" data-testid="faq-list">
        {FAQS.map((item, index) => {
          const isOpen = open === index;
          return (
            <div
              key={item.q}
              data-testid="faq-item"
              className="overflow-hidden rounded-[1rem] border bg-[var(--color-card)] transition-all duration-200"
              style={{
                borderColor: 'var(--color-border)',
                boxShadow: isOpen ? '0 10px 30px -14px rgba(23, 23, 31, 0.18)' : '0 4px 14px -10px rgba(23, 23, 31, 0.10)',
              }}
            >
              <button
                type="button"
                onClick={() => toggle(index)}
                aria-expanded={isOpen}
                aria-controls={`faq-panel-${index}`}
                className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors duration-150 sm:px-6"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.625rem] transition-colors duration-200"
                  style={{
                    backgroundColor: isOpen ? 'rgba(67, 97, 238, 0.16)' : 'var(--color-accent-light)',
                    color: isOpen ? '#4361ee' : '#7C3AED',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <path d="M12 17h.01" />
                  </svg>
                </span>
                <span
                  className="flex-1 text-sm font-bold transition-colors duration-150 sm:text-base"
                  style={{ color: isOpen ? '#17171F' : 'var(--color-text-primary)' }}
                >
                  {item.q}
                </span>
                <ChevronDown
                  size={18}
                  className={cn('shrink-0 transition-transform duration-300', isOpen && 'rotate-180')}
                  style={{ color: isOpen ? '#4361EE' : 'var(--color-text-muted)' }}
                />
              </button>
              <div
                id={`faq-panel-${index}`}
                role="region"
                className={cn('grid transition-all duration-300 ease-in-out', isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}
              >
                <div className="overflow-hidden">
                  <div
                    className="mx-4 mb-4 border-l-2 pl-4 pt-0.5 sm:mx-6"
                    style={{ borderColor: 'rgba(67, 97, 238, 0.35)' }}
                  >
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Support CTA */}
      <section className="mx-auto mt-12 max-w-[64rem]" data-testid="faq-cta">
        <div
          className="flex flex-col items-center justify-between gap-5 rounded-[1.25rem] px-6 py-6 text-center sm:flex-row sm:px-8 sm:text-left"
          style={{ background: 'linear-gradient(135deg, #EEF1FD 0%, #F4EDFD 100%)' }}
        >
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-4">
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white"
              style={{ background: 'linear-gradient(135deg, #4361EE 0%, #7C3AED 100%)', boxShadow: '0 8px 20px -8px rgba(67, 97, 238, 0.6)' }}
            >
              <Headphones size={22} strokeWidth={2} />
            </span>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight sm:text-xl" style={{ color: '#17171F' }}>
                Still have questions?
              </h2>
              <p className="mt-0.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                We're here to help! Contact our support team.
              </p>
            </div>
          </div>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            data-testid="faq-cta-button"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #4361EE 0%, #7C3AED 100%)',
              boxShadow: '0 8px 20px -8px rgba(67, 97, 238, 0.55)',
            }}
          >
            Contact Support <ArrowRight size={16} />
          </a>
        </div>
      </section>
    </main>
  );
}
