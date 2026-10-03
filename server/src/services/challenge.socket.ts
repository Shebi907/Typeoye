import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { env } from '../config/env';
import { verifyToken } from '../utils/jwt';
import User from '../models/User';
import Challenge, { IChallenge } from '../models/Challenge';
import {
  loadChallengeOrThrow,
  leaveChallenge,
  markConnected,
  markDisconnected,
  finalizeRunningIfDue,
  resolvePendingRematch,
  startRematchIfBothReady,
  pickFreshText,
  toPublic,
  challengeRoom,
  playerSlotOf,
  startAtMs,
  DISCONNECT_GRACE_MS,
  RUNNING_DISCONNECT_GRACE_MS,
} from './challenge.service';
import {
  createChallengeChatMessage,
  ChallengeChatMessageEnvelope,
} from './challengeChat.service';

let io: Server | null = null;

export function getIO(): Server | null {
  return io;
}

export function emitToChallenge(code: string, event: string, data: unknown): void {
  if (io) io.to(challengeRoom(code)).emit(event, data);
}

/* ═══════════ Mid-race departure watchdog (in-memory, room-scoped) ═══════════
   A socket disconnect during a LIVE race is only a temporary drop until the
   player misses RUNNING_DISCONNECT_GRACE_MS. The generic sweeper runs on a
   10-second cadence, which would leave the remaining player staring at a frozen
   race for up to ~20s after the grace really lapsed, so a dropped connection
   schedules a precise one-shot check at the exact deadline. Reconnects cancel
   it by re-stamping `connected`, which makes the check a no-op; the room can
   never be ended twice because the finalize write is guarded by status RUNNING. */
const departureWatchdogs = new Map<string, ReturnType<typeof setTimeout>>();

function scheduleDepartureCheck(code: string): void {
  const key = code.trim().toUpperCase();
  const existing = departureWatchdogs.get(key);
  if (existing) clearTimeout(existing);
  const timer = setTimeout(() => {
    departureWatchdogs.delete(key);
    void (async () => {
      try {
        const challenge = await loadChallengeOrThrow(key);
        if (challenge.status !== 'RUNNING') return;
        const result = await finalizeRunningIfDue(challenge, Date.now());
        if (!result.final || result.challenge.endedBy !== 'opponent_left') return;
        clearProgressCache(key);
        clearRoomPresence(key);
        emitToChallenge(key, 'challenge:opponentLeft', {
          challenge: toPublic(result.challenge),
          message: 'Your opponent has left the challenge.',
        });
      } catch {
        // ignore; the sweeper retries
      }
    })();
  }, RUNNING_DISCONNECT_GRACE_MS + 250);
  // Never hold the process open just for a watchdog.
  if (typeof timer.unref === 'function') timer.unref();
  departureWatchdogs.set(key, timer);
}

/** A reconnect inside the grace window makes the pending departure moot. */
function clearDepartureCheck(code: string): void {
  const key = code.trim().toUpperCase();
  const existing = departureWatchdogs.get(key);
  if (!existing) return;
  clearTimeout(existing);
  departureWatchdogs.delete(key);
}

/* ═══════════ Presence ownership (in-memory, room-scoped) ═══════════
   Which socket currently represents each seated player. Closing a tab,
   navigating away or refreshing tears the old socket down, but its
   `disconnect` event can land AFTER the replacement socket has already
   rejoined. Presence is per-player, not per-socket, so a stale event would
   otherwise mark a live, typing player offline - and the mid-race grace would
   then void a race that is still being played. Only the socket that currently
   owns the seat may flip that player offline. */
const presenceOwner = new Map<string, Map<'player1' | 'player2', string>>();

function claimPresence(code: string, slot: 'player1' | 'player2', socketId: string): void {
  const key = code.trim().toUpperCase();
  const seats = presenceOwner.get(key) ?? new Map<'player1' | 'player2', string>();
  seats.set(slot, socketId);
  presenceOwner.set(key, seats);
}

