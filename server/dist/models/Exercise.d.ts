import mongoose, { Document } from 'mongoose';
export interface IExercise extends Document {
    lessonId: mongoose.Types.ObjectId;
    title: string;
    type: 'keys' | 'words' | 'sentences' | 'paragraph' | 'custom';
    language: 'en';
    level: number;
    content: string;
    variants: string[];
    targetKeys: string[];
    difficulty: number;
    order: number;
    isActive: boolean;
    updatedBy?: mongoose.Types.ObjectId;
}
declare const _default: mongoose.Model<IExercise, {}, {}, {}, mongoose.Document<unknown, {}, IExercise, {}, {}> & IExercise & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Exercise.d.ts.map