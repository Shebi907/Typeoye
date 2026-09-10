import mongoose, { Document } from 'mongoose';
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
declare const _default: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}, {}> & IUser & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=User.d.ts.map