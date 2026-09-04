import mongoose, { Document } from 'mongoose';
export interface IUserAchievement extends Document {
    userId: mongoose.Types.ObjectId;
    achievementId: mongoose.Types.ObjectId;
    unlockedAt: Date;
    progress: number;
    isNewlyEarned: boolean;
}
declare const _default: mongoose.Model<IUserAchievement, {}, {}, {}, mongoose.Document<unknown, {}, IUserAchievement, {}, {}> & IUserAchievement & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=UserAchievement.d.ts.map