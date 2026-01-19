import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/async-handler.middleware';
import { logger } from '../utils/logger';
import * as plagiarismService from '../services/plagiarism.service';
import { PrismaClient, SimilarityRisk } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/plagiarism/check
 * Check text for plagiarism
 */
router.post(
  '/check',
  authenticate,
  [
    body('text')
      .isString()
      .isLength({ min: 100 })
      .withMessage('Text must be at least 100 characters'),
    body('generationId')
      .optional()
      .isString()
      .withMessage('Generation ID must be a string'),
    body('topSources')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('Top sources must be between 1 and 10'),
    body('similarityThreshold')
      .optional()
      .isFloat({ min: 0, max: 1 })
      .withMessage('Similarity threshold must be between 0 and 1'),
    body('includePassages')
      .optional()
      .isBoolean()
      .withMessage('Include passages must be boolean'),
  ],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const { text, generationId, topSources, similarityThreshold, includePassages } = req.body;
    const userId = (req as any).user.id;

    logger.info('Plagiarism check requested', {
      userId,
      generationId,
      textLength: text.length,
    });

    // Check plagiarism
    const result = await plagiarismService.checkPlagiarism({
      text,
      generationId,
      topSources,
      similarityThreshold,
      includePassages,
    });

    // Determine risk level
    let riskLevel: SimilarityRisk;
    if (result.similarityPercentage < 15) {
      riskLevel = SimilarityRisk.LOW;
    } else if (result.similarityPercentage < 30) {
      riskLevel = SimilarityRisk.MODERATE;
    } else if (result.similarityPercentage < 50) {
      riskLevel = SimilarityRisk.HIGH;
    } else {
      riskLevel = SimilarityRisk.CRITICAL;
    }

    // Store report in database
    const report = await prisma.plagiarismReport.create({
      data: {
        userId,
        generationId: generationId || null,
        text,
        overallSimilarity: result.overallSimilarity,
        riskLevel,
        matchedChunks: result.statistics.matchedChunks || 0,
        totalChunks: result.statistics.totalChunksAnalyzed || 0,
        sources: result.topSources,
        matchedPassages: result.highlightedPassages,
        methodsUsed: ['vector', 'tfidf'],
        corpusSize: result.statistics.uniqueSourcesFound || 0,
        recommendations: [],
        requiresRewrite: result.similarityPercentage > 30,
      },
    });

    logger.info('Plagiarism report saved', {
      reportId: report.id,
      riskLevel: report.riskLevel,
      similarity: result.similarityPercentage,
    });

    res.json({
      ...result,
      id: report.id,
      createdAt: report.createdAt,
    });
  })
);

/**
 * GET /api/plagiarism/report/:id
 * Get plagiarism report by ID
 */
router.get(
  '/report/:id',
  authenticate,
  [param('id').isString().withMessage('Report ID is required')],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = (req as any).user.id;

    logger.info('Fetching plagiarism report', { reportId: id, userId });

    // Get report from database
    const report = await prisma.plagiarismReport.findUnique({
      where: { id },
    });

    if (!report) {
      return res.status(404).json({
        error: 'Report not found',
      });
    }

    // Check if user has access (owns the report or is admin)
    const user = (req as any).user;
    if (
      report.userId &&
      report.userId !== userId &&
      user.role !== 'ADMIN'
    ) {
      return res.status(403).json({
        error: 'Access denied',
      });
    }

    res.json(report);
  })
);

/**
 * GET /api/plagiarism/reports
 * Get all plagiarism reports for user
 */
router.get(
  '/reports',
  authenticate,
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('offset')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Offset must be non-negative'),
  ],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    logger.info('Fetching user plagiarism reports', { userId, limit, offset });

    // Get reports for user
    const reports = await prisma.plagiarismReport.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    const total = await prisma.plagiarismReport.count({
      where: {
        userId,
      },
    });

    res.json({
      reports,
      total,
      limit,
      offset,
    });
  })
);

/**
 * POST /api/plagiarism/sources
 * Find similar sources
 */
router.post(
  '/sources',
  authenticate,
  [
    body('text')
      .isString()
      .isLength({ min: 50 })
      .withMessage('Text must be at least 50 characters'),
    body('topK')
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage('Top K must be between 1 and 20'),
    body('discipline')
      .optional()
      .isString()
      .withMessage('Discipline must be a string'),
  ],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const { text, topK, discipline } = req.body;

    logger.info('Finding similar sources');

    const result = await plagiarismService.findSources({
      text,
      topK,
      discipline,
    });

    res.json(result);
  })
);

