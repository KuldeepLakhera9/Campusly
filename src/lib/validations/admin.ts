import { z } from "zod";

export const updateReportSchema = z.object({
  status: z.enum(["pending", "reviewing", "resolved", "dismissed"]).optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  resolutionReason: z.string().trim().max(500).optional(),
  assignedTo: z.string().trim().optional().nullable(),
});

export const userModerationActionSchema = z.object({
  action: z.enum(["warn", "suspend", "ban", "unban", "change_role"]),
  duration: z
    .enum(["1h", "24h", "3d", "7d", "30d", "custom"])
    .optional(),
  durationHours: z.number().min(1).max(8760).optional(), // Up to 1 year for custom
  reason: z.string().trim().min(3, "A valid reason is required.").max(500),
  moderationNote: z.string().trim().max(1000).optional(),
  targetRole: z.enum(["student", "moderator", "admin"]).optional(),
});

export const contentModerationActionSchema = z.object({
  action: z.enum(["remove", "restore"]),
  reason: z.string().trim().min(3, "A reason must be provided.").max(500),
});

export const unifiedReportSchema = z.object({
  targetId: z.string().trim().min(1, "Target ID is required."),
  targetType: z.enum(["post", "comment", "message", "user", "hangout"]),
  reason: z.string().trim().min(2, "Please choose a valid report reason."),
  details: z.string().trim().max(1000).optional(),
});

export const reportsQuerySchema = z.object({
  status: z.enum(["pending", "reviewing", "resolved", "dismissed", "all"]).default("pending"),
  priority: z.enum(["low", "medium", "high", "critical", "all"]).optional(),
  targetType: z.enum(["post", "comment", "message", "user", "hangout", "all"]).optional(),
  search: z.string().trim().max(100).optional(),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => !isNaN(val) && val >= 1, { message: "Invalid page" }),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .refine((val) => !isNaN(val) && val >= 1 && val <= 50, { message: "Invalid limit" }),
});

export const usersQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  role: z.enum(["student", "moderator", "admin", "all"]).optional(),
  moderationStatus: z.enum(["active", "warned", "suspended", "banned", "all"]).optional(),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => !isNaN(val) && val >= 1, { message: "Invalid page" }),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .refine((val) => !isNaN(val) && val >= 1 && val <= 50, { message: "Invalid limit" }),
});

export const auditLogsQuerySchema = z.object({
  action: z.string().trim().optional(),
  actor: z.string().trim().optional(),
  targetType: z.string().trim().optional(),
  search: z.string().trim().max(100).optional(),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => !isNaN(val) && val >= 1, { message: "Invalid page" }),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 25))
    .refine((val) => !isNaN(val) && val >= 1 && val <= 100, { message: "Invalid limit" }),
});

export const contentQuerySchema = z.object({
  type: z.enum(["post", "comment"]).default("post"),
  status: z.enum(["active", "deleted", "all"]).default("all"),
  search: z.string().trim().max(100).optional(),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => !isNaN(val) && val >= 1, { message: "Invalid page" }),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .refine((val) => !isNaN(val) && val >= 1 && val <= 50, { message: "Invalid limit" }),
});
