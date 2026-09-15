export type CampusCircle =
  | "All Circles"
  | "Academics"
  | "Dorm Life"
  | "Late Night"
  | "Course Advice"
  | "Lost & Found"
  | "Campus Confessions"
  | "Opportunities";

export interface IPost {
  _id?: string;
  content: string;
  authorPseudonym: string;
  authorAvatarColor: string;
  authorUserId?: string;
  campus: string;
  circle: CampusCircle;
  upvotesCount: number;
  repliesCount: number;
  userUpvoted?: boolean;
  tags?: string[];
  createdAt: Date;
  updatedAt?: Date;
}
