import { createHash } from 'crypto';
import { Types } from 'mongoose';
import Challenge, {
  IChallenge,
  ChallengeStatus,
  ChallengePlayer,
  ChallengeTypedWord,
} from '../models/Challenge';
import TestParagraph from '../models/TestParagraph';
import { IUser } from '../models/User';

export const CHALLENGE_DEFAULT_DURATION = 60;
export const CHALLENGE_TTL_MS = 30 * 60 * 1000;
export const CHALLENGE_GRACE_MS = 15000;

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 5;

export class ChallengeError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

const STATUS_FLOW: ChallengeStatus[] = ['WAITING', 'PLAYER_JOINED', 'READY', 'RUNNING', 'COMPLETED', 'EXPIRED'];

export function generateCode(): string {
  const bytes = createHash('sha256')
    .update(`${Date.now()}-${Math.random()}-${Math.random().toString(36)}`)
    .digest();
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return `TY-${code}`;
}

export async function ensureUniqueCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateCode();
    const existing = await Challenge.findOne({ code }).select('_id').lean();
    if (!existing) return code;
  }
  throw new ChallengeError('Could not allocate a challenge code. Please try again.', 500);
}

export function computeStats(typedWords: ChallengeTypedWord[], durationSeconds: number) {
  const attemptedWords = typedWords.length;
  const correctWords = typedWords.filter((word) => word.correct).length;
  const elapsed = Math.max(0.1, durationSeconds);
  return {
    wpm: correctWords === 0 ? 0 : Math.round(correctWords / (elapsed / 60)),
    accuracy: attemptedWords === 0 ? 100 : Math.round((correctWords / attemptedWords) * 1000) / 10,
    correctWords,
    attemptedWords,
    errorsCount: attemptedWords - correctWords,
  };
}

export function isExpired(challenge: IChallenge, now = Date.now()): boolean {
  return challenge.expiresAt.getTime() < now;
}

export async function expireChallenge(challenge: IChallenge): Promise<IChallenge> {
  if (challenge.status !== 'EXPIRED') {
    challenge.set('status', 'EXPIRED');
    challenge.set('winner', null);
    await challenge.save();
  }
  return challenge;
}

export async function loadChallengeOrThrow(code: string): Promise<IChallenge> {
  const normalized = code.trim().toUpperCase();
  const challenge = await Challenge.findOne({ code: normalized });
  if (!challenge) throw new ChallengeError('Challenge not found.', 404);
  if (isExpired(challenge) || challenge.status === 'EXPIRED') {
    return expireChallenge(challenge);
  }
  return challenge;
}

export function isCodeFormatValid(code: string): boolean {
  return /^TY-[A-Z0-9]{5}$/.test(code.trim().toUpperCase());
}

export function playerSlotOf(challenge: IChallenge, userId: string): 'player1' | 'player2' | null {
  const slotOf = (player: ChallengePlayer | null): boolean =>
    player !== null && player.userId.toString() === userId.toString();
  if (slotOf(challenge.player1)) return 'player1';
  if (slotOf(challenge.player2)) return 'player2';
  return null;
}

export function getOpponentSlot(challenge: IChallenge, slot: 'player1' | 'player2'): 'player1' | 'player2' {
  return slot === 'player1' ? 'player2' : 'player1';
}

function statsFor(challenge: IChallenge, slot: 'player1' | 'player2'): ChallengePlayer {
  return (challenge as any)[slot] as ChallengePlayer;
}

function playerOf(challenge: IChallenge, slot: 'player1' | 'player2'): ChallengePlayer {
  return (challenge as any)[slot] as ChallengePlayer;
}

export function isFull(challenge: IChallenge): boolean {
  return challenge.player2 !== null;
}

export function isBetweenStatus(status: ChallengeStatus, ...statuses: ChallengeStatus[]): boolean {
  return statuses.includes(status);
}

