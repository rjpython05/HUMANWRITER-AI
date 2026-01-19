import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';
import {
  validateIdParam,
  validatePagination,
  validateAdminUserUpdate,
  validateDateRange,
  validate,
} from '../middleware/validation.middleware';
import { asyncHandler } from '../middleware/error-handler.middleware';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get admin dashboard summary
 * @access  Private (Admin only)
 */
router.get(
  '/dashboard',
  asyncHandler(adminController.getDashboard)
);

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with filtering and pagination
 * @access  Private (Admin only)
 */
router.get(
  '/users',
  validatePagination,
  validate,
  asyncHandler(adminController.getUsers)
);

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Update user
 * @access  Private (Admin only)
 */
router.put(
  '/users/:id',
  validateIdParam,
  validateAdminUserUpdate,
  validate,
  asyncHandler(adminController.updateUser)
);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete user
 * @access  Private (Admin only)
 */
router.delete(
  '/users/:id',
  validateIdParam,
  validate,
  asyncHandler(adminController.deleteUser)
);

/**
 * @route   POST /api/admin/users/:id/reset-generations
 * @desc    Reset user monthly generation count
 * @access  Private (Admin only)
 */
router.post(
  '/users/:id/reset-generations',
  validateIdParam,
  validate,
  asyncHandler(adminController.resetUserGenerations)
);

/**
 * @route   POST /api/admin/users/reset-all-generations
 * @desc    Reset all users monthly generation counts
 * @access  Private (Admin only)
 */
router.post(
  '/users/reset-all-generations',
  asyncHandler(adminController.resetAllGenerations)
);

/**
 * @route   GET /api/admin/metrics
 * @desc    Get system metrics
 * @access  Private (Admin only)
 */
router.get(
  '/metrics',
  asyncHandler(adminController.getMetrics)
);

/**
 * @route   POST /api/admin/metrics
 * @desc    Create system metric snapshot
 * @access  Private (Admin only)
 */
router.post(
  '/metrics',
  asyncHandler(adminController.createMetricSnapshot)
);

/**
 * @route   GET /api/admin/logs
 * @desc    Get audit logs
 * @access  Private (Admin only)
 */
router.get(
  '/logs',
  validatePagination,
  validateDateRange,
  validate,
  asyncHandler(adminController.getLogs)
);

/**
 * @route   GET /api/admin/corpus
 * @desc    Get corpus statistics
 * @access  Private (Admin only)
 */
router.get(
  '/corpus',
  asyncHandler(adminController.getCorpusStats)
);

export default router;
