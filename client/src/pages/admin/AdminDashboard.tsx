import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Activity, BookOpen, FileText, Award, Database, Gauge } from 'lucide-react';
import { getAdminStats } from '../../services/admin.service';
import type { AdminStats } from '../../types';
import { AdminPage, LoadingRow } from '../../components/admin/ui';

const statCards: { key: keyof AdminStats; label: string; icon: React.ElementType; to: string }[] = [
  { key: 'totalUsers', label: 'Users', icon: Users, to: '/admin/users' },
  { key: 'totalSessions', label: 'Typing sessions', icon: Activity, to: '/admin/users' },
  { key: 'totalLessons', label: 'Lessons', icon: BookOpen, to: '/admin/lessons' },
  { key: 'totalExercises', label: 'Exercises', icon: FileText, to: '/admin/lessons' },
  { key: 'totalAchievements', label: 'Achievements', icon: Award, to: '/admin/achievements' },
  { key: 'totalAdmins', label: 'Admins', icon: ShieldIcon, to: '/admin/users' },
];

function ShieldIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .catch(() => setError('Failed to load stats'));
  }, []);

  return (
    <AdminPage title="Overview" description="Platform health at a glance.">
      {error && <p className="text-sm text-[var(--color-error)] mb-4">{error}</p>}
      {!stats ? (
        <LoadingRow />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {statCards.map(({ key, label, icon: Icon, to }) => (
              <Link
                key={key}
                to={to}
                className="card card-hover p-5 flex items-center gap-4"
              >
                <div
                  className="w-11 h-11 rounded-xl grid place-items-center shrink-0"
                  style={{ backgroundColor: 'var(--color-accent-light)' }}
                >
                  <Icon size={20} style={{ color: 'var(--color-accent-text)' }} />
                </div>
                <div>
                  <div className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    {stats[key]}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {label}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            <Link to="/admin/content" className="card card-hover p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl grid place-items-center shrink-0" style={{ backgroundColor: 'var(--color-accent-light)' }}>
                <Database size={20} style={{ color: 'var(--color-accent-text)' }} />
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  {stats.totalTestParagraphs + stats.totalPracticeParagraphs + stats.totalWords + stats.totalSentences}
                </div>
                <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Content pool items (paragraphs, words, sentences)
                </div>
              </div>
            </Link>
            <div className="card p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl grid place-items-center shrink-0" style={{ backgroundColor: 'var(--color-accent-light)' }}>
                <Gauge size={20} style={{ color: 'var(--color-accent-text)' }} />
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  {stats.avgWpm}
                </div>
                <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Average WPM across all saved results
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </AdminPage>
  );
}