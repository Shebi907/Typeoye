import mongoose, { Document } from 'mongoose';
export interface AchievementParams {
    minAccuracy?: number;
    minWpm?: number;
    minDuration?: number;
    requiredTests?: number;
}
export interface IAchievement extends Document {
    name: string;
    description: string;
    icon: string;
    condition: {
        type: string;
        threshold: number;
    };
    params?: AchievementParams;
    xpReward: number;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    isActive: boolean;
    updatedBy?: mongoose.Types.ObjectId;
}
declare const _default: mongoose.Model<IAchievement, {}, {}, {}, mongoose.Document<unknown, {}, IAchievement, {}, {}> & IAchievement & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Achievement.d.ts.map