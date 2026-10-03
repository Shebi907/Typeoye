export type ChallengeStatus = 'WAITING' | 'PLAYER_JOINED' | 'READY' | 'RUNNING' | 'COMPLETED' | 'EXPIRED';

/** `opponent_left` is a NO CONTEST: the room is COMPLETED but `winner` is null,
    because the leaver is never a winner and never makes anyone else one. */
export type ChallengeEndReason = 'completed' | 'abandoned' | 'expired' | 'opponent_left';

// Authoritative server-side presence: online (connected), offline (dropped but
// still within the reconnection grace window) or left (permanently gone).
export type PlayerPresence = 'online' | 'offline' | 'left';

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
  presence: PlayerPresence;
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
  endedBy: ChallengeEndReason | null;
  abandonedBy: 'player1' | 'player2' | null;
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