import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import {
  listPool,
  createPoolItem,
  updatePoolItem,
  deletePoolItem,
  type ContentPoolKey,
} from '../../services/admin.service';
import type { ContentDifficulty, ContentItem } from '../../types';
import {
  AdminPage,
  EmptyState,
  Field,
  FlashMessages,
  LoadingRow,
  Modal,
  inputCls,
  inputStyle,
  useConfirm,
} from '../../components/admin/ui';

type FieldType = 'text' | 'textarea' | 'tags';

interface FieldConfig {
  name: 'content' | 'text' | 'difficulty' | 'topic' | 'tags';
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
}

interface PoolConfig {
  key: ContentPoolKey;
  title: string;
  description: string;
  fields: FieldConfig[];
  displayName: (item: ContentItem) => string;
  toForm: (item: ContentItem | null) => Record<string, string>;
  fromForm: (form: Record<string, string>) => Partial<ContentItem>;
}

const pools: PoolConfig[] = [
  {
    key: 'testParagraphs',
    title: 'Test Paragraphs',
    description: 'Used for the timed Test typing sessions.',
    fields: [
      { name: 'content', label: 'Paragraph', type: 'textarea' },
      { name: 'difficulty', label: 'Difficulty', type: 'text' },
      { name: 'topic', label: 'Topic', type: 'text' },
    ],
    displayName: (i) => `${i.content?.slice(0, 90) ?? ''}${i.content && i.content.length > 90 ? '…' : ''}`,
    toForm: (item) => ({ content: item?.content ?? '', difficulty: item?.difficulty ?? 'beginner', topic: item?.topic ?? '' }),
    fromForm: (f) => ({ content: f.content, difficulty: f.difficulty as ContentDifficulty, topic: f.topic }),
  },
  {
    key: 'practiceParagraphs',
    title: 'Practice Paragraphs',
    description: 'Treated with priority in Paragraph practice (generated text fills the rest).',
    fields: [
      { name: 'content', label: 'Paragraph', type: 'textarea' },
      { name: 'difficulty', label: 'Difficulty', type: 'text' },
      { name: 'topic', label: 'Topic', type: 'text' },
    ],
    displayName: (i) => `${i.content?.slice(0, 90) ?? ''}${i.content && i.content.length > 90 ? '…' : ''}`,
    toForm: (item) => ({ content: item?.content ?? '', difficulty: item?.difficulty ?? 'beginner', topic: item?.topic ?? '' }),
    fromForm: (f) => ({ content: f.content, difficulty: f.difficulty as ContentDifficulty, topic: f.topic }),
  },
  {
    key: 'words',
    title: 'Words',
    description: 'Word-practice and game word lists. When populated, they override the built-in word bank.',
    fields: [
      { name: 'text', label: 'Word', type: 'text' },
      { name: 'difficulty', label: 'Difficulty', type: 'text' },
      { name: 'tags', label: 'Tags', type: 'tags' },
    ],
    displayName: (i) => i.text ?? '',
    toForm: (item) => ({ text: item?.text ?? '', difficulty: item?.difficulty ?? 'beginner', tags: (item?.tags ?? []).join(', ') }),
    fromForm: (f) => ({ text: f.text, difficulty: f.difficulty as ContentDifficulty, tags: f.tags.split(',').map((t) => t.trim()).filter(Boolean) }),
  },
  {
    key: 'sentences',
    title: 'Sentences',
    description: 'Sentence practice pool. When populated, they override generated sentences.',
    fields: [
      { name: 'text', label: 'Sentence', type: 'textarea' },
      { name: 'difficulty', label: 'Difficulty', type: 'text' },
      { name: 'tags', label: 'Tags', type: 'tags' },
    ],
    displayName: (i) => `${i.text?.slice(0, 90) ?? ''}${i.text && i.text.length > 90 ? '…' : ''}`,
    toForm: (item) => ({ text: item?.text ?? '', difficulty: item?.difficulty ?? 'beginner', tags: (item?.tags ?? []).join(', ') }),
    fromForm: (f) => ({ text: f.text, difficulty: f.difficulty as ContentDifficulty, tags: f.tags.split(',').map((t) => t.trim()).filter(Boolean) }),
  },
];

