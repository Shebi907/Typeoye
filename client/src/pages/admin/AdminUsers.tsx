import React, { useCallback, useEffect, useState } from 'react';
import { Search, Eye, ShieldCheck, ShieldOff } from 'lucide-react';
import { listUsers, getUser, setUserRole } from '../../services/admin.service';
import type { AdminUser } from '../../types';
import {
  AdminPage,
  Badge,
  FlashMessages,
  LoadingRow,
  EmptyState,
  Modal,
  RoleBadge,
  useConfirm,
} from '../../components/admin/ui';

export default function AdminUsers() {
  const [rows, setRows] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [detail, setDetail] = useState<AdminUser | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async (opts?: { search: string; role: string }) => {
    setLoading(true);
    try {
      const { users } = await listUsers(opts ?? { search, role: roleFilter });
      setRows(users);
    } catch {
      setFlash({ type: 'error', text: 'Failed to load users.' });
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 300);
    return () => clearTimeout(t);
  }, [search, roleFilter, load]);

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    const cached = rows.find((r) => r._id === id);
    setDetail({ ...(cached ?? ({ _id: id, stats: { sessions: 0, bestWpm: 0, avgAccuracy: 0 } } as AdminUser)) });
    try {
      const { user } = await getUser(id);
      setDetail(user);
    } catch {
      setFlash({ type: 'error', text: 'Failed to load user details.' });
    } finally {
      setDetailLoading(false);
    }
  };

  const toggleRole = async (row: AdminUser) => {
    const promote = row.role !== 'admin';
    setBusy(true);
    try {
      await setUserRole(row._id, promote ? 'admin' : 'user');
      await load();
      setFlash({
        type: 'success',
        text: promote
          ? `${row.username} is now an admin.`
          : `${row.username} is no longer an admin (they keep full user access).`,
      });
    } catch (err: any) {
      setFlash({ type: 'error', text: err?.response?.data?.error ?? 'Failed to update role.' });
    } finally {
      setBusy(false);
    }
  };

  const { confirm, dialog } = useConfirm((row: AdminUser) => toggleRole(row), busy);

  return (
    <AdminPage title="Users" description="Registered accounts and their stats. Password hashes are never exposed.">
      <FlashMessages
        success={flash?.type === 'success' ? flash.text : null}
        error={flash?.type === 'error' ? flash.text : null}
        onDismiss={() => setFlash(null)}
      />

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[12.5rem] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by username or email…"
            className="w-full rounded-lg border pl-9 pr-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-[var(--color-accent)]/30"
            style={{ backgroundColor: 'var(--color-page)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm outline-none"
          style={{ backgroundColor: 'var(--color-page)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
        >
          <option value="">All roles</option>
          <option value="admin">Admins</option>
          <option value="user">Users</option>
        </select>
      </div>

      {loading ? (
        <LoadingRow />
      ) : rows.length === 0 ? (
        <div className="card p-4"><EmptyState message="No users match your filters." /></div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: 'var(--color-text-muted)' }}>
                <th className="text-left font-semibold px-4 py-3">User</th>
                <th className="text-left font-semibold px-4 py-3">Joined</th>
                <th className="text-left font-semibold px-4 py-3">Role</th>
                <th className="text-left font-semibold px-4 py-3">Sessions</th>
                <th className="text-left font-semibold px-4 py-3">Best WPM</th>
                <th className="text-left font-semibold px-4 py-3">Avg Acc</th>
                <th className="text-right font-semibold px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row._id} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-4 py-3">
                    <div className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{row.username}</div>
                    <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{row.email}</div>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>
                    {new Date(row.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3"><RoleBadge role={row.role} /></td>
                  <td className="px-4 py-3">{row.stats.sessions}</td>
                  <td className="px-4 py-3">{row.stats.bestWpm}</td>
                  <td className="px-4 py-3">{row.stats.avgAccuracy}%</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => void openDetail(row._id)}
                        className="p-2 rounded-lg hover:bg-[var(--color-border)]"
                        title="View details"
                      >
                        <Eye size={16} className="text-secondary" />
                      </button>
                      {row.role === 'admin' ? (
                        <button
                          onClick={() => confirm(row, `This removes admin access for "${row.username}". They will still have full user access.`, 'Remove admin?')}
                          disabled={busy}
                          className="p-2 rounded-lg hover:bg-[var(--color-border)]"
                          title="Remove admin"
                          data-testid={`demote-${row.username}`}
                        >
                          <ShieldOff size={16} className="text-[var(--color-error)]" />
                        </button>
                      ) : (
                        <button
                          onClick={() => confirm(row, `"${row.username}" will immediately gain full admin access to the panel.`, 'Make admin?')}
                          disabled={busy}
                          className="p-2 rounded-lg hover:bg-[var(--color-border)]"
                          title="Make admin"
                          data-testid={`promote-${row.username}`}
                        >
                          <ShieldCheck size={16} style={{ color: 'var(--color-accent-text)' }} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detail && (
        <Modal title={detail.username} onClose={() => setDetail(null)}>
          {detailLoading ? (
            <LoadingRow />
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Email</div>
                  <div className="mt-0.5">{detail.email}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Joined</div>
                  <div className="mt-0.5">{new Date(detail.createdAt).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Role</div>
                  <div className="mt-1"><RoleBadge role={detail.role} /></div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Status</div>
                  <div className="mt-1"><Badge active label="Active" /></div>
                </div>
              </div>
              <hr style={{ borderColor: 'var(--color-border)' }} />
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--color-page)' }}>
                  <div className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{detail.stats.sessions}</div>
                  <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Sessions</div>
                </div>
                <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--color-page)' }}>
                  <div className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{detail.stats.bestWpm}</div>
                  <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Best WPM</div>
                </div>
                <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--color-page)' }}>
                  <div className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{detail.stats.avgAccuracy}%</div>
                  <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Avg Accuracy</div>
                </div>
              </div>
            </div>
          )}
        </Modal>
      )}

      {dialog}
    </AdminPage>
  );
}