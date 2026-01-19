import { app } from './app';
import { config } from './config/config';
import { logger } from './utils/logger';
import {
  connectDatabase,
  disconnectDatabase,
  checkDatabaseHealth,
} from './utils/prisma';
import {
  handleUncaughtException,
  handleUnhandledRejection,
} from './middleware/error-handler.middleware';
import * as aiService from './services/ai.service';
import * as fileService from './services/file.service';

// Handle uncaught exceptions and unhandled rejections
handleUncaughtException();
handleUnhandledRejection();

/**
 * Initialize server and start listening
 */
const startServer = async (): Promise<void> => {
  try {
    // ==========================================
    // DATABASE CONNECTION
    // ==========================================

    logger.info('Connecting to database...');
    await connectDatabase();

    // Check database health
    const isDatabaseHealthy = await checkDatabaseHealth();
    if (!isDatabaseHealthy) {
      logger.error('Database health check failed');
      process.exit(1);
    }

    logger.info('Database connection established and healthy');

    // ==========================================
    // ENSURE UPLOAD DIRECTORIES EXIST
    // ==========================================

    logger.info('Ensuring upload directories exist...');
    await fileService.ensureDirectoryExists(config.uploadDir);
    await fileService.ensureDirectoryExists(`${config.uploadDir}/documents`);
    await fileService.ensureDirectoryExists(`${config.uploadDir}/temp`);
    logger.info('Upload directories verified');

    // ==========================================
    // CHECK AI ENGINE CONNECTION
    // ==========================================

    logger.info('Checking AI Engine connection...');
    const aiEngineHealth = await aiService.checkHealth();

    if (aiEngineHealth.status === 'healthy') {
      logger.info('AI Engine is healthy', {
        ollamaAvailable: aiEngineHealth.ollama_available,
        modelsLoaded: aiEngineHealth.models_loaded,
      });
    } else {
      logger.warn('AI Engine is not responding - generation features may be unavailable', {
        status: aiEngineHealth.status,
      });
    }

    // ==========================================
    // START HTTP SERVER
    // ==========================================

    const server = app.listen(config.port, () => {
      logger.info(`Server started successfully`, {
        port: config.port,
        environment: config.env,
        nodeVersion: process.version,
        platform: process.platform,
        pid: process.pid,
      });

      logger.info(`Server is running at http://localhost:${config.port}`);
      logger.info(`Health check: http://localhost:${config.port}/health`);
      logger.info(`API endpoint: http://localhost:${config.port}/api`);
    });

    // ==========================================
    // GRACEFUL SHUTDOWN
    // ==========================================

    const gracefulShutdown = async (signal: string): Promise<void> => {
      logger.info(`${signal} received, starting graceful shutdown...`);

      // Stop accepting new connections
      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          // Disconnect from database
          await disconnectDatabase();
          logger.info('Database disconnected');

          // Exit process
          logger.info('Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during graceful shutdown', { error });
          process.exit(1);
        }
      });

      // Force shutdown after timeout
      setTimeout(() => {
        logger.error('Graceful shutdown timeout, forcing shutdown');
        process.exit(1);
      }, 30000); // 30 seconds timeout
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle process exit
    process.on('exit', (code) => {
      logger.info(`Process exiting with code ${code}`);
    });

    // ==========================================
    // PERIODIC HEALTH CHECKS
    // ==========================================

    // Check database health every 5 minutes
    setInterval(async () => {
      const isHealthy = await checkDatabaseHealth();
      if (!isHealthy) {
        logger.error('Periodic database health check failed');
      }
    }, 5 * 60 * 1000);

    // Ping AI Engine every 10 minutes to keep it warm
    setInterval(async () => {
      const isAvailable = await aiService.pingAIEngine();
      if (!isAvailable) {
        logger.warn('AI Engine ping failed - may be unavailable');
      }
    }, 10 * 60 * 1000);

  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

// Start the server
startServer().catch((error) => {
  logger.error('Unexpected error during server startup', { error });
  process.exit(1);
});

// Export for testing
export default app;
