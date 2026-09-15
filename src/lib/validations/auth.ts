import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid university email address.")
    .refine(
      (email) =>
        email.endsWith(".edu") ||
        email.includes(".ac.") ||
        email.includes("campus") ||
        email.includes("university"),
      "Please use your official college or university email address."
    ),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .optional(),
  rememberMe: z.boolean().default(true),
});

export const registerSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid university email address.")
    .refine(
      (email) =>
        email.endsWith(".edu") ||
        email.includes(".ac.") ||
        email.includes("campus") ||
        email.includes("university"),
      "Registration requires an accredited .edu or university domain."
    ),
  universityName: z.string().min(2, "Please select or type your university."),
  pseudonym: z
    .string()
    .min(3, "Pseudonym must be at least 3 characters.")
    .max(30, "Pseudonym cannot exceed 30 characters."),
  interests: z.array(z.string()).min(1, "Select at least 1 campus interest."),
  agreedToHonorCode: z.literal(true, {
    message: "You must accept the Campus Honor Code.",
  }),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
