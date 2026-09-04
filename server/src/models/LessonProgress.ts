import mongoose, { Document, Schema } from 'mongoose';

interface IExerciseAttempt {
  exerciseId: mongoose.Types.ObjectId;
  bestAccuracy: number;
  attempts: number;
  timeSpentSeconds: number;
  lastPracticed: Date;
  seenVariantIndices: number[];
}

export interface ILessonProgress extends Document {
  userId: mongoose.Types.ObjectId;
  lessonId: mongoose.Types.ObjectId;
  completedExerciseIds: mongoose.Types.ObjectId[];
  exercises: IExerciseAttempt[];
  bestAccuracy: number;
  attempts: number;
  timeSpentSeconds: number;
  lastPracticed: Date;
  completedAt?: Date;
}

const exerciseAttemptSchema = new Schema<IExerciseAttempt>({
  exerciseId: { type: Schema.Types.ObjectId, ref: 'Exercise', required: true },
  bestAccuracy: { type: Number, default: 0 },
  attempts: { type: Number, default: 0 },
  timeSpentSeconds: { type: Number, default: 0 },
  lastPracticed: { type: Date, required: true },
  seenVariantIndices: [{ type: Number }],
}, { _id: false });

const lessonProgressSchema = new Schema<ILessonProgress>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  lessonId: { type: Schema.Types.ObjectId, ref: 'Lesson', required: true },
  completedExerciseIds: [{ type: Schema.Types.ObjectId, ref: 'Exercise' }],
  exercises: [exerciseAttemptSchema],
  bestAccuracy: { type: Number, default: 0 },
  attempts: { type: Number, default: 0 },
  timeSpentSeconds: { type: Number, default: 0 },
  lastPracticed: { type: Date, default: Date.now },
  completedAt: { type: Date },
}, { timestamps: true });

lessonProgressSchema.index({ userId: 1, lessonId: 1 }, { unique: true });
export default mongoose.model<ILessonProgress>('LessonProgress', lessonProgressSchema);