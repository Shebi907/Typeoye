import mongoose, { Document, Schema } from 'mongoose';

export type LessonLanguage = 'en' | 'ur';

export interface ILesson extends Document {
  title: string;
  titleEn?: string;
  description: string;
  category: string;
  language: LessonLanguage;
  difficulty: number;
  order: number;
  isActive: boolean;
  accuracyThreshold: number;
  targetKeys: string[];
  updatedBy?: mongoose.Types.ObjectId;
}

const lessonSchema = new Schema<ILesson>({
  title: { type: String, required: true, trim: true },
  titleEn: { type: String, trim: true },
  description: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  // Course language. English and Urdu are fully independent courses: each has
  // its own 1..16 `order` sequence, so uniqueness is scoped per language.
  language: { type: String, enum: ['en', 'ur'], default: 'en', required: true },
  difficulty: { type: Number, required: true, min: 1, max: 9 },
  order: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
  accuracyThreshold: { type: Number, default: 90, min: 1, max: 100 },
  targetKeys: [{ type: String }],
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

lessonSchema.index({ language: 1, order: 1 }, { unique: true });

export default mongoose.model<ILesson>('Lesson', lessonSchema);