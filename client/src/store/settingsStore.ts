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
  } else if (theme === 'light') {
    root.classList.remove('dark');
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) root.classList.add('dark');
    else root.classList.remove('dark');
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
