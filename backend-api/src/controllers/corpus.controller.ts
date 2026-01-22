import { Response } from 'express';
import { AuthRequest, DocumentUploadDto, CorpusQuery } from '../types';
import { sendSuccess } from '../utils/helpers';
import { logger } from '../utils/logger';
import * as corpusService from '../services/corpus.service';
import { throwApiError } from '../middleware/error-handler.middleware';

/**
 * Upload a new document to the corpus
 */
export const uploadDocument = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      throwApiError('Authentication required', 401, 'NO_AUTH');
    }

    // Check if file was uploaded
    if (!req.file) {
      throwApiError('No file uploaded', 400, 'NO_FILE');
    }

    // Parse metadata from request body
    const metadata: DocumentUploadDto = {
      title: req.body.title,
      authors: JSON.parse(req.body.authors || '[]'),
      year: parseInt(req.body.year),
      institution: req.body.institution,
      source: req.body.source,
      discipline: req.body.discipline,
      subdiscipline: req.body.subdiscipline,
      language: req.body.language,
      keywords: JSON.parse(req.body.keywords || '[]'),
    };

    logger.info('Processing document upload', {
      userId: req.user!.id,
      title: metadata.title,
      filename: req.file!.originalname,
    });

    // Process and save document
    const document = await corpusService.processUpload(
      req.file!,
      metadata,
      req.user!.id
    );

    logger.info('Document uploaded successfully', {
      documentId: document.id,
      userId: req.user!.id,
    });

    // Convert to response format
    const response = corpusService.toDocumentResponse(document);

    sendSuccess(res, response, 201);
  } catch (error) {
    logger.error('Document upload failed', {
      error,
      userId: req.user?.id,
      filename: req.file?.originalname,
    });
    throw error;
  }
};

/**
 * Get list of documents with filtering and pagination
 */
export const listDocuments = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const query: CorpusQuery = req.query as any;

    logger.debug('Listing documents', { query });

    // Get documents
    const result = await corpusService.getDocuments(query);

    sendSuccess(res, result);
  } catch (error) {
    logger.error('Failed to list documents', { error, query: req.query });
    throw error;
  }
};

/**
 * Get document by ID
 */
export const getDocument = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const docId = Array.isArray(id) ? id[0] : id;

    logger.debug('Getting document', { documentId: docId });

    // Get document
    const document = await corpusService.getDocumentById(docId);

    if (!document) {
      throwApiError('Document not found', 404, 'DOCUMENT_NOT_FOUND');
    }

    // Convert to response format
    const response = corpusService.toDocumentResponse(document!);

    sendSuccess(res, response);
  } catch (error) {
    logger.error('Failed to get document', {
      error,
      documentId: req.params.id,
    });
    throw error;
  }
};

/**
 * Delete document
 */
export const deleteDocument = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      throwApiError('Authentication required', 401, 'NO_AUTH');
    }

    const { id } = req.params;
    const docId = Array.isArray(id) ? id[0] : id;

    logger.info('Deleting document', {
      documentId: docId,
      userId: req.user!.id,
    });

    // Delete document
    await corpusService.deleteDocument(docId);

    logger.info('Document deleted successfully', {
      documentId: docId,
      userId: req.user!.id,
    });

    sendSuccess(res, { message: 'Document deleted successfully' });
  } catch (error) {
    logger.error('Failed to delete document', {
      error,
      documentId: req.params.id,
      userId: req.user?.id,
    });
    throw error;
  }
};

/**
 * Update document metadata
 */
export const updateDocument = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      throwApiError('Authentication required', 401, 'NO_AUTH');
    }

    const { id } = req.params;
    const docId = Array.isArray(id) ? id[0] : id;
    const updates = req.body;

    logger.info('Updating document', {
      documentId: docId,
      userId: req.user!.id,
    });

    // Update document
    const document = await corpusService.updateDocument(docId, updates);

    logger.info('Document updated successfully', {
      documentId: docId,
      userId: req.user!.id,
    });

    // Convert to response format
    const response = corpusService.toDocumentResponse(document);

    sendSuccess(res, response);
  } catch (error) {
    logger.error('Failed to update document', {
      error,
      documentId: req.params.id,
      userId: req.user?.id,
    });
    throw error;
  }
};

