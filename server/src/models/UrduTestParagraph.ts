import mongoose, { Document, Schema } from 'mongoose';

export type UrduTestDifficulty = 'easy' | 'medium' | 'hard';
export type UrduTestDuration = 1 | 2 | 5;

export interface IUrduTestParagraph extends Document {
  content: string;
  difficulty: UrduTestDifficulty;
  duration: UrduTestDuration;
  isActive: boolean;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Admin-managed passages for the Urdu Typing Test. Mirrors CertificateParagraph
 * (draft/publish via `isActive`) but adds the `duration` bucket (1/2/5 minutes)
 * the Urdu test selector filters on alongside difficulty.
 */
const urduTestParagraphSchema = new Schema<IUrduTestParagraph>(
  {
    content: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 5,
      maxlength: 5000,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      required: true,
    },
    duration: {
      type: Number,
      enum: [1, 2, 5],
      required: true,
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

urduTestParagraphSchema.index({ difficulty: 1, duration: 1, isActive: 1 });

export default mongoose.model<IUrduTestParagraph>('UrduTestParagraph', urduTestParagraphSchema);
