import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('typeoye_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401 — clear auth state and return to the sign-in screen.
// Only bounce when a session token was actually attached (expired/revoked
// session). Guests on public pages (e.g. /games history probe) must stay put
// and let callers handle the rejection gracefully.
// The boot-time session probe (/auth/me) is handled entirely by AuthProvider:
// it calls logout() on 401/403, which clears localStorage + store atomically.
// We must NOT touch localStorage here for that probe to avoid a race where
// the token disappears before AuthProvider's catch block runs.
//
// IMPORTANT: this must NEVER navigate with window.location.* — that makes the
// browser perform a full document reload. Expired tokens 401 several in-flight
// requests at once (auth boot + authenticated prefetch + protected-page
// fetches), and a hard reload on each one is what made the site "keep
// refreshing by itself". Instead we dispatch an event that the app root
// (AuthProvider) reacts to with logout() + the SPA's own client-side redirect,
// so the document is never reloaded.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const isSessionProbe = err.config?.url === '/auth/me';
      if (!isSessionProbe) {
        const hadSession = !!localStorage.getItem('typeoye_token');
        localStorage.removeItem('typeoye_token');
        if (hadSession &&
            !window.location.pathname.startsWith('/login') &&
            !window.location.pathname.startsWith('/register')) {
          window.dispatchEvent(new Event('typeoye:unauthorized'));
        }
      }
      // For the session probe: AuthProvider's catch block calls logout() which
      // removes the token from localStorage and resets the store atomically.
    }
    return Promise.reject(err);
  }
);

export default api;

interface ApiErrorShape {
  response?: { status?: number; data?: { error?: string } };
  message?: string;
}

/** Human-friendly error text for a failed API call. Prefers the server's own
 *  `error` payload, then distinguishes reachability/5xx from other failures. */
export function getApiErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  const e = err as ApiErrorShape;
  if (e?.response?.data?.error) return e.response.data.error;
  const status = e?.response?.status;
  if (!status) return 'Cannot reach the server. Please try again in a moment.';
  if (status >= 500) return 'The server hit an error. Please try again.';
  return e?.message || fallback;
}