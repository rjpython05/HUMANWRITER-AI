import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { config } from '../config/config';
import {
  FileUploadResult,
  FileValidationOptions,
} from '../types';
import { throwApiError } from '../middleware/error-handler.middleware';
import {
  getFileExtension,
  isAllowedFileExtension,
  formatFileSize,
} from '../utils/helpers';

/**
 * Validate uploaded file
 */
export const validateFile = (
  file: Express.Multer.File,
  options?: Partial<FileValidationOptions>
): void => {
  const defaultOptions: FileValidationOptions = {
    maxSize: config.maxFileSize,
    allowedMimetypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ],
    allowedExtensions: config.allowedFileTypes.split(','),
  };

  const validationOptions = { ...defaultOptions, ...options };

  // Check file size
  if (file.size > validationOptions.maxSize) {
    throwApiError(
      `File size exceeds maximum allowed size of ${formatFileSize(validationOptions.maxSize)}`,
      400,
      'FILE_TOO_LARGE',
      { maxSize: formatFileSize(validationOptions.maxSize) }
    );
  }

  // Check file extension
  if (
    !isAllowedFileExtension(
      file.originalname,
      validationOptions.allowedExtensions
    )
  ) {
    throwApiError(
      'File type not allowed',
      400,
      'INVALID_FILE_TYPE',
      { allowedTypes: validationOptions.allowedExtensions }
    );
  }

  // Check MIME type
  if (!validationOptions.allowedMimetypes.includes(file.mimetype)) {
    throwApiError(
      'File MIME type not allowed',
      400,
      'INVALID_MIME_TYPE',
      { allowedMimetypes: validationOptions.allowedMimetypes }
    );
  }

  logger.debug('File validated successfully', {
    filename: file.originalname,
    size: file.size,
    mimetype: file.mimetype,
  });
};

/**
 * Save uploaded file to disk
 */
export const saveFile = async (
  file: Express.Multer.File,
  subdirectory?: string
): Promise<FileUploadResult> => {
  try {
    // Validate file
    validateFile(file);

    // Generate unique filename
    const ext = getFileExtension(file.originalname);
    const filename = `${uuidv4()}.${ext}`;

    // Construct directory path
    const uploadDir = subdirectory
      ? path.join(config.uploadDir, subdirectory)
      : config.uploadDir;

    // Ensure directory exists
    await ensureDirectoryExists(uploadDir);

    // Full file path
    const filePath = path.join(uploadDir, filename);

    // Save file
    await fs.writeFile(filePath, file.buffer);

    logger.info('File saved successfully', {
      originalname: file.originalname,
      filename,
      path: filePath,
      size: file.size,
    });

    return {
      filename,
      path: filePath,
      size: file.size,
      mimetype: file.mimetype,
      originalname: file.originalname,
    };
  } catch (error) {
    logger.error('Failed to save file', { error, filename: file.originalname });
    throw error;
  }
};

/**
 * Delete file from disk
 */
export const deleteFile = async (filePath: string): Promise<void> => {
  try {
    // Check if file exists
    const exists = await fileExists(filePath);

    if (!exists) {
      logger.warn('File not found for deletion', { filePath });
      return;
    }

    // Delete file
    await fs.unlink(filePath);

    logger.info('File deleted successfully', { filePath });
  } catch (error) {
    logger.error('Failed to delete file', { error, filePath });
    throw error;
  }
};

/**
 * Check if file exists
 */
export const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

/**
 * Ensure directory exists, create if not
 */
export const ensureDirectoryExists = async (
  dirPath: string
): Promise<void> => {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    logger.error('Failed to create directory', { error, dirPath });
    throw error;
  }
};

/**
 * Read file contents
 */
export const readFile = async (filePath: string): Promise<string> => {
  try {
    const exists = await fileExists(filePath);

    if (!exists) {
      throwApiError('File not found', 404, 'FILE_NOT_FOUND');
    }

    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    logger.error('Failed to read file', { error, filePath });
    throw error;
  }
};

/**
 * Get file stats
 */
