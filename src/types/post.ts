export type CampusCircle =
  | "All Circles"
  | "Academics"
  | "Dorm Life"
  | "Late Night"
  | "Course Advice"
  | "Lost & Found"
  | "Campus Confessions"
  | "Opportunities";

export type PostCategory =
  | "Discussion"
  | "Question"
  | "Confession"
  | "Hangout"
  | "Study"
  | "Recommendation"
  | "Event"
  | "Lost & Found"
  | "Campus"
  | "Random";

export const POST_CATEGORIES: PostCategory[] = [
  "Discussion",
  "Question",
  "Confession",
  "Hangout",
  "Study",
  "Recommendation",
  "Event",
  "Lost & Found",
  "Campus",
  "Random",
];

export type PostSortOption = "latest" | "popular" | "trending";

export interface IPostAuthor {
  id?: string;
  username: string;
  avatarId: string;
  avatarColor: string;
}

export interface IPost {
  _id: string;
  content: string;
  category: PostCategory;
  author: IPostAuthor;
  collegeName: string;
  collegeDomain: string;
  reactionCount: number;
  commentCount: number;
  hasReacted?: boolean;
  isAuthor?: boolean;
  createdAt: string | Date;
  updatedAt?: string | Date;

  // Backward compatibility fields with Phase 1 mocks and UI:
  circle?: string;
  authorPseudonym?: string;
  authorAvatarColor?: string;
  authorUserId?: string;
  campus?: string;
  upvotesCount?: number;
  repliesCount?: number;
  userUpvoted?: boolean;
  tags?: string[];
}

export interface IComment {
  _id: string;
  postId: string;
  content: string;
  author: IPostAuthor;
  isAuthor?: boolean;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

export interface IReaction {
  _id?: string;
  post: string;
  user: string;
  type: string;
  createdAt: string | Date;
}

export type ReportReason =
  | "Harassment"
  | "Bullying"
  | "Spam"
  | "Hate / abusive content"
  | "Sexual content"
  | "Threat"
  | "Impersonation"
  | "Other";

export const REPORT_REASONS: ReportReason[] = [
  "Harassment",
  "Bullying",
  "Spam",
  "Hate / abusive content",
  "Sexual content",
  "Threat",
  "Impersonation",
  "Other",
];

export interface IReport {
  _id?: string;
  reporter: string;
  target: string;
  targetType: "post" | "comment";
  reason: ReportReason;
  details?: string;
  status: "pending" | "reviewed" | "dismissed";
  createdAt: string | Date;
}
