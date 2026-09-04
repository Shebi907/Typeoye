import React, { useState } from 'react';

export function AdminPage({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {title}
        </h1>
        {description && (
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            {description}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

export function FlashMessages({
  success,
  error,
  onDismiss,
}: {
  success?: string | null;
  error?: string | null;
  onDismiss?: () => void;
}) {
  if (!success && !error) return null;
  const tone = error ? 'var(--color-error)' : '#16a34a';
  const bg = error ? 'rgba(239, 68, 68, 0.08)' : 'rgba(22, 163, 74, 0.08)';
  return (
    <div
      className="flex items-center justify-between gap-3 rounded-xl px-4 py-2.5 mb-4 text-sm font-medium"
      style={{ backgroundColor: bg, color: tone }}
      role="status"
    >
      <span>{error ?? success}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="opacity-70 hover:opacity-100" aria-label="Dismiss">
          <span aria-hidden="true">✕</span>
        </button>
      )}
    </div>
  );
}

export function Badge({ active, label }: { active: boolean; label?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{
        backgroundColor: active ? 'rgba(22, 163, 74, 0.12)' : 'rgba(107, 114, 128, 0.14)',
        color: active ? 'var(--color-correct)' : 'var(--color-text-muted)',
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: active ? '#16a34a' : 'var(--color-text-muted)' }} />
      {label ?? (active ? 'Active' : 'Inactive')}
    </span>
  );
}

export function RoleBadge({ role }: { role: 'user' | 'admin' }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{
        backgroundColor: role === 'admin' ? 'var(--color-accent-light)' : 'rgba(107, 114, 128, 0.14)',
        color: role === 'admin' ? 'var(--color-accent)' : 'var(--color-text-muted)',
      }}
    >
      {role === 'admin' ? 'Admin' : 'User'}
    </span>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
        {label}
      </span>
      {children}
      {hint && (
        <span className="block text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
          {hint}
        </span>
      )}
    </label>
  );
}

export const inputCls =
  'w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-[var(--color-accent)]/30';
export const inputStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-page)',
  borderColor: 'var(--color-border)',
  color: 'var(--color-text-primary)',
};

export function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-8 overflow-y-auto bg-black/40">
      <div className={`w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} card p-6`} role="dialog" aria-modal="true">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--color-border)] text-secondary"
            aria-label="Close"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  onCancel,
  onConfirm,
  busy,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
  busy?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="w-full max-w-sm card p-6" role="dialog" aria-modal="true">
        <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {title}
        </h3>
        <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          {message}
        </p>
        <div className="flex items-center justify-end gap-3 mt-6">
          <button onClick={onCancel} className="btn btn-ghost px-4 py-2" disabled={busy} data-testid="confirm-cancel">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            data-testid="confirm-yes"
            className="btn px-4 py-2 text-white border-0"
            style={{ backgroundColor: 'var(--color-error)' }}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function useConfirm<T = unknown>(onConfirm: (arg: T) => void | Promise<void>, busy = false) {
  const [state, setState] = useState<{ message: string; title: string; arg: T } | null>(null);
  const dialog = (
    <ConfirmDialog
      open={state !== null}
      title={state?.title ?? ''}
      message={state?.message ?? ''}
      onCancel={() => setState(null)}
      busy={busy}
      onConfirm={() => {
        void Promise.resolve(state ? onConfirm(state.arg) : undefined).finally(() => setState(null));
      }}
    />
  );
  return { confirm: (arg: T, message: string, title = 'Are you sure?') => setState({ arg, message, title }), dialog };
}

export function LoadingRow() {
  return (
    <div className="py-10 text-center text-sm text-secondary animate-pulse">Loading…</div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-10 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
      {message}
    </div>
  );
}