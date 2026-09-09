import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function ScrollToTop() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  // Reset scroll synchronously, BEFORE the browser paints the new route. This
  // guarantees the destination page's very first frame is at the top — the
  // previous page's scroll offset (or Chromium's scroll-anchoring) never shows.
  // The global html{scroll-behavior:smooth} rule would otherwise make even this
  // reset animate over a few hundred ms, parking the viewport mid-page on a
  // shorter destination and briefly showing the footer out of place. A
  // !important 'auto' on both elements plus behavior:'instant' forces a true
  // jumpless reset regardless of any stylesheet smoothing.
  useLayoutEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const previousHtml = root.style.getPropertyValue('scroll-behavior');
    const previousBody = body.style.getPropertyValue('scroll-behavior');
    root.style.setProperty('scroll-behavior', 'auto', 'important');
    body.style.setProperty('scroll-behavior', 'auto', 'important');
    if ('scrollTo' in window) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    }
    if (previousBody) body.style.setProperty('scroll-behavior', previousBody);
    else body.style.removeProperty('scroll-behavior');
    if (previousHtml) root.style.setProperty('scroll-behavior', previousHtml);
    else root.style.removeProperty('scroll-behavior');
  }, [pathname]);

  return null;
}