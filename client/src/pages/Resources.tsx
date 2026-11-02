import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download, ExternalLink, FileText, Search, Keyboard, DownloadCloud, Command, Lock, ChevronDown } from 'lucide-react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { useSeo } from '../hooks/useSeo';
import KeyboardLayouts from './KeyboardLayouts';
import { AVAILABLE_LAYOUTS, KEYBOARD_DOWNLOADS, RESOURCE_PAGE_LINKS, KEYBOARD_SHORTCUTS_ENABLED } from '../data/resources';
import { KEYBOARD_SHORTCUT_PDF_CATEGORIES, formatPdfSize, type KeyboardShortcutPdf } from '../data/resources/keyboardShortcuts';
import { checkPublishedShortcutPdf, getPublishedShortcutPdf, listPublishedShortcutPdfs, publicShortcutPdfUrl } from '../services/keyboardShortcutPdf.service';

type Kind = 'keyboard-downloads' | 'keyboard-layouts' | 'keyboard-shortcuts';
const PAGE_INFO: Record<Kind, { title: string; description: string; keywords: string }> = {
  'keyboard-downloads': { title: 'Keyboard Downloads and Official Setup Guides | Typeoye', description: 'Find verified keyboard setup instructions for Windows, macOS, Android, and iOS. Go to official providers for built-in language keyboards.', keywords: 'keyboard downloads, language keyboard setup, keyboard for Windows, Gboard languages' },
  'keyboard-layouts': { title: 'Keyboard Layouts for English and Urdu | Typeoye', description: 'Explore accurate Windows English US, English UK and Typeoye Urdu Phonetic keyboard layouts. View complete key mappings and download printable charts.', keywords: 'keyboard layouts, English US keyboard, English UK keyboard, Urdu phonetic keyboard, keyboard chart' },
  'keyboard-shortcuts': { title: 'Keyboard Shortcuts for Windows, Mac and Browsers | Typeoye', description: 'Browse verified keyboard shortcuts for switching input languages, editing text, and using your desktop browser.', keywords: 'keyboard shortcuts, Windows shortcuts, Mac shortcuts, typing shortcuts' },
};
const CATEGORY_NAMES: Record<Kind, string> = { 'keyboard-downloads': 'Keyboard Downloads', 'keyboard-layouts': 'Keyboard Layouts', 'keyboard-shortcuts': 'Keyboard Shortcuts' };
const fieldClass = 'w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/40';
const cardStyle = { backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' };

function ExternalLinkButton({ href, children }: { href: string; children: React.ReactNode }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg,#4361EE,#7C3AED)' }}>{children}<ExternalLink size={15} /></a>;
}

function FilterBar({ query, setQuery, category, setCategory, categories }: { query: string; setQuery: (v: string) => void; category: string; setCategory: (v: string) => void; categories: string[] }) {
  return <div className="mb-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]"><label className="relative"><span className="sr-only">Search resources</span><Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-secondary)' }} /><input className={fieldClass} style={{ ...cardStyle, paddingLeft: '2.75rem', color: 'var(--color-text-primary)' }} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search resources…" /></label><label><span className="sr-only">Filter by category</span><select className={fieldClass} style={{ ...cardStyle, color: 'var(--color-text-primary)' }} value={category} onChange={(e) => setCategory(e.target.value)}><option value="All">All categories</option>{categories.map((c) => <option key={c}>{c}</option>)}</select></label></div>;
}

