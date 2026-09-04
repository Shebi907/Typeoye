import mongoose, { Document } from 'mongoose';
export interface ILesson extends Document {
    title: string;
    description: string;
    category: string;
    difficulty: number;
    order: number;
    isActive: boolean;
    accuracyThreshold: number;
    targetKeys: string[];
    updatedBy?: mongoose.Types.ObjectId;
}
declare const _default: mongoose.Model<ILesson, {}, {}, {}, mongoose.Document<unknown, {}, ILesson, {}, {}> & ILesson & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Lesson.d.ts.map