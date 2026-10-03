import mongoose, { Types } from 'mongoose';
import ChallengeMessage, { IChallengeMessage, ChallengeChatMessageType } from '../models/ChallengeMessage';
import { IChallenge } from '../models/Challenge';

export const CHAT_MAX_LENGTH = 300;
export const CHAT_HISTORY_LIMIT = 100;

const CHAT_TYPES: ChallengeChatMessageType[] = ['text', 'reaction', 'sticker'];

export const CHAT_REACTIONS: readonly string[] = [
  '🔥', '😂', '😎', '💪', '👏', '🚀', '😈', '😭', '🎉', '❤️', '💯', '🏆',
];

export interface ChatSticker {
  id: string;
  emoji: string;
  label: string;
}

export const CHAT_STICKERS: ChatSticker[] = [
  { id: 'fast', emoji: '🔥', label: 'FAST!' },
  { id: 'letsgo', emoji: '⚡', label: "LET'S GO!" },
  { id: 'oops', emoji: '😂', label: 'OOPS!' },
  { id: 'easy', emoji: '😎', label: 'TOO EASY' },
  { id: 'catch', emoji: '💪', label: 'CATCH ME!' },
  { id: 'flying', emoji: '🚀', label: "I'M FLYING" },
  { id: 'gg', emoji: '🏆', label: 'GG!' },
  { id: 'keeptyping', emoji: '⌨️', label: 'KEEP TYPING!' },
  { id: 'accuracy', emoji: '🎯', label: 'ACCURACY!' },
  { id: 'nice', emoji: '❤️', label: 'NICE!' },
];

export class ChallengeChatError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

export interface ChallengeChatMessageEnvelope {
  id: string;
  round: number;
  senderId: string;
  type: ChallengeChatMessageType;
  message: string;
  createdAt: string;
}

function toEnvelope(doc: IChallengeMessage): ChallengeChatMessageEnvelope {
  return {
    id: (doc._id as mongoose.Types.ObjectId).toString(),
    round: doc.round,
    senderId: (doc.senderId as mongoose.Types.ObjectId).toString(),
    type: doc.type,
    message: doc.message,
    createdAt: doc.createdAt.toISOString(),
  };
}

export function sanitizeChatContent(type: string, input: unknown): string {
  const raw = typeof input === 'string' ? input : '';
  if (type === 'reaction') {
    const emoji = raw.trim();
    if (!CHAT_REACTIONS.includes(emoji)) throw new ChallengeChatError('Unknown reaction.', 400);
    return emoji;
  }
  if (type === 'sticker') {
    const id = raw.trim().toLowerCase();
    if (!CHAT_STICKERS.some((s) => s.id === id)) throw new ChallengeChatError('Unknown sticker.', 400);
    return id;
  }
  if (type === 'text') {
    const text = raw.replace(/\s+/g, ' ').trim();
    if (!text) throw new ChallengeChatError('Message cannot be empty.', 400);
    if (text.length > CHAT_MAX_LENGTH) {
      throw new ChallengeChatError(`Message is too long (max ${CHAT_MAX_LENGTH} characters).`, 400);
    }
    return text;
  }
  throw new ChallengeChatError('Invalid message type.', 400);
}

export async function createChallengeChatMessage(
  challenge: IChallenge,
  senderUserId: string,
  type: string,
  message: unknown
): Promise<ChallengeChatMessageEnvelope> {
  if (!CHAT_TYPES.includes(type as ChallengeChatMessageType)) {
    throw new ChallengeChatError('Invalid message type.', 400);
  }
  if (challenge.status === 'EXPIRED') {
    throw new ChallengeChatError('This challenge has expired. Chat is closed.', 400);
  }
  // A race that ended because the opponent walked away is a no contest: the
  // room is being torn down, so the chat is closed on the authoritative state
  // (a stale client must not be able to keep writing into a dead room).
  if (challenge.endedBy === 'opponent_left') {
    throw new ChallengeChatError('This challenge has ended. Chat is closed.', 400);
  }
  if (!playerSlotOf(challenge, senderUserId)) {
    throw new ChallengeChatError('You are not part of this challenge.', 403);
  }
  const content = sanitizeChatContent(type, message);
  const doc = await ChallengeMessage.create({
    challengeId: challenge._id,
    round: challenge.round,
    senderId: new Types.ObjectId(senderUserId),
    type: type as ChallengeChatMessageType,
    message: content,
  });
  return toEnvelope(doc);
}

export async function listChallengeChatMessages(
  challengeId: Types.ObjectId,
  round: number
): Promise<ChallengeChatMessageEnvelope[]> {
  const docs = await ChallengeMessage.find({ challengeId, round })
    .sort({ createdAt: 1, _id: 1 })
    .limit(CHAT_HISTORY_LIMIT)
    .lean();
  return docs.map(toEnvelope as (d: unknown) => ChallengeChatMessageEnvelope);
}

function playerSlotOf(challenge: IChallenge, userId: string): boolean {
  const slotOf = (player: { userId: Types.ObjectId } | null): boolean =>
    player !== null && player.userId.toString() === userId.toString();
  return slotOf(challenge.player1) || slotOf(challenge.player2);
}