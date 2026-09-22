import React, { useEffect, useRef, useState } from 'react';
import {
  ShieldCheck, ScrollText, Calendar, ChevronDown, Sparkles, User, Award,
  Copyright, CloudOff, Ban, Mail, FileText, Lock, Info,
} from 'lucide-react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { SUPPORT_EMAIL } from '../config';
import { useSeo } from '../hooks/useSeo';

type SectionId =
  | 'service-description'
  | 'account-responsibilities'
  | 'certificate-and-leaderboard'
  | 'intellectual-property'
  | 'service-availability-and-advertising'
  | 'account-termination-and-changes'
  | 'contact-us';

const LINK_STYLE = {
  fontWeight: 600,
  color: 'var(--color-accent-text)',
} as const;

interface TermsSection {
  id: SectionId;
  number: string;
  title: string;
  preview: string;
  icon: React.ElementType;
  content: React.ReactNode;
}

const SECTIONS: TermsSection[] = [
  {
    id: 'service-description',
    number: '01',
    title: 'Service Description',
    preview: 'What Typeoye offers, that it is free, and how guest use works.',
    icon: Sparkles,
    content: (
      <>
        <p>
          Typeoye is an online typing platform. It is <strong>free to use</strong>, and there is currently
          no paid tier or subscription. The service offers:
        </p>
        <ul>
          <li>
            <strong>Typing tests</strong> — timed tests you can adjust from 1 to 15 minutes at Easy,
            Medium, or Hard difficulty.
          </li>
          <li>
            <strong>Practice drills</strong> — free-form drills (character, combination, word, sentence,
            paragraph, and quick), plus pasting your own custom text.
          </li>
          <li>
            <strong>The Learn course</strong> — a structured 16-lesson path across four stages that
            unlocks one lesson at a time.
          </li>
          <li>
            <strong>Games</strong> — Typing Race, Falling Words, and Sudden Death Sprint.
          </li>
          <li>
            <strong>Certificates</strong> — a downloadable PDF you can earn by meeting the requirements
            described in section 03.
          </li>
          <li>
            <strong>A leaderboard</strong> and 1v1 typing challenges.
          </li>
        </ul>
        <p>
          You can use Typeoye <strong>without an account</strong>: guests can take tests, practice, play
          games, and earn certificates, but <strong>guest sessions are never saved</strong>. If you want
          your results, progress, and streaks to be stored — or to appear on the leaderboard — create a
          free account. These terms apply to all use of the service, whether or not you sign in.
        </p>
      </>
    ),
  },
  {
    id: 'account-responsibilities',
    number: '02',
    title: 'Account Responsibilities',
    preview: 'Your duties when creating and using a Typeoye account.',
    icon: User,
    content: (
      <>
        <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          Accurate information
        </p>
        <p>
          When you create an account you provide a username, email address, and a security question and
          answer. You agree to give truthful, current information and to keep it up to date. One account
          per person is expected; creating extra accounts to manipulate rankings or achievements is not
          allowed.
        </p>
        <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          Keeping your credentials safe
        </p>
        <p>
          You are responsible for your password and sign-in method. Don't share them, and if you think
          your account has been compromised, reset your password or contact us. Activity on your account
          is your responsibility.
        </p>
        <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          No abuse of the platform
        </p>
        <p>
          Don't use automation of any kind to take tests or inflate typing scores, and don't try to
          manipulate your WPM, accuracy, or leaderboard position. Don't interfere with the service,
          attempt to access other users' data, or use Typeoye for anything unlawful. To be clear, using
          logins, bots, scripts, or automated tools to take tests or boost leaderboard rankings is a
          violation of these terms.
        </p>
        <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          Custom text
        </p>
        <p>
          If you paste your own custom text for practice, you're responsible for it: don't submit text
          that violates others' rights or any applicable law.
        </p>
      </>
    ),
  },
  {
    id: 'certificate-and-leaderboard',
    number: '03',
    title: 'Certificate & Leaderboard Disclaimer',
    preview: 'What a Typeoye certificate and leaderboard ranking actually represent.',
    icon: Award,
    content: (
      <>
        <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          What the certificate is
        </p>
        <p>
          A Typeoye certificate is a skill-achievement record produced by Typeoye and generated as a PDF
          you can download. It is awarded when a <strong>single</strong> test meets <strong>both</strong>{' '}
          thresholds: <strong>at least 30 WPM</strong> and <strong>at least 90% accuracy</strong> in the
          same run.
        </p>
        <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          It is not an accredited qualification
        </p>
        <p>
          The certificate is <strong>not</strong> an officially accredited, certified, or
          government-recognized qualification. It documents typing performance measured under Typeoye's
          own scoring rules (WPM counts fully correct words; accuracy is correct words divided by
          attempted words). We do not warrant that any employer, school, or other institution will accept
          it — confirming that is up to you.
        </p>
        <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          How the leaderboard works
        </p>
        <p>
          The leaderboard ranks signed-in users by their best WPM on qualifying runs: timed typing tests
          and games finished at <strong>90% accuracy or higher</strong>. Rankings can be filtered by
          period (Today, This Week, This Month, or All Time) and reflect performance under Typeoye's own
          scoring and measurement, not any external standard. Rankings change as new qualifying runs are
          recorded.
        </p>
      </>
    ),
  },
  {
    id: 'intellectual-property',
    number: '04',
    title: 'Intellectual Property',
    preview: 'Ownership of the service and how your custom text is handled.',
    icon: Copyright,
    content: (
      <p>
        Typeoye owns the service and its content: the code, design, branding, lessons, exercises,
        practice texts, and certificate design are protected by applicable intellectual property laws.
        You may use them only as part of using the service and may not copy, redistribute, or reuse
        Typeoye's content for other purposes without our permission, although you may keep and share the
        certificate PDF you earn. Custom text you provide for practice remains your own content: we
        process it only to provide the feature and do not publish it.
      </p>
    ),
  },
  {
    id: 'service-availability-and-advertising',
    number: '05',
    title: 'Service Availability & Advertising',
    preview: 'How the service is provided and how advertising works.',
    icon: CloudOff,
    content: (
      <>
        <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          As is
        </p>
        <p>
          Typeoye is provided <strong>"as is" and "as available"</strong> without warranties of any kind,
          including no guarantee of uninterrupted availability or error-free results. We work to keep the
          service running, but it may be unavailable from time to time for maintenance or technical
          issues, and we are not liable for interruptions or lost data.
        </p>
        <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          Advertising
        </p>
        <p>
          Typeoye has a Google AdSense account linked to this domain. As of the date of these terms, the
          site does not display advertisements. If and when advertisements are shown, they are served by
          Google AdSense, which may use its own cookies and similar technologies as described in our
          Privacy Policy. We are not responsible for the content of third-party ads.
        </p>
      </>
    ),
  },
  {
    id: 'account-termination-and-changes',
    number: '06',
    title: 'Account Termination & Changes',
    preview: 'When accounts may be suspended and how these terms may change.',
    icon: Ban,
    content: (
      <>
        <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          Termination
        </p>
        <p>
          We may suspend or terminate accounts that violate these terms — including cheating, automation,
          abuse, or unlawful activity — at our discretion and with or without notice where appropriate.
          You may stop using the service at any time. To have your account and data deleted, contact us
          (deletion is currently handled manually — see our Privacy Policy). Guests have nothing to
          delete, because guest sessions are never saved.
        </p>
        <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          Changes to these terms
        </p>
        <p>
          We may update these terms as the service evolves or for legal, operational, or regulatory
          reasons. Updates are posted on this page with the date shown at the top. Continuing to use
          Typeoye after changes take effect means you accept the updated terms; for significant changes
          we will aim to give reasonable notice on the site.
        </p>
      </>
    ),
  },
  {
    id: 'contact-us',
    number: '07',
    title: 'Contact Us',
    preview: 'Questions or concerns about these terms and conditions.',
    icon: Mail,
    content: (
      <p>
        If you have any questions or concerns regarding these Terms and Conditions, please contact us at{' '}
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="font-semibold hover:underline"
          style={LINK_STYLE}
        >
          {SUPPORT_EMAIL}
        </a>
        .
      </p>
    ),
  },
];

