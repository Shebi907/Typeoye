import mongoose, { Document, Schema } from 'mongoose';

export interface IGameResult extends Document {
  userId: mongoose.Types.ObjectId;
  game: 'typingRace' | 'fallingWords' | 'suddenDeath';
  score: number;
  wpm: number;
  accuracy: number;
  duration: number;
  winner?: 'user' | 'opponent';
  opponentWpm?: number;
}

const gameResultSchema = new Schema<IGameResult>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    game: { type: String, enum: ['typingRace', 'fallingWords', 'suddenDeath'], required: true },
    score: { type: Number, required: true },
    wpm: { type: Number, required: true },
    accuracy: { type: Number, required: true },
    duration: { type: Number, required: true },
    winner: { type: String, enum: ['user', 'opponent'] },
    opponentWpm: { type: Number },
  },
  { timestamps: true }
);

gameResultSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<IGameResult>('GameResult', gameResultSchema);
