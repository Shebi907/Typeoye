import { useEffect } from 'react';

/**
 * Locks the page's background scroll while `active` is true and restores it
 * when it becomes false or the component unmounts.
 *
 * THE ACTUAL SCROLLER IS THE VIEWPORT (<html>), not document.body: this app
 * sets `html, body { overflow-x: hidden }` (index.css), which makes the
 * viewport's own overflow-y compute to `auto` and—because the root element's
 * overflow is no longer `visible`—breaks the CSS rule that would otherwise
 * forward `document.body`'s overflow to the viewport. Setting body overflow
 * alone therefore does nothing. We lock BOTH the html (viewport) scroller and
 * body, and restore each to its previous inline value so nested overlays
 * (e.g. a result card and a modal on top of it) never unlock the page while a
 * sibling overlay is still open.
 */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
    };
  }, [active]);
}