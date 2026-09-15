import { useEffect } from 'react';

/**
 * Sets a `noindex, nofollow` robots meta tag for the lifetime of the component
 * and restores/removes it on unmount, so private, authenticated, or admin-only
 * pages never leak into search engine indexes while public pages stay clean.
 */
export function useNoindex(): void {
  useEffect(() => {
    const existing = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const previous = existing?.getAttribute('content') ?? null;
    const meta = existing ?? document.createElement('meta');
    if (!existing) {
      meta.name = 'robots';
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', 'noindex, nofollow');

    return () => {
      if (existing) {
        if (previous === null) existing.remove();
        else existing.setAttribute('content', previous);
      } else {
        document.querySelector('meta[name="robots"]')?.remove();
      }
    };
  }, []);
}