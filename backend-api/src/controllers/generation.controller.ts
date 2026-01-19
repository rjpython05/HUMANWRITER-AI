import { Response } from 'express';
import { GenerationStatus } from '@prisma/client';
import { AuthRequest, GenerationCreateDto, GenerationHistoryQuery } from '../types';
import { sendSuccess, getPaginationParams, getPaginationMeta, getSkipValue } from '../utils/helpers';
import { logger } from '../utils/logger';
import { prisma } from '../utils/prisma';
import * as aiService from '../services/ai.service';
import * as userService from '../services/user.service';
import { throwApiError } from '../middleware/error-handler.middleware';

/**
 * Create a new text generation
 */
export const createGeneration = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const startTime = Date.now();

  try {
    if (!req.user) {
      throwApiError('Authentication required', 401, 'NO_AUTH');
    }

    // Check generation limit
    const canGenerate = await userService.checkGenerationLimit(req.user.id);

    if (!canGenerate) {
      throwApiError(
        'Generation limit reached for your plan',
        429,
        'LIMIT_REACHED'
      );
    }

    const data: GenerationCreateDto = req.body;

    logger.info('Starting text generation', {
      userId: req.user.id,
      discipline: data.discipline,
      promptLength: data.prompt.length,
    });

    // Call AI Engine to generate text
    const aiResponse = await aiService.generateText(data);

    // Convert metrics
    const metrics = aiService.convertMetrics(aiResponse.metrics);

    // Save generation to database
    const generation = await prisma.generation.create({
      data: {
        userId: req.user.id,
        prompt: data.prompt,
        discipline: data.discipline,
        modelUsed: data.modelUsed || 'default',
        maxWords: data.maxWords,
        temperature: data.temperature || 0.7,
        fromDocument: data.fromDocument || false,
        documentPath: data.documentPath,
        rawText: aiResponse.raw_text,
        humanizedText: aiResponse.humanized_text,
        metrics: metrics as any,
        duration: aiResponse.duration,
        tokensGenerated: aiResponse.tokens_generated,
        status: GenerationStatus.COMPLETED,
      },
    });

    // Increment user generation count
    await userService.incrementGenerationCount(req.user.id);

    const totalDuration = Date.now() - startTime;

    logger.info('Text generation completed', {
      userId: req.user.id,
      generationId: generation.id,
      duration: totalDuration,
    });

    // Send response
    sendSuccess(
      res,
      {
        id: generation.id,
        prompt: generation.prompt,
        discipline: generation.discipline,
        modelUsed: generation.modelUsed,
        rawText: generation.rawText,
        humanizedText: generation.humanizedText,
        metrics: generation.metrics,
        duration: generation.duration,
        tokensGenerated: generation.tokensGenerated,
        status: generation.status,
        createdAt: generation.createdAt,
      },
      201
    );
  } catch (error) {
    const totalDuration = Date.now() - startTime;

    logger.error('Text generation failed', {
      error,
      userId: req.user?.id,
      duration: totalDuration,
    });

    // Save failed generation to database
    if (req.user) {
      try {
        await prisma.generation.create({
          data: {
            userId: req.user.id,
            prompt: req.body.prompt || '',
            discipline: req.body.discipline,
            modelUsed: req.body.modelUsed || 'default',
            rawText: '',
            humanizedText: '',
            metrics: {},
            duration: totalDuration,
            status: GenerationStatus.FAILED,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      } catch (dbError) {
        logger.error('Failed to save error generation', { dbError });
      }
    }

    throw error;
  }
};

/**
 * Stream text generation (Server-Sent Events)
 */
export const streamGeneration = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      throwApiError('Authentication required', 401, 'NO_AUTH');
    }

    // Check generation limit
    const canGenerate = await userService.checkGenerationLimit(req.user.id);

    if (!canGenerate) {
      throwApiError(
        'Generation limit reached for your plan',
        429,
        'LIMIT_REACHED'
      );
    }

    const data: GenerationCreateDto = req.body;

    logger.info('Starting streaming generation', {
      userId: req.user.id,
      discipline: data.discipline,
    });

    // Set headers for Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Stream generation
    await aiService.streamGeneration(
      data,
      // On chunk
      (chunk: any) => {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      },
      // On complete
      async (result: any) => {
        res.write(`data: [DONE]\n\n`);
        res.end();

        // Save generation to database
        try {
          const metrics = aiService.convertMetrics(result.metrics);

          await prisma.generation.create({
            data: {
              userId: req.user!.id,
              prompt: data.prompt,
              discipline: data.discipline,
              modelUsed: data.modelUsed || 'default',
              rawText: result.raw_text,
              humanizedText: result.humanized_text,
              metrics: metrics as any,
              duration: result.duration,
              tokensGenerated: result.tokens_generated,
              status: GenerationStatus.COMPLETED,
            },
          });

          // Increment user generation count
          await userService.incrementGenerationCount(req.user!.id);
        } catch (error) {
          logger.error('Failed to save streamed generation', { error });
        }
      },
      // On error
      (error: Error) => {
        res.write(
          `data: ${JSON.stringify({ error: error.message })}\n\n`
        );
        res.end();
      }
    );
  } catch (error) {
    logger.error('Streaming generation failed', {
      error,
      userId: req.user?.id,
    });
    throw error;
  }
};

