import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Facebook, Instagram, Linkedin, ShieldCheck } from 'lucide-react';
import { Logo } from './Logo';

interface FooterLinkItem {
  to?: string;
  label: string;
  external?: boolean;
  unavailable?: boolean;
}

const PLATFORM_LINKS: FooterLinkItem[] = [
  { to: '/test', label: 'Typing Test' },
  { to: '/practice', label: 'Practice' },
  { to: '/lessons', label: 'Lessons' },
  { to: '/games', label: 'Games' },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/certificate', label: 'Certificate' },
];

const RESOURCE_LINKS: FooterLinkItem[] = [
  { to: '/blog', label: 'Blog' },
  { to: '/blog/typing-speed-tips', label: 'Typing Tips' },
  { to: '/how-it-works', label: 'How It Works' },
  { to: '/faq', label: 'FAQs' },
  { to: '/support', label: 'Support Center' },
  { to: '/contact', label: 'Contact Us' },
];

const COMPANY_LINKS: FooterLinkItem[] = [
  { to: '/about', label: 'About Us' },
  { to: '/privacy', label: 'Privacy Policy' },
  { to: '/terms', label: 'Terms of Service' },
];

const SOCIAL_LINKS = [
  { href: 'https://www.facebook.com/profile.php?id=61594240830114', label: 'Facebook', icon: Facebook },
  { href: 'https://www.linkedin.com/company/typeoye/', label: 'LinkedIn', icon: Linkedin },
  { href: 'https://www.instagram.com/typeoye.official/', label: 'Instagram', icon: Instagram },
];

function FooterLink({ item }: { item: FooterLinkItem }) {
  const { pathname } = useLocation();
  const isActive = !!item.to && !item.external && pathname === item.to;
  const baseClass = `site-footer-link${isActive ? ' site-footer-link-active' : ''}`;
  if (item.unavailable) {
    return (
      <span className={baseClass} aria-disabled="true">
        {item.label}
      </span>
    );
  }
  if (item.external && item.to) {
    return (
      <a href={item.to} className={baseClass} target="_blank" rel="noopener noreferrer">
        {item.label}
      </a>
    );
  }
  if (item.to?.startsWith('mailto:')) {
    return <a href={item.to} className={baseClass}>{item.label}</a>;
  }
  return <Link to={item.to!} className={baseClass} aria-current={isActive ? 'page' : undefined}>{item.label}</Link>;
}

function FooterNav({ title, items }: { title: string; items: FooterLinkItem[] }) {
  return (
    <nav aria-label={title} className="flex flex-col">
      <h3 className="site-footer-heading">{title}</h3>
      {items.map((item) => (
        <FooterLink key={item.label} item={item} />
      ))}
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="site-footer relative overflow-hidden mt-auto">
      <span className="dot-grid dot-grid-tl site-footer-dots" aria-hidden="true" />
      <span className="dot-grid dot-grid-br site-footer-dots" aria-hidden="true" />
      <div
        className="site-footer-blob"
        style={{ top: '-120px', right: '-90px', width: '380px', height: '380px' }}
        aria-hidden="true"
      />
      <div
        className="site-footer-blob"
        style={{ bottom: '-110px', left: '-70px', width: '320px', height: '320px' }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8 pt-8 sm:pt-9 pb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] gap-7 sm:gap-x-6 sm:gap-y-8 lg:gap-x-8">
          {/* Brand */}
          <div>
            <span className="inline-flex items-center">
              <Logo size={23} />
            </span>
            <p className="site-footer-desc max-w-xs">
              Typeoye helps you improve your typing speed, accuracy, and confidence
              with interactive tests and lessons.
            </p>
            <div className="flex gap-2.5 mt-3.5">
              {SOCIAL_LINKS.map(({ href, label, icon: SocialIcon }) => (
                <a
                  key={label}
                  href={href}
                  className="site-footer-social"
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <SocialIcon size={17} />
                </a>
              ))}
            </div>
          </div>

          {/* Platform */}
          <FooterNav title="Platform" items={PLATFORM_LINKS} />

          {/* Resources */}
          <FooterNav title="Resources" items={RESOURCE_LINKS} />

          {/* Company */}
          <FooterNav title="Company" items={COMPANY_LINKS} />
        </div>

        {/* Bottom bar */}
        <div className="site-footer-divider mt-6 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-sm">
          <span>&copy; 2026 Typeoye. All rights reserved.</span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck size={15} className="shrink-0" style={{ color: '#FDE047' }} />
            Safe. Simple. Secure.
          </span>
        </div>
      </div>
    </footer>
  );
}