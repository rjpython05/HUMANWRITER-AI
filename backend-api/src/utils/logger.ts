import winston from 'winston';
import { config } from '../config/config';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston to use custom colors
winston.addColors(colors);

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      metaStr = '\n' + JSON.stringify(meta, null, 2);
    }
    return `[${timestamp}] ${level}: ${message}${metaStr}`;
  })
);

// Custom format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Define transports
const transports: winston.transport[] = [
  // Console transport
  new winston.transports.Console({
    format: consoleFormat,
  }),

  // Error log file
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),

  // Combined log file
  new winston.transports.File({
    filename: 'logs/combined.log',
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
];

// Create the logger
export const logger = winston.createLogger({
  level: config.logLevel,
  levels,
  transports,
  exitOnError: false,
});

// Create a stream object for Morgan
export const morganStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Helper function to log errors with context
export const logError = (
  error: Error,
  context?: { [key: string]: any }
) => {
  logger.error(error.message, {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    ...context,
  });
};

// Helper function to log API requests
export const logRequest = (
  method: string,
  url: string,
  userId?: string,
  duration?: number
) => {
  logger.http(`${method} ${url}`, {
    method,
    url,
    userId,
    duration,
  });
};

// Helper function to log database queries
export const logQuery = (
  query: string,
  duration?: number,
  error?: Error
) => {
  if (error) {
    logger.error(`Database query failed: ${query}`, {
      query,
      duration,
      error: {
        message: error.message,
        stack: error.stack,
      },
    });
  } else {
    logger.debug(`Database query: ${query}`, {
      query,
      duration,
    });
  }
};

// Helper function to log AI Engine requests
export const logAIRequest = (
  endpoint: string,
  discipline: string,
  duration?: number,
  error?: Error
) => {
  if (error) {
    logger.error(`AI Engine request failed: ${endpoint}`, {
      endpoint,
      discipline,
      duration,
      error: {
        message: error.message,
        stack: error.stack,
      },
    });
  } else {
    logger.info(`AI Engine request: ${endpoint}`, {
      endpoint,
      discipline,
      duration,
    });
  }
};

// Helper function to log security events
export const logSecurityEvent = (
  event: string,
  userId?: string,
  ipAddress?: string,
  details?: any
) => {
  logger.warn(`Security event: ${event}`, {
    event,
    userId,
    ipAddress,
    details,
    timestamp: new Date().toISOString(),
  });
};

export default logger;
