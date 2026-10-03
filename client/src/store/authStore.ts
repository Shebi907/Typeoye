import { create } from 'zustand';
import type { User, Profile, Settings } from '../types';
import { analyticsService } from '../services/analytics.service';
import { lessonService } from '../services/lesson.service';
import { leaderboardService } from '../services/leaderboard.service';
import { practiceService } from '../services/practice.service';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  settings: Settings | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** True once the boot-time session check (/auth/me) has settled — either a
   *  real session was confirmed (isAuthenticated → true) or the visitor was
   *  resolved to a guest. UI must treat the pre-check phase as "unknown" and
   *  render a neutral state instead of an avatar or signed-out buttons. */
  isSessionChecked: boolean;

  setAuth: (user: User, profile: Profile, settings: Settings, token: string) => void;
  setUser: (user: User) => void;
  setProfile: (profile: Profile) => void;
  setSettings: (settings: Settings) => void;
  setLoading: (loading: boolean) => void;
  setSessionChecked: (checked: boolean) => void;
  logout: () => void;
}

const TOKEN_KEY = 'typeoye_token';

/** A stored token is only a *hint* that a session may exist — it is NEVER
 *  proof of authentication. The presence of a stale/expired/revoked token must
 *  not render the navbar in a signed-in state, so we always boot as a guest and
 *  let AuthProvider's /auth/me check promote to isAuthenticated: true. */
function readStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function clearAllServiceCaches(): void {
  analyticsService.clearCache();
  lessonService.clearCache();
  leaderboardService.clearCache();
  practiceService.clearCache();
  try {
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith('lesson_') || key.startsWith('typeoye_')) {
        sessionStorage.removeItem(key);
      }
    });
  } catch {
    // no-op
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  settings: null,
  token: readStoredToken(),
  isAuthenticated: false,
  isLoading: false,
  isSessionChecked: false,

  setAuth: (user, profile, settings, token) => {
    clearAllServiceCaches();
    localStorage.setItem(TOKEN_KEY, token);
    set({ user, profile, settings, token, isAuthenticated: true, isLoading: false, isSessionChecked: true });
  },

  setUser: (user) => set({ user }),

  setProfile: (profile) => set({ profile }),

  setSettings: (settings) => {
    set({ settings });
    // Apply theme whenever settings change
    applyTheme(settings.theme);
  },

  setLoading: (isLoading) => set({ isLoading }),

  setSessionChecked: (isSessionChecked) => set({ isSessionChecked }),

  logout: () => {
    clearAllServiceCaches();
    localStorage.removeItem(TOKEN_KEY);
    set({ user: null, profile: null, settings: null, token: null, isAuthenticated: false, isLoading: false, isSessionChecked: true });
  },
}));

function applyTheme(theme: 'light' | 'dark' | 'system'): void {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
  } else if (theme === 'light') {
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
  } else {
    // system
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
    root.style.colorScheme = prefersDark ? 'dark' : 'light';
  }
}
