import { Response } from 'express';
import { AuthRequest, UserLoginDto, UserRegistrationDto, AuthResponse } from '../types';
import { sendSuccess, sendError } from '../utils/helpers';
import { logger } from '../utils/logger';
import * as userService from '../services/user.service';
import { throwApiError } from '../middleware/error-handler.middleware';

/**
 * Register a new user
 */
export const register = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const data: UserRegistrationDto = req.body;

    // Create user
    const user = await userService.createUser(data);

    // Generate tokens
    const tokens = await userService.generateTokens(user);

    // Convert user to response format
    const userResponse = userService.toUserResponse(user);

    // Send response
    const response: AuthResponse = {
      user: userResponse,
      tokens,
    };

    logger.info('User registered successfully', {
      userId: user.id,
      email: user.email,
    });

    sendSuccess(res, response, 201);
  } catch (error) {
    logger.error('Registration failed', { error, body: req.body });
    throw error;
  }
};

/**
 * Login user
 */
export const login = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const data: UserLoginDto = req.body;

    // Validate credentials
    const user = await userService.validateCredentials(
      data.email,
      data.password
    );

    // Generate tokens
    const tokens = await userService.generateTokens(user);

    // Convert user to response format
    const userResponse = userService.toUserResponse(user);

    // Send response
    const response: AuthResponse = {
      user: userResponse,
      tokens,
    };

    logger.info('User logged in successfully', {
      userId: user.id,
      email: user.email,
    });

    sendSuccess(res, response);
  } catch (error) {
    logger.error('Login failed', { error });
    throw error;
  }
};

/**
 * Refresh access token
 */
export const refreshToken = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throwApiError('Refresh token is required', 400, 'MISSING_REFRESH_TOKEN');
    }

    // Refresh tokens
    const tokens = await userService.refreshAccessToken(refreshToken);

    logger.info('Token refreshed successfully');

    sendSuccess(res, { tokens });
  } catch (error) {
    logger.error('Token refresh failed', { error });
    throw error;
  }
};

/**
 * Get current user profile
 */
export const getProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      throwApiError('Authentication required', 401, 'NO_AUTH');
    }

    // Get user from database
    const user = await userService.findUserById(req.user!.id);

    if (!user) {
      throwApiError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Convert to response format
    const userResponse = userService.toUserResponse(user!);

    sendSuccess(res, userResponse);
  } catch (error) {
    logger.error('Failed to get profile', { error, userId: req.user?.id });
    throw error;
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      throwApiError('Authentication required', 401, 'NO_AUTH');
    }

    const updates = req.body;

    // Update user profile
    const user = await userService.updateUserProfile(req.user!.id, updates);

    // Convert to response format
    const userResponse = userService.toUserResponse(user);

    logger.info('User profile updated', { userId: user.id });

    sendSuccess(res, userResponse);
  } catch (error) {
    logger.error('Failed to update profile', {
      error,
      userId: req.user?.id,
    });
    throw error;
  }
};

/**
 * Logout user (revoke refresh token)
 */
export const logout = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // In a real implementation, you would decode the token and revoke it
      // For now, we'll just log the logout
      logger.info('User logged out', { userId: req.user?.id });
    }

    sendSuccess(res, { message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout failed', { error, userId: req.user?.id });
    throw error;
  }
};

/**
 * Get user statistics
 */
export const getStats = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      throwApiError('Authentication required', 401, 'NO_AUTH');
    }

    const user = await userService.findUserById(req.user!.id);

    if (!user) {
      throwApiError('User not found', 404, 'USER_NOT_FOUND');
    }

    const stats = {
      generationsCount: user!.generationsCount,
      generationsThisMonth: user!.generationsThisMonth,
      lastGenerationAt: user!.lastGenerationAt,
      plan: user!.plan,
      memberSince: user!.createdAt,
    };

    sendSuccess(res, stats);
  } catch (error) {
    logger.error('Failed to get user stats', {
      error,
      userId: req.user?.id,
    });
    throw error;
  }
};

/**
 * Check generation limit
 */
export const checkLimit = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      throwApiError('Authentication required', 401, 'NO_AUTH');
    }

    const canGenerate = await userService.checkGenerationLimit(req.user!.id);
    const user = await userService.findUserById(req.user!.id);

    if (!user) {
      throwApiError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Define limits
    const limits: Record<string, number> = {
      FREE: 10,
      PRO: 100,
      ENTERPRISE: -1,
    };

    const limit = limits[user!.plan];
    const remaining =
      limit === -1 ? -1 : limit - user!.generationsThisMonth;

    sendSuccess(res, {
      canGenerate,
      plan: user!.plan,
      limit,
      used: user!.generationsThisMonth,
      remaining,
    });
  } catch (error) {
    logger.error('Failed to check generation limit', {
      error,
      userId: req.user?.id,
    });
    throw error;
  }
};

export default {
  register,
  login,
  refreshToken,
  getProfile,
  updateProfile,
  logout,
  getStats,
  checkLimit,
};
