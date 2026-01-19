import { Router } from 'express';
import * as verificationController from '../controllers/verification.controller';
import { authenticateToken, optionalAuth } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error-handler.middleware';
import { body, param, query, validationResult } from 'express-validator';

const router = Router();

/**
 * Validation middleware
 */
const validate = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }
  next();
};

/**
 * @route   POST /api/verify
 * @desc    Verify text with AI detectors
 * @access  Private (optional - can work without auth)
 *
 * Request body:
 * {
 *   "text": "Text to verify...",
 *   "generationId": "optional-generation-id"
 * }
 */
router.post(
  '/',
  optionalAuth,
  [
    body('text')
      .isString()
      .withMessage('Text must be a string')
      .isLength({ min: 50, max: 50000 })
      .withMessage('Text must be between 50 and 50,000 characters'),
    body('generationId')
      .optional()
      .isString()
      .withMessage('Generation ID must be a string'),
  ],
  validate,
  asyncHandler(verificationController.verifyText)
);

/**
 * @route   POST /api/verify/safety-score
 * @desc    Calculate safety score from existing detection scores
 * @access  Public
 *
 * Request body:
 * {
 *   "average_ai_score": 25.5,
 *   "weighted_ai_score": 24.3,
 *   "consensus_score": 85.0,
 *   "detector_count": 3
 * }
 */
router.post(
  '/safety-score',
  [
    body('average_ai_score')
      .isFloat({ min: 0, max: 100 })
      .withMessage('average_ai_score must be a number between 0 and 100'),
    body('weighted_ai_score')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('weighted_ai_score must be a number between 0 and 100'),
    body('consensus_score')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('consensus_score must be a number between 0 and 100'),
    body('detector_count')
      .optional()
      .isInt({ min: 0 })
      .withMessage('detector_count must be a positive integer'),
  ],
  validate,
  asyncHandler(verificationController.calculateSafetyScore)
);

/**
 * @route   GET /api/verify/history
 * @desc    Get verification history for current user
 * @access  Private
 *
 * Query params:
 * - limit: number (default: 20)
 * - offset: number (default: 0)
 */
router.get(
  '/history',
  authenticateToken,
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('offset')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Offset must be a positive integer'),
  ],
  validate,
  asyncHandler(verificationController.getVerificationHistory)
);

/**
 * @route   GET /api/verify/stats
 * @desc    Get verification statistics for current user
 * @access  Private
 */
router.get(
  '/stats',
  authenticateToken,
  asyncHandler(verificationController.getVerificationStats)
);

/**
 * @route   GET /api/verify/detectors
 * @desc    Get available AI detectors
 * @access  Public
 */
router.get(
  '/detectors',
  asyncHandler(verificationController.getAvailableDetectors)
);

/**
 * @route   GET /api/verify/health
 * @desc    Health check for verification service
 * @access  Public
 */
router.get(
  '/health',
  asyncHandler(verificationController.checkVerificationHealth)
);

/**
 * @route   GET /api/verify/:id
 * @desc    Get verification result by ID
 * @access  Private (optional - checks ownership if authenticated)
 *
 * Params:
 * - id: verification ID
 */
router.get(
  '/:id',
  optionalAuth,
  [
    param('id')
      .isString()
      .withMessage('Verification ID must be a string'),
  ],
  validate,
  asyncHandler(verificationController.getVerificationById)
);

export default router;
