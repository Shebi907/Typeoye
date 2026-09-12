import React, { useEffect, useRef, useState } from 'react';
import {
  ShieldCheck, ScrollText, Calendar, ChevronDown, Sparkles, User, Shield,
  Copyright, Ban, Scale, FileClock, Landmark, Mail, FileText, Lock, Info,
} from 'lucide-react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { SUPPORT_EMAIL } from '../config';

type SectionId =
  | 'acceptance-of-terms'
  | 'use-of-our-services'
  | 'user-accounts'
  | 'user-conduct'
  | 'intellectual-property'
  | 'termination'
  | 'limitation-of-liability'
  | 'changes-to-terms'
  | 'governing-law'
  | 'contact-us';

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
    id: 'acceptance-of-terms',
    number: '01',
    title: 'Acceptance of Terms',
    preview: 'By using Typeoye you agree to be bound by these terms and conditions.',
    icon: ShieldCheck,
    content: (
      <p>
        By accessing or using Typeoye, you agree to be bound by these Terms and Conditions. If you
        do not agree with any part of these terms, you may not use the service. Your continued use of
        Typeoye constitutes your acceptance of these terms and any updates made to them.
      </p>
    ),
  },
  {
    id: 'use-of-our-services',
    number: '02',
    title: 'Use of Our Services',
    preview: 'What Typeoye provides and how you may use it.',
    icon: Sparkles,
    content: (
      <p>
        Typeoye provides typing tests, lessons, practice tools, games, and a leaderboard. Most
        features are free to use, with or without an account. Some features (saved progress,
        leaderboard ranking, certificates, and games) require a free account. You agree to use the
        services only for lawful purposes and in accordance with these terms.
      </p>
    ),
  },
  {
    id: 'user-accounts',
    number: '03',
    title: 'User Accounts',
    preview: 'Your responsibilities when creating and using a Typeoye account.',
    icon: User,
    content: (
      <p>
        You are responsible for keeping your password secure and for all activity that occurs under
        your account. You must provide accurate information when creating an account and maintain the
        security of your account credentials. One account per person is permitted — please do not
        create multiple accounts to manipulate the leaderboard or achievements.
      </p>
    ),
  },
  {
    id: 'user-conduct',
    number: '04',
    title: 'User Conduct',
    preview: 'The rules you agree to follow while using Typeoye.',
    icon: Shield,
    content: (
      <p>
        Do not attempt to manipulate your WPM, accuracy, leaderboard rank, or achievements through
        automated tools, scripts, or bots — all results are validated server-side, and accounts found
        cheating may be restricted or removed. Do not upload offensive, illegal, or harmful content,
        and do not attempt to interfere with, disrupt, or gain unauthorized access to Typeoye's systems.
      </p>
    ),
  },
  {
    id: 'intellectual-property',
    number: '05',
    title: 'Intellectual Property',
    preview: 'Ownership of content and how your own content is handled.',
    icon: Copyright,
    content: (
      <p>
        Lessons, exercises, and platform content belong to Typeoye and are protected by applicable
        intellectual property laws. Any custom text you submit for Custom Practice or Custom Test
        remains yours, but you grant us permission to process it (for example, to temporarily store it
        during your session) in order to provide the feature.
      </p>
    ),
  },
  {
    id: 'termination',
    number: '06',
    title: 'Termination',
    preview: 'When Typeoye may suspend or terminate your account.',
    icon: Ban,
    content: (
      <p>
        Typeoye may suspend or terminate accounts that violate these terms, including cheating, abuse,
        or illegal activity. You may also stop using the service at any time. Termination does not
        affect provisions that by their nature should survive termination.
      </p>
    ),
  },
  {
    id: 'limitation-of-liability',
    number: '07',
    title: 'Limitation of Liability',
    preview: "The extent of Typeoye's liability for your use of the platform.",
    icon: Scale,
    content: (
      <p>
        Typeoye is provided "as is" and "as available." To the fullest extent permitted by law, Typeoye
        and its team are not liable for any indirect, incidental, or consequential damages arising from
        your use of the platform, including loss of data, progress, or results.
      </p>
    ),
  },
  {
    id: 'changes-to-terms',
    number: '08',
    title: 'Changes to Terms',
    preview: 'How and when these terms may be updated.',
    icon: FileClock,
    content: (
      <p>
        Typeoye may update these terms from time to time to reflect changes in our services or for
        legal, operational, or regulatory reasons. Changes will be posted on this page, and your
        continued use of the service after changes take effect means you accept the updated terms.
      </p>
    ),
  },
  {
    id: 'governing-law',
    number: '09',
    title: 'Governing Law',
    preview: 'The jurisdiction that governs these terms and conditions.',
    icon: Landmark,
    content: (
      <p>
        These Terms and Conditions are governed by and construed in accordance with the laws of the
        applicable jurisdiction, without regard to its conflict of law provisions. Any disputes arising
        out of or relating to these terms shall be subject to the exclusive jurisdiction of the
        competent courts in that jurisdiction.
      </p>
    ),
  },
  {
    id: 'contact-us',
    number: '10',
    title: 'Contact Us',
    preview: 'Questions or concerns about these terms and conditions.',
    icon: Mail,
    content: (
      <p>
        If you have any questions or concerns regarding these Terms and Conditions, please contact us
        at{' '}
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="font-semibold hover:underline"
          style={{ color: 'var(--color-accent-text)' }}
        >
          {SUPPORT_EMAIL}
        </a>
        .
      </p>
    ),
  },
];

function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

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
  const lastUpdated = formatDate(new Date());
  const [open, setOpen] = useState<SectionId | null>('acceptance-of-terms');
  const [activeId, setActiveId] = useState<SectionId>('acceptance-of-terms');
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
                Please read these terms and conditions carefully before using Typeoye. By accessing our
                website and services, you agree to be bound by these terms.
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
                        className="px-5 pb-6 sm:px-6 text-[0.9375rem] leading-relaxed"
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
