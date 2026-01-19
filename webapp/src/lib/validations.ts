import { z } from "zod";

// Auth validations
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Generation validations
export const generationSchema = z.object({
  mode: z.enum(["prompt", "document"]),
  discipline: z.string().min(1, "Please select a discipline"),
  model: z.string().optional(),
  prompt: z.string().optional(),
  documentId: z.string().optional(),
  targetLength: z.number().min(100).max(10000).optional(),
  creativity: z.number().min(0).max(1).optional(),
  formality: z.enum(["casual", "neutral", "formal"]).optional(),
}).refine(
  (data) => {
    if (data.mode === "prompt") {
      return data.prompt && data.prompt.length >= 10;
    }
    if (data.mode === "document") {
      return !!data.documentId;
    }
    return false;
  },
  {
    message: "Invalid generation parameters",
    path: ["mode"],
  }
);

// Corpus validations
export const corpusUploadSchema = z.object({
  file: z.instanceof(File).refine((file) => file.size <= 10 * 1024 * 1024, {
    message: "File size must be less than 10MB",
  }),
  discipline: z.string().min(1, "Please select a discipline"),
  metadata: z.object({
    author: z.string().optional(),
    year: z.number().optional(),
    source: z.string().optional(),
  }).optional(),
});

export const corpusFilterSchema = z.object({
  discipline: z.string().optional(),
  search: z.string().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
});

// User validations
export const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
});

export const updateUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  email: z.string().email("Invalid email address").optional(),
  role: z.enum(["USER", "ADMIN"]).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED", "BANNED"]).optional(),
});

// Admin validations
export const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["USER", "ADMIN"]).default("USER"),
});

export const bulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1, "At least one item must be selected"),
});

// Settings validations
export const settingsSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).default("system"),
  language: z.string().default("en"),
  notifications: z.object({
    email: z.boolean().default(true),
    push: z.boolean().default(false),
  }),
  privacy: z.object({
    shareData: z.boolean().default(false),
    publicProfile: z.boolean().default(false),
  }),
});

// Export types
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type GenerationInput = z.infer<typeof generationSchema>;
export type CorpusUploadInput = z.infer<typeof corpusUploadSchema>;
export type CorpusFilterInput = z.infer<typeof corpusFilterSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type BulkDeleteInput = z.infer<typeof bulkDeleteSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
