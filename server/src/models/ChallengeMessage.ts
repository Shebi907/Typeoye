import mongoose, { Document, Schema, Types } from 'mongoose';

export type ChallengeChatMessageType = 'text' | 'reaction' | 'sticker';

export interface IChallengeMessage extends Document {
  challengeId: Types.ObjectId;
  round: number;
  senderId: Types.ObjectId;
  type: ChallengeChatMessageType;
  message: string;
  createdAt: Date;
}

const challengeMessageSchema = new Schema<IChallengeMessage>(
  {
    challengeId: { type: Schema.Types.ObjectId, ref: 'Challenge', required: true, index: true },
    round: { type: Number, required: true, min: 1 },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['text', 'reaction', 'sticker'], default: 'text' },
    message: { type: String, required: true, maxlength: 300 },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

challengeMessageSchema.index({ challengeId: 1, round: 1, createdAt: 1 });

export default mongoose.model<IChallengeMessage>('ChallengeMessage', challengeMessageSchema);