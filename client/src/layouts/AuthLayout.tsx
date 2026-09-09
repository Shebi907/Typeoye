import React from 'react';
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Logo } from '../components/layout/Logo';
import { Target, LineChart, Award } from 'lucide-react';

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

  const features = [
    {
      icon: Target,
      title: 'Practice with purpose',
      subtitle: 'Guided lessons that adapt to your pace',
    },
    {
      icon: LineChart,
      title: 'Track real progress',
      subtitle: 'See your speed and accuracy improve over time',
    },
    {
      icon: Award,
      title: 'Earn certificates',
      subtitle: 'Prove your typing speed to the world',
    },
  ];

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: 'var(--color-page)' }}
    >
      {/* Left branding panel — desktop only */}
      <div
        className="auth-panel hidden lg:flex lg:w-[45%] flex-col justify-between p-10 xl:p-14 relative overflow-hidden"
        style={{
          background: 'linear-gradient(150deg, #4B3FE0, #6C5CF0 55%, #8A6BF5)',
        }}
      >
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <span className="dot-grid dot-grid-tl opacity-30" />
          <div
            className="absolute -top-20 -left-20 w-72 h-72 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%)', filter: 'blur(40px)' }}
          />
          <div
            className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)', filter: 'blur(50px)' }}
          />
        </div>

        {/* Top: Logo row */}
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center">
            <Logo size={25} />
          </Link>
        </div>

        {/* Middle: Headline, description, and feature list */}
        <div className="relative z-10 my-auto py-8">
          <h1 className="text-3xl xl:text-4xl font-bold text-white leading-tight mb-4">
            Master the keyboard,<br />one word at a time.
          </h1>
          <p className="text-white/80 text-base xl:text-lg leading-relaxed max-w-lg mb-8">
            Structured lessons, real-time feedback, and adaptive practice to make
            you a faster, more accurate typist.
          </p>

          <div className="flex flex-col gap-4 max-w-md">
            {features.map(({ icon: Icon, title, subtitle }) => (
              <div key={title} className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-white flex-shrink-0 shadow-sm">
                  <Icon size={20} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm sm:text-base leading-snug">{title}</h3>
                  <p className="text-white/70 text-xs sm:text-sm mt-0.5 leading-relaxed">{subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: Footer */}
        <div className="relative z-10">
          <p className="text-white/50 text-sm">© 2026 Typeoye</p>
        </div>
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
