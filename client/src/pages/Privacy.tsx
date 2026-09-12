import React, { useEffect, useRef, useState } from 'react';
import {
  Shield, Lock, Calendar, ChevronDown, Info, Database, Share2, Server,
  UserCheck, Users, FileClock, Mail, FileText, User, Sparkles,
} from 'lucide-react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { SUPPORT_EMAIL } from '../config';

type SectionId =
  | 'information-we-collect'
  | 'how-we-use-your-information'
  | 'data-sharing-and-disclosure'
  | 'data-security'
  | 'your-rights-and-choices'
  | 'childrens-privacy'
  | 'changes-to-this-policy'
  | 'contact-us';

interface PrivacySection {
  id: SectionId;
  number: string;
  title: string;
  preview: string;
  icon: React.ElementType;
  content: React.ReactNode;
}

const SECTIONS: PrivacySection[] = [
  {
    id: 'information-we-collect',
    number: '01',
    title: 'Information We Collect',
    preview: 'The information you provide and the usage data we gather to power Typeoye.',
    icon: Database,
    content: (
      <p>
        We collect information you provide directly, including your account information such as your
        name, email address, and profile information. We also collect information related to your use of
        the service, such as typing results, WPM, accuracy, progress, games, and leaderboard activity, so
        that we can track your improvement and power the Typeoye experience.
      </p>
    ),
  },
  {
    id: 'how-we-use-your-information',
    number: '02',
    title: 'How We Use Your Information',
    preview: 'How your information powers and improves the services you use every day.',
    icon: Sparkles,
    content: (
      <p>
        We use your information to provide and improve Typeoye services, manage your account, save your
        progress and results, provide leaderboard functionality, communicate with you, and maintain the
        security and integrity of our platform. Your data helps us personalize your experience and keep
        the community fair and enjoyable.
      </p>
    ),
  },
  {
    id: 'data-sharing-and-disclosure',
    number: '03',
    title: 'Data Sharing and Disclosure',
    preview: 'We never sell your personal information. Here is how it may be shared.',
    icon: Share2,
    content: (
      <p>
        Typeoye does not sell users' personal information to third parties. Information may only be shared
        when reasonably necessary to operate our services, work with service providers, comply with
        applicable law, or protect Typeoye and its users. Any sharing is limited to what is required for
        those purposes.
      </p>
    ),
  },
  {
    id: 'data-security',
    number: '04',
    title: 'Data Security',
    preview: 'The technical and organizational measures we take to protect your data.',
    icon: Server,
    content: (
      <p>
        Typeoye uses reasonable technical and organizational measures to protect personal information from
        unauthorized access, alteration, disclosure, or destruction. This includes secure password hashing
        and ongoing monitoring of our systems to help keep your information safe.
      </p>
    ),
  },
  {
    id: 'your-rights-and-choices',
    number: '05',
    title: 'Your Rights and Choices',
    preview: 'The control you have over your personal information.',
    icon: UserCheck,
    content: (
      <p>
        You can access, update, or request deletion of your information where applicable. If you have
        questions about your data, want to review what we hold, or would like to exercise your rights,
        you can contact the Typeoye team and we will assist you.
      </p>
    ),
  },
  {
    id: 'childrens-privacy',
    number: '06',
    title: "Children's Privacy",
    preview: 'Our commitment to protecting younger users.',
    icon: Users,
    content: (
      <p>
        Typeoye is not intended for children under 13, and Typeoye does not knowingly collect personal
        information from children under 13. If you believe we have inadvertently collected such
        information, please contact us so we can take appropriate action.
      </p>
    ),
  },
  {
    id: 'changes-to-this-policy',
    number: '07',
    title: 'Changes to This Policy',
    preview: 'How and when this Privacy Policy may be updated.',
    icon: FileClock,
    content: (
      <p>
        Typeoye may update this Privacy Policy from time to time to reflect changes in our practices or
        for legal, operational, or regulatory reasons. Updates will be posted on this page with an updated
        date, and we encourage you to review this page periodically.
      </p>
    ),
  },
  {
    id: 'contact-us',
    number: '08',
    title: 'Contact Us',
    preview: 'Questions or concerns about this Privacy Policy.',
    icon: Mail,
    content: (
      <p>
        If you have any questions or concerns regarding this Privacy Policy or how we handle your personal
        information, please contact us at{' '}
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

export default function Privacy() {
  const lastUpdated = formatDate(new Date());
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
              <p className="mt-5 max-w-xl text-base sm:text-lg leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                Your privacy is important to us. This Privacy Policy explains how Typeoye collects, uses,
                shares, and protects your information when you use our website and services.
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
