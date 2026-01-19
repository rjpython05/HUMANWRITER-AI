import rateLimit from 'express-rate-limit';
import { config } from '../config/config';
import { logger } from '../utils/logger';

/**
 * General API rate limiter
 */
export const generalRateLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs, // 15 minutes by default
  max: config.rateLimitMaxRequests, // 100 requests per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many requests, please try again later',
      code: 'RATE_LIMIT_EXCEEDED',
    },
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });
    res.status(429).json({
      success: false,
      error: {
        message: 'Too many requests, please try again later',
        code: 'RATE_LIMIT_EXCEEDED',
      },
    });
  },
});

/**
 * Stricter rate limiter for authentication endpoints
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many authentication attempts, please try again later',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req, res) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      email: req.body.email,
    });
    res.status(429).json({
      success: false,
      error: {
        message: 'Too many authentication attempts, please try again later',
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
      },
    });
  },
});

/**
 * Rate limiter for text generation endpoints
 */
export const generationRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 generations per hour for free users
  message: {
    success: false,
    error: {
      message: 'Generation limit exceeded, please upgrade your plan or try again later',
      code: 'GENERATION_RATE_LIMIT_EXCEEDED',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Dynamic limit based on user plan
  keyGenerator: (req: any) => {
    // Use user ID if authenticated, otherwise use IP
    return req.user?.id || req.ip;
  },
  handler: (req, res) => {
    logger.warn('Generation rate limit exceeded', {
      userId: (req as any).user?.id,
      ip: req.ip,
      plan: (req as any).user?.plan,
    });
    res.status(429).json({
      success: false,
      error: {
        message: 'Generation limit exceeded, please upgrade your plan or try again later',
        code: 'GENERATION_RATE_LIMIT_EXCEEDED',
      },
    });
  },
});

/**
 * Rate limiter for file uploads
 */
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per hour
  message: {
    success: false,
    error: {
      message: 'Upload limit exceeded, please try again later',
      code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => {
    return req.user?.id || req.ip;
  },
  handler: (req, res) => {
    logger.warn('Upload rate limit exceeded', {
      userId: (req as any).user?.id,
      ip: req.ip,
    });
    res.status(429).json({
      success: false,
      error: {
        message: 'Upload limit exceeded, please try again later',
        code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
      },
    });
  },
});

/**
 * Rate limiter for admin endpoints
 */
export const adminRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many admin requests, please try again later',
      code: 'ADMIN_RATE_LIMIT_EXCEEDED',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => {
    return req.user?.id || req.ip;
  },
});

/**
 * Flexible rate limiter factory
 */
export const createRateLimiter = (options: {
  windowMs?: number;
  max?: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
}) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000,
    max: options.max || 100,
    message: {
      success: false,
      error: {
        message: options.message || 'Too many requests, please try again later',
        code: 'RATE_LIMIT_EXCEEDED',
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    handler: (req, res) => {
      logger.warn('Custom rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        userId: (req as any).user?.id,
      });
      res.status(429).json({
        success: false,
        error: {
          message: options.message || 'Too many requests, please try again later',
          code: 'RATE_LIMIT_EXCEEDED',
        },
      });
    },
  });
};
