/**
 * Security Configuration
 *
 * Centralized security settings for the HUMANWRITER AI application.
 * All security-related constants and configurations should be defined here.
 *
 * Based on OWASP Top 10 2021 security best practices
 */

import { config } from './config';

/**
 * Password Policy Configuration
 */
export const passwordPolicy = {
  // Minimum length for passwords
  minLength: 8,

  // Maximum length to prevent DoS attacks
  maxLength: 128,

  // Require at least one uppercase letter
  requireUppercase: true,

  // Require at least one lowercase letter
  requireLowercase: true,

  // Require at least one number
  requireNumber: true,

  // Require at least one special character
  requireSpecialChar: false,

  // Bcrypt cost factor (rounds)
  // Recommended: 12-14 for good security/performance balance
  bcryptRounds: 12,

  // Password history to prevent reuse
  preventReuseCount: 5,

  // Password expiration in days (0 = never expires)
  expirationDays: 0,
};

/**
 * JWT Token Configuration
 */
export const jwtConfig = {
  // Access token expiration (short-lived)
  accessTokenExpiry: '15m',

  // Refresh token expiration (long-lived)
  refreshTokenExpiry: '30d',

  // Token issuer
  issuer: 'humanwriter-ai',

  // Token audience
  audience: 'humanwriter-api',

  // Algorithm
  algorithm: 'HS256' as const,

  // Minimum secret length
  minSecretLength: 32,
};

/**
 * Rate Limiting Configuration
 */
export const rateLimitConfig = {
  // General API rate limit
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: 'Too many requests from this IP, please try again later',
  },

  // Authentication endpoints (stricter)
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: 'Too many authentication attempts, please try again later',
    skipSuccessfulRequests: true,
  },

  // Password reset (very strict)
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts per hour
    message: 'Too many password reset attempts',
  },

  // Generation endpoints
  generation: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // 50 generations per hour for free users
    message: 'Generation limit exceeded',
  },

  // File upload
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 uploads per hour
    message: 'Upload limit exceeded',
  },

  // Admin endpoints
  admin: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // 200 requests per window
    message: 'Admin rate limit exceeded',
  },
};

/**
 * CORS Configuration
 */
export const corsConfig = {
  // Allowed origins (from environment variable)
  origins: config.corsOrigin.split(',').map((origin) => origin.trim()),

  // Allowed methods
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],

  // Allowed headers
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-API-Key',
  ],

  // Exposed headers
  exposedHeaders: [
    'RateLimit-Limit',
    'RateLimit-Remaining',
    'RateLimit-Reset',
    'X-Total-Count',
  ],

  // Allow credentials (cookies, authorization headers)
  credentials: true,

  // Preflight cache duration (in seconds)
  maxAge: 86400, // 24 hours
};

/**
 * File Upload Security Configuration
 */
export const fileUploadConfig = {
  // Maximum file size (50MB)
  maxFileSize: 50 * 1024 * 1024,

  // Allowed MIME types
  allowedMimeTypes: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
  ],

  // Allowed file extensions
  allowedExtensions: ['.pdf', '.docx', '.doc', '.txt'],

  // Maximum number of files per upload
  maxFiles: 5,

  // Sanitize filename
  sanitizeFilename: true,

  // Scan for malware (if antivirus is configured)
  scanForMalware: false,

  // Upload directory
  uploadDir: config.uploadDir,
};

/**
 * Session Security Configuration
 */
export const sessionConfig = {
  // Session cookie name
  cookieName: 'humanwriter.sid',

  // Cookie settings
  cookie: {
    // HTTP only (not accessible via JavaScript)
    httpOnly: true,

    // Secure (HTTPS only) in production
    secure: config.env === 'production',

    // SameSite policy (strict CSRF protection)
    sameSite: 'strict' as const,

    // Max age (30 days)
    maxAge: 30 * 24 * 60 * 60 * 1000,

    // Domain
    domain: config.env === 'production' ? '.humanwriter.ai' : undefined,

    // Path
    path: '/',
  },

  // Session timeout (inactive sessions)
  timeout: 30 * 60 * 1000, // 30 minutes

  // Regenerate session ID on login
  regenerateOnLogin: true,
};

/**
 * Content Security Policy (CSP) Configuration
 */
export const cspConfig = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'strict-dynamic'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:', 'https:'],
    fontSrc: ["'self'", 'data:'],
    connectSrc: ["'self'", config.aiEngineUrl],
    frameAncestors: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    workerSrc: ["'self'", 'blob:'],
    manifestSrc: ["'self'"],
    upgradeInsecureRequests: true,
  },
};

