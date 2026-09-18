import React, { useEffect, useRef, useState } from 'react';
import {
  Shield, Lock, Calendar, ChevronDown, Info, Database, Sparkles, Globe2,
  Cookie, UserCheck, Users, Mail, User, FileText,
} from 'lucide-react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { SUPPORT_EMAIL } from '../config';
import { useSeo } from '../hooks/useSeo';

type SectionId =
  | 'information-we-collect'
  | 'how-we-use-your-information'
  | 'third-party-services'
  | 'cookies'
  | 'your-rights-and-choices'
  | 'childrens-privacy'
  | 'contact-us';

interface PrivacySection {
  id: SectionId;
  number: string;
  title: string;
  preview: string;
  icon: React.ElementType;
  content: React.ReactNode;
}

const LINK_STYLE = {
  color: 'var(--color-accent-text)',
} as React.CSSProperties;

const SECTIONS: PrivacySection[] = [
  {
    id: 'information-we-collect',
    number: '01',
    title: 'Information We Collect',
    preview: 'The exact information Typeoye stores — and that guest use is never saved.',
    icon: Database,
    content: (
      <>
        <p>
          If you use Typeoye without signing in (as a guest), we do not collect or store anything about
          your typing. Guest sessions run entirely in your browser and are never saved to our servers. The
          data listed below is only collected for signed-in accounts.
        </p>
        <h4>Account information</h4>
        <ul>
          <li>
            When you create an account you provide a <strong>username</strong>, an{' '}
            <strong>email address</strong>, a <strong>password</strong>, and a{' '}
            <strong>security question and answer</strong> used for account recovery.
          </li>
          <li>
            Passwords are stored only as a <strong>one-way cryptographic hash</strong>. We cannot read
            your password back, and we never see your plaintext password after you set it.
          </li>
          <li>
            If you sign in with Google, we receive the name and email Google shares with us. We never
            receive your Google password.
          </li>
        </ul>
        <h4>Profile and preferences</h4>
        <ul>
          <li>
            You can optionally set a <strong>display name</strong>, a short <strong>bio</strong>, and a{' '}
            <strong>profile picture</strong>, which we store for you.
          </li>
          <li>
            We save your in-app preferences such as theme, font, font size, caret style, default test
            duration, and whether numbers and punctuation appear in your test text.
          </li>
        </ul>
        <h4>Typing practice data</h4>
        <ul>
          <li>
            When you are signed in, completed sessions are saved so you can review them: the mode
            (typing test, practice, lesson, or game), the date and duration, your <strong>WPM</strong> and{' '}
            <strong>accuracy</strong>, correct and attempted word counts, and the text you were shown and
            what you typed, word by word, including per-word timing.
          </li>
          <li>
            From this data we derive items such as your <strong>weak keys</strong>, lesson-by-lesson
            accuracy, <strong>streak history</strong>, and <strong>game scores</strong>.
          </li>
        </ul>
        <h4>Progress, achievements, and certificates</h4>
        <ul>
          <li>
            We save completed lessons and exercises, XP, level, badges, best and average WPM and
            accuracy, total practice time, and leaderboard placement.
          </li>
          <li>
            When you earn a certificate you type the <strong>name</strong> to print on it. That name is
            used only to render the PDF you download and is <strong>not saved</strong> to your account.
            The underlying test is saved like any other signed-in session.
          </li>
        </ul>
        <h4>Messages you send us</h4>
        <ul>
          <li>
            If you use the contact form, we keep your <strong>name</strong>, <strong>email
            address</strong>, <strong>topic</strong>, and <strong>message</strong> so we can respond and
            track issues.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'how-we-use-your-information',
    number: '02',
    title: 'How We Use Your Information',
    preview: 'How your data powers tests, leaderboards, certificates, and account security.',
    icon: Sparkles,
    content: (
      <>
        <ul>
          <li>
            <strong>Operating the service</strong> — displaying typing tests, practice drills, lessons,
            and games, and saving your results so you can review progress and spot trends.
          </li>
          <li>
            <strong>Leaderboards</strong> — ranking eligible sessions (timed tests and games finished at
            90% accuracy or higher) by best WPM and showing your personal rank.
          </li>
          <li>
            <strong>Certificates</strong> — checking whether a single run meets both thresholds (30 WPM
            and 90% accuracy) and generating your PDF.
          </li>
          <li>
            <strong>Account security and sign-in</strong> — hashing passwords, security-question
            recovery, temporary lockouts after repeated failed attempts, and rate limiting.
          </li>
          <li>
            <strong>Personalization</strong> — remembering your settings across devices when you are
            signed in.
          </li>
          <li>
            <strong>Fairness and support</strong> — keeping the leaderboard fair, responding to your
            messages, and improving features.
          </li>
        </ul>
        <p>
          We never sell your personal information. Typeoye displays no third-party ads today and runs no
          cross-site tracking, so there is nothing sold through advertising. We do not make automated
          decisions about you beyond the ranking, gamification, and certificate features you use.
        </p>
      </>
    ),
  },
  {
    id: 'third-party-services',
    number: '03',
    title: 'Third-Party Services and Advertising',
    preview: 'The only outside services we use, and our honest stance on advertising.',
    icon: Globe2,
    content: (
      <>
        <h4>Hosting and infrastructure</h4>
        <p>
          The service runs on third-party cloud providers — the application on Render and the database on
          MongoDB Atlas. These providers process data only as needed to host the service, and we rely on
          their security practices to keep it running safely.
        </p>
        <h4>Google Sign-In</h4>
        <p>
          If you sign in with Google, Google runs its own authentication flow on its own pages and may
          place its own cookies. We receive only the account information Google shares with us (such as
          your name and email) and never your Google password.
        </p>
        <h4>Google Fonts</h4>
        <p>
          The site loads the Inter and JetBrains Mono typefaces from Google&apos;s font CDN. When the page
          loads, your browser requests these fonts from Google, so Google may receive a standard web
          request (including your IP address and the referring page). Google&apos;s handling of that
          request is governed by Google&apos;s own privacy policy.
        </p>
        <h4>Advertising (Google AdSense)</h4>
        <p>
          Typeoye has a Google AdSense account linked to this domain. As of the date of this policy, the
          site does not display advertisements — no ad scripts are loaded anywhere in the app. If we begin
          showing ads in the future, Google — as AdSense&apos;s provider — may use cookies or similar
          technologies to serve and personalize ads and to measure how they perform.
        </p>
        <ul>
          <li>
            How Google uses data when you visit sites that partner with Google:{' '}
            <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer" style={LINK_STYLE}>
              policies.google.com/technologies/partner-sites
            </a>
          </li>
          <li>
            How Google uses cookies in advertising:{' '}
            <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" style={LINK_STYLE}>
              policies.google.com/technologies/ads
            </a>
          </li>
          <li>
            You can control personalized ads from Google at any time:{' '}
            <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" style={LINK_STYLE}>
              adssettings.google.com
            </a>
          </li>
        </ul>
        <h4>Analytics</h4>
        <p>
          Typeoye does not run Google Analytics or any other third-party analytics, tracking, or
          fingerprinting scripts. We do not track you across other websites.
        </p>
      </>
    ),
  },
  {
    id: 'cookies',
    number: '04',
    title: 'Cookies and Similar Technologies',
    preview: 'What cookies and browser storage are really used for — no tracking cookies.',
    icon: Cookie,
    content: (
      <>
        <p>
          Typeoye itself does not set tracking cookies. Here is what actually happens in your browser:
        </p>
        <ul>
          <li>
            <strong>Sign-in tokens</strong> — when you sign in, we keep a token in your browser&apos;s
            local storage so you stay signed in. This is not a traditional login cookie.
          </li>
          <li>
            <strong>Preferences and recent settings</strong> — small items in your browser&apos;s local
            and session storage, such as your theme, font size, last chosen test duration and difficulty,
            and (for guests only) which typing paragraphs you have already seen so you are not shown
            repeats.
          </li>
          <li>
            <strong>Google services</strong> — as described above, Google Sign-In and Google Fonts may
            place Google cookies or make requests to Google when you use them.
          </li>
          <li>
            <strong>Advertising</strong> — if advertising is enabled in the future, Google AdSense may use
            cookies or similar technologies to serve personalized ads and measure performance.
          </li>
        </ul>
        <p>
          You are in control: every browser lets you block or delete cookies and site data, browse
          privately, and clear site storage (including storage for typeoye.com). Clearing this data will
          not stop you from typing — you will simply be treated as a guest, may need to sign in again, and
          may lose saved preferences.
        </p>
      </>
    ),
  },
  {
    id: 'your-rights-and-choices',
    number: '05',
    title: 'Your Rights and Choices',
    preview: 'How to view, copy, correct, or delete your data today.',
    icon: UserCheck,
    content: (
      <>
        <p>
          Typeoye does not yet have a self-serve &ldquo;download my data&rdquo; or &ldquo;delete my
          account&rdquo; button. Until we build those, here is exactly how your rights are handled:
        </p>
        <ul>
          <li>
            <strong>See your data</strong> — most of what we hold is already visible inside the app: your
            results history, statistics, leaderboard position, profile, and the certificates you have
            generated.
          </li>
          <li>
            <strong>Get a copy of your data</strong> — email us at{' '}
            <a href="mailto:contact.typeoye@gmail.com" style={LINK_STYLE}>
              contact.typeoye@gmail.com
            </a>{' '}
            from the email address on your account and include your username. We will provide the data we
            hold about you.
          </li>
          <li>
            <strong>Correct your data</strong> — update your username, display name, avatar, password,
            security question, and preferences from your Profile and Settings pages. Changing the email
            address on your account is currently handled manually by support.
          </li>
          <li>
            <strong>Delete your account and data</strong> — email the same address with your username. We
            will permanently delete your account and its data: saved tests, practice sessions, game
            results, lesson progress, streaks, achievements, settings, and profile.
          </li>
        </ul>
        <p>
          Guests have nothing to delete, because we never store guest sessions. Requests are handled
          manually, so they may take a little time, but we aim to respond promptly and free of charge.
        </p>
      </>
    ),
  },
  {
    id: 'childrens-privacy',
    number: '06',
    title: "Children's Privacy",
    preview: 'Our approach to younger users and guidance for parents and guardians.',
    icon: Users,
    content: (
      <>
        <p>
          Typeoye is a typing practice tool used by people of all ages, including school-age children and
          teenagers. We are transparent about how we handle children&apos;s data:
        </p>
        <ul>
          <li>
            We collect the same limited information from minors as from any other user — a username, an
            email address, and typing scores — and do not knowingly collect anything more from children.
          </li>
          <li>
            We do not run advertisements or third-party trackers today, so there is no behavioural
            profiling of any user, including children.
          </li>
          <li>
            Because creating an account requires an email address, we recommend that parents or guardians
            help children set up and manage their accounts.
          </li>
          <li>
            If you are a parent or guardian and are concerned about your child&apos;s account or data,
            contact us — including to review or delete the account.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'contact-us',
    number: '07',
    title: 'Contact Us',
    preview: 'Reach us with questions or requests about your data.',
    icon: Mail,
    content: (
      <>
        <p>
          If you have questions, concerns, or requests about this Privacy Policy or about your personal
          information, email us at{' '}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="font-semibold hover:underline"
            style={{ color: 'var(--color-accent-text)' }}
          >
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
        <p>
          For deletion or data-access requests, please email from the address on your account and include
          your username so we can verify and act on the request. We will do our best to respond quickly.
        </p>
      </>
    ),
  },
];

const PRIVACY_POLICY_DATE = 'September 18, 2026';

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

export default function Privacy() {
  useSeo({
    title: 'Privacy Policy | TypeOye',
    description:
      'What TypeOye collects and stores — your account, typing results, progress, and certificates — how it is used, the third-party services we rely on, and how to access or delete your data.',
    canonicalPath: '/privacy',
  });
  const lastUpdated = PRIVACY_POLICY_DATE;
  const [open, setOpen] = useState<SectionId | null>('information-we-collect');
  const [activeId, setActiveId] = useState<SectionId>('information-we-collect');
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
                <Shield size={14} style={{ color: 'var(--color-accent-text)' }} />
                Trust &amp; Transparency
              </span>
              <h1
                className="mt-5 text-4xl sm:text-5xl font-extrabold tracking-tight"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Privacy Policy
              </h1>
              <span
                className="mt-3 block h-1 w-16 rounded-full"
                style={{ background: 'linear-gradient(90deg, #4361EE, #8B5CF6)' }}
                aria-hidden="true"
              />
              <p className="readable-text mt-5 max-w-xl text-base sm:text-lg leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                This policy explains what information Typeoye collects, why we collect it, and how you can
                control it. It is written in plain language and describes how the service actually works —
                including that guest use is never saved.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <HeroBadge icon={Calendar} label="Last updated:" value={lastUpdated} />
                <HeroBadge icon={Shield} label="Effective date:" value={lastUpdated} />
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
                  <User size={20} />
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
                {/* Main shield */}
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
                  <span className="flex flex-col items-center justify-center text-white">
                    <Shield size={72} strokeWidth={1.6} />
                    <span className="absolute flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                      <Lock size={26} style={{ color: '#ffffff' }} />
                    </span>
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

              {/* Your Privacy Matters */}
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
                  <Shield size={22} />
                </span>
                <h3 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  Your Privacy Matters
                </h3>
                <p className="mt-1.5 text-[0.8125rem] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  Typeoye is committed to protecting your personal information and being transparent about how we use it.
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
                        className="px-5 pb-6 sm:px-6 text-[0.9375rem] leading-relaxed [&_h4]:mt-5 [&_h4]:mb-1 [&_h4]:text-[0.8125rem] [&_h4]:font-bold [&_h4]:uppercase [&_h4]:tracking-wide [&_h4]:text-[var(--color-text-primary)] [&_ul]:mt-2 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-5 [&_ul]:list-disc [&_p+p]:mt-3 [&_ul+p]:mt-3"
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
