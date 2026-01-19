export const ScraperConfig = {
  // General settings
  maxConcurrentScrapers: parseInt(process.env.MAX_CONCURRENT_SCRAPERS || '5'),
  rateLimitMs: parseInt(process.env.RATE_LIMIT_MS || '2000'),
  maxRetries: parseInt(process.env.MAX_RETRIES || '3'),
  timeout: 60000, // 60 seconds
  
  // File settings
  dataDir: process.env.DATA_DIR || './data',
  maxFileSize: 52428800, // 50MB
  allowedExtensions: ['.pdf', '.docx', '.doc'],
  
  // Validation settings
  minWordCount: 2000,
  maxWordCount: 50000,
  minYear: 1990,
  maxYear: 2021,
  
  // Puppeteer settings
  puppeteerOptions: {
    headless: 'new' as const,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
    ],
  },
  
  // User agents rotation
  userAgents: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  ],
};

export default ScraperConfig;
