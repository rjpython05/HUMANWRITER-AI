import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { User, Role, Plan } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { config } from '../config/config';
import {
  UserRegistrationDto,
  UserLoginDto,
  UserResponse,
  AuthTokens,
  JwtPayload,
  RefreshTokenPayload,
} from '../types';
import { logger } from '../utils/logger';
import { throwApiError } from '../middleware/error-handler.middleware';

/**
 * Create a new user
 */
export const createUser = async (
  data: UserRegistrationDto
): Promise<User> => {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throwApiError('User with this email already exists', 409, 'USER_EXISTS');
    }

    // Hash password with 12 rounds for better security (OWASP recommendation)
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: Role.USER,
        plan: Plan.FREE,
      },
    });

    logger.info('User created', { userId: user.id, email: user.email });
    return user;
  } catch (error) {
    logger.error('Failed to create user', { error, email: data.email });
    throw error;
  }
};

/**
 * Find user by email
 */
export const findUserByEmail = async (
  email: string
): Promise<User | null> => {
  try {
    return await prisma.user.findUnique({
      where: { email },
    });
  } catch (error) {
    logger.error('Failed to find user by email', { error, email });
    throw error;
  }
};

/**
 * Find user by ID
 */
export const findUserById = async (userId: string): Promise<User | null> => {
  try {
    return await prisma.user.findUnique({
      where: { id: userId },
    });
  } catch (error) {
    logger.error('Failed to find user by ID', { error, userId });
    throw error;
  }
};

/**
 * Validate user credentials
 */
export const validateCredentials = async (
  email: string,
  password: string
): Promise<User> => {
  try {
    // Find user
    const user = await findUserByEmail(email);

    if (!user) {
      throwApiError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // Check if user is active
    if (!user.isActive) {
      throwApiError('Account is disabled', 403, 'ACCOUNT_DISABLED');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throwApiError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return user;
  } catch (error) {
    logger.error('Failed to validate credentials', { error, email });
    throw error;
  }
};

/**
 * Generate JWT access and refresh tokens
 */
export const generateTokens = async (user: User): Promise<AuthTokens> => {
  try {
    // Generate access token payload
    const accessPayload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      plan: user.plan,
    };

    // Generate access token
    const accessToken = jwt.sign(accessPayload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    });

    // Generate refresh token ID
    const tokenId = uuidv4();
    const refreshPayload: RefreshTokenPayload = {
      userId: user.id,
      tokenId,
    };

    // Generate refresh token
    const refreshToken = jwt.sign(refreshPayload, config.jwtSecret, {
      expiresIn: config.jwtRefreshExpiresIn,
    });

    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    await prisma.refreshToken.create({
      data: {
        id: tokenId,
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: config.jwtExpiresIn,
    };
  } catch (error) {
    logger.error('Failed to generate tokens', { error, userId: user.id });
    throw error;
  }
};

/**
 * Refresh access token
 */
export const refreshAccessToken = async (
  refreshToken: string
): Promise<AuthTokens> => {
  try {
    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken,
      config.jwtSecret
    ) as RefreshTokenPayload;

    // Check if token exists in database and is not revoked
    const storedToken = await prisma.refreshToken.findUnique({
      where: { id: decoded.tokenId },
    });

    if (!storedToken || storedToken.isRevoked) {
      throwApiError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }

    // Check if token is expired
    if (storedToken.expiresAt < new Date()) {
      throwApiError('Refresh token expired', 401, 'REFRESH_TOKEN_EXPIRED');
    }

    // Get user
    const user = await findUserById(decoded.userId);

    if (!user || !user.isActive) {
      throwApiError('User not found or inactive', 401, 'USER_NOT_FOUND');
    }

    // Generate new tokens
    return await generateTokens(user);
  } catch (error) {
    logger.error('Failed to refresh access token', { error });
    throw error;
  }
};

/**
 * Revoke refresh token
 */
export const revokeRefreshToken = async (tokenId: string): Promise<void> => {
  try {
    await prisma.refreshToken.update({
      where: { id: tokenId },
      data: { isRevoked: true },
    });

    logger.info('Refresh token revoked', { tokenId });
  } catch (error) {
    logger.error('Failed to revoke refresh token', { error, tokenId });
    throw error;
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (
  userId: string,
  data: {
    name?: string;
    email?: string;
    password?: string;
    currentPassword?: string;
  }
): Promise<User> => {
  try {
    const user = await findUserById(userId);

    if (!user) {
      throwApiError('User not found', 404, 'USER_NOT_FOUND');
    }

    // If updating password, verify current password
    if (data.password) {
      if (!data.currentPassword) {
        throwApiError(
          'Current password required',
          400,
          'CURRENT_PASSWORD_REQUIRED'
        );
      }

      const isPasswordValid = await bcrypt.compare(
        data.currentPassword,
        user.password
      );

      if (!isPasswordValid) {
        throwApiError('Current password is incorrect', 401, 'INVALID_PASSWORD');
      }

      // Hash new password with 12 rounds for better security
      data.password = await bcrypt.hash(data.password, 12);
    }

    // If updating email, check if new email is already taken
    if (data.email && data.email !== user.email) {
      const existingUser = await findUserByEmail(data.email);

      if (existingUser) {
        throwApiError('Email already in use', 409, 'EMAIL_IN_USE');
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        email: data.email,
        password: data.password,
      },
    });

    logger.info('User profile updated', { userId });
    return updatedUser;
  } catch (error) {
    logger.error('Failed to update user profile', { error, userId });
    throw error;
  }
};

/**
 * Convert User to UserResponse (remove sensitive data)
 */
export const toUserResponse = (user: User): UserResponse => {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    plan: user.plan,
    isActive: user.isActive,
    generationsCount: user.generationsCount,
    generationsThisMonth: user.generationsThisMonth,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  };
};

/**
 * Increment user generation count
 */
export const incrementGenerationCount = async (
  userId: string
): Promise<void> => {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        generationsCount: { increment: 1 },
        generationsThisMonth: { increment: 1 },
        lastGenerationAt: new Date(),
      },
    });
  } catch (error) {
    logger.error('Failed to increment generation count', { error, userId });
    throw error;
  }
};

/**
 * Check if user has reached generation limit
 */
export const checkGenerationLimit = async (userId: string): Promise<boolean> => {
  try {
    const user = await findUserById(userId);

    if (!user) {
      return false;
    }

    // Define limits per plan
    const limits: Record<Plan, number> = {
      FREE: 10,
      PRO: 100,
      ENTERPRISE: -1, // Unlimited
    };

    const limit = limits[user.plan];

    // If unlimited, always allow
    if (limit === -1) {
      return true;
    }

    // Check if user has reached limit
    return user.generationsThisMonth < limit;
  } catch (error) {
    logger.error('Failed to check generation limit', { error, userId });
    throw error;
  }
};

/**
 * Reset monthly generation counts (called by a cron job)
 */
export const resetMonthlyGenerationCounts = async (): Promise<void> => {
  try {
    await prisma.user.updateMany({
      data: {
        generationsThisMonth: 0,
      },
    });

    logger.info('Monthly generation counts reset');
  } catch (error) {
    logger.error('Failed to reset monthly generation counts', { error });
    throw error;
  }
};
