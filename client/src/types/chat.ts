export type ChallengeChatMessageType = 'text' | 'reaction' | 'sticker';

export interface ChallengeChatMessage {
  id: string;
  round: number;
  senderId: string;
  type: ChallengeChatMessageType;
  message: string;
  createdAt: string;
}