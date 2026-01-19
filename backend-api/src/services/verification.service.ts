import axios, { AxiosInstance } from 'axios';
import { PrismaClient, RiskLevel } from '@prisma/client';
import { config } from '../config/config';
import { logger } from '../utils/logger';
import { throwApiError } from '../middleware/error-handler.middleware';
import { retryWithBackoff } from '../utils/helpers';

const prisma = new PrismaClient();

// Create axios instance for AI Engine verification endpoints
const aiEngineClient: AxiosInstance = axios.create({
  baseURL: config.aiEngineUrl,
  timeout: 60000, // 60 seconds for verification (can be slow)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request/response interceptors for logging
aiEngineClient.interceptors.request.use(
  (config) => {
    logger.debug('AI Engine verification request', {
      method: config.method,
      url: config.url,
    });
    return config;
  },
  (error) => {
    logger.error('AI Engine verification request error', { error });
    return Promise.reject(error);
  }
);

aiEngineClient.interceptors.response.use(
  (response) => {
    logger.debug('AI Engine verification response', {
      status: response.status,
    });
    return response;
  },
  (error) => {
    logger.error('AI Engine verification response error', {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    return Promise.reject(error);
  }
);

// ==========================================
// TYPES
// ==========================================

export interface VerifyTextRequest {
  text: string;
  userId?: string;
  generationId?: string;
}

export interface DetectorResult {
  detector: string;
  score: number;
  confidence: number;
  success: boolean;
  error_message?: string;
  details?: any;
  timestamp: string;
}

export interface VerificationResponse {
  id: string;
  text_preview: string;
  text_length: number;
  results: DetectorResult[];
  total_detectors: number;
  successful_detectors: number;
  average_score: number;
  weighted_score: number;
  consensus_score: number;
  safety_score: number;
  risk_level: RiskLevel;
  confidence: number;
  recommendations: string[];
  timestamp: string;
}

export interface SafetyScoreRequest {
  average_ai_score: number;
  weighted_ai_score?: number;
  consensus_score?: number;
  detector_count?: number;
}

export interface SafetyScoreResponse {
  safety_score: number;
  risk_level: RiskLevel;
  confidence: number;
  recommendations: string[];
  factors: Record<string, number>;
}

// ==========================================
// SERVICE FUNCTIONS
// ==========================================

/**
 * Verify text with external AI detectors
 *
 * This function:
 * 1. Calls the AI Engine verification endpoint
 * 2. Stores the results in the database
 * 3. Returns the verification report
 */
export const verifyText = async (
  data: VerifyTextRequest
): Promise<VerificationResponse> => {
  const startTime = Date.now();

  try {
    logger.info('Verifying text with AI detectors', {
      textLength: data.text.length,
      userId: data.userId,
      generationId: data.generationId,
    });

    // Call AI Engine verification endpoint with retry logic
    const response = await retryWithBackoff(
      async () => {
        return await aiEngineClient.post('/verification/verify', {
          text: data.text,
        });
      },
      2, // 2 retries
      3000 // 3 second delay
    );

    const verificationData = response.data;

    // Store verification result in database
    const verificationResult = await prisma.verificationResult.create({
      data: {
        userId: data.userId,
        generationId: data.generationId,
        text: data.text.substring(0, 5000), // Store first 5000 chars

        // Individual detector scores
        gptZeroScore: verificationData.results.find((r: DetectorResult) => r.detector === 'GPTZero')?.score,
        zeroGptScore: verificationData.results.find((r: DetectorResult) => r.detector === 'ZeroGPT')?.score,
        copyleaksScore: verificationData.results.find((r: DetectorResult) => r.detector === 'Copyleaks')?.score,
        winstonScore: verificationData.results.find((r: DetectorResult) => r.detector === 'Winston AI')?.score,

        // Aggregated scores
        averageScore: verificationData.average_score,
        weightedScore: verificationData.weighted_score,
        consensusScore: verificationData.consensus_score,

        // Safety assessment
        safetyScore: verificationData.safety_score,
        riskLevel: verificationData.risk_level as RiskLevel,
        confidence: verificationData.confidence,
        recommendations: verificationData.recommendations,

        // Metadata
        detectorsUsed: verificationData.total_detectors,
        successfulDetections: verificationData.successful_detectors,
      },
    });

    const duration = Date.now() - startTime;
    logger.info('Text verification completed', {
      verificationId: verificationResult.id,
      safetyScore: verificationResult.safetyScore,
      riskLevel: verificationResult.riskLevel,
      duration,
    });

    return {
      id: verificationResult.id,
      ...verificationData,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error('Text verification failed', {
      error: error.message,
      duration,
    });

    if (error.response) {
      // AI Engine returned an error response
      throwApiError(
        error.response.data?.detail || 'Verification request failed',
        error.response.status,
        'VERIFICATION_ERROR',
        error.response.data
      );
    } else if (error.request) {
      // Request was made but no response received
      throwApiError(
        'AI Engine verification service is not responding',
        503,
        'VERIFICATION_UNAVAILABLE'
      );
    } else {
      // Something else happened
      throwApiError(
        'Failed to verify text',
        500,
        'VERIFICATION_ERROR',
        { message: error.message }
      );
    }
  }
};

/**
 * Calculate safety score from existing detection scores
 */
export const calculateSafetyScore = async (
  data: SafetyScoreRequest
): Promise<SafetyScoreResponse> => {
  try {
    logger.info('Calculating safety score', {
      averageScore: data.average_ai_score,
    });

    const response = await aiEngineClient.post('/verification/safety-score', data);

    return response.data;
  } catch (error: any) {
    logger.error('Safety score calculation failed', {
      error: error.message,
    });

    if (error.response) {
      throwApiError(
        error.response.data?.detail || 'Safety score calculation failed',
        error.response.status,
        'SAFETY_SCORE_ERROR',
        error.response.data
      );
    } else {
      throwApiError(
        'Failed to calculate safety score',
        500,
        'SAFETY_SCORE_ERROR',
        { message: error.message }
      );
    }
  }
};

/**
 * Get verification result by ID
 */
export const getVerificationById = async (
  id: string,
  userId?: string
): Promise<any> => {
  try {
    const verification = await prisma.verificationResult.findUnique({
      where: { id },
      include: {
        generation: {
          select: {
            id: true,
            prompt: true,
            discipline: true,
            createdAt: true,
          },
        },
      },
    });

    if (!verification) {
      throwApiError('Verification not found', 404, 'NOT_FOUND');
    }

    // Check user ownership if userId provided
    if (userId && verification.userId !== userId) {
      throwApiError('Access denied', 403, 'FORBIDDEN');
    }

    return verification;
  } catch (error: any) {
    if (error.code === 'NOT_FOUND' || error.code === 'FORBIDDEN') {
      throw error;
    }

    logger.error('Failed to get verification', {
      error: error.message,
      id,
    });

    throwApiError(
      'Failed to retrieve verification',
      500,
      'DATABASE_ERROR',
      { message: error.message }
    );
  }
};

/**
 * Get verification history for a user
 */
export const getVerificationHistory = async (
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<{ verifications: any[]; total: number }> => {
  try {
    const [verifications, total] = await Promise.all([
      prisma.verificationResult.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          generation: {
            select: {
              id: true,
              prompt: true,
              discipline: true,
            },
          },
        },
      }),
      prisma.verificationResult.count({
        where: { userId },
      }),
    ]);

    return {
      verifications,
      total,
    };
  } catch (error: any) {
    logger.error('Failed to get verification history', {
      error: error.message,
      userId,
    });

    throwApiError(
      'Failed to retrieve verification history',
      500,
      'DATABASE_ERROR',
      { message: error.message }
    );
  }
};

/**
 * Get verification statistics for a user
 */
export const getVerificationStats = async (userId: string): Promise<any> => {
  try {
    const verifications = await prisma.verificationResult.findMany({
      where: { userId },
      select: {
        riskLevel: true,
        safetyScore: true,
      },
    });

    const stats = {
      total: verifications.length,
      byRiskLevel: {
        LOW: verifications.filter((v) => v.riskLevel === 'LOW').length,
        MEDIUM: verifications.filter((v) => v.riskLevel === 'MEDIUM').length,
        HIGH: verifications.filter((v) => v.riskLevel === 'HIGH').length,
      },
      averageSafetyScore:
        verifications.length > 0
          ? verifications.reduce((sum, v) => sum + v.safetyScore, 0) /
            verifications.length
          : 0,
    };

    return stats;
  } catch (error: any) {
    logger.error('Failed to get verification stats', {
      error: error.message,
      userId,
    });

    throwApiError(
      'Failed to retrieve verification statistics',
      500,
      'DATABASE_ERROR',
      { message: error.message }
    );
  }
};

/**
 * Check available AI detectors
 */
export const getAvailableDetectors = async (): Promise<any> => {
  try {
    const response = await aiEngineClient.get('/verification/detectors');
    return response.data;
  } catch (error: any) {
    logger.error('Failed to get available detectors', {
      error: error.message,
    });

    throwApiError(
      'Failed to retrieve detector information',
      500,
      'VERIFICATION_ERROR',
      { message: error.message }
    );
  }
};

/**
 * Health check for verification service
 */
export const checkVerificationHealth = async (): Promise<any> => {
  try {
    const response = await aiEngineClient.get('/verification/health');
    return response.data;
  } catch (error: any) {
    logger.error('Verification health check failed', {
      error: error.message,
    });

    return {
      status: 'unhealthy',
      error: error.message,
    };
  }
};
