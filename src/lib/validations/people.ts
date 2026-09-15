import { z } from "zod";

export const peopleQuerySchema = z.object({
  search: z.string().trim().max(50).optional(),
  interest: z.string().trim().max(40).optional(),
  intent: z.string().trim().max(40).optional(),
  minShared: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .refine((val) => val === undefined || (!isNaN(val) && val >= 1 && val <= 10), {
      message: "minShared must be between 1 and 10",
    }),
  sort: z
    .enum(["recommended", "shared", "active", "newest"])
    .default("recommended"),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 18))
    .refine((val) => !isNaN(val) && val >= 1 && val <= 50, {
      message: "limit must be between 1 and 50",
    }),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => !isNaN(val) && val >= 1, {
      message: "page must be at least 1",
    }),
});

export type PeopleQueryInput = z.infer<typeof peopleQuerySchema>;
