import mongoose, { Document } from 'mongoose';
export declare const WEAK_KEY_MIN_ATTEMPTS = 20;
export declare const WEAK_KEY_MIN_ERROR_RATE = 15;
export interface IWeakKey extends Document {
    userId: mongoose.Types.ObjectId;
    key: string;
    errorCount: number;
    totalAttempts: number;
    errorRate: number;
    lastUpdated: Date;
    lastMistakeAt?: Date;
    isWeak: boolean;
    qualifiedAt?: Date;
}
declare const _default: mongoose.Model<IWeakKey, {}, {}, {}, mongoose.Document<unknown, {}, IWeakKey, {}, {}> & IWeakKey & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=WeakKey.d.ts.map