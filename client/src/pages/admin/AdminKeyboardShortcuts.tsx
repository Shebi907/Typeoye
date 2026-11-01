import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, FileText, Pencil, Plus, Replace, Trash2, Upload } from 'lucide-react';
import {
  deleteAdminShortcutPdf,
  listAdminShortcutPdfs,
  previewAdminShortcutPdf,
  replaceAdminShortcutPdf,
  setAdminShortcutPdfPublished,
  updateAdminShortcutPdf,
  uploadAdminShortcutPdf,
} from '../../services/keyboardShortcutPdf.service';
import {
  KEYBOARD_SHORTCUT_MAX_BYTES,
  KEYBOARD_SHORTCUT_PDF_CATEGORIES,
  formatPdfSize,
  type KeyboardShortcutPdf,
  type KeyboardShortcutPdfInput,
} from '../../data/resources/keyboardShortcuts';
import {
  AdminPage, Badge, EmptyState, Field, FlashMessages, LoadingRow, Modal,
  inputCls, inputStyle, useConfirm,
} from '../../components/admin/ui';

const APPLICATION_SUGGESTIONS = ['Microsoft Word', 'Microsoft Excel', 'Microsoft PowerPoint', 'Google Docs', 'Google Sheets', 'Google Slides', 'Windows', 'Web browsers', 'Visual Studio Code'];
type EditablePdf = KeyboardShortcutPdf & { originalFileName: string; storedFileName: string };
type Flash = { type: 'success' | 'error'; text: string } | null;
type FormState = KeyboardShortcutPdfInput & { tagsText: string };

const emptyForm = (): FormState => ({ applicationName: '', title: '', description: '', category: 'Microsoft Office', language: 'English', version: '', source: '', pageCount: undefined, tags: [], tagsText: '', lastUpdated: '' });
const errorText = (error: any, fallback: string) => error?.response?.data?.error ?? fallback;

async function validatePdfFile(file: File): Promise<string | null> {
  if (!file.name.toLowerCase().endsWith('.pdf')) return 'Choose a file with the .pdf extension.';
  if (file.size <= 0) return 'The PDF file is empty.';
  if (file.size > KEYBOARD_SHORTCUT_MAX_BYTES) return `Choose a PDF smaller than ${formatPdfSize(KEYBOARD_SHORTCUT_MAX_BYTES)}.`;
  if (file.type && file.type !== 'application/pdf') return 'Only PDF files are accepted.';
  const signature = new Uint8Array(await file.slice(0, 1024).arrayBuffer());
  const text = new TextDecoder('latin1').decode(signature);
  return text.includes('%PDF-') ? null : 'This file does not have a valid PDF signature.';
}

