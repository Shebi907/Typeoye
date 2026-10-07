import axios from 'axios';

const REQUEST_TIMEOUT_MS = 10000;
const CONNECTIVITY_RETRY_DELAYS_MS = [600, 1800];

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: REQUEST_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

const attemptStartedAt = new WeakMap<object, number>();

// Attach JWT token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('typeoye_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (!attemptStartedAt.has(config)) {
    attemptStartedAt.set(config, Date.now());
  }
  return config;
});

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function receivedResponse(err: { response?: unknown }): boolean {
  return Boolean(err?.response);
}

function isReplaySafe(config?: { method?: string; url?: string }): boolean {
  const method = (config?.method ?? 'get').toLowerCase();
  if (method === 'get' || method === 'head') return true;
  if (method !== 'post') return false;
  return (config?.url ?? '').split('?')[0].split('#')[0].endsWith('/auth/login');
}

function attemptCount(config?: { __connectivityRetries?: number }): number {
  return config?.__connectivityRetries ?? 0;
}

function safePath(url?: string): string {
  if (!url) return '(unknown)';
  return url.split('?')[0].split('#')[0];
}

type MutableConfig = {
  method?: string;
  url?: string;
  baseURL?: string;
  timeout?: number;
  __connectivityRetries?: number;
};

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
  async (err) => {
    if (err?.code === 'ERR_CANCELED') {
      return Promise.reject(err);
    }

    const config = err?.config as MutableConfig | undefined;

    // A request that never received any HTTP response (timeout, dropped socket,
    // failed CORS preflight) produced no server-side effect we can observe, so
    // replaying it is safe for idempotent calls and for /auth/login. This is
    // what turns a transient stall into a successful sign-in instead of the
    // generic "Cannot reach the server" dead end.
    if (config && !receivedResponse(err) && isReplaySafe(config)) {
      const attempt = attemptCount(config);
      if (attempt < CONNECTIVITY_RETRY_DELAYS_MS.length) {
        config.__connectivityRetries = attempt + 1;
        await wait(CONNECTIVITY_RETRY_DELAYS_MS[attempt]);
        return api(config);
      }
    }

    if (err?.response?.status === 401) {
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

    if (!receivedResponse(err)) {
      const startedAt = config ? attemptStartedAt.get(config) : undefined;
      console.warn('[api] request ended with no HTTP response', {
        kind: getApiErrorKind(err),
        code: err?.code ?? null,
        method: String(config?.method ?? 'get').toUpperCase(),
        path: safePath(config?.url),
        baseURL: config?.baseURL ?? '',
        timeoutMs: config?.timeout ?? REQUEST_TIMEOUT_MS,
        attempts: attemptCount(config) + 1,
        durationMs: startedAt ? Date.now() - startedAt : null,
        online: typeof navigator === 'undefined' ? null : navigator.onLine,
        message: String(err?.message ?? '').slice(0, 160),
      });
    }

    return Promise.reject(err);
  }
);

export default api;

interface ApiErrorShape {
  response?: { status?: number; data?: { error?: string; retryAfterSeconds?: number } };
  message?: string;
  code?: string;
}

/** Why a request failed, from the caller's point of view. `timeout` and
 *  `network` both mean "no HTTP response was ever received" — the browser
 *  cannot tell a CORS rejection apart from a dropped connection, so they are
 *  reported together as reachability failures. */
export type ApiFailureKind =
  | 'server-message'
  | 'timeout'
  | 'network'
  | 'server-error'
  | 'client-error';

export function getApiErrorKind(err: unknown): ApiFailureKind {
  const e = err as ApiErrorShape;
  if (e?.response?.data?.error) return 'server-message';
  const status = e?.response?.status;
  if (!status) {
    if (e?.code === 'ECONNABORTED' || e?.code === 'ETIMEDOUT' || /timeout/i.test(e?.message ?? '')) {
      return 'timeout';
    }
    return 'network';
  }
  if (status >= 500) return 'server-error';
  return 'client-error';
}

/** Structured error info for a failed API call, including machine-readable
 *  recovery-lock data (retryAfterSeconds) the UI uses to show a countdown. */
export function getApiErrorDetails(err: unknown, fallback = 'Something went wrong'): { message: string; retryAfterSeconds?: number } {
  const e = err as ApiErrorShape;
  const serverError = e?.response?.data?.error;
  const retryAfterSeconds = e?.response?.data?.retryAfterSeconds;
  const kind = getApiErrorKind(err);
  let message: string;
  if (kind === 'server-message') message = serverError as string;
  else if (kind === 'timeout') message = 'The server took too long to respond. Please try again.';
  else if (kind === 'network') message = 'Cannot reach the server. Please try again in a moment.';
  else if (kind === 'server-error') message = 'The server hit an error. Please try again.';
  else message = e?.message || fallback;
  return retryAfterSeconds != null ? { message, retryAfterSeconds } : { message };
}

/** Human-friendly error text for a failed API call. Prefers the server's own
 *  `error` payload, then distinguishes reachability/5xx from other failures. */
export function getApiErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  return getApiErrorDetails(err, fallback).message;
}
