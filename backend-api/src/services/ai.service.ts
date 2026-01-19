import axios, { AxiosInstance } from 'axios';
import { Discipline } from '@prisma/client';
import { config } from '../config/config';
import { logger, logAIRequest } from '../utils/logger';
import {
  AIEngineGenerateRequest,
  AIEngineGenerateResponse,
  AIEngineHealthResponse,
  GenerationCreateDto,
  GenerationMetrics,
} from '../types';
import { throwApiError } from '../middleware/error-handler.middleware';
import { retryWithBackoff } from '../utils/helpers';

// Create axios instance for AI Engine
const aiEngineClient: AxiosInstance = axios.create({
  baseURL: config.aiEngineUrl,
  timeout: 300000, // 5 minutes for generation
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for logging
aiEngineClient.interceptors.request.use(
  (config) => {
    logger.debug('AI Engine request', {
      method: config.method,
      url: config.url,
      data: config.data,
    });
    return config;
  },
  (error) => {
    logger.error('AI Engine request error', { error });
    return Promise.reject(error);
  }
);

// Add response interceptor for logging
aiEngineClient.interceptors.response.use(
  (response) => {
    logger.debug('AI Engine response', {
      status: response.status,
      data: response.data,
    });
    return response;
  },
  (error) => {
    logger.error('AI Engine response error', {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    return Promise.reject(error);
  }
);

/**
 * Generate text using AI Engine
 */
export const generateText = async (
  data: GenerationCreateDto
): Promise<AIEngineGenerateResponse> => {
  const startTime = Date.now();

  try {
    // Prepare request payload
    const requestPayload: AIEngineGenerateRequest = {
      prompt: data.prompt,
      discipline: data.discipline,
      model: data.modelUsed,
      max_words: data.maxWords,
      temperature: data.temperature,
      from_document: data.fromDocument,
      document_path: data.documentPath,
    };

    // Make request to AI Engine with retry logic
    const response = await retryWithBackoff(
      async () => {
        return await aiEngineClient.post<AIEngineGenerateResponse>(
          '/api/generate',
          requestPayload
        );
      },
      3,
      2000
    );

    const duration = Date.now() - startTime;

    logAIRequest('/api/generate', data.discipline, duration);

    return response.data;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logAIRequest('/api/generate', data.discipline, duration, error);

    if (error.response) {
      // AI Engine returned an error response
      throwApiError(
        error.response.data?.error || 'AI Engine request failed',
        error.response.status,
        'AI_ENGINE_ERROR',
        error.response.data
      );
    } else if (error.request) {
      // Request was made but no response received
      throwApiError(
        'AI Engine is not responding',
        503,
        'AI_ENGINE_UNAVAILABLE'
      );
    } else {
      // Something else happened
      throwApiError(
        'Failed to communicate with AI Engine',
        500,
        'AI_ENGINE_ERROR',
        { message: error.message }
      );
    }
  }
};

/**
 * Stream text generation (Server-Sent Events proxy)
 */
export const streamGeneration = async (
  data: GenerationCreateDto,
  onChunk: (chunk: string) => void,
  onComplete: (result: AIEngineGenerateResponse) => void,
  onError: (error: Error) => void
): Promise<void> => {
  const startTime = Date.now();

  try {
    // Prepare request payload
    const requestPayload: AIEngineGenerateRequest = {
      prompt: data.prompt,
      discipline: data.discipline,
      model: data.modelUsed,
      max_words: data.maxWords,
      temperature: data.temperature,
    };

    // Make streaming request
    const response = await aiEngineClient.post(
      '/api/generate/stream',
      requestPayload,
      {
        responseType: 'stream',
      }
    );

    let buffer = '';

    // Handle incoming data chunks
    response.data.on('data', (chunk: Buffer) => {
      const chunkStr = chunk.toString();
      buffer += chunkStr;

      // Process complete SSE messages
      const messages = buffer.split('\n\n');
      buffer = messages.pop() || ''; // Keep incomplete message in buffer

      for (const message of messages) {
        if (message.startsWith('data: ')) {
          const data = message.substring(6);

          if (data === '[DONE]') {
            // Stream complete
            return;
          }

          try {
            const parsed = JSON.parse(data);
            onChunk(parsed);
          } catch (error) {
            logger.error('Failed to parse SSE chunk', { error, data });
          }
        }
      }
    });

    // Handle stream completion
    response.data.on('end', () => {
      const duration = Date.now() - startTime;
      logAIRequest('/api/generate/stream', data.discipline, duration);
    });

    // Handle stream errors
    response.data.on('error', (error: Error) => {
      const duration = Date.now() - startTime;
      logAIRequest('/api/generate/stream', data.discipline, duration, error);
      onError(error);
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logAIRequest('/api/generate/stream', data.discipline, duration, error);
    onError(error);
  }
};

/**
 * Humanize text (post-processing)
 */
export const humanizeText = async (
  text: string,
  discipline: Discipline
): Promise<{ humanized_text: string; metrics: GenerationMetrics }> => {
  const startTime = Date.now();

  try {
    const response = await aiEngineClient.post('/api/humanize', {
      text,
      discipline,
    });

    const duration = Date.now() - startTime;
    logAIRequest('/api/humanize', discipline, duration);

    return response.data;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logAIRequest('/api/humanize', discipline, duration, error);

    if (error.response) {
      throwApiError(
        error.response.data?.error || 'Humanization failed',
        error.response.status,
        'HUMANIZATION_ERROR'
      );
    } else {
      throwApiError(
        'Failed to humanize text',
        500,
        'HUMANIZATION_ERROR',
        { message: error.message }
      );
    }
  }
};

/**
 * Check AI Engine health
 */
export const checkHealth = async (): Promise<AIEngineHealthResponse> => {
  try {
    const response = await aiEngineClient.get<AIEngineHealthResponse>(
      '/health',
      {
        timeout: 5000, // 5 second timeout for health checks
      }
    );

    return response.data;
  } catch (error: any) {
    logger.error('AI Engine health check failed', { error });

    return {
      status: 'unhealthy',
      ollama_available: false,
      models_loaded: [],
      uptime: 0,
    };
  }
};

/**
 * Get AI Engine metrics
 */
export const getMetrics = async (): Promise<any> => {
  try {
    const response = await aiEngineClient.get('/api/metrics', {
      timeout: 5000,
    });

    return response.data;
  } catch (error: any) {
    logger.error('Failed to get AI Engine metrics', { error });
    throw error;
  }
};

/**
 * Get available models
 */
export const getAvailableModels = async (): Promise<string[]> => {
  try {
    const response = await aiEngineClient.get('/api/models', {
      timeout: 5000,
    });

    return response.data.models || [];
  } catch (error: any) {
    logger.error('Failed to get available models', { error });
    return [];
  }
};

/**
 * Validate document for generation
 */
export const validateDocument = async (
  documentPath: string,
  discipline: Discipline
): Promise<{ valid: boolean; message?: string }> => {
  try {
    const response = await aiEngineClient.post('/api/validate-document', {
      document_path: documentPath,
      discipline,
    });

    return response.data;
  } catch (error: any) {
    logger.error('Document validation failed', { error, documentPath });
    return {
      valid: false,
      message: 'Failed to validate document',
    };
  }
};

/**
 * Convert AI Engine metrics format to our format
 */
export const convertMetrics = (
  aiMetrics: AIEngineGenerateResponse['metrics']
): GenerationMetrics => {
  return {
    burstiness: aiMetrics.burstiness,
    humanizationScore: aiMetrics.humanization_score,
    aiWordsCount: aiMetrics.ai_words_count,
    academicWordsCount: aiMetrics.academic_words_count,
    perplexity: aiMetrics.perplexity,
    readabilityScore: aiMetrics.readability_score,
    avgSentenceLength: aiMetrics.avg_sentence_length,
    vocabularyRichness: aiMetrics.vocabulary_richness,
  };
};

/**
 * Ping AI Engine to keep it warm
 */
export const pingAIEngine = async (): Promise<boolean> => {
  try {
    const response = await aiEngineClient.get('/health', {
      timeout: 3000,
    });

    return response.status === 200;
  } catch (error) {
    return false;
  }
};

/**
 * Get generation statistics from AI Engine
 */
export const getGenerationStats = async (): Promise<any> => {
  try {
    const response = await aiEngineClient.get('/api/stats', {
      timeout: 5000,
    });

    return response.data;
  } catch (error: any) {
    logger.error('Failed to get generation stats', { error });
    throw error;
  }
};

export default {
  generateText,
  streamGeneration,
  humanizeText,
  checkHealth,
  getMetrics,
  getAvailableModels,
  validateDocument,
  convertMetrics,
  pingAIEngine,
  getGenerationStats,
};
