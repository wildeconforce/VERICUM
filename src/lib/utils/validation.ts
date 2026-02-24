import { z } from "zod";
import { CATEGORIES, LICENSE_TYPES } from "@/lib/constants";

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be at most 50 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, hyphens, and underscores"),
  display_name: z.string().min(1, "Display name is required").max(100),
});

export const contentUploadSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(255),
  description: z.string().max(5000).optional(),
  content_type: z.enum(["photo", "video", "document", "audio"]),
  price: z.number().min(0.5, "Minimum price is $0.50").max(50000),
  currency: z.enum(["USD", "KRW"]).default("USD"),
  license_type: z.enum(LICENSE_TYPES).default("standard"),
  tags: z.array(z.string().max(50)).max(20).default([]),
  category: z.enum(CATEGORIES).optional(),
  sale_type: z.enum(["premium", "royalty"]).default("premium"),
  royalty_rate: z.number().min(0).max(0.25).default(0),
});

export const profileUpdateSchema = z.object({
  display_name: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  avatar_url: z.string().url().optional(),
});

export const searchSchema = z.object({
  q: z.string().min(1).max(200),
  type: z.enum(["photo", "video", "document", "audio"]).optional(),
  category: z.string().optional(),
  verified_only: z.boolean().default(true),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ContentUploadInput = z.infer<typeof contentUploadSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
