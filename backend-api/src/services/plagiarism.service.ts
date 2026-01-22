import axios, { AxiosInstance } from 'axios';
import { config } from '../config/config';
import { logger } from '../utils/logger';
import { throwApiError } from '../middleware/error-handler.middleware';
import { retryWithBackoff } from '../utils/helpers';

// Types
export interface PlagiarismCheckRequest {
  text: string;
  generationId?: string;
  topSources?: number;
  similarityThreshold?: number;
  includePassages?: boolean;
}

export interface PlagiarismCheckResponse {
  reportId: string;
  overallSimilarity: number;
  similarityPercentage: number;
  riskLevel: 'SAFE' | 'MODERATE' | 'HIGH';
  summary: string;
  topSources: SourceMatch[];
  statistics: PlagiarismStatistics;
  exactMatchesCount: number;
  highlightedPassages: HighlightedPassage[];
  processingTimeMs: number;
}

export interface SourceMatch {
  sourceId: string;
  metadata: {
    title?: string;
    authors?: string[];
    year?: number;
    institution?: string;
    discipline?: string;
  };
  matchCount: number;
  averageSimilarity: number;
  maxSimilarity: number;
  percentage: number;
  matchedPassages: MatchedPassage[];
}

export interface MatchedPassage {
  originalText: string;
  matchedText: string;
  similarity: number;
  chunkId: number;
}

export interface HighlightedPassage {
  text: string;
  startPosition: number;
  similarity: number;
  sourceId: string;
  sourceMetadata: any;
  matchedText: string;
}

export interface PlagiarismStatistics {
  totalChunksAnalyzed: number;
  matchedChunks: number;
  coveragePercentage: number;
  uniqueSourcesFound: number;
  highSimilarityMatches: number;
  mediumSimilarityMatches: number;
  lowSimilarityMatches: number;
  averageMatchSimilarity: number;
  maximumMatchSimilarity: number;
  exactMatchesFound: number;
  exactMatchTotalWords: number;
}

export interface FindSourcesRequest {
  text: string;
  topK?: number;
  discipline?: string;
}

export interface SourceDetails {
  sourceId: string;
  title: string;
  authors: string[];
  year?: number;
  institution?: string;
  discipline?: string;
  similarityPercentage: number;
  citation: string;
  matchedText?: string;
}

export interface FindSourcesResponse {
  sources: SourceDetails[];
  totalFound: number;
  queryText: string;
}

