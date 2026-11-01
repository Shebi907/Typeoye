import mongoose, { Document, Schema } from 'mongoose';

export const KEYBOARD_SHORTCUT_CATEGORIES = [
  'Microsoft Office',
  'Google Workspace',
  'Operating System',
  'Development Tools',
  'Other',
] as const;
export type KeyboardShortcutCategory = (typeof KEYBOARD_SHORTCUT_CATEGORIES)[number];

export interface IKeyboardShortcutPdf extends Document {
  applicationName: string;
  title: string;
  slug: string;
  description: string;
  category: KeyboardShortcutCategory;
  language: string;
  tags: string[];
  filePath: string;
  originalFileName: string;
  storedFileName: string;
  fileSize: number;
  pageCount?: number;
  version?: string;
  source?: string;
  lastUpdated?: Date;
  uploadedBy: mongoose.Types.ObjectId;
  uploadedAt: Date;
  updatedAt: Date;
  published: boolean;
  publishedAt?: Date;
}

const schema = new Schema<IKeyboardShortcutPdf>(
  {
    applicationName: { type: String, required: true, trim: true, maxlength: 120 },
    title: { type: String, required: true, trim: true, maxlength: 180 },
    slug: { type: String, required: true, unique: true, trim: true, maxlength: 180 },
    description: { type: String, required: true, trim: true, maxlength: 600 },
    category: { type: String, required: true, enum: KEYBOARD_SHORTCUT_CATEGORIES },
    language: { type: String, required: true, trim: true, maxlength: 60 },
    tags: { type: [String], default: [] },
    filePath: { type: String, required: true, unique: true },
    originalFileName: { type: String, required: true, maxlength: 180 },
    storedFileName: { type: String, required: true, unique: true },
    fileSize: { type: Number, required: true, min: 1 },
    pageCount: { type: Number, min: 1 },
    version: { type: String, trim: true, maxlength: 60 },
    source: { type: String, trim: true, maxlength: 160 },
    lastUpdated: { type: Date },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    uploadedAt: { type: Date, default: Date.now },
    published: { type: Boolean, default: false, index: true },
    publishedAt: { type: Date },
  },
  { timestamps: { createdAt: 'uploadedAt', updatedAt: 'updatedAt' } }
);

schema.index({ published: 1, category: 1, applicationName: 1 });
schema.index({ slug: 1 }, { unique: true });

export default mongoose.model<IKeyboardShortcutPdf>('KeyboardShortcutPdf', schema);