export interface PublicChallenge {
  code: string;
  status: ChallengeStatus;
  round: number;
  durationSeconds: number;
  startAt: string | null;
  text: string;
  winner: 'player1' | 'player2' | 'draw' | null;
  players: {
    slot: 'player1' | 'player2';
    userId: string;
    username: string;
    ready: boolean;
    connected: boolean;
    rematchReady: boolean;
    stats: {
      wpm: number;
      accuracy: number;
      correctWords: number;
      attemptedWords: number;
      errorsCount: number;
    } | null;
  }[];
  me: 'player1' | 'player2' | null;
  createdAt: string;
  expiresAt: string;
}

export function toPublic(challenge: IChallenge, userId?: string): PublicChallenge {
  const showStats = challenge.status === 'COMPLETED';
  const players: PublicChallenge['players'] = [challenge.player1].map((player) => ({
    slot: 'player1' as const,
    userId: player.userId.toString(),
    username: player.username,
    ready: player.ready,
    connected: player.connected,
    rematchReady: player.rematchReady,
    stats: showStats && player.stats ? {
      wpm: player.stats.wpm,
      accuracy: player.stats.accuracy,
      correctWords: player.stats.correctWords,
      attemptedWords: player.stats.attemptedWords,
      errorsCount: player.stats.errorsCount,
    } : null,
  }));
  if (challenge.player2) {
    players.push({
      slot: 'player2' as const,
      userId: challenge.player2.userId.toString(),
      username: challenge.player2.username,
      ready: challenge.player2.ready,
      connected: challenge.player2.connected,
      rematchReady: challenge.player2.rematchReady,
      stats: showStats && challenge.player2.stats ? {
        wpm: challenge.player2.stats.wpm,
        accuracy: challenge.player2.stats.accuracy,
        correctWords: challenge.player2.stats.correctWords,
        attemptedWords: challenge.player2.stats.attemptedWords,
        errorsCount: challenge.player2.stats.errorsCount,
      } : null,
    });
  }
  return {
    code: challenge.code,
    status: challenge.status,
    round: challenge.round,
    durationSeconds: challenge.durationSeconds,
    startAt: challenge.startAt ? challenge.startAt.toISOString() : null,
    text: challenge.text,
    winner: challenge.winner,
    players,
    me: userId ? playerSlotOf(challenge, userId) : null,
    createdAt: challenge.createdAt.toISOString(),
    expiresAt: challenge.expiresAt.toISOString(),
  };
}

export async function createChallenge(user: IUser, durationSeconds = CHALLENGE_DEFAULT_DURATION): Promise<IChallenge> {
  const duration = Math.min(300, Math.max(30, Math.round(durationSeconds) || CHALLENGE_DEFAULT_DURATION));
  const [code, paragraph] = await Promise.all([
    ensureUniqueCode(),
    TestParagraph.aggregate([{ $sample: { size: 1 } }]),
  ]);
  if (!paragraph || paragraph.length === 0) {
    throw new ChallengeError('No test paragraphs are available. Run the database seed first.', 500);
  }
  const now = Date.now();
  const challenge = await Challenge.create({
    code,
    status: 'WAITING',
    round: 1,
    player1: {
      userId: user._id,
      username: user.username,
      ready: false,
      connected: true,
      joinedAt: new Date(now),
      stats: null,
    },
    player2: null,
    text: paragraph[0].content,
    paragraphId: paragraph[0]._id,
    durationSeconds: duration,
    startAt: null,
    winner: null,
    createdAt: new Date(now),
    updatedAt: new Date(now),
    expiresAt: new Date(now + CHALLENGE_TTL_MS),
  });
  return challenge;
}

export async function joinChallenge(challenge: IChallenge, user: IUser): Promise<IChallenge> {
  const slot = playerSlotOf(challenge, user._id.toString());
  if (slot) return challenge;

  if (isFull(challenge)) throw new ChallengeError('This challenge is already full.', 400);
  if (isExpired(challenge)) throw new ChallengeError('This challenge has expired.', 400);

  challenge.set('player2', {
    userId: user._id,
    username: user.username,
    ready: false,
    connected: true,
    joinedAt: new Date(),
    stats: null,
  });
  challenge.set('status', 'PLAYER_JOINED');
  return challenge.save();
}