// Create axios instance for AI Engine plagiarism endpoints
const plagiarismClient: AxiosInstance = axios.create({
  baseURL: `${config.aiEngineUrl}/plagiarism`,
  timeout: 120000, // 2 minutes for plagiarism checks
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for logging
plagiarismClient.interceptors.request.use(
  (config) => {
    logger.debug('Plagiarism API request', {
      method: config.method,
      url: config.url,
    });
    return config;
  },
  (error) => {
    logger.error('Plagiarism API request error', { error });
    return Promise.reject(error);
  }
);

// Add response interceptor for logging
plagiarismClient.interceptors.response.use(
  (response) => {
    logger.debug('Plagiarism API response', {
      status: response.status,
    });
    return response;
  },
  (error) => {
    logger.error('Plagiarism API response error', {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    return Promise.reject(error);
  }
);

/**
 * Check text for plagiarism
 */
export const checkPlagiarism = async (
  data: PlagiarismCheckRequest
): Promise<PlagiarismCheckResponse> => {
  const startTime = Date.now();

  try {
    logger.info('Starting plagiarism check', {
      textLength: data.text.length,
      generationId: data.generationId,
    });

    // Make request to AI Engine with retry logic
    const response = await retryWithBackoff(
      async () => {
        return await plagiarismClient.post<PlagiarismCheckResponse>('/check', {
          text: data.text,
          generation_id: data.generationId,
          top_sources: data.topSources || 5,
          similarity_threshold: data.similarityThreshold || 0.25,
          include_passages: data.includePassages !== false,
        });
      },
      2, // Max 2 retries
      3000 // 3 second delay
    );

    const duration = Date.now() - startTime;

    logger.info('Plagiarism check complete', {
      reportId: response.data.reportId,
      riskLevel: response.data.riskLevel,
      similarity: response.data.similarityPercentage,
      duration,
    });

    // Convert snake_case to camelCase
    const responseData = response.data as any;
    return {
      reportId: responseData.report_id || responseData.reportId,
      overallSimilarity: responseData.overall_similarity || responseData.overallSimilarity,
      similarityPercentage: responseData.similarity_percentage || responseData.similarityPercentage,
      riskLevel: responseData.risk_level || responseData.riskLevel,
      summary: responseData.summary,
      topSources: responseData.top_sources || responseData.topSources,
      statistics: responseData.statistics,
      exactMatchesCount: responseData.exact_matches_count || responseData.exactMatchesCount || 0,
      highlightedPassages: responseData.highlighted_passages || responseData.highlightedPassages || [],
      processingTimeMs: responseData.processing_time_ms || responseData.processingTimeMs,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error('Plagiarism check failed', { error, duration });

    if (error.response) {
      throwApiError(
        error.response.data?.detail || 'Plagiarism check failed',
        error.response.status,
        'PLAGIARISM_CHECK_ERROR',
        error.response.data
      );
    } else if (error.request) {
      throwApiError(
        'AI Engine is not responding',
        503,
        'AI_ENGINE_UNAVAILABLE'
      );
    } else {
      throwApiError(
        'Failed to perform plagiarism check',
        500,
        'PLAGIARISM_CHECK_ERROR',
        { message: error.message }
      );
    }
    throw error; // TypeScript safety: ensure all paths return
  }
};

/**
 * Get plagiarism report by ID
 */
export const getReport = async (reportId: string): Promise<any> => {
  try {
    logger.info('Fetching plagiarism report', { reportId });

    const response = await plagiarismClient.get(`/report/${reportId}`);

    return response.data;
  } catch (error: any) {
    logger.error('Failed to fetch report', { error, reportId });

    if (error.response?.status === 404) {
      throwApiError('Report not found', 404, 'REPORT_NOT_FOUND');
    }

    throwApiError(
      'Failed to fetch report',
      500,
      'REPORT_FETCH_ERROR',
      { message: error.message }
    );
  }
};

/**
 * Find similar sources
 */
export const findSources = async (
  data: FindSourcesRequest
): Promise<FindSourcesResponse> => {
  try {
    logger.info('Finding similar sources', {
      textLength: data.text.length,
      discipline: data.discipline,
    });

    const response = await plagiarismClient.post<FindSourcesResponse>('/sources', {
      text: data.text,
      top_k: data.topK || 5,
      discipline: data.discipline,
    });

    const responseData = response.data as any;
    return {
      sources: responseData.sources,
      totalFound: responseData.total_found || responseData.totalFound,
      queryText: responseData.query_text || responseData.queryText,
    };
  } catch (error: any) {
    logger.error('Failed to find sources', { error });

    throwApiError(
      'Failed to find similar sources',
      500,
      'SOURCE_FIND_ERROR',
      { message: error.message }
    );
    throw error; // TypeScript safety: ensure all paths return
  }
};

/**
 * Get source details
 */
export const getSourceDetails = async (sourceId: string): Promise<any> => {
  try {
    logger.info('Fetching source details', { sourceId });

    const response = await plagiarismClient.get(`/source/${sourceId}`);

    return response.data;
  } catch (error: any) {
    logger.error('Failed to fetch source details', { error, sourceId });

    if (error.response?.status === 404) {
      throwApiError('Source not found', 404, 'SOURCE_NOT_FOUND');
    }

    throwApiError(
      'Failed to fetch source details',
      500,
      'SOURCE_FETCH_ERROR',
      { message: error.message }
    );
  }
};

/**
 * Compare with specific source
 */
export const compareWithSource = async (
  sourceId: string,
  text: string
): Promise<any> => {
  try {
    logger.info('Comparing with source', { sourceId, textLength: text.length });

    const response = await plagiarismClient.post(`/compare/${sourceId}`, text, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });

    return response.data;
  } catch (error: any) {
    logger.error('Comparison failed', { error, sourceId });

    throwApiError(
      'Failed to compare with source',
      500,
      'COMPARISON_ERROR',
      { message: error.message }
    );
    throw error; // TypeScript safety: ensure all paths return
  }
};

/**
 * Export report
 */
export const exportReport = async (
  reportData: any,
  format: 'json' | 'text' | 'html'
): Promise<string> => {
  try {
    logger.info('Exporting report', { format });

    const response = await plagiarismClient.post('/export', {
      report_data: reportData,
      format,
    });

    return response.data;
  } catch (error: any) {
    logger.error('Report export failed', { error, format });

    throwApiError(
      'Failed to export report',
      500,
      'EXPORT_ERROR',
      { message: error.message }
    );
    throw error; // TypeScript safety: ensure all paths return
  }
};

/**
 * Get plagiarism statistics
 */
export const getPlagiarismStats = async (): Promise<any> => {
  try {
    const response = await plagiarismClient.get('/stats');
    return response.data;
  } catch (error: any) {
    logger.error('Failed to get plagiarism stats', { error });
    return {
      totalReports: 0,
      serviceStatus: 'unknown',
    };
  }
};

/**
 * Delete report from cache
 */
export const deleteReport = async (reportId: string): Promise<void> => {
  try {
    await plagiarismClient.delete(`/report/${reportId}`);
    logger.info('Report deleted', { reportId });
  } catch (error: any) {
    logger.error('Failed to delete report', { error, reportId });
    // Don't throw - deletion is not critical
  }
};

export default {
  checkPlagiarism,
  getReport,
  findSources,
  getSourceDetails,
  compareWithSource,
  exportReport,
  getPlagiarismStats,
  deleteReport,
};
