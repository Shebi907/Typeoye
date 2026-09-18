import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageWrapper } from '../components/layout/PageWrapper';
import { ProseSection } from '../components/content/ProseSection';
import TypingRace from '../components/games/TypingRace';
import FallingWords from '../components/games/FallingWords';
import SuddenDeath from '../components/games/SuddenDeath';
import GameErrorBoundary from '../components/games/GameErrorBoundary';
import { gamesService } from '../services/games.service';
import { useAuthStore } from '../store/authStore';
import type { GameResult, GameType } from '../types';
import { useSeo } from '../hooks/useSeo';
import {
  Gamepad2, CloudLightning, Zap, LogIn,
  ArrowRight, Trophy, Play, Clock, Star, Sparkles,
  TrendingUp, Target, Crosshair, Flame,
  type LucideIcon,
} from 'lucide-react';

/* ── Game metadata ──────────────────────────────────────────────────────── */

type GameKey = GameType;

interface GameCardData {
  key: GameKey;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  difficulty: string;
  category: 'speed' | 'accuracy' | 'challenge';
  featured?: boolean;
}

const GAMES: GameCardData[] = [
  {
    key: 'typingRace',
    title: 'Typing Race',
    description: 'Race to 60 words against a bot paced at your average WPM. Beat it to win.',
    icon: Gamepad2,
    color: '#4361ee',
    bg: 'rgba(67, 97, 238, 0.1)',
    difficulty: 'Medium',
    category: 'speed',
    featured: true,
  },
  {
    key: 'fallingWords',
    title: 'Falling Words',
    description: 'Type words before they fall too far. Speed picks up the longer you survive.',
    icon: CloudLightning,
    color: '#7c3aed',
    bg: 'rgba(124, 58, 237, 0.1)',
    difficulty: 'Medium',
    category: 'accuracy',
  },
  {
    key: 'suddenDeath',
    title: 'Sudden Death Sprint',
    description: 'One mistake ends it — unless you\'ve earned a shield. How long can you last?',
    icon: Zap,
    color: '#d97706',
    bg: 'rgba(217, 119, 6, 0.1)',
    difficulty: 'Hard',
    category: 'challenge',
  },
];

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  all: Sparkles,
  speed: TrendingUp,
  accuracy: Target,
  challenge: Flame,
};

const CATEGORIES = [
  { key: 'all', label: 'All Games' },
  { key: 'speed', label: 'Speed' },
  { key: 'accuracy', label: 'Accuracy' },
  { key: 'challenge', label: 'Challenge' },
];

