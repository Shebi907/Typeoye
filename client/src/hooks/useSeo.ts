import { useEffect } from 'react';

const SITE_URL = 'https://www.typeoye.com';
const DEFAULT_OG_IMAGE = `${SITE_URL}/favicon.png`;

interface UseSeoInput {
  title: string;
  description: string;
  canonicalPath?: string;
  /** Absolute URL used for og:image / twitter:image (defaults to the site favicon). */
  image?: string;
  /** og:type value (defaults to 'website'). */
  type?: string;
  /** Robots directive (e.g. 'noindex, nofollow') for pages that must not be crawled. */
  robots?: string;
}

/**
 * Page-level SEO: sets the document title, the description meta tag, the
 * canonical link, Open Graph tags (og:title/og:description/og:url/og:type/
 * og:image), and Twitter/X card tags on mount/update, then restores the
 * previous values on unmount so client-side navigation never leaves stale tags
 * behind. Any tags that did not exist before are removed on cleanup.
 */
export function useSeo({
  title,
  description,
  canonicalPath = '',
  image = DEFAULT_OG_IMAGE,
  type = 'website',
  robots,
}: UseSeoInput): void {
  useEffect(() => {
    const head = document.head;
    const previousTitle = document.title;
    const canonicalHref = `${SITE_URL}${canonicalPath}`;

    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      head.appendChild(canonical);
    }
    const previousCanonical = canonical.getAttribute('href') ?? SITE_URL;

    // Metas that existed before this page mounted — restore them on cleanup.
    const restored: { meta: HTMLMetaElement; previous: string }[] = [];
    // Metas that did not exist before — remove them on cleanup.
    const removed: HTMLMetaElement[] = [];

    const applyMeta = (attr: 'name' | 'property', key: string, value: string): void => {
      const existing = head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
      if (existing) {
        restored.push({ meta: existing, previous: existing.getAttribute('content') ?? '' });
        existing.setAttribute('content', value);
      } else {
        const meta = document.createElement('meta');
        meta.setAttribute(attr, key);
        meta.setAttribute('content', value);
        head.appendChild(meta);
        removed.push(meta);
      }
    };

    applyMeta('name', 'description', description);
    applyMeta('property', 'og:title', title);
    applyMeta('property', 'og:description', description);
    applyMeta('property', 'og:url', canonicalHref);
    applyMeta('property', 'og:type', type);
    applyMeta('property', 'og:image', image);
    applyMeta('name', 'twitter:card', 'summary_large_image');
    applyMeta('name', 'twitter:title', title);
    applyMeta('name', 'twitter:description', description);
    applyMeta('name', 'twitter:image', image);

    let robotsMeta = head.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const previousRobots = robotsMeta?.getAttribute('content') ?? null;
    if (robots) {
      if (!robotsMeta) {
        robotsMeta = document.createElement('meta');
        robotsMeta.name = 'robots';
        head.appendChild(robotsMeta);
      }
      robotsMeta.setAttribute('content', robots);
    }

    document.title = title;
    canonical.setAttribute('href', canonicalHref);

    return () => {
      document.title = previousTitle;
      for (const { meta, previous } of restored) {
        meta.setAttribute('content', previous);
      }
      for (const meta of removed) {
        meta.remove();
      }
      canonical!.setAttribute('href', previousCanonical);
      if (robots && robotsMeta) {
        if (previousRobots === null) robotsMeta.remove();
        else robotsMeta.setAttribute('content', previousRobots);
      }
    };
  }, [title, description, canonicalPath, image, type, robots]);
}