const LOCKED_SHORTCUT_CATEGORIES = new Set(['Google Workspace', 'Operating System', 'Development Tools', 'Other']);
function ShortcutCategoryDropdown({ value, onChange }: { value: (typeof KEYBOARD_SHORTCUT_PDF_CATEGORIES)[number]; onChange: (value: (typeof KEYBOARD_SHORTCUT_PDF_CATEGORIES)[number]) => void }) {
  const [open, setOpen] = useState(false);
  const [tooltip, setTooltip] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [open]);

  return <div className="relative" ref={containerRef}>
    <button type="button" aria-label="Filter shortcut guides by category" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((current) => !current)} className={`${fieldClass} flex items-center justify-between gap-3 text-left`} style={{ ...cardStyle, color: 'var(--color-text-primary)' }}>
      <span>{value}</span><ChevronDown size={16} aria-hidden="true" className={`transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
    {open && <div role="listbox" aria-label="Shortcut guide categories" className="absolute z-30 mt-1 w-full overflow-visible rounded-xl border p-1 shadow-lg" style={{ ...cardStyle, backgroundColor: 'var(--color-card)' }}>
      {KEYBOARD_SHORTCUT_PDF_CATEGORIES.map((category) => {
        const locked = LOCKED_SHORTCUT_CATEGORIES.has(category);
        return <div key={category} className="relative">
          <button type="button" role="option" aria-selected={value === category} aria-disabled={locked} title={locked ? 'Coming Soon' : undefined} onClick={() => {
            if (locked) { setTooltip(category); return; }
            onChange(category);
            setOpen(false);
            setTooltip(null);
          }} onMouseEnter={() => locked && setTooltip(category)} onMouseLeave={() => setTooltip(null)} onFocus={() => locked && setTooltip(category)} onBlur={() => setTooltip(null)} className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${locked ? 'cursor-not-allowed text-slate-400' : 'hover:bg-blue-50'}`} style={{ color: locked ? 'var(--color-text-secondary)' : 'var(--color-text-primary)', opacity: locked ? 0.62 : 1 }}>
            <span>{category}</span>{locked ? <Lock size={14} aria-label="Coming Soon" /> : null}
          </button>
          {locked && tooltip === category && <span role="tooltip" className="absolute right-2 top-0 z-40 -translate-y-full whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white shadow">Coming Soon</span>}
        </div>;
      })}
    </div>}
  </div>;
}

function RelatedResources() { return <aside className="mt-10 rounded-2xl border p-5" style={cardStyle}><h2 className="font-bold text-lg">Explore more Typeoye tools</h2><div className="mt-3 flex flex-wrap gap-3 text-sm">{RESOURCE_PAGE_LINKS.map((l) => <Link key={l.href} to={l.href} className="font-semibold text-blue-700 hover:underline">{l.label}</Link>)}<Link to="/test" className="font-semibold text-blue-700 hover:underline">Typing Test</Link><Link to="/practice" className="font-semibold text-blue-700 hover:underline">Practice typing</Link><Link to="/urdu-practice" className="font-semibold text-blue-700 hover:underline">Urdu Practice</Link></div></aside>; }

function DownloadPage() {
  const [query, setQuery] = useState(''); const [os, setOs] = useState('All'); const [type, setType] = useState('All');
  const osOptions = ['Windows', 'macOS', 'Android', 'iOS'];
  const records = KEYBOARD_DOWNLOADS.filter((item) => `${item.language} ${item.type} ${item.description}`.toLowerCase().includes(query.toLowerCase()) && (os === 'All' || (item.platforms as readonly string[]).includes(os)) && (type === 'All' || item.type === type));
  return <>
    <FilterBar query={query} setQuery={setQuery} category={os} setCategory={setOs} categories={osOptions} />
    <label className="mb-5 flex max-w-sm items-center gap-2 text-sm">Keyboard type<select className="rounded-lg border px-3 py-2" style={cardStyle} value={type} onChange={(e) => setType(e.target.value)}><option>All</option><option>Built-in keyboard</option><option>Mobile keyboard app</option></select></label>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{records.map((item) => <article key={item.id} className="rounded-2xl border p-5" style={cardStyle}><p className="text-xs font-bold uppercase tracking-wide text-blue-700">{item.platforms.join(' · ')}</p><h2 className="mt-2 text-xl font-bold">{item.language}</h2><p className="mt-2 text-sm leading-6" style={{ color: 'var(--color-text-secondary)' }}>{item.description}</p><p className="mt-3 text-xs">Keyboard type: {item.type} · Source: {item.provider}</p><div className="mt-4"><ExternalLinkButton href={item.url}>Official setup instructions</ExternalLinkButton></div></article>)}</div>
    {!records.length && <p role="status" className="rounded-xl border p-6 text-center" style={cardStyle}>No keyboard setup guides match those filters.</p>}
    <p className="mt-5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>Language availability depends on your device and operating system. These links lead to provider instructions; Typeoye does not host keyboard installers. Language-specific records will be added after each source is verified.</p>
  </>;
}

function LayoutPage() { return <KeyboardLayouts />; }

