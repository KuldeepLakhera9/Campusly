export type HangoutCategory =
  | "Study"
  | "Food & Drink"
  | "Campus Walk"
  | "Sports & Fitness"
  | "Gaming"
  | "Creative"
  | "Late Night"
  | "Other";

export type HangoutStatus = "open" | "full" | "completed" | "cancelled";

export interface IHangoutParticipant {
  userId?: string;
  pseudonym: string;
  avatarColor: string;
  joinedAt: Date;
}

export interface IHangout {
  _id?: string;
  title: string;
  description: string;
  category: HangoutCategory;
  campus: string;
  locationSpot: string; // e.g., "Library 3rd Floor Quiet Area"
  scheduledTime: Date;
  expiresAt: Date;
  maxParticipants: number;
  hostPseudonym: string;
  hostAvatarColor: string;
  hostUserId?: string;
  participants: IHangoutParticipant[];
  status: HangoutStatus;
  createdAt: Date;
  updatedAt: Date;
}
