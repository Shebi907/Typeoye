import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Calendar, ChevronDown, Clock } from 'lucide-react';
import { formatDate } from '../../data/blog';
import type { BlogPost } from '../../data/blog';
import { cn } from '../../utils/cn';
import { RelatedArticles } from './RelatedArticles';
import { UrduKeyboardGuide, UrduTypingLinks } from './UrduKeyboardGuide';
import { UrduKeyboardLayoutGraphic } from './UrduKeyboardLayoutGraphic';

interface BlogDetailProps {
  post: BlogPost;
  related: BlogPost[];
}

const TOOLS_LINKS = [
  { label: 'Free Typing Test', to: '/test' },
  { label: 'Typing Practice', to: '/practice' },
  { label: 'Typing Lessons', to: '/lessons' },
  { label: 'Typing Games', to: '/games' },
  { label: 'Get Certificate', to: '/certificate' },
];

/** "1. Learn Proper Finger Placement" → "learn-proper-finger-placement" */
function headingId(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/^\d+\.\s+/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** "1. Learn Proper Finger Placement" → "Learn Proper Finger Placement" */
function headingText(heading: string): string {
  return heading.replace(/^\d+\.\s+/, '').trim();
}

export function BlogDetail({ post, related }: BlogDetailProps) {
  const sections = post.content;
  const toolsLinks = post.moreTools ?? TOOLS_LINKS;

  const headings = useMemo(
    () =>
      sections.map((section, index) => ({
        id: headingId(section.heading),
        text: headingText(section.heading),
        index,
      })),
    [sections]
  );

  const [activeId, setActiveId] = useState(headings[0]?.id ?? '');
  const [tocOpen, setTocOpen] = useState(false);

  // Scrollspy — keep the TOC entry for the section currently in view highlighted.
  useEffect(() => {
    if (headings.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => ({ id: entry.target.id, top: entry.boundingClientRect.top }))
          .sort((a, b) => a.top - b.top);
        if (visible.length > 0) setActiveId(visible[0].id);
      },
      { rootMargin: '-15% 0px -70% 0px', threshold: 0 }
    );
    headings.forEach((heading) => {
      const el = document.getElementById(heading.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [headings]);

  const pullQuoteIndex = sections.length > 0 ? Math.floor(sections.length / 2) : -1;

  return (
    <article className="animate-fade-in" data-testid="blog-post">
      {/* Back to blog */}
      <Link
        to="/blog"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-75"
        style={{ color: 'var(--color-accent-text)' }}
      >
        <ArrowLeft size={15} /> Back to Blog
      </Link>

      {/* ── Header card ── */}
      <header className="bp-header-card rounded-2xl px-[1.5rem] py-[1.625rem] sm:px-[1.875rem] sm:py-7">
        <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#6d28d9] shadow-sm">
          {post.category}
        </span>
        <h1
          className="mt-3 max-w-[30ch] text-2xl font-extrabold leading-tight sm:text-3xl lg:text-4xl"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {post.title}
        </h1>
        <p className="mt-3 max-w-prose text-base leading-relaxed sm:text-lg" style={{ color: 'var(--color-text-secondary)' }}>
          {post.intro}
        </p>

        {/* Author row */}
        <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
          <span className="inline-flex items-center gap-2 font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold text-white"
              style={{ background: 'linear-gradient(135deg, #4361EE 0%, #7C3AED 100%)' }}
            >
              T
            </span>
            Typeoye Team
          </span>
          <span className="bp-header-chip">
            <Calendar size={14} /> {formatDate(post.publishedAt)}
          </span>
          <span className="bp-header-chip">
            <Clock size={14} /> {post.readTime} min read
          </span>
        </div>
      </header>

      {/* ── Two-column layout: main content + sticky sidebar ── */}
      <div className="mt-8 lg:mt-10 lg:flex lg:items-start lg:gap-8">
        {/* Main column */}
        <div className="min-w-0 flex-1">
          {/* Image + body share the text column, capped at 72ch so neither ever
              exceeds a readable width on ultra-wide screens. */}
          <div className="readable-text">
            {/* Featured image — matched to the text column, never wider */}
            <figure
              className={cn(
                'relative w-full rounded-[1.25rem] border',
                post.slug === 'urdu-phonetic-keyboard-layout'
                  ? 'h-[480px] overflow-x-auto overflow-y-hidden sm:h-auto sm:aspect-[16/8]'
                  : 'overflow-hidden'
              )}
              style={{
                borderColor: 'var(--color-border)',
                aspectRatio: post.slug === 'urdu-phonetic-keyboard-layout'
                  ? undefined
                  : post.slug === 'how-to-type-urdu-mobile-pc-guide'
                    ? '3 / 2'
                  : post.slug === 'free-typing-certificate-online' || post.slug === 'typing-certificate-validity-for-jobs'
                      ? '40 / 21'
                    : post.slug === 'typing-certificate-wpm-requirements' || post.slug === 'how-to-type-urdu-online-english-keyboard' || post.slug === 'urdu-typing-test-practice-ppsc-fpsc-pakistan' || post.slug === 'how-to-type-urdu-in-ms-word' || post.slug === 'improve-typing-accuracy-without-looking-at-keyboard' || post.slug === 'free-urdu-typing-website-type-practice-test-online'
                    ? '16 / 9'
                    : '16 / 8',
              }}
            >
              {post.slug === 'urdu-phonetic-keyboard-layout' ? (
                <UrduKeyboardLayoutGraphic className="absolute inset-0 min-w-[960px] sm:min-w-0" />
              ) : (
                <img src={post.image} alt={post.imageAlt} className="absolute inset-0 h-full w-full object-cover" />
              )}
            </figure>

            {/* Numbered sections + pull-quote */}
            <div className="mt-8 space-y-10 sm:mt-10">
              {sections.map((section, index) => {
                const heading = headings[index];
                return (
                  <div key={heading.id}>
                    <section id={heading.id} className="scroll-mt-24">
                      <div className="flex items-baseline gap-4">
                        <span
                          aria-hidden="true"
                          className="bp-section-num shrink-0 text-3xl font-extrabold leading-none tracking-tight sm:text-4xl"
                        >
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <h2 className="text-xl font-bold sm:text-2xl" style={{ color: 'var(--color-text-primary)' }}>
                          {heading.text}
                        </h2>
                      </div>
                      <p className="mt-3 text-[1.0625rem] leading-[1.75]" style={{ color: 'var(--color-text-secondary)' }}>
                        {section.body}
                      </p>
                      {section.guide === 'urdu-keyboard-map' && <UrduKeyboardGuide />}
                      {section.guide === 'urdu-typing-links' && <UrduTypingLinks />}
                      {section.guide === 'urdu-layout-comparison' && <UrduLayoutComparison />}
                      {section.guide === 'urdu-layout-examples' && <UrduLayoutExamples />}
                      {section.guide === 'urdu-keyboard-faqs' && <UrduKeyboardFaqs />}
                      {section.guide === 'urdu-word-examples' && <UrduWordExamples />}
                      {section.guide === 'gov-prep-plan' && <GovernmentTypingPrepPlan />}
                      {section.guide === 'gov-prep-mistakes' && <GovernmentTypingMistakes />}
                      {section.guide === 'gov-prep-faqs' && <GovernmentTypingFaqs />}
                      {section.guide === 'gov-official-example' && <GovernmentOfficialExample />}
                      {section.guide === 'ms-word-faqs' && <MsWordFaqs />}
                      {section.guide === 'english-typing-links' && <EnglishTypingLinks />}
                      {section.guide === 'typing-accuracy-faqs' && <TypingAccuracyFaqs />}
                      {section.guide === 'urdu-kaise-faqs' && <UrduKaiseFaqs />}
                      {section.guide === 'post-faqs' && post.faqs && <PostFaqs faqs={post.faqs} />}
                      {section.guide === 'certificate-steps' && <CertificateSteps />}
                    </section>

                    {index === pullQuoteIndex && post.pullQuote && (
                      <aside className="bp-quote mt-10 overflow-hidden rounded-r-xl px-5 py-4 sm:px-6 sm:py-5">
                        <p className="text-lg font-medium italic leading-relaxed sm:text-xl">“{post.pullQuote}”</p>
                      </aside>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Closing CTA — per-post when provided, generic fallback otherwise */}
            <div className="bp-cta mt-12 rounded-2xl px-6 py-8 text-center sm:px-8 sm:py-10">
              <h3 className="text-xl font-extrabold text-white sm:text-2xl">
                {post.cta?.heading ?? 'Ready to improve your typing?'}
              </h3>
              <p className="mt-2 text-sm text-white/85 sm:text-base">
                {post.cta?.blurb ?? 'Practice your speed and accuracy with Typeoye'}
              </p>
              <Link
                to={post.cta?.to ?? '/test'}
                data-testid="article-cta"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-[#1B2340] shadow-lg transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
              >
                {post.cta?.label ?? 'Start Typing Test'} <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>

        {/* Sidebar — stacks below content < lg; sticky beside it on desktop.
            No height cap or overflow: the sidebar's natural height is used and
            it scrolls with the page as a single scroll experience. */}
        <aside className="mt-8 lg:sticky lg:top-20 lg:mt-0 lg:w-56 lg:shrink-0 lg:self-start">
          {/* On this page */}
          <div className="card p-5">
            <button
              type="button"
              onClick={() => setTocOpen((v) => !v)}
              aria-expanded={tocOpen}
              className="flex w-full items-center justify-between gap-2 lg:pointer-events-none lg:cursor-default"
            >
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                On this page
              </span>
              <ChevronDown
                size={16}
                className={cn('lg:hidden transition-transform duration-200', tocOpen && 'rotate-180')}
                style={{ color: 'var(--color-text-muted)' }}
              />
            </button>
            <nav className={cn('mt-3 lg:block', tocOpen ? 'block' : 'hidden')}>
              <ul className="flex flex-col gap-1">
                {headings.map((heading) => (
                  <li key={heading.id}>
                    <a
                      href={`#${heading.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById(heading.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                      className={cn(
                        'block border-l-2 py-1 pl-3 text-sm leading-snug transition-colors',
                        activeId === heading.id
                          ? 'border-l-[var(--color-accent-text)] font-semibold text-[var(--color-accent-text)]'
                          : 'border-l-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-accent-text)]'
                      )}
                    >
                      {heading.text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Written by */}
          <div className="card mt-4 p-5">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
              Written by
            </p>
            <div className="mt-3 flex items-center gap-3">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white"
                style={{ background: 'linear-gradient(135deg, #4361EE 0%, #7C3AED 100%)' }}
              >
                T
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  Typeoye Team
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  Typing Guides
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              We write practical guides on touch typing, speed, accuracy, and productivity.
            </p>
          </div>

          {/* More tools */}
          <div className="bp-tools-card mt-4 rounded-2xl p-5">
            <p className="bp-tools-heading text-xs font-bold uppercase tracking-widest">More tools</p>
            <ul className="mt-3 flex flex-col gap-2">
              {toolsLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="bp-tools-link group flex items-center justify-between gap-2 text-sm font-semibold transition-opacity"
                  >
                    {link.label}
                    <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      {/* Related articles — full width below the two columns */}
      <RelatedArticles posts={related} />
    </article>
  );
}

const comparisonRows = [
  ['Key mapping', 'English keys map to Urdu letters by sound or familiar association.', 'Urdu characters have fixed physical key positions; learn the arrangement.'],
  ['Learning difficulty', 'Usually easier to start if you already type English QWERTY.', 'Takes practice to memorise key positions, especially without Urdu labels.'],
  ['Typing habits', 'Builds on English-key familiarity and sound associations.', 'Builds Urdu-specific touch-typing muscle memory.'],
  ['Speed', 'Often quick to pick up; long-term speed depends on practice and the map.', 'Can be very fast for a fluent user; learning time is individual.'],
  ['Accuracy', 'Accurate when you know the map; lookalike sounds may need care.', 'Accurate when positions are familiar; unfamiliar keys can cause slips.'],
  ['Suitable users', 'Beginners, bilingual users, and people on English keyboards.', 'Regular Urdu typists, trained users, or people matching a required setup.'],
];

function UrduLayoutComparison() {
  return (
    <div className="mt-6 overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
      <table className="w-full min-w-[42rem] border-collapse text-sm" aria-label="Urdu phonetic and standard keyboard comparison">
        <thead><tr style={{ backgroundColor: 'var(--color-accent-light)' }}>
          {['Feature', 'Phonetic Urdu keyboard', 'Standard Urdu keyboard'].map((label) => <th key={label} scope="col" className="px-4 py-3 text-left font-bold" style={{ color: 'var(--color-text-primary)' }}>{label}</th>)}
        </tr></thead>
        <tbody>{comparisonRows.map(([feature, phonetic, standard]) => <tr key={feature} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
          <th scope="row" className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--color-text-primary)' }}>{feature}</th>
          <td className="px-4 py-3 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{phonetic}</td>
          <td className="px-4 py-3 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{standard}</td>
        </tr>)}</tbody>
      </table>
    </div>
  );
}

function UrduLayoutExamples() {
  const rows = [
    ['سلام', 's-l-a-m', 's → س · l → ل · a → ا · m → م', 'v-g-j-a', 'v → س · g → ل · j → ا · a → م'],
    ['کتاب', 'k-t-a-b', 'k → ک · t → ت · a → ا · b → ب', 'k-u-j-i', 'k → ک · u → ت · j → ا · i → ب'],
  ];
  return (
    <div className="mt-6 space-y-3">
      <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
        <table className="w-full min-w-[52rem] border-collapse text-sm" aria-label="Verified Urdu word input sequences by keyboard layout">
          <thead><tr style={{ backgroundColor: 'var(--color-accent-light)' }}>
            {['Urdu word', 'Typeoye phonetic keys', 'Phonetic mapping', 'Windows Urdu keys', 'Windows key mapping'].map((label) => <th key={label} scope="col" className="px-3 py-3 text-left font-bold" style={{ color: 'var(--color-text-primary)' }}>{label}</th>)}
          </tr></thead>
          <tbody>{rows.map(([word, phoneticKeys, phoneticMap, standardKeys, standardMap]) => <tr key={word} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
            <th scope="row" dir="rtl" className="px-3 py-3 text-right text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>{word}</th>
            <td className="px-3 py-3 font-mono" style={{ color: 'var(--color-text-secondary)' }}>{phoneticKeys}</td>
            <td className="px-3 py-3" style={{ color: 'var(--color-text-secondary)' }}>{phoneticMap}</td>
            <td className="px-3 py-3 font-mono" style={{ color: 'var(--color-text-secondary)' }}>{standardKeys}</td>
            <td className="px-3 py-3" style={{ color: 'var(--color-text-secondary)' }}>{standardMap}</td>
          </tr>)}</tbody>
        </table>
      </div>
      <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>Verified against Typeoye’s current phonetic converter and <a href="https://learn.microsoft.com/en-us/msdn-files/resources/msdn/goglobal/keyboards/kbdurdu.html" target="_blank" rel="noreferrer" className="underline">Microsoft’s Windows Urdu layout chart</a>. The Windows Urdu layout maps QWERTY key positions as shown; it is not the only Urdu layout used across platforms.</p>
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold">
        <Link to="/blog/urdu-phonetic-keyboard-layout" className="text-[var(--color-accent-text)]">See the full phonetic keyboard map</Link>
        <Link to="/blog/how-to-type-urdu-online-english-keyboard" className="text-[var(--color-accent-text)]">Learn to type Urdu online</Link>
        <Link to="/blog/urdu-typing-for-beginners" className="text-[var(--color-accent-text)]">Read the Urdu typing beginner guide</Link>
        <Link to="/blog/improve-urdu-typing-speed-and-accuracy" className="text-[var(--color-accent-text)]">Improve Urdu typing speed and accuracy</Link>
      </div>
    </div>
  );
}

function UrduWordExamples() {
  const rows = [
    ['سلام', 's l a m', 's → س · l → ل · a → ا · m → م', 'greeting'],
    ['کتاب', 'k t a b', 'k → ک · t → ت · a → ا · b → ب', 'book'],
    ['پاکستان', 'p a k s t a n', 'p → پ · a → ا · k → ک · s → س · t → ت · a → ا · n → ن', 'Pakistan'],
    ['آپ', 'A p', 'Shift+A → آ · p → پ', 'you (respectful)'],
    ['کیا', 'k i a', 'k → ک · i → ی · a → ا', 'what'],
    ['میں', 'm i N', 'm → م · i → ی · Shift+N → ں', 'I / in'],
    ['چائے', 'c a U y', 'c → چ · a → ا · Shift+U → ئ · y → ے', 'tea'],
    ['گھر', 'g H r', 'g → گ · Shift+H → ھ · r → ر', 'house / home'],
    ['شہر', 'x o r', 'x → ش · o → ہ · r → ر', 'city'],
    ['وقت', 'w q t', 'w → و · q → ق · t → ت', 'time'],
  ];

  return (
    <div className="mt-6 overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
      <table className="w-full min-w-[48rem] border-collapse text-sm" aria-label="Common Urdu words and verified Typeoye phonetic key sequences">
        <thead><tr style={{ backgroundColor: 'var(--color-accent-light)' }}>
          {['Urdu word', 'Keys to press', 'Character mapping', 'Meaning'].map((label) => <th key={label} scope="col" className="px-3 py-3 text-left font-bold" style={{ color: 'var(--color-text-primary)' }}>{label}</th>)}
        </tr></thead>
        <tbody>{rows.map(([word, keys, mapping, meaning]) => <tr key={word} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
          <th scope="row" dir="rtl" className="px-3 py-3 text-right text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>{word}</th>
          <td className="px-3 py-3 font-mono" style={{ color: 'var(--color-text-secondary)' }}>{keys}</td>
          <td className="px-3 py-3 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{mapping}</td>
          <td className="px-3 py-3" style={{ color: 'var(--color-text-secondary)' }}>{meaning}</td>
        </tr>)}</tbody>
      </table>
    </div>
  );
}

function UrduKeyboardFaqs() {
  const faqs = [
    ['Is an Urdu phonetic keyboard the same as Roman Urdu?', 'No. Roman Urdu is Urdu written with Latin letters. A phonetic keyboard uses English-labeled keys as input, then outputs Urdu-script characters.'],
    ['Which Urdu keyboard is easier for a beginner?', 'Many English QWERTY users find phonetic typing easier to begin because the key sounds are familiar. A learner who already knows a standard Urdu layout may find that one easier instead.'],
    ['Can I type the same Urdu words with both layouts?', 'Yes. The resulting Urdu text can be the same even though the physical key sequence differs. The examples above show سلام and کتاب on both maps.'],
    ['Will switching layouts change Urdu spelling or script?', 'No. A layout changes which key produces a character. It does not change the Urdu language, spelling, or script.'],
    ['Does Typeoye offer a standard Urdu keyboard?', 'Typeoye’s Urdu Learn, Urdu Practice, and Urdu Typing Test currently use Typeoye’s phonetic map. You can use a device’s system Urdu layout in other apps that accept that input method.'],
  ];
  return <div className="mt-6 space-y-5">{faqs.map(([question, answer]) => <div key={question}>
    <h3 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>{question}</h3>
    <p className="mt-1 text-[1.0625rem] leading-[1.75]" style={{ color: 'var(--color-text-secondary)' }}>{answer}</p>
  </div>)}</div>;
}

function GovernmentTypingPrepPlan() {
  const days = [
    ['Day 1: Find your baseline', 'Read the vacancy instructions first. Take one comfortable Urdu practice round, then note your speed, accuracy, and the characters you missed.'],
    ['Day 2: Review spelling and weak letters', 'Practise common Urdu words and the letter combinations that caused errors. Slow down enough to type each word correctly.'],
    ['Day 3: Add punctuation and spacing', 'Use short sentences with spaces and Urdu punctuation. Check misplaced punctuation, missing spaces, and accidental extra characters.'],
    ['Day 4: Introduce a timer', 'Do two short timed rounds with a break between them. Keep a steady pace and review errors after each round.'],
    ['Day 5: Target recurring errors', 'Choose a focused character or word drill from Urdu Practice, then finish with one paragraph at a comfortable pace.'],
    ['Day 6: Rehearse the stated format', 'If the official notice specifies duration, layout, software, or passage rules, use those details for a mock round. If it does not, practise a general timed passage without assuming a format.'],
    ['Day 7: Review and prepare', 'Take one light practice round, compare your log with Day 1, review the official instructions and required documents, and avoid an exhausting last-minute session.'],
  ];
  return <ol className="mt-6 grid gap-4 sm:grid-cols-2">{days.map(([title, detail]) => <li key={title} className="card p-4">
    <h3 className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{title}</h3>
    <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{detail}</p>
  </li>)}</ol>;
}

function GovernmentTypingMistakes() {
  const mistakes = [
    'Chasing a speed target that does not appear in your vacancy notice.',
    'Practising only speed and ignoring spelling, punctuation, and accuracy.',
    'Assuming an online test uses the recruiting department’s keyboard, software, or scoring rules.',
    'Switching layouts just before the test without checking the official input method.',
    'Taking repeated timed tests while tired instead of reviewing errors and resting between rounds.',
    'Treating a good practice score as proof of eligibility or a guarantee of selection.',
  ];
  return <ul className="mt-5 list-disc space-y-2 pl-6 text-[1.0625rem] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{mistakes.map((mistake) => <li key={mistake}>{mistake}</li>)}</ul>;
}

function GovernmentTypingFaqs() {
  const faqs = [
    ['What Urdu typing speed is required for a government job in Pakistan?', 'There is no single speed that applies to every vacancy. Check the current advertisement, syllabus, and candidate instructions for the exact post.'],
    ['Can Typeoye’s Urdu typing test prepare me for a recruitment test?', 'It can help you practise Urdu text and monitor your personal speed and accuracy. The department may use a different layout, software, duration, passage, or scoring method, so use the official instructions for the real format.'],
    ['Should I practise on a phonetic or standard Urdu keyboard?', 'Practise the layout that matches the exam instructions when they specify one. Typeoye’s Urdu tools use Typeoye’s phonetic map; use their practice while also learning any different required layout.'],
    ['How long should a government Urdu typing test last?', 'The duration depends on the department and vacancy. Use the advertised time if it is stated, and do not assume an online practice round has the same duration as the recruitment test.'],
    ['Will a high practice score guarantee selection?', 'No. Practice can help develop typing skill, but selection also depends on the official eligibility criteria, assessment process, and other requirements for that vacancy.'],
  ];
  return <div className="mt-6 space-y-5">{faqs.map(([question, answer]) => <div key={question}>
    <h3 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>{question}</h3>
    <p className="mt-1 text-[1.0625rem] leading-[1.75]" style={{ color: 'var(--color-text-secondary)' }}>{answer}</p>
  </div>)}</div>;
}

function MsWordFaqs() {
  const faqs = [
    ['Can I type Urdu in Word while keeping Windows in English?', 'Yes. Add an Urdu keyboard in Windows and switch to it when you need Urdu. You can keep the Windows display language and Word menus in English.'],
    ['Does right alignment make a paragraph right-to-left?', 'No. Right alignment places text at the right margin; paragraph direction controls the reading and typing order. Set both for an Urdu paragraph when needed.'],
    ['Why do my Urdu letters look disconnected in Word?', 'Check that the text is Unicode and that the selected font supports Urdu shaping. A missing or unsuitable font, or text copied from a legacy encoding, can change how letters appear.'],
    ['Which font should I use for Urdu in Word?', 'Choose an installed Unicode font that supports Urdu glyphs and shaping. Noto Nastaliq Urdu and Noto Naskh Arabic are examples; availability varies by computer.'],
    ['Is the built-in Windows Urdu keyboard phonetic?', 'Not necessarily. Windows may offer a different Urdu layout. Check the selected layout and key positions, and install a trusted compatible phonetic input method if that is what you want to use.'],
  ];
  return (
    <div className="mt-6 space-y-5">
      {faqs.map(([question, answer]) => (
        <div key={question}>
          <h3 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>{question}</h3>
          <p className="mt-1 text-[1.0625rem] leading-[1.75]" style={{ color: 'var(--color-text-secondary)' }}>{answer}</p>
        </div>
      ))}
    </div>
  );
}

function EnglishTypingLinks() {
  return (
    <aside className="mt-6 rounded-2xl border p-5 sm:p-6" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
      <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Practise and check your progress</h3>
      <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
        Use a short drill to focus on clean finger movement, then take a timed test to review accuracy and speed.
      </p>
      <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
        <Link to="/test" className="rounded-lg px-4 py-2 text-white" style={{ background: 'linear-gradient(135deg, #4361EE 0%, #7C3AED 100%)' }}>
          English Typing Test
        </Link>
        <Link to="/practice" className="rounded-lg border px-4 py-2" style={{ borderColor: 'var(--color-border)', color: 'var(--color-accent-text)' }}>
          Typing Practice
        </Link>
      </div>
    </aside>
  );
}

function TypingAccuracyFaqs() {
  const faqs = [
    ['How can I practice touch typing as a beginner?', 'Start with the home row and one small group of keys. Use the F and J bumps to place your hands, type slowly while looking at the prompt, and add a few new keys only when the current ones feel familiar.'],
    ['Should I cover my keyboard to stop looking?', 'You do not need to cover it at the start. Learn the home row and use the tactile F and J markers first. If you later try covering the keys, do it for a short, simple drill and stop if it makes you tense or guess.'],
    ['How do I reduce typing errors without slowing down permanently?', 'Slow down long enough to practise the correct finger movement, identify repeated mistakes, and work on the problem keys. Increase pace gradually after the movement becomes more reliable.'],
    ['What is a typing accuracy test useful for?', 'It provides feedback on a particular passage or session. Compare similar practice rounds and review the errors, rather than treating one score as a permanent measure of your ability.'],
    ['Should I focus on speed or accuracy first?', 'Build a comfortable, accurate rhythm first. If a faster pace causes frequent errors, return to the clean pace and practise the difficult transitions before increasing speed again.'],
  ];
  return (
    <div className="mt-6 space-y-5">
      {faqs.map(([question, answer]) => (
        <div key={question}>
          <h3 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>{question}</h3>
          <p className="mt-1 text-[1.0625rem] leading-[1.75]" style={{ color: 'var(--color-text-secondary)' }}>{answer}</p>
        </div>
      ))}
    </div>
  );
}

function UrduKaiseFaqs() {
  const faqs = [
    ['How do I type Urdu on a Windows PC?', 'Add an Urdu language or keyboard under Settings > Time & language > Language & region, then select its layout from the taskbar or with Windows + Space. Choose a layout that matches how you want to type.'],
    ['How do I type Urdu on Android or iPhone?', 'Add Urdu in your keyboard settings. Gboard on Android lets you add Urdu under Languages and choose a layout; iPhone has Urdu keyboard options under Settings > General > Keyboard > Keyboards. Switch with the keyboard’s language key.'],
    ['What is the difference between phonetic and standard Urdu typing?', 'Phonetic typing maps English key sounds to Urdu characters. A standard Urdu layout assigns Urdu characters to fixed key positions that you learn. Both produce Urdu script, but the key positions and input behavior differ.'],
    ['Will every Roman Urdu word convert automatically?', 'No. A phonetic map follows its own key assignments, and a standard layout types the character on the selected key. Roman Urdu transliteration and phonetic key mapping are different input methods.'],
    ['Why is my Urdu text going in the wrong direction in Word?', 'Set the paragraph direction to right-to-left, then choose right alignment separately if needed. Right alignment alone does not change the paragraph reading direction.'],
  ];
  return (
    <div className="mt-6 space-y-5">
      {faqs.map(([question, answer]) => (
        <div key={question}>
          <h3 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>{question}</h3>
          <p className="mt-1 text-[1.0625rem] leading-[1.75]" style={{ color: 'var(--color-text-secondary)' }}>{answer}</p>
        </div>
      ))}
    </div>
  );
}

function PostFaqs({ faqs }: { faqs: Array<{ question: string; answer: string }> }) {
  return (
    <div className="mt-6 space-y-5">
      {faqs.map(({ question, answer }) => (
        <div key={question}>
          <h3 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>{question}</h3>
          <p className="mt-1 text-[1.0625rem] leading-[1.75]" style={{ color: 'var(--color-text-secondary)' }}>{answer}</p>
        </div>
      ))}
    </div>
  );
}

function CertificateSteps() {
  const steps = [
    <>Open the <Link to="/certificate" className="font-semibold underline" style={{ color: 'var(--color-accent-text)' }}>Typing Certificate page</Link>. Enter the name you want printed and select a duration: 1, 2, 5, 10, or 15 minutes.</>,
    <>Select <strong>Start Certificate Test</strong>. Type the passage shown during the timed run and finish the test.</>,
    <>Review the result. Typeoye currently requires at least 30 WPM and 90% accuracy in the same attempt. If you fall short, use <Link to="/practice" className="font-semibold underline" style={{ color: 'var(--color-accent-text)' }}>Typing Practice</Link> and try again.</>,
    <>When the result says <strong>Certificate Earned</strong>, select <strong>Download Certificate</strong> to save the PDF. Sign in first if you also want earned certificates saved to your profile.</>,
  ];

  return (
    <ol className="mt-6 space-y-4">
      {steps.map((step, index) => (
        <li key={index} className="flex gap-3 rounded-xl border p-4" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-bold" style={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent-text)' }}>{index + 1}</span>
          <span className="leading-relaxed">{step}</span>
        </li>
      ))}
    </ol>
  );
}

function GovernmentOfficialExample() {
  return <aside className="mt-5 rounded-xl border p-4 text-sm leading-relaxed" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
    <p><strong style={{ color: 'var(--color-text-primary)' }}>A vacancy-specific illustration:</strong> an FPSC 2023 syllabus for Deputy Director (Urdu Stenography) listed an InPage Urdu typing test with a minimum 40 w.p.m. and 90% accuracy. That was a requirement for that particular specialist post and syllabus; it is not a general benchmark for government jobs.</p>
    <a href="https://www.fpsc.gov.pk/assets/media/2024-06-12-Syllabus-Combined-Ad-No-5-2023.pdf" target="_blank" rel="noreferrer" className="mt-2 inline-block font-semibold text-[var(--color-accent-text)] underline">View the FPSC syllabus (PDF)</a>
  </aside>;
}
