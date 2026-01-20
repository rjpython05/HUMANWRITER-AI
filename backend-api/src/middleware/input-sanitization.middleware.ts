import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { getClientIp } from '../utils/helpers';

/**
 * Input Sanitization Middleware
 *
 * Provides protection against various injection attacks including:
 * - XSS (Cross-Site Scripting)
 * - NoSQL Injection
 * - SQL Injection
 * - Command Injection
 * - Path Traversal
 *
 * Based on OWASP recommendations for input validation and sanitization
 */

/**
 * HTML/XSS Sanitization
 *
 * Escapes HTML special characters to prevent XSS attacks
 */
export const sanitizeHtml = (input: string): string => {
  if (typeof input !== 'string') {
    return input;
  }

  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return input.replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char]);
};

/**
 * Remove HTML tags from string
 */
export const stripHtmlTags = (input: string): string => {
  if (typeof input !== 'string') {
    return input;
  }

  return input.replace(/<[^>]*>/g, '');
};

/**
 * NoSQL Injection Protection
 *
 * Removes operators that could be used in NoSQL injection attacks
 */
export const sanitizeNoSql = (input: any): any => {
  if (typeof input === 'string') {
    // Remove MongoDB operators
    return input.replace(/[${}]/g, '');
  }

  if (Array.isArray(input)) {
    return input.map(sanitizeNoSql);
  }

  if (input !== null && typeof input === 'object') {
    const sanitized: Record<string, any> = {};

    for (const key in input) {
      // Skip MongoDB operators
      if (key.startsWith('$')) {
        logger.warn('NoSQL injection attempt detected', {
          key,
          value: input[key],
        });
        continue;
      }

      sanitized[key] = sanitizeNoSql(input[key]);
    }

    return sanitized;
  }

  return input;
};

/**
 * Path Traversal Protection
 *
 * Prevents directory traversal attacks
 */
export const sanitizePath = (input: string): string => {
  if (typeof input !== 'string') {
    return input;
  }

  // Remove path traversal sequences
  return input.replace(/\.\./g, '').replace(/[\/\\]/g, '');
};

/**
 * SQL Injection Protection (basic)
 *
 * Note: This is a basic check. Use parameterized queries for real protection.
 * Prisma ORM already provides SQL injection protection.
 */
export const detectSqlInjection = (input: string): boolean => {
  if (typeof input !== 'string') {
    return false;
  }

  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE)\b)/gi,
    /(--|\*\/|\/\*|;)/g,
    /(0x[0-9a-f]+)/gi,
    /(\bOR\b.*=.*|1\s*=\s*1|'.*=.*')/gi,
  ];

  return sqlPatterns.some((pattern) => pattern.test(input));
};

/**
 * Command Injection Protection
 *
 * Detects potential command injection attempts
 */
