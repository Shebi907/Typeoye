import mongoose, { Document, Schema, Types } from 'mongoose';

export type ChallengeStatus = 'WAITING' | 'PLAYER_JOINED' | 'READY' | 'RUNNING' | 'COMPLETED' | 'EXPIRED';

export interface ChallengeTypedWord {
  word: string;
  typed: string;
  correct: boolean;
  timeTakenMs: number;
}

export interface ChallengePlayerStats {
  typedWords: ChallengeTypedWord[];
  wpm: number;
  accuracy: number;
  correctWords: number;
  attemptedWords: number;
  errorsCount: number;
  submittedAt: Date;
}

export interface ChallengePlayer {
  userId: Types.ObjectId;
  username: string;
  ready: boolean;
  connected: boolean;
  joinedAt: Date;
  readyAt?: Date;
  rematchReady: boolean;
  disconnectedAt: Date | null;
  stats: ChallengePlayerStats | null;
}

/**
 * How a race ended.
 *  - completed      : normal finish, a winner is recorded
 *  - abandoned      : one player stopped submitting (timer forfeit), winner recorded
 *  - expired        : nobody raced, no contest
 *  - opponent_left  : NO CONTEST because the other player left mid-race. A
 *                     leaver never wins and is never beaten: `winner` stays null.
 */
export type ChallengeEndReason = 'completed' | 'abandoned' | 'expired' | 'opponent_left';

export interface IChallenge extends Document {
  code: string;
  status: ChallengeStatus;
  round: number;
  player1: ChallengePlayer;
  player2: ChallengePlayer | null;
  text: string;
  paragraphIds: Types.ObjectId[];
  durationSeconds: number;
  startAt: Date | null;
  winner: 'player1' | 'player2' | 'draw' | null;
  endedBy: ChallengeEndReason | null;
  abandonedBy: 'player1' | 'player2' | null;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

const typedWordSchema = new Schema<ChallengeTypedWord>(
  {
    word: { type: String, required: true },
    typed: { type: String, default: '' },
    correct: { type: Boolean, required: true },
    timeTakenMs: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const statsSchema = new Schema<ChallengePlayerStats>(
  {
    typedWords: { type: [typedWordSchema], default: [] },
    wpm: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    correctWords: { type: Number, default: 0 },
    attemptedWords: { type: Number, default: 0 },
    errorsCount: { type: Number, default: 0 },
    submittedAt: { type: Date, required: true },
  },
  { _id: false }
);

const playerSchema = new Schema<ChallengePlayer>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true, trim: true },
    ready: { type: Boolean, default: false },
    connected: { type: Boolean, default: true },
    joinedAt: { type: Date, default: Date.now },
    readyAt: { type: Date },
    rematchReady: { type: Boolean, default: false },
    disconnectedAt: { type: Date, default: null },
    stats: { type: statsSchema, default: null },
  },
  { _id: false }
);

const challengeSchema = new Schema<IChallenge>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, match: /^TY-[A-Z0-9]{5}$/ },
    status: {
      type: String,
      enum: ['WAITING', 'PLAYER_JOINED', 'READY', 'RUNNING', 'COMPLETED', 'EXPIRED'],
      default: 'WAITING',
    },
    player1: { type: playerSchema, required: true },
    player2: { type: playerSchema, default: null },
    round: { type: Number, default: 1, min: 1 },
    text: { type: String, required: true, maxlength: 4000 },
    paragraphIds: { type: [Schema.Types.ObjectId], ref: 'TestParagraph', default: [] },
    durationSeconds: { type: Number, required: true, min: 30, max: 300 },
    startAt: { type: Date, default: null },
    winner: { type: String, enum: ['player1', 'player2', 'draw', null], default: null },
    endedBy: { type: String, enum: ['completed', 'abandoned', 'expired', 'opponent_left', null], default: null },
    abandonedBy: { type: String, enum: ['player1', 'player2', null], default: null },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

challengeSchema.index({ status: 1, expiresAt: 1 });
challengeSchema.index({ 'player1.userId': 1 });
challengeSchema.index({ 'player2.userId': 1 });

export default mongoose.model<IChallenge>('Challenge', challengeSchema);