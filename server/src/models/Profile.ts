import mongoose, { Document, Schema } from 'mongoose';

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

const profileSchema = new Schema<IProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    displayName: { type: String, required: true, trim: true, maxlength: 50 },
    avatarUrl: { type: String },
    bio: { type: String, maxlength: 300 },
    level: { type: Number, default: 1, min: 1 },
    levelTitle: { type: String, default: 'Typing Beginner' },
    totalXP: { type: Number, default: 0, min: 0 },
    badges: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.model<IProfile>('Profile', profileSchema);
