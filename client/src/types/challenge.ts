export type ChallengeStatus = 'WAITING' | 'PLAYER_JOINED' | 'READY' | 'RUNNING' | 'COMPLETED' | 'EXPIRED';

export interface ChallengePlayerStats {
  wpm: number;
  accuracy: number;
  correctWords: number;
  attemptedWords: number;
  errorsCount: number;
}

export interface ChallengePlayerView {
  slot: 'player1' | 'player2';
  userId: string;
  username: string;
  ready: boolean;
  connected: boolean;
  rematchReady: boolean;
  stats: ChallengePlayerStats | null;
}

export interface ChallengePublic {
  code: string;
  status: ChallengeStatus;
  round: number;
  durationSeconds: number;
  startAt: string | null;
  text: string;
  winner: 'player1' | 'player2' | 'draw' | null;
  players: ChallengePlayerView[];
  me: 'player1' | 'player2' | null;
  createdAt: string;
  expiresAt: string;
}

export interface ChallengeState {
  challenge: ChallengePublic | null;
  opponentProgress: {
    userId: string;
    username: string;
    correct: number;
    attempted: number;
    wpm: number;
    accuracy: number;
    progress: number;
  } | null;
  countdownMs: number;
  phase: 'idle' | 'countdown' | 'typing' | 'finished' | 'error';
  error: string | null;
}