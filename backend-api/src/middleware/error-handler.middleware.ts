import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import createHttpError from 'http-errors';
import { logger, logError } from '../utils/logger';
import { sendError, getClientIp } from '../utils/helpers';
import { ApiError } from '../types';

/**
 * Error handler middleware
 */
export const errorHandler = (
  error: Error | ApiError | any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error details
  logError(error, {
    path: req.path,
    method: req.method,
    ip: getClientIp(req),
    userId: (req as any).user?.id,
    body: req.body,
    query: req.query,
    params: req.params,
  });

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    handlePrismaError(error, res);
    return;
  }

  // Handle Prisma validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    sendError(res, 'Invalid data provided', 400, 'VALIDATION_ERROR', {
      message: error.message,
    });
    return;
  }

  // Handle HTTP errors from http-errors package
  if (createHttpError.isHttpError(error)) {
    sendError(
      res,
      error.message,
      error.statusCode || 500,
      error.name,
      error.expose ? { stack: error.stack } : undefined
    );
    return;
  }

  // Handle custom API errors
  if (isApiError(error)) {
    sendError(
      res,
      error.message,
      error.statusCode || 500,
      error.code,
      error.details
    );
    return;
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    sendError(res, 'Invalid token', 401, 'INVALID_TOKEN');
    return;
  }

  if (error.name === 'TokenExpiredError') {
    sendError(res, 'Token expired', 401, 'TOKEN_EXPIRED');
    return;
  }

  // Handle multer errors (file upload)
  if (error.name === 'MulterError') {
    handleMulterError(error, res);
    return;
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    sendError(res, error.message, 400, 'VALIDATION_ERROR', {
      errors: error.errors,
    });
    return;
  }

  // Handle syntax errors
  if (error instanceof SyntaxError && 'body' in error) {
    sendError(res, 'Invalid JSON', 400, 'INVALID_JSON');
    return;
  }

  // Default error response
  const statusCode = error.statusCode || error.status || 500;
  const message = error.message || 'Internal server error';
  const code = error.code || 'INTERNAL_ERROR';

  // Don't expose internal error details in production
  const details =
    process.env.NODE_ENV === 'production'
      ? undefined
      : { stack: error.stack };

  sendError(res, message, statusCode, code, details);
};

/**
 * Handle Prisma database errors
 */
const handlePrismaError = (
  error: Prisma.PrismaClientKnownRequestError,
  res: Response
): void => {
  switch (error.code) {
    // Unique constraint violation
    case 'P2002':
      const field = (error.meta?.target as string[])?.join(', ') || 'field';
      sendError(
        res,
        `A record with this ${field} already exists`,
        409,
        'DUPLICATE_ENTRY',
        { field }
      );
      break;

    // Foreign key constraint violation
    case 'P2003':
      sendError(
        res,
        'Related record not found',
        400,
        'FOREIGN_KEY_VIOLATION'
      );
      break;

    // Record not found
    case 'P2025':
      sendError(res, 'Record not found', 404, 'NOT_FOUND');
      break;

    // Record to delete does not exist
    case 'P2016':
      sendError(res, 'Record not found for deletion', 404, 'NOT_FOUND');
      break;

    // Database connection error
    case 'P1001':
      sendError(
        res,
        'Unable to connect to database',
        503,
        'DATABASE_CONNECTION_ERROR'
      );
      break;

    // Database timeout
    case 'P1008':
      sendError(res, 'Database operation timeout', 504, 'DATABASE_TIMEOUT');
      break;

    // Table does not exist
    case 'P1009':
      sendError(res, 'Database table does not exist', 500, 'TABLE_NOT_FOUND');
      break;

    default:
      sendError(res, 'Database error occurred', 500, 'DATABASE_ERROR', {
        code: error.code,
        meta: error.meta,
      });
  }
};

/**
 * Handle Multer file upload errors
 */
const handleMulterError = (error: any, res: Response): void => {
  switch (error.code) {
    case 'LIMIT_FILE_SIZE':
      sendError(
        res,
        'File size exceeds the maximum allowed size',
        400,
        'FILE_TOO_LARGE'
      );
      break;

    case 'LIMIT_FILE_COUNT':
      sendError(
        res,
        'Too many files uploaded',
        400,
        'TOO_MANY_FILES'
      );
      break;

    case 'LIMIT_UNEXPECTED_FILE':
      sendError(
        res,
        'Unexpected file field',
        400,
        'UNEXPECTED_FILE_FIELD'
      );
      break;

    default:
      sendError(res, 'File upload error', 400, 'UPLOAD_ERROR', {
        message: error.message,
      });
  }
};

/**
 * Check if error is an API error
 */
const isApiError = (error: any): error is ApiError => {
  return (
    error &&
    typeof error.message === 'string' &&
    typeof error.statusCode === 'number'
  );
};

/**
 * Not found handler (404)
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.warn('Route not found', {
    path: req.path,
    method: req.method,
    ip: getClientIp(req),
  });

  sendError(res, `Route ${req.method} ${req.path} not found`, 404, 'NOT_FOUND');
};

/**
 * Async error wrapper
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Create API error
 */
export const createApiError = (
  message: string,
  statusCode = 500,
  code?: string,
  details?: any
): ApiError => {
  return {
    message,
    statusCode,
    code,
    details,
  };
};

/**
 * Throw API error
 */
export const throwApiError = (
  message: string,
  statusCode = 500,
  code?: string,
  details?: any
): never => {
  throw createApiError(message, statusCode, code, details);
};

/**
 * Assert condition or throw error
 */
export const assertOrThrow = (
  condition: boolean,
  message: string,
  statusCode = 400,
  code?: string
): void => {
  if (!condition) {
    throwApiError(message, statusCode, code);
  }
};

/**
 * Handle uncaught exceptions
 */
export const handleUncaughtException = (): void => {
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    });

    // Exit process after logging
    process.exit(1);
  });
};

/**
 * Handle unhandled promise rejections
 */
export const handleUnhandledRejection = (): void => {
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error('Unhandled Rejection', {
      reason,
      promise,
    });

    // Exit process after logging
    process.exit(1);
  });
};
