import mongoose, { Document, Schema } from 'mongoose';

export interface IWord extends Document {
  text: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  updatedBy?: mongoose.Types.ObjectId;
}

const wordSchema = new Schema<IWord>(
  {
    text: { type: String, required: true, unique: true, trim: true, lowercase: true },
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    tags: [{ type: String, trim: true }],
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

wordSchema.index({ difficulty: 1 });
export default mongoose.model<IWord>('Word', wordSchema);