/**
 * GET /api/plagiarism/source/:sourceId
 * Get source details
 */
router.get(
  '/source/:sourceId',
  authenticate,
  [param('sourceId').isString().withMessage('Source ID is required')],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const { sourceId } = req.params;

    logger.info('Fetching source details', { sourceId });

    const details = await plagiarismService.getSourceDetails(sourceId);

    res.json(details);
  })
);

/**
 * POST /api/plagiarism/compare/:sourceId
 * Compare text with specific source
 */
router.post(
  '/compare/:sourceId',
  authenticate,
  [
    param('sourceId').isString().withMessage('Source ID is required'),
    body('text')
      .isString()
      .isLength({ min: 50 })
      .withMessage('Text must be at least 50 characters'),
  ],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const { sourceId } = req.params;
    const { text } = req.body;

    logger.info('Comparing with source', { sourceId });

    const result = await plagiarismService.compareWithSource(sourceId, text);

    res.json(result);
  })
);

/**
 * POST /api/plagiarism/export
 * Export plagiarism report
 */
router.post(
  '/export',
  authenticate,
  [
    body('reportId').isString().withMessage('Report ID is required'),
    body('format')
      .isIn(['json', 'text', 'html'])
      .withMessage('Format must be json, text, or html'),
  ],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const { reportId, format } = req.body;
    const userId = (req as any).user.id;

    logger.info('Exporting report', { reportId, format });

    // Get report from database
    const report = await prisma.plagiarismReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return res.status(404).json({
        error: 'Report not found',
      });
    }

    // Check access
    const user = (req as any).user;
    if (
      report.userId &&
      report.userId !== userId &&
      user.role !== 'ADMIN'
    ) {
      return res.status(403).json({
        error: 'Access denied',
      });
    }

    // Convert to export format
    const reportData = {
      report_id: report.id,
      timestamp: report.createdAt.toISOString(),
      text_length: report.text.length,
      word_count: report.text.split(/\s+/).length,
      overall_similarity: report.overallSimilarity,
      similarity_percentage: report.overallSimilarity * 100,
      risk_level: report.riskLevel,
      top_sources: report.sources,
      highlighted_passages: report.matchedPassages,
      summary: `Plagiarism check completed with ${report.riskLevel} risk level. Overall similarity: ${(report.overallSimilarity * 100).toFixed(1)}%`,
    };

    const exported = await plagiarismService.exportReport(reportData, format as any);

    // Set content type and filename
    const contentTypes = {
      json: 'application/json',
      text: 'text/plain',
      html: 'text/html',
    };

    res.setHeader('Content-Type', contentTypes[format as keyof typeof contentTypes]);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=plagiarism_report_${reportId}.${format}`
    );

    res.send(exported);
  })
);

/**
 * DELETE /api/plagiarism/report/:id
 * Delete plagiarism report
 */
router.delete(
  '/report/:id',
  authenticate,
  [param('id').isString().withMessage('Report ID is required')],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const user = (req as any).user;

    logger.info('Deleting plagiarism report', { reportId: id, userId });

    // Get report to check ownership
    const report = await prisma.plagiarismReport.findUnique({
      where: { id },
    });

    if (!report) {
      return res.status(404).json({
        error: 'Report not found',
      });
    }

    // Check access
    if (
      report.userId &&
      report.userId !== userId &&
      user.role !== 'ADMIN'
    ) {
      return res.status(403).json({
        error: 'Access denied',
      });
    }

    // Delete from database
    await prisma.plagiarismReport.delete({
      where: { id },
    });

    // Delete from AI Engine cache (non-critical)
    await plagiarismService.deleteReport(id);

    res.json({
      success: true,
      message: 'Report deleted successfully',
    });
  })
);

/**
 * GET /api/plagiarism/stats
 * Get plagiarism statistics
 */
router.get(
  '/stats',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const user = (req as any).user;

    // Get stats from AI Engine
    const aiStats = await plagiarismService.getPlagiarismStats();

    // Get database stats
    let dbStats;
    if (user.role === 'ADMIN') {
      // Admin sees all stats
      dbStats = await prisma.plagiarismReport.groupBy({
        by: ['riskLevel'],
        _count: true,
      });
    } else {
      // User sees only their stats
      dbStats = await prisma.plagiarismReport.groupBy({
        by: ['riskLevel'],
        where: {
          userId,
        },
        _count: true,
      });
    }

    const totalReports = dbStats.reduce((sum, group) => sum + group._count, 0);

    res.json({
      totalReports,
      byRiskLevel: dbStats,
      aiEngineStats: aiStats,
    });
  })
);

export default router;
