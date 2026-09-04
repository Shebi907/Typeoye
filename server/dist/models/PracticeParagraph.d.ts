import mongoose, { Document } from 'mongoose';
export interface IPracticeParagraph extends Document {
    content: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    topic: string;
    updatedBy?: mongoose.Types.ObjectId;
}
declare const _default: mongoose.Model<IPracticeParagraph, {}, {}, {}, mongoose.Document<unknown, {}, IPracticeParagraph, {}, {}> & IPracticeParagraph & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=PracticeParagraph.d.ts.map