const GAME_COMPONENTS: Record<GameKey, React.FC<{ onBack?: () => void }>> = {
  typingRace: TypingRace,
  fallingWords: FallingWords,
  suddenDeath: SuddenDeath,
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/* ════════════════════════════════════════════════════════════════════════ */

export default function Games() {
  useSeo({
    title: 'Typing Games Online – Improve Your Typing Speed | TypeOye',
    description: 'Play free typing games online and improve your typing speed, accuracy, and keyboard skills while having fun with TypeOye.',
    canonicalPath: '/games',
  });
  const [active, setActive] = useState<'hub' | GameKey>('hub');
  const [category, setCategory] = useState('all');
  const [recent, setRecent] = useState<GameResult[]>([]);
  const [allResults, setAllResults] = useState<GameResult[]>([]);
  const { isAuthenticated } = useAuthStore();
  const [searchParams] = useSearchParams();

  /* ── Fetch history ─────────────────────────────────────────────────────── */

  useEffect(() => {
    if (!isAuthenticated) return;
    gamesService.getHistory()
      .then(setAllResults)
      .catch(() => undefined);
    gamesService.getHistory('typingRace')
      .then((results) => setRecent(results.slice(0, 5)))
      .catch(() => undefined);
  }, [isAuthenticated]);

  /* ── URL deep-link ─────────────────────────────────────────────────────── */

  useEffect(() => {
    const play = searchParams.get('play');
    if (isAuthenticated && play && (play === 'typingRace' || play === 'fallingWords' || play === 'suddenDeath')) {
      setActive(play);
    }
  }, [isAuthenticated, searchParams]);

  /* ── Compute per-game stats ────────────────────────────────────────────── */

  const gameStats = useMemo(() => {
    const stats: Record<GameKey, { best: number; count: number; lastPlayed: string | null }> = {
      typingRace: { best: 0, count: 0, lastPlayed: null },
      fallingWords: { best: 0, count: 0, lastPlayed: null },
      suddenDeath: { best: 0, count: 0, lastPlayed: null },
    };
    allResults.forEach((r) => {
      const g = stats[r.game];
      if (!g) return;
      g.count++;
      if (r.wpm > g.best) g.best = r.wpm;
      if (!g.lastPlayed || r.createdAt > g.lastPlayed) g.lastPlayed = r.createdAt;
    });
    return stats;
  }, [allResults]);

  const openGame = (key: GameKey) => setActive(key);

  const filteredGames = category === 'all' ? GAMES : GAMES.filter((g) => g.category === category);

  const GameComponent = GAME_COMPONENTS[active as GameKey];

  /* ── ACTIVE GAME VIEW ──────────────────────────────────────────────────── */

  if (active !== 'hub') {
    const goBack = () => setActive('hub');
    return (
      <PageWrapper title="Games" noHeader fullWidth className="py-8 px-4 sm:px-6">
        <div className="max-w-[106.25rem] mx-auto w-full">
          <GameErrorBoundary onBack={goBack}>
            <GameComponent onBack={goBack} />
          </GameErrorBoundary>
        </div>
      </PageWrapper>
    );
  }

  /* ── HUB VIEW ──────────────────────────────────────────────────────────── */

  return (
    <PageWrapper title="" fullWidth className="py-8 px-4 sm:px-6">
      <div className="max-w-[106.25rem] mx-auto w-full">

        {/* ── Header ── */}
        <div className="relative mb-6">
          <div className="flex items-center gap-3 mb-1">
            <span
              className="flex items-center justify-center rounded-xl shrink-0"
              style={{ width: '2.625rem', height: '2.625rem', background: 'linear-gradient(135deg, #4361ee, #7c3aed)' }}
            >
              <Gamepad2 size={22} color="#fff" />
            </span>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Typing Games Online</h1>
              <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                Sharpen your typing skills with a little competition.
              </p>
            </div>
          </div>
        </div>

        {/* Guest banner */}
        {!isAuthenticated && (
          <p className="mb-4 text-sm text-secondary text-center">
            <LogIn size={14} className="inline mr-1" />
            Browse freely — sign in after a game to save your score and appear on the leaderboard.
          </p>
        )}

        {/* ── Category Filters ── */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {CATEGORIES.map(({ key, label }) => {
            const isActive = category === key;
            const CatIcon = CATEGORY_ICONS[key] ?? Sparkles;
            return (
              <button
                key={key}
                onClick={() => setCategory(key)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-150"
                style={{
                  background: isActive ? 'linear-gradient(135deg, #4361ee, #7c3aed)' : 'var(--color-card)',
                  color: isActive ? '#fff' : 'var(--color-text-secondary)',
                  border: isActive ? 'none' : '1px solid var(--color-border)',
                  boxShadow: isActive ? '0 4px 12px rgba(67, 97, 238, 0.3)' : undefined,
                }}
              >
                <CatIcon size={14} />
                {label}
              </button>
            );
          })}
        </div>

        {/* ── Game Cards Grid ── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filteredGames.map((game, index) => {
            const Icon = game.icon;
            const stats = gameStats[game.key];
            const isFeatured = index === 0 && category === 'all' && game.featured;

            if (isFeatured) {
              return (
                <div
                  key={game.key}
                  className="sm:col-span-2 rounded-2xl p-[0.0625rem] cursor-pointer transition-all duration-200"
                  style={{
                    background: 'linear-gradient(135deg, rgba(67,97,238,0.35), rgba(124,58,237,0.35))',
                    boxShadow: '0 8px 32px -10px rgba(67, 97, 238, 0.4)',
                  }}
                  onClick={() => openGame(game.key)}
                  role="button"
                  data-testid={`game-card-${game.key}`}
                >
                  <div
                    className="rounded-[0.9375rem] p-6 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center gap-5 transition-all duration-200"
                    style={{ backgroundColor: 'var(--color-card)' }}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110"
                        style={{ background: `linear-gradient(135deg, ${game.color}, ${game.color}dd)`, color: '#fff', boxShadow: `0 8px 20px -6px ${game.color}66` }}
                      >
                        <Icon size={26} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{game.title}</h3>
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.625rem] font-bold uppercase tracking-wider"
                            style={{ background: 'linear-gradient(135deg, #4361ee, #7c3aed)', color: '#fff' }}
                          >
                            <Star size={10} fill="currentColor" /> Recommended
                          </span>
                        </div>
                        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>{game.description}</p>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <span
                            className={`games-diff games-diff-${game.key} inline-flex items-center px-2 py-0.5 rounded-full text-[0.625rem] font-bold uppercase tracking-wider`}
                            style={{ backgroundColor: `${game.color}14` }}
                          >
                            {game.difficulty}
                          </span>
                          {stats.count > 0 ? (
                            <span className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                              Best: {stats.best} WPM &bull; {stats.count} played
                            </span>
                          ) : (
                            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Not played yet</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      className="flex items-center gap-1.5 text-sm font-bold px-5 py-2.5 rounded-xl shrink-0 transition-all duration-150"
                      style={{ background: 'linear-gradient(135deg, #4361ee, #7c3aed)', color: '#fff', boxShadow: '0 4px 12px rgba(67,97,238,0.3)' }}
                    >
                      Play Now <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={game.key}
                className="card p-5 flex flex-col gap-3 cursor-pointer transition-all duration-200 group hover:-translate-y-0.5"
                style={{ '--hover-shadow': `0 8px 24px -8px ${game.color}30` } as React.CSSProperties}
                onClick={() => openGame(game.key)}
                role="button"
                data-testid={`game-card-${game.key}`}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = game.color;
                  e.currentTarget.style.boxShadow = `0 8px 24px -8px ${game.color}30`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '';
                  e.currentTarget.style.boxShadow = '';
                }}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`games-diff games-diff-${game.key} w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110`}
                    style={{ background: game.bg }}
                  >
                    <Icon size={20} />
                  </div>
                  <span
                    className={`games-diff games-diff-${game.key} inline-flex items-center px-2 py-0.5 rounded-full text-[0.625rem] font-bold uppercase tracking-wider`}
                    style={{ backgroundColor: `${game.color}14` }}
                  >
                    {game.difficulty}
                  </span>
                </div>
                <h3 className="font-bold text-base" style={{ color: 'var(--color-text-primary)' }}>{game.title}</h3>
                <p className="text-sm flex-1" style={{ color: 'var(--color-text-secondary)' }}>{game.description}</p>
                {stats.count > 0 ? (
                  <div className="flex items-center gap-3 text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                    <span className="flex items-center gap-1"><Trophy size={12} /> {stats.best} WPM</span>
                    <span>{stats.count} played</span>
                  </div>
                ) : (
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Not played yet</p>
                )}
<button
                  className="games-play-btn w-full mt-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 transition-all duration-150"
                >
                  <Play size={14} /> Play Now <ArrowRight size={13} />
                </button>
              </div>
            );
          })}
        </div>

        {/* ── Recent Races ── */}
        {recent.length > 0 && (
          <div className="card mt-6 overflow-hidden">
            <div className="p-4 border-b flex items-center gap-2 font-semibold" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}>
              <Clock size={15} style={{ color: 'var(--color-accent-text)' }} />
              Recent Races
            </div>
            <div className="overflow-x-auto">
              <div className="min-w-[25rem]">
                <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                  {recent.map((race) => (
                    <div key={race._id} className="flex items-center justify-between px-4 py-3 text-sm">
                      <span className={race.winner === 'user' ? 'font-semibold' : ''} style={{ color: race.winner === 'user' ? 'var(--color-correct)' : 'var(--color-text-secondary)' }}>
                        {race.winner === 'user' ? 'Win' : 'Loss'}
                      </span>
                      <span style={{ color: 'var(--color-text-primary)' }}>{race.wpm} WPM</span>
                      <span style={{ color: 'var(--color-text-primary)' }}>{race.accuracy}%</span>
                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{formatDate(race.createdAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <ProseSection title="About these games" learnMoreLabel="Learn more about typing games" icon={Gamepad2}>
          <p>
            Each game trains a different side of typing.
          </p>
          <p>
            <strong>Typing Race</strong> is a test of sustained speed. You race a bot to 60 words, and the
            bot is paced at your average WPM — so winning means typing at your own best level, consistently,
            from start to finish. It's the closest thing here to a head-to-head speed trial.
          </p>
          <p>
            <strong>Falling Words</strong> is a test of accuracy and reaction time. Words drift down the
            screen and you have to type them before they fall out of reach. The longer you survive, the
            faster everything falls, so the challenge is staying calm and accurate under growing time
            pressure.
          </p>
          <p>
            <strong>Sudden Death Sprint</strong> is the hardest: one mistake ends the run, unless you've
            earned a shield. It rewards slow, precise typing and forces you to fight the instinct to rush.
            Longevity is the metric — how long can you keep a near-perfect streak alive?
          </p>
          <p>
            <strong>What they build.</strong> Between the three, you'll develop raw speed (Typing Race),
            reaction time and stress control (Falling Words), and precision under pressure (Sudden Death).
            Games also count toward the leaderboard when you finish at 90% accuracy or higher, so a strong
            run can be both fun and a rankings play. Play as a guest or sign in to save every score and
            watch your best WPM climb.
          </p>
        </ProseSection>
      </div>
    </PageWrapper>
  );
}
