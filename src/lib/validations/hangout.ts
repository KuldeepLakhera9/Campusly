import { z } from "zod";

export const createHangoutSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters.")
    .max(100, "Title is too long (max 100 characters)."),
  description: z
    .string()
    .min(10, "Please provide a brief description.")
    .max(400, "Description max 400 characters."),
  category: z.enum([
    "Study",
    "Food & Drink",
    "Campus Walk",
    "Sports & Fitness",
    "Gaming",
    "Creative",
    "Late Night",
    "Other",
  ]),
  locationSpot: z
    .string()
    .min(3, "Specific spot is required (e.g., 'Main Library 2nd Floor West').")
    .max(100),
  maxParticipants: z
    .number()
    .min(2, "Minimum 2 people.")
    .max(20, "Maximum 20 people for spontaneous groups."),
  durationHours: z.number().min(1).max(6).default(2),
});

export type CreateHangoutInput = z.infer<typeof createHangoutSchema>;
