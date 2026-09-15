export interface IChatMessage {
  id: string;
  senderPseudonym: string;
  senderAvatarId?: string;
  senderAvatarColor: string;
  isCurrentUser: boolean;
  content: string;
  createdAt?: string;
  timestamp: string;
  isDeleted?: boolean;
}

export interface IConversationParticipant {
  userId: string;
  username: string;
  avatarId: string;
  avatarColor: string;
  bio?: string;
  interests?: string[];
  collegeName?: string;
}

export interface IConversationSummary {
  id: string;
  otherUser: IConversationParticipant;
  lastMessage?: {
    content: string;
    senderPseudonym: string;
    createdAt: string;
    isDeleted?: boolean;
  };
  lastMessageTime: string;
  unreadCount: number;
  status: "active" | "blocked";
  isBlockedByMe?: boolean;
  isBlockedByOther?: boolean;
  updatedAt: string;
}

export interface IConversationDetail {
  id: string;
  otherUser: IConversationParticipant;
  status: "active" | "blocked";
  isBlockedByMe: boolean;
  isBlockedByOther: boolean;
  createdAt: string;
  updatedAt: string;
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
