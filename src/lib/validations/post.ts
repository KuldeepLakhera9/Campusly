import { z } from "zod";

export const createPostSchema = z.object({
  content: z
    .string()
    .min(5, "Post content must be at least 5 characters.")
    .max(800, "Post cannot exceed 800 characters."),
  circle: z.enum([
    "All Circles",
    "Academics",
    "Dorm Life",
    "Late Night",
    "Course Advice",
    "Lost & Found",
    "Campus Confessions",
    "Opportunities",
  ]),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
