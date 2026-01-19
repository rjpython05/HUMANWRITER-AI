import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { AuthRequest, JwtPayload } from '../types';
import { config } from '../config/config';
import { logger, logSecurityEvent } from '../utils/logger';
import { sendError, getClientIp } from '../utils/helpers';

/**
 * Verify JWT token and attach user to request
 */
export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      sendError(res, 'Access token required', 401, 'NO_TOKEN');
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;

    // Attach user info to request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      plan: decoded.plan,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logSecurityEvent(
        'INVALID_TOKEN',
        undefined,
        getClientIp(req),
        { error: error.message }
      );
      sendError(res, 'Invalid token', 401, 'INVALID_TOKEN');
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      logSecurityEvent(
        'TOKEN_EXPIRED',
        undefined,
        getClientIp(req),
        { error: error.message }
      );
      sendError(res, 'Token expired', 401, 'TOKEN_EXPIRED');
      return;
    }

    logger.error('Token verification failed', { error });
    sendError(res, 'Authentication failed', 401, 'AUTH_FAILED');
  }
};

/**
 * Optional authentication - does not fail if token is missing
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        plan: decoded.plan,
      };
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

/**
 * Require specific role(s)
 */
export const requireRole = (...allowedRoles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required', 401, 'NO_AUTH');
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      logSecurityEvent(
        'UNAUTHORIZED_ACCESS',
        req.user.id,
        getClientIp(req),
        {
          requiredRoles: allowedRoles,
          userRole: req.user.role,
          path: req.path,
        }
      );
      sendError(
        res,
        'Insufficient permissions',
        403,
        'FORBIDDEN',
        { requiredRoles: allowedRoles, userRole: req.user.role }
      );
      return;
    }

    next();
  };
};

/**
 * Require admin role
 */
export const requireAdmin = requireRole(Role.ADMIN);

/**
 * Require user or admin role
 */
export const requireUser = requireRole(Role.USER, Role.ADMIN);

/**
 * Check if user is active
 */
export const requireActiveUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401, 'NO_AUTH');
      return;
    }

    // In a real implementation, you would check the database
    // For now, we assume the user is active if they have a valid token
    next();
  } catch (error) {
    logger.error('Failed to check user active status', { error });
    sendError(res, 'Failed to verify user status', 500);
  }
};

/**
 * Verify API key (alternative authentication method)
 */
export const authenticateApiKey = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      sendError(res, 'API key required', 401, 'NO_API_KEY');
      return;
    }

    // In a real implementation, you would verify the API key against the database
    // For now, we'll just send an error
    sendError(res, 'API key authentication not implemented', 501);
  } catch (error) {
    logger.error('API key verification failed', { error });
    sendError(res, 'Authentication failed', 401);
  }
};

/**
 * Middleware to check usage limits based on plan
 */
export const checkUsageLimits = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    // Define usage limits per plan
    const limits: Record<string, number> = {
      FREE: 10,
      PRO: 100,
      ENTERPRISE: -1, // Unlimited
    };

    const userLimit = limits[req.user.plan];

    // In a real implementation, you would check the user's usage from the database
    // For now, we'll just pass through
    next();
  } catch (error) {
    logger.error('Failed to check usage limits', { error });
    sendError(res, 'Failed to verify usage limits', 500);
  }
};

/**
 * Extract user ID from token without full authentication
 */
export const extractUserId = (token: string): string | null => {
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    return decoded.userId;
  } catch (error) {
    return null;
  }
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): JwtPayload | null => {
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};
