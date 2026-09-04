import mongoose, { Document, Schema } from 'mongoose';

export interface IStreakHistory {
  date: Date;
  sessionCount: number;
}

export interface IStreak extends Document {
  userId: mongoose.Types.ObjectId;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate?: Date;
  streakHistory: IStreakHistory[];
}

const streakSchema = new Schema<IStreak>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActiveDate: { type: Date },
    streakHistory: [
      {
        date: { type: Date },
        sessionCount: { type: Number, default: 1 },
        _id: false,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model<IStreak>('Streak', streakSchema);
