import React, { useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/auth.service';
import { lessonService } from '../../services/lesson.service';
import { analyticsService } from '../../services/analytics.service';
import { leaderboardService } from '../../services/leaderboard.service';

/**
 * Validates any persisted session exactly once, when the app boots, at the very
 * root of the tree. This settles the auth state BEFORE any layout or page
 * decides what to render, so there is no per-layout rehydration and no flash of
 * the wrong auth state (guest navbar/links vs signed-in) during navigation.
 *
 * KEY BEHAVIOURS:
 *
 * 1. Token revalidation — only calls logout() on a DEFINITIVE auth failure
 *    (HTTP 401 / 403). Network errors and server errors (5xx) are ignored so
 *    a temporary outage never clears a valid session and causes a mid-navigation
 *    redirect flash.
 *
 * 2. Background prefetch — lessons (public) and progress (authenticated) are
 *    fetched immediately on mount so their module-level caches are warm by the
 *    time the user clicks "Learn" or "Dashboard". Those pages then render their
 *    full content on the very first frame with no skeleton / loading text.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setAuth = useAuthStore((s) => s.setAuth);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    const storedToken = token ?? '';
    if (!storedToken) return;

    async function rehydrate() {
      try {
        const { user, profile, settings } = await authService.me();
        setAuth(user, profile, settings, storedToken);
      } catch (err: unknown) {
        // Only clear the session if the server DEFINITIVELY rejected the token
        // (401 Unauthorized / 403 Forbidden). For network failures, CORS errors,
        // or 5xx responses we leave isAuthenticated as-is — a transient outage
        // must never cause a mid-navigation redirect flash to /login.
        const status =
          (err as { response?: { status?: number } })?.response?.status ?? 0;
        if (status === 401 || status === 403) {
          logout();
        }
        // Any other error (network timeout, 500, etc.): keep the existing auth
        // state. The token may still be valid; we just couldn't confirm it.
      }
    }

    void rehydrate();
  }, [token, setAuth, logout]);

  // ── Background prefetch ─────────────────────────────────────────────────
  // Warm the module-level caches used by the Learn, Progress, and Leaderboard
  // pages so they render immediately from cache when the user navigates there,
  // with no skeleton / "Loading…" flash on the first visit.
  useEffect(() => {
    // Lessons list and leaderboard are public — prefetch regardless of auth state.
    if (!lessonService.getLessonsCached()) {
      lessonService.getLessons().catch(() => undefined);
    }
    if (!leaderboardService.getLeaderboardCached('daily')) {
      leaderboardService.getLeaderboard('daily', 50).catch(() => undefined);
    }
  }, []); // run once on mount

  useEffect(() => {
    // Progress data is authenticated — only prefetch when we have a session.
    if (!isAuthenticated) return;
    if (!analyticsService.getProgressCached()) {
      analyticsService.getProgress().catch(() => undefined);
    }
    if (!analyticsService.getAccuracyTrendCached()) {
      analyticsService.getAccuracyTrend().catch(() => undefined);
    }
  }, [isAuthenticated]); // re-run if auth state changes (e.g. after sign-in)

  return <>{children}</>;
}