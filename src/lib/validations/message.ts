import { z } from "zod";
import { REPORT_REASONS } from "@/types/post";

export const createConversationSchema = z.object({
  recipientId: z.string().min(1, "Recipient ID is required."),
});

export const sendMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Message cannot be empty.")
    .max(1000, "Message cannot exceed 1000 characters."),
});

export const messageQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(50).default(30),
  cursor: z.string().optional(),
});

export const reportMessageSchema = z.object({
  reason: z.enum(REPORT_REASONS),
  details: z.string().max(500, "Details cannot exceed 500 characters.").optional(),
});
