import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

/** Route guard for account pages. Nested INSIDE the shared AppLayout (rather
 *  than wrapping it) so that guests are redirected to Sign In without the app
 *  shell ever being torn down — authenticated users just render the nested
 *  page through the <Outlet />, and navigation always swaps only the content. */
export function RequireAuth() {
  const location = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    // Send guests straight to Sign In; AuthLayout returns them here after a
    // successful login via the redirect parameter.
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${returnTo}`} replace />;
  }

  return <Outlet />;
}