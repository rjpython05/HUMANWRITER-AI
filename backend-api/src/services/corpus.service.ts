import { Document, Discipline } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import {
  DocumentUploadDto,
  DocumentResponse,
  CorpusQuery,
  CorpusStats,
  PaginatedResponse,
  PaginationMeta,
} from '../types';
import {
  getPaginationParams,
  getPaginationMeta,
  getSkipValue,
} from '../utils/helpers';
import { throwApiError } from '../middleware/error-handler.middleware';
import * as fileService from './file.service';

/**
 * Process and save uploaded document
 */
export const processUpload = async (
  file: Express.Multer.File,
  metadata: DocumentUploadDto,
  userId?: string
): Promise<Document> => {
  try {
    // Save file to disk
    const uploadResult = await fileService.saveFile(file, 'documents');

    // Calculate word count (approximate from file size)
    // In a real implementation, you would extract text and count words
    const approximateWordCount = Math.floor(file.size / 6); // Rough estimate

    // Create document record
    const document = await prisma.document.create({
      data: {
        title: metadata.title,
        authors: metadata.authors,
        year: metadata.year,
        institution: metadata.institution,
        source: metadata.source,
        discipline: metadata.discipline,
        subdiscipline: metadata.subdiscipline,
        language: metadata.language,
        keywords: metadata.keywords,
        wordCount: approximateWordCount,
        filePath: uploadResult.path,
        processedPath: uploadResult.path, // Will be updated after processing
        addedBy: userId,
        vectorized: false,
        validated: false,
        qualityIssues: [],
      },
    });

    logger.info('Document uploaded successfully', {
      documentId: document.id,
      title: document.title,
      userId,
    });

    return document;
  } catch (error) {
    logger.error('Failed to process document upload', {
      error,
      title: metadata.title,
    });
    throw error;
  }
};

/**
 * Get documents with filtering and pagination
 */
