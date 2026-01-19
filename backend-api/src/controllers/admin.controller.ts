import { Response } from 'express';
import { Role, Plan } from '@prisma/client';
import {
  AuthRequest,
  AdminUserQuery,
  AdminUserUpdateDto,
  AuditLogQuery,
  SystemMetrics,
} from '../types';
import {
  sendSuccess,
  getPaginationParams,
  getPaginationMeta,
  getSkipValue,
} from '../utils/helpers';
import { logger } from '../utils/logger';
import { prisma } from '../utils/prisma';
import * as userService from '../services/user.service';
import * as corpusService from '../services/corpus.service';
import * as aiService from '../services/ai.service';
import { throwApiError } from '../middleware/error-handler.middleware';

/**
 * Get all users with filtering and pagination (Admin only)
 */
export const getUsers = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const query: AdminUserQuery = req.query as any;
    const { page, limit } = getPaginationParams(query.page, query.limit);
    const skip = getSkipValue(page, limit);

    // Build where clause
    const where: any = {};

    if (query.role) {
      where.role = query.role;
    }

    if (query.plan) {
      where.plan = query.plan;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { name: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const totalItems = await prisma.user.count({ where });

    // Get users
    const users = await prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        plan: true,
        isActive: true,
        generationsCount: true,
        generationsThisMonth: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        lastGenerationAt: true,
        password: false, // Exclude password
      },
    });

    // Calculate pagination metadata
    const meta = getPaginationMeta(page, limit, totalItems);

    logger.info('Admin: Retrieved users list', {
      adminId: req.user?.id,
      count: users.length,
      totalItems,
    });

    sendSuccess(res, { data: users, meta });
  } catch (error) {
    logger.error('Admin: Failed to get users', {
      error,
      adminId: req.user?.id,
    });
    throw error;
  }
};

/**
 * Update user (Admin only)
 */
export const updateUser = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const updates: AdminUserUpdateDto = req.body;

    logger.info('Admin: Updating user', {
      adminId: req.user?.id,
      userId: id,
      updates,
    });

    // Update user
    const user = await prisma.user.update({
      where: { id },
      data: updates,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        plan: true,
        isActive: true,
        generationsCount: true,
        generationsThisMonth: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        password: false,
      },
    });

    logger.info('Admin: User updated successfully', {
      adminId: req.user?.id,
      userId: id,
    });

    sendSuccess(res, user);
  } catch (error) {
    logger.error('Admin: Failed to update user', {
      error,
      adminId: req.user?.id,
      userId: req.params.id,
    });
    throw error;
  }
};

/**
 * Delete user (Admin only)
 */
export const deleteUser = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (id === req.user?.id) {
      throwApiError('Cannot delete your own account', 400, 'CANNOT_DELETE_SELF');
    }

    logger.info('Admin: Deleting user', {
      adminId: req.user?.id,
      userId: id,
    });

    // Delete user (cascade will delete related records)
    await prisma.user.delete({
      where: { id },
    });

    logger.info('Admin: User deleted successfully', {
      adminId: req.user?.id,
      userId: id,
    });

    sendSuccess(res, { message: 'User deleted successfully' });
  } catch (error) {
    logger.error('Admin: Failed to delete user', {
      error,
      adminId: req.user?.id,
      userId: req.params.id,
    });
    throw error;
  }
};

/**
 * Get system metrics (Admin only)
 */
export const getMetrics = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    logger.debug('Admin: Getting system metrics', {
      adminId: req.user?.id,
    });

    // Get user statistics
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({
      where: { isActive: true },
    });
    const usersByPlan = await prisma.user.groupBy({
      by: ['plan'],
      _count: true,
    });

    // Get generation statistics
    const totalGenerations = await prisma.generation.count();
    const generationsThisMonth = await prisma.generation.count({
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    });
    const avgGenerationTime = await prisma.generation.aggregate({
      _avg: { duration: true },
      where: { status: 'COMPLETED' },
    });

    // Get document statistics
    const totalDocuments = await prisma.document.count();
    const vectorizedDocuments = await prisma.document.count({
      where: { vectorized: true },
    });

    // Get recent system metrics (if stored)
    const recentMetrics = await prisma.systemMetric.findFirst({
      orderBy: { timestamp: 'desc' },
    });

    // Get AI Engine health
    const aiEngineHealth = await aiService.checkHealth();

    const metrics = {
      timestamp: new Date(),
      users: {
        total: totalUsers,
        active: activeUsers,
        byPlan: usersByPlan.reduce((acc: any, item) => {
          acc[item.plan] = item._count;
          return acc;
        }, {}),
      },
      generations: {
        total: totalGenerations,
        thisMonth: generationsThisMonth,
        avgDuration: avgGenerationTime._avg.duration || 0,
      },
      corpus: {
        total: totalDocuments,
        vectorized: vectorizedDocuments,
        vectorizationRate:
          totalDocuments > 0
            ? (vectorizedDocuments / totalDocuments) * 100
            : 0,
      },
      aiEngine: {
        status: aiEngineHealth.status,
        ollamaAvailable: aiEngineHealth.ollama_available,
        modelsLoaded: aiEngineHealth.models_loaded,
        uptime: aiEngineHealth.uptime,
      },
      system: recentMetrics
        ? {
            cpuUsage: recentMetrics.cpuUsage,
            ramUsage: recentMetrics.ramUsage,
            diskUsage: recentMetrics.diskUsage,
          }
        : null,
    };

    sendSuccess(res, metrics);
  } catch (error) {
    logger.error('Admin: Failed to get metrics', {
      error,
      adminId: req.user?.id,
    });
    throw error;
  }
};

