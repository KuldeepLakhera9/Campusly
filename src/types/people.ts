export const CAMPUS_INTENTS_LIST = [
  "Study Partner",
  "Coding Partner",
  "Project Partner",
  "Gym Partner",
  "Gaming Partner",
  "Sports Partner",
  "Event Partner",
  "Photography Partner",
  "Travel Partner",
  "Just Meet People",
  "Anything",
] as const;

export type CampusIntent = (typeof CAMPUS_INTENTS_LIST)[number];

export interface IPersonMatch {
  user: {
    id: string;
    username: string;
    avatarId: string;
    avatarColor: string;
    bio?: string;
    collegeName: string;
    interests: string[];
    lookingFor?: string[];
    sparksCount: number;
    createdAt?: string;
  };
  score: number; // 0–100 normalized similarity score
  sharedInterests: string[];
  sharedCount: number;
  matchReasons: string[];
}

export type PeopleSortOption = "recommended" | "shared" | "active" | "newest";

export interface PeopleFilters {
  search?: string;
  interest?: string;
  intent?: string;
  minShared?: number;
  sort?: PeopleSortOption;
  cursor?: string;
  limit?: number;
}
