/* Shared catalogs for the in-duel challenge chat. The sticker/reaction
   identifiers MUST stay in sync with the server-side validation lists in
   server/src/services/challengeChat.service.ts (CHAT_STICKERS / CHAT_REACTIONS). */

/** Emoji inserted into the message input while composing. */
export const CHAT_EMOJIS: readonly string[] = [
  '😂', '😎', '🔥', '🚀', '👏', '❤️', '😭', '😮', '😈',
  '💪', '🎉', '⌨️', '🏆', '⚡', '🤣', '👍', '👀', '💯',
];

/** Fast single-tap emotes sent instantly. Mirrors server CHAT_REACTIONS. */
export const CHAT_QUICK_REACTIONS: readonly string[] = [
  '🔥', '😂', '😎', '💪', '👏', '🚀', '😈', '😭', '🎉', '❤️', '💯', '🏆',
];

export interface ChallengeSticker {
  id: string;
  emoji: string;
  label: string;
}

/** Tap-to-send sticker cards. Mirrors server CHAT_STICKERS. */
export const CHAT_STICKERS: ChallengeSticker[] = [
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