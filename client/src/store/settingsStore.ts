import { create } from 'zustand';

type Theme = 'light' | 'dark' | 'system';

interface SettingsState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const THEME_KEY = 'typeoye_theme';

function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
  } else if (theme === 'light') {
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
    root.style.colorScheme = prefersDark ? 'dark' : 'light';
  }
  localStorage.setItem(THEME_KEY, theme);
}

const savedTheme = (localStorage.getItem(THEME_KEY) as Theme) || 'light';
applyTheme(savedTheme);

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: savedTheme,
  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme });
  },
}));
