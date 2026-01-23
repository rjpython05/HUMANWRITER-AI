import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth-config";

/**
 * Auth.js v5 export
 * This file is required for middleware and server-side auth
 */

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);
