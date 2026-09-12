import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Activity, BarChart3, BookOpen, Check, ChevronDown, Clock, Flame, Gauge,
  History, Keyboard, ListChecks, Target, Timer, Trophy, Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { StatCard } from '../components/ui/StatCard';
import { WpmChart, AccuracyChart } from '../components/charts/WpmChart';
import { analyticsService } from '../services/analytics.service';
import { PRACTICE_TYPE_BY_SLUG } from '../data/practiceTypes';
import type {
  AnalyticsTrend, HistorySession, LessonHistory, ModeStats, ProgressData, ProgressStreak,
} from '../types';

const TABS = [
  { id: 'overview', label: 'Overview', to: '/progress' },
  { id: 'test', label: 'Test', to: '/progress/test' },
  { id: 'practice', label: 'Practice', to: '/progress/practice' },
  { id: 'learn', label: 'Learn', to: '/progress/learn' },
] as const;
type TabId = (typeof TABS)[number]['id'];

function Empty({ children }: { children: React.ReactNode }) { return <div className="h-40 flex items-center justify-center text-muted text-sm">{children}</div>; }

function SessionsTable({ rows, withMode }: { rows: HistorySession[]; withMode?: boolean }) {
  if (!rows.length) return <Empty>Nothing here yet — a few sessions and your history will show up.</Empty>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-muted">
            {withMode && <th className="pb-3 text-left">Mode</th>}
            <th className="pb-3 text-left">WPM</th>
            <th className="pb-3 text-left">Accuracy</th>
            <th className="pb-3 text-left">Duration</th>
            <th className="pb-3 text-left">Date</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row._id} className="border-t border-[var(--color-border)]">
              {withMode && <td className="py-3 capitalize">{practiceLabel(row.mode)}</td>}
              <td className="py-3 font-semibold">{row.wpm}</td>
              <td className="py-3">{row.accuracy}%</td>
              <td className="py-3">{formatDuration(row.durationSeconds)}</td>
              <td className="py-3">{new Date(row.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LessonsList({ rows }: { rows: LessonHistory[] }) {
  if (!rows.length) return <Empty>Complete a lesson to start tracking your learning progress.</Empty>;
  return (
    <div className="space-y-3">
      {rows.map((item) => (
        <div key={item._id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[var(--color-page)]">
          <div className="min-w-0">
            <p className="font-semibold truncate">{item.title}</p>
            <p className="text-xs text-muted mt-0.5">{item.attempts} attempt{item.attempts === 1 ? '' : 's'} · {formatDuration(item.timeSpentSeconds)} practiced</p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-bold text-[var(--color-correct)]">{item.bestAccuracy}%</p>
            <p className="text-xs text-muted mt-0.5">{new Date(item.completedAt).toLocaleDateString()}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function formatDuration(seconds: number): string {
  if (!seconds) return '0 min';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

function relativeTime(iso: string): string {
  const since = Date.now() - new Date(iso).getTime();
  if (since < 60_000) return 'just now';
  const m = Math.floor(since / 60_000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

function practiceLabel(slug: string): string {
  const meta = PRACTICE_TYPE_BY_SLUG[slug];
  if (meta) return meta.label;
  const replaced = slug.replace(/[-_]/g, ' ');
  return replaced.charAt(0).toUpperCase() + replaced.slice(1);
}

function localDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const WEEK_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function weekDays(active: Set<string>) {
  const today = new Date();
  const mondayOffset = today.getDay() === 0 ? -6 : 1 - today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  const todayKey = localDateKey(today);
  return WEEK_DAYS.map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key = localDateKey(d);
    return { key, label, active: active.has(key), isToday: key === todayKey };
  });
}

const EMPTY_STREAK: ProgressStreak = { current: 0, longest: 0, lastActiveDate: null, activeDates: [] };
const EMPTY_MODES: { test: ModeStats; practice: ModeStats } = {
  test: { count: 0, avgWpm: 0, avgAccuracy: 0, bestWpm: 0 },
  practice: { count: 0, avgWpm: 0, avgAccuracy: 0, bestWpm: 0 },
};

/* ── Overview building blocks ───────────────────────────────────────────── */

function ChartCard({ title, icon: Icon, tint, accent, children }: {
  title: string; icon: LucideIcon; tint: string; accent: string; children: React.ReactNode;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
          <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: tint, color: accent }}>
            <Icon size={16} />
          </span>
          {title}
        </h3>
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border border-[var(--color-border)] bg-[var(--color-page)]"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          30 Days
          <ChevronDown size={12} />
        </span>
      </div>
      {children}
    </div>
  );
}

function StreakCard({ streak }: { streak: ProgressStreak }) {
  const days = weekDays(new Set(streak.activeDates));
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
          <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
            <Flame size={16} />
          </span>
          Current Streak
        </h3>
        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Best: {streak.longest} days</span>
      </div>
      <div className="mt-4 flex items-end gap-1.5">
        <span className="text-4xl font-extrabold tabular-nums leading-none" style={{ color: 'var(--color-text-primary)' }}>
          {streak.current}
        </span>
        <span className="text-sm font-semibold mb-0.5" style={{ color: 'var(--color-text-secondary)' }}>days</span>
      </div>
      <div className="mt-4 grid grid-cols-7 gap-1.5">
        {days.map((d, i) => (
          <div key={`${d.key}-${i}`} className="flex flex-col items-center gap-1">
            <span className="text-[0.625rem] font-bold uppercase" style={{ color: d.isToday ? 'var(--color-accent-text)' : 'var(--color-text-muted)' }}>
              {d.label}
            </span>
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
              style={
                d.active
                  ? { background: 'linear-gradient(135deg, #f59e0b, #fb923c)', color: '#fff', boxShadow: '0 3px 8px rgba(245, 158, 11, 0.35)' }
                  : { border: '1px solid var(--color-border)', background: 'transparent' }
              }
            >
              {d.active ? (
                <Check size={13} strokeWidth={3} />
              ) : (
                <span className="w-1 h-1 rounded-full" style={{ background: 'var(--color-text-muted)' }} />
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentActivity({ testRows, practiceRows, lessonRows }: {
  testRows: HistorySession[]; practiceRows: HistorySession[]; lessonRows: LessonHistory[];
}) {
  const items = [
    ...testRows.map((r) => ({
      key: `t-${r._id}`,
      icon: Zap,
      tint: 'rgba(67, 97, 238, 0.12)',
      accent: '#4361ee',
      title: 'Typing Test Completed',
      meta: `${r.wpm} WPM · ${r.accuracy}% accuracy`,
      at: r.createdAt,
    })),
    ...practiceRows.map((r) => ({
      key: `p-${r._id}`,
      icon: Activity,
      tint: 'rgba(34, 197, 94, 0.12)',
      accent: '#16a34a',
      title: 'Practice Session',
      meta: `${practiceLabel(r.mode)} · ${r.wpm} WPM · ${r.accuracy}%`,
      at: r.createdAt,
    })),
    ...lessonRows.map((r) => ({
      key: `l-${r._id}`,
      icon: BookOpen,
      tint: 'rgba(139, 92, 246, 0.12)',
      accent: '#7c3aed',
      title: 'Lesson Completed',
      meta: r.title,
      at: r.completedAt,
    })),
  ]
    .sort((a, b) => +new Date(b.at) - +new Date(a.at))
    .slice(0, 6);

  return (
    <div className="card p-5">
      <h3 className="font-bold text-sm flex items-center gap-2 mb-4" style={{ color: 'var(--color-text-primary)' }}>
        <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1' }}>
          <History size={16} />
        </span>
        Recent Activity
      </h3>
      {items.length === 0 ? (
        <p className="text-sm py-4" style={{ color: 'var(--color-text-muted)' }}>
          No activity yet — your recent sessions will appear here.
        </p>
      ) : (
        <ul className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.key} className="flex items-center gap-3 py-2">
                <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: item.tint, color: item.accent }}>
                  <Icon size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>{item.title}</p>
                  <p className="text-xs truncate mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{item.meta}</p>
                </div>
                <span className="text-[0.6875rem] shrink-0" style={{ color: 'var(--color-text-muted)' }}>{relativeTime(item.at)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function PerformanceSummary({ test, practice, totals }: {
  test: ModeStats; practice: ModeStats; totals: { avgAccuracy: number; keystrokes: number };
}) {
  const items = [
    { label: 'Tests Taken', value: String(test.count), icon: Zap, tint: 'rgba(67, 97, 238, 0.1)', accent: '#4361ee' },
    { label: 'Practice Sessions', value: String(practice.count), icon: Activity, tint: 'rgba(34, 197, 94, 0.12)', accent: '#16a34a' },
    { label: 'Avg. Accuracy', value: `${totals.avgAccuracy}%`, icon: Target, tint: 'rgba(139, 92, 246, 0.12)', accent: '#7c3aed' },
    { label: 'Total Keystrokes', value: totals.keystrokes.toLocaleString(), icon: Keyboard, tint: 'rgba(245, 158, 11, 0.12)', accent: '#d97706' },
  ];
  return (
    <div className="card p-5">
      <h3 className="font-bold text-sm flex items-center gap-2 mb-4" style={{ color: 'var(--color-text-primary)' }}>
        <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(67, 97, 238, 0.12)', color: '#4361ee' }}>
          <BarChart3 size={16} />
        </span>
        Performance Summary
      </h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-xl p-4" style={{ background: item.tint }}>
              <div className="flex items-center gap-2">
                <span style={{ color: item.accent }}><Icon size={15} /></span>
                <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{item.label}</span>
              </div>
              <p className="text-2xl font-extrabold tabular-nums mt-2" style={{ color: 'var(--color-text-primary)' }}>{item.value}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════ */

export default function ProgressPage() {
  const navigate = useNavigate();
  const location = useLocation();
  // Seed from the module cache (if any) so returning to Progress renders it
  // fully on the very first frame — no loading card — and refreshes in the
  // background.
  const [data, setData] = useState<ProgressData | null>(analyticsService.getProgressCached());
  const [accuracyTrend, setAccuracyTrend] = useState<AnalyticsTrend[]>(analyticsService.getAccuracyTrendCached() ?? []);
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    Promise.all([analyticsService.getProgress(), analyticsService.getAccuracyTrend()])
      .then(([progress, accuracy]) => {
        setData(progress);
        setAccuracyTrend(accuracy);
      })
      .catch(() => setError('Could not load your progress. Please try again later.'));
  }, []);

  const path = location.pathname;
  const activeTab: TabId =
    path === '/progress/test' ? 'test'
      : path === '/progress/practice' ? 'practice'
      : path === '/progress/learn' ? 'learn'
      : 'overview';

  const test = data?.modes.test ?? EMPTY_MODES.test;
  const practice = data?.modes.practice ?? EMPTY_MODES.practice;
  const learn = data?.learn ?? { completedLessons: 0, totalLessons: 0, completedExercises: 0, avgAccuracy: 0, timeSpentSeconds: 0 };
  const streak = data?.streak ?? EMPTY_STREAK;
  const totals = data?.totals ?? { avgAccuracy: 0, keystrokes: 0 };
  const recent = data?.recent ?? { test: [], practice: [], lesson: [] };

  return (
    <PageWrapper title="My Progress" description="Track your typing speed, accuracy, and course progress at a glance." icon={BarChart3} dotGrid>
      <div className="flex gap-2 mb-6 border-b border-[var(--color-border)] overflow-x-auto">
        {TABS.map((item) => (
          <button
            key={item.id}
            onClick={() => navigate(item.to)}
            className={`px-4 py-3 font-semibold capitalize whitespace-nowrap transition-colors ${activeTab === item.id ? 'text-[var(--color-accent-text)] border-b-2 border-[var(--color-accent)]' : 'text-secondary hover:text-primary'}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error && <div className="card p-8 text-center text-[var(--color-error)] text-sm">{error}</div>}

      {/* When data is null the variables below use their zero-value fallbacks
          (EMPTY_MODES, EMPTY_STREAK, etc.) so the page structure renders on the
          very first frame — no "Loading…" placeholder that causes a flash.
          AuthProvider prefetches this data on app boot so the cache is warm
          before the user clicks the Dashboard/Progress link. */}
      {activeTab === 'overview' && (
        <>
          {/* Headline stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Best Test Speed" value={`${test.bestWpm} WPM`} subtext={`${test.count} test${test.count === 1 ? '' : 's'} · ${test.avgAccuracy}% accuracy`} icon={Gauge} tone="indigo" />
            <StatCard label="Average Practice Speed" value={`${practice.avgWpm} WPM`} subtext={`${practice.count} session${practice.count === 1 ? '' : 's'} · ${practice.avgAccuracy}% accuracy`} icon={Activity} tone="green" />
            <StatCard label="Levels Completed" value={`${learn.completedLessons}/${learn.totalLessons}`} subtext={`${learn.completedExercises} exercise${learn.completedExercises === 1 ? '' : 's'} done`} icon={BookOpen} tone="violet" />
            <StatCard label="Total Time Practiced" value={formatDuration(learn.timeSpentSeconds)} subtext="Across all sessions" icon={Timer} tone="amber" />
          </div>

          {/* Charts + right rail */}
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_330px] gap-5 mb-8">
            <div className="min-w-0 flex flex-col gap-5">
              <ChartCard title="WPM Over Time" icon={Gauge} tint="rgba(67, 97, 238, 0.12)" accent="#4361ee">
                <WpmChart data={data?.trend ?? []} withGradient />
              </ChartCard>
              <ChartCard title="Accuracy Trend" icon={Target} tint="rgba(34, 197, 94, 0.12)" accent="#16a34a">
                <AccuracyChart data={accuracyTrend} />
              </ChartCard>
            </div>
            <aside className="min-w-0 flex flex-col gap-5">
              <StreakCard streak={streak} />
              <RecentActivity testRows={recent.test} practiceRows={recent.practice} lessonRows={recent.lesson} />
            </aside>
          </div>

          {/* Performance summary */}
          <PerformanceSummary test={test} practice={practice} totals={totals} />
        </>
      )}

      {activeTab === 'test' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard label="Average WPM" value={test.avgWpm} icon={Zap} tone="indigo" />
            <StatCard label="Average Accuracy" value={`${test.avgAccuracy}%`} icon={Target} tone="green" />
            <StatCard label="Best WPM" value={test.bestWpm} icon={Trophy} tone="amber" />
            <StatCard label="Tests Taken" value={test.count} icon={Clock} tone="violet" />
          </div>
          <div className="card p-5">
            <h3 className="font-bold text-lg mb-4">Recent Tests</h3>
            <SessionsTable rows={recent.test} />
          </div>
        </>
      )}

      {activeTab === 'practice' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard label="Average WPM" value={practice.avgWpm} icon={Zap} tone="indigo" />
            <StatCard label="Average Accuracy" value={`${practice.avgAccuracy}%`} icon={Target} tone="green" />
            <StatCard label="Best WPM" value={practice.bestWpm} icon={Trophy} tone="amber" />
            <StatCard label="Sessions Completed" value={practice.count} icon={Clock} tone="violet" />
          </div>
          <div className="card p-5">
            <h3 className="font-bold text-lg mb-4">Recent Practice Sessions</h3>
            <SessionsTable rows={recent.practice} withMode />
          </div>
        </>
      )}

      {activeTab === 'learn' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard label="Levels Completed" value={`${learn.completedLessons}/${learn.totalLessons}`} icon={Trophy} tone="violet" />
            <StatCard label="Exercises Completed" value={learn.completedExercises} icon={ListChecks} tone="indigo" />
            <StatCard label="Average Accuracy" value={`${learn.avgAccuracy}%`} icon={Target} tone="green" />
            <StatCard label="Time Practiced" value={formatDuration(learn.timeSpentSeconds)} icon={Timer} tone="amber" />
          </div>
          <div className="card p-5">
            <h3 className="font-bold text-lg mb-4">Completed Lessons</h3>
            <LessonsList rows={recent.lesson} />
          </div>
        </>
      )}
    </PageWrapper>
  );
}