/** True when a DIFFERENT, live socket already owns this player's seat. */
function isStaleSocket(code: string, slot: 'player1' | 'player2', socketId: string): boolean {
  const seats = presenceOwner.get(code.trim().toUpperCase());
  const owner = seats?.get(slot);
  return Boolean(owner && owner !== socketId);
}

function releasePresence(code: string, slot: 'player1' | 'player2', socketId: string): void {
  const key = code.trim().toUpperCase();
  const seats = presenceOwner.get(key);
  if (!seats) return;
  if (seats.get(slot) === socketId) seats.delete(slot);
  if (seats.size === 0) presenceOwner.delete(key);
}

function clearRoomPresence(code: string): void {
  presenceOwner.delete(code.trim().toUpperCase());
}

/* ═══════════ Live typing state cache (in-memory, room-scoped) ═══════════
   The realtime publish path is socket-only and NEVER writes to the database
   (the client is throttled to ~5 updates/second). But a player who refreshes
   or reconnects mid-race would otherwise see the opponent's progress reset to
   zero until the opponent's next publish. This small cache keeps the LATEST
   published state per challenge so `challenge:join` can replay the opponent's
   current numbers instantly. It lives on the same single-process plane as the
   socket.io rooms (the whole challenge system is already memory-joined), is
   round-scoped (a stale round's numbers can never bleed into the next one),
   and is dropped as soon as a room finalizes or expires. */
type LiveProgress = {
  userId: string;
  username: string;
  round: number;
  correct: number;
  attempted: number;
  errors: number;
  typedChars: number;
  wpm: number;
  accuracy: number;
  progress: number;
  status: string;
  updatedAt: string;
};

const progressCache = new Map<string, { round: number; byUser: Map<string, LiveProgress> }>();

function cacheProgress(code: string, round: number, progress: LiveProgress): void {
  const entry = progressCache.get(code);
  if (entry && entry.round !== round) {
    // A brand new round must never inherit the previous round's live stats.
    progressCache.delete(code);
  }
  const next = progressCache.get(code) ?? { round, byUser: new Map() };
  next.byUser.set(progress.userId, progress);
  progressCache.set(code, next);
}

function clearProgressCache(code: string): void {
  progressCache.delete(code);
}

