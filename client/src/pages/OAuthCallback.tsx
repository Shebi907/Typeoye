import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/auth.service';

/**
 * Landing point for the Google OAuth round-trip. The backend callback redirects
 * the browser here with a fresh JWT in the query string. This component stores
 * that token, loads the user/profile/settings via /auth/me, then routes to the
 * signed-in home (/progress) — matching the normal login flow.
 */
export default function OAuthCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token');
  const setAuth = useAuthStore((s) => s.setAuth);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const finish = async () => {
      if (!token) {
        navigate('/login', { replace: true });
        return;
      }

      // Store the token so the api interceptor attaches it to the /me call.
      localStorage.setItem('typeoye_token', token);
      // Drop the token from the address bar so it can't linger in history/logs.
      window.history.replaceState({}, '', '/oauth/callback');

      try {
        const { user, profile, settings } = await authService.me();
        setAuth(user, profile, settings, token);
        navigate('/progress', { replace: true });
      } catch {
        localStorage.removeItem('typeoye_token');
        navigate('/login', { replace: true });
      }
    };

    void finish();
  }, [token, navigate, setAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-page)' }}>
      <div className="text-center">
        <div
          className="inline-block w-10 h-10 border-4 border-t-transparent rounded-full animate-spin mb-4"
          style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }}
          aria-hidden="true"
        />
        <p className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
          Signing you in…
        </p>
      </div>
    </div>
  );
}
