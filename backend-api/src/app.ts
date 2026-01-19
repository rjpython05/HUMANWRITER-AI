import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { config } from './config/config';
import { logger, morganStream } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/error-handler.middleware';
import { generalRateLimiter } from './middleware/rate-limit.middleware';

// Import routes
import usersRoutes from './routes/users.routes';
import generationRoutes from './routes/generation.routes';
import corpusRoutes from './routes/corpus.routes';
import adminRoutes from './routes/admin.routes';

/**
 * Create and configure Express application
 */
const createApp = (): Application => {
  const app = express();

  // ==========================================
  // MIDDLEWARE
  // ==========================================

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // CORS configuration
  app.use(cors({
    origin: config.corsOrigin.split(',').map(origin => origin.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
  }));

  // Compression middleware
  app.use(compression());

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // HTTP request logging
  const morganFormat = config.env === 'production' ? 'combined' : 'dev';
  app.use(morgan(morganFormat, { stream: morganStream }));

  // General rate limiting
  app.use('/api/', generalRateLimiter);

  // ==========================================
  // HEALTH CHECK
  // ==========================================

  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.env,
        version: '1.0.0',
      },
    });
  });

  app.get('/', (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      data: {
        message: 'HumanWriter AI - Backend API',
        version: '1.0.0',
        documentation: '/api-docs',
      },
    });
  });

  // ==========================================
  // API ROUTES
  // ==========================================

  // Authentication routes
  app.use('/api/auth', usersRoutes);

  // Generation routes
  app.use('/api/generate', generationRoutes);

  // Corpus routes
  app.use('/api/corpus', corpusRoutes);

  // Admin routes
  app.use('/api/admin', adminRoutes);

  // ==========================================
  // API INFO ENDPOINT
  // ==========================================

  app.get('/api', (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      data: {
        name: 'HumanWriter AI - Backend API',
        version: '1.0.0',
        environment: config.env,
        endpoints: {
          auth: '/api/auth',
          generate: '/api/generate',
          corpus: '/api/corpus',
          admin: '/api/admin',
        },
        documentation: '/api-docs',
      },
    });
  });

  // ==========================================
  // ERROR HANDLING
  // ==========================================

  // 404 handler
  app.use(notFoundHandler);

  // Global error handler
  app.use(errorHandler);

  logger.info('Express application configured successfully', {
    environment: config.env,
    port: config.port,
  });

  return app;
};

// Create and export the app
export const app = createApp();

export default app;