/**
 * Get audit logs (Admin only)
 */
export const getLogs = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const query: AuditLogQuery = req.query as any;
    const { page, limit } = getPaginationParams(query.page, query.limit);
    const skip = getSkipValue(page, limit);

    // Build where clause
    const where: any = {};

    if (query.userId) {
      where.userId = query.userId;
    }

    if (query.action) {
      where.action = { contains: query.action, mode: 'insensitive' };
    }

    if (query.resource) {
      where.resource = query.resource;
    }

    if (query.success !== undefined) {
      where.success = query.success;
    }

    if (query.startDate || query.endDate) {
      where.timestamp = {};
      if (query.startDate) {
        where.timestamp.gte = query.startDate;
      }
      if (query.endDate) {
        where.timestamp.lte = query.endDate;
      }
    }

    // Get total count
    const totalItems = await prisma.auditLog.count({ where });

    // Get logs
    const logs = await prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { timestamp: 'desc' },
    });

    // Calculate pagination metadata
    const meta = getPaginationMeta(page, limit, totalItems);

    logger.info('Admin: Retrieved audit logs', {
      adminId: req.user?.id,
      count: logs.length,
      totalItems,
    });

    sendSuccess(res, { data: logs, meta });
  } catch (error) {
    logger.error('Admin: Failed to get audit logs', {
      error,
      adminId: req.user?.id,
    });
    throw error;
  }
};

/**
 * Get corpus statistics (Admin only)
 */
export const getCorpusStats = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    logger.debug('Admin: Getting corpus statistics', {
      adminId: req.user?.id,
    });

    const stats = await corpusService.getCorpusStats();

    sendSuccess(res, stats);
  } catch (error) {
    logger.error('Admin: Failed to get corpus statistics', {
      error,
      adminId: req.user?.id,
    });
    throw error;
  }
};

/**
 * Create system metric snapshot (Admin only)
 */
export const createMetricSnapshot = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const data = req.body;

    logger.info('Admin: Creating metric snapshot', {
      adminId: req.user?.id,
    });

    const metric = await prisma.systemMetric.create({
      data: {
        cpuUsage: data.cpuUsage || 0,
        ramUsage: data.ramUsage || 0,
        diskUsage: data.diskUsage || 0,
        apiCalls: data.apiCalls || 0,
        errors: data.errors || 0,
        avgResponseTime: data.avgResponseTime || 0,
        activeUsers: data.activeUsers || 0,
        generationsCount: data.generationsCount || 0,
        avgGenerationTime: data.avgGenerationTime || 0,
        ollamaUptime: data.ollamaUptime || 0,
        dbConnections: data.dbConnections || 0,
        dbQueryTime: data.dbQueryTime || 0,
      },
    });

    sendSuccess(res, metric, 201);
  } catch (error) {
    logger.error('Admin: Failed to create metric snapshot', {
      error,
      adminId: req.user?.id,
    });
    throw error;
  }
};

/**
 * Get dashboard summary (Admin only)
 */
export const getDashboard = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    logger.debug('Admin: Getting dashboard summary', {
      adminId: req.user?.id,
    });

    // Get overview stats
    const [
      totalUsers,
      totalGenerations,
      totalDocuments,
      recentGenerations,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.generation.count(),
      prisma.document.count(),
      prisma.generation.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
    ]);

    // Get AI Engine status
    const aiEngineHealth = await aiService.checkHealth();

    const dashboard = {
      overview: {
        totalUsers,
        totalGenerations,
        totalDocuments,
        recentGenerations,
        recentUsers,
      },
      aiEngine: {
        status: aiEngineHealth.status,
        available: aiEngineHealth.ollama_available,
        modelsLoaded: aiEngineHealth.models_loaded.length,
      },
      timestamp: new Date(),
    };

    sendSuccess(res, dashboard);
  } catch (error) {
    logger.error('Admin: Failed to get dashboard', {
      error,
      adminId: req.user?.id,
    });
    throw error;
  }
};

/**
 * Reset user monthly generation count (Admin only)
 */
export const resetUserGenerations = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    logger.info('Admin: Resetting user generation count', {
      adminId: req.user?.id,
      userId: id,
    });

    await prisma.user.update({
      where: { id },
      data: { generationsThisMonth: 0 },
    });

    sendSuccess(res, { message: 'User generation count reset successfully' });
  } catch (error) {
    logger.error('Admin: Failed to reset user generations', {
      error,
      adminId: req.user?.id,
      userId: req.params.id,
    });
    throw error;
  }
};

/**
 * Reset all users monthly generation counts (Admin only)
 */
export const resetAllGenerations = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    logger.info('Admin: Resetting all user generation counts', {
      adminId: req.user?.id,
    });

    const result = await prisma.user.updateMany({
      data: { generationsThisMonth: 0 },
    });

    sendSuccess(res, {
      message: 'All user generation counts reset successfully',
      count: result.count,
    });
  } catch (error) {
    logger.error('Admin: Failed to reset all generations', {
      error,
      adminId: req.user?.id,
    });
    throw error;
  }
};

export default {
  getUsers,
  updateUser,
  deleteUser,
  getMetrics,
  getLogs,
  getCorpusStats,
  createMetricSnapshot,
  getDashboard,
  resetUserGenerations,
  resetAllGenerations,
};
