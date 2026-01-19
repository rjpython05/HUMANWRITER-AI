import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting database connection limit during hot reloading in development
declare global {
  var prisma: PrismaClient | undefined;
}

// Prisma Client Options
const prismaOptions = {
  log: [
    {
      emit: 'event' as const,
      level: 'query' as const,
    },
    {
      emit: 'event' as const,
      level: 'error' as const,
    },
    {
      emit: 'event' as const,
      level: 'warn' as const,
    },
  ],
};

// Create Prisma Client instance
export const prisma = global.prisma || new PrismaClient(prismaOptions);

// Log Prisma queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query' as any, (e: any) => {
    logger.debug('Prisma Query', {
      query: e.query,
      params: e.params,
      duration: `${e.duration}ms`,
    });
  });
}

// Log Prisma errors
prisma.$on('error' as any, (e: any) => {
  logger.error('Prisma Error', {
    message: e.message,
    target: e.target,
  });
});

// Log Prisma warnings
prisma.$on('warn' as any, (e: any) => {
  logger.warn('Prisma Warning', {
    message: e.message,
  });
});

// Store Prisma instance globally in development
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

/**
 * Connect to the database
 */
export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Failed to connect to database', { error });
    throw error;
  }
};

/**
 * Disconnect from the database
 */
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected successfully');
  } catch (error) {
    logger.error('Failed to disconnect from database', { error });
    throw error;
  }
};

/**
 * Check database connection health
 */
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('Database health check failed', { error });
    return false;
  }
};

/**
 * Execute a database transaction
 */
export const executeTransaction = async <T>(
  fn: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>) => Promise<T>
): Promise<T> => {
  try {
    return await prisma.$transaction(fn);
  } catch (error) {
    logger.error('Transaction failed', { error });
    throw error;
  }
};

/**
 * Reset database (for testing purposes only)
 */
export const resetDatabase = async (): Promise<void> => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Cannot reset database in production');
  }

  try {
    // Delete all data in order (respecting foreign key constraints)
    await prisma.feedback.deleteMany();
    await prisma.generation.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.apiKey.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.document.deleteMany();
    await prisma.knowledgeGap.deleteMany();
    await prisma.fineTuningJob.deleteMany();
    await prisma.systemMetric.deleteMany();
    await prisma.user.deleteMany();

    logger.info('Database reset successfully');
  } catch (error) {
    logger.error('Failed to reset database', { error });
    throw error;
  }
};

/**
 * Get database statistics
 */
export const getDatabaseStats = async () => {
  try {
    const [
      userCount,
      generationCount,
      documentCount,
      feedbackCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.generation.count(),
      prisma.document.count(),
      prisma.feedback.count(),
    ]);

    return {
      users: userCount,
      generations: generationCount,
      documents: documentCount,
      feedbacks: feedbackCount,
    };
  } catch (error) {
    logger.error('Failed to get database stats', { error });
    throw error;
  }
};

export default prisma;
