import mongoose, { Document, Schema } from 'mongoose';

export interface CertificateParagraphHistoryEntry {
  difficulty: 'easy' | 'medium' | 'hard';
  paragraphId: mongoose.Types.ObjectId;
  usedAt: Date;
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  username: string;
  email: string;
  passwordHash: string;
  authProvider: 'local' | 'google' | 'both';
  role: 'user' | 'admin';
  emailVerified: boolean;
  verificationToken?: string | null;
  verificationTokenExpires?: Date | null;
  securityQuestion?: string | null;
  securityAnswerHash?: string | null;
  recoveryToken?: string | null;
  recoveryTokenExpires?: Date | null;
  recoveryFailedAttempts: number;
  recoveryLockedUntil?: Date | null;
  certificateParagraphHistory: CertificateParagraphHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
      match: /^[a-zA-Z0-9_]+$/,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    authProvider: {
      type: String,
      enum: ['local', 'google', 'both'],
      default: 'local',
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    emailVerified: {
      type: Boolean,
      default: true,
    },
    verificationToken: {
      type: String,
      default: null,
    },
    verificationTokenExpires: {
      type: Date,
      default: null,
    },
    securityQuestion: {
      type: String,
      default: null,
    },
    securityAnswerHash: {
      type: String,
      default: null,
    },
    recoveryToken: {
      type: String,
      default: null,
    },
    recoveryTokenExpires: {
      type: Date,
      default: null,
    },
    recoveryFailedAttempts: {
      type: Number,
      default: 0,
    },
    recoveryLockedUntil: {
      type: Date,
      default: null,
    },
    certificateParagraphHistory: {
      type: [
        new Schema(
          {
            difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
            paragraphId: {
              type: Schema.Types.ObjectId,
              ref: 'CertificateParagraph',
              required: true,
            },
            usedAt: { type: Date, required: true },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', userSchema);
