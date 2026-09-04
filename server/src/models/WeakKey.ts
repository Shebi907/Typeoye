import mongoose, { Document, Schema } from 'mongoose';

export const WEAK_KEY_MIN_ATTEMPTS = 20;
export const WEAK_KEY_MIN_ERROR_RATE = 15;

export interface IWeakKey extends Document {
  userId: mongoose.Types.ObjectId; key: string; errorCount: number; totalAttempts: number; errorRate: number;
  lastUpdated: Date; lastMistakeAt?: Date; isWeak: boolean; qualifiedAt?: Date;
}
const weakKeySchema = new Schema<IWeakKey>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, key: { type: String, required: true, maxlength: 1 },
  errorCount: { type: Number, default: 0 }, totalAttempts: { type: Number, default: 0 }, errorRate: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }, lastMistakeAt: { type: Date }, isWeak: { type: Boolean, default: false }, qualifiedAt: { type: Date },
});
weakKeySchema.index({ userId: 1, key: 1 }, { unique: true }); weakKeySchema.index({ userId: 1, isWeak: 1, errorRate: -1 });
export default mongoose.model<IWeakKey>('WeakKey', weakKeySchema);