function PoolManager({ config }: { config: PoolConfig }) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [difficulty, setDifficulty] = useState('');
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editing, setEditing] = useState<ContentItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { items } = await listPool(config.key, difficulty === '' ? undefined : (difficulty as ContentDifficulty));
      setItems(items);
    } catch {
      setFlash({ type: 'error', text: 'Failed to load content.' });
    } finally {
      setLoading(false);
    }
  }, [config.key, difficulty]);

  useEffect(() => {
    void load();
  }, [load]);

  const openNew = () => {
    setEditing(null);
    setForm(config.toForm(null));
    setFormOpen(true);
  };

  const openEdit = (item: ContentItem) => {
    setEditing(item);
    setForm(config.toForm(item));
    setFormOpen(true);
  };

  const save = async () => {
    setBusy(true);
    try {
      if (editing) {
        await updatePoolItem(config.key, editing._id, config.fromForm(form));
      } else {
        await createPoolItem(config.key, config.fromForm(form));
      }
      setFormOpen(false);
      setFlash({ type: 'success', text: editing ? 'Saved.' : 'Added.' });
      void load();
    } catch (err: any) {
      setFlash({ type: 'error', text: err?.response?.data?.error ?? 'Failed to save content.' });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (item: ContentItem) => {
    setBusy(true);
    try {
      await deletePoolItem(config.key, item._id);
      setFlash({ type: 'success', text: 'Deleted.' });
      void load();
    } catch (err: any) {
      setFlash({ type: 'error', text: err?.response?.data?.error ?? 'Failed to delete content.' });
    } finally {
      setBusy(false);
    }
  };

  const { confirm, dialog } = useConfirm((item: ContentItem) => remove(item), busy);

  const renderField = (field: FieldConfig) => {
    if (field.name === 'difficulty') {
      return (
        <Field key={field.name} label={field.label}>
          <select data-testid="difficulty-select" className={inputCls} style={inputStyle} value={form.difficulty ?? 'beginner'} onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))}>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </Field>
      );
    }
    if (field.type === 'textarea') {
      return (
        <Field key={field.name} label={field.label}>
          <textarea rows={4} data-testid={`field-${field.name}`} className={inputCls} style={inputStyle} value={form[field.name] ?? ''} onChange={(e) => setForm((f) => ({ ...f, [field.name]: e.target.value }))} placeholder={field.placeholder} />
        </Field>
      );
    }
    return (
      <Field key={field.name} label={field.label} hint={field.name === 'tags' ? 'Comma-separated' : undefined}>
        <input data-testid={`field-${field.name}`} className={inputCls} style={inputStyle} value={form[field.name] ?? ''} onChange={(e) => setForm((f) => ({ ...f, [field.name]: e.target.value }))} placeholder={field.placeholder} />
      </Field>
    );
  };

  return (
    <div className="card p-5">
      <FlashMessages
        success={flash?.type === 'success' ? flash.text : null}
        error={flash?.type === 'error' ? flash.text : null}
        onDismiss={() => setFlash(null)}
      />
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{config.title}</h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{config.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="rounded-lg border px-2.5 py-1.5 text-sm" style={{ backgroundColor: 'var(--color-page)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }} value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            <option value="">All difficulties</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <button onClick={openNew} className="btn btn-primary px-3 py-1.5 text-sm">
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingRow />
      ) : items.length === 0 ? (
        <EmptyState message="Nothing here yet — add some content." />
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: 'var(--color-text-muted)', backgroundColor: 'var(--color-page)' }}>
                <th className="text-left font-semibold px-3 py-2">{config.key === 'words' ? 'Word' : 'Content'}</th>
                <th className="text-left font-semibold px-3 py-2">Difficulty</th>
                <th className="text-right font-semibold px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-3 py-2" style={{ color: 'var(--color-text-primary)' }}>{config.displayName(item)}</td>
                  <td className="px-3 py-2 capitalize" style={{ color: 'var(--color-text-secondary)' }}>{item.difficulty}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-[var(--color-border)] text-secondary" title="Edit">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => confirm(item, `Delete this ${config.key === 'words' ? 'word' : config.key === 'sentences' ? 'sentence' : 'paragraph'}? This cannot be undone.`)} className="p-1.5 rounded-lg hover:bg-[var(--color-border)] text-[var(--color-error)]" title="Delete">
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

      {formOpen && (
        <Modal title={editing ? 'Edit item' : `Add to ${config.title.toLowerCase()}`} onClose={() => setFormOpen(false)}>
          <div className="space-y-4">
            {config.fields.map(renderField)}
          </div>
          <div className="flex items-center justify-end gap-3 mt-6">
            <button onClick={() => setFormOpen(false)} className="btn btn-ghost px-4 py-2">Cancel</button>
            <button data-testid="save-pool-btn" onClick={() => void save()} className="btn btn-primary px-4 py-2" disabled={busy}>Save</button>
          </div>
        </Modal>
      )}

      {dialog}
    </div>
  );
}

export default function AdminContent() {
  return (
    <AdminPage title="Content" description="Manage the word, sentence, and paragraph pools used by Tests and Practice.">
      <div className="space-y-6">
        {pools.map((pool) => (
          <PoolManager key={pool.key} config={pool} />
        ))}
      </div>
    </AdminPage>
  );
}