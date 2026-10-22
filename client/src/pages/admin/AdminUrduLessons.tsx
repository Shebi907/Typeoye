import React, { useCallback, useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2, ArrowUp, ArrowDown, Eye, EyeOff, FilePlus2, Sprout } from 'lucide-react';
import {
  listUrduLessons,
  createUrduLesson,
  updateUrduLesson,
  deleteUrduLesson,
  moveUrduLesson,
  seedUrduLessons,
  listUrduExercises,
  createUrduExercise,
  updateUrduExercise,
  deleteUrduExercise,
  moveUrduExercise,
} from '../../services/admin.service';
import type { AdminLesson, Exercise, AdminLessonInput, AdminExerciseInput } from '../../types';
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

type LessonForm = AdminLessonInput & { targetKeysText: string };
type ExerciseForm = AdminExerciseInput & { targetKeysText: string };

const URDU_CATEGORIES = [
  { value: 'foundation', label: 'Foundation' },
  { value: 'building-blocks', label: 'Building Blocks' },
  { value: 'flow-rhythm', label: 'Flow & Rhythm' },
  { value: 'advanced', label: 'Advanced' },
];

// Urdu inputs render right-to-left in the Nastaliq font so the admin sees the
// text exactly as learners will.
const urduInputCls = `${inputCls} font-urdu`;
const urduInputStyle: React.CSSProperties = { ...inputStyle, direction: 'rtl', textAlign: 'right' };

const emptyLessonForm: LessonForm = {
  title: '',
  description: '',
  category: 'foundation',
  difficulty: 1,
  accuracyThreshold: 90,
  targetKeysText: '',
  isActive: true,
};

const emptyExerciseForm: ExerciseForm = {
  title: '',
  type: 'words',
  level: 1,
  content: '',
  targetKeysText: '',
  difficulty: 1,
  isActive: true,
};

