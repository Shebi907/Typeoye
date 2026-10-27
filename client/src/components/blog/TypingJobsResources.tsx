const jobBoards = [
  { label: 'LinkedIn Jobs', region: 'Pakistan and international listings', href: 'https://pk.linkedin.com/jobs' },
  { label: 'Indeed Pakistan', region: 'Private-sector and local listings', href: 'https://pk.indeed.com/Data-Entry-jobs-in-PK' },
  { label: 'Pakistan National Jobs Portal', region: 'Public-sector vacancies', href: 'https://www.njp.gov.pk/index.php/jobs' },
  { label: 'USA: Indeed', region: 'Search by city, role, and work arrangement', href: 'https://www.indeed.com/' },
  { label: 'UK: Find a Job', region: 'UK government vacancy service', href: 'https://www.gov.uk/find-a-job' },
  { label: 'Canada Job Bank', region: 'Canadian federal job search', href: 'https://www.jobbank.gc.ca/findajob?promo=1' },
  { label: 'Workforce Australia', region: 'Australian government employment service', href: 'https://www.workforceaustralia.gov.au/' },
  { label: 'Upwork', region: 'Freelance client projects and contracts', href: 'https://www.upwork.com/freelance-jobs/' },
  { label: 'Fiverr', region: 'Offer typing and document services as a seller', href: 'https://www.fiverr.com/' },
];

const salarySources = [
  { place: 'Pakistan', estimate: 'PKR 31,753 per month', context: 'Indeed data-entry clerk average; based on reported salaries from job postings, updated 13 September 2026.', href: 'https://pk.indeed.com/career/data-entry-clerk/salaries?campaignid=serp-more&fromjk=211e67c8601cb2a1', source: 'Indeed salary data' },
  { place: 'United States', estimate: 'USD 41,340 per year (data entry keyers); USD 49,280 (word processors and typists)', context: 'BLS May 2025 median annual wages. These are separate occupation categories, not guaranteed offers.', href: 'https://www.bls.gov/ooh/about/data-for-occupations-not-covered-in-detail.htm', source: 'U.S. Bureau of Labor Statistics' },
  { place: 'United Kingdom', estimate: 'GBP 30,889 per year', context: 'Indeed data-entry clerk average based on salary reports and job postings; updated 16 October 2026.', href: 'https://uk.indeed.com/career/data-entry-clerk/salaries', source: 'Indeed salary data' },
  { place: 'Canada', estimate: 'CAD 23.50 per hour median', context: 'Job Bank national wage for data entry clerks; updated 19 November 2025, with 2023–2024 reference data.', href: 'https://www.jobbank.gc.ca/wagereport/occupation/19207', source: 'Government of Canada Job Bank' },
  { place: 'Australia', estimate: 'No comparable median published for this detailed occupation on the cited profile.', context: 'Check current advertised pay and applicable employment conditions for each vacancy.', href: 'https://www.jobsandskills.gov.au/data/occupation-and-industry-profiles/occupations-anzsco/532111-data-entry-operators', source: 'Jobs and Skills Australia' },
];

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} target="_blank" rel="noreferrer" className="font-semibold underline" style={{ color: 'var(--color-accent-text)' }}>{children}</a>;
}

export default function TypingJobsResources() {
  return (
    <div className="mt-6 space-y-8">
      <section aria-labelledby="typing-job-platforms">
        <h3 id="typing-job-platforms" className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Job-search platforms checked for this guide</h3>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>Platform availability and listings change. Use the country selector or location filter and read each listing’s eligibility and terms.</p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {jobBoards.map(({ label, region, href }) => <li key={label} className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)' }}>
            <ExternalLink href={href}>{label}</ExternalLink>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{region}</p>
          </li>)}
        </ul>
      </section>

      <section aria-labelledby="typing-job-salary-sources">
        <h3 id="typing-job-salary-sources" className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Country salary references</h3>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>Sources checked 27 October 2026. They use different job titles and methods, so figures are not directly comparable. Employee averages and medians do not predict a particular offer or freelance income.</p>
        <ul className="mt-4 space-y-3">
          {salarySources.map(({ place, estimate, context, href, source }) => <li key={place} className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)' }}>
            <p className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{place}: {estimate}</p>
            <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{context}</p>
            <p className="mt-2 text-sm"><ExternalLink href={href}>{source}</ExternalLink></p>
          </li>)}
        </ul>
      </section>

      <aside className="rounded-xl border p-4 text-sm leading-relaxed" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
        <strong style={{ color: 'var(--color-text-primary)' }}>Scam-safety references:</strong> See the <ExternalLink href="https://consumer.ftc.gov/articles/job-scams">U.S. Federal Trade Commission job-scam guidance</ExternalLink> and <ExternalLink href="https://www.scamwatch.gov.au/types-of-scams/jobs-and-employment-scams">Scamwatch employment scam advice</ExternalLink> for additional warning signs.
      </aside>
    </div>
  );
}
import type { ReactNode } from 'react';