function PdfActionLink({ href, children, secondary = false, download }: { href: string; children: React.ReactNode; secondary?: boolean; download?: string }) {
  return (
    <a
      href={href}
      download={download}
      target={secondary ? undefined : '_blank'}
      rel={secondary ? undefined : 'noopener noreferrer'}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-semibold ${secondary ? 'border text-[var(--color-text-primary)]' : 'text-white'}`}
      style={secondary ? cardStyle : { background: 'linear-gradient(135deg,#4361EE,#7C3AED)' }}
    >
      {children}
    </a>
  );
}

function ShortcutPdfCard({ item }: { item: KeyboardShortcutPdf }) {
  const badge = item.applicationName.includes('Word') ? 'W' : item.applicationName.includes('Excel') ? 'X' : item.applicationName.includes('PowerPoint') ? 'P' : item.applicationName.slice(0, 1).toUpperCase();
  const size = formatPdfSize(item.fileSize);
  const pages = item.pageCount ? `${item.pageCount} pages` : 'Not listed';
  const updated = item.lastUpdated ? new Date(`${item.lastUpdated}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : new Date(item.updatedAt || item.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return (
    <article className="flex h-full flex-col rounded-2xl border p-5" style={cardStyle}>
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-blue-50 text-lg font-extrabold text-blue-700">{badge}</span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wide text-blue-700">{item.category}</p>
          <h2 className="mt-1 text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>{item.applicationName}</h2>
        </div>
      </div>
      <h3 className="mt-4 font-semibold" style={{ color: 'var(--color-text-primary)' }}>{item.title}</h3>
      <p className="mt-2 flex-1 text-sm leading-6" style={{ color: 'var(--color-text-secondary)' }}>{item.description}</p>
      <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        <div><dt className="font-semibold">Language</dt><dd>{item.language}</dd></div>
        <div><dt className="font-semibold">File size</dt><dd>{size}</dd></div>
        <div><dt className="font-semibold">Pages</dt><dd>{pages}</dd></div>
        <div><dt className="font-semibold">Last updated</dt><dd>{updated}</dd></div>
      </dl>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link to={`/resources/keyboard-shortcuts/${item.slug}`} className="inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg,#4361EE,#7C3AED)' }}><FileText size={16} /> View PDF</Link>
        <PdfActionLink href={publicShortcutPdfUrl(item.slug, true)} secondary><Download size={16} /> Download PDF</PdfActionLink>
      </div>
    </article>
  );
}

function ShortcutsPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<(typeof KEYBOARD_SHORTCUT_PDF_CATEGORIES)[number]>('All Applications');
  const [available, setAvailable] = useState<KeyboardShortcutPdf[]>([]);
  const [checking, setChecking] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let active = true;
    void listPublishedShortcutPdfs().then(({ items }) => {
      if (active) { setAvailable(items); setChecking(false); setLoadFailed(false); }
    }).catch(() => { if (active) { setChecking(false); setLoadFailed(true); } });
    return () => { active = false; };
  }, []);

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = available.filter((item) => {
    const matchesSearch = `${item.applicationName} ${item.title} ${item.description} ${item.category} ${item.language}`.toLowerCase().includes(normalizedQuery);
    const matchesAvailableCategory = item.category === 'Microsoft Office' && (category === 'All Applications' || category === 'Microsoft Office');
    return matchesSearch && matchesAvailableCategory;
  });

  return (
      <section aria-label="Downloadable keyboard shortcut PDF library">
      <h2 className="mb-4 text-2xl font-bold">Downloadable keyboard shortcut PDFs</h2>
      <div className="mb-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_240px]">
        <label className="relative">
          <span className="sr-only">Search applications or shortcut guides</span>
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-secondary)' }} />
          <input className={fieldClass} style={{ ...cardStyle, paddingLeft: '2.75rem', color: 'var(--color-text-primary)' }} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search applications or shortcut guides..." />
        </label>
        <div>
          <ShortcutCategoryDropdown value={category} onChange={setCategory} />
        </div>
      </div>
      {checking ? (
        <p role="status" className="rounded-xl border p-6 text-center" style={cardStyle}>Checking available shortcut guides…</p>
      ) : filtered.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{filtered.map((item) => <ShortcutPdfCard key={item.id} item={item} />)}</div>
      ) : loadFailed ? (
        <p role="alert" className="rounded-xl border p-6 text-center" style={cardStyle}>Keyboard shortcut guides could not be loaded right now. Please try again later.</p>
      ) : available.length ? (
        <p role="status" className="rounded-xl border p-6 text-center" style={cardStyle}>No shortcut guides match your search and category. Try changing the filters.</p>
      ) : (
        <div className="rounded-2xl border p-7 text-center sm:p-9" style={cardStyle}>
          <span aria-hidden="true" className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-700"><FileText size={26} /></span>
          <h2 className="mt-4 text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Keyboard shortcut PDFs are coming soon</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6" style={{ color: 'var(--color-text-secondary)' }}>There are no published PDF guides yet. Guides will appear here after the original PDF files have been added and published.</p>
        </div>
      )}
      </section>
  );
}

