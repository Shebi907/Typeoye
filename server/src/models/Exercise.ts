import mongoose, { Document, Schema } from 'mongoose';
import type { LessonLanguage } from './Lesson';

export interface IExercise extends Document {
  lessonId: mongoose.Types.ObjectId;
  title: string;
  type: 'keys' | 'words' | 'sentences' | 'paragraph' | 'custom';
  language: LessonLanguage;
  level: number;
  content: string;
  variants: string[];
  targetKeys: string[];
  difficulty: number;
  order: number;
  isActive: boolean;
  updatedBy?: mongoose.Types.ObjectId;
}

const exerciseSchema = new Schema<IExercise>({
  lessonId: { type: Schema.Types.ObjectId, ref: 'Lesson', required: true },
  title: { type: String, required: true, trim: true },
  type: { type: String, enum: ['keys', 'words', 'sentences', 'paragraph', 'custom'], required: true },
  language: { type: String, enum: ['en', 'ur'], default: 'en' },
  level: { type: Number, required: true, min: 1, max: 16, default: 1 },
  content: { type: String, required: true },
  variants: [{ type: String }],
  targetKeys: [{ type: String }],
  difficulty: { type: Number, required: true, min: 1, max: 16 },
  order: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

exerciseSchema.index({ lessonId: 1, order: 1 });
export default mongoose.model<IExercise>('Exercise', exerciseSchema);