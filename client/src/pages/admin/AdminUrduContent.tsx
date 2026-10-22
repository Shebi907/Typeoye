import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, Search, ChevronUp, ChevronDown } from 'lucide-react';
import {
  listUrduTestParagraphs,
  createUrduTestParagraph,
  updateUrduTestParagraph,
  deleteUrduTestParagraph,
  listUrduPracticeItems,
  createUrduPracticeItem,
  updateUrduPracticeItem,
  deleteUrduPracticeItem,
  moveUrduPracticeItem,
  type UrduTestParagraphInput,
  type UrduPracticeItemInput,
} from '../../services/admin.service';
import type {
  AdminUrduPracticeItem,
  AdminUrduTestParagraph,
  UrduContentCategory,
  UrduContentDifficulty,
  UrduContentDuration,
} from '../../types';
import {
  AdminPage,
  Badge,
  EmptyState,
  Field,
  FlashMessages,
  LoadingRow,
  Modal,
  inputCls,
  inputStyle,
  useConfirm,
} from '../../components/admin/ui';

const DIFFICULTIES: readonly UrduContentDifficulty[] = ['easy', 'medium', 'hard'];
const DURATIONS: readonly UrduContentDuration[] = [1, 2, 5];
const CATEGORIES: readonly UrduContentCategory[] = [
  'characters',
  'combinations',
  'words',
  'sentences',
  'paragraphs',
];

const URDU_FONT = "'Noto Nastaliq Urdu', 'Noto Naskh Arabic', serif";
const urduStyle: React.CSSProperties = { ...inputStyle, fontFamily: URDU_FONT, textAlign: 'right' };
const capitalize = (v: string) => v.charAt(0).toUpperCase() + v.slice(1);

type Flash = { type: 'success' | 'error'; text: string } | null;

// ── Urdu test passages ───────────────────────────────────────────────────────

