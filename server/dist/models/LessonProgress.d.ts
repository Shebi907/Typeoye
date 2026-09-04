import mongoose, { Document } from 'mongoose';
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
declare const _default: mongoose.Model<ILessonProgress, {}, {}, {}, mongoose.Document<unknown, {}, ILessonProgress, {}, {}> & ILessonProgress & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=LessonProgress.d.ts.map