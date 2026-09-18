import { useState } from 'react';
import { ArrowRight, ChevronDown, Headphones } from 'lucide-react';
import { SUPPORT_EMAIL } from '../config';
import { cn } from '../utils/cn';
import { useSeo } from '../hooks/useSeo';
import { useJsonLd } from '../hooks/useJsonLd';

const SITE_URL = 'https://www.typeoye.com';

interface FaqItem {
  q: string;
  a: string;
}

const FAQ_GROUPS: { category: string; items: FaqItem[] }[] = [
  {
    category: 'Getting Started',
    items: [
      {
        q: 'What is Typeoye?',
        a: 'Typeoye is a free typing practice platform that runs entirely in your browser — nothing to download and no sign-up needed to start. It combines timed typing tests, a structured 16-lesson Learn course, free-form Practice drills, three typing games, certificates, and a leaderboard. Every session is scored live and each result shows your WPM and accuracy instantly.',
      },
      {
        q: 'Is Typeoye free?',
        a: 'Yes, Typeoye is 100% free. Typing tests, practice drills, all 16 lessons, games, certificates, and the leaderboard are available with no subscription, no paywall, and no ads. Creating an account is also free and entirely optional.',
      },
      {
        q: 'Do I need an account to use Typeoye?',
        a: "No — you can take tests, practice, play games, and even earn a certificate as a guest. A free account adds what guests can't get: your results, history, and streaks are saved, lessons beyond Level 1 unlock, and you can appear on the leaderboard. Guest sessions are never saved.",
      },
      {
        q: 'What devices and browsers does Typeoye work on?',
        a: 'Typeoye is a responsive web app that works in current versions of Chrome, Edge, Firefox, and Safari on desktop and mobile. No installation is needed — just open the site and type. A physical or Bluetooth keyboard gives the most accurate results, especially on touchscreen devices.',
      },
    ],
  },
  {
    category: 'Typing Test',
    items: [
      {
        q: 'How is WPM calculated?',
        a: 'Typeoye counts each word you finish completely and correctly as exactly 1 word; a word containing a single mistake, or one you leave unfinished, counts as 0. Your WPM is correct words ÷ minutes — for example, 60 fully correct words in one minute equals 60 WPM. Typeoye does not use the older "one word = 5 characters" shortcut some other sites use.',
      },
      {
        q: 'How is accuracy calculated?',
        a: 'Accuracy is the share of attempted words you finished correctly: correct words ÷ attempted words × 100. Because scoring is word-based, 100% accuracy means every character of every word was right — small slips aren\'t hidden in per-character averages.',
      },
      {
        q: 'Can I choose how long the test is or how hard the words are?',
        a: 'Yes. On the typing test screen you pick a duration of 1, 2, 5, 10, or 15 minutes and a difficulty of Easy, Medium, or Hard — harder settings use longer, more complex words. Signed-in users can also enable numbers and punctuation from their settings, which adds extra characters to the generated text.',
      },
      {
        q: 'Are my results saved, and can I retake tests?',
        a: "Results are saved only when you are signed in — guests see their scores on screen, but nothing is stored. There's no limit on retakes: each run stands alone, and your saved history keeps every result so you can watch your WPM and accuracy trend over time.",
      },
    ],
  },
  {
    category: 'Practice & Learn',
    items: [
      {
        q: 'What is the difference between Practice and the Learn course?',
        a: "Practice is open-ended drilling you can run anytime — you pick the drill type, difficulty, and duration, or paste your own text. The Learn course is a structured 16-lesson path in four stages — Foundation, Building Blocks, Flow & Rhythm, and Advanced — that builds proper touch typing in order. Use Learn to build technique and Practice to target weak spots; both save results when you're signed in.",
      },
      {
        q: 'What drill types are available in Practice?',
        a: 'Practice offers six drill types: character, combination, word, sentence, paragraph, and quick drills, plus custom text you can paste yourself. Character and combination drills focus on specific keys and patterns, while word, sentence, and paragraph drills build up to full passages. Quick Practice looks at your recent results and recommends a targeted session.',
      },
      {
        q: 'How does lesson progression work, and can I skip lessons?',
        a: "Lessons unlock one at a time: you must complete a lesson — finishing its exercises at the required accuracy — to open the next one. There's no skip button, but you can move quickly through earlier exercises if you already know the material. Guests can only open Level 1; signing in unlocks all 16 levels.",
      },
    ],
  },
  {
    category: 'Games & Leaderboard',
    items: [
      {
        q: 'What typing games are available?',
        a: "There are three. Typing Race is a sprint to 60 words against a bot paced at your average WPM — beat it to win. Falling Words asks you to type words before they fall too far, with the speed picking up the longer you survive. Sudden Death Sprint ends after a single mistake unless you've earned a shield. Games are medium-to-hard difficulty and playable as a guest.",
      },
      {
        q: 'How does the leaderboard work?',
        a: 'The leaderboard ranks signed-in users by their best WPM on qualifying runs: completed timed typing tests and games that reached 90% accuracy or higher. Practice drills and Learn lessons never place. Your personal card always appears at the bottom of the board once you have a qualifying run, even outside the Top 50.',
      },
      {
        q: 'Is the leaderboard global or filtered by time period?',
        a: 'Both. The leaderboard covers all signed-in users, and tabs let you filter it by Today, This Week, This Month, or All Time. Selecting a period recalculates every user\'s best qualifying WPM within that window — a run can place highly on All Time while not appearing at all under Today.',
      },
    ],
  },
  {
    category: 'Certificate',
    items: [
      {
        q: 'How do I earn a certificate?',
        a: "Open the Certificate page, enter the name you want on it, pick a duration (1 to 15 minutes), and take the test. If you hit the required thresholds in that single run, you earn a Typeoye certificate you can download as a PDF. The test text is freshly generated for every attempt, so there's nothing to memorize.",
      },
      {
        q: 'What are the certificate requirements?',
        a: 'In one attempt you must reach at least 30 WPM and at least 90% accuracy — both thresholds in the same run. If speed is high but accuracy falls short, or the other way around, that attempt doesn\'t qualify. You can retry as many times as you like.',
      },
      {
        q: 'Can I download or share my certificate?',
        a: 'Yes. When a run qualifies, the certificate downloads as a PDF named Typeoye-Typing-Certificate-<your name>.pdf. There\'s no built-in social-share button, so share it by attaching the PDF to an email, uploading it to a profile, or printing it. You can retake the test later for a better certificate.',
      },
    ],
  },
  {
    category: 'Account & Data',
    items: [
      {
        q: 'How do I create an account?',
        a: "Click Get Started, then enter a username (3–20 characters using letters, numbers, or underscores), an email address, and a password of at least 8 characters. Pick a security question and answer — that's what you'll use to recover the account. Your account is created instantly, no confirmation email required, and you're signed in right away. You can also sign up with Google.",
      },
      {
        q: 'How do I reset my password if I forget it?',
        a: 'On the sign-in page, click Forgot Password, enter the email or username on the account, and answer the security question you set at signup. If correct, you have 10 minutes to set a new password of at least 8 characters. After five wrong answers, recovery is temporarily locked for 30 minutes to protect your account.',
      },
      {
        q: 'Is my data private, and how can I delete my account?',
        a: 'Your saved results, progress, and account details are stored securely and never sold to advertisers — Typeoye runs no ads at all. To delete your account, email contact.typeoye@gmail.com from the email address on the account; deletion is permanent and removes your saved results and progress. You can also simply stop signing in — unused accounts are never charged.',
      },
    ],
  },
];

const FAQS: FaqItem[] = FAQ_GROUPS.flatMap((group) => group.items);

const GROUP_RANGES = (() => {
  let index = 0;
  return FAQ_GROUPS.map((group) => {
    const start = index;
    index += group.items.length;
    return { category: group.category, start, end: index };
  });
})();

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
        {GROUP_RANGES.map((group, gi) => (
          <div key={group.category} className="flex flex-col gap-3.5">
            <div className={cn('flex items-center gap-2', gi === 0 ? 'pt-1' : 'pt-6')}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'linear-gradient(135deg, #4361EE 0%, #7C3AED 100%)' }} />
              <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-accent-text)' }}>
                {group.category}
              </h2>
            </div>
            {FAQS.slice(group.start, group.end).map((item, offset) => {
              const index = group.start + offset;
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
          </div>
        ))}
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
