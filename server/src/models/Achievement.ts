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
    isActive: { type: Boolean, default: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model<IAchievement>('Achievement', achievementSchema);
