export interface IChatMessage {
  id: string;
  senderPseudonym: string;
  senderAvatarColor: string;
  isCurrentUser: boolean;
  content: string;
  timestamp: string;
}

export interface IConversation {
  id: string;
  recipientPseudonym: string;
  recipientAvatarColor: string;
  recipientCircle: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  realIdentityRevealed: boolean;
  messages: IChatMessage[];
}
