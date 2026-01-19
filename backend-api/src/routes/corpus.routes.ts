import { Router } from 'express';
import multer from 'multer';
import * as corpusController from '../controllers/corpus.controller';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';
import {
  validateDocumentUpload,
  validateIdParam,
  validatePagination,
  validateSearchQuery,
  validate,
} from '../middleware/validation.middleware';
import { asyncHandler } from '../middleware/error-handler.middleware';
import { config } from '../config/config';

const router = Router();

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.maxFileSize,
  },
  fileFilter: (req, file, cb) => {
    const allowedMimetypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];

    if (allowedMimetypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'));
    }
  },
});

/**
 * @route   POST /api/corpus/upload
 * @desc    Upload a new document to the corpus
 * @access  Private (Admin only)
 */
router.post(
  '/upload',
  authenticateToken,
  requireAdmin,
  upload.single('file'),
  validateDocumentUpload,
  validate,
  asyncHandler(corpusController.uploadDocument)
);

/**
 * @route   GET /api/corpus
 * @desc    Get list of documents with filtering and pagination
 * @access  Public
 */
router.get(
  '/',
  validatePagination,
  validateSearchQuery,
  validate,
  asyncHandler(corpusController.listDocuments)
);

/**
 * @route   GET /api/corpus/stats
 * @desc    Get corpus statistics
 * @access  Public
 */
router.get(
  '/stats',
  asyncHandler(corpusController.getStats)
);

/**
 * @route   GET /api/corpus/search
 * @desc    Search documents by keywords
 * @access  Public
 */
router.get(
  '/search',
  asyncHandler(corpusController.searchDocuments)
);

/**
 * @route   GET /api/corpus/discipline/:discipline
 * @desc    Get documents by discipline
 * @access  Public
 */
router.get(
  '/discipline/:discipline',
  asyncHandler(corpusController.getByDiscipline)
);

/**
 * @route   GET /api/corpus/recent
 * @desc    Get recent documents
 * @access  Public
 */
router.get(
  '/recent',
  asyncHandler(corpusController.getRecent)
);

/**
 * @route   GET /api/corpus/:id
 * @desc    Get document by ID
 * @access  Public
 */
router.get(
  '/:id',
  validateIdParam,
  validate,
  asyncHandler(corpusController.getDocument)
);

/**
 * @route   PUT /api/corpus/:id
 * @desc    Update document metadata
 * @access  Private (Admin only)
 */
router.put(
  '/:id',
  authenticateToken,
  requireAdmin,
  validateIdParam,
  validate,
  asyncHandler(corpusController.updateDocument)
);

/**
 * @route   DELETE /api/corpus/:id
 * @desc    Delete document
 * @access  Private (Admin only)
 */
router.delete(
  '/:id',
  authenticateToken,
  requireAdmin,
  validateIdParam,
  validate,
  asyncHandler(corpusController.deleteDocument)
);

/**
 * @route   POST /api/corpus/:id/vectorize
 * @desc    Mark document as vectorized
 * @access  Private (Admin only)
 */
router.post(
  '/:id/vectorize',
  authenticateToken,
  requireAdmin,
  validateIdParam,
  validate,
  asyncHandler(corpusController.markVectorized)
);

/**
 * @route   POST /api/corpus/:id/validate
 * @desc    Mark document as validated
 * @access  Private (Admin only)
 */
router.post(
  '/:id/validate',
  authenticateToken,
  requireAdmin,
  validateIdParam,
  validate,
  asyncHandler(corpusController.markValidated)
);

export default router;
