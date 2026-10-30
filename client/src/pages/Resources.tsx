import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, ExternalLink, Search } from 'lucide-react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { useSeo } from '../hooks/useSeo';
import KeyboardLayouts from './KeyboardLayouts';
import { AVAILABLE_LAYOUTS, KEYBOARD_DOWNLOADS, KEYBOARD_SHORTCUTS, RESOURCE_PAGE_LINKS, SPECIAL_CHARACTERS } from '../data/resources';

type Kind = 'keyboard-downloads' | 'keyboard-layouts' | 'keyboard-shortcuts' | 'special-characters';
const PAGE_INFO: Record<Kind, { title: string; description: string; keywords: string }> = {
  'keyboard-downloads': { title: 'Keyboard Downloads and Official Setup Guides | Typeoye', description: 'Find verified keyboard setup instructions for Windows, macOS, Android, and iOS. Go to official providers for built-in language keyboards.', keywords: 'keyboard downloads, language keyboard setup, keyboard for Windows, Gboard languages' },
  'keyboard-layouts': { title: 'Keyboard Layouts for English and Urdu | Typeoye', description: 'Explore accurate Windows English US, English UK and Typeoye Urdu Phonetic keyboard layouts. View complete key mappings and download printable charts.', keywords: 'keyboard layouts, English US keyboard, English UK keyboard, Urdu phonetic keyboard, keyboard chart' },
  'keyboard-shortcuts': { title: 'Keyboard Shortcuts for Windows, Mac and Browsers | Typeoye', description: 'Browse verified keyboard shortcuts for switching input languages, editing text, and using your desktop browser.', keywords: 'keyboard shortcuts, Windows shortcuts, Mac shortcuts, typing shortcuts' },
  'special-characters': { title: 'Special Characters: Names and Unicode | Typeoye', description: 'Search common punctuation, currency, math, technical, and Arabic-script characters. Copy each symbol and check its Unicode code point.', keywords: 'special characters, Unicode characters, Arabic punctuation, copy symbols' },
};
const CATEGORY_NAMES: Record<Kind, string> = { 'keyboard-downloads': 'Keyboard Downloads', 'keyboard-layouts': 'Keyboard Layouts', 'keyboard-shortcuts': 'Keyboard Shortcuts', 'special-characters': 'Special Characters' };
const fieldClass = 'w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/40';
const cardStyle = { backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' };

function ExternalLinkButton({ href, children }: { href: string; children: React.ReactNode }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg,#4361EE,#7C3AED)' }}>{children}<ExternalLink size={15} /></a>;
}

function FilterBar({ query, setQuery, category, setCategory, categories }: { query: string; setQuery: (v: string) => void; category: string; setCategory: (v: string) => void; categories: string[] }) {
  return <div className="mb-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]"><label className="relative"><span className="sr-only">Search resources</span><Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-secondary)' }} /><input className={fieldClass} style={{ ...cardStyle, paddingLeft: '2.75rem', color: 'var(--color-text-primary)' }} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search resources…" /></label><label><span className="sr-only">Filter by category</span><select className={fieldClass} style={{ ...cardStyle, color: 'var(--color-text-primary)' }} value={category} onChange={(e) => setCategory(e.target.value)}><option value="All">All categories</option>{categories.map((c) => <option key={c}>{c}</option>)}</select></label></div>;
}

function RelatedResources() { return <aside className="mt-10 rounded-2xl border p-5" style={cardStyle}><h2 className="font-bold text-lg">Explore more Typeoye tools</h2><div className="mt-3 flex flex-wrap gap-3 text-sm">{RESOURCE_PAGE_LINKS.map((l) => <Link key={l.href} to={l.href} className="font-semibold text-blue-700 hover:underline">{l.label}</Link>)}<Link to="/test" className="font-semibold text-blue-700 hover:underline">Typing Test</Link><Link to="/practice" className="font-semibold text-blue-700 hover:underline">Practice typing</Link><Link to="/urdu-practice" className="font-semibold text-blue-700 hover:underline">Urdu Practice</Link></div></aside>; }

function DownloadPage() {
  const [query, setQuery] = useState(''); const [os, setOs] = useState('All'); const [type, setType] = useState('All');
  const osOptions = ['Windows', 'macOS', 'Android', 'iOS'];
  const records = KEYBOARD_DOWNLOADS.filter((item) => `${item.language} ${item.type} ${item.description}`.toLowerCase().includes(query.toLowerCase()) && (os === 'All' || (item.platforms as readonly string[]).includes(os)) && (type === 'All' || item.type === type));
  return <><FilterBar query={query} setQuery={setQuery} category={os} setCategory={setOs} categories={osOptions} /><label className="mb-5 flex max-w-sm items-center gap-2 text-sm">Keyboard type<select className="rounded-lg border px-3 py-2" style={cardStyle} value={type} onChange={(e) => setType(e.target.value)}><option>All</option><option>Built-in keyboard</option><option>Mobile keyboard app</option></select></label><div className="grid gap-4 md:grid-cols-2">{records.map((item) => <article key={item.id} className="rounded-2xl border p-5" style={cardStyle}><p className="text-xs font-bold uppercase tracking-wide text-blue-700">{item.platforms.join(' · ')}</p><h2 className="mt-2 text-xl font-bold">{item.language}</h2><p className="mt-2 text-sm leading-6" style={{ color: 'var(--color-text-secondary)' }}>{item.description}</p><p className="mt-3 text-xs">Keyboard type: {item.type} · Source: {item.provider}</p><div className="mt-4"><ExternalLinkButton href={item.url}>Official setup instructions</ExternalLinkButton></div></article>)}</div>{!records.length && <p role="status" className="rounded-xl border p-6 text-center" style={cardStyle}>No keyboard setup guides match those filters.</p>}<p className="mt-5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>Language availability depends on your device and operating system. These links lead to provider instructions; Typeoye does not host keyboard installers. Language-specific records will be added after each source is verified.</p></>;
}

