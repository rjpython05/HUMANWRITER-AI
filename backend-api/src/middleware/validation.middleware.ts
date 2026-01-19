import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult, ValidationChain } from 'express-validator';
import { Discipline } from '@prisma/client';
import { sendError } from '../utils/helpers';
import { logger } from '../utils/logger';

/**
 * Validate request and return errors if any
 */
export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error) => ({
      field: error.type === 'field' ? error.path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? error.value : undefined,
    }));

    logger.warn('Validation failed', {
      path: req.path,
      errors: formattedErrors,
    });

    sendError(
      res,
      'Validation failed',
      400,
      'VALIDATION_ERROR',
      formattedErrors
    );
    return;
  }

  next();
};

/**
 * User registration validation rules
 */
export const validateUserRegistration: ValidationChain[] = [
  body('email')
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail()
    .toLowerCase(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('name')
    .optional()
    .isString()
    .withMessage('Name must be a string')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
];

/**
 * User login validation rules
 */
export const validateUserLogin: ValidationChain[] = [
  body('email')
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail()
    .toLowerCase(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

/**
 * Profile update validation rules
 */
export const validateProfileUpdate: ValidationChain[] = [
  body('name')
    .optional()
    .isString()
    .withMessage('Name must be a string')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail()
    .toLowerCase(),
  body('password')
    .optional()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('currentPassword')
    .if(body('password').exists())
    .notEmpty()
    .withMessage('Current password is required when changing password'),
];

/**
 * Generation creation validation rules
 */
export const validateGenerationCreate: ValidationChain[] = [
  body('prompt')
    .notEmpty()
    .withMessage('Prompt is required')
    .isString()
    .withMessage('Prompt must be a string')
    .trim()
    .isLength({ min: 10, max: 10000 })
    .withMessage('Prompt must be between 10 and 10000 characters'),
  body('discipline')
    .notEmpty()
    .withMessage('Discipline is required')
    .isIn(Object.values(Discipline))
    .withMessage(`Discipline must be one of: ${Object.values(Discipline).join(', ')}`),
  body('modelUsed')
    .optional()
    .isString()
    .withMessage('Model must be a string'),
  body('maxWords')
    .optional()
    .isInt({ min: 50, max: 5000 })
    .withMessage('Max words must be between 50 and 5000'),
  body('temperature')
    .optional()
    .isFloat({ min: 0, max: 2 })
    .withMessage('Temperature must be between 0 and 2'),
  body('fromDocument')
    .optional()
    .isBoolean()
    .withMessage('fromDocument must be a boolean'),
  body('documentPath')
    .optional()
    .isString()
    .withMessage('Document path must be a string'),
];

/**
 * Stream generation validation rules
 */
export const validateStreamGeneration: ValidationChain[] = [
  body('prompt')
    .notEmpty()
    .withMessage('Prompt is required')
    .isString()
    .withMessage('Prompt must be a string')
    .trim()
    .isLength({ min: 10, max: 10000 })
    .withMessage('Prompt must be between 10 and 10000 characters'),
  body('discipline')
    .notEmpty()
    .withMessage('Discipline is required')
    .isIn(Object.values(Discipline))
    .withMessage(`Discipline must be one of: ${Object.values(Discipline).join(', ')}`),
  body('modelUsed')
    .optional()
    .isString()
    .withMessage('Model must be a string'),
  body('maxWords')
    .optional()
    .isInt({ min: 50, max: 5000 })
    .withMessage('Max words must be between 50 and 5000'),
  body('temperature')
    .optional()
    .isFloat({ min: 0, max: 2 })
    .withMessage('Temperature must be between 0 and 2'),
];

/**
 * Document upload validation rules
 */
export const validateDocumentUpload: ValidationChain[] = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isString()
    .withMessage('Title must be a string')
    .trim()
    .isLength({ min: 3, max: 500 })
    .withMessage('Title must be between 3 and 500 characters'),
  body('authors')
    .notEmpty()
    .withMessage('Authors are required')
    .isArray({ min: 1 })
    .withMessage('Authors must be an array with at least one author'),
  body('authors.*')
    .isString()
    .withMessage('Each author must be a string')
    .trim()
    .notEmpty()
    .withMessage('Author name cannot be empty'),
  body('year')
    .notEmpty()
    .withMessage('Year is required')
    .isInt({ min: 1900, max: new Date().getFullYear() })
    .withMessage(`Year must be between 1900 and ${new Date().getFullYear()}`),
  body('institution')
    .notEmpty()
    .withMessage('Institution is required')
    .isString()
    .withMessage('Institution must be a string')
    .trim(),
  body('source')
    .notEmpty()
    .withMessage('Source is required')
    .isString()
    .withMessage('Source must be a string')
    .trim(),
  body('discipline')
    .notEmpty()
    .withMessage('Discipline is required')
    .isIn(Object.values(Discipline))
    .withMessage(`Discipline must be one of: ${Object.values(Discipline).join(', ')}`),
  body('subdiscipline')
    .notEmpty()
    .withMessage('Subdiscipline is required')
    .isString()
    .withMessage('Subdiscipline must be a string')
    .trim(),
  body('language')
    .notEmpty()
    .withMessage('Language is required')
    .isIn(['es', 'en'])
    .withMessage('Language must be either "es" or "en"'),
  body('keywords')
    .notEmpty()
    .withMessage('Keywords are required')
    .isArray({ min: 1 })
    .withMessage('Keywords must be an array with at least one keyword'),
  body('keywords.*')
    .isString()
    .withMessage('Each keyword must be a string')
    .trim()
    .notEmpty()
    .withMessage('Keyword cannot be empty'),
];

/**
 * Feedback creation validation rules
 */
export const validateFeedbackCreate: ValidationChain[] = [
  body('generationId')
    .notEmpty()
    .withMessage('Generation ID is required')
    .isString()
    .withMessage('Generation ID must be a string'),
  body('rating')
    .notEmpty()
    .withMessage('Rating is required')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('helpful')
    .notEmpty()
    .withMessage('Helpful flag is required')
    .isBoolean()
    .withMessage('Helpful must be a boolean'),
  body('issues')
    .notEmpty()
    .withMessage('Issues are required')
    .isArray()
    .withMessage('Issues must be an array'),
  body('issues.*')
    .isString()
    .withMessage('Each issue must be a string'),
  body('comment')
    .optional()
    .isString()
    .withMessage('Comment must be a string')
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Comment must not exceed 1000 characters'),
];

/**
 * Pagination query validation
 */
export const validatePagination: ValidationChain[] = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
];

/**
 * ID parameter validation
 */
export const validateIdParam: ValidationChain[] = [
  param('id')
    .notEmpty()
    .withMessage('ID is required')
    .isString()
    .withMessage('ID must be a string'),
];

/**
 * Refresh token validation
 */
export const validateRefreshToken: ValidationChain[] = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
    .isString()
    .withMessage('Refresh token must be a string'),
];

/**
 * Admin user update validation
 */
export const validateAdminUserUpdate: ValidationChain[] = [
  body('role')
    .optional()
    .isIn(['GUEST', 'USER', 'ADMIN'])
    .withMessage('Role must be one of: GUEST, USER, ADMIN'),
  body('plan')
    .optional()
    .isIn(['FREE', 'PRO', 'ENTERPRISE'])
    .withMessage('Plan must be one of: FREE, PRO, ENTERPRISE'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  body('generationsThisMonth')
    .optional()
    .isInt({ min: 0 })
    .withMessage('generationsThisMonth must be a non-negative integer'),
];

/**
 * Search query validation
 */
export const validateSearchQuery: ValidationChain[] = [
  query('search')
    .optional()
    .isString()
    .withMessage('Search query must be a string')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Search query must be between 1 and 200 characters'),
];

/**
 * Date range validation
 */
export const validateDateRange: ValidationChain[] = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date')
    .toDate(),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
    .toDate(),
];