export async function markReady(challenge: IChallenge, user: IUser): Promise<{ challenge: IChallenge; bothReady: boolean }> {
  if (isExpired(challenge) || challenge.status === 'EXPIRED') {
    throw new ChallengeError('This challenge has expired.', 400);
  }
  const slot = playerSlotOf(challenge, user._id.toString());
  if (!slot) throw new ChallengeError('You are not part of this challenge.', 403);

  // Atomic per-slot update: set ONLY this player's ready flag so two players
  // clicking "I'm Ready" at the same time can never overwrite each other.
  const now = new Date();
  const updated = await Challenge.findOneAndUpdate(
    {
      _id: challenge._id,
      [`${slot}.userId`]: user._id,
      status: { $in: ['WAITING', 'PLAYER_JOINED', 'READY'] },
      expiresAt: { $gt: now },
    },
    { $set: { [`${slot}.ready`]: true, [`${slot}.readyAt`]: now, [`${slot}.connected`]: true } },
    { new: true }
  );
  if (!updated) throw new ChallengeError('This challenge has expired.', 400);

  const bothReady = !!updated.player2 && updated.player1.ready && updated.player2.ready;

  // Lift the whole room into the shared READY state once BOTH players are
  // ready. Idempotent, atomically guarded: the opponent's flag update and this
  // status flip can never clobber each other. Broadcast rooms then agree on
  // exactly one authoritative READY moment before the start.
  let result = updated;
  if (bothReady && result.status !== 'READY') {
    result = await Challenge.findOneAndUpdate(
      {
        _id: challenge._id,
        'player1.ready': true,
        'player2.ready': true,
        startAt: null,
        status: { $in: ['WAITING', 'PLAYER_JOINED', 'READY'] },
        expiresAt: { $gt: now },
      },
      { $set: { status: 'READY' } },
      { new: true }
    ) ?? updated;
  }

  return { challenge: result, bothReady };
}

/**
 * Atomically transition the challenge to RUNNING and create the ONE official
 * startTime — but ONLY if both players are ready and no startTime exists yet.
 *
 * Because the condition includes `startAt: null`, exactly one concurrent call
 * can ever succeed; every other simultaneous call gets back null. This
 * guarantees a single authoritative start time and prevents double timers.
 */
export async function startChallengeIfReady(code: string): Promise<IChallenge | null> {
  const now = new Date();
  return Challenge.findOneAndUpdate(
    {
      code: code.trim().toUpperCase(),
      status: { $in: ['PLAYER_JOINED', 'READY'] },
      startAt: null,
      'player1.ready': true,
      'player2.ready': true,
      expiresAt: { $gt: now },
    },
    {
      $set: {
        status: 'RUNNING',
        startAt: now,
        winner: null,
        'player1.ready': false,
        'player1.readyAt': null,
        'player2.ready': false,
        'player2.readyAt': null,
      },
    },
    { new: true }
  );
}

export async function markConnected(challenge: IChallenge, userId: string): Promise<IChallenge> {
  const slot = playerSlotOf(challenge, userId);
  if (!slot) return challenge;
  const updated = await Challenge.findOneAndUpdate(
    { _id: challenge._id, [`${slot}.userId`]: userId },
    { $set: { [`${slot}.connected`]: true } },
    { new: true }
  );
  return updated ?? challenge;
}

export async function markDisconnected(challenge: IChallenge, userId: string): Promise<IChallenge> {
  const slot = playerSlotOf(challenge, userId);
  if (!slot) return challenge;
  const updated = await Challenge.findOneAndUpdate(
    { _id: challenge._id, [`${slot}.userId`]: userId },
    { $set: { [`${slot}.connected`]: false } },
    { new: true }
  );
  return updated ?? challenge;
}

