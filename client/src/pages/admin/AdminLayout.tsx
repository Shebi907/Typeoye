import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, BookOpen, Layers, Trophy, Settings, ShieldAlert, FileText } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const tabs = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/lessons', label: 'Lessons', icon: BookOpen },
  { to: '/admin/content', label: 'Content', icon: Layers },
  { to: '/admin/certificate-paragraphs', label: 'Cert Paragraphs', icon: FileText },
  { to: '/admin/achievements', label: 'Achievements', icon: Trophy },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout() {
  const { user } = useAuthStore();

  if (user && user.role !== 'admin') {
    return (
      <div className="min-h-[70vh] grid place-items-center p-6">
        <div className="w-full max-w-md card p-8 text-center">
          <div
            className="w-12 h-12 rounded-2xl grid place-items-center mx-auto"
            style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
          >
            <ShieldAlert size={22} style={{ color: 'var(--color-error)' }} />
          </div>
          <h2 className="text-xl font-bold mt-4" style={{ color: 'var(--color-text-primary)' }}>
            403 — Admin access required
          </h2>
          <p className="text-sm text-secondary mt-2 leading-relaxed">
            You're signed in, but this panel is restricted to admin accounts. If you
            believe this is a mistake, contact an administrator.
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-2 mb-6">
        <div
          className="w-8 h-8 rounded-lg grid place-items-center"
          style={{ backgroundColor: 'var(--color-accent)' }}
        >
          <LayoutDashboard size={16} color="white" />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Admin Panel
          </h1>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Signed in as {user.username}
          </p>
        </div>
      </div>

      <nav className="flex flex-wrap gap-1 mb-8 pb-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              [
                'flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition',
                isActive
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-border)] hover:text-[var(--color-text-primary)]',
              ].join(' ')
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  );
}