/**
 * Get generation by ID
 */
export const getGeneration = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      throwApiError('Authentication required', 401, 'NO_AUTH');
    }

    const { id } = req.params;

    // Get generation
    const generation = await prisma.generation.findUnique({
      where: { id },
    });

    if (!generation) {
      throwApiError('Generation not found', 404, 'GENERATION_NOT_FOUND');
    }

    // Check if user owns this generation (or is admin)
    if (
      generation.userId !== req.user.id &&
      req.user.role !== 'ADMIN'
    ) {
      throwApiError(
        'You do not have permission to access this generation',
        403,
        'FORBIDDEN'
      );
    }

    sendSuccess(res, {
      id: generation.id,
      prompt: generation.prompt,
      discipline: generation.discipline,
      modelUsed: generation.modelUsed,
      rawText: generation.rawText,
      humanizedText: generation.humanizedText,
      metrics: generation.metrics,
      duration: generation.duration,
      tokensGenerated: generation.tokensGenerated,
      status: generation.status,
      errorMessage: generation.errorMessage,
      createdAt: generation.createdAt,
    });
  } catch (error) {
    logger.error('Failed to get generation', {
      error,
      generationId: req.params.id,
    });
    throw error;
  }
};

/**
 * Get generation history with pagination and filters
 */
export const getHistory = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      throwApiError('Authentication required', 401, 'NO_AUTH');
    }

    const query: GenerationHistoryQuery = req.query as any;
    const { page, limit } = getPaginationParams(query.page, query.limit);
    const skip = getSkipValue(page, limit);

    // Build where clause
    const where: any = {
      userId: req.user.id,
    };

    if (query.discipline) {
      where.discipline = query.discipline;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = query.startDate;
      }
      if (query.endDate) {
        where.createdAt.lte = query.endDate;
      }
    }

    // Get total count
    const totalItems = await prisma.generation.count({ where });

    // Get generations
    const generations = await prisma.generation.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        prompt: true,
        discipline: true,
        modelUsed: true,
        rawText: false, // Don't include full text in list
        humanizedText: false, // Don't include full text in list
        metrics: true,
        duration: true,
        tokensGenerated: true,
        status: true,
        errorMessage: true,
        createdAt: true,
      },
    });

    // Calculate pagination metadata
    const meta = getPaginationMeta(page, limit, totalItems);

    logger.info('Generation history retrieved', {
      userId: req.user.id,
      count: generations.length,
      totalItems,
    });

    sendSuccess(res, { data: generations, meta });
  } catch (error) {
    logger.error('Failed to get generation history', {
      error,
      userId: req.user?.id,
    });
    throw error;
  }
};

/**
 * Delete generation
 */
export const deleteGeneration = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      throwApiError('Authentication required', 401, 'NO_AUTH');
    }

    const { id } = req.params;

    // Get generation
    const generation = await prisma.generation.findUnique({
      where: { id },
    });

    if (!generation) {
      throwApiError('Generation not found', 404, 'GENERATION_NOT_FOUND');
    }

    // Check if user owns this generation (or is admin)
    if (
      generation.userId !== req.user.id &&
      req.user.role !== 'ADMIN'
    ) {
      throwApiError(
        'You do not have permission to delete this generation',
        403,
        'FORBIDDEN'
      );
    }

    // Delete generation
    await prisma.generation.delete({
      where: { id },
    });

    logger.info('Generation deleted', { generationId: id, userId: req.user.id });

    sendSuccess(res, { message: 'Generation deleted successfully' });
  } catch (error) {
    logger.error('Failed to delete generation', {
      error,
      generationId: req.params.id,
    });
    throw error;
  }
};

/**
 * Get generation statistics
 */
export const getStats = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      throwApiError('Authentication required', 401, 'NO_AUTH');
    }

    // Get user's generation statistics
    const totalGenerations = await prisma.generation.count({
      where: { userId: req.user.id },
    });

    const successfulGenerations = await prisma.generation.count({
      where: {
        userId: req.user.id,
        status: GenerationStatus.COMPLETED,
      },
    });

    const failedGenerations = await prisma.generation.count({
      where: {
        userId: req.user.id,
        status: GenerationStatus.FAILED,
      },
    });

    // Get average duration
    const durationAggregate = await prisma.generation.aggregate({
      where: {
        userId: req.user.id,
        status: GenerationStatus.COMPLETED,
      },
      _avg: {
        duration: true,
      },
    });

    // Get generations by discipline
    const byDiscipline = await prisma.generation.groupBy({
      by: ['discipline'],
      where: { userId: req.user.id },
      _count: true,
    });

    const disciplineStats: any = {};
    byDiscipline.forEach((item) => {
      disciplineStats[item.discipline] = item._count;
    });

    sendSuccess(res, {
      totalGenerations,
      successfulGenerations,
      failedGenerations,
      successRate:
        totalGenerations > 0
          ? (successfulGenerations / totalGenerations) * 100
          : 0,
      avgDuration: durationAggregate._avg.duration || 0,
      byDiscipline: disciplineStats,
    });
  } catch (error) {
    logger.error('Failed to get generation stats', {
      error,
      userId: req.user?.id,
    });
    throw error;
  }
};

export default {
  createGeneration,
  streamGeneration,
  getGeneration,
  getHistory,
  deleteGeneration,
  getStats,
};