const TERMS_LAST_UPDATED = 'September 18, 2026';

function HeroBadge({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[0.8125rem] font-semibold"
      style={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent-text)' }}
    >
      <Icon size={15} strokeWidth={2.2} />
      {label} <span style={{ color: 'var(--color-text-secondary)' }}>{value}</span>
    </span>
  );
}

export default function Terms() {
  useSeo({
    title: 'Terms and Conditions | TypeOye',
    description:
      'Read the TypeOye terms and conditions covering the free typing test, practice drills, 16-lesson Learn course, games, certificates, and leaderboard, including account rules and disclaimers.',
    canonicalPath: '/terms',
  });
  const lastUpdated = TERMS_LAST_UPDATED;
  const [open, setOpen] = useState<SectionId | null>('service-description');
  const [activeId, setActiveId] = useState<SectionId>('service-description');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id as SectionId;
            if (SECTIONS.some((s) => s.id === id)) setActiveId(id);
          }
        }
      },
      { rootMargin: '-20% 0px -65% 0px', threshold: 0 }
    );
    SECTIONS.forEach((s) => {
      const el = sectionRefs.current[s.id];
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: SectionId) => {
    const el = sectionRefs.current[id];
    if (el) {
      const y = el.getBoundingClientRect().top + window.pageYOffset - 88;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
    setOpen(id);
    setMobileNavOpen(false);
  };

  const toggle = (id: SectionId) => {
    setOpen((cur) => (cur === id ? null : id));
  };

  return (
    <PageWrapper noHeader>
      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{
            background:
              'radial-gradient(600px 320px at 12% -10%, rgba(67,97,238,0.10), transparent 60%), radial-gradient(520px 300px at 95% 0%, rgba(139,92,246,0.12), transparent 60%)',
          }}
        />
        <div className="relative mx-auto max-w-[106.25rem] px-4 sm:px-6 pt-12 pb-10 sm:pt-16 sm:pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-10 lg:gap-12 items-center">
            {/* Left — copy */}
            <div>
              <span
                className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider"
                style={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent-text)' }}
              >
                <ScrollText size={14} style={{ color: 'var(--color-accent-text)' }} />
                Legal &amp; Agreement
              </span>
              <h1
                className="mt-5 text-4xl sm:text-5xl font-extrabold tracking-tight"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Terms and Conditions
              </h1>
              <span
                className="mt-3 block h-1 w-16 rounded-full"
                style={{ background: 'linear-gradient(90deg, #4361EE, #8B5CF6)' }}
                aria-hidden="true"
              />
              <p className="readable-text mt-5 max-w-xl text-base sm:text-lg leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                Please read these terms before using Typeoye. They describe what the service offers,
                the rules for using it, and how certificates and leaderboard rankings work. By accessing
                or using Typeoye, you agree to these terms.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <HeroBadge icon={Calendar} label="Last updated:" value={lastUpdated} />
                <HeroBadge icon={ShieldCheck} label="Effective date:" value={lastUpdated} />
              </div>
            </div>

            {/* Right — illustration */}
            <div className="relative flex items-center justify-center py-6 lg:py-2">
              <div
                className="relative flex items-center justify-center"
                style={{
                  width: 'min(300px, 80vw)',
                  aspectRatio: '1 / 1',
                  background:
                    'radial-gradient(circle at 30% 25%, rgba(99,102,241,0.18), transparent 55%), radial-gradient(circle at 75% 75%, rgba(139,92,246,0.20), transparent 55%)',
                }}
                aria-hidden="true"
              >
                {/* Floating deco icons */}
                <span
                  className="absolute left-2 top-8 flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{
                    backgroundColor: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    boxShadow: '0 12px 30px -12px rgba(67,97,238,0.35)',
                    color: 'var(--color-accent-text)',
                  }}
                >
                  <FileText size={22} />
                </span>
                <span
                  className="absolute right-0 top-16 flex h-11 w-11 items-center justify-center rounded-2xl"
                  style={{
                    backgroundColor: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    boxShadow: '0 12px 30px -12px rgba(67,97,238,0.35)',
                    color: 'var(--color-accent-text)',
                  }}
                >
                  <Lock size={20} />
                </span>
                <span
                  className="absolute bottom-6 left-8 flex h-11 w-11 items-center justify-center rounded-2xl"
                  style={{
                    backgroundColor: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    boxShadow: '0 12px 30px -12px rgba(67,97,238,0.35)',
                    color: 'var(--color-accent-text)',
                  }}
                >
                  <Info size={20} />
                </span>
                {/* Main document */}
                <div
                  className="relative flex items-center justify-center rounded-[2rem]"
                  style={{
                    width: 'min(190px, 52vw)',
                    aspectRatio: '1 / 1',
                    background:
                      'linear-gradient(150deg, rgba(67,97,238,0.92), rgba(99,102,241,0.92) 45%, rgba(139,92,246,0.92))',
                    boxShadow:
                      '0 25px 60px -18px rgba(67,97,238,0.6), 0 0 0 12px rgba(139,92,246,0.08), 0 0 0 26px rgba(67,97,238,0.05)',
                  }}
                >
                  <ScrollText size={72} strokeWidth={1.6} style={{ color: '#ffffff' }} />
                  <span
                    className="absolute flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm"
                    style={{ bottom: '1.125rem' }}
                  >
                    <ShieldCheck size={26} style={{ color: '#ffffff' }} />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT ────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[106.25rem] px-4 sm:px-6 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 lg:gap-10">
          {/* LEFT SIDEBAR */}
          <aside>
            {/* Mobile dropdown */}
            <div className="lg:hidden mb-5">
              <button
                type="button"
                onClick={() => setMobileNavOpen((v) => !v)}
                className="flex w-full items-center justify-between rounded-2xl px-5 py-4 text-left font-bold"
                style={{
                  backgroundColor: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  boxShadow: '0 8px 24px -14px rgba(23,23,31,0.25)',
                  color: 'var(--color-text-primary)',
                }}
                aria-expanded={mobileNavOpen}
              >
                <span>On this page</span>
                <ChevronDown
                  size={18}
                  style={{ color: 'var(--color-accent-text)', transform: mobileNavOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}
                />
              </button>
              {mobileNavOpen && (
                <div
                  className="mt-2 overflow-hidden rounded-2xl"
                  style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', boxShadow: '0 18px 40px -18px rgba(23,23,31,0.3)' }}
                >
                  {SECTIONS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => scrollToSection(s.id)}
                      className="flex w-full items-center gap-2.5 px-5 py-3 text-left text-sm font-medium"
                      style={{
                        color: activeId === s.id ? 'var(--color-accent-text)' : 'var(--color-text-secondary)',
                        backgroundColor: activeId === s.id ? 'var(--color-accent-light)' : 'transparent',
                      }}
                    >
                      <span className="text-xs font-bold tabular-nums">{s.number}</span>
                      {s.title}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Desktop sticky */}
            <div className="hidden lg:block lg:sticky lg:top-24 space-y-5">
              <nav
                className="rounded-3xl p-5"
                style={{
                  backgroundColor: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  boxShadow: '0 12px 32px -18px rgba(23,23,31,0.25)',
                }}
                aria-label="On this page"
              >
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                  On this page
                </h2>
                <ul className="space-y-1">
                  {SECTIONS.map((s) => {
                    const isActive = activeId === s.id;
                    return (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => scrollToSection(s.id)}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[0.84375rem] font-medium transition-colors"
                          style={{
                            color: isActive ? 'var(--color-accent-text)' : 'var(--color-text-secondary)',
                            backgroundColor: isActive ? 'var(--color-accent-light)' : 'transparent',
                            borderLeft: `3px solid ${isActive ? 'var(--color-accent)' : 'transparent'}`,
                          }}
                        >
                          <span className="text-[0.6875rem] font-bold tabular-nums">{s.number}</span>
                          {s.title}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              {/* Supporting card */}
              <div
                className="rounded-3xl p-5"
                style={{
                  background: 'linear-gradient(150deg, rgba(67,97,238,0.07), rgba(139,92,246,0.10))',
                  border: '1px solid var(--color-border)',
                }}
              >
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-2xl mb-3"
                  style={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent-text)' }}
                >
                  <Mail size={22} />
                </span>
                <h3 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  Questions About These Terms?
                </h3>
                <p className="mt-1.5 text-[0.8125rem] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  If anything in these terms is unclear, or you have questions about your rights and
                  obligations, you can contact us at{' '}
                  <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold hover:underline" style={{ color: 'var(--color-accent-text)' }}>
                    {SUPPORT_EMAIL}
                  </a>
                  .
                </p>
              </div>
            </div>
          </aside>

          {/* RIGHT — accordion */}
          <div className="space-y-4">
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              const isOpen = open === s.id;
              return (
                <article
                  key={s.id}
                  id={s.id}
                  ref={(el) => {
                    sectionRefs.current[s.id] = el;
                  }}
                  className="overflow-hidden rounded-3xl transition-shadow"
                  style={{
                    backgroundColor: 'var(--color-card)',
                    border: `1px solid ${isOpen ? 'rgba(67,97,238,0.35)' : 'var(--color-border)'}`,
                    boxShadow: isOpen
                      ? '0 20px 45px -22px rgba(67,97,238,0.35)'
                      : '0 10px 28px -20px rgba(23,23,31,0.28)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => toggle(s.id)}
                    className="flex w-full items-center gap-4 px-5 py-5 text-left sm:px-6"
                    aria-expanded={isOpen}
                  >
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                      style={{
                        backgroundColor: isOpen ? 'var(--color-accent)' : 'var(--color-accent-light)',
                        color: isOpen ? '#ffffff' : 'var(--color-accent-text)',
                        transition: 'background-color 0.2s ease, color 0.2s ease',
                      }}
                    >
                      <Icon size={20} />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="flex items-center gap-2.5">
                        <span
                          className="text-xs font-extrabold tabular-nums tracking-wide"
                          style={{ color: 'var(--color-accent-text)' }}
                        >
                          {s.number}
                        </span>
                        <h3 className="text-base sm:text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
                          {s.title}
                        </h3>
                      </span>
                      {!isOpen && (
                        <span className="mt-1 block truncate text-[0.8125rem]" style={{ color: 'var(--color-text-muted)' }}>
                          {s.preview}
                        </span>
                      )}
                    </span>
                    <ChevronDown
                      size={20}
                      className="shrink-0"
                      style={{
                        color: 'var(--color-accent-text)',
                        transform: isOpen ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.25s ease',
                      }}
                    />
                  </button>
                  <div
                    className="grid transition-[grid-template-rows] duration-300 ease-out"
                    style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
                  >
                    <div className="overflow-hidden">
                      <div
                        className="px-5 pb-6 sm:px-6 text-[0.9375rem] leading-relaxed [&_p+p]:mt-3 [&_ul+p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mt-1.5"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        {s.content}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </PageWrapper>
  );
}
