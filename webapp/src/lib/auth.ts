import { auth } from "@/auth";

/**
 * Auth.js v5 helper functions
 * For route handlers and server components
 */

/**
 * Get server session (Auth.js v5)
 */
export async function getServerSession() {
  return auth();
}

/**
 * Protect API route - throw error if not authenticated
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session;
}

/**
 * Protect API route - require admin role
 */
export async function requireAdmin() {
  const session = await requireAuth();
  if ((session.user as any).role !== "ADMIN") {
    throw new Error("Forbidden - Admin access required");
  }
  return session;
}

/**
 * Check if user is authenticated (returns null if not)
 */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user || null;
}
