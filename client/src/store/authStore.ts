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

  setAuth: (user: User, profile: Profile, settings: Settings, token: string) => void;
  setUser: (user: User) => void;
  setProfile: (profile: Profile) => void;
  setSettings: (settings: Settings) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

const TOKEN_KEY = 'typeoye_token';

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
  token: localStorage.getItem(TOKEN_KEY),
  isAuthenticated: !!localStorage.getItem(TOKEN_KEY),
  isLoading: false,

  setAuth: (user, profile, settings, token) => {
    clearAllServiceCaches();
    localStorage.setItem(TOKEN_KEY, token);
    set({ user, profile, settings, token, isAuthenticated: true, isLoading: false });
  },

  setUser: (user) => set({ user }),

  setProfile: (profile) => set({ profile }),

  setSettings: (settings) => {
    set({ settings });
    // Apply theme whenever settings change
    applyTheme(settings.theme);
  },

  setLoading: (isLoading) => set({ isLoading }),

  logout: () => {
    clearAllServiceCaches();
    localStorage.removeItem(TOKEN_KEY);
    set({ user: null, profile: null, settings: null, token: null, isAuthenticated: false });
  },
}));

function applyTheme(theme: 'light' | 'dark' | 'system'): void {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else if (theme === 'light') {
    root.classList.remove('dark');
  } else {
    // system
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) root.classList.add('dark');
    else root.classList.remove('dark');
  }
}
