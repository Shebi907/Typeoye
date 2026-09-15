import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useNoindex } from '../../hooks/useNoindex';

/** Route guard for account pages. Nested INSIDE the shared AppLayout (rather
 *  than wrapping it) so that guests are redirected to Sign In without the app
 *  shell ever being torn down — authenticated users just render the nested
 *  page through the <Outlet />, and navigation always swaps only the content. */
export function RequireAuth() {
  const location = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isSessionChecked = useAuthStore((s) => s.isSessionChecked);

  // Account and admin pages are private — keep them out of search indexes.
  useNoindex();

  // While the boot-time session check (/auth/me) is still running we can't yet
  // tell a guest from a returning user. Rendering <Outlet /> here is safe —
  // the page below will just see its "loading" state via its own data fetches,
  // and AuthProvider resolves the session a few frames later. Returning a
  // <Navigate to /login> during this window would flash every freshly-reloaded
  // signed-in visit through the sign-in page.
  if (!isSessionChecked) {
    return <Outlet />;
  }

  if (!isAuthenticated) {
    // Send guests straight to Sign In; AuthLayout returns them here after a
    // successful login via the redirect parameter.
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${returnTo}`} replace />;
  }

  return <Outlet />;
}