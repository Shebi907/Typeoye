import mongoose, { Document, Schema } from 'mongoose';

export interface ITypedWord {
  word: string;
  typed: string;
  correct: boolean;
  timeTakenMs: number;
}

export interface ITypingSession extends Document {
  userId: mongoose.Types.ObjectId;
  mode: 'test' | 'practice' | 'lesson' | 'game';
  startTime: Date;
  endTime: Date;
  durationSeconds: number;
  typedWords: ITypedWord[];
  textSource: 'generated' | 'lesson' | 'custom';
  exerciseId?: mongoose.Types.ObjectId;
  clientWpm: number;
  clientAccuracy: number;
  certificateParagraphId?: mongoose.Types.ObjectId;
  certificateParagraphText?: string;
}

const typedWordSchema = new Schema<ITypedWord>(
  {
    word: { type: String, required: true },
    typed: { type: String, required: true },
    correct: { type: Boolean, required: true },
    timeTakenMs: { type: Number, required: true },
  },
  { _id: false }
);

const typingSessionSchema = new Schema<ITypingSession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    mode: { type: String, enum: ['test', 'practice', 'lesson', 'game'], required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    durationSeconds: { type: Number, required: true },
    typedWords: [typedWordSchema],
    textSource: { type: String, enum: ['generated', 'lesson', 'custom'], required: true },
    exerciseId: { type: Schema.Types.ObjectId, ref: 'Exercise' },
    clientWpm: { type: Number, default: 0 },
    clientAccuracy: { type: Number, default: 0 },
    certificateParagraphId: { type: Schema.Types.ObjectId, ref: 'CertificateParagraph' },
    certificateParagraphText: { type: String, maxlength: 4000 },
  },
  { timestamps: true }
);

typingSessionSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<ITypingSession>('TypingSession', typingSessionSchema);
