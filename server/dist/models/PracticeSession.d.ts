import mongoose, { Document } from 'mongoose';
export interface IPracticeSession extends Document {
    userId: mongoose.Types.ObjectId;
    sessionId: mongoose.Types.ObjectId;
    wordList: string[];
    focusKeys: string[];
    difficulty: number;
    exerciseType: string;
    durationSeconds: number;
    accuracy: number;
    wpm: number;
    mistakes: number;
}
declare const _default: mongoose.Model<IPracticeSession, {}, {}, {}, mongoose.Document<unknown, {}, IPracticeSession, {}, {}> & IPracticeSession & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=PracticeSession.d.ts.map