export const getDocuments = async (
  query: CorpusQuery
): Promise<PaginatedResponse<DocumentResponse>> => {
  try {
    const { page, limit } = getPaginationParams(query.page, query.limit);
    const skip = getSkipValue(page, limit);

    // Build where clause
    const where: any = {};

    if (query.discipline) {
      where.discipline = query.discipline;
    }

    if (query.language) {
      where.language = query.language;
    }

    if (query.year) {
      where.year = query.year;
    }

    if (query.validated !== undefined) {
      where.validated = query.validated;
    }

    if (query.vectorized !== undefined) {
      where.vectorized = query.vectorized;
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { authors: { has: query.search } },
        { keywords: { has: query.search } },
        { institution: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const totalItems = await prisma.document.count({ where });

    // Get documents
    const documents = await prisma.document.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    // Convert to response format
    const data: DocumentResponse[] = documents.map(toDocumentResponse);

    // Calculate pagination metadata
    const meta: PaginationMeta = getPaginationMeta(page, limit, totalItems);

    return { data, meta };
  } catch (error) {
    logger.error('Failed to get documents', { error, query });
    throw error;
  }
};

/**
 * Get document by ID
 */
export const getDocumentById = async (
  documentId: string
): Promise<Document | null> => {
  try {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    return document;
  } catch (error) {
    logger.error('Failed to get document by ID', { error, documentId });
    throw error;
  }
};

/**
 * Delete document
 */
export const deleteDocument = async (documentId: string): Promise<void> => {
  try {
    // Get document
    const document = await getDocumentById(documentId);

    if (!document) {
      throwApiError('Document not found', 404, 'DOCUMENT_NOT_FOUND');
    }

    // Delete files from disk
    try {
      await fileService.deleteFile(document!.filePath);
      if (document!.processedPath !== document!.filePath) {
        await fileService.deleteFile(document!.processedPath);
      }
    } catch (error) {
      logger.warn('Failed to delete document files', {
        error,
        documentId,
        filePath: document!.filePath,
      });
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database
    await prisma.document.delete({
      where: { id: documentId },
    });

    logger.info('Document deleted successfully', { documentId });
  } catch (error) {
    logger.error('Failed to delete document', { error, documentId });
    throw error;
  }
};

/**
 * Update document
 */
export const updateDocument = async (
  documentId: string,
  updates: Partial<DocumentUploadDto>
): Promise<Document> => {
  try {
    const document = await prisma.document.update({
      where: { id: documentId },
      data: updates,
    });

    logger.info('Document updated successfully', { documentId });
    return document;
  } catch (error) {
    logger.error('Failed to update document', { error, documentId });
    throw error;
  }
};

/**
 * Mark document as vectorized
 */
export const markAsVectorized = async (
  documentId: string,
  embeddingId: string
): Promise<void> => {
  try {
    await prisma.document.update({
      where: { id: documentId },
      data: {
        vectorized: true,
        embeddingId,
      },
    });

    logger.info('Document marked as vectorized', { documentId, embeddingId });
  } catch (error) {
    logger.error('Failed to mark document as vectorized', {
      error,
      documentId,
    });
    throw error;
  }
};

/**
 * Mark document as validated
 */
export const markAsValidated = async (
  documentId: string,
  validationScore: number,
  qualityIssues: string[]
): Promise<void> => {
  try {
    await prisma.document.update({
      where: { id: documentId },
      data: {
        validated: true,
        validationScore,
        qualityIssues,
      },
    });

    logger.info('Document marked as validated', {
      documentId,
      validationScore,
    });
  } catch (error) {
    logger.error('Failed to mark document as validated', {
      error,
      documentId,
    });
    throw error;
  }
};

/**
 * Get corpus statistics
 */
export const getCorpusStats = async (): Promise<CorpusStats> => {
  try {
    // Get total counts
    const totalDocuments = await prisma.document.count();
    const validatedDocuments = await prisma.document.count({
      where: { validated: true },
    });
    const vectorizedDocuments = await prisma.document.count({
      where: { vectorized: true },
    });

    // Get total word count
    const wordCountAggregate = await prisma.document.aggregate({
      _sum: {
        wordCount: true,
      },
    });

    // Get average validation score
    const validationScoreAggregate = await prisma.document.aggregate({
      _avg: {
        validationScore: true,
      },
      where: {
        validationScore: { not: null },
      },
    });

    // Get documents by discipline
    const documentsByDiscipline: Record<Discipline, number> = {
      INGENIERIA: 0,
      CIENCIAS_SOCIALES: 0,
      EXACTAS_NATURALES: 0,
      AGRARIAS: 0,
    };

    for (const discipline of Object.values(Discipline)) {
      const count = await prisma.document.count({
        where: { discipline },
      });
      documentsByDiscipline[discipline] = count;
    }

    // Get documents by language
    const languageGroups = await prisma.document.groupBy({
      by: ['language'],
      _count: true,
    });

    const documentsByLanguage: Record<string, number> = {};
    languageGroups.forEach((group) => {
      documentsByLanguage[group.language] = group._count;
    });

    // Get documents by year
    const yearGroups = await prisma.document.groupBy({
      by: ['year'],
      _count: true,
    });

    const documentsByYear: Record<number, number> = {};
    yearGroups.forEach((group) => {
      documentsByYear[group.year] = group._count;
    });

    return {
      totalDocuments,
      totalWordCount: wordCountAggregate._sum.wordCount || 0,
      documentsByDiscipline,
      documentsByLanguage,
      documentsByYear,
      validatedDocuments,
      vectorizedDocuments,
      averageValidationScore: validationScoreAggregate._avg.validationScore || 0,
    };
  } catch (error) {
    logger.error('Failed to get corpus stats', { error });
    throw error;
  }
};

/**
 * Get documents by discipline
 */
export const getDocumentsByDiscipline = async (
  discipline: Discipline,
  limit?: number
): Promise<Document[]> => {
  try {
    const documents = await prisma.document.findMany({
      where: {
        discipline,
        validated: true,
        vectorized: true,
      },
      take: limit,
      orderBy: { validationScore: 'desc' },
    });

    return documents;
  } catch (error) {
    logger.error('Failed to get documents by discipline', {
      error,
      discipline,
    });
    throw error;
  }
};

/**
 * Search documents by keywords
 */
export const searchDocuments = async (
  keywords: string[],
  discipline?: Discipline
): Promise<Document[]> => {
  try {
    const where: any = {
      keywords: {
        hasSome: keywords,
      },
    };

    if (discipline) {
      where.discipline = discipline;
    }

    const documents = await prisma.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return documents;
  } catch (error) {
    logger.error('Failed to search documents', { error, keywords });
    throw error;
  }
};

/**
 * Get recent documents
 */
export const getRecentDocuments = async (limit = 10): Promise<Document[]> => {
  try {
    const documents = await prisma.document.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return documents;
  } catch (error) {
    logger.error('Failed to get recent documents', { error });
    throw error;
  }
};

/**
 * Convert Document to DocumentResponse
 */
export const toDocumentResponse = (document: Document): DocumentResponse => {
  return {
    id: document.id,
    title: document.title,
    authors: document.authors,
    year: document.year,
    institution: document.institution,
    source: document.source,
    discipline: document.discipline,
    subdiscipline: document.subdiscipline,
    language: document.language,
    keywords: document.keywords,
    wordCount: document.wordCount,
    filePath: document.filePath,
    vectorized: document.vectorized,
    validated: document.validated,
    validationScore: document.validationScore,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
};

export default {
  processUpload,
  getDocuments,
  getDocumentById,
  deleteDocument,
  updateDocument,
  markAsVectorized,
  markAsValidated,
  getCorpusStats,
  getDocumentsByDiscipline,
  searchDocuments,
  getRecentDocuments,
  toDocumentResponse,
};
