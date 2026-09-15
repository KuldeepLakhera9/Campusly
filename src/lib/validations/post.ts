import { z } from "zod";

export const POST_CATEGORY_ENUM = [
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
] as const;

export const REPORT_REASON_ENUM = [
  "Harassment",
  "Bullying",
  "Spam",
  "Hate / abusive content",
  "Sexual content",
  "Threat",
  "Impersonation",
  "Other",
] as const;

export const createPostSchema = z.object({
  content: z
    .string()
    .trim()
    .min(3, "Post must contain at least 3 characters.")
    .max(2000, "Post cannot exceed 2,000 characters."),
  category: z.enum(POST_CATEGORY_ENUM, {
    message: "Please select a valid post category.",
  }),
});

export const createCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Comment cannot be empty.")
    .max(1000, "Comment cannot exceed 1,000 characters."),
});

export const createReportSchema = z.object({
  targetId: z.string().min(1, "Target ID is required."),
  targetType: z.enum(["post", "comment"], {
    message: "Target type must be 'post' or 'comment'.",
  }),
  reason: z.enum(REPORT_REASON_ENUM, {
    message: "Please select a valid report reason.",
  }),
  details: z
    .string()
    .trim()
    .max(500, "Details cannot exceed 500 characters.")
    .optional(),
});

export const postQuerySchema = z.object({
  category: z.string().optional(),
  sort: z.enum(["latest", "popular", "trending"]).default("latest"),
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
  cursor: z.string().optional(),
});
