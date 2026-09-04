import mongoose, { Document } from 'mongoose';
export interface ITestParagraph extends Document {
    content: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    topic: string;
    updatedBy?: mongoose.Types.ObjectId;
}
declare const _default: mongoose.Model<ITestParagraph, {}, {}, {}, mongoose.Document<unknown, {}, ITestParagraph, {}, {}> & ITestParagraph & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=TestParagraph.d.ts.map