export type HangoutCategory =
  | "Chai"
  | "Food"
  | "Cricket"
  | "Football"
  | "Gaming"
  | "Coding"
  | "Study"
  | "Gym"
  | "Movie"
  | "Photography"
  | "Music"
  | "Walk"
  | "Project"
  | "Travel"
  | "Other";

export const HANGOUT_ACTIVITIES: HangoutCategory[] = [
  "Chai",
  "Food",
  "Cricket",
  "Football",
  "Gaming",
  "Coding",
  "Study",
  "Gym",
  "Movie",
  "Photography",
  "Music",
  "Walk",
  "Project",
  "Travel",
  "Other",
];

export const CAMPUS_LOCATIONS = [
  "Main Canteen",
  "College Ground",
  "Library",
  "College Gate",
  "Cafeteria",
  "Hostel Quad",
  "Auditorium",
  "Department Building",
  "Workshop",
  "Student Center",
  "Parking",
  "Other",
] as const;

export type HangoutStatus = "open" | "full" | "ongoing" | "completed" | "cancelled";

export interface IActivity {
  _id?: string;
  name: string;
  slug: string;
  icon: string;
  category: string;
  isActive: boolean;
}

export interface IHangoutParticipant {
  userId?: string;
  pseudonym: string;
  avatarId?: string;
  avatarColor: string;
  joinedAt: string | Date;
}

export interface IHangoutCreator {
  username: string;
  avatarId: string;
  avatarColor: string;
}

export interface IHangout {
  _id: string;
  title: string;
  description: string;
  activity?: string;
  location?: string;
  date?: string | Date;
  startTime?: string;
  endTime?: string;
  scheduledAt?: string | Date;
  maxParticipants: number;
  participantsCount?: number;
  participants: IHangoutParticipant[];
  creator?: IHangoutCreator;
  collegeName?: string;
  collegeDomain?: string;
  status: HangoutStatus;
  isCreator?: boolean;
  hasJoined?: boolean;
  shareToFeed?: boolean;
  createdAt: string | Date;
  updatedAt?: string | Date;

  // Backward compatibility fields
  category?: string;
  campus?: string;
  locationSpot?: string;
  scheduledTime?: string | Date;
  expiresAt?: string | Date;
  hostPseudonym?: string;
  hostAvatarColor?: string;
  hostUserId?: string;
}

export type HangoutDateFilter = "all" | "today" | "tomorrow" | "this_week";
export type HangoutAvailabilityFilter = "all" | "has_spots" | "almost_full";
