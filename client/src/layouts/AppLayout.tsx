import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { AchievementToast } from '../components/gamification/AchievementToast';
import { LevelUpToast } from '../components/gamification/LevelUpToast';
import { useTypingStore } from '../store/typingStore';

interface AppLayoutProps {
  // Optional inline content — when provided it replaces the routed <Outlet />,
  // letting standalone routes (e.g. the personalized home at "/") reuse the
  // navbar/footer shell without a nested route definition.
  children?: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { newAchievements, clearResult } = useTypingStore();
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (newAchievements.length > 0) {
      setShowToast(true);
    }
  }, [newAchievements]);

  /* Site-wide page shell: the whole app (navbar + content) sits inside a
     rounded sheet with a small margin from the browser edges. Overflow stays
     visible so navbar popovers (profile menu) are never clipped; each element
     clips its own decorations instead.

     This shell mounts ONCE for the entire app (see App.tsx — there is a single
     AppLayout instance wrapping every route). React Router therefore never
     unmounts the navbar/sheet/footer while navigating between pages; only the
     <Outlet /> content below is swapped. That is what makes navigation feel
     instant with no full-screen white flash.

     FOOTER PINNING: the outer wrapper is a full-viewport flex column (min-h
     screen, bulletproof 100vh). The sheet is a flex-1 child of it, so it is
     ALWAYS at least viewport-tall and stretches to fill — even if a browser
     rejects the modern dvh unit used by .app-sheet's min-height. Inside the
     sheet, the content column (flex-1) expands between the Navbar and the
     Footer (mt-auto), so a short loading frame can never pull the footer up
     into view; it is pinned to the bottom from the very first paint. */
  return (
    <div className="flex min-h-screen flex-col px-1.5 pb-1.5 sm:px-2 sm:pb-2 md:px-3 md:pb-3" style={{ backgroundColor: 'var(--color-canvas)' }}>
      <div
        className="app-sheet flex flex-1 flex-col rounded-[1rem] sm:rounded-[1.5rem] border shadow-sm overflow-hidden"
        style={{
          backgroundColor: 'var(--color-page)',
          borderColor: 'var(--color-border)',
          boxShadow: 'var(--shadow-card)',
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