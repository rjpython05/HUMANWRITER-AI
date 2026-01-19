import PQueue from 'p-queue';
import { ScraperConfig } from '../config/scraper.config';

export interface RateLimiterOptions {
  concurrency?: number;
  interval?: number;
  intervalCap?: number;
}

/**
 * Rate limiter using p-queue
 * Manages concurrent requests and enforces rate limits
 */
export class RateLimiter {
  private queue: PQueue;
  private lastRequestTime: number = 0;
  private minDelay: number;

  constructor(options: RateLimiterOptions = {}) {
    const {
      concurrency = 1,
      interval = 1000,
      intervalCap = 1,
    } = options;

    this.queue = new PQueue({
      concurrency,
      interval,
      intervalCap,
    });

    this.minDelay = ScraperConfig.rateLimitMs;
  }

  /**
   * Execute a function with rate limiting
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return this.queue.add(async () => {
      // Ensure minimum delay between requests
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;

      if (timeSinceLastRequest < this.minDelay) {
        await this.sleep(this.minDelay - timeSinceLastRequest);
      }

      this.lastRequestTime = Date.now();
      return fn();
    }) as Promise<T>;
  }

  /**
   * Sleep for a specified duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get queue statistics
   */
  getStats() {
    return {
      size: this.queue.size,
      pending: this.queue.pending,
    };
  }

  /**
   * Clear the queue
   */
  clear() {
    this.queue.clear();
  }

  /**
   * Wait for all pending tasks to complete
   */
  async onIdle(): Promise<void> {
    await this.queue.onIdle();
  }
}

/**
 * Create a rate limiter with default settings
 */
export const createDefaultRateLimiter = (): RateLimiter => {
  return new RateLimiter({
    concurrency: 1,
    interval: ScraperConfig.rateLimitMs,
    intervalCap: 1,
  });
};

/**
 * Create a rate limiter for aggressive scraping
 */
export const createAggressiveRateLimiter = (): RateLimiter => {
  return new RateLimiter({
    concurrency: 2,
    interval: 1000,
    intervalCap: 2,
  });
};

/**
 * Create a rate limiter for conservative scraping
 */
export const createConservativeRateLimiter = (): RateLimiter => {
  return new RateLimiter({
    concurrency: 1,
    interval: 5000,
    intervalCap: 1,
  });
};

export default RateLimiter;
