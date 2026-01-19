import { Router } from 'express';
import * as usersController from '../controllers/users.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  validateUserRegistration,
  validateUserLogin,
  validateProfileUpdate,
  validateRefreshToken,
  validate,
} from '../middleware/validation.middleware';
import { asyncHandler } from '../middleware/error-handler.middleware';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  validateUserRegistration,
  validate,
  asyncHandler(usersController.register)
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  validateUserLogin,
  validate,
  asyncHandler(usersController.login)
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
  '/refresh',
  validateRefreshToken,
  validate,
  asyncHandler(usersController.refreshToken)
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get(
  '/me',
  authenticateToken,
  asyncHandler(usersController.getProfile)
);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put(
  '/profile',
  authenticateToken,
  validateProfileUpdate,
  validate,
  asyncHandler(usersController.updateProfile)
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post(
  '/logout',
  authenticateToken,
  asyncHandler(usersController.logout)
);

/**
 * @route   GET /api/auth/stats
 * @desc    Get user statistics
 * @access  Private
 */
router.get(
  '/stats',
  authenticateToken,
  asyncHandler(usersController.getStats)
);

/**
 * @route   GET /api/auth/limit
 * @desc    Check generation limit
 * @access  Private
 */
router.get(
  '/limit',
  authenticateToken,
  asyncHandler(usersController.checkLimit)
);

export default router;
