import { Router } from 'express';
import * as generationController from '../controllers/generation.controller';
import { authenticateToken, requireUser } from '../middleware/auth.middleware';
import {
  validateGenerationCreate,
  validateStreamGeneration,
  validateIdParam,
  validatePagination,
  validateDateRange,
  validate,
} from '../middleware/validation.middleware';
import { asyncHandler } from '../middleware/error-handler.middleware';

const router = Router();

/**
 * @route   POST /api/generate
 * @desc    Create a new text generation
 * @access  Private
 */
router.post(
  '/',
  authenticateToken,
  requireUser,
  validateGenerationCreate,
  validate,
  asyncHandler(generationController.createGeneration)
);

/**
 * @route   POST /api/generate/stream
 * @desc    Stream text generation (Server-Sent Events)
 * @access  Private
 */
router.post(
  '/stream',
  authenticateToken,
  requireUser,
  validateStreamGeneration,
  validate,
  asyncHandler(generationController.streamGeneration)
);

/**
 * @route   GET /api/generate/history
 * @desc    Get generation history with pagination and filters
 * @access  Private
 */
router.get(
  '/history',
  authenticateToken,
  requireUser,
  validatePagination,
  validateDateRange,
  validate,
  asyncHandler(generationController.getHistory)
);

/**
 * @route   GET /api/generate/stats
 * @desc    Get generation statistics
 * @access  Private
 */
router.get(
  '/stats',
  authenticateToken,
  requireUser,
  asyncHandler(generationController.getStats)
);

/**
 * @route   GET /api/generate/:id
 * @desc    Get generation by ID
 * @access  Private
 */
router.get(
  '/:id',
  authenticateToken,
  requireUser,
  validateIdParam,
  validate,
  asyncHandler(generationController.getGeneration)
);

/**
 * @route   DELETE /api/generate/:id
 * @desc    Delete generation
 * @access  Private
 */
router.delete(
  '/:id',
  authenticateToken,
  requireUser,
  validateIdParam,
  validate,
  asyncHandler(generationController.deleteGeneration)
);

export default router;
