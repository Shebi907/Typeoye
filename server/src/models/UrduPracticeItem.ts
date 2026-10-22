import mongoose, { Document, Schema } from 'mongoose';

export type UrduPracticeCategory =
  | 'characters'
  | 'combinations'
  | 'words'
  | 'sentences'
  | 'paragraphs';
export type UrduPracticeDifficulty = 'easy' | 'medium' | 'hard';

export interface IUrduPracticeItem extends Document {
  category: UrduPracticeCategory;
  difficulty: UrduPracticeDifficulty;
  text: string;
  order: number;
  isActive: boolean;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Admin-managed content for every Urdu Practice category that has a curated
 * pool (characters, combinations, words, sentences, paragraphs). "custom" is
 * user-supplied at runtime, so it is intentionally not stored here.
 *
 * Items are ordered within their (category, difficulty) scope so admins can
 * organise the stream. Draft/publish is handled with `isActive`.
 */
const urduPracticeItemSchema = new Schema<IUrduPracticeItem>(
  {
    category: {
      type: String,
      enum: ['characters', 'combinations', 'words', 'sentences', 'paragraphs'],
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 2000,
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

urduPracticeItemSchema.index({ category: 1, difficulty: 1, text: 1 }, { unique: true });
urduPracticeItemSchema.index({ category: 1, difficulty: 1, isActive: 1, order: 1 });

export default mongoose.model<IUrduPracticeItem>('UrduPracticeItem', urduPracticeItemSchema);
