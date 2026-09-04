import mongoose, { Document, Schema } from 'mongoose';

export interface IUserProgress extends Document {
  userId: mongoose.Types.ObjectId;
  completedLessons: mongoose.Types.ObjectId[];
  completedExercises: mongoose.Types.ObjectId[];
  currentLesson?: mongoose.Types.ObjectId;
  totalSessions: number;
  bestWpm: number;
  avgWpm: number;
  avgAccuracy: number;
  totalMinutesPracticed: number;
}

const userProgressSchema = new Schema<IUserProgress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    completedLessons: [{ type: Schema.Types.ObjectId, ref: 'Lesson' }],
    completedExercises: [{ type: Schema.Types.ObjectId, ref: 'Exercise' }],
    currentLesson: { type: Schema.Types.ObjectId, ref: 'Lesson' },
    totalSessions: { type: Number, default: 0 },
    bestWpm: { type: Number, default: 0 },
    avgWpm: { type: Number, default: 0 },
    avgAccuracy: { type: Number, default: 0 },
    totalMinutesPracticed: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<IUserProgress>('UserProgress', userProgressSchema);
