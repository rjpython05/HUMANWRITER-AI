export type UserRole = "GUEST" | "USER" | "ADMIN";
export type UserStatus = "ACTIVE" | "SUSPENDED" | "BANNED";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
  lastLoginAt?: Date | string | null;
  emailVerified?: Date | string | null;
}

export interface UserProfile extends User {
  generationCount: number;
  corpusCount: number;
  totalWordsGenerated: number;
}

export interface UserStats {
  totalGenerations: number;
  totalCorpusDocuments: number;
  totalWordsGenerated: number;
  averageHumanizationScore: number;
  recentActivity: {
    date: string;
    count: number;
  }[];
}

export interface Session {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  };
  expires: string;
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
    };
  }

  interface User {
    role: UserRole;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
  }
}
