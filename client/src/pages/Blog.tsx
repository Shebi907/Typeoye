import { useMemo, useState } from 'react';
import { Keyboard, PenLine } from 'lucide-react';
import { BlogCard } from '../components/blog/BlogCard';
import { CategoryFilter } from '../components/blog/CategoryFilter';
import { BlogSidebar } from '../components/blog/BlogSidebar';
import { POSTS } from '../data/blog';
import type { BlogCategory, BlogSort } from '../data/blog';
import { useSeo } from '../hooks/useSeo';
import { useJsonLd } from '../hooks/useJsonLd';

const SITE_URL = 'https://www.typeoye.com';

export default function Blog() {
  const [category, setCategory] = useState<'All Posts' | BlogCategory>('All Posts');
  const [sort, setSort] = useState<BlogSort>('latest');

  useSeo({
    title: 'Typing Tips & Guides – Improve Your Typing Speed | Typeoye',
    description:
      'Learn typing tips, improve your typing speed and accuracy, and discover useful touch typing guides and techniques on the Typeoye blog.',
    canonicalPath: '/blog',
    image: `${SITE_URL}/favicon.png`,
  });

  useJsonLd({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Typing Tips & Guides',
    url: `${SITE_URL}/blog`,
    description:
      'Typing tips, guides, and practice advice to help you type faster, improve accuracy, and boost productivity with Typeoye.',
    isPartOf: { '@type': 'WebSite', name: 'Typeoye', url: `${SITE_URL}/` },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: POSTS.map((post, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${SITE_URL}/blog/${post.slug}`,
        name: post.title,
      })),
    },
  });

  const filtered = useMemo(() => {
    const list = category === 'All Posts' ? POSTS : POSTS.filter((p) => p.category === category);
    return [...list].sort((a, b) => {
      if (sort === 'latest') return +new Date(b.publishedAt) - +new Date(a.publishedAt);
      if (sort === 'oldest') return +new Date(a.publishedAt) - +new Date(b.publishedAt);
      return Number(b.popular) - Number(a.popular) || +new Date(b.publishedAt) - +new Date(a.publishedAt);
    });
  }, [category, sort]);

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
      {/* Hero */}
      <section
        className="relative mb-8 flex flex-col gap-8 overflow-hidden rounded-[1.5rem] border p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between lg:p-10"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}
      >
        <span className="dot-grid dot-grid-tr" aria-hidden="true" />
        <div className="max-w-xl">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl text-white"
            style={{
              background: 'linear-gradient(135deg, #4361EE 0%, #7C3AED 100%)',
              boxShadow: '0 8px 20px -6px rgba(67, 97, 238, 0.5)',
            }}
          >
            <PenLine size={26} strokeWidth={2} />
          </div>
          <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: 'var(--color-text-primary)' }}>
            Typing Tips &amp; Guides
          </h1>
          <p className="readable-text mt-3 text-base leading-relaxed sm:text-lg" style={{ color: 'var(--color-text-secondary)' }}>
            Typing tips and guides to help you type faster, improve accuracy, and learn useful touch typing techniques.
          </p>
        </div>

        {/* Typing workspace illustration */}
        <div className="hidden shrink-0 md:block" aria-hidden="true">
          <div
            className="relative flex h-48 w-80 items-center justify-center overflow-hidden rounded-[1.375rem] border sm:h-52"
            style={{ borderColor: 'var(--color-border)', background: 'linear-gradient(160deg, var(--color-accent-light) 0%, #f4effd 100%)' }}
          >
            <span className="dot-grid" aria-hidden="true" />
            <span className="absolute -right-10 -top-12 h-32 w-32 rounded-full" style={{ background: 'rgba(67, 97, 238, 0.14)' }} />
            <span className="absolute -left-12 -bottom-14 h-36 w-36 rounded-full" style={{ background: 'rgba(124, 58, 237, 0.12)' }} />

            {/* Monitor + keyboard blocks */}
            <div className="relative z-10">
              <div className="mx-auto mb-3 h-24 w-44 overflow-hidden rounded-lg border-[0.375rem] border-b-[0.625rem] p-3" style={{ borderColor: '#4361ee', backgroundColor: '#151521' }}>
                <Keyboard className="h-full w-full text-white" strokeWidth={1.2} />
              </div>
              <div className="h-3 w-48 rounded-full sm:w-56" style={{ background: 'linear-gradient(135deg, #4361EE 0%, #7C3AED 100%)' }} />
              <div className="mx-auto mt-1.5 h-1.5 w-24 rounded-full" style={{ background: 'rgba(124, 58, 237, 0.4)' }} />
            </div>

            {/* Floating chips */}
            <span
              className="absolute left-4 top-4 rounded-full bg-white px-3 py-1 text-xs font-bold"
              style={{ color: '#4361ee', boxShadow: '0 6px 14px -4px rgba(67, 97, 238, 0.35)' }}
            >
              75 WPM
            </span>
            <span
              className="absolute bottom-5 right-4 rounded-full bg-white px-3 py-1 text-xs font-bold"
              style={{ color: '#7c3aed', boxShadow: '0 6px 14px -4px rgba(124, 58, 237, 0.35)' }}
            >
              98% Accuracy
            </span>
          </div>
        </div>
      </section>

      {/* Filter bar */}
      <CategoryFilter active={category} onSelect={setCategory} sort={sort} onSortChange={setSort} count={filtered.length} />

      {/* 70/30 layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* Main column */}
        <div className="min-w-0">
          {filtered.length === 0 ? (
            <div className="card p-6 text-center text-sm sm:p-10" style={{ color: 'var(--color-text-secondary)' }}>
              No posts in this category yet.
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {filtered.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <BlogSidebar active={category} onSelect={setCategory} />
      </div>
    </main>
  );
}