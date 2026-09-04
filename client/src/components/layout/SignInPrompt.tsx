import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LockKeyhole, ArrowRight } from 'lucide-react';

const PROMPTS: { path: string; title: string; description: string }[] = [
  {
    path: '/games',
    title: 'Sign in to play',
    description:
      'Typing Games are part of your Typeoye account. Sign in — or create a free account — to play, earn XP, unlock achievements, and have your results count on the leaderboard.',
  },
  {
    path: '/analytics',
    title: 'Sign in to view your analytics',
    description:
      'This page is tied to your Typeoye account. Create a free account — or sign back in — to track XP, streaks, achievements, and your saved results.',
  },
  {
    path: '/profile',
    title: 'Sign in to view your profile',
    description:
      'This page is tied to your Typeoye account. Create a free account — or sign back in — to track XP, streaks, achievements, and your saved results.',
  },
];

export function SignInPrompt() {
  const { pathname } = useLocation();
  const prompt =
    [...PROMPTS]
      .sort((a, b) => b.path.length - a.path.length)
      .find(({ path }) => pathname.startsWith(path)) ?? {
      title: 'Sign in to view your progress',
      description:
        'This page is tied to your Typeoye account. Create a free account — or sign back in — to track XP, streaks, achievements, and your saved results.',
    };

  return (
    <div className="min-h-[70vh] grid place-items-center p-6">
      <div className="w-full max-w-md card p-8 text-center">
        <div
          className="w-12 h-12 rounded-2xl grid place-items-center mx-auto"
          style={{ backgroundColor: 'var(--color-accent-light)' }}
        >
          <LockKeyhole size={22} style={{ color: 'var(--color-accent-text)' }} />
        </div>
        <h2 className="text-xl font-bold mt-4">{prompt.title}</h2>
        <p className="text-sm text-secondary mt-2 leading-relaxed">{prompt.description}</p>
        <div className="flex items-center justify-center gap-3 mt-6">
          <Link to="/login" className="btn btn-ghost px-4 py-2">Sign in</Link>
          <Link to="/register" className="btn btn-primary px-4 py-2">Create free account <ArrowRight size={15} /></Link>
        </div>
      </div>
    </div>
  );
}