export function startAtMs(challenge: IChallenge): number {
  return challenge.startAt ? challenge.startAt.getTime() : 0;
}

export function endAtMs(challenge: IChallenge): number {
  return startAtMs(challenge) + challenge.durationSeconds * 1000;
}

export async function submitResults(
  challenge: IChallenge,
  user: IUser,
  typedWords: ChallengeTypedWord[],
  round: number
): Promise<{ challenge: IChallenge; final: boolean; abandoned: boolean }> {
  if (challenge.status === 'EXPIRED') throw new ChallengeError('This challenge has expired.', 400);
  const slot = playerSlotOf(challenge, user._id.toString());
  if (!slot) throw new ChallengeError('You are not part of this challenge.', 403);
  if (!isBetweenStatus(challenge.status as ChallengeStatus, 'RUNNING')) {
    throw new ChallengeError('This challenge is not running.', 400);
  }
  // Results are strictly round-scoped: a submission from a finished round can
  // never be counted against a newer round (stale round-1 packets are dropped).
  if (round !== challenge.round) {
    throw new ChallengeError('This race has already ended.', 400);
  }

  const start = startAtMs(challenge);
  const end = endAtMs(challenge);
  const durationSeconds = Math.min(challenge.durationSeconds, Math.max(0.1, (end - start) / 1000));

  const stats = computeStats(typedWords, durationSeconds);

  const player = playerOf(challenge, slot);
  player.stats = {
    typedWords,
    wpm: stats.wpm,
    accuracy: stats.accuracy,
    correctWords: stats.correctWords,
    attemptedWords: stats.attemptedWords,
    errorsCount: stats.errorsCount,
    submittedAt: new Date(),
  };
  challenge.markModified(`${slot}.stats`);

  const opponentSlot = getOpponentSlot(challenge, slot);
  const opponent = playerOf(challenge, opponentSlot);
  const now = Date.now();
  const opponentForfeited = !opponent.stats && (!opponent.connected || now > end + CHALLENGE_GRACE_MS);

  let final = false;
  let abandoned = false;

  if (opponent.stats) {
    final = true;
  } else if (opponentForfeited) {
    final = true;
    abandoned = true;
    opponent.stats = {
      typedWords: [],
      wpm: 0,
      accuracy: 0,
      correctWords: 0,
      attemptedWords: 0,
      errorsCount: 0,
      submittedAt: new Date(),
    };
    challenge.markModified(`${opponentSlot}.stats`);
  }

  if (final) {
    const mine = player.stats;
    const theirs = opponent.stats!;
    let winner: 'player1' | 'player2' | 'draw' | null = null;
    if (mine.wpm !== theirs.wpm) {
      winner = mine.wpm > theirs.wpm ? slot : opponentSlot;
    } else if (abandoned) {
      winner = slot;
    }
    challenge.set('status', 'COMPLETED');
    challenge.set('winner', winner);
  }

  await challenge.save();
  return { challenge, final, abandoned: abandoned || !opponent.connected };
}

/**
 * Pick a fresh test paragraph whose content DIFFERS from the current round's
 * text, so every rematch round is a genuinely new race. Retries the random
 * sample up to 10 times; falls back to the last sample if no distinct
 * paragraph exists in the pool.
 */
export async function pickFreshText(challenge: IChallenge): Promise<{ content: string; _id: Types.ObjectId }> {
  let sample: { content: string; _id: Types.ObjectId } | null = null;
  for (let attempt = 0; attempt < 10; attempt++) {
    const paragraph = await TestParagraph.aggregate<{ content: string; _id: Types.ObjectId }>([{ $sample: { size: 1 } }]);
    const candidate = paragraph && paragraph.length > 0 ? paragraph[0] : null;
    if (!candidate) break;
    sample = candidate;
    const sameParagraph = challenge.paragraphId
      ? candidate._id.toString() === challenge.paragraphId.toString()
      : candidate.content === challenge.text;
    if (!sameParagraph) return candidate;
  }
  if (sample) return sample;
  throw new ChallengeError('No test paragraphs are available. Run the database seed first.', 500);
}

