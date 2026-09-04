import mongoose, { Document } from 'mongoose';
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
declare const _default: mongoose.Model<IStreak, {}, {}, {}, mongoose.Document<unknown, {}, IStreak, {}, {}> & IStreak & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Streak.d.ts.map