export default function AdminKeyboardShortcuts() {
  const [rows, setRows] = useState<EditablePdf[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<Flash>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EditablePdf | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formError, setFormError] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<string | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { items } = await listAdminShortcutPdfs();
      setRows(items as EditablePdf[]);
    } catch (error) {
      setFlash({ type: 'error', text: errorText(error, 'Failed to load keyboard shortcut PDFs.') });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => () => { if (previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const closeModal = () => {
    setModalOpen(false); setEditing(null); setSelectedFile(null); setFormError(''); setUploadProgress(null);
    if (inputRef.current) inputRef.current.value = '';
  };
  const openUpload = () => { setEditing(null); setForm(emptyForm()); setSelectedFile(null); setFormError(''); setModalOpen(true); };
  const openEdit = (row: EditablePdf) => {
    setEditing(row);
    setForm({ applicationName: row.applicationName, title: row.title, description: row.description, category: row.category, language: row.language, version: row.version ?? '', source: row.source ?? '', pageCount: row.pageCount ?? undefined, tags: row.tags ?? [], tagsText: (row.tags ?? []).join(', '), lastUpdated: row.lastUpdated ?? '' });
    setSelectedFile(null); setFormError(''); setModalOpen(true);
  };

  const chooseFile = async (file?: File) => {
    if (!file) return;
    const invalid = await validatePdfFile(file);
    if (invalid) { setSelectedFile(null); setFormError(invalid); return; }
    setFormError(''); setSelectedFile(file);
  };

  const openPreview = async (row?: EditablePdf) => {
    setBusy(true);
    try {
      let blob: Blob;
      if (row) blob = await previewAdminShortcutPdf(row.id);
      else if (selectedFile) blob = selectedFile;
      else return;
      const nextUrl = URL.createObjectURL(blob);
      setPreviewUrl(nextUrl);
      setPreviewTitle(row?.title ?? selectedFile?.name ?? 'PDF preview');
    } catch (error) {
      setFlash({ type: 'error', text: errorText(error, 'Could not load the PDF preview.') });
    } finally { setBusy(false); }
  };

  const save = async (publish: boolean) => {
    setFormError('');
    if (!form.applicationName.trim() || !form.title.trim() || !form.description.trim() || !form.language.trim()) {
      setFormError('Complete the application, title, description, and language fields.'); return;
    }
    if (!editing && !selectedFile) { setFormError('Choose a PDF file to upload.'); return; }
    const { tagsText: _tagsText, ...formFields } = form;
    const payload: KeyboardShortcutPdfInput = { ...formFields, applicationName: form.applicationName.trim(), title: form.title.trim(), description: form.description.trim(), language: form.language.trim(), tags: form.tagsText.split(',').map((tag) => tag.trim()).filter(Boolean), pageCount: form.pageCount ? Number(form.pageCount) : undefined };
    setBusy(true);
    try {
      if (editing) {
        await updateAdminShortcutPdf(editing.id, payload);
        setFlash({ type: 'success', text: 'PDF details saved.' });
      } else {
        const created = await uploadAdminShortcutPdf(payload, selectedFile!, setUploadProgress);
        if (publish) await setAdminShortcutPdfPublished(created.item.id, true);
        setFlash({ type: 'success', text: publish ? 'PDF uploaded and published.' : 'PDF uploaded as a draft.' });
      }
      closeModal(); void load();
    } catch (error) {
      setFormError(errorText(error, 'Could not save this PDF guide.'));
    } finally { setBusy(false); setUploadProgress(null); }
  };

  const togglePublish = async (row: EditablePdf) => {
    setBusy(true);
    try {
      await setAdminShortcutPdfPublished(row.id, !row.published);
      setFlash({ type: 'success', text: row.published ? 'PDF unpublished.' : 'PDF published.' });
      void load();
    } catch (error) { setFlash({ type: 'error', text: errorText(error, 'Could not change publish status.') }); }
    finally { setBusy(false); }
  };

  const replaceFile = async (row: EditablePdf, file?: File) => {
    if (!file) return;
    const invalid = await validatePdfFile(file);
    if (invalid) { setFlash({ type: 'error', text: invalid }); return; }
    setBusy(true); setUploadProgress(0);
    try {
      await replaceAdminShortcutPdf(row.id, file, setUploadProgress);
      setFlash({ type: 'success', text: 'PDF file replaced.' }); void load();
    } catch (error) { setFlash({ type: 'error', text: errorText(error, 'Could not replace the PDF file.') }); }
    finally { setBusy(false); setUploadProgress(null); if (replaceRef.current) { const input = fileInputs.current[replaceRef.current]; if (input) input.value = ''; } replaceRef.current = null; }
  };

  const remove = async (row: EditablePdf) => {
    setBusy(true);
    try { await deleteAdminShortcutPdf(row.id); setFlash({ type: 'success', text: 'PDF guide deleted.' }); void load(); }
    catch (error) { setFlash({ type: 'error', text: errorText(error, 'Could not delete the PDF guide.') }); }
    finally { setBusy(false); }
  };
  const { confirm, dialog } = useConfirm((row: EditablePdf) => remove(row), busy);

  return (
    <AdminPage title="Keyboard Shortcuts PDFs" description="Upload, preview and publish PDF shortcut guides for the public Resources library.">
      <FlashMessages success={flash?.type === 'success' ? flash.text : null} error={flash?.type === 'error' ? flash.text : null} onDismiss={() => setFlash(null)} />
      {uploadProgress !== null && <div className="mb-4 rounded-lg border p-3 text-sm" style={{ ...inputStyle, borderColor: 'var(--color-border)' }} role="status">Uploading PDF: {uploadProgress}%<div className="mt-2 h-2 overflow-hidden rounded bg-slate-200"><div className="h-full bg-blue-600 transition-all" style={{ width: `${uploadProgress}%` }} /></div></div>}
      <div className="mb-5 flex justify-end"><button onClick={openUpload} className="btn btn-primary px-4 py-2"><Plus size={16} /> Upload New PDF</button></div>
      {loading ? <LoadingRow /> : rows.length === 0 ? <div className="card p-4"><EmptyState message="No keyboard shortcut PDFs have been uploaded yet." /></div> : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[1050px] text-sm">
            <thead><tr style={{ color: 'var(--color-text-muted)' }}>{['Application', 'PDF title', 'Language', 'Category', 'File name', 'File size', 'Upload date', 'Status', 'Actions'].map((label) => <th key={label} className="px-3 py-3 text-left font-semibold">{label}</th>)}</tr></thead>
            <tbody>{rows.map((row) => (
              <tr key={row.id} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                <td className="px-3 py-3 font-semibold">{row.applicationName}</td>
                <td className="max-w-[15rem] px-3 py-3"><span className="line-clamp-2">{row.title}</span></td>
                <td className="px-3 py-3">{row.language}</td><td className="px-3 py-3">{row.category}</td>
                <td className="max-w-[13rem] truncate px-3 py-3" title={row.originalFileName}>{row.originalFileName}</td>
                <td className="whitespace-nowrap px-3 py-3">{formatPdfSize(row.fileSize)}</td>
                <td className="whitespace-nowrap px-3 py-3">{new Date(row.uploadedAt).toLocaleDateString()}</td>
                <td className="px-3 py-3"><Badge active={row.published} label={row.published ? 'Published' : 'Draft'} /></td>
                <td className="px-3 py-3"><div className="flex items-center gap-1">
                  <button onClick={() => void openPreview(row)} disabled={busy} className="rounded-lg p-1.5 text-secondary hover:bg-[var(--color-border)]" title="Preview PDF" aria-label={`Preview ${row.title}`}><Eye size={15} /></button>
                  <button onClick={() => openEdit(row)} disabled={busy} className="rounded-lg p-1.5 text-secondary hover:bg-[var(--color-border)]" title="Edit details" aria-label={`Edit ${row.title}`}><Pencil size={15} /></button>
                  <button onClick={() => void togglePublish(row)} disabled={busy} className="rounded-lg p-1.5 text-secondary hover:bg-[var(--color-border)]" title={row.published ? 'Unpublish' : 'Publish'} aria-label={row.published ? `Unpublish ${row.title}` : `Publish ${row.title}`}>{row.published ? <EyeOff size={15} /> : <FileText size={15} />}</button>
                  <button onClick={() => { replaceRef.current = row.id; fileInputs.current[row.id]?.click(); }} disabled={busy} className="rounded-lg p-1.5 text-secondary hover:bg-[var(--color-border)]" title="Replace PDF" aria-label={`Replace ${row.title}`}><Replace size={15} /></button>
                  <button onClick={() => confirm(row, `Delete “${row.title}” and its uploaded PDF?`, 'Delete PDF guide?')} disabled={busy} className="rounded-lg p-1.5 text-[var(--color-error)] hover:bg-[var(--color-border)]" title="Delete PDF" aria-label={`Delete ${row.title}`}><Trash2 size={15} /></button>
                  <input ref={(element) => { fileInputs.current[row.id] = element; }} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(event) => void replaceFile(row, event.target.files?.[0])} />
                </div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {modalOpen && <Modal wide title={editing ? 'Edit PDF guide details' : 'Upload New PDF'} onClose={closeModal}>
        {formError && <div className="mb-4 rounded-lg px-3 py-2 text-sm" role="alert" style={{ backgroundColor: 'rgba(239,68,68,.1)', color: 'var(--color-error)' }}>{formError}</div>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Application name" hint="Choose a suggestion or enter another application."><input list="shortcut-applications" value={form.applicationName} onChange={(event) => setForm((current) => ({ ...current, applicationName: event.target.value }))} className={inputCls} style={inputStyle} required /><datalist id="shortcut-applications">{APPLICATION_SUGGESTIONS.map((name) => <option key={name} value={name} />)}</datalist></Field>
          <Field label="PDF title"><input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className={inputCls} style={inputStyle} required maxLength={180} /></Field>
          <Field label="Category"><select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as FormState['category'] }))} className={inputCls} style={inputStyle}>{KEYBOARD_SHORTCUT_PDF_CATEGORIES.filter((category) => category !== 'All Applications').map((category) => <option key={category}>{category}</option>)}</select></Field>
          <Field label="Language"><input value={form.language} onChange={(event) => setForm((current) => ({ ...current, language: event.target.value }))} className={inputCls} style={inputStyle} required /></Field>
          <div className="sm:col-span-2"><Field label="Short description"><textarea rows={3} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className={inputCls} style={inputStyle} required maxLength={600} /></Field></div>
          {!editing && <div className="sm:col-span-2" onDragOver={(event) => { event.preventDefault(); setDragActive(true); }} onDragLeave={() => setDragActive(false)} onDrop={(event) => { event.preventDefault(); setDragActive(false); void chooseFile(event.dataTransfer.files[0]); }}>
            <Field label="PDF file" hint={`PDF only. Maximum file size: ${formatPdfSize(KEYBOARD_SHORTCUT_MAX_BYTES)}.`}>
              <div className={`rounded-xl border-2 border-dashed p-5 text-center ${dragActive ? 'border-blue-500 bg-blue-50' : ''}`} style={{ borderColor: dragActive ? '#4361ee' : 'var(--color-border)' }}>
                <Upload size={22} className="mx-auto mb-2 text-blue-700" />
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{selectedFile ? `${selectedFile.name} · ${formatPdfSize(selectedFile.size)}` : 'Drop a PDF here or browse your device.'}</p>
                <button type="button" onClick={() => inputRef.current?.click()} className="btn btn-ghost mt-3 px-3 py-1.5">Browse files</button>
                <input ref={inputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(event) => void chooseFile(event.target.files?.[0])} />
                {selectedFile && <button type="button" onClick={() => void openPreview()} className="ml-2 inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm"><Eye size={14} /> Preview PDF</button>}
              </div>
            </Field>
          </div>}
          <Field label="Version (optional)"><input value={form.version} onChange={(event) => setForm((current) => ({ ...current, version: event.target.value }))} className={inputCls} style={inputStyle} /></Field>
          <Field label="Author or source (optional)"><input value={form.source} onChange={(event) => setForm((current) => ({ ...current, source: event.target.value }))} className={inputCls} style={inputStyle} /></Field>
          <Field label="Page count (optional)"><input type="number" min={1} value={form.pageCount ?? ''} onChange={(event) => setForm((current) => ({ ...current, pageCount: event.target.value ? Number(event.target.value) : undefined }))} className={inputCls} style={inputStyle} /></Field>
          <Field label="Last updated date (optional)"><input type="date" value={form.lastUpdated ?? ''} onChange={(event) => setForm((current) => ({ ...current, lastUpdated: event.target.value }))} className={inputCls} style={inputStyle} /></Field>
          <div className="sm:col-span-2"><Field label="Tags (optional)" hint="Separate tags with commas."><input value={form.tagsText} onChange={(event) => setForm((current) => ({ ...current, tagsText: event.target.value }))} className={inputCls} style={inputStyle} /></Field></div>
        </div>
        {editing && <p className="mt-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>Current file: {editing.originalFileName}. Use Replace PDF in the library table to upload a replacement.</p>}
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button onClick={closeModal} disabled={busy} className="btn btn-ghost px-4 py-2">Cancel</button>
          {editing ? <button onClick={() => void save(false)} disabled={busy} className="btn btn-primary px-4 py-2">{busy ? 'Saving…' : 'Save details'}</button> : <>
            <button onClick={() => void save(false)} disabled={busy} className="btn btn-ghost px-4 py-2">{busy ? 'Uploading…' : 'Save as Draft'}</button>
            <button onClick={() => void save(true)} disabled={busy} className="btn btn-primary px-4 py-2">{busy ? 'Uploading…' : 'Publish'}</button>
          </>}
        </div>
      </Modal>}
      {previewUrl && <Modal wide title={previewTitle} onClose={() => { URL.revokeObjectURL(previewUrl); setPreviewUrl(''); }}><iframe title={`Preview ${previewTitle}`} src={previewUrl} className="h-[75vh] w-full rounded-lg border" /></Modal>}
      {dialog}
    </AdminPage>
  );
}
