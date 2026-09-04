import React from 'react';
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Logo } from '../components/layout/Logo';

/** Only allow same-app relative paths as post-login destinations. */
function safeRedirect(raw: string | null): string {
  if (raw && raw.startsWith('/') && !raw.startsWith('//') && !raw.includes('\\')) return raw;
  return '/progress';
}

export function AuthLayout() {
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    const params = new URLSearchParams(location.search);
    return <Navigate to={safeRedirect(params.get('redirect'))} replace />;
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: 'var(--color-page)' }}
    >
      {/* Left branding panel — desktop only */}
      <div
        className="auth-panel hidden lg:flex lg:w-[45%] flex-col justify-between p-12"
      >
        <Link to="/" className="flex items-center">
          <Logo />
        </Link>

        <div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Master the keyboard,<br />one word at a time.
          </h1>
          <p className="text-white/80 text-lg leading-relaxed">
            Structured lessons, real-time feedback, and adaptive practice to make
            you a faster, more accurate typist.
          </p>

          <div className="mt-10 max-w-md">
            <p className="text-lg font-semibold text-white">Practice with purpose.</p>
            <p className="mt-2 text-sm leading-relaxed text-white/70">Build accuracy first, follow guided lessons, and use feedback from your own sessions to choose what to practice next.</p>
          </div>
        </div>

        <p className="text-white/50 text-sm">© 2025 Typeoye</p>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile wordmark */}
          <Link to="/" className="inline-flex rounded-xl px-3 py-2 mb-8 lg:hidden" style={{ backgroundColor: '#0B1740' }}>
            <Logo size={22} />
          </Link>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