/**
 * Mark document as vectorized
 */
export const markVectorized = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      throwApiError('Authentication required', 401, 'NO_AUTH');
    }

    const { id } = req.params;
    const docId = Array.isArray(id) ? id[0] : id;
    const { embeddingId } = req.body;

    if (!embeddingId) {
      throwApiError('Embedding ID is required', 400, 'MISSING_EMBEDDING_ID');
    }

    logger.info('Marking document as vectorized', {
      documentId: docId,
      embeddingId,
      userId: req.user!.id,
    });

    // Mark as vectorized
    await corpusService.markAsVectorized(docId, embeddingId);

    sendSuccess(res, { message: 'Document marked as vectorized' });
  } catch (error) {
    logger.error('Failed to mark document as vectorized', {
      error,
      documentId: req.params.id,
    });
    throw error;
  }
};

/**
 * Mark document as validated
 */
export const markValidated = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      throwApiError('Authentication required', 401, 'NO_AUTH');
    }

    const { id } = req.params;
    const docId = Array.isArray(id) ? id[0] : id;
    const { validationScore, qualityIssues } = req.body;

    if (validationScore === undefined) {
      throwApiError(
        'Validation score is required',
        400,
        'MISSING_VALIDATION_SCORE'
      );
    }

    logger.info('Marking document as validated', {
      documentId: docId,
      validationScore,
      userId: req.user!.id,
    });

    // Mark as validated
    await corpusService.markAsValidated(
      docId,
      validationScore,
      qualityIssues || []
    );

    sendSuccess(res, { message: 'Document marked as validated' });
  } catch (error) {
    logger.error('Failed to mark document as validated', {
      error,
      documentId: req.params.id,
    });
    throw error;
  }
};

/**
 * Get corpus statistics
 */
export const getStats = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    logger.debug('Getting corpus statistics');

    // Get stats
    const stats = await corpusService.getCorpusStats();

    sendSuccess(res, stats);
  } catch (error) {
    logger.error('Failed to get corpus statistics', { error });
    throw error;
  }
};

/**
 * Search documents by keywords
 */
export const searchDocuments = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { keywords, discipline } = req.query;

    if (!keywords) {
      throwApiError('Keywords are required', 400, 'MISSING_KEYWORDS');
    }

    const keywordArray =
      typeof keywords === 'string' ? keywords.split(',') : [];

    logger.debug('Searching documents', { keywords: keywordArray, discipline });

    // Search documents
    const documents = await corpusService.searchDocuments(
      keywordArray,
      discipline as any
    );

    // Convert to response format
    const response = documents.map(corpusService.toDocumentResponse);

    sendSuccess(res, response);
  } catch (error) {
    logger.error('Failed to search documents', {
      error,
      query: req.query,
    });
    throw error;
  }
};

/**
 * Get documents by discipline
 */
export const getByDiscipline = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { discipline } = req.params;
    const { limit } = req.query;

    logger.debug('Getting documents by discipline', {
      discipline,
      limit,
    });

    // Get documents
    const documents = await corpusService.getDocumentsByDiscipline(
      discipline as any,
      limit ? parseInt(limit as string) : undefined
    );

    // Convert to response format
    const response = documents.map(corpusService.toDocumentResponse);

    sendSuccess(res, response);
  } catch (error) {
    logger.error('Failed to get documents by discipline', {
      error,
      discipline: req.params.discipline,
    });
    throw error;
  }
};

/**
 * Get recent documents
 */
export const getRecent = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { limit } = req.query;

    logger.debug('Getting recent documents', { limit });

    // Get documents
    const documents = await corpusService.getRecentDocuments(
      limit ? parseInt(limit as string) : 10
    );

    // Convert to response format
    const response = documents.map(corpusService.toDocumentResponse);

    sendSuccess(res, response);
  } catch (error) {
    logger.error('Failed to get recent documents', { error });
    throw error;
  }
};

export default {
  uploadDocument,
  listDocuments,
  getDocument,
  deleteDocument,
  updateDocument,
  markVectorized,
  markValidated,
  getStats,
  searchDocuments,
  getByDiscipline,
  getRecent,
};
