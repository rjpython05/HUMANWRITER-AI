import { Request, Response, NextFunction } from 'express';
import { config } from '../config/config';

/**
 * Advanced security headers middleware
 *
 * This middleware sets additional security headers beyond what Helmet provides
 * to protect against various attack vectors including XSS, clickjacking, and MIME sniffing.
 *
 * OWASP recommended security headers implementation
 */
export const securityHeaders = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Strict-Transport-Security (HSTS)
  // Forces HTTPS connections for 1 year including subdomains
  if (config.env === 'production') {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // X-Content-Type-Options
  // Prevents MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // X-Frame-Options
  // Prevents clickjacking attacks
  res.setHeader('X-Frame-Options', 'DENY');

  // X-XSS-Protection
  // Legacy XSS protection (still useful for older browsers)
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer-Policy
  // Controls how much referrer information should be included with requests
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions-Policy (formerly Feature-Policy)
  // Restricts which browser features can be used
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );

  // X-Permitted-Cross-Domain-Policies
  // Restricts Adobe Flash and PDF cross-domain requests
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

  // X-Download-Options
  // Prevents IE from executing downloads in site context
  res.setHeader('X-Download-Options', 'noopen');

  // Cache-Control for sensitive endpoints
  if (
    req.path.includes('/api/auth') ||
    req.path.includes('/api/admin') ||
    req.path.includes('/api/users')
  ) {
    res.setHeader(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate'
    );
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  // Cross-Origin-Resource-Policy
  // Protects against Spectre-like attacks
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

  // Cross-Origin-Opener-Policy
  // Isolates browsing context group
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');

  // Cross-Origin-Embedder-Policy
  // Prevents loading of cross-origin resources
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');

  next();
};

/**
 * Content Security Policy (CSP) middleware
 *
 * Provides fine-grained control over which resources can be loaded
 * This is one of the most important security headers for preventing XSS
 */
export const contentSecurityPolicy = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const nonce = generateNonce();

  // Store nonce in response locals for use in templates
  res.locals.cspNonce = nonce;

  const cspDirectives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'", // unsafe-inline needed for some CSS frameworks
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' " + config.aiEngineUrl,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "media-src 'self'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    'upgrade-insecure-requests',
  ];

  if (config.env === 'development') {
    // Allow webpack dev server in development
    cspDirectives.push("connect-src 'self' ws: " + config.aiEngineUrl);
  }

  res.setHeader('Content-Security-Policy', cspDirectives.join('; '));

  next();
};

/**
 * Generate a cryptographically secure nonce for CSP
 */
const generateNonce = (): string => {
  const crypto = require('crypto');
  return crypto.randomBytes(16).toString('base64');
};

/**
 * Remove sensitive headers from responses
 *
 * Prevents information disclosure about server technology
 */
export const removeSensitiveHeaders = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Remove X-Powered-By header (Express adds this by default)
  res.removeHeader('X-Powered-By');

  // Remove Server header if present
  res.removeHeader('Server');

  next();
};

/**
 * Security headers for file downloads
 *
 * Ensures downloaded files are handled securely
 */
export const fileDownloadHeaders = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Only apply to file download routes
  if (!req.path.includes('/download') && !req.path.includes('/export')) {
    return next();
  }

  // Force download instead of inline display
  res.setHeader('Content-Disposition', 'attachment');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Disable caching for sensitive files
  res.setHeader('Cache-Control', 'no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  next();
};

/**
 * CORP headers for API responses
 *
 * Ensures API responses can only be read by same-origin requests
 */
export const apiSecurityHeaders = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Only apply to API routes
  if (!req.path.startsWith('/api/')) {
    return next();
  }

  // Ensure JSON responses are not cached
  if (req.method === 'GET' && req.path.includes('/api/')) {
    res.setHeader('Cache-Control', 'no-store, max-age=0');
  }

  // Ensure responses are JSON
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  // Prevent DNS rebinding attacks
  res.setHeader('X-Content-Type-Options', 'nosniff');

  next();
};

/**
 * Combined security headers middleware
 *
 * Applies all security headers in one middleware
 */
export const allSecurityHeaders = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  removeSensitiveHeaders(req, res, () => {
    securityHeaders(req, res, () => {
      contentSecurityPolicy(req, res, next);
    });
  });
};

export default {
  securityHeaders,
  contentSecurityPolicy,
  removeSensitiveHeaders,
  fileDownloadHeaders,
  apiSecurityHeaders,
  allSecurityHeaders,
};
