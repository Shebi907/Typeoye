import mongoose, { Document, Schema } from 'mongoose';

export type CertificateParagraphDifficulty = 'easy' | 'medium' | 'hard';

export interface ICertificateParagraph extends Document {
  content: string;
  difficulty: CertificateParagraphDifficulty;
  isActive: boolean;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const certificateParagraphSchema = new Schema<ICertificateParagraph>(
  {
    content: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 10,
      maxlength: 5000,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
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

certificateParagraphSchema.index({ difficulty: 1, isActive: 1 });

export default mongoose.model<ICertificateParagraph>('CertificateParagraph', certificateParagraphSchema);