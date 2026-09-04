import mongoose, { Document, Schema } from 'mongoose';

export interface ILesson extends Document {
  title: string;
  description: string;
  category: string;
  difficulty: number;
  order: number;
  isActive: boolean;
  accuracyThreshold: number;
  targetKeys: string[];
  updatedBy?: mongoose.Types.ObjectId;
}

const lessonSchema = new Schema<ILesson>({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  difficulty: { type: Number, required: true, min: 1, max: 9 },
  order: { type: Number, required: true, unique: true },
  isActive: { type: Boolean, default: true },
  accuracyThreshold: { type: Number, default: 90, min: 1, max: 100 },
  targetKeys: [{ type: String }],
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.model<ILesson>('Lesson', lessonSchema);