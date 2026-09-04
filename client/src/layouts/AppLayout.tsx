import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { AchievementToast } from '../components/gamification/AchievementToast';
import { LevelUpToast } from '../components/gamification/LevelUpToast';
import { useTypingStore } from '../store/typingStore';

interface AppLayoutProps {
  // When true, unauthenticated visitors are sent straight to Sign In and
  // returned to the page they wanted after a successful login.
  requireAuth?: boolean;
  // Optional inline content — when provided it replaces the routed <Outlet />,
  // letting standalone routes (e.g. the personalized home at "/") reuse the
  // navbar/footer shell without a nested route definition.
  children?: React.ReactNode;
}

export function AppLayout({ requireAuth = false, children }: AppLayoutProps) {
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();
  const { newAchievements, clearResult } = useTypingStore();
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (newAchievements.length > 0) {
      setShowToast(true);
    }
  }, [newAchievements]);

  // Auth state is settled synchronously from the persisted token (see
  // authStore); <AuthProvider /> refines the profile in the background without
  // ever blocking route rendering. Guests are redirected instantly and no
  // loader is ever shown in between.
  if (requireAuth && !isAuthenticated) {
    // Send guests straight to Sign In; AuthLayout sends them back here after
    // a successful login via the redirect parameter.
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${returnTo}`} replace />;
  }

  /* Site-wide page shell: the whole app (navbar + content) sits inside a
     rounded sheet with a small margin from the browser edges. Overflow stays
     visible so navbar popovers (profile menu) are never clipped; each element
     clips its own decorations instead. */
  return (
    <div className="min-h-screen px-2 pb-2 sm:px-3 sm:pb-3" style={{ backgroundColor: 'var(--color-canvas)' }}>
      <div
        className="rounded-[24px] border shadow-sm flex flex-col"
        style={{
          backgroundColor: 'var(--color-page)',
          borderColor: 'var(--color-border)',
          boxShadow: 'var(--shadow-card)',
          minHeight: 'calc(100dvh - 24px)',
        }}
      >
        <Navbar />
        <div className="flex-1 min-w-0 flex flex-col">
          {children ?? <Outlet />}
          <Footer />
        </div>

        {/* Achievement notifications */}
        {showToast && newAchievements.length > 0 && (
          <AchievementToast
            achievements={newAchievements}
            onClose={() => {
              setShowToast(false);
              clearResult();
            }}
          />
        )}

        {/* Level-up notification (queued until after the session's server response) */}
        <LevelUpToast />
      </div>
    </div>
  );
}