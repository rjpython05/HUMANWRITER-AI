import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth-config";

/**
 * NextAuth v5 (Auth.js) route handler for /api/auth/*
 */

const { handlers } = NextAuth(authConfig);

export const { GET, POST } = handlers;
