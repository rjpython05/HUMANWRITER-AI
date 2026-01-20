import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

/**
 * Validate JWT secret
 * Ensures the secret is strong enough for production use
 */
const validateJwtSecret = (secret: string): string => {
  const MIN_SECRET_LENGTH = 32;

  if (!secret || secret === 'your-jwt-secret-change-this') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'CRITICAL SECURITY ERROR: JWT_SECRET must be set in production environment. ' +
        'Generate a secure secret with: openssl rand -base64 32'
      );
    }

    // In development, generate a random secret if not set
    console.warn(
      '⚠️  WARNING: Using default JWT secret. This is NOT secure for production!'
    );
    console.warn(
      '   Generate a secure secret with: openssl rand -base64 32'
    );
    return crypto.randomBytes(32).toString('base64');
  }

  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET is too short (${secret.length} chars). ` +
      `Must be at least ${MIN_SECRET_LENGTH} characters. ` +
      'Generate a secure secret with: openssl rand -base64 32'
    );
  }

  return secret;
};

/**
 * Validate required environment variables
 */
const validateRequiredEnvVars = (): void => {
  const required = ['DATABASE_URL'];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
};

// Validate environment variables
if (process.env.NODE_ENV === 'production') {
  validateRequiredEnvVars();
}

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3001'),
  env: process.env.NODE_ENV || 'development',

  // Database
  databaseUrl: process.env.DATABASE_URL || '',

  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // AI Engine
  aiEngineUrl: process.env.AI_ENGINE_URL || 'http://localhost:8001',

  // JWT - Validated for security
  jwtSecret: validateJwtSecret(process.env.JWT_SECRET || ''),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m', // Shorter for better security
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',

  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 min
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),

  // File Upload
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800'), // 50MB
  allowedFileTypes: process.env.ALLOWED_FILE_TYPES || '.pdf,.docx,.doc,.txt',

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',

  // Application
  appName: process.env.APP_NAME || 'HumanWriter AI',
  appUrl: process.env.APP_URL || 'http://localhost:3000',

  // Security
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
  maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
  lockoutDuration: parseInt(process.env.LOCKOUT_DURATION || '15'), // minutes
};

export default config;
