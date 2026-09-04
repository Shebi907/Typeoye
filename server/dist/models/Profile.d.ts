import mongoose, { Document } from 'mongoose';
export interface IProfile extends Document {
    userId: mongoose.Types.ObjectId;
    displayName: string;
    avatarUrl?: string;
    bio?: string;
    level: number;
    levelTitle: string;
    totalXP: number;
    badges: string[];
}
declare const _default: mongoose.Model<IProfile, {}, {}, {}, mongoose.Document<unknown, {}, IProfile, {}, {}> & IProfile & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Profile.d.ts.map