import { z } from "zod";

export const createHangoutSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must contain at least 3 characters.")
    .max(120, "Title cannot exceed 120 characters."),
  description: z
    .string()
    .trim()
    .max(1000, "Description cannot exceed 1,000 characters.")
    .optional()
    .default(""),
  activity: z
    .string()
    .trim()
    .min(2, "Activity is required.")
    .max(50, "Activity name is too long."),
  location: z
    .string()
    .trim()
    .min(2, "Please provide a campus spot.")
    .max(120, "Location cannot exceed 120 characters."),
  date: z
    .string()
    .min(1, "Date is required."),
  startTime: z
    .string()
    .min(1, "Start time is required."),
  endTime: z
    .string()
    .optional(),
  maxParticipants: z
    .coerce
    .number()
    .int()
    .min(2, "Capacity must be at least 2 students.")
    .max(30, "Capacity cannot exceed 30 students.")
    .default(4),
  shareToFeed: z
    .boolean()
    .optional()
    .default(true),
});

export const hangoutQuerySchema = z.object({
  activity: z.string().optional(),
  dateFilter: z.enum(["all", "today", "tomorrow", "this_week"]).default("all"),
  availability: z.enum(["all", "has_spots", "almost_full"]).default("all"),
  search: z.string().optional(),
  scope: z.enum(["all", "created", "joined"]).default("all"),
  limit: z.coerce.number().min(1).max(50).default(20),
  cursor: z.string().optional(),
});
