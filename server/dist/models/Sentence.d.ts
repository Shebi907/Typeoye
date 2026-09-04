import mongoose, { Document } from 'mongoose';
export interface ISentence extends Document {
    text: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    tags: string[];
    updatedBy?: mongoose.Types.ObjectId;
}
declare const _default: mongoose.Model<ISentence, {}, {}, {}, mongoose.Document<unknown, {}, ISentence, {}, {}> & ISentence & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Sentence.d.ts.map