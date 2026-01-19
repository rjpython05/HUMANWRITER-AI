import dotenv from 'dotenv';

dotenv.config();

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
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret-change-this',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
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
};

export default config;
