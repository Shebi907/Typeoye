import mongoose, { Document } from 'mongoose';
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
declare const _default: mongoose.Model<IUserProgress, {}, {}, {}, mongoose.Document<unknown, {}, IUserProgress, {}, {}> & IUserProgress & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=UserProgress.d.ts.map