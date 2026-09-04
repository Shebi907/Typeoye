import mongoose, { Document } from 'mongoose';
export interface ITypedWord {
    word: string;
    typed: string;
    correct: boolean;
    timeTakenMs: number;
}
export interface ITypingSession extends Document {
    userId: mongoose.Types.ObjectId;
    mode: 'test' | 'practice' | 'lesson' | 'game';
    startTime: Date;
    endTime: Date;
    durationSeconds: number;
    typedWords: ITypedWord[];
    textSource: 'generated' | 'lesson' | 'custom';
    exerciseId?: mongoose.Types.ObjectId;
    clientWpm: number;
    clientAccuracy: number;
}
declare const _default: mongoose.Model<ITypingSession, {}, {}, {}, mongoose.Document<unknown, {}, ITypingSession, {}, {}> & ITypingSession & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=TypingSession.d.ts.map