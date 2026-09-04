import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { listAchievements, createAchievement, updateAchievement, deleteAchievement } from '../../services/admin.service';
import type { AdminAchievement } from '../../types';
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

const CONDITION_TYPES = ['first_test', 'first_practice', 'practice', 'wpm', 'accuracy', 'streak', 'lessons', 'lesson'];
const RARITIES = ['common', 'rare', 'epic', 'legendary'];

type AchievementForm = {
  name: string;
  description: string;
  icon: string;
  conditionType: string;
  threshold: number;
  params: {
    minAccuracy?: number;
    minWpm?: number;
    minDuration?: number;
    requiredTests?: number;
  };
  xpReward: number;
  rarity: AdminAchievement['rarity'];
  isActive: boolean;
};

const emptyForm: AchievementForm = {
  name: '',
  description: '',
  icon: 'Trophy',
  conditionType: 'wpm',
  threshold: 40,
  params: {},
  xpReward: 100,
  rarity: 'common',
  isActive: true,
};

function toForm(a: AdminAchievement | null): AchievementForm {
  return a
    ? {
        name: a.name,
        description: a.description,
        icon: a.icon,
        conditionType: a.condition.type,
        threshold: a.condition.threshold,
        params: a.params
          ? {
              minAccuracy: a.params.minAccuracy ?? undefined,
              minWpm: a.params.minWpm ?? undefined,
              minDuration: a.params.minDuration ?? undefined,
              requiredTests: a.params.requiredTests ?? undefined,
            }
          : {},
        xpReward: a.xpReward,
        rarity: a.rarity,
        isActive: a.isActive,
      }
    : emptyForm;
}

