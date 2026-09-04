import mongoose, { Document, Schema } from 'mongoose';

export interface ISentence extends Document {
  text: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  updatedBy?: mongoose.Types.ObjectId;
}

const sentenceSchema = new Schema<ISentence>(
  {
    text: { type: String, required: true, unique: true, trim: true },
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    tags: [{ type: String, trim: true }],
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

sentenceSchema.index({ difficulty: 1 });
export default mongoose.model<ISentence>('Sentence', sentenceSchema);