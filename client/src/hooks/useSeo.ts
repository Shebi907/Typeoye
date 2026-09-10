import { useEffect } from 'react';

const SITE_URL = 'https://www.typeoye.com';

interface UseSeoInput {
  title: string;
  description: string;
  canonicalPath?: string;
}

/**
 * Lightweight page-level SEO: sets the document title, the description meta
 * tag, and a canonical link on mount/update, then restores the previous
 * values on unmount so client-side navigation never leaves stale tags behind.
 */
export function useSeo({ title, description, canonicalPath = '' }: UseSeoInput): void {
  useEffect(() => {
    const head = document.head;
    const previousTitle = document.title;
    const canonicalHref = `${SITE_URL}${canonicalPath}`;

    let descriptionMeta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const previousDescription = descriptionMeta?.getAttribute('content') ?? '';
    if (!descriptionMeta) {
      descriptionMeta = document.createElement('meta');
      descriptionMeta.name = 'description';
      head.appendChild(descriptionMeta);
    }

    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      head.appendChild(canonical);
    }

    document.title = title;
    descriptionMeta.setAttribute('content', description);
    canonical.setAttribute('href', canonicalHref);

    return () => {
      document.title = previousTitle;
      descriptionMeta!.setAttribute('content', previousDescription);
      const currentCanonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (currentCanonical) currentCanonical.setAttribute('href', SITE_URL);
    };
  }, [title, description, canonicalPath]);
}