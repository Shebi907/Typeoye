import mongoose, { Document } from 'mongoose';
export interface IWord extends Document {
    text: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    tags: string[];
    updatedBy?: mongoose.Types.ObjectId;
}
declare const _default: mongoose.Model<IWord, {}, {}, {}, mongoose.Document<unknown, {}, IWord, {}, {}> & IWord & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Word.d.ts.map