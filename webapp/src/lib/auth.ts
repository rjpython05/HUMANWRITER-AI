import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { compare } from "bcryptjs";
import prisma from "@/lib/prisma";
import { env } from "@/env";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    signOut: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        const isPasswordValid = await compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  secret: env.NEXTAUTH_SECRET,
};

/**
 * Get server session
 */
export async function getServerSession() {
  const { getServerSession: nextGetServerSession } = await import("next-auth");
  return nextGetServerSession(authOptions);
}

/**
 * Protect API route - throw error if not authenticated
 */
export async function requireAuth() {
  const session = await getServerSession();
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
  if (session.user.role !== "ADMIN") {
    throw new Error("Forbidden - Admin access required");
  }
  return session;
}

/**
 * Check if user is authenticated (returns null if not)
 */
export async function getCurrentUser() {
  const session = await getServerSession();
  return session?.user || null;
}
