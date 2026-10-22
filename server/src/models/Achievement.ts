import mongoose, { Document, Schema } from 'mongoose';

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
  condition: { type: string; threshold: number };
  params?: AchievementParams;
  xpReward: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  // Course this achievement belongs to. Existing achievements default to 'en',
  // so the English set is untouched; Urdu achievements are scoped to 'ur' and
  // only ever appear on the Urdu progress page.
  language: 'en' | 'ur';
  isActive: boolean;
  updatedBy?: mongoose.Types.ObjectId;
}

const paramsSchema = new Schema<AchievementParams>(
  {
    minAccuracy: { type: Number },
    minWpm: { type: Number },
    minDuration: { type: Number },
    requiredTests: { type: Number },
  },
  { _id: false }
);

const achievementSchema = new Schema<IAchievement>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    icon: { type: String, required: true },
    condition: {
      type: { type: String, required: true },
      threshold: { type: Number, required: true },
    },
    params: paramsSchema,
    xpReward: { type: Number, required: true },
    rarity: { type: String, enum: ['common', 'rare', 'epic', 'legendary'], required: true },
    language: { type: String, enum: ['en', 'ur'], default: 'en', required: true },
    isActive: { type: Boolean, default: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

achievementSchema.index({ language: 1, isActive: 1 });

export default mongoose.model<IAchievement>('Achievement', achievementSchema);
