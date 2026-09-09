import mongoose, { Document, Schema } from 'mongoose';

export interface ITypingResult extends Document {
  sessionId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  wpm: number;
  accuracy: number;
  correctWords: number;
  attemptedWords: number;
  errorsCount: number;
  mode: string;
  createdAt: Date;
  certificateParagraphId?: mongoose.Types.ObjectId;
  certificateParagraphText?: string;
}

const typingResultSchema = new Schema<ITypingResult>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: 'TypingSession', required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    wpm: { type: Number, required: true },
    accuracy: { type: Number, required: true },
    correctWords: { type: Number, required: true },
    attemptedWords: { type: Number, required: true },
    errorsCount: { type: Number, required: true },
    mode: { type: String, required: true },
    certificateParagraphId: { type: Schema.Types.ObjectId, ref: 'CertificateParagraph' },
    certificateParagraphText: { type: String, maxlength: 4000 },
  },
  { timestamps: true }
);

typingResultSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<ITypingResult>('TypingResult', typingResultSchema);
