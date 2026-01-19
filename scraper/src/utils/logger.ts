import winston from 'winston';
import path from 'path';
import fs from 'fs-extra';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
fs.ensureDirSync(logsDir);

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// File format (JSON for easy parsing)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports: [
    // Console output
    new winston.transports.Console({
      format: consoleFormat,
    }),

    // Error logs
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),

    // Combined logs
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: fileFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),

    // Scraper-specific logs
    new winston.transports.File({
      filename: path.join(logsDir, 'scraper.log'),
      format: fileFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 10,
    }),
  ],
});

// Add method to log scraper progress
export const logScraperProgress = (
  scraperName: string,
  status: 'started' | 'progress' | 'completed' | 'failed',
  details?: Record<string, any>
) => {
  const logData = {
    scraper: scraperName,
    status,
    timestamp: new Date().toISOString(),
    ...details,
  };

  switch (status) {
    case 'started':
      logger.info(`Scraper started: ${scraperName}`, logData);
      break;
    case 'progress':
      logger.info(`Scraper progress: ${scraperName}`, logData);
      break;
    case 'completed':
      logger.info(`Scraper completed: ${scraperName}`, logData);
      break;
    case 'failed':
      logger.error(`Scraper failed: ${scraperName}`, logData);
      break;
  }
};

// Add method to log file downloads
export const logFileDownload = (
  url: string,
  filePath: string,
  success: boolean,
  error?: string
) => {
  if (success) {
    logger.info('File downloaded successfully', { url, filePath });
  } else {
    logger.error('File download failed', { url, filePath, error });
  }
};

// Add method to log document processing
export const logDocumentProcessing = (
  documentId: string,
  stage: string,
  success: boolean,
  details?: Record<string, any>
) => {
  if (success) {
    logger.info(`Document processing: ${stage}`, { documentId, stage, ...details });
  } else {
    logger.error(`Document processing failed: ${stage}`, { documentId, stage, ...details });
  }
};

export default logger;
