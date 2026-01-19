import pRetry, { AbortError, Options } from 'p-retry';
import { ScraperConfig } from '../config/scraper.config';
import logger from './logger';

export interface RetryOptions extends Partial<Options> {
  retries?: number;
  onFailedAttempt?: (error: any) => void;
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    retries = ScraperConfig.maxRetries,
    onFailedAttempt,
    ...restOptions
  } = options;

  return pRetry(fn, {
    retries,
    factor: 2,
    minTimeout: 1000,
    maxTimeout: 30000,
    randomize: true,
    onFailedAttempt: (error) => {
      logger.warn(`Retry attempt ${error.attemptNumber} failed`, {
        retriesLeft: error.retriesLeft,
        error: error.message,
      });

      if (onFailedAttempt) {
        onFailedAttempt(error);
      }
    },
    ...restOptions,
  });
}

/**
 * Retry with custom error handling
 */
export async function retryWithErrorHandling<T>(
  fn: () => Promise<T>,
  shouldRetry: (error: any) => boolean,
  options: RetryOptions = {}
): Promise<T> {
  return retry(async () => {
    try {
      return await fn();
    } catch (error: any) {
      // If error should not be retried, throw AbortError to stop retrying
      if (!shouldRetry(error)) {
        throw new AbortError(error);
      }
      throw error;
    }
  }, options);
}

/**
 * Retry for HTTP requests
 */
export async function retryHttpRequest<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  return retryWithErrorHandling(
    fn,
    (error) => {
      // Retry on network errors and 5xx status codes
      if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
        return true;
      }

      if (error.response) {
        const status = error.response.status;
        // Retry on 5xx and 429 (rate limit)
        return status >= 500 || status === 429;
      }

      return true;
    },
    options
  );
}

/**
 * Retry for file downloads
 */
export async function retryFileDownload<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  return retryWithErrorHandling(
    fn,
    (error) => {
      // Retry on network errors and specific HTTP errors
      if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
        return true;
      }

      if (error.response) {
        const status = error.response.status;
        // Don't retry on 404 or 403
        if (status === 404 || status === 403) {
          return false;
        }
        // Retry on other errors
        return status >= 400;
      }

      return true;
    },
    {
      retries: 5, // More retries for file downloads
      ...options,
    }
  );
}

/**
 * Retry for parsing operations
 */
export async function retryParsing<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  return retryWithErrorHandling(
    fn,
    (error) => {
      // Only retry on specific parsing errors
      const retryableErrors = [
        'ECONNRESET',
        'ETIMEDOUT',
        'Parse error',
        'Timeout',
      ];

      return retryableErrors.some(err =>
        error.message?.includes(err) || error.code === err
      );
    },
    {
      retries: 2, // Fewer retries for parsing
      ...options,
    }
  );
}

export default retry;
