import React, { useLayoutEffect, useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Sun, Monitor, LogOut, User, ShieldCheck, Menu, X } from 'lucide-react';
import { Logo } from './Logo';
import { ProgressDropdown } from './ProgressDropdown';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { authService } from '../../services/auth.service';
import { Avatar } from '../ui/Avatar';
import { Spinner } from '../ui/Spinner';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/test', label: 'Test' },
  { to: '/practice', label: 'Practice' },
  { to: '/lessons', label: 'Learn' },
  { to: '/games', label: 'Games' },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/certificate', label: 'Certificate' },
];

export function Navbar() {
  const { user, profile, isAuthenticated, isSessionChecked, logout } = useAuthStore();
  const { theme, setTheme } = useSettingsStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close menus on navigation or Escape. Runs before paint so a just-closed
  // menu never overlays the destination page's first frame.
  useLayoutEffect(() => { setMobileOpen(false); setUserMenuOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!userMenuOpen && !mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setUserMenuOpen(false); setMobileOpen(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [userMenuOpen, mobileOpen]);

  const effectiveDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const cycleTheme = () => setTheme(effectiveDark ? 'light' : 'dark');
  // In dark mode show the sun ("switch to light" affordance); otherwise unchanged.
  const ThemeIcon = theme === 'system' ? Monitor : Sun;

  const signOut = async () => {
    // Leave protected routes first (while still authed) so the requireAuth
    // guard can't race us to /login, then hit the API and clear local state.
    navigate('/', { replace: true });
    try { await authService.logout(); } catch { /* session already gone */ }
    logout();
  };

  // While the boot-time session check (/auth/me) is still running we don't yet
  // know if this visitor is signed in. Until it settles, show neither the
  // signed-in avatar nor the guest Sign in / Get Started buttons — a stale
  // token must never render a profile icon, and a real session must not flash
  // the guest buttons either.
  const checkingSession = !isSessionChecked;
  const guest = isSessionChecked && !isAuthenticated;

  // Signed-in users don't have a "Home" destination — their home is the
  // Progress page. Keep the item only for guests (and while the session is
  // still being verified, where Home is the safe default).
  const links = isSessionChecked && isAuthenticated ? navLinks.filter((l) => l.to !== '/') : navLinks;
  const gamesIndex = Math.max(0, links.findIndex((l) => l.to === '/games'));
  const beforeGames = links.slice(0, gamesIndex + 1);
  const afterGames = links.slice(gamesIndex + 1);

  return (
    <header className="sticky top-0 z-40">
      <div className="navbar-gradient relative flex items-center h-16 px-4 sm:px-6">
        {/* Decorative layer — self-clipped so popovers can escape the bar */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[inherit]" aria-hidden="true">
          <span className="navbar-gradient-circle w-48 h-48 -left-14 -top-24" />
          <span className="navbar-gradient-circle w-60 h-60 -right-20 -bottom-32" style={{ opacity: 0.65 }} />
          <span className="navbar-gradient-circle w-28 h-28 right-[38%] -top-16" style={{ opacity: 0.5 }} />
        </div>

        <Link to={guest ? '/' : isAuthenticated ? '/progress' : '/'} className="navbar-logo-hover relative flex items-center flex-shrink-0">
          <Logo size={25} gap={5} />
        </Link>

        <nav className="hidden lg:flex items-center gap-1.5 ml-6">
          {beforeGames.map(({ to, label }) => {
            const isCertMode = to === '/test' && location.search.includes('cert=1');
            const forceActive = to === '/certificate' && location.search.includes('cert=1');
            return (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) => {
                  const active = forceActive || (isActive && !isCertMode);
                  return `relative px-3.5 py-2 rounded-full text-sm font-semibold transition-all duration-200 navbar-link${active ? ' navbar-link-active' : ''}`;
                }}
                style={({ isActive }) => {
                  const active = forceActive || (isActive && !isCertMode);
                  return {
                    color: active ? '#1B2340' : '#ffffff',
                    backgroundColor: active ? '#ffffff' : 'transparent',
                    fontWeight: active ? 800 : 600,
                    border: active ? '1px solid rgba(27, 35, 64, 0.12)' : '1px solid transparent',
                    boxShadow: active
                      ? '0 2px 6px rgba(27, 35, 64, 0.25), 0 6px 18px rgba(15, 23, 42, 0.18)'
                      : 'none',
                  };
                }}
              >
                {label}
              </NavLink>
            );
          })}

          {/* Progress dropdown — signed-in users only, right after Games */}
          {isAuthenticated && <ProgressDropdown />}

          {afterGames.map(({ to, label }) => {
            const isCertMode = to === '/test' && location.search.includes('cert=1');
            const forceActive = to === '/certificate' && location.search.includes('cert=1');
            return (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) => {
                  const active = forceActive || (isActive && !isCertMode);
                  return `relative px-3.5 py-2 rounded-full text-sm font-semibold transition-all duration-200 navbar-link${active ? ' navbar-link-active' : ''}`;
                }}
                style={({ isActive }) => {
                  const active = forceActive || (isActive && !isCertMode);
                  return {
                    color: active ? '#1B2340' : '#ffffff',
                    backgroundColor: active ? '#ffffff' : 'transparent',
                    fontWeight: active ? 800 : 600,
                    border: active ? '1px solid rgba(27, 35, 64, 0.12)' : '1px solid transparent',
                    boxShadow: active
                      ? '0 2px 6px rgba(27, 35, 64, 0.25), 0 6px 18px rgba(15, 23, 42, 0.18)'
                      : 'none',
                  };
                }}
              >
                {label}
              </NavLink>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={cycleTheme}
            className="ng-icon-btn p-2 rounded-full relative"
            aria-label={`Theme: ${theme}`}
            data-testid="navbar-theme"
          >
            <ThemeIcon size={18} />
          </button>

          {checkingSession && (
            <span className="hidden sm:flex items-center gap-2" aria-hidden="true">
              <Spinner size="sm" style={{ color: 'rgba(255,255,255,0.7)' }} />
            </span>
          )}

          {guest && (
            <span className="hidden sm:flex items-center gap-2">
              <Link to="/login" className="btn btn-sm gpill-signin">Sign in</Link>
              <Link to="/register" className="btn btn-sm gpill-start">Get Started</Link>
            </span>
          )}

          {isAuthenticated && (
            <div className="relative">
              <button
                data-testid="navbar-avatar"
                onClick={() => setUserMenuOpen((value) => !value)}
                aria-expanded={userMenuOpen}
                className="ng-icon-btn p-1 pr-2 rounded-full flex items-center gap-2"
              >
                <Avatar src={profile?.avatarUrl} name={profile?.displayName ?? user?.username} size={32} />
                <span className="hidden xl:block text-sm font-semibold max-w-[7.5rem] truncate" style={{ color: '#ffffff' }}>
                  {profile?.displayName ?? user?.username}
                </span>
              </button>
              {userMenuOpen && (
                <>
                  {/* Click-outside catcher — sits under the button and the menu */}
                  <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} />
                  <div
                    data-testid="profile-dropdown"
                    className="navbar-dropdown absolute right-0 top-full mt-2 w-52 card p-1.5 z-50 shadow-xl border border-[var(--color-border)]"
                  >
                    <Link
                      to={`/profile/${user?._id}`}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-[var(--color-accent-light)]"
                    >
                      <User size={15} style={{ color: 'var(--color-accent-text)' }} /> My Profile
                    </Link>
                    {user?.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-[var(--color-accent-light)]"
                      >
                        <ShieldCheck size={15} style={{ color: 'var(--color-accent-text)' }} /> Admin Panel
                      </Link>
                    )}
                    <hr className="my-1 border-[var(--color-border)]" />
                    <button
                      data-testid="signout-btn"
                      onClick={signOut}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-[var(--color-error-light,#fde8e8)] w-full text-left text-[var(--color-error)]"
                    >
                      <LogOut size={15} /> Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            className="ng-icon-btn p-2 rounded-full lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            data-testid="navbar-hamburger"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile dropdown panel */}
        {mobileOpen && (
          <div className="navbar-mobile-panel absolute left-0 right-0 top-full lg:hidden px-4 pt-2 pb-5 z-50">
            <nav className="flex flex-col gap-1">
              {links.map(({ to, label }) => {
                const certMode = location.search.includes('cert=1');
                const active = to === '/' ? location.pathname === '/'
                  : certMode && to === '/test' ? false
                  : certMode && to === '/certificate' ? true
                  : location.pathname.startsWith(to);
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`navbar-mobile-link${active ? ' navbar-mobile-link-active' : ''}`}
                  >
                    {label}
                    <span aria-hidden="true">›</span>
                  </Link>
                );
              })}
              {isAuthenticated && (
                <>
                  <Link
                    to="/progress"
                    className={`navbar-mobile-link${location.pathname === '/progress' ? ' navbar-mobile-link-active' : ''}`}
                  >
                    My Progress
                    <span aria-hidden="true">›</span>
                  </Link>
                  <Link
                    to="/progress/achievements"
                    className={`navbar-mobile-link${location.pathname.startsWith('/progress/achievements') ? ' navbar-mobile-link-active' : ''}`}
                  >
                    Achievements
                    <span aria-hidden="true">›</span>
                  </Link>
                </>
              )}
            </nav>
            {guest && (
              <>
                <hr className="my-4 border-white/20" />
                <div className="grid grid-cols-2 gap-2">
                  <Link to="/login" className="btn btn-sm gpill-signin justify-center">Sign in</Link>
                  <Link to="/register" className="btn btn-sm gpill-start justify-center">Get Started</Link>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
