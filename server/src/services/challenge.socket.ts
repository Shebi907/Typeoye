import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { env } from '../config/env';
import { verifyToken } from '../utils/jwt';
import User from '../models/User';
import Challenge from '../models/Challenge';
import {
  loadChallengeOrThrow,
  leaveChallenge,
  markConnected,
  markDisconnected,
  toPublic,
  challengeRoom,
  playerSlotOf,
} from './challenge.service';

let io: Server | null = null;

export function getIO(): Server | null {
  return io;
}

export function emitToChallenge(code: string, event: string, data: unknown): void {
  if (io) io.to(challengeRoom(code)).emit(event, data);
}

function socketUserId(socket: Socket): string {
  return (socket as any).data.userId as string;
}

function toNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function attachChallengeSocket(server: ReturnType<typeof createServer>): void {
  io = new Server(server, {
    cors: {
      origin: env.CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.use(async (socket, next) => {
    try {
      const token = (socket.handshake.auth as Record<string, string | undefined>)?.token
        ?? (socket.handshake.query as Record<string, string | undefined>)?.token;
      if (!token) return next(new Error('No token provided'));
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.userId).select('_id username').lean();
      if (!user) return next(new Error('User not found'));
      (socket as any).data.userId = user._id.toString();
      (socket as any).data.username = user.username;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    let currentCode: string | null = null;

    socket.on(
      'challenge:join',
      async (payload: { code?: string }, ack?: (res: { ok: boolean; error?: string }) => void) => {
        try {
          const code = typeof payload?.code === 'string' ? payload.code.trim().toUpperCase() : null;
          if (!code) { ack?.({ ok: false, error: 'Missing code.' }); return; }
          const challenge = await loadChallengeOrThrow(code);
          const userId = socketUserId(socket);
          if (!playerSlotOf(challenge, userId)) {
            ack?.({ ok: false, error: 'Not a participant.' }); return;
          }
          // (Re)joining the room restores the connected flag — required so a
          // brief network drop + reconnect resumes cleanly during the lobby,
          // ready state and the running challenge.
          const updated = await markConnected(challenge, userId);
          socket.join(challengeRoom(code));
          currentCode = code;
          const publicChallenge = toPublic(updated, userId);
          emitToChallenge(code, 'challenge:state', { challenge: publicChallenge });
          ack?.({ ok: true });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to join.';
          ack?.({ ok: false, error: message });
        }
      }
    );

    socket.on(
      'challenge:progress',
      async (payload: { correct?: number; attempted?: number; errors?: number; typedChars?: number; wpm?: number; accuracy?: number; progress?: number; round?: number }) => {
        if (!currentCode || !payload) return;
        const round = toNumber(payload.round, 0);
        // Authoritative gate: only forward progress for the round that is
        // CURRENTLY running. Stale events (previous round, or a round that is
        // still in the lobby) are dropped before they can reach the opponent.
        try {
          const state = await Challenge.findOne({ code: currentCode }).select('status round').lean();
          if (!state || state.status !== 'RUNNING' || state.round !== round) return;
        } catch {
          return;
        }
        const progress = {
          userId: socketUserId(socket),
          username: (socket as any).data.username as string,
          round,
          correct: toNumber(payload.correct, 0),
          attempted: toNumber(payload.attempted, 0),
          errors: toNumber(payload.errors, 0),
          typedChars: toNumber(payload.typedChars, 0),
          wpm: toNumber(payload.wpm, 0),
          accuracy: toNumber(payload.accuracy, 100),
          progress: toNumber(payload.progress, 0),
        };
        // Exclude the sender: only the OPPONENT needs this broadcast, so a
        // player's own keystrokes can never overwrite their opponent's stats.
        io?.to(challengeRoom(currentCode)).except(socket.id).emit('challenge:opponentProgress', progress);
      }
    );

    socket.on('challenge:leave', async (payload: { code?: string }) => {
      const code = payload?.code?.trim().toUpperCase() ?? currentCode;
      if (!code) return;
      socket.leave(challengeRoom(code));
      try {
        const challenge = await loadChallengeOrThrow(code);
        if (playerSlotOf(challenge, socketUserId(socket))) {
          const updated = await leaveChallenge(challenge, socketUserId(socket));
          emitToChallenge(code, 'challenge:opponentLeft', {
            challenge: toPublic(updated),
            message: 'Your opponent has left the challenge.',
          });
        }
      } catch {
        // ignore
      }
      currentCode = null;
    });

    socket.on('disconnect', async () => {
      const code = currentCode;
      currentCode = null;
      if (!code) return;
      try {
        const challenge = await loadChallengeOrThrow(code);
        if (playerSlotOf(challenge, socketUserId(socket))) {
          // A dropped connection is NOT an intentional leave: keep the room
          // alive so the player can rejoin and resume. Explicit exits go
          // through 'challenge:leave', which expires the lobby as before.
          const updated = await markDisconnected(challenge, socketUserId(socket));
          emitToChallenge(code, 'challenge:state', { challenge: toPublic(updated, socketUserId(socket)) });
        }
      } catch {
        // ignore
      }
    });
  });

  setInterval(() => {
    void (async () => {
      try {
        await Challenge.updateMany(
          { status: { $in: ['WAITING', 'PLAYER_JOINED', 'READY'] }, expiresAt: { $lt: new Date() } },
          { $set: { status: 'EXPIRED', winner: null } }
        );
      } catch {
        // ignore sweep errors
      }
    })();
  }, 60000);
}