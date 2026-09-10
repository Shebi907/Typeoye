import React, { useEffect, useState, useMemo } from 'react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { leaderboardService } from '../services/leaderboard.service';
import type { LeaderboardEntry, LeaderboardPeriod, LeaderboardResponse } from '../types';
import { Trophy, Flame, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '../components/ui/Skeleton';
import { Avatar } from '../components/ui/Avatar';
import { cn } from '../utils/cn';
import { useSeo } from '../hooks/useSeo';

const PERIODS: { key: LeaderboardPeriod; label: string }[] = [
  { key: 'daily', label: 'Today' },
  { key: 'weekly', label: 'This Week' },
  { key: 'monthly', label: 'This Month' },
  { key: 'global', label: 'All Time' },
];

const PAGE_SIZE = 10;

function TopThreePodium({ entries }: { entries: LeaderboardEntry[] }) {
  const top3 = entries.slice(0, 3);
  if (top3.length === 0) return null;

  const first = top3.find((e) => e.rank === 1);
  const second = top3.find((e) => e.rank === 2);
  const third = top3.find((e) => e.rank === 3);

  const podiumOrder = [second, first, third].filter(Boolean) as LeaderboardEntry[];
  const heights = [100, 130, 80];
  const medalColors = ['text-gray-400', 'text-yellow-500', 'text-amber-600'];
  const medalBgs = ['rgba(156,163,175,0.12)', 'rgba(234,179,8,0.12)', 'rgba(180,83,9,0.12)'];

  return (
    <div className="card p-5 mb-4">
      <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--color-text-secondary)' }}>Top 3 Typists</h3>
      <div className="flex items-end justify-center gap-4 pt-4">
        {podiumOrder.map((entry, i) => {
          const isFirst = entry.rank === 1;
          const podiumIdx = isFirst ? 1 : entry.rank === 2 ? 0 : 2;
          return (
            <div key={entry.userId ?? entry.rank} className="flex flex-col items-center" style={{ flex: '0 0 auto' }}>
              {/* Avatar */}
              <Avatar name={entry.displayName} size={isFirst ? 64 : 48} className="mb-2" />
              <span className="text-xs font-semibold text-center mb-1 truncate max-w-[80px]" style={{ color: 'var(--color-text-primary)' }}>
                {entry.displayName}
              </span>
              <span className="text-[11px] font-bold tabular-nums mb-2" style={{ color: 'var(--color-accent-text)' }}>{entry.wpm} WPM</span>
              {/* Podium bar */}
              <div
                className={cn('w-20 rounded-t-xl flex items-center justify-center')}
                style={{
                  height: heights[podiumIdx],
                  background: isFirst ? 'linear-gradient(180deg, rgba(67,97,238,0.15) 0%, rgba(139,92,246,0.08) 100%)' : 'var(--color-card)',
                  border: isFirst ? '1px solid rgba(67,97,238,0.2)' : '1px solid var(--color-border)',
                  borderBottom: 'none',
                }}
              >
                <span className={cn('text-lg font-bold', medalColors[podiumIdx])}>
                  {entry.rank === 1 ? '\uD83E\uDD47' : entry.rank === 2 ? '\uD83E\uDD48' : '\uD83E\uDD49'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function YourRankCard({ me }: { me: Omit<LeaderboardEntry, 'isMe'> | null }) {
  if (!me) return null;
  return (
    <div className="card p-5">
      <h3 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-secondary)' }}>Your Rank</h3>
      <div className="flex items-center gap-4">
        <Avatar name={me.displayName} size={48} className="flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>
            #{me.rank}
          </div>
          <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {me.displayName}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 mt-4">
        <div className="text-center p-2 rounded-lg" style={{ backgroundColor: 'rgba(67,97,238,0.08)' }}>
          <div className="text-lg font-bold tabular-nums" style={{ color: 'var(--color-accent-text)' }}>{me.wpm}</div>
          <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#60A5FA' }}>WPM</div>
        </div>
        <div className="text-center p-2 rounded-lg" style={{ backgroundColor: 'rgba(34,197,94,0.08)' }}>
          <div className="text-lg font-bold tabular-nums" style={{ color: 'var(--color-correct)' }}>{me.accuracy}%</div>
          <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#4ADE80' }}>ACC</div>
        </div>
        <div className="text-center p-2 rounded-lg" style={{ backgroundColor: 'rgba(139,92,246,0.08)' }}>
          <div className="text-lg font-bold rs-cert">Lvl {me.level}</div>
          <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#A78BFA' }}>LEVEL</div>
        </div>
      </div>
    </div>
  );
}

/** Stable shell that mirrors the loaded leaderboard layout — podium + your
 *  rank on the left, a full-width ranking table on the right — so the footer
 *  never jumps while the leaderboard data loads in. */
function LeaderboardSkeleton() {
  const podiumHeights = [100, 130, 80];
  const rowCount = 6;

  return (
    <div className="flex flex-col lg:flex-row gap-5" aria-busy="true" data-testid="leaderboard-loading">
      {/* Left column — podium + your rank */}
      <aside className="w-full lg:w-[320px] shrink-0 flex flex-col">
        <div className="card p-5 mb-4">
          <Skeleton width="90px" height="0.8rem" className="mb-4" />
          <div className="flex items-end justify-center gap-4 pt-4">
            {podiumHeights.map((h, i) => (
              <div key={i} className="flex flex-col items-center" style={{ flex: '0 0 auto' }}>
                <Skeleton width={i === 1 ? '64px' : '48px'} height={i === 1 ? '64px' : '48px'} rounded="full" className="mb-2" />
                <Skeleton width="60px" height="0.65rem" className="mb-2" />
                <div className="w-20 rounded-t-xl flex items-center justify-center" style={{ height: h }}>
                  <Skeleton width="20px" height="0.9rem" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-5">
          <Skeleton width="90px" height="0.8rem" className="mb-3" />
          <div className="flex items-center gap-4">
            <Skeleton width="48px" height="48px" rounded="full" className="flex-shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
              <Skeleton width="52px" height="1.1rem" />
              <Skeleton width="120px" height="0.75rem" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="p-3 rounded-lg text-center space-y-1.5" style={{ backgroundColor: 'rgba(107, 114, 128, 0.06)' }}>
                <Skeleton width="80%" height="1.1rem" className="mx-auto" />
                <Skeleton width="60%" height="0.6rem" className="mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Right column — table */}
      <div className="flex-1 min-w-0">
        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <Skeleton width="15px" height="15px" />
            <Skeleton width="110px" height="0.9rem" />
          </div>
          <div className="flex items-center gap-4 px-4 py-3" style={{ backgroundColor: 'var(--color-page)' }}>
            <Skeleton width="40px" height="0.7rem" />
            <Skeleton width="160px" height="0.7rem" />
            <Skeleton width="60px" height="0.7rem" className="ml-auto" />
            <Skeleton width="80px" height="0.7rem" />
          </div>
          {Array.from({ length: rowCount }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <Skeleton width={i < 3 ? '24px' : '20px'} height="0.85rem" />
              <Skeleton width="32px" height="32px" rounded="full" />
              <div className="flex-1 min-w-0 space-y-1.5">
                <Skeleton width={i === 0 ? '42%' : i === 1 ? '36%' : '48%'} height="0.8rem" />
              </div>
              <Skeleton width="40px" height="0.9rem" />
              <Skeleton width="56px" height="0.8rem" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Leaderboard() {
  useSeo({
    title: 'Typing Speed Leaderboard — Fastest Typists | Typeoye',
    description: 'Compare your typing speed against the fastest typists on Typeoye. Explore daily, weekly, monthly, and all-time typing leaderboards.',
    canonicalPath: '/leaderboard',
  });
  const [period, setPeriod] = useState<LeaderboardPeriod>('daily');
  
  // Seed from the module cache (if any) so returning to Leaderboard renders the full
  // list on the very first frame — no skeleton.
  // When no cache exists (first visit before prefetch), start with empty and loading=false
  // to avoid flashing the skeleton.
  const cached = leaderboardService.getLeaderboardCached(period);
  const [entries, setEntries] = useState<LeaderboardEntry[]>(cached?.leaderboard ?? []);
  const [me, setMe] = useState<LeaderboardResponse['me']>(cached?.me ?? null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    // We don't set loading to true here to avoid skeleton flash on period change.
    // The previous period's data stays on screen until the new data arrives (fast).
    setPage(1);
    leaderboardService.getLeaderboard(period, 50)
      .then((data) => {
        setEntries(data.leaderboard);
        setMe(data.me);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [period]);

  const totalPages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const pageEntries = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return entries.slice(start, start + PAGE_SIZE);
  }, [entries, page]);

  const inTop = me ? entries.some((e) => e.userId === me.userId) : false;

  return (
    <PageWrapper title="" fullWidth className="py-6 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto w-full">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #4361EE, #8B5CF6)', boxShadow: '0 8px 24px rgba(67,97,238,0.3)' }}
            >
              <Trophy size={26} color="#fff" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold" style={{ color: 'var(--color-text-primary)' }}>Leaderboard</h1>
              <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>Compete with typists worldwide and see how you rank.</p>
            </div>
          </div>
          <div
            className="px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2"
            style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)', color: '#D97706' }}
          >
            <Flame size={16} /> Type faster. Rank higher.
          </div>
        </div>

        {/* ── Period filter ── */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex rounded-xl p-1" style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
            {PERIODS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setPeriod(key)}
                className={cn(
                  'px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200',
                  period === key ? 'text-white shadow-md' : 'hover:bg-[var(--color-border)]',
                )}
                style={period === key ? { background: 'linear-gradient(135deg, #4361EE, #8B5CF6)', color: '#fff' } : { color: 'var(--color-text-secondary)' }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Two-column layout ── */}
        {loading ? (
          <LeaderboardSkeleton />
        ) : (
        <div className="flex flex-col lg:flex-row gap-5">

          {/* Left column */}
          <div className="w-full lg:w-[320px] shrink-0 flex flex-col">
            <>
              <TopThreePodium entries={entries} />
              <YourRankCard me={me} />
            </>
          </div>

          {/* Right column — table */}
          <div className="flex-1 min-w-0">
            <div className="card overflow-hidden">
              {/* Table header */}
              <div className="flex items-center gap-2 p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
                <Users size={15} style={{ color: 'var(--color-accent-text)' }} />
                <h2 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>All Typists</h2>
              </div>

              {entries.length === 0 && !me ? (
                <div className="p-12 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                  No qualifying results for this period yet. Complete a timed test (90%+ accuracy) to get ranked.
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-xs uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-page)' }}>
                          <th className="px-4 py-3 font-semibold w-14 text-center">Rank</th>
                          <th className="px-4 py-3 font-semibold">User</th>
                          <th className="px-4 py-3 font-semibold text-right">WPM</th>
                          <th className="px-4 py-3 font-semibold text-right">Accuracy</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                        {pageEntries.map((entry) => (
                          <tr
                            key={entry.userId ?? entry.rank}
                            className={cn(
                              'transition-colors hover:bg-[var(--color-page)]',
                              entry.isMe && 'bg-[var(--color-accent-light)]',
                              entry.rank === 1 && !entry.isMe && 'bg-[rgba(67,97,238,0.04)]',
                            )}
                          >
                            <td className="px-4 py-3 text-center font-bold">
                              {entry.rank === 1 ? (
                                <span className="text-yellow-500 text-lg">{'\uD83E\uDD47'}</span>
                              ) : entry.rank === 2 ? (
                                <span className="text-gray-400 text-lg">{'\uD83E\uDD48'}</span>
                              ) : entry.rank === 3 ? (
                                <span className="text-amber-600 text-lg">{'\uD83E\uDD49'}</span>
                              ) : (
                                <span style={{ color: 'var(--color-text-secondary)' }}>{entry.rank}</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <Avatar name={entry.displayName} size={32} className="flex-shrink-0" />
                                <div className="min-w-0">
                                  <div className="font-semibold text-sm truncate flex items-center gap-1.5" style={{ color: 'var(--color-text-primary)' }}>
                                    {entry.displayName}
                                    {entry.isMe && (
                                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: 'var(--color-accent)', color: '#fff' }}>YOU</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right font-bold tabular-nums text-sm" style={{ color: 'var(--color-text-primary)' }}>
                              {entry.wpm}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold tabular-nums text-sm" style={{ color: 'var(--color-correct)' }}>
                              {entry.accuracy}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-1.5 py-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-1.5 rounded-lg transition-colors disabled:opacity-30"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                        const pageNum = i + 1;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setPage(pageNum)}
                            className={cn(
                              'w-8 h-8 rounded-lg text-xs font-bold transition-all',
                              page === pageNum ? 'text-white shadow-sm' : 'hover:bg-[var(--color-border)]',
                            )}
                            style={page === pageNum
                              ? { background: 'linear-gradient(135deg, #4361EE, #8B5CF6)', color: '#fff' }
                              : { color: 'var(--color-text-secondary)' }}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="p-1.5 rounded-lg transition-colors disabled:opacity-30"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        )}
      </div>
    </PageWrapper>
  );
}
