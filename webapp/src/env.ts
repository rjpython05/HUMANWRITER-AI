import { z } from "zod";

/**
 * Environment variables schema
 * CRITICAL: Only NEXT_PUBLIC_* variables are exposed to the client
 * Server-only variables (DATABASE_URL, AUTH_SECRET, etc.) are NOT included here
 */

// Server-side environment variables (NEVER exposed to client)
const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  NEXTAUTH_URL: z.string().url().optional(),
  AUTH_SECRET: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  // Optional: OAuth providers (if implementing social login)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
});

// Client-side environment variables (exposed to browser)
const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_API_URL: z.string().url(),
});

// Combined schema for type inference
const envSchema = serverSchema.merge(clientSchema);

// Parse and validate environment variables
const parseEnv = () => {
  // Only validate on server-side
  if (typeof window === "undefined") {
    try {
      return envSchema.parse({
        NODE_ENV: process.env.NODE_ENV,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        AUTH_SECRET: process.env.AUTH_SECRET,
        DATABASE_URL: process.env.DATABASE_URL,
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
        GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
        GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("❌ Invalid environment variables:");
        console.error(error.flatten().fieldErrors);
        throw new Error("Invalid environment variables");
      }
      throw error;
    }
  }

  // Client-side: only parse public variables
  try {
    return clientSchema.parse({
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
    }) as z.infer<typeof envSchema>;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Invalid public environment variables:");
      console.error(error.flatten().fieldErrors);
      throw new Error("Invalid public environment variables");
    }
    throw error;
  }
};

export const env = parseEnv();

export type Env = z.infer<typeof envSchema>;
