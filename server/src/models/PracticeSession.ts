import mongoose, { Document, Schema } from 'mongoose';

export interface IPracticeSession extends Document {
  userId: mongoose.Types.ObjectId; sessionId: mongoose.Types.ObjectId; wordList: string[]; focusKeys: string[]; difficulty: number;
  exerciseType: string; durationSeconds: number; accuracy: number; wpm: number; mistakes: number;
}
const practiceSessionSchema = new Schema<IPracticeSession>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, sessionId: { type: Schema.Types.ObjectId, ref: 'TypingSession', required: true },
  wordList: [{ type: String }], focusKeys: [{ type: String }], difficulty: { type: Number, min: 1, max: 3, default: 1 },
  exerciseType: { type: String, required: true }, durationSeconds: { type: Number, required: true }, accuracy: { type: Number, required: true }, wpm: { type: Number, required: true }, mistakes: { type: Number, required: true },
}, { timestamps: true });
practiceSessionSchema.index({ userId: 1, createdAt: -1 });
export default mongoose.model<IPracticeSession>('PracticeSession', practiceSessionSchema);