import { Response } from 'express';
import {
  ApiResponse,
  PaginationParams,
  PaginationMeta,
  PaginatedResponse,
} from '../types';

/**
 * Send a successful API response
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: any
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    ...(meta && { meta }),
  };
  return res.status(statusCode).json(response);
};

/**
 * Send an error API response
 */
export const sendError = (
  res: Response,
  message: string,
  statusCode = 500,
  code?: string,
  details?: any
): Response => {
  const response: ApiResponse = {
    success: false,
    error: {
      message,
      ...(code && { code }),
      ...(details && { details }),
    },
  };
  return res.status(statusCode).json(response);
};

/**
 * Send a paginated response
 */
export const sendPaginatedResponse = <T>(
  res: Response,
  data: T[],
  meta: PaginationMeta,
  statusCode = 200
): Response => {
  const response: ApiResponse<PaginatedResponse<T>> = {
    success: true,
    data: {
      data,
      meta,
    },
  };
  return res.status(statusCode).json(response);
};

/**
 * Calculate pagination parameters
 */
export const getPaginationParams = (
  page?: number | string,
  limit?: number | string
): PaginationParams => {
  const pageNum = typeof page === 'string' ? parseInt(page, 10) : page || 1;
  const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : limit || 10;

  return {
    page: Math.max(1, pageNum),
    limit: Math.min(100, Math.max(1, limitNum)), // Max 100 items per page
  };
};

/**
 * Calculate pagination metadata
 */
export const getPaginationMeta = (
  page: number,
  limit: number,
  totalItems: number
): PaginationMeta => {
  const totalPages = Math.ceil(totalItems / limit);

  return {
    currentPage: page,
    pageSize: limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
};

/**
 * Calculate skip value for pagination
 */
export const getSkipValue = (page: number, limit: number): number => {
  return (page - 1) * limit;
};

/**
 * Sanitize user input to prevent XSS
 */
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return input;

  return input
    .replace(/[<>]/g, '') // Remove < and >
    .trim();
};

/**
 * Sanitize object with string values
 */
export const sanitizeObject = <T extends Record<string, any>>(obj: T): T => {
  const sanitized: any = {};

  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      sanitized[key] = sanitizeInput(obj[key]);
    } else if (Array.isArray(obj[key])) {
      sanitized[key] = obj[key].map((item: any) =>
        typeof item === 'string' ? sanitizeInput(item) : item
      );
    } else {
      sanitized[key] = obj[key];
    }
  }

  return sanitized as T;
};

/**
 * Convert string to slug
 */
export const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
};

/**
 * Generate a random string
 */
export const generateRandomString = (length = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Format file size to human readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Format duration in milliseconds to human readable format
 */
export const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(2)}m`;
  return `${(ms / 3600000).toFixed(2)}h`;
};

/**
 * Check if a value is a valid email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Check if a password meets minimum requirements
 */
export const isStrongPassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

/**
 * Get password strength message
 */
export const getPasswordStrengthMessage = (password: string): string => {
  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  if (!/(?=.*[a-z])/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }
  if (!/(?=.*[A-Z])/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!/(?=.*\d)/.test(password)) {
    return 'Password must contain at least one number';
  }
  return '';
};

/**
 * Mask email for privacy
 */
export const maskEmail = (email: string): string => {
  const [username, domain] = email.split('@');
  if (username.length <= 3) {
    return `${username[0]}***@${domain}`;
  }
  return `${username.substring(0, 3)}***@${domain}`;
};

/**
 * Extract file extension from filename
 */
export const getFileExtension = (filename: string): string => {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2).toLowerCase();
};

/**
 * Check if file extension is allowed
 */
export const isAllowedFileExtension = (
  filename: string,
  allowedExtensions: string[]
): boolean => {
  const ext = getFileExtension(filename);
  return allowedExtensions.some(
    (allowed) => allowed.toLowerCase() === `.${ext}` || allowed.toLowerCase() === ext
  );
};

/**
 * Sleep for a specified duration
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Retry a function with exponential backoff
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 1000
): Promise<T> => {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        await sleep(delay);
      }
    }
  }

  throw lastError!;
};

/**
 * Parse boolean from string
 */
export const parseBoolean = (value: any): boolean | undefined => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    if (lower === 'true' || lower === '1' || lower === 'yes') return true;
    if (lower === 'false' || lower === '0' || lower === 'no') return false;
  }
  return undefined;
};

/**
 * Deep clone an object
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Remove undefined and null values from object
 */
export const removeNullish = <T extends Record<string, any>>(obj: T): Partial<T> => {
  const result: any = {};

  for (const key in obj) {
    if (obj[key] !== undefined && obj[key] !== null) {
      result[key] = obj[key];
    }
  }

  return result;
};

/**
 * Truncate string to a maximum length
 */
export const truncate = (str: string, maxLength: number, suffix = '...'): string => {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - suffix.length) + suffix;
};

/**
 * Get client IP address from request
 */
export const getClientIp = (req: any): string => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.ip ||
    'unknown'
  );
};

/**
 * Check if environment is production
 */
export const isProduction = (): boolean => {
  return process.env.NODE_ENV === 'production';
};

/**
 * Check if environment is development
 */
export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === 'development';
};

/**
 * Check if environment is test
 */
export const isTest = (): boolean => {
  return process.env.NODE_ENV === 'test';
};