/**
 * Player asks for a rematch. This ONLY sets the caller's rematchReady flag —
 * it never mutates the race. Both players must request a rematch; the START
 * of the next round happens in startRematchIfBothReady, which is race-safe.
 */
export async function requestRematch(challenge: IChallenge, user: IUser): Promise<IChallenge> {
  const slot = playerSlotOf(challenge, user._id.toString());
  if (!slot) throw new ChallengeError('You are not part of this challenge.', 403);
  if (!isBetweenStatus(challenge.status as ChallengeStatus, 'COMPLETED')) {
    throw new ChallengeError('A rematch is only available after a finished challenge.', 400);
  }
  const now = new Date();
  const updated = await Challenge.findOneAndUpdate(
    {
      _id: challenge._id,
      status: 'COMPLETED',
      [`${slot}.userId`]: user._id,
      expiresAt: { $gt: now },
    },
    { $set: { [`${slot}.rematchReady`]: true, [`${slot}.connected`]: true } },
    { new: true }
  );
  if (!updated) throw new ChallengeError('This challenge has expired.', 400);
  return updated;
}

/**
 * Race-safe rematch start: creates the NEXT round exactly once.
 *
 * The atomic condition requires status COMPLETED, both players' rematchReady
 * flags AND both still connected. When two players click "Rematch" at the same
 * time, both call this, but only ONE findOneAndUpdate can win — the loser sees
 * status flipped to PLAYER_JOINED (and its own rematchReady reset), so the
 * update returns null. Exactly one new round, one new text, one future shared
 * startTime can ever be created for a completed match.
 *
 * `freshText` is picked BEFORE the atomic write so a pool failure aborts
 * without touching the document.
 */
export async function startRematchIfBothReady(code: string, freshText: { content: string; _id: Types.ObjectId }): Promise<IChallenge | null> {
  const now = new Date();
  return Challenge.findOneAndUpdate(
    {
      code: code.trim().toUpperCase(),
      status: 'COMPLETED',
      'player1.rematchReady': true,
      'player2.rematchReady': true,
      'player1.connected': true,
      'player2.connected': true,
      expiresAt: { $gt: now },
    },
    {
      $inc: { round: 1 },
      $set: {
        status: 'PLAYER_JOINED',
        winner: null,
        startAt: null,
        text: freshText.content,
        paragraphId: freshText._id,
        'player1.ready': false,
        'player1.readyAt': null,
        'player1.rematchReady': false,
        'player1.stats': null,
        'player2.ready': false,
        'player2.readyAt': null,
        'player2.rematchReady': false,
        'player2.stats': null,
      },
    },
    { new: true }
  );
}

export async function rematchChallenge(challenge: IChallenge, user: IUser): Promise<IChallenge> {
  return requestRematch(challenge, user);
}

export async function leaveChallenge(challenge: IChallenge, userId: string): Promise<IChallenge> {
  const slot = playerSlotOf(challenge, userId);
  if (!slot) return challenge;
  if (isBetweenStatus(challenge.status as ChallengeStatus, 'WAITING', 'PLAYER_JOINED', 'READY')) {
    challenge.set('status', 'EXPIRED');
    challenge.set('winner', null);
  } else if (challenge.status === 'RUNNING') {
    const player = playerOf(challenge, slot);
    player.connected = false;
    challenge.markModified(slot);
  }
  return challenge.save();
}

export function challengeRoom(code: string): string {
  return `challenge:${code.trim().toUpperCase()}`;
}

export function effectiveDurationMs(challenge: IChallenge): number {
  return challenge.durationSeconds * 1000;
}

export function isOverdue(challenge: IChallenge, now = Date.now()): boolean {
  return challenge.status === 'RUNNING' && now > endAtMs(challenge) + CHALLENGE_GRACE_MS;
}