import { useEffect } from 'react';

/**
 * Injects a JSON-LD structured-data script into <head> for the current page
 * and removes it on unmount / when the data changes, so client-side navigation
 * never leaves stale schema behind. Serializes the object to a stable string
 * for the effect dependency, so re-renders with identical data do not churn.
 */
export function useJsonLd(ld: Record<string, unknown> | null | undefined): void {
  const key = JSON.stringify(ld ?? null);
  useEffect(() => {
    if (key === 'null') return;
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = key;
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, [key]);
}