export const getFileStats = async (filePath: string) => {
  try {
    const exists = await fileExists(filePath);

    if (!exists) {
      throwApiError('File not found', 404, 'FILE_NOT_FOUND');
    }

    const stats = await fs.stat(filePath);

    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
    };
  } catch (error) {
    logger.error('Failed to get file stats', { error, filePath });
    throw error;
  }
};

/**
 * Move file to a different location
 */
export const moveFile = async (
  sourcePath: string,
  destinationPath: string
): Promise<void> => {
  try {
    const exists = await fileExists(sourcePath);

    if (!exists) {
      throwApiError('Source file not found', 404, 'FILE_NOT_FOUND');
    }

    // Ensure destination directory exists
    const destinationDir = path.dirname(destinationPath);
    await ensureDirectoryExists(destinationDir);

    // Move file
    await fs.rename(sourcePath, destinationPath);

    logger.info('File moved successfully', {
      from: sourcePath,
      to: destinationPath,
    });
  } catch (error) {
    logger.error('Failed to move file', {
      error,
      sourcePath,
      destinationPath,
    });
    throw error;
  }
};

/**
 * Copy file to a different location
 */
export const copyFile = async (
  sourcePath: string,
  destinationPath: string
): Promise<void> => {
  try {
    const exists = await fileExists(sourcePath);

    if (!exists) {
      throwApiError('Source file not found', 404, 'FILE_NOT_FOUND');
    }

    // Ensure destination directory exists
    const destinationDir = path.dirname(destinationPath);
    await ensureDirectoryExists(destinationDir);

    // Copy file
    await fs.copyFile(sourcePath, destinationPath);

    logger.info('File copied successfully', {
      from: sourcePath,
      to: destinationPath,
    });
  } catch (error) {
    logger.error('Failed to copy file', {
      error,
      sourcePath,
      destinationPath,
    });
    throw error;
  }
};

/**
 * List files in directory
 */
export const listFiles = async (dirPath: string): Promise<string[]> => {
  try {
    const exists = await fileExists(dirPath);

    if (!exists) {
      throwApiError('Directory not found', 404, 'DIRECTORY_NOT_FOUND');
    }

    const files = await fs.readdir(dirPath);
    return files;
  } catch (error) {
    logger.error('Failed to list files', { error, dirPath });
    throw error;
  }
};

/**
 * Get total size of directory
 */
export const getDirectorySize = async (dirPath: string): Promise<number> => {
  try {
    let totalSize = 0;
    const files = await listFiles(dirPath);

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = await getFileStats(filePath);

      if (stats.isFile) {
        totalSize += stats.size;
      } else if (stats.isDirectory) {
        totalSize += await getDirectorySize(filePath);
      }
    }

    return totalSize;
  } catch (error) {
    logger.error('Failed to get directory size', { error, dirPath });
    throw error;
  }
};

/**
 * Clean up old files (older than specified days)
 */
export const cleanupOldFiles = async (
  dirPath: string,
  daysOld: number
): Promise<number> => {
  try {
    let deletedCount = 0;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const files = await listFiles(dirPath);

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = await getFileStats(filePath);

      if (stats.isFile && stats.modified < cutoffDate) {
        await deleteFile(filePath);
        deletedCount++;
      }
    }

    logger.info('Cleanup completed', {
      dirPath,
      daysOld,
      deletedCount,
    });

    return deletedCount;
  } catch (error) {
    logger.error('Failed to cleanup old files', { error, dirPath, daysOld });
    throw error;
  }
};

/**
 * Get file extension and validate it's a text-extractable document
 */
export const isDocumentFile = (filename: string): boolean => {
  const ext = getFileExtension(filename);
  const documentExtensions = ['pdf', 'doc', 'docx', 'txt'];
  return documentExtensions.includes(ext);
};

/**
 * Generate safe filename from title
 */
export const generateSafeFilename = (title: string, extension: string): string => {
  const safeName = title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);

  return `${safeName}-${uuidv4().substring(0, 8)}.${extension}`;
};
