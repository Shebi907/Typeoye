import mongoose, { Document } from 'mongoose';
export interface ITypingResult extends Document {
    sessionId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    wpm: number;
    accuracy: number;
    correctWords: number;
    attemptedWords: number;
    errorsCount: number;
    mode: string;
    createdAt: Date;
    certificateParagraphId?: mongoose.Types.ObjectId;
    certificateParagraphText?: string;
}
declare const _default: mongoose.Model<ITypingResult, {}, {}, {}, mongoose.Document<unknown, {}, ITypingResult, {}, {}> & ITypingResult & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=TypingResult.d.ts.map