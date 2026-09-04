import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#4361EE',
          hover: '#3451D1',
          light: '#EEF1FD',
        },
        page: '#FAFAFB',
        card: '#FFFFFF',
        'card-border': '#ECECF0',
        'text-primary': '#17171F',
        'text-secondary': '#6B6B76',
        'text-muted': '#8A8A94',
        correct: '#22C55E',
        error: '#EF4444',
        pending: '#8A8A94',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      borderRadius: {
        card: '16px',
        btn: '10px',
        input: '10px',
      },
      boxShadow: {
        card: '0 2px 12px rgba(0,0,0,0.06)',
        'card-hover': '0 6px 24px rgba(0,0,0,0.10)',
        accent: '0 4px 16px rgba(67,97,238,0.25)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease',
        'slide-up': 'slideUp 0.25s ease',
        'pulse-caret': 'pulseCaret 1.1s ease-in-out infinite',
        'count-up': 'countUp 0.3s ease',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pulseCaret: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        countUp: {
          from: { transform: 'translateY(4px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
