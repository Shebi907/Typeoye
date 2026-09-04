import mongoose, { Document, Schema } from 'mongoose';

export interface ITestParagraph extends Document {
  content: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  topic: string;
  updatedBy?: mongoose.Types.ObjectId;
}

const testParagraphSchema = new Schema<ITestParagraph>({
  content: { type: String, required: true, trim: true, unique: true },
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], required: true },
  topic: { type: String, required: true, trim: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

testParagraphSchema.index({ difficulty: 1 });
export default mongoose.model<ITestParagraph>('TestParagraph', testParagraphSchema);