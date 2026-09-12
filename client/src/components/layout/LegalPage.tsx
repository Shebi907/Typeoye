import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { PageWrapper } from './PageWrapper';
import { SUPPORT_EMAIL } from '../../config';

export function SupportEmailLink() {
  return (
    <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:underline" style={{ color: 'var(--color-accent-text)' }}>
      {SUPPORT_EMAIL}
    </a>
  );
}

interface LegalPageProps {
  title: string;
  icon?: LucideIcon;
  children: React.ReactNode;
}

export function LegalPage({ title, icon, children }: LegalPageProps) {
  return (
    <div className="relative overflow-hidden">
      <div className="glow-blob w-[26.25rem] h-[26.25rem] -top-40 -right-32" />
      <PageWrapper title={title} description="Last updated: August 21, 2026" icon={icon}>
        <div
          className="legal-body relative max-w-[60rem] mx-auto card p-4 sm:p-6 lg:p-10 space-y-6 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-3 [&_p]:text-sm [&_p]:leading-relaxed [&_li]:text-sm [&_li]:leading-relaxed"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {children}
        </div>
      </PageWrapper>
    </div>
  );
}

export function LegalHeading({ children }: { children: React.ReactNode }) {
  return <h2 style={{ color: 'var(--color-text-primary)' }}>{children}</h2>;
}

export function LegalList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="legal-list space-y-1.5">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}