export default function AdminUrduLessons() {
  const [lessons, setLessons] = useState<AdminLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, Exercise[] | undefined>>({});
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [lessonModal, setLessonModal] = useState<{ open: boolean; editing: AdminLesson | null; form: LessonForm }>({
    open: false,
    editing: null,
    form: emptyLessonForm,
  });
  const [exerciseModal, setExerciseModal] = useState<{
    open: boolean;
    lesson: AdminLesson;
    editing: Exercise | null;
    form: ExerciseForm;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { lessons } = await listUrduLessons();
      setLessons([...lessons].sort((a, b) => a.order - b.order));
    } catch {
      setFlash({ type: 'error', text: 'Failed to load Urdu lessons.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const expandLesson = async (lesson: AdminLesson) => {
    if (lesson._id in expanded) {
      setExpanded((prev) => {
        const next = { ...prev };
        delete next[lesson._id];
        return next;
      });
      return;
    }
    try {
      const { exercises } = await listUrduExercises(lesson._id);
      setExpanded((prev) => ({ ...prev, [lesson._id]: exercises }));
    } catch {
      setFlash({ type: 'error', text: 'Failed to load exercises.' });
    }
  };

  const run = async (fn: () => Promise<unknown>, successMsg: string) => {
    setBusy(true);
    try {
      await fn();
      setFlash({ type: 'success', text: successMsg });
      void load();
    } catch (err: any) {
      setFlash({ type: 'error', text: err?.response?.data?.error ?? 'Action failed.' });
    } finally {
      setBusy(false);
    }
  };

  const saveLesson = async () => {
    const { targetKeysText, ...data } = lessonModal.form;
    const payload: AdminLessonInput = {
      ...data,
      targetKeys: targetKeysText.split(',').map((k) => k.trim()).filter(Boolean),
    };
    if (lessonModal.editing) {
      await updateUrduLesson(lessonModal.editing._id, payload);
    } else {
      await createUrduLesson(payload);
    }
    setLessonModal((m) => ({ ...m, open: false }));
  };

  const openLessonEdit = (lesson: AdminLesson) => {
    setLessonModal({
      open: true,
      editing: lesson,
      form: {
        title: lesson.title,
        description: lesson.description,
        category: lesson.category,
        difficulty: lesson.difficulty,
        accuracyThreshold: lesson.accuracyThreshold,
        targetKeysText: (lesson.targetKeys ?? []).join(', '),
        isActive: lesson.isActive,
      },
    });
  };

  const saveExercise = async () => {
    if (!exerciseModal) return;
    const { lesson, editing, form } = exerciseModal;
    const { targetKeysText, ...data } = form;
    const payload: AdminExerciseInput = { ...data, targetKeys: targetKeysText.split(',').map((k) => k.trim()).filter(Boolean) };
    if (editing) {
      await updateUrduExercise(editing._id, payload);
      setExpanded((prev) => ({ ...prev, [lesson._id]: undefined }));
    } else {
      await createUrduExercise(lesson._id, payload);
      setExpanded((prev) => ({ ...prev, [lesson._id]: undefined }));
    }
    setExerciseModal(null);
  };

  const { confirm: confirmLessonDelete, dialog: dialogLessonDelete } = useConfirm(async (lesson: AdminLesson) => {
    await run(async () => deleteUrduLesson(lesson._id), `Deleted "${lesson.title}" and its exercises.`);
  }, busy);

  const { confirm: confirmExerciseDelete, dialog: dialogExerciseDelete } = useConfirm(async (exercise: Exercise) => {
    await run(async () => deleteUrduExercise(exercise._id), 'Exercise deleted.');
  }, busy);

  const { confirm: confirmSeed, dialog: dialogSeed } = useConfirm(async () => {
    await run(async () => seedUrduLessons(), 'Urdu lessons seeded from the canonical 16-level curriculum.');
  }, busy);

  return (
    <AdminPage
      title="Urdu Lessons"
      description="Manage the independent 16-level Urdu course. This does not affect the English Learn course."
    >
      <FlashMessages
        success={flash?.type === 'success' ? flash.text : null}
        error={flash?.type === 'error' ? flash.text : null}
        onDismiss={() => setFlash(null)}
      />

      <div className="flex flex-wrap justify-end gap-3 mb-5">
        <button
          onClick={() => confirmSeed(null, 'Restore the 16 canonical Urdu levels from the bundled curriculum? Matching levels and exercises are overwritten (learner progress is preserved, but admin edits to those levels are replaced).', 'Seed Urdu lessons?')}
          disabled={busy}
          className="btn btn-secondary px-4 py-2"
        >
          <Sprout size={16} /> Seed 16 levels
        </button>
        <button
          onClick={() => setLessonModal({ open: true, editing: null, form: emptyLessonForm })}
          className="btn btn-primary px-4 py-2"
        >
          <Plus size={16} /> New Urdu Level
        </button>
      </div>

      {loading ? (
        <LoadingRow />
      ) : lessons.length === 0 ? (
        <div className="card p-4"><EmptyState message="No Urdu lessons yet. Create one, or seed the 16-level curriculum." /></div>
      ) : (
        <div className="card divide-y" style={{ borderColor: 'var(--color-border)' }}>
          {lessons.map((lesson) => {
            const isOpen = lesson._id in expanded;
            return (
              <div key={lesson._id}>
                <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <button
                    onClick={() => void expandLesson(lesson)}
                    className="p-1 rounded hover:bg-[var(--color-border)] text-secondary"
                    title={isOpen ? 'Collapse exercises' : 'Manage exercises'}
                  >
                    {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  <div
                    className="w-7 h-7 rounded-lg grid place-items-center text-sm font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: 'var(--color-accent)' }}
                  >
                    {lesson.order}
                  </div>
                  <div className="flex-1 min-w-[11.25rem]">
                    <div dir="rtl" lang="ur" className="font-urdu text-base font-semibold leading-loose" style={{ color: 'var(--color-text-primary)' }}>
                      {lesson.title}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      #{lesson.order} · {lesson.exerciseCount} exercise{lesson.exerciseCount === 1 ? '' : 's'} · {lesson.category} · Lv {lesson.difficulty}
                    </div>
                  </div>
                  <Badge active={lesson.isActive} label={lesson.isActive ? 'Published' : 'Hidden'} />
                  <div className="flex items-center gap-0.5 ml-auto">
                    <button onClick={() => void run(() => moveUrduLesson(lesson._id, 'up'), 'Moved up.')} disabled={busy} className="p-1.5 rounded-lg hover:bg-[var(--color-border)] text-secondary" title="Move up">
                      <ArrowUp size={15} />
                    </button>
                    <button onClick={() => void run(() => moveUrduLesson(lesson._id, 'down'), 'Moved down.')} disabled={busy} className="p-1.5 rounded-lg hover:bg-[var(--color-border)] text-secondary" title="Move down">
                      <ArrowDown size={15} />
                    </button>
                    <button
                      onClick={() => void run(() => updateUrduLesson(lesson._id, { isActive: !lesson.isActive }), lesson.isActive ? 'Lesson unpublished (hidden from learners).' : 'Lesson published.')}
                      disabled={busy}
                      className="p-1.5 rounded-lg hover:bg-[var(--color-border)] text-secondary"
                      title={lesson.isActive ? 'Unpublish' : 'Publish'}
                    >
                      {lesson.isActive ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                    <button onClick={() => openLessonEdit(lesson)} className="p-1.5 rounded-lg hover:bg-[var(--color-border)] text-secondary" title="Edit lesson">
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => confirmLessonDelete(lesson, `This permanently deletes "${lesson.title}" and its ${lesson.exerciseCount} exercise(s), plus learner progress for it. This cannot be undone.`, 'Delete Urdu lesson?')}
                      disabled={busy}
                      className="p-1.5 rounded-lg hover:bg-[var(--color-border)] text-[var(--color-error)]"
                      title="Delete lesson"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="px-5 pb-4">
                    {expanded[lesson._id] === undefined ? (
                      <div className="py-2 text-sm text-secondary animate-pulse">Loading exercises…</div>
                    ) : expanded[lesson._id]!.length === 0 ? (
                      <EmptyState message="No exercises yet." />
                    ) : (
                      <div className="rounded-xl" style={{ backgroundColor: 'var(--color-page)' }}>
                        {[...expanded[lesson._id]!].sort((a, b) => a.order - b.order).map((exercise) => (
                          <div key={exercise._id} className="flex flex-wrap items-center gap-3 px-4 py-2.5 border-b last:border-0" style={{ borderColor: 'var(--color-border)' }}>
                            <div className="flex-1 min-w-[10rem]">
                              <div dir="rtl" lang="ur" className="font-urdu text-sm font-medium leading-loose" style={{ color: 'var(--color-text-primary)' }}>
                                {exercise.title}
                              </div>
                              <div dir="rtl" lang="ur" className="font-urdu text-xs leading-loose" style={{ color: 'var(--color-text-muted)' }}>
                                #{exercise.order} · {exercise.type} · Lv {exercise.level} · {exercise.content.slice(0, 60)}{exercise.content.length > 60 ? '…' : ''}
                              </div>
                            </div>
                            <Badge active={exercise.isActive} />
                            <div className="flex items-center gap-0.5">
                              <button onClick={() => void run(() => moveUrduExercise(exercise._id, 'up'), 'Moved up.')} disabled={busy} className="p-1 rounded-lg hover:bg-[var(--color-border)] text-secondary" title="Move up">
                                <ArrowUp size={14} />
                              </button>
                              <button onClick={() => void run(() => moveUrduExercise(exercise._id, 'down'), 'Moved down.')} disabled={busy} className="p-1 rounded-lg hover:bg-[var(--color-border)] text-secondary" title="Move down">
                                <ArrowDown size={14} />
                              </button>
                              <button
                                onClick={() => void run(() => updateUrduExercise(exercise._id, { isActive: !exercise.isActive }), exercise.isActive ? 'Exercise unpublished.' : 'Exercise published.')}
                                disabled={busy}
                                className="p-1 rounded-lg hover:bg-[var(--color-border)] text-secondary"
                                title={exercise.isActive ? 'Unpublish' : 'Publish'}
                              >
                                {exercise.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                              </button>
                              <button
                                onClick={() =>
                                  setExerciseModal({
                                    open: true,
                                    lesson,
                                    editing: exercise,
                                    form: {
                                      title: exercise.title,
                                      type: exercise.type,
                                      level: exercise.level,
                                      content: exercise.content,
                                      targetKeysText: (exercise.targetKeys ?? []).join(', '),
                                      difficulty: exercise.difficulty,
                                      isActive: exercise.isActive,
                                    },
                                  })
                                }
                                className="p-1 rounded-lg hover:bg-[var(--color-border)] text-secondary"
                                title="Edit exercise"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => confirmExerciseDelete(exercise, `Delete exercise "${exercise.title}"? Learners who completed it lose it from their progress list.`, 'Delete exercise?')}
                                disabled={busy}
                                className="p-1 rounded-lg hover:bg-[var(--color-border)] text-[var(--color-error)]"
                                title="Delete exercise"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() =>
                        setExerciseModal({
                          open: true,
                          lesson,
                          editing: null,
                          form: {
                            ...emptyExerciseForm,
                            level: lesson.difficulty,
                            difficulty: lesson.difficulty,
                          },
                        })
                      }
                      className="btn btn-ghost px-3 py-1.5 mt-3 text-sm"
                    >
                      <FilePlus2 size={14} /> Add exercise
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Lesson create/edit modal */}
      {lessonModal.open && (
        <Modal title={lessonModal.editing ? 'Edit Urdu lesson' : 'New Urdu lesson'} onClose={() => setLessonModal((m) => ({ ...m, open: false }))} wide>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Title (Urdu)" hint="Must be Urdu script, e.g. ہوم رو حروف">
              <input data-testid="urdu-lesson-title" dir="rtl" className={urduInputCls} style={urduInputStyle} value={lessonModal.form.title} onChange={(e) => setLessonModal((m) => ({ ...m, form: { ...m.form, title: e.target.value } }))} />
            </Field>
            <Field label="Category">
              <select data-testid="urdu-lesson-category" className={inputCls} style={inputStyle} value={lessonModal.form.category} onChange={(e) => setLessonModal((m) => ({ ...m, form: { ...m.form, category: e.target.value } }))}>
                {URDU_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="Difficulty (1–9)">
              <select data-testid="urdu-lesson-difficulty" className={inputCls} style={inputStyle} value={lessonModal.form.difficulty} onChange={(e) => setLessonModal((m) => ({ ...m, form: { ...m.form, difficulty: Number(e.target.value) } }))}>
                {Array.from({ length: 9 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>Level {i + 1}</option>
                ))}
              </select>
            </Field>
            <Field label="Pass accuracy %" hint="Minimum accuracy to pass an exercise.">
              <input data-testid="urdu-lesson-accuracy" type="number" min={1} max={100} className={inputCls} style={inputStyle} value={lessonModal.form.accuracyThreshold} onChange={(e) => setLessonModal((m) => ({ ...m, form: { ...m.form, accuracyThreshold: Number(e.target.value) } }))} />
            </Field>
            <Field label="Target keys" hint="Comma-separated physical keys, e.g. a, s, d, f">
              <input data-testid="urdu-lesson-keys" className={inputCls} style={inputStyle} value={lessonModal.form.targetKeysText} onChange={(e) => setLessonModal((m) => ({ ...m, form: { ...m.form, targetKeysText: e.target.value } }))} />
            </Field>
            <Field label="Visibility">
              <select data-testid="urdu-lesson-visibility" className={inputCls} style={inputStyle} value={lessonModal.form.isActive ? 'published' : 'hidden'} onChange={(e) => setLessonModal((m) => ({ ...m, form: { ...m.form, isActive: e.target.value === 'published' } }))}>
                <option value="published">Published</option>
                <option value="hidden">Hidden</option>
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Description" hint="Short summary shown to learners (English or Urdu).">
                <textarea data-testid="urdu-lesson-description" rows={3} className={inputCls} style={inputStyle} value={lessonModal.form.description} onChange={(e) => setLessonModal((m) => ({ ...m, form: { ...m.form, description: e.target.value } }))} />
              </Field>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 mt-6">
            <button onClick={() => setLessonModal((m) => ({ ...m, open: false }))} className="btn btn-ghost px-4 py-2">Cancel</button>
            <button data-testid="urdu-lesson-save" onClick={() => void run(() => saveLesson(), lessonModal.editing ? 'Urdu lesson saved.' : 'Urdu lesson created.')} className="btn btn-primary px-4 py-2" disabled={busy}>
              Save Lesson
            </button>
          </div>
        </Modal>
      )}

      {/* Exercise create/edit modal */}
      {exerciseModal && (
        <Modal title={exerciseModal.editing ? 'Edit Urdu exercise' : `New Urdu exercise — ${exerciseModal.lesson.title}`} onClose={() => setExerciseModal(null)} wide>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Title (Urdu)">
              <input data-testid="urdu-ex-title" dir="rtl" className={urduInputCls} style={urduInputStyle} value={exerciseModal.form.title} onChange={(e) => setExerciseModal((m) => (m ? { ...m, form: { ...m.form, title: e.target.value } } : m))} />
            </Field>
            <Field label="Type">
              <select data-testid="urdu-ex-type" className={inputCls} style={inputStyle} value={exerciseModal.form.type} onChange={(e) => setExerciseModal((m) => (m ? { ...m, form: { ...m.form, type: e.target.value as Exercise['type'] } } : m))}>
                {['keys', 'words', 'sentences', 'paragraph', 'custom'].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Level (1–9)">
              <select className={inputCls} style={inputStyle} value={exerciseModal.form.level} onChange={(e) => setExerciseModal((m) => (m ? { ...m, form: { ...m.form, level: Number(e.target.value) } } : m))}>
                {Array.from({ length: 9 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
              </select>
            </Field>
            <Field label="Difficulty (1–9)">
              <select className={inputCls} style={inputStyle} value={exerciseModal.form.difficulty} onChange={(e) => setExerciseModal((m) => (m ? { ...m, form: { ...m.form, difficulty: Number(e.target.value) } } : m))}>
                {Array.from({ length: 9 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
              </select>
            </Field>
            <Field label="Target keys" hint="Comma-separated">
              <input className={inputCls} style={inputStyle} value={exerciseModal.form.targetKeysText} onChange={(e) => setExerciseModal((m) => (m ? { ...m, form: { ...m.form, targetKeysText: e.target.value } } : m))} />
            </Field>
            <Field label="Visibility">
              <select className={inputCls} style={inputStyle} value={exerciseModal.form.isActive ? 'active' : 'hidden'} onChange={(e) => setExerciseModal((m) => (m ? { ...m, form: { ...m.form, isActive: e.target.value === 'active' } } : m))}>
                <option value="active">Active</option>
                <option value="hidden">Hidden</option>
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Content (Urdu)" hint="The Urdu drill text learners type.">
                <textarea data-testid="urdu-ex-content" dir="rtl" rows={5} className={urduInputCls} style={urduInputStyle} value={exerciseModal.form.content} onChange={(e) => setExerciseModal((m) => (m ? { ...m, form: { ...m.form, content: e.target.value } } : m))} />
              </Field>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 mt-6">
            <button onClick={() => setExerciseModal(null)} className="btn btn-ghost px-4 py-2">Cancel</button>
            <button data-testid="urdu-ex-save" onClick={() => void (async () => { await run(() => saveExercise(), exerciseModal.editing ? 'Exercise saved.' : 'Exercise created.'); setExerciseModal(null); })()} className="btn btn-primary px-4 py-2" disabled={busy}>
              Save Exercise
            </button>
          </div>
        </Modal>
      )}

      {dialogLessonDelete}
      {dialogExerciseDelete}
      {dialogSeed}
    </AdminPage>
  );
}
