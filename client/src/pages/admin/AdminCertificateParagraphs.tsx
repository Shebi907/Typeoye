import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, Search } from 'lucide-react';
import {
  listCertificateParagraphs,
  createCertificateParagraph,
  updateCertificateParagraph,
  deleteCertificateParagraph,
  type AdminCertificateParagraph,
  type CertificateParagraphInput,
} from '../../services/admin.service';
import {
  AdminPage,
  Badge,
  Field,
  FlashMessages,
  LoadingRow,
  EmptyState,
  Modal,
  inputCls,
  inputStyle,
  useConfirm,
} from '../../components/admin/ui';

const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
type Difficulty = typeof DIFFICULTIES[number];

export default function AdminCertificateParagraphs() {
  const [rows, setRows] = useState<AdminCertificateParagraph[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty | ''>('');
  const [flash, setFlash] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [modal, setModal] = useState<{ open: boolean; editing: AdminCertificateParagraph | null; content: string; difficulty: Difficulty; isActive: boolean; error: string | null }>({
    open: false,
    editing: null,
    content: '',
    difficulty: 'easy',
    isActive: true,
    error: null,
  });

  const load = async () => {
    setLoading(true);
    try {
      const { items } = await listCertificateParagraphs({ search: search.trim() || undefined, difficulty: difficulty || undefined });
      setRows(items);
    } catch (err: any) {
      setFlash({ type: 'error', text: err?.response?.data?.error ?? 'Failed to load certificate paragraphs.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => void load(), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, difficulty]);

  const openNew = () =>
    setModal({ open: true, editing: null, content: '', difficulty: 'easy', isActive: true, error: null });

  const openEdit = (p: AdminCertificateParagraph) =>
    setModal({ open: true, editing: p, content: p.content, difficulty: p.difficulty, isActive: p.isActive, error: null });

  const save = async () => {
    if (modal.content.trim().length < 10) {
      setModal((m) => ({ ...m, error: 'Paragraph must be at least 10 characters.' }));
      return;
    }
    const payload: CertificateParagraphInput = {
      content: modal.content.trim(),
      difficulty: modal.difficulty,
      isActive: modal.isActive,
    };
    setBusy(true);
    try {
      if (modal.editing) {
        await updateCertificateParagraph(modal.editing._id, payload);
        setFlash({ type: 'success', text: 'Certificate paragraph saved.' });
      } else {
        await createCertificateParagraph(payload);
        setFlash({ type: 'success', text: 'Certificate paragraph created.' });
      }
      setModal((m) => ({ ...m, open: false }));
      void load();
    } catch (err: any) {
      setModal((m) => ({ ...m, error: err?.response?.data?.error ?? 'Failed to save certificate paragraph.' }));
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (p: AdminCertificateParagraph) => {
    setBusy(true);
    try {
      await updateCertificateParagraph(p._id, { isActive: !p.isActive });
      setFlash({ type: 'success', text: p.isActive ? 'Paragraph deactivated.' : 'Paragraph activated.' });
      void load();
    } catch (err: any) {
      setFlash({ type: 'error', text: err?.response?.data?.error ?? 'Failed to update paragraph.' });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (p: AdminCertificateParagraph) => {
    setBusy(true);
    try {
      await deleteCertificateParagraph(p._id);
      setFlash({ type: 'success', text: 'Certificate paragraph deleted.' });
      void load();
    } catch (err: any) {
      setFlash({ type: 'error', text: err?.response?.data?.error ?? 'Failed to delete paragraph.' });
    } finally {
      setBusy(false);
    }
  };

  const { confirm, dialog } = useConfirm(
    (p: AdminCertificateParagraph) => remove(p),
    busy
  );

  return (
    <AdminPage title="Certificate Paragraphs" description="Non-repeating content pool for the Certificate Typing Test.">
      <FlashMessages
        success={flash?.type === 'success' ? flash.text : null}
        error={flash?.type === 'error' ? flash.text : null}
        onDismiss={() => setFlash(null)}
      />

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search paragraph text..."
            className={`${inputCls} pl-9`}
            style={inputStyle}
          />
        </div>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value === '' ? '' : (e.target.value as Difficulty))}
          className={`${inputCls} w-auto`}
          style={inputStyle}
        >
          <option value="">All difficulties</option>
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <button onClick={openNew} className="btn btn-primary px-4 py-2">
          <Plus size={16} /> New Paragraph
        </button>
      </div>

      {loading ? (
        <LoadingRow />
      ) : rows.length === 0 ? (
        <div className="card p-4"><EmptyState message="No certificate paragraphs match." /></div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: 'var(--color-text-muted)' }}>
                <th className="text-left font-semibold px-4 py-3">Paragraph</th>
                <th className="text-left font-semibold px-4 py-3">Difficulty</th>
                <th className="text-left font-semibold px-4 py-3">State</th>
                <th className="text-right font-semibold px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p._id} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-4 py-3 max-w-[480px]">
                    <div className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
                      {p.content}
                    </div>
                  </td>
                  <td className="px-4 py-3 capitalize" style={{ color: 'var(--color-text-secondary)' }}>{p.difficulty}</td>
                  <td className="px-4 py-3"><Badge active={p.isActive} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => void toggleActive(p)}
                        disabled={busy}
                        className="p-1.5 rounded-lg hover:bg-[var(--color-border)] text-secondary"
                        title={p.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {p.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-[var(--color-border)] text-secondary" title="Edit">
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => confirm(p, 'Delete this paragraph? Paragraphs used in completed tests or saved history cannot be deleted.', 'Delete paragraph?')}
                        disabled={busy}
                        className="p-1.5 rounded-lg hover:bg-[var(--color-border)] text-[var(--color-error)]"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal.open && (
        <Modal title={modal.editing ? 'Edit certificate paragraph' : 'New certificate paragraph'} onClose={() => setModal((m) => ({ ...m, open: false }))}>
          {modal.error && (
            <div className="mb-4 rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-error)' }}>
              {modal.error}
            </div>
          )}
          <div className="grid gap-4">
            <Field label="Paragraph text" hint="10–5000 characters. Content must be original — no lorem ipsum or duplicated text.">
              <textarea
                rows={5}
                className={inputCls}
                style={inputStyle}
                value={modal.content}
                onChange={(e) => setModal((m) => ({ ...m, content: e.target.value }))}
              />
            </Field>
            <Field label="Difficulty">
              <select
                className={inputCls}
                style={inputStyle}
                value={modal.difficulty}
                onChange={(e) => setModal((m) => ({ ...m, difficulty: e.target.value as Difficulty }))}
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </Field>
            <Field label="State">
              <select
                className={inputCls}
                style={inputStyle}
                value={modal.isActive ? 'active' : 'inactive'}
                onChange={(e) => setModal((m) => ({ ...m, isActive: e.target.value === 'active' }))}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </Field>
          </div>
          <div className="flex items-center justify-end gap-3 mt-6">
            <button onClick={() => setModal((m) => ({ ...m, open: false }))} className="btn btn-ghost px-4 py-2">Cancel</button>
            <button onClick={() => void save()} className="btn btn-primary px-4 py-2" disabled={busy}>Save</button>
          </div>
        </Modal>
      )}

      {dialog}
    </AdminPage>
  );
}