function latestOpponentProgress(code: string, round: number, userId: string): LiveProgress | null {
  const entry = progressCache.get(code);
  if (!entry || entry.round !== round) return null;
  for (const [id, progress] of entry.byUser) {
    if (id !== userId) return progress;
  }
  return null;
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
          // Presence is back inside the grace window: drop the armed departure
          // watchdog so a reconnect can never be finalized as a leave.
          clearDepartureCheck(code);
          // This socket now owns the seat, so only ITS later disconnect may
          // mark the player offline.
          claimPresence(code, playerSlotOf(challenge, userId) as 'player1' | 'player2', socket.id);
          // A socket belongs to exactly ONE challenge room. Without this, a
          // "New Challenge" switch left the socket subscribed to the room it
          // just abandoned, and that room's later broadcasts (expiry sweep,
          // opponent left, results) were delivered to the client - which is now
          // rendering the NEW room. Leaving the previous room here closes the
          // window at the source; the client also filters by code.
          if (currentCode && currentCode !== code) {
            socket.leave(challengeRoom(currentCode));
          }
          socket.join(challengeRoom(code));
          currentCode = code;
          // Authoritative resolution on (re)join: reading/broadcasting a room
          // must never surface a pending rematch against an opponent that is
          // already permanently gone. Resolve first (atomic; a no-op while both
          // players are up or within the reconnect grace), then broadcast the
          // RESOLVED snapshot so flags and presence always agree immediately —
          // no waiting for the next sweeper tick.
          const joined = updated.status === 'COMPLETED'
            ? (await resolvePendingRematch(updated, Date.now())).challenge
            : updated;
          const publicChallenge = toPublic(joined, userId);
          emitToChallenge(code, 'challenge:state', { challenge: publicChallenge });
          // Reconnection / page-refresh recovery: a player who (re)joins an
          // already-running race gets the opponent's LAST published progress
          // replayed immediately, so the opponent never visibly resets to zero
          // while waiting for the next ~200ms publish.
          const opponentLatest = latestOpponentProgress(code, updated.round, userId);
          if (opponentLatest) socket.emit('challenge:progressSync', opponentLatest);
          // Rematch recovery: if BOTH players had already accepted a rematch
          // (both rematchReady) and the opponent is back online, the new shared
          // round can progress. Normally the second "Rematch" click starts it,
          // but a disconnect exactly between the accept and the start would else
          // leave the room wedged on "Starting Round N+1…" forever. The atomic
          // status guard makes this race-safe — only one call can ever create
          // the round.
          if (joined.status === 'COMPLETED') {
            const joinedSlot = playerSlotOf(joined, userId);
            const other = joinedSlot === 'player1' ? joined.player2 : joined.player1;
            const joinedPlayer = joinedSlot === 'player1' ? joined.player1 : joined.player2;
            if (
              joinedSlot && other && joinedPlayer && joinedPlayer.rematchReady && other.rematchReady
              && joinedPlayer.connected && other.connected
            ) {
              try {
                const freshText = await pickFreshText(joined);
                const advanced = await startRematchIfBothReady(code, freshText);
                if (advanced) {
                  const pub = toPublic(advanced, userId);
                  emitToChallenge(code, 'challenge:rematch', { challenge: pub });
                  emitToChallenge(code, 'challenge:started', {
                    startAtMs: startAtMs(advanced),
                    durationSeconds: advanced.durationSeconds,
                    text: advanced.text,
                    challenge: pub,
                  });
                }
              } catch {
                // Pool failure / transient db error: the sweeper or a fresh
                // rematch click remains the safety net.
              }
            }
          }
          ack?.({ ok: true });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to join.';
          ack?.({ ok: false, error: message });
        }
      }
    );

    socket.on(
      'challenge:progress',
      async (payload: { correct?: number; attempted?: number; errors?: number; typedChars?: number; wpm?: number; accuracy?: number; progress?: number; round?: number; status?: string }) => {
        if (!currentCode || !payload) return;
        // Pin the room for this event. `currentCode` is shared socket state and can
        // be nulled by a concurrent leave/disconnect/room-switch while the gate
        // below awaits; reading it again afterwards crashed the handler on
        // `code.trim()` and dropped the opponent's live progress as an unhandled
        // rejection. The captured value is the room this progress belongs to.
        const code = currentCode;
        const round = toNumber(payload.round, 0);
        // Authoritative gate: only forward progress for the round that is
        // CURRENTLY running. Stale events (previous round, or a round that is
        // still in the lobby) are dropped before they can reach the opponent.
        try {
          const state = await Challenge.findOne({ code }).select('status round').lean();
          if (!state || state.status !== 'RUNNING' || state.round !== round) return;
        } catch {
          return;
        }
        // The socket may have left this room (or switched rooms) during the gate.
        if (currentCode !== code) return;
        const knownStatuses = ['waiting', 'ready', 'typing', 'finished', 'disconnected'];
        const configuredStatus: string = typeof payload.status === 'string' ? payload.status : 'typing';
        const progress: LiveProgress = {
          userId: socketUserId(socket),
          username: (socket as any).data.username as string,
          round,
          correct: toNumber(payload.correct, 0),
          attempted: toNumber(payload.attempted, 0),
          errors: toNumber(payload.errors, 0),
          typedChars: toNumber(payload.typedChars, 0),
          wpm: toNumber(payload.wpm, 0),
          accuracy: toNumber(payload.accuracy, 0),
          progress: toNumber(payload.progress, 0),
          status: knownStatuses.includes(configuredStatus) ? configuredStatus : 'typing',
          updatedAt: new Date().toISOString(),
        };
        // Keep the latest live state for reconnect/reload recovery.
        cacheProgress(code, round, progress);
        // Exclude the sender: only the OPPONENT needs this broadcast, so a
        // player's own keystrokes can never overwrite their opponent's stats.
        io?.to(challengeRoom(code)).except(socket.id).emit('challenge:opponentProgress', progress);
      }
    );

    socket.on(
      'challenge:chat',
      async (
        payload: { code?: string; round?: number; type?: string; message?: unknown },
        ack?: (res: { ok: boolean; error?: string; message?: ChallengeChatMessageEnvelope }) => void
      ) => {
        try {
          const code = typeof payload?.code === 'string' ? payload.code.trim().toUpperCase() : null;
          if (!code) { ack?.({ ok: false, error: 'Missing code.' }); return; }
          const challenge = await loadChallengeOrThrow(code);
          const userId = socketUserId(socket);
          const slot = playerSlotOf(challenge, userId);
          if (!slot) {
            ack?.({ ok: false, error: 'Not a participant.' }); return;
          }
          // Chat is an ACTIVE-MATCH feature: it is only accepted once the race is
          // actually running (authoritative shared status). Messages sent from
          // the lobby/ready screens — by a stray client, devtools, or an early
          // race condition — are rejected so they can never be broadcast or
          // persisted, which also keeps any connected lobby UI from seeing them.
          if (challenge.status !== 'RUNNING') {
            ack?.({ ok: false, error: 'Chat is only available while the challenge is running.' }); return;
          }
          // Chat is a two-player feature: a message is only meaningful while a
          // real opponent is seated AND connected. This blocks orphan messages
          // (sent when the other seat is empty or the opponent has left/dropped)
          // and makes "who receives this" unambiguous — always the other slot in
          // the current room, never the creator-vs-joiner assumption.
          const opponent = slot === 'player1' ? challenge.player2 : challenge.player1;
          if (!opponent || !opponent.connected) {
            ack?.({ ok: false, error: 'No opponent is connected to this challenge.' }); return;
          }
          const round = toNumber(payload?.round, -1);
          // Round-scoped persistence: a message tagged with a round that is no
          // longer current (e.g. a late round-1 delivery during round 2) is
          // rejected up-front so it can never be written against the wrong round.
          if (round !== challenge.round) {
            ack?.({ ok: false, error: 'Round mismatch.' }); return;
          }
          const saved = await createChallengeChatMessage(challenge, userId, payload?.type ?? '', payload?.message);
          io?.to(challengeRoom(code)).except(socket.id).emit('challenge:chat', saved);
          ack?.({ ok: true, message: saved });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to send message.';
          ack?.({ ok: false, error: message });
        }
      }
    );

    socket.on('challenge:leave', async (payload: { code?: string; reason?: string }) => {
      const code = payload?.code?.trim().toUpperCase() ?? currentCode;
      if (!code) return;
      // A page that is being closed, refreshed or navigated away reports the
      // same event as the Leave button, so the INTENT has to travel with it.
      // Only a deliberate 'exit' may end a live race on the spot; 'unmount' is
      // a presence change and gets the same reconnect grace as any other drop.
      const intentional = payload?.reason !== 'unmount';
      socket.leave(challengeRoom(code));
      try {
        const challenge = await loadChallengeOrThrow(code);
        const slot = playerSlotOf(challenge, socketUserId(socket));
        if (slot) {
          if (challenge.status === 'RUNNING' && !intentional) {
            // Tab closed / refreshed / navigated away mid-race: keep the race
            // alive for the grace window so the player can come straight back.
            const marked = await markDisconnected(challenge, socketUserId(socket));
            releasePresence(code, slot, socket.id);
            scheduleDepartureCheck(code);
            emitToChallenge(code, 'challenge:state', { challenge: toPublic(marked, socketUserId(socket)) });
            // Only forget the socket's room if it is still THIS one: a "New
            // Challenge" switch can land while this handler is awaiting the
            // database, and nulling currentCode then would strip the brand new
            // room of disconnect tracking.
            if (currentCode === code) currentCode = null;
            return;
          }
          let updated = await leaveChallenge(challenge, socketUserId(socket));
          // If the leaving player was in a pending rematch, cancel it NOW (and
          // reset the waiting opponent's flag) so the opponent is told the
          // rematch is dead and released immediately, not on the next sweeper
          // tick. The atomic guard makes this idempotent.
          if (updated.status === 'COMPLETED') {
            const resolved = await resolvePendingRematch(updated, Date.now());
            updated = resolved.challenge;
          }
          // The room is dissolving (explicit leave expires the lobby) — its
          // live typing state has no future, so drop it now.
          clearProgressCache(code);
          clearRoomPresence(code);
          emitToChallenge(code, 'challenge:opponentLeft', {
            challenge: toPublic(updated),
            message: 'Your opponent has left the challenge.',
          });
        }
      } catch {
        // ignore
      }
      // Same guard as above: a leave for an already-abandoned room must not
      // erase the room this socket has since joined.
      if (currentCode === code) currentCode = null;
    });

    socket.on('disconnect', async () => {
      const code = currentCode;
      currentCode = null;
      if (!code) return;
      try {
        const challenge = await loadChallengeOrThrow(code);
        const slot = playerSlotOf(challenge, socketUserId(socket));
        if (slot) {
          // A replaced socket (refresh / navigation / reopened tab) that only
          // now reports its disconnect must NOT touch presence: a newer socket
          // owns this seat and the player is very much online.
          if (isStaleSocket(code, slot, socket.id)) {
            return;
          }
          releasePresence(code, slot, socket.id);
          // A dropped connection is NOT an intentional leave: keep the room
          // alive so the player can rejoin and resume. Explicit exits go
          // through 'challenge:leave', which expires the lobby as before.
          const updated = await markDisconnected(challenge, socketUserId(socket));
          emitToChallenge(code, 'challenge:state', { challenge: toPublic(updated, socketUserId(socket)) });
          // Inside a LIVE race the drop may become a real departure, so arm a
          // precise watchdog for the exact grace deadline (reconnecting cancels
          // it by re-stamping presence). The lobby/rematch path keeps the
          // sweeper-only 30s lifecycle.
          if (updated.status === 'RUNNING') scheduleDepartureCheck(code);
        }
      } catch {
        // ignore
      }
    });
  });

  // Sweeper: runs the whole disconnect/expiry lifecycle so no room — lobby or
  // running race — can ever leave a player waiting forever.
  setInterval(() => {
    void (async () => {
      try {
        const now = Date.now();

        // 1) Two different endings, deliberately kept apart:
        //    (a) a SOLO lobby (nobody ever joined) that outlived
        //        CHALLENGE_WAITING_TTL_MS, or whose creator dropped past the
        //        grace window -> EXPIRED, the only state that may ever render
        //        the "no opponent joined" card;
        //    (b) a room that HAS an opponent, where a seated player dropped past
        //        the reconnection grace window -> a no-contest opponent_left end
        //        so the remaining player is released instead of waiting out a
        //        lobby deadline that no longer means anything.
        const graceCutoff = now - DISCONNECT_GRACE_MS;
        const goneBefore = new Date(graceCutoff);
        const playerGoneFilter = {
          $or: [
            { 'player1.connected': false, 'player1.disconnectedAt': { $lt: goneBefore } },
            { 'player2.connected': false, 'player2.disconnectedAt': { $lt: goneBefore } },
          ],
        };
        const dueLobbies = await Challenge.find({
          status: { $in: ['WAITING', 'PLAYER_JOINED', 'READY'] },
          $or: [
            { player2: null, expiresAt: { $lt: new Date(now) } },
            { player2: null, ...playerGoneFilter },
            { player2: { $ne: null }, ...playerGoneFilter },
          ],
        }).lean();
        for (const room of dueLobbies) {
          const playerGone = (player: { connected?: boolean; disconnectedAt?: Date | null } | null): boolean =>
            player?.connected === false && (!player.disconnectedAt || player.disconnectedAt.getTime() <= graceCutoff);
          const goneSlot = playerGone(room.player1) ? 'player1' : playerGone(room.player2) ? 'player2' : null;
          // (a) nobody ever joined -> the waiting-room expiry.
          const soloTimeout = room.player2 === null && !goneSlot;
          // (b) an opponent is seated and somebody dropped past the grace.
          const departed = room.player2 !== null && goneSlot !== null;
          const update = soloTimeout
            ? { status: 'EXPIRED' as const, winner: null, endedBy: 'expired' as const, abandonedBy: null }
            : departed
              ? { status: 'COMPLETED' as const, winner: null, endedBy: 'opponent_left' as const, abandonedBy: goneSlot }
              : null;
          if (!update) continue;
          const updated = await Challenge.findOneAndUpdate(
            { code: room.code, status: { $in: ['WAITING', 'PLAYER_JOINED', 'READY'] } },
            { $set: update },
            { new: true }
          );
          if (!updated) continue;
          clearProgressCache(room.code);
          clearRoomPresence(room.code);
          if (departed) {
            // A seated player actually dropped out past the grace window: tell
            // the remaining player explicitly instead of a generic expiry.
            emitToChallenge(room.code, 'challenge:opponentLeft', {
              challenge: toPublic(updated),
              message: 'Your opponent has left the challenge.',
            });
          } else {
            emitToChallenge(room.code, 'challenge:state', { challenge: toPublic(updated) });
          }
        }

        // 2) Running races resolve once the race window ends or a player is
        //    gone past the reconnection grace. The status guard inside
        //    finalizeRunningIfDue keeps this idempotent (and internally gates
        //    the finish grace / expiry windows), so racing the players' own
        //    submissions is safe. Sweeping from `endAt` (not end + grace)
        //    guarantees a timed completion is never stuck waiting on the
        //    10-second sweep cadence.
        const running = await Challenge.find({ status: 'RUNNING', startAt: { $ne: null } }).lean();
        for (const doc of running) {
          const startT = doc.startAt ? doc.startAt.getTime() : 0;
          const pastEnd = now >= startT + doc.durationSeconds * 1000;
          const someoneDown = doc.player1?.connected === false || doc.player2?.connected === false;
          if (!pastEnd && !someoneDown) continue;
          const result = await finalizeRunningIfDue(doc as unknown as IChallenge, now);
          const code = result.challenge.code;
          // Only drop the live-progress cache once the race is truly resolved
          // (COMPLETED/EXPIRED). A NON-final return just means we're sitting in
          // the reconnect/finish grace window: a player refreshing their page
          // must still get the opponent's progress replayed on (re)join.
          if (!result.final) continue;
          clearProgressCache(code);
          clearRoomPresence(code);
          if (result.challenge.endedBy === 'opponent_left') {
            // NO CONTEST. The client must show the opponent-left popup and
            // redirect, so a results payload is never emitted here (it would
            // render a winner screen for a race nobody won).
            emitToChallenge(code, 'challenge:opponentLeft', {
              challenge: toPublic(result.challenge),
              message: 'Your opponent has left the challenge.',
            });
          } else if (result.challenge.status === 'COMPLETED') {
            emitToChallenge(code, 'challenge:results', { challenge: toPublic(result.challenge) });
          } else if (result.challenge.status === 'EXPIRED') {
            emitToChallenge(code, 'challenge:state', { challenge: toPublic(result.challenge) });
          }
        }
      // 3) COMPLETED rooms with a PENDING rematch must never strand the
        //    waiting player. A pending rematch can only complete while BOTH
        //    players are available; once either player is permanently gone
        //    (explicitly left, or past the reconnection grace after a browser
        //    close), the request is cancelled and the remaining player is told
        //    the opponent is gone instead of being left on "waiting" forever.
        const pendingRematch = await Challenge.find({
          status: 'COMPLETED',
          $or: [{ 'player1.rematchReady': true }, { 'player2.rematchReady': true }],
        }).lean();
        for (const doc of pendingRematch) {
          const resolved = await resolvePendingRematch(doc as unknown as IChallenge, now);
          if (!resolved.cancelled) continue;
          emitToChallenge(doc.code, 'challenge:opponentLeft', {
            challenge: toPublic(resolved.challenge),
            message: 'Your opponent left the challenge.',
          });
        }
      } catch {
        // ignore sweep errors; the next tick retries
      }
    })();
  }, 10000);
}