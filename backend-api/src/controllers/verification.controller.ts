import { Request, Response } from 'express';
import * as verificationService from '../services/verification.service';
import { logger } from '../utils/logger';
import { throwApiError } from '../middleware/error-handler.middleware';

/**
 * @desc    Verify text with AI detectors
 * @route   POST /api/verify
 * @access  Private (optional)
 */
export const verifyText = async (req: Request, res: Response) => {
  try {
    const { text, generationId } = req.body;

    // Get userId from authenticated request (if available)
    const userId = (req as any).user?.id;

    if (!text || typeof text !== 'string') {
      throwApiError('Text is required and must be a string', 400, 'INVALID_INPUT');
    }

    if (text.length < 50) {
      throwApiError('Text must be at least 50 characters long', 400, 'TEXT_TOO_SHORT');
    }

    if (text.length > 50000) {
      throwApiError('Text must be less than 50,000 characters', 400, 'TEXT_TOO_LONG');
    }

    logger.info('Text verification requested', {
      userId,
      textLength: text.length,
      generationId,
    });

    const result = await verificationService.verifyText({
      text,
      userId,
      generationId,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    throw error;
  }
};

/**
 * @desc    Calculate safety score from existing detection scores
 * @route   POST /api/verify/safety-score
 * @access  Public
 */
export const calculateSafetyScore = async (req: Request, res: Response) => {
  try {
    const { average_ai_score, weighted_ai_score, consensus_score, detector_count } = req.body;

    if (typeof average_ai_score !== 'number' || average_ai_score < 0 || average_ai_score > 100) {
      throwApiError('average_ai_score must be a number between 0 and 100', 400, 'INVALID_INPUT');
    }

    const result = await verificationService.calculateSafetyScore({
      average_ai_score,
      weighted_ai_score,
      consensus_score,
      detector_count,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    throw error;
  }
};

/**
 * @desc    Get verification result by ID
 * @route   GET /api/verify/:id
 * @access  Private (optional)
 */
export const getVerificationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    if (!id) {
      throwApiError('Verification ID is required', 400, 'INVALID_INPUT');
    }

    const verification = await verificationService.getVerificationById(id, userId);

    res.json({
      success: true,
      data: verification,
    });
  } catch (error) {
    throw error;
  }
};

/**
 * @desc    Get verification history for current user
 * @route   GET /api/verify/history
 * @access  Private
 */
export const getVerificationHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      throwApiError('Authentication required', 401, 'UNAUTHORIZED');
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await verificationService.getVerificationHistory(userId, limit, offset);

    res.json({
      success: true,
      data: result.verifications,
      pagination: {
        total: result.total,
        limit,
        offset,
        hasMore: offset + limit < result.total,
      },
    });
  } catch (error) {
    throw error;
  }
};

/**
 * @desc    Get verification statistics for current user
 * @route   GET /api/verify/stats
 * @access  Private
 */
export const getVerificationStats = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      throwApiError('Authentication required', 401, 'UNAUTHORIZED');
    }

    const stats = await verificationService.getVerificationStats(userId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    throw error;
  }
};

/**
 * @desc    Get available AI detectors
 * @route   GET /api/verify/detectors
 * @access  Public
 */
export const getAvailableDetectors = async (req: Request, res: Response) => {
  try {
    const detectors = await verificationService.getAvailableDetectors();

    res.json({
      success: true,
      data: detectors,
    });
  } catch (error) {
    throw error;
  }
};

/**
 * @desc    Health check for verification service
 * @route   GET /api/verify/health
 * @access  Public
 */
export const checkVerificationHealth = async (req: Request, res: Response) => {
  try {
    const health = await verificationService.checkVerificationHealth();

    res.json({
      success: true,
      data: health,
    });
  } catch (error) {
    throw error;
  }
};
