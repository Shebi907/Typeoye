import mongoose, { Document } from 'mongoose';
export type CertificateParagraphDifficulty = 'easy' | 'medium' | 'hard';
export interface ICertificateParagraph extends Document {
    content: string;
    difficulty: CertificateParagraphDifficulty;
    isActive: boolean;
    updatedBy?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<ICertificateParagraph, {}, {}, {}, mongoose.Document<unknown, {}, ICertificateParagraph, {}, {}> & ICertificateParagraph & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=CertificateParagraph.d.ts.map