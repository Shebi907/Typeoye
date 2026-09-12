import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LineChart as LineChartIcon, Zap, Target, Trophy, FileText, ArrowRight, Keyboard, Dumbbell, Gamepad2, Award, Lightbulb, Flame, BookOpen } from 'lucide-react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { StatCard } from '../components/ui/StatCard';
import { WpmChart, AccuracyChart } from '../components/charts/WpmChart';
import { analyticsService } from '../services/analytics.service';
import { userService } from '../services/user.service';
import { lessonService } from '../services/lesson.service';
import { useAuthStore } from '../store/authStore';
import type { DashboardData, HistorySession, AchievementView, CourseLesson } from '../types';

function formatDay(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (sameDay(d, today)) return 'Today';
  if (sameDay(d, yesterday)) return 'Yesterday';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatDuration(seconds: number): string {
  if (seconds >= 60 && seconds % 60 === 0) return `${seconds / 60} min`;
  return `${Math.round(seconds)}s`;
}

export default function UserHome() {
  const { user, profile, settings } = useAuthStore();
  const firstName = (profile?.displayName || user?.username || 'there').split(' ')[0];

  const [dash, setDash] = useState<DashboardData | null>(null);
  const [recent, setRecent] = useState<HistorySession[]>([]);
  const [achievements, setAchievements] = useState<AchievementView[]>([]);
  const [lessons, setLessons] = useState<CourseLesson[]>([]);
  const [chartMode, setChartMode] = useState<'wpm' | 'accuracy'>('wpm');

  useEffect(() => {
    analyticsService.getDashboard().then(setDash).catch(() => undefined);
    analyticsService.getHistory({ page: 1 }).then((r) => setRecent(r.sessions.slice(0, 5))).catch(() => undefined);
    userService.getAchievements().then(setAchievements).catch(() => undefined);
    lessonService.getLessons().then(setLessons).catch(() => undefined);
  }, []);

  const progress = dash?.progress;
  const trendData = chartMode === 'wpm' ? dash?.charts.wpm ?? [] : dash?.charts.accuracy ?? [];
  const unlockedAchievements = achievements.filter((a) => a.unlocked);

  // Next lesson to continue: first uncompleted unlocked one, else first locked one.
  const nextLesson =
    lessons.find((l) => l.unlocked && !l.completed) ??
    lessons.find((l) => !l.completed) ??
    null;
  const nextLessonPct = nextLesson && nextLesson.completedExercises > 0
    ? Math.min(100, Math.round((nextLesson.completedExercises / Math.max(1, nextLesson.attempts + nextLesson.completedExercises)) * 100))
    : nextLesson?.completedExercises ?? 0;

  const quickActions = [
    { icon: Keyboard, title: 'Typing Test', description: 'Test your current speed', cta: 'Start', to: '/test', tone: { backgroundColor: 'rgba(67, 97, 238, 0.12)', color: '#4361ee' } },
    { icon: Dumbbell, title: 'Practice', description: 'Improve your weak keys', cta: 'Practice', to: '/practice', tone: { backgroundColor: 'rgba(34, 197, 94, 0.14)', color: '#16a34a' } },
    { icon: Gamepad2, title: 'Games', description: 'Have fun while improving', cta: 'Play', to: '/games', tone: { backgroundColor: 'rgba(139, 92, 246, 0.14)', color: '#7c3aed' } },
  ];

  return (
    <PageWrapper fullWidth className="py-6 px-3 sm:px-4 md:px-6" title={undefined}>
      <div className="max-w-[106.25rem] mx-auto w-full flex flex-col gap-6">
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section
          className="rounded-2xl p-6 sm:p-8 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #3730A3 0%, #4361EE 55%, #8B5CF6 100%)', boxShadow: '0 14px 34px -10px rgba(67, 97, 238, 0.45)' }}
        >
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[inherit]" aria-hidden="true">
            <span className="navbar-gradient-circle w-52 h-52 -right-16 -top-28" />
            <span className="navbar-gradient-circle w-40 h-40 -left-10 -bottom-24" style={{ opacity: 0.6 }} />
          </div>
          <div className="relative">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {firstName} 👋
            </h1>
            <p className="text-white/85 mt-1.5">Ready to improve your typing today?</p>
            <Link to="/test" className="btn btn-sm gpill-start inline-flex items-center gap-1.5 mt-5 px-5 py-2.5 text-sm">
              Start Typing Test <ArrowRight size={16} />
            </Link>
            {dash && (
              <div className="flex items-center gap-4 mt-6 text-white/90 text-sm">
                <span className="flex items-center gap-1.5"><Flame size={15} style={{ color: '#FFD98E' }} /> {dash.streak.currentStreak}-day streak</span>
                <span className="flex items-center gap-1.5"><Zap size={15} style={{ color: '#FFD98E' }} /> Best {progress?.bestWpm ?? 0} WPM</span>
              </div>
            )}
          </div>
        </section>

        {/* ── Quick statistics ─────────────────────────────────────────── */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Best WPM" value={progress ? (progress.bestWpm ?? '—') : '—'} subtext={progress?.totalSessions ? undefined : 'No tests yet'} icon={Zap} tone="indigo" />
          <StatCard label="Average WPM" value={progress ? Math.round(progress.avgWpm) : '—'} subtext={progress?.totalSessions ? undefined : 'No tests yet'} icon={LineChartIcon} tone="violet" />
          <StatCard label="Accuracy" value={progress?.totalSessions ? `${Math.round(progress.avgAccuracy)}%` : '—'} subtext={progress?.totalSessions ? undefined : 'No tests yet'} icon={Target} tone="green" />
          <StatCard label="Tests Completed" value={progress ? progress.totalSessions : '—'} subtext={progress?.totalSessions ? undefined : 'No tests yet'} icon={FileText} tone="amber" />
        </section>

        {/* ── Performance chart ────────────────────────────────────────── */}
        <section className="card p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
            <div>
              <h2 className="text-lg font-bold">Your Typing Performance</h2>
              <p className="text-sm text-secondary">Track how your speed and accuracy are improving.</p>
            </div>
            <div className="inline-flex rounded-full p-1 gap-1 tt-diff-group" role="group" aria-label="Chart metric">
              <button
                type="button"
                onClick={() => setChartMode('wpm')}
                aria-pressed={chartMode === 'wpm'}
                className={`tt-diff-pill${chartMode === 'wpm' ? ' tt-diff-pill-active' : ''}`}
              >
                WPM
              </button>
              <button
                type="button"
                onClick={() => setChartMode('accuracy')}
                aria-pressed={chartMode === 'accuracy'}
                className={`tt-diff-pill${chartMode === 'accuracy' ? ' tt-diff-pill-active' : ''}`}
              >
                Accuracy
              </button>
            </div>
          </div>
          <div className="mt-3">
            {chartMode === 'wpm'
              ? <WpmChart data={trendData} />
              : <AccuracyChart data={trendData} />}
          </div>
        </section>

        {/* ── Continue learning + Quick actions ────────────────────────── */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Continue Learning */}
          <div className="card p-5 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(67, 97, 238, 0.12)', color: '#4361ee' }}>
                <BookOpen size={16} />
              </div>
              <h2 className="font-bold">Continue Learning</h2>
            </div>
            {nextLesson ? (
              <>
                <p className="font-semibold">{nextLesson.title}</p>
                <p className="text-xs text-secondary mt-0.5 mb-3">Progress</p>
                <div className="h-2 rounded-full overflow-hidden mb-1.5" style={{ backgroundColor: 'var(--color-border)' }}>
                  <div className="h-full rounded-full" style={{ width: `${nextLessonPct}%`, background: 'linear-gradient(90deg, #4361EE, #8B5CF6)' }} />
                </div>
                <span className="text-xs font-semibold mb-1" style={{ color: 'var(--color-accent-text)' }}>{nextLessonPct}%</span>
                <p className="text-xs text-secondary mt-2">Next: Letter combinations &amp; common words</p>
                <Link to={`/lessons/${nextLesson._id}`} className="btn btn-primary btn-sm mt-auto self-start px-4 py-2 mt-3">
                  Continue <ArrowRight size={14} />
                </Link>
              </>
            ) : (
              <>
                <p className="text-sm text-secondary">Start your first lesson</p>
                <Link to="/lessons" className="btn btn-primary btn-sm mt-3 self-start px-4 py-2">
                  Open Lessons <ArrowRight size={14} />
                </Link>
              </>
            )}
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map(({ icon: Icon, title, description, cta, to, tone }) => (
              <div key={title} className="card p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={tone}>
                  <Icon size={17} />
                </div>
                <div className="min-w-0 flex-1">
                  <b className="block text-sm truncate">{title}</b>
                  <span className="text-xs text-secondary truncate block">{description}</span>
                </div>
                <Link to={to} className="btn btn-ghost btn-sm px-3 py-1.5 whitespace-nowrap border border-[var(--color-border)]">
                  {cta} <ArrowRight size={13} />
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* ── Achievements + Recent tests ──────────────────────────────── */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Achievements */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(245, 158, 11, 0.18)', color: '#d97706' }}>
                  <Trophy size={16} />
                </div>
                <h2 className="font-bold">Achievements</h2>
              </div>
              <Link to="/progress/achievements" className="text-xs font-bold" style={{ color: 'var(--color-accent-text)' }}>View All →</Link>
            </div>
            {unlockedAchievements.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {unlockedAchievements.slice(0, 3).map((a) => (
                  <li key={a._id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--color-page)] transition-colors">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(245, 158, 11, 0.16)', color: '#d97706' }}>
                      <Award size={16} />
                    </div>
                    <div className="min-w-0">
                      <b className="block text-sm truncate">{a.name}</b>
                      <span className="text-xs text-secondary truncate block">{a.description}</span>
                    </div>
                    <span className="ml-auto text-[0.625rem] px-2 py-0.5 rounded-full bg-[var(--color-border)] text-secondary whitespace-nowrap">+{a.xpReward} XP</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-secondary flex items-center gap-2 py-4">
                <Lightbulb size={15} style={{ color: '#d97706' }} />
                No achievements yet — complete your first test to get started.
              </p>
            )}
          </div>

          {/* Recent tests */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(67, 97, 238, 0.12)', color: '#4361ee' }}>
                  <FileText size={16} />
                </div>
                <h2 className="font-bold">Recent Tests</h2>
              </div>
              <Link to="/analytics" className="text-xs font-bold" style={{ color: 'var(--color-accent-text)' }}>View All →</Link>
            </div>
            {recent.length > 0 ? (
              <ul className="flex flex-col divide-y" style={{ borderColor: 'var(--color-border)' }}>
                {recent.map((s) => (
                  <li key={s._id} className="flex items-center justify-between py-2.5 text-sm first:pt-0 last:pb-0">
                    <span className="text-secondary w-20 shrink-0">{formatDay(s.createdAt)}</span>
                    <b className="tabular-nums">{s.wpm} WPM</b>
                    <span className="tabular-nums" style={{ color: 'var(--color-correct)' }}>{Math.round(s.accuracy)}%</span>
                    <span className="text-secondary tabular-nums hidden xs:inline sm:inline">{formatDuration(s.durationSeconds)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-4 text-center">
                <p className="text-sm text-secondary">You haven&apos;t completed a typing test yet.</p>
                <Link to="/test" className="btn btn-primary btn-sm mt-3 px-4 py-2">
                  Start Your First Test <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>
    </PageWrapper>
  );
}