function UrduTestManager() {
  const [rows, setRows] = useState<AdminUrduTestParagraph[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState<UrduContentDifficulty | ''>('');
  const [duration, setDuration] = useState<UrduContentDuration | ''>('');
  const [flash, setFlash] = useState<Flash>(null);
  const [preview, setPreview] = useState<AdminUrduTestParagraph | null>(null);
  const [modal, setModal] = useState<{
    open: boolean;
    editing: AdminUrduTestParagraph | null;
    content: string;
    difficulty: UrduContentDifficulty;
    duration: UrduContentDuration;
    isActive: boolean;
    error: string | null;
  }>({ open: false, editing: null, content: '', difficulty: 'easy', duration: 1, isActive: true, error: null });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { items } = await listUrduTestParagraphs({
        search: search.trim() || undefined,
        difficulty: difficulty || undefined,
        duration: duration || undefined,
      });
      setRows(items);
    } catch (err: any) {
      setFlash({ type: 'error', text: err?.response?.data?.error ?? 'Failed to load Urdu test passages.' });
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, difficulty, duration]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 300);
    return () => clearTimeout(t);
  }, [load]);

  const openNew = () =>
    setModal({ open: true, editing: null, content: '', difficulty: 'easy', duration: 1, isActive: true, error: null });
  const openEdit = (p: AdminUrduTestParagraph) =>
    setModal({ open: true, editing: p, content: p.content, difficulty: p.difficulty, duration: p.duration, isActive: p.isActive, error: null });

  const save = async () => {
    if (modal.content.trim().length < 5) {
      setModal((m) => ({ ...m, error: 'Passage must be at least 5 characters.' }));
      return;
    }
    if (!/[\u0600-\u06FF]/.test(modal.content)) {
      setModal((m) => ({ ...m, error: 'Passage must contain Urdu (RTL) text.' }));
      return;
    }
    const payload: UrduTestParagraphInput = {
      content: modal.content.trim(),
      difficulty: modal.difficulty,
      duration: modal.duration,
      isActive: modal.isActive,
    };
    setBusy(true);
    try {
      if (modal.editing) {
        await updateUrduTestParagraph(modal.editing._id, payload);
        setFlash({ type: 'success', text: 'Urdu test passage saved.' });
      } else {
        await createUrduTestParagraph(payload);
        setFlash({ type: 'success', text: 'Urdu test passage created.' });
      }
      setModal((m) => ({ ...m, open: false }));
      void load();
    } catch (err: any) {
      setModal((m) => ({ ...m, error: err?.response?.data?.error ?? 'Failed to save Urdu test passage.' }));
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (p: AdminUrduTestParagraph) => {
    setBusy(true);
    try {
      await updateUrduTestParagraph(p._id, { isActive: !p.isActive });
      setFlash({ type: 'success', text: p.isActive ? 'Passage unpublished.' : 'Passage published.' });
      void load();
    } catch (err: any) {
      setFlash({ type: 'error', text: err?.response?.data?.error ?? 'Failed to update passage.' });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (p: AdminUrduTestParagraph) => {
    setBusy(true);
    try {
      await deleteUrduTestParagraph(p._id);
      setFlash({ type: 'success', text: 'Urdu test passage deleted.' });
      void load();
    } catch (err: any) {
      setFlash({ type: 'error', text: err?.response?.data?.error ?? 'Failed to delete passage.' });
    } finally {
      setBusy(false);
    }
  };

  const { confirm, dialog } = useConfirm((p: AdminUrduTestParagraph) => remove(p), busy);

  return (
    <div className="card p-5">
      <FlashMessages success={flash?.type === 'success' ? flash.text : null} error={flash?.type === 'error' ? flash.text : null} onDismiss={() => setFlash(null)} />
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>Urdu Typing Test Passages</h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Published passages appear in the Urdu Typing Test for their difficulty and duration.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[13.75rem]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search passage text..." className={`${inputCls} pl-9`} style={inputStyle} />
        </div>
        <select className={`${inputCls} w-auto`} style={inputStyle} value={difficulty} onChange={(e) => setDifficulty(e.target.value === '' ? '' : (e.target.value as UrduContentDifficulty))} data-testid="urdu-test-filter-difficulty">
          <option value="">All difficulties</option>
          {DIFFICULTIES.map((d) => <option key={d} value={d}>{capitalize(d)}</option>)}
        </select>
        <select className={`${inputCls} w-auto`} style={inputStyle} value={duration} onChange={(e) => setDuration(e.target.value === '' ? '' : (Number(e.target.value) as UrduContentDuration))} data-testid="urdu-test-filter-duration">
          <option value="">All durations</option>
          {DURATIONS.map((d) => <option key={d} value={d}>{d} min</option>)}
        </select>
        <button onClick={openNew} className="btn btn-primary px-4 py-2" data-testid="urdu-test-new"><Plus size={16} /> New Passage</button>
      </div>

      {loading ? (
        <LoadingRow />
      ) : rows.length === 0 ? (
        <EmptyState message="No Urdu test passages yet — add one above." />
      ) : (
        <div className="rounded-xl overflow-x-auto" style={{ border: '1px solid var(--color-border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: 'var(--color-text-muted)', backgroundColor: 'var(--color-page)' }}>
                <th className="text-left font-semibold px-3 py-2">Passage</th>
                <th className="text-left font-semibold px-3 py-2">Difficulty</th>
                <th className="text-left font-semibold px-3 py-2">Duration</th>
                <th className="text-left font-semibold px-3 py-2">State</th>
                <th className="text-right font-semibold px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p._id} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-3 py-2 max-w-[26rem]">
                    <div dir="rtl" className="text-xs leading-loose line-clamp-2" style={{ color: 'var(--color-text-secondary)', fontFamily: URDU_FONT }}>{p.content}</div>
                  </td>
                  <td className="px-3 py-2 capitalize" style={{ color: 'var(--color-text-secondary)' }}>{p.difficulty}</td>
                  <td className="px-3 py-2" style={{ color: 'var(--color-text-secondary)' }}>{p.duration} min</td>
                  <td className="px-3 py-2"><Badge active={p.isActive} /></td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setPreview(p)} className="p-1.5 rounded-lg hover:bg-[var(--color-border)] text-secondary" title="Preview"><Eye size={14} /></button>
                      <button onClick={() => void toggleActive(p)} disabled={busy} className="p-1.5 rounded-lg hover:bg-[var(--color-border)] text-secondary" title={p.isActive ? 'Unpublish' : 'Publish'}>{p.isActive ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-[var(--color-border)] text-secondary" title="Edit"><Pencil size={14} /></button>
                      <button onClick={() => confirm(p, 'Delete this Urdu test passage? This cannot be undone.')} disabled={busy} className="p-1.5 rounded-lg hover:bg-[var(--color-border)] text-[var(--color-error)]" title="Delete"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal.open && (
        <Modal title={modal.editing ? 'Edit Urdu test passage' : 'New Urdu test passage'} onClose={() => setModal((m) => ({ ...m, open: false }))} wide>
          {modal.error && (
            <div className="mb-4 rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-error)' }}>{modal.error}</div>
          )}
          <div className="grid gap-4">
            <Field label="Passage text (Urdu)" hint="5–5000 characters. Written right-to-left.">
              <textarea rows={5} dir="rtl" data-testid="urdu-test-content" className={inputCls} style={urduStyle} value={modal.content} onChange={(e) => setModal((m) => ({ ...m, content: e.target.value }))} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Difficulty">
                <select className={inputCls} style={inputStyle} data-testid="urdu-test-difficulty" value={modal.difficulty} onChange={(e) => setModal((m) => ({ ...m, difficulty: e.target.value as UrduContentDifficulty }))}>
                  {DIFFICULTIES.map((d) => <option key={d} value={d}>{capitalize(d)}</option>)}
                </select>
              </Field>
              <Field label="Duration">
                <select className={inputCls} style={inputStyle} data-testid="urdu-test-duration" value={modal.duration} onChange={(e) => setModal((m) => ({ ...m, duration: Number(e.target.value) as UrduContentDuration }))}>
                  {DURATIONS.map((d) => <option key={d} value={d}>{d} min</option>)}
                </select>
              </Field>
            </div>
            <Field label="State">
              <select className={inputCls} style={inputStyle} value={modal.isActive ? 'active' : 'inactive'} onChange={(e) => setModal((m) => ({ ...m, isActive: e.target.value === 'active' }))}>
                <option value="active">Published</option>
                <option value="inactive">Draft</option>
              </select>
            </Field>
          </div>
          <div className="flex items-center justify-end gap-3 mt-6">
            <button onClick={() => setModal((m) => ({ ...m, open: false }))} className="btn btn-ghost px-4 py-2">Cancel</button>
            <button data-testid="urdu-test-save" onClick={() => void save()} className="btn btn-primary px-4 py-2" disabled={busy}>Save</button>
          </div>
        </Modal>
      )}

      {preview && (
        <Modal title="Passage preview" onClose={() => setPreview(null)} wide>
          <div className="mb-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full px-2.5 py-0.5" style={{ backgroundColor: 'var(--color-page)', color: 'var(--color-text-secondary)' }}>Difficulty: {capitalize(preview.difficulty)}</span>
            <span className="rounded-full px-2.5 py-0.5" style={{ backgroundColor: 'var(--color-page)', color: 'var(--color-text-secondary)' }}>Duration: {preview.duration} min</span>
            <Badge active={preview.isActive} />
          </div>
          <div dir="rtl" lang="ur" className="rounded-xl p-4 text-lg leading-[2.4]" style={{ backgroundColor: 'var(--color-page)', color: 'var(--color-text-primary)', fontFamily: URDU_FONT }}>{preview.content}</div>
        </Modal>
      )}

      {dialog}
    </div>
  );
}

// ── Urdu practice content ────────────────────────────────────────────────────

function UrduPracticeManager() {
  const [rows, setRows] = useState<AdminUrduPracticeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<UrduContentCategory | ''>('');
  const [difficulty, setDifficulty] = useState<UrduContentDifficulty | ''>('');
  const [flash, setFlash] = useState<Flash>(null);
  const [modal, setModal] = useState<{
    open: boolean;
    editing: AdminUrduPracticeItem | null;
    category: UrduContentCategory;
    difficulty: UrduContentDifficulty;
    text: string;
    isActive: boolean;
    error: string | null;
  }>({ open: false, editing: null, category: 'words', difficulty: 'easy', text: '', isActive: true, error: null });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { items } = await listUrduPracticeItems({
        search: search.trim() || undefined,
        category: category || undefined,
        difficulty: difficulty || undefined,
      });
      setRows(items);
    } catch (err: any) {
      setFlash({ type: 'error', text: err?.response?.data?.error ?? 'Failed to load Urdu practice content.' });
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category, difficulty]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 300);
    return () => clearTimeout(t);
  }, [load]);

  const openNew = () =>
    setModal({ open: true, editing: null, category: 'words', difficulty: 'easy', text: '', isActive: true, error: null });
  const openEdit = (p: AdminUrduPracticeItem) =>
    setModal({ open: true, editing: p, category: p.category, difficulty: p.difficulty, text: p.text, isActive: p.isActive, error: null });

  const save = async () => {
    if (!modal.text.trim()) {
      setModal((m) => ({ ...m, error: 'Content is required.' }));
      return;
    }
    if (!/[\u0600-\u06FF]/.test(modal.text)) {
      setModal((m) => ({ ...m, error: 'Content must contain Urdu (RTL) text.' }));
      return;
    }
    const payload: UrduPracticeItemInput = {
      category: modal.category,
      difficulty: modal.difficulty,
      text: modal.text.trim(),
      isActive: modal.isActive,
    };
    setBusy(true);
    try {
      if (modal.editing) {
        await updateUrduPracticeItem(modal.editing._id, payload);
        setFlash({ type: 'success', text: 'Urdu practice content saved.' });
      } else {
        await createUrduPracticeItem(payload);
        setFlash({ type: 'success', text: 'Urdu practice content created.' });
      }
      setModal((m) => ({ ...m, open: false }));
      void load();
    } catch (err: any) {
      setModal((m) => ({ ...m, error: err?.response?.data?.error ?? 'Failed to save Urdu practice content.' }));
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (p: AdminUrduPracticeItem) => {
    setBusy(true);
    try {
      await updateUrduPracticeItem(p._id, { isActive: !p.isActive });
      setFlash({ type: 'success', text: p.isActive ? 'Item unpublished.' : 'Item published.' });
      void load();
    } catch (err: any) {
      setFlash({ type: 'error', text: err?.response?.data?.error ?? 'Failed to update item.' });
    } finally {
      setBusy(false);
    }
  };

  const move = async (p: AdminUrduPracticeItem, direction: 'up' | 'down') => {
    setBusy(true);
    try {
      await moveUrduPracticeItem(p._id, direction);
      void load();
    } catch (err: any) {
      setFlash({ type: 'error', text: err?.response?.data?.error ?? 'Failed to reorder item.' });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (p: AdminUrduPracticeItem) => {
    setBusy(true);
    try {
      await deleteUrduPracticeItem(p._id);
      setFlash({ type: 'success', text: 'Urdu practice content deleted.' });
      void load();
    } catch (err: any) {
      setFlash({ type: 'error', text: err?.response?.data?.error ?? 'Failed to delete item.' });
    } finally {
      setBusy(false);
    }
  };

  const { confirm, dialog } = useConfirm((p: AdminUrduPracticeItem) => remove(p), busy);

  return (
    <div className="card p-5">
      <FlashMessages success={flash?.type === 'success' ? flash.text : null} error={flash?.type === 'error' ? flash.text : null} onDismiss={() => setFlash(null)} />
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>Urdu Practice Content</h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Published items appear in their Urdu Practice category. Custom Text is user-supplied, so it is not managed here.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[13.75rem]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search content..." className={`${inputCls} pl-9`} style={inputStyle} />
        </div>
        <select className={`${inputCls} w-auto`} style={inputStyle} value={category} onChange={(e) => setCategory(e.target.value === '' ? '' : (e.target.value as UrduContentCategory))} data-testid="urdu-practice-filter-category">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{capitalize(c)}</option>)}
        </select>
        <select className={`${inputCls} w-auto`} style={inputStyle} value={difficulty} onChange={(e) => setDifficulty(e.target.value === '' ? '' : (e.target.value as UrduContentDifficulty))} data-testid="urdu-practice-filter-difficulty">
          <option value="">All difficulties</option>
          {DIFFICULTIES.map((d) => <option key={d} value={d}>{capitalize(d)}</option>)}
        </select>
        <button onClick={openNew} className="btn btn-primary px-4 py-2" data-testid="urdu-practice-new"><Plus size={16} /> New Item</button>
      </div>

      {loading ? (
        <LoadingRow />
      ) : rows.length === 0 ? (
        <EmptyState message="No Urdu practice content yet — add one above." />
      ) : (
        <div className="rounded-xl overflow-x-auto" style={{ border: '1px solid var(--color-border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: 'var(--color-text-muted)', backgroundColor: 'var(--color-page)' }}>
                <th className="text-left font-semibold px-3 py-2">Content</th>
                <th className="text-left font-semibold px-3 py-2">Category</th>
                <th className="text-left font-semibold px-3 py-2">Difficulty</th>
                <th className="text-left font-semibold px-3 py-2">Order</th>
                <th className="text-left font-semibold px-3 py-2">State</th>
                <th className="text-right font-semibold px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p._id} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-3 py-2 max-w-[22rem]">
                    <div dir="rtl" className="text-sm leading-loose line-clamp-2" style={{ color: 'var(--color-text-primary)', fontFamily: URDU_FONT }}>{p.text}</div>
                  </td>
                  <td className="px-3 py-2 capitalize" style={{ color: 'var(--color-text-secondary)' }}>{p.category}</td>
                  <td className="px-3 py-2 capitalize" style={{ color: 'var(--color-text-secondary)' }}>{p.difficulty}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <button onClick={() => void move(p, 'up')} disabled={busy} className="p-1 rounded hover:bg-[var(--color-border)] text-secondary" title="Move up"><ChevronUp size={14} /></button>
                      <button onClick={() => void move(p, 'down')} disabled={busy} className="p-1 rounded hover:bg-[var(--color-border)] text-secondary" title="Move down"><ChevronDown size={14} /></button>
                    </div>
                  </td>
                  <td className="px-3 py-2"><Badge active={p.isActive} /></td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => void toggleActive(p)} disabled={busy} className="p-1.5 rounded-lg hover:bg-[var(--color-border)] text-secondary" title={p.isActive ? 'Unpublish' : 'Publish'}>{p.isActive ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-[var(--color-border)] text-secondary" title="Edit"><Pencil size={14} /></button>
                      <button onClick={() => confirm(p, 'Delete this Urdu practice item? This cannot be undone.')} disabled={busy} className="p-1.5 rounded-lg hover:bg-[var(--color-border)] text-[var(--color-error)]" title="Delete"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal.open && (
        <Modal title={modal.editing ? 'Edit Urdu practice content' : 'New Urdu practice content'} onClose={() => setModal((m) => ({ ...m, open: false }))}>
          {modal.error && (
            <div className="mb-4 rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-error)' }}>{modal.error}</div>
          )}
          <div className="grid gap-4">
            <Field label="Category">
              <select className={inputCls} style={inputStyle} data-testid="urdu-practice-category" value={modal.category} onChange={(e) => setModal((m) => ({ ...m, category: e.target.value as UrduContentCategory }))}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{capitalize(c)}</option>)}
              </select>
            </Field>
            <Field label="Content (Urdu)" hint="Characters, combinations, words, sentences or a paragraph.">
              <textarea rows={3} dir="rtl" data-testid="urdu-practice-text" className={inputCls} style={urduStyle} value={modal.text} onChange={(e) => setModal((m) => ({ ...m, text: e.target.value }))} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Difficulty">
                <select className={inputCls} style={inputStyle} data-testid="urdu-practice-difficulty" value={modal.difficulty} onChange={(e) => setModal((m) => ({ ...m, difficulty: e.target.value as UrduContentDifficulty }))}>
                  {DIFFICULTIES.map((d) => <option key={d} value={d}>{capitalize(d)}</option>)}
                </select>
              </Field>
              <Field label="State">
                <select className={inputCls} style={inputStyle} value={modal.isActive ? 'active' : 'inactive'} onChange={(e) => setModal((m) => ({ ...m, isActive: e.target.value === 'active' }))}>
                  <option value="active">Published</option>
                  <option value="inactive">Draft</option>
                </select>
              </Field>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 mt-6">
            <button onClick={() => setModal((m) => ({ ...m, open: false }))} className="btn btn-ghost px-4 py-2">Cancel</button>
            <button data-testid="urdu-practice-save" onClick={() => void save()} className="btn btn-primary px-4 py-2" disabled={busy}>Save</button>
          </div>
        </Modal>
      )}

      {dialog}
    </div>
  );
}

export default function AdminUrduContent() {
  return (
    <AdminPage title="Urdu Content" description="Manage the Urdu Typing Test passages and Urdu Practice content shown to learners.">
      <div className="space-y-6">
        <UrduTestManager />
        <UrduPracticeManager />
      </div>
    </AdminPage>
  );
}