/**
 * Input Validation Configuration
 */
export const inputValidationConfig = {
  // Maximum string length
  maxStringLength: 10000,

  // Maximum array length
  maxArrayLength: 1000,

  // Maximum object depth
  maxObjectDepth: 10,

  // Trim whitespace
  trimWhitespace: true,

  // Strip HTML tags
  stripHtml: true,

  // Sanitize NoSQL operators
  sanitizeNoSql: true,
};

/**
 * Logging and Monitoring Configuration
 */
export const loggingConfig = {
  // Log all authentication attempts
  logAuthAttempts: true,

  // Log all failed validations
  logValidationFailures: true,

  // Log suspicious patterns
  logSuspiciousPatterns: true,

  // Log rate limit violations
  logRateLimitViolations: true,

  // Sensitive fields to redact from logs
  sensitiveFields: [
    'password',
    'currentPassword',
    'newPassword',
    'confirmPassword',
    'token',
    'accessToken',
    'refreshToken',
    'apiKey',
    'secret',
    'creditCard',
    'ssn',
  ],

  // Log retention period (days)
  retentionDays: 90,
};

/**
 * Security Headers Configuration
 */
export const securityHeadersConfig = {
  // HSTS (Strict-Transport-Security)
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },

  // X-Frame-Options
  frameOptions: 'DENY',

  // X-Content-Type-Options
  contentTypeOptions: 'nosniff',

  // X-XSS-Protection
  xssProtection: '1; mode=block',

  // Referrer-Policy
  referrerPolicy: 'strict-origin-when-cross-origin',

  // Permissions-Policy
  permissionsPolicy: {
    camera: '()',
    microphone: '()',
    geolocation: '()',
    'interest-cohort': '()',
  },
};

/**
 * Brute Force Protection Configuration
 */
export const bruteForceConfig = {
  // Maximum failed login attempts
  maxFailedAttempts: 5,

  // Lockout duration (in minutes)
  lockoutDuration: 15,

  // Track by IP address
  trackByIp: true,

  // Track by email
  trackByEmail: true,

  // Notify on lockout
  notifyOnLockout: true,
};

/**
 * API Key Configuration
 */
export const apiKeyConfig = {
  // API key length
  keyLength: 32,

  // API key prefix
  keyPrefix: 'hw_',

  // Hash API keys before storage
  hashKeys: true,

  // API key expiration (0 = never expires)
  expirationDays: 0,

  // Rate limit per API key
  rateLimit: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 1000, // 1000 requests per hour
  },
};

/**
 * Encryption Configuration
 */
export const encryptionConfig = {
  // Algorithm for encryption
  algorithm: 'aes-256-gcm',

  // Key derivation
  keyDerivation: {
    algorithm: 'pbkdf2',
    iterations: 100000,
    keyLength: 32,
    digest: 'sha256',
  },

  // Salt length
  saltLength: 16,

  // IV length
  ivLength: 12,
};

/**
 * Audit Log Configuration
 */
export const auditLogConfig = {
  // Events to audit
  auditableEvents: [
    'user.login',
    'user.logout',
    'user.register',
    'user.delete',
    'user.update',
    'password.change',
    'password.reset',
    'role.change',
    'apikey.create',
    'apikey.revoke',
    'generation.create',
    'corpus.upload',
    'corpus.delete',
    'admin.action',
  ],

  // Include request details
  includeRequestDetails: true,

  // Include response details
  includeResponseDetails: false,

  // Store audit logs separately
  separateStorage: true,

  // Retention period (days)
  retentionDays: 365,
};

/**
 * Get security configuration based on environment
 */
export const getSecurityConfig = () => {
  const isProd = config.env === 'production';

  return {
    passwordPolicy,
    jwtConfig: {
      ...jwtConfig,
      // Shorter expiry in production
      accessTokenExpiry: isProd ? '15m' : '1h',
    },
    rateLimitConfig,
    corsConfig: {
      ...corsConfig,
      // Stricter CORS in production
      origins: isProd
        ? corsConfig.origins
        : ['http://localhost:3000', 'http://localhost:3001'],
    },
    fileUploadConfig,
    sessionConfig,
    cspConfig,
    inputValidationConfig,
    loggingConfig,
    securityHeadersConfig,
    bruteForceConfig,
    apiKeyConfig,
    encryptionConfig,
    auditLogConfig,
  };
};

export default getSecurityConfig();