function LayoutPage() { return <KeyboardLayouts />; }

function ShortcutsPage() {
  const [query, setQuery] = useState(''); const [category, setCategory] = useState('All'); const categories = ['Windows', 'macOS', 'Browser', 'Text editing'];
  const records = KEYBOARD_SHORTCUTS.filter((x) => `${x.name} ${x.keys} ${x.detail} ${x.platforms}`.toLowerCase().includes(query.toLowerCase()) && (category === 'All' || x.category === category));
  return <><FilterBar query={query} setQuery={setQuery} category={category} setCategory={setCategory} categories={categories} /><div className="grid gap-3 md:grid-cols-2">{records.map((x) => <article className="rounded-xl border p-4" style={cardStyle} key={x.name}><p className="text-xs font-bold uppercase text-blue-700">{x.category} · {x.platforms}</p><h2 className="mt-1 font-bold">{x.name}</h2><kbd className="mt-3 inline-block rounded-lg bg-slate-100 px-3 py-2 font-mono text-sm text-slate-900">{x.keys}</kbd><p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{x.detail}</p><a className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-700" href={x.url} target="_blank" rel="noopener noreferrer">{x.source} <ExternalLink size={12} /></a></article>)}</div>{!records.length && <p role="status" className="p-6 text-center">No shortcuts match that search.</p>}</>;
}

function SpecialCharactersPage() {
  const [query, setQuery] = useState(''); const [category, setCategory] = useState('All'); const categories = [...new Set(SPECIAL_CHARACTERS.map((x) => x.category))];
  const records = SPECIAL_CHARACTERS.filter((x) => `${x.char} ${x.name} ${x.code} ${x.category} ${x.note}`.toLowerCase().includes(query.toLowerCase()) && (category === 'All' || x.category === category));
  const [copied, setCopied] = useState('');
  const copy = async (char: string) => { try { await navigator.clipboard.writeText(char); setCopied(char); window.setTimeout(() => setCopied(''), 1400); } catch { setCopied('error'); } };
  return <><FilterBar query={query} setQuery={setQuery} category={category} setCategory={setCategory} categories={categories} /><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{records.map((x) => <article key={x.code} className="flex items-center gap-3 rounded-xl border p-4" style={cardStyle}><div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-blue-50 text-3xl text-blue-800" dir={x.category === 'Arabic & Urdu' ? 'rtl' : 'ltr'}>{x.char}</div><div className="min-w-0 flex-1"><h2 className="font-bold">{x.name}</h2><p className="font-mono text-xs">{x.code} · {x.category}</p><p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{x.note}</p></div><button onClick={() => void copy(x.char)} aria-label={`Copy ${x.name}`} className="rounded-lg border p-2" style={cardStyle}><Copy size={16} /></button></article>)}</div><p aria-live="polite" className="mt-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{copied === 'error' ? 'Clipboard access was blocked by the browser.' : copied ? `Copied ${copied}` : ''}</p><p className="mt-4 text-xs" style={{ color: 'var(--color-text-secondary)' }}>Unicode names and code points are referenced from the Unicode Character Database.</p></>;
}

export default function Resources({ kind }: { kind: Kind }) {
  const detail = kind === 'keyboard-layouts' && window.location.pathname.split('/').length > 3;
  const heading = detail ? AVAILABLE_LAYOUTS.find((x) => x.id === window.location.pathname.split('/').pop())?.name ?? CATEGORY_NAMES[kind] : CATEGORY_NAMES[kind];
  useSeo({ title: detail ? `${heading} | Keyboard Layout | Typeoye` : PAGE_INFO[kind].title, description: detail ? `Preview and download the ${heading} keyboard mapping with complete key and Shift output.` : PAGE_INFO[kind].description, keywords: PAGE_INFO[kind].keywords, canonicalPath: detail ? window.location.pathname : `/resources/${kind}` });
  return <PageWrapper title={heading} manageTitle={false} description={detail ? `Preview the complete ${heading} keyboard mapping and download a chart.` : PAGE_INFO[kind].description} className="py-10" fullWidth><div className={`mx-auto w-full ${kind === 'keyboard-layouts' ? 'max-w-7xl' : 'max-w-6xl'}`}><div className={`grid gap-8 ${kind === 'keyboard-layouts' ? '' : 'lg:grid-cols-[minmax(0,1fr)_220px]'}`}><main>{kind === 'keyboard-downloads' && <DownloadPage />}{kind === 'keyboard-layouts' && <LayoutPage />}{kind === 'keyboard-shortcuts' && <ShortcutsPage />}{kind === 'special-characters' && <SpecialCharactersPage />}<RelatedResources /></main>{kind !== 'keyboard-layouts' && <aside className="h-fit rounded-2xl border p-4" style={cardStyle}><h2 className="font-bold">Resources</h2><nav aria-label="Resource pages" className="mt-2 flex flex-col">{RESOURCE_PAGE_LINKS.map((l) => <Link key={l.href} to={l.href} className="rounded-lg px-2.5 py-2 text-sm hover:bg-blue-50">{l.label}</Link>)}</nav></aside>}</div></div></PageWrapper>;
}
