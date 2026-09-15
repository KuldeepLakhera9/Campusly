import { z } from "zod";

export const CAMPUS_INTERESTS_LIST = [
  "Coding",
  "Gaming",
  "Cricket",
  "Football",
  "Music",
  "Movies",
  "Photography",
  "Fitness",
  "Books",
  "Travel",
  "Entrepreneurship",
  "Study",
  "Startups",
  "Technology",
  "Food",
  "Chai",
  "Events",
  "Art",
] as const;

export const registerSchema = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Please enter a valid university email address."),
    collegeId: z.string().optional(),
    collegeName: z.string().min(2, "Please select or verify your college."),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .regex(/[a-zA-Z]/, "Password must include at least one letter.")
      .regex(/[0-9]/, "Password must include at least one number."),
    confirmPassword: z.string(),
    termsAccepted: z.literal(true, {
      message: "You must accept the Campusly Terms and Honor Code.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please enter a valid university email address."),
  password: z.string().min(1, "Password is required."),
  rememberMe: z.boolean().default(true),
});

export const onboardingSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters.")
    .max(24, "Username cannot exceed 24 characters.")
    .regex(/^[a-zA-Z0-9]+$/, "Username can only contain letters and numbers."),
  avatarId: z.string().default("terracotta-prism"),
  avatarColor: z.string().default("#C15438"),
  bio: z
    .string()
    .max(240, "Bio cannot exceed 240 characters.")
    .default(""),
  interests: z
    .array(z.string())
    .min(3, "Please select at least 3 campus interests.")
    .max(8, "You can select up to 8 interests."),
});

export const updateProfileSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters.")
    .max(24, "Username cannot exceed 24 characters.")
    .regex(/^[a-zA-Z0-9]+$/, "Username can only contain letters and numbers.")
    .optional(),
  avatarId: z.string().optional(),
  avatarColor: z.string().optional(),
  bio: z.string().max(240, "Bio cannot exceed 240 characters.").optional(),
  interests: z
    .array(z.string())
    .min(3, "Please select at least 3 campus interests.")
    .max(8, "You can select up to 8 interests.")
    .optional(),
  lookingFor: z
    .array(z.string())
    .max(5, "You can select up to 5 activity preferences.")
    .optional(),
  privacySettings: z
    .object({
      hideMajor: z.boolean().optional(),
      allowDirectMessages: z.boolean().optional(),
      revealNameOnMutualFollow: z.boolean().optional(),
      autoExpireHangouts: z.boolean().optional(),
      appearInFindPeople: z.boolean().optional(),
      showInterests: z.boolean().optional(),
    })
    .optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