export const detectCommandInjection = (input: string): boolean => {
  if (typeof input !== 'string') {
    return false;
  }

  const commandPatterns = [
    /[;&|`$()]/g,
    /\$\{.*\}/g,
    /(bash|sh|cmd|powershell|eval|exec)/gi,
  ];

  return commandPatterns.some((pattern) => pattern.test(input));
};

/**
 * Email Sanitization
 *
 * Validates and sanitizes email addresses
 */
export const sanitizeEmail = (email: string): string => {
  if (typeof email !== 'string') {
    return email;
  }

  // Convert to lowercase and trim
  return email.toLowerCase().trim();
};

/**
 * Recursively sanitize object
 */
export const sanitizeObject = (obj: any, options: SanitizationOptions = {}): any => {
  const {
    allowHtml = false,
    sanitizePaths = true,
    sanitizeNoSqlOps = true,
  } = options;

  if (typeof obj === 'string') {
    let sanitized = obj.trim();

    if (!allowHtml) {
      sanitized = stripHtmlTags(sanitized);
    }

    if (sanitizePaths) {
      // Only sanitize if it looks like a path
      if (sanitized.includes('..') || sanitized.includes('/')) {
        sanitized = sanitizePath(sanitized);
      }
    }

    // Check for injection attempts
    if (detectSqlInjection(sanitized)) {
      logger.warn('SQL injection attempt detected', { input: sanitized });
    }

    if (detectCommandInjection(sanitized)) {
      logger.warn('Command injection attempt detected', { input: sanitized });
    }

    return sanitized;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, options));
  }

  if (obj !== null && typeof obj === 'object') {
    const sanitized: Record<string, any> = {};

    for (const key in obj) {
      // Remove NoSQL operators if enabled
      if (sanitizeNoSqlOps && key.startsWith('$')) {
        logger.warn('NoSQL operator removed during sanitization', { key });
        continue;
      }

      // Sanitize key
      const sanitizedKey = sanitizePath(key);
      sanitized[sanitizedKey] = sanitizeObject(obj[key], options);
    }

    return sanitized;
  }

  return obj;
};

/**
 * Sanitization options interface
 */
interface SanitizationOptions {
  allowHtml?: boolean;
  sanitizePaths?: boolean;
  sanitizeNoSqlOps?: boolean;
}

/**
 * Body Sanitization Middleware
 *
 * Sanitizes request body to prevent injection attacks
 */
export const sanitizeBody = (options: SanitizationOptions = {}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (req.body && Object.keys(req.body).length > 0) {
        req.body = sanitizeObject(req.body, options);
      }

      next();
    } catch (error) {
      logger.error('Body sanitization failed', { error });
      next();
    }
  };
};

/**
 * Query Parameters Sanitization Middleware
 *
 * Sanitizes URL query parameters
 */
export const sanitizeQuery = (options: SanitizationOptions = {}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (req.query && Object.keys(req.query).length > 0) {
        req.query = sanitizeObject(req.query, options);
      }

      next();
    } catch (error) {
      logger.error('Query sanitization failed', { error });
      next();
    }
  };
};

/**
 * Parameters Sanitization Middleware
 *
 * Sanitizes URL parameters
 */
export const sanitizeParams = (options: SanitizationOptions = {}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (req.params && Object.keys(req.params).length > 0) {
        req.params = sanitizeObject(req.params, options);
      }

      next();
    } catch (error) {
      logger.error('Params sanitization failed', { error });
      next();
    }
  };
};

/**
 * Complete Input Sanitization Middleware
 *
 * Sanitizes body, query, and params all at once
 */
export const sanitizeAllInputs = (options: SanitizationOptions = {}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Sanitize body
      if (req.body && Object.keys(req.body).length > 0) {
        req.body = sanitizeObject(req.body, options);
      }

      // Sanitize query
      if (req.query && Object.keys(req.query).length > 0) {
        req.query = sanitizeObject(req.query, options);
      }

      // Sanitize params
      if (req.params && Object.keys(req.params).length > 0) {
        req.params = sanitizeObject(req.params, options);
      }

      next();
    } catch (error) {
      logger.error('Input sanitization failed', { error, ip: getClientIp(req) });
      next();
    }
  };
};

/**
 * File Upload Sanitization
 *
 * Validates and sanitizes file uploads
 */
export const sanitizeFileUpload = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    if (req.file) {
      // Sanitize filename
      const originalName = req.file.originalname;
      const sanitizedName = originalName
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .substring(0, 255);

      req.file.originalname = sanitizedName;

      // Check file extension
      const allowedExtensions = ['.pdf', '.docx', '.doc', '.txt'];
      const ext = sanitizedName.substring(sanitizedName.lastIndexOf('.')).toLowerCase();

      if (!allowedExtensions.includes(ext)) {
        logger.warn('Disallowed file extension uploaded', {
          filename: originalName,
          extension: ext,
          ip: getClientIp(req),
        });
      }
    }

    if (req.files && Array.isArray(req.files)) {
      req.files = req.files.map((file) => {
        const originalName = file.originalname;
        const sanitizedName = originalName
          .replace(/[^a-zA-Z0-9._-]/g, '_')
          .substring(0, 255);

        return {
          ...file,
          originalname: sanitizedName,
        };
      });
    }

    next();
  } catch (error) {
    logger.error('File upload sanitization failed', { error });
    next();
  }
};

/**
 * Detect and log suspicious patterns
 *
 * This middleware doesn't block requests but logs suspicious activity
 */
export const detectSuspiciousPatterns = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const allInputs = JSON.stringify({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    const suspiciousPatterns = [
      { pattern: /<script/gi, name: 'XSS Script Tag' },
      { pattern: /javascript:/gi, name: 'JavaScript Protocol' },
      { pattern: /on\w+\s*=/gi, name: 'Event Handler' },
      { pattern: /\$ne|\$gt|\$lt|\$regex/gi, name: 'NoSQL Operator' },
      { pattern: /UNION.*SELECT/gi, name: 'SQL Union' },
      { pattern: /\.\.\//g, name: 'Path Traversal' },
      { pattern: /base64_decode|eval|exec/gi, name: 'Code Execution' },
    ];

    suspiciousPatterns.forEach(({ pattern, name }) => {
      if (pattern.test(allInputs)) {
        logger.warn('Suspicious pattern detected', {
          pattern: name,
          path: req.path,
          method: req.method,
          ip: getClientIp(req),
          userAgent: req.headers['user-agent'],
        });
      }
    });

    next();
  } catch (error) {
    logger.error('Suspicious pattern detection failed', { error });
    next();
  }
};

export default {
  sanitizeHtml,
  stripHtmlTags,
  sanitizeNoSql,
  sanitizePath,
  sanitizeEmail,
  sanitizeObject,
  sanitizeBody,
  sanitizeQuery,
  sanitizeParams,
  sanitizeAllInputs,
  sanitizeFileUpload,
  detectSuspiciousPatterns,
  detectSqlInjection,
  detectCommandInjection,
};
