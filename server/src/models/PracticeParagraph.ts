import mongoose, { Document, Schema } from 'mongoose';
export interface IPracticeParagraph extends Document {
  content: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  topic: string;
  updatedBy?: mongoose.Types.ObjectId;
}
const schema = new Schema<IPracticeParagraph>(
  { content: { type: String, required: true, unique: true }, difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], required: true }, topic: { type: String, required: true }, updatedBy: { type: Schema.Types.ObjectId, ref: 'User' } },
  { timestamps: true }
);
schema.index({ difficulty: 1 });
export default mongoose.model<IPracticeParagraph>('PracticeParagraph', schema);