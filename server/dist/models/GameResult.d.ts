import mongoose, { Document } from 'mongoose';
export interface IGameResult extends Document {
    userId: mongoose.Types.ObjectId;
    game: 'typingRace' | 'fallingWords' | 'suddenDeath';
    score: number;
    wpm: number;
    accuracy: number;
    duration: number;
    winner?: 'user' | 'opponent';
    opponentWpm?: number;
}
declare const _default: mongoose.Model<IGameResult, {}, {}, {}, mongoose.Document<unknown, {}, IGameResult, {}, {}> & IGameResult & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=GameResult.d.ts.map