export default function AdminAchievements() {
  const [rows, setRows] = useState<AdminAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [modal, setModal] = useState<{ open: boolean; editing: AdminAchievement | null; form: AchievementForm }>({
    open: false,
    editing: null,
    form: emptyForm,
  });

  const load = async () => {
    setLoading(true);
    try {
      const { achievements } = await listAchievements();
      setRows(achievements);
    } catch {
      setFlash({ type: 'error', text: 'Failed to load achievements.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const openEdit = (a: AdminAchievement) => setModal({ open: true, editing: a, form: toForm(a) });
  const openNew = () => setModal({ open: true, editing: null, form: toForm(null) });

  const save = async () => {
    const f = modal.form;
    const params: AchievementForm['params'] = {};
    if (f.params.minAccuracy !== undefined && f.params.minAccuracy > 0) params.minAccuracy = f.params.minAccuracy;
    if (f.params.minWpm !== undefined && f.params.minWpm > 0) params.minWpm = f.params.minWpm;
    if (f.params.minDuration !== undefined && f.params.minDuration > 0) params.minDuration = f.params.minDuration;
    if (f.params.requiredTests !== undefined && f.params.requiredTests > 0) params.requiredTests = f.params.requiredTests;
    const payload = {
      name: f.name,
      description: f.description,
      icon: f.icon,
      condition: { type: f.conditionType, threshold: f.threshold },
      params,
      xpReward: f.xpReward,
      rarity: f.rarity,
      isActive: f.isActive,
    };
    setBusy(true);
    try {
      if (modal.editing) {
        await updateAchievement(modal.editing._id, payload);
        setFlash({ type: 'success', text: 'Achievement saved.' });
      } else {
        await createAchievement(payload);
        setFlash({ type: 'success', text: 'Achievement created.' });
      }
      setModal((m) => ({ ...m, open: false }));
      void load();
    } catch (err: any) {
      setFlash({ type: 'error', text: err?.response?.data?.error ?? 'Failed to save achievement.' });
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (a: AdminAchievement) => {
    setBusy(true);
    try {
      await updateAchievement(a._id, { isActive: !a.isActive });
      setFlash({ type: 'success', text: a.isActive ? 'Achievement deactivated.' : 'Achievement activated.' });
      void load();
    } catch (err: any) {
      setFlash({ type: 'error', text: err?.response?.data?.error ?? 'Failed to update achievement.' });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (a: AdminAchievement) => {
    setBusy(true);
    try {
      await deleteAchievement(a._id);
      setFlash({ type: 'success', text: `Deleted "${a.name}".` });
      void load();
    } catch (err: any) {
      setFlash({ type: 'error', text: err?.response?.data?.error ?? 'Failed to delete achievement.' });
    } finally {
      setBusy(false);
    }
  };

  const { confirm, dialog } = useConfirm((a: AdminAchievement) => remove(a), busy);

  return (
    <AdminPage title="Achievements" description="Unlock definitions, conditions, and XP rewards.">
      <FlashMessages
        success={flash?.type === 'success' ? flash.text : null}
        error={flash?.type === 'error' ? flash.text : null}
        onDismiss={() => setFlash(null)}
      />
      <div className="flex justify-end mb-5">
        <button onClick={openNew} className="btn btn-primary px-4 py-2">
          <Plus size={16} /> New Achievement
        </button>
      </div>

      {loading ? (
        <LoadingRow />
      ) : rows.length === 0 ? (
        <div className="card p-4"><EmptyState message="No achievements yet." /></div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: 'var(--color-text-muted)' }}>
                <th className="text-left font-semibold px-4 py-3">Name</th>
                <th className="text-left font-semibold px-4 py-3">Condition</th>
                <th className="text-left font-semibold px-4 py-3">XP</th>
                <th className="text-left font-semibold px-4 py-3">Rarity</th>
                <th className="text-left font-semibold px-4 py-3">State</th>
                <th className="text-right font-semibold px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a._id} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-4 py-3">
                    <div className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{a.name}</div>
                    <div className="text-xs max-w-[320px] truncate" style={{ color: 'var(--color-text-muted)' }}>{a.description}</div>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>
                    <code className="text-xs">{a.condition.type}</code> ≥ {a.condition.threshold}
                  </td>
                  <td className="px-4 py-3">{a.xpReward}</td>
                  <td className="px-4 py-3 capitalize" style={{ color: 'var(--color-text-secondary)' }}>{a.rarity}</td>
                  <td className="px-4 py-3"><Badge active={a.isActive} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => void toggleActive(a)} disabled={busy} className="p-1.5 rounded-lg hover:bg-[var(--color-border)] text-secondary" title={a.isActive ? 'Deactivate' : 'Activate'}>
                        {a.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg hover:bg-[var(--color-border)] text-secondary" title="Edit">
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => confirm(a, `Delete "${a.name}"? Learners who already earned it will keep the XP but the badge definition is removed.`, 'Delete achievement?')}
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
        <Modal title={modal.editing ? `Edit — ${modal.editing.name}` : 'New achievement'} onClose={() => setModal((m) => ({ ...m, open: false }))}>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Name"><input data-testid="ach-name" className={inputCls} style={inputStyle} value={modal.form.name} onChange={(e) => setModal((m) => ({ ...m, form: { ...m.form, name: e.target.value } }))} /></Field>
            <Field label="Icon" hint="Lucide icon name, e.g. Trophy, Zap, Star"><input data-testid="ach-icon" className={inputCls} style={inputStyle} value={modal.form.icon} onChange={(e) => setModal((m) => ({ ...m, form: { ...m.form, icon: e.target.value } }))} /></Field>
            <Field label="Condition type">
              <select data-testid="ach-condtype" className={inputCls} style={inputStyle} value={modal.form.conditionType} onChange={(e) => setModal((m) => ({ ...m, form: { ...m.form, conditionType: e.target.value } }))}>
                {CONDITION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Threshold"><input data-testid="ach-threshold" type="number" min={1} className={inputCls} style={inputStyle} value={modal.form.threshold} onChange={(e) => setModal((m) => ({ ...m, form: { ...m.form, threshold: Number(e.target.value) } }))} /></Field>
            <Field label="XP reward"><input data-testid="ach-xp" type="number" min={1} className={inputCls} style={inputStyle} value={modal.form.xpReward} onChange={(e) => setModal((m) => ({ ...m, form: { ...m.form, xpReward: Number(e.target.value) } }))} /></Field>
            <Field label="Rarity">
              <select data-testid="ach-rarity" className={inputCls} style={inputStyle} value={modal.form.rarity} onChange={(e) => setModal((m) => ({ ...m, form: { ...m.form, rarity: e.target.value as AdminAchievement['rarity'] } }))}>
                {RARITIES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Description"><textarea data-testid="ach-desc" rows={2} className={inputCls} style={inputStyle} value={modal.form.description} onChange={(e) => setModal((m) => ({ ...m, form: { ...m.form, description: e.target.value } }))} /></Field>
            </div>
            <div className="sm:col-span-2">
              <div className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>Extra requirements (optional, stacked on the threshold)</div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Field label="Min accuracy %"><input data-testid="ach-minacc" type="number" min={0} max={100} className={inputCls} style={inputStyle} value={modal.form.params.minAccuracy ?? ''} onChange={(e) => setModal((m) => ({ ...m, form: { ...m.form, params: { ...m.form.params, minAccuracy: e.target.value === '' ? undefined : Number(e.target.value) } } }))} /></Field>
                <Field label="Min WPM"><input data-testid="ach-minwpm" type="number" min={0} className={inputCls} style={inputStyle} value={modal.form.params.minWpm ?? ''} onChange={(e) => setModal((m) => ({ ...m, form: { ...m.form, params: { ...m.form.params, minWpm: e.target.value === '' ? undefined : Number(e.target.value) } } }))} /></Field>
                <Field label="Min duration (s)"><input data-testid="ach-mindur" type="number" min={0} className={inputCls} style={inputStyle} value={modal.form.params.minDuration ?? ''} onChange={(e) => setModal((m) => ({ ...m, form: { ...m.form, params: { ...m.form.params, minDuration: e.target.value === '' ? undefined : Number(e.target.value) } } }))} /></Field>
                <Field label="Required tests"><input data-testid="ach-reqtests" type="number" min={0} className={inputCls} style={inputStyle} value={modal.form.params.requiredTests ?? ''} onChange={(e) => setModal((m) => ({ ...m, form: { ...m.form, params: { ...m.form.params, requiredTests: e.target.value === '' ? undefined : Number(e.target.value) } } }))} /></Field>
              </div>
            </div>
            <div className="sm:col-span-2">
              <Field label="State">
                <select className={inputCls} style={inputStyle} value={modal.form.isActive ? 'active' : 'inactive'} onChange={(e) => setModal((m) => ({ ...m, form: { ...m.form, isActive: e.target.value === 'active' } }))}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </Field>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 mt-6">
            <button onClick={() => setModal((m) => ({ ...m, open: false }))} className="btn btn-ghost px-4 py-2">Cancel</button>
            <button data-testid="save-ach-btn" onClick={() => void save()} className="btn btn-primary px-4 py-2" disabled={busy}>Save</button>
          </div>
        </Modal>
      )}

      {dialog}
    </AdminPage>
  );
}