function ShortcutPdfViewer({ slug }: { slug: string }) {
  const [item, setItem] = useState<KeyboardShortcutPdf | null>(null);
  const [state, setState] = useState<'checking' | 'ready' | 'missing'>('checking');

  useEffect(() => {
    let active = true;
    setState('checking');
    void getPublishedShortcutPdf(slug).then(async ({ item: guide }) => {
      if (!active) return;
      setItem(guide);
      const available = await checkPublishedShortcutPdf(slug);
      if (active) setState(available ? 'ready' : 'missing');
    }).catch(() => { if (active) setState('missing'); });
    return () => { active = false; };
  }, [slug]);

  if (state === 'checking') return <p role="status" className="rounded-xl border p-6 text-center" style={cardStyle}>Checking PDF availability…</p>;
  if (state === 'missing' || !item) {
    return <div className="rounded-2xl border p-7 text-center" style={cardStyle}>
      <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>This PDF guide is not available</h2>
      <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>The guide may not have been published yet or its file could not be loaded. Please return to the Keyboard Shortcuts library.</p>
      <Link to="/resources/keyboard-shortcuts" className="mt-5 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg,#4361EE,#7C3AED)' }}><ArrowLeft size={16} /> Back to Keyboard Shortcuts</Link>
    </div>;
  }

  return <section aria-label={`${item.applicationName} PDF viewer`}>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4" style={cardStyle}>
      <div><h2 className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{item.title}</h2><p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{item.language} · {formatPdfSize(item.fileSize)}{item.pageCount ? ` · ${item.pageCount} pages` : ''}</p></div>
      <div className="flex flex-wrap gap-2">
        <Link to="/resources/keyboard-shortcuts" className="inline-flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-sm font-semibold" style={{ ...cardStyle, color: 'var(--color-text-primary)' }}><ArrowLeft size={16} /> Back to Keyboard Shortcuts</Link>
        <PdfActionLink href={publicShortcutPdfUrl(item.slug, true)} secondary><Download size={16} /> Download PDF</PdfActionLink>
      </div>
    </div>
    <iframe key={item.slug} title={`${item.applicationName} keyboard shortcuts PDF`} src={publicShortcutPdfUrl(item.slug)} className="h-[70vh] min-h-[460px] w-full rounded-xl border bg-slate-100 sm:h-[78vh]" style={{ borderColor: 'var(--color-border)' }} />
    <p className="mt-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>Use your browser’s PDF controls to move between pages and adjust zoom.</p>
  </section>;
}
export default function Resources({ kind }: { kind: Kind }) {
  const { shortcutSlug } = useParams<{ shortcutSlug?: string }>();
  const pathnameParts = window.location.pathname.split('/').filter(Boolean);
  const layoutDetail = kind === 'keyboard-layouts' && pathnameParts.length > 2;
  const shortcutDetail = kind === 'keyboard-shortcuts' && Boolean(shortcutSlug);
  const compactResourceIndex = kind === 'keyboard-downloads' || (kind === 'keyboard-shortcuts' && !shortcutDetail);
  const layout = layoutDetail ? AVAILABLE_LAYOUTS.find((item) => item.id === pathnameParts[pathnameParts.length - 1]) : undefined;
  const [shortcut, setShortcut] = useState<KeyboardShortcutPdf | undefined>(undefined);
  useEffect(() => {
    let active = true;
    if (!KEYBOARD_SHORTCUTS_ENABLED) { setShortcut(undefined); return () => { active = false; }; }
    if (shortcutSlug) void getPublishedShortcutPdf(shortcutSlug).then(({ item }) => { if (active) setShortcut(item); }).catch(() => { if (active) setShortcut(undefined); });
    else setShortcut(undefined);
    return () => { active = false; };
  }, [shortcutSlug]);
  const heading = shortcutDetail ? shortcut?.applicationName ?? 'Keyboard Shortcuts Guide' : layoutDetail ? layout?.name ?? CATEGORY_NAMES[kind] : CATEGORY_NAMES[kind];
  const description = shortcutDetail
    ? shortcut ? `View the original ${shortcut.applicationName} keyboard shortcuts PDF online or download it for quick reference.` : 'View available keyboard shortcut PDF guides.'
    : layoutDetail ? `Preview the complete ${heading} keyboard mapping and download a chart.`
      : kind === 'keyboard-shortcuts' ? 'Explore keyboard shortcut guides for popular applications. View shortcut PDFs online or download them for quick reference.' : PAGE_INFO[kind].description;
  const seoTitle = shortcutDetail ? `${heading} Keyboard Shortcuts PDF | Typeoye` : layoutDetail ? `${heading} | Keyboard Layout | Typeoye` : PAGE_INFO[kind].title;
  const seoDescription = kind === 'keyboard-shortcuts' && !shortcutDetail ? description : shortcutDetail ? description : layoutDetail ? description : PAGE_INFO[kind].description;
  useSeo({ title: seoTitle, description: seoDescription, keywords: PAGE_INFO[kind].keywords, canonicalPath: layoutDetail || shortcutDetail ? window.location.pathname : `/resources/${kind}`, robots: shortcutDetail && (!shortcut || !shortcut.published) ? 'noindex, nofollow' : undefined });
  const headerIcon = kind === 'keyboard-layouts' ? Keyboard : kind === 'keyboard-downloads' ? DownloadCloud : Command;
  if (kind === 'keyboard-shortcuts' && !KEYBOARD_SHORTCUTS_ENABLED) {
    return <PageWrapper title="Keyboard Shortcuts" manageTitle={false} icon={headerIcon} descriptionAlignLeft compactHeader className="py-5 sm:py-6" description="Keyboard shortcut guides are coming soon." fullWidth>
      <div className="mx-auto w-full max-w-3xl rounded-2xl border p-7 text-center sm:p-9" style={cardStyle}>
        <span aria-hidden="true" className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-500"><Lock size={25} /></span>
        <h2 className="mt-4 text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Coming Soon</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6" style={{ color: 'var(--color-text-secondary)' }}>Keyboard Shortcuts resources will be available soon.</p>
        <nav aria-label="Other resources" className="mt-5 flex flex-wrap justify-center gap-3">{RESOURCE_PAGE_LINKS.filter((link) => !link.locked).map((link) => <Link key={link.href} to={link.href} className="rounded-lg border px-3.5 py-2 text-sm font-semibold" style={{ ...cardStyle, color: 'var(--color-text-primary)' }}>{link.label}</Link>)}</nav>
      </div>
    </PageWrapper>;
  }
  return <PageWrapper title={heading} manageTitle={false} icon={headerIcon} descriptionAlignLeft compactHeader className="py-5 sm:py-6" description={description} fullWidth>
    <div className={`mx-auto w-full ${kind === 'keyboard-layouts' || compactResourceIndex ? 'max-w-7xl' : 'max-w-6xl'}`}>
      <div className={`grid gap-8 ${kind === 'keyboard-layouts' || compactResourceIndex ? '' : 'lg:grid-cols-[minmax(0,1fr)_220px]'}`}>
        <main>
          {kind === 'keyboard-downloads' && <DownloadPage />}
          {kind === 'keyboard-layouts' && <LayoutPage />}
          {kind === 'keyboard-shortcuts' && (shortcutSlug ? <ShortcutPdfViewer slug={shortcutSlug} /> : <ShortcutsPage />)}
          {!shortcutDetail && <RelatedResources />}
        </main>
        {kind !== 'keyboard-layouts' && !compactResourceIndex && <aside className="h-fit rounded-2xl border p-4" style={cardStyle}><h2 className="font-bold">Resources</h2><nav aria-label="Resource pages" className="mt-2 flex flex-col">{RESOURCE_PAGE_LINKS.map((link) => <Link key={link.href} to={link.href} className="rounded-lg px-2.5 py-2 text-sm hover:bg-blue-50">{link.label}</Link>)}</nav></aside>}
      </div>
    </div>
  </PageWrapper>;
}
