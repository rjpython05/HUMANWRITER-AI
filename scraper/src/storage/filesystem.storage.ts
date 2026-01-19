import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import { ScraperConfig } from '../config/scraper.config';
import logger from '../utils/logger';

export interface StorageOptions {
  baseDir?: string;
}

export interface FileMetadata {
  id: string;
  originalName: string;
  filePath: string;
  size: number;
  extension: string;
  hash: string;
  createdAt: Date;
}

/**
 * Manages file storage for scraped documents
 */
export class FilesystemStorage {
  private baseDir: string;
  private rawDir: string;
  private processedDir: string;
  private metadataDir: string;

  constructor(options: StorageOptions = {}) {
    this.baseDir = options.baseDir || ScraperConfig.dataDir;
    this.rawDir = path.join(this.baseDir, 'raw');
    this.processedDir = path.join(this.baseDir, 'processed');
    this.metadataDir = path.join(this.baseDir, 'metadata');

    this.ensureDirectories();
  }

  /**
   * Ensure all required directories exist
   */
  private ensureDirectories(): void {
    fs.ensureDirSync(this.rawDir);
    fs.ensureDirSync(this.processedDir);
    fs.ensureDirSync(this.metadataDir);
  }

  /**
   * Save raw file from buffer or stream
   */
  async saveRawFile(
    buffer: Buffer,
    originalName: string,
    category?: string
  ): Promise<FileMetadata> {
    try {
      // Generate unique ID
      const id = this.generateId();
      const extension = path.extname(originalName).toLowerCase();
      const hash = this.calculateHash(buffer);

      // Create category subdirectory if specified
      let targetDir = this.rawDir;
      if (category) {
        targetDir = path.join(this.rawDir, category);
        fs.ensureDirSync(targetDir);
      }

      // Save file
      const fileName = `${id}${extension}`;
      const filePath = path.join(targetDir, fileName);
      await fs.writeFile(filePath, buffer);

      const metadata: FileMetadata = {
        id,
        originalName,
        filePath,
        size: buffer.length,
        extension,
        hash,
        createdAt: new Date(),
      };

      logger.info('File saved successfully', { id, filePath, size: buffer.length });
      return metadata;
    } catch (error: any) {
      logger.error('Failed to save raw file', { originalName, error: error.message });
      throw error;
    }
  }

  /**
   * Save processed text file
   */
  async saveProcessedText(
    text: string,
    id: string,
    category?: string
  ): Promise<string> {
    try {
      let targetDir = this.processedDir;
      if (category) {
        targetDir = path.join(this.processedDir, category);
        fs.ensureDirSync(targetDir);
      }

      const filePath = path.join(targetDir, `${id}.txt`);
      await fs.writeFile(filePath, text, 'utf-8');

      logger.info('Processed text saved', { id, filePath, size: text.length });
      return filePath;
    } catch (error: any) {
      logger.error('Failed to save processed text', { id, error: error.message });
      throw error;
    }
  }

  /**
   * Save metadata JSON file
   */
  async saveMetadata(
    metadata: Record<string, any>,
    id: string
  ): Promise<string> {
    try {
      const filePath = path.join(this.metadataDir, `${id}.json`);
      await fs.writeJSON(filePath, metadata, { spaces: 2 });

      logger.info('Metadata saved', { id, filePath });
      return filePath;
    } catch (error: any) {
      logger.error('Failed to save metadata', { id, error: error.message });
      throw error;
    }
  }

  /**
   * Read file from storage
   */
  async readFile(filePath: string): Promise<Buffer> {
    try {
      return await fs.readFile(filePath);
    } catch (error: any) {
      logger.error('Failed to read file', { filePath, error: error.message });
      throw error;
    }
  }

  /**
   * Read text file
   */
  async readTextFile(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error: any) {
      logger.error('Failed to read text file', { filePath, error: error.message });
      throw error;
    }
  }

  /**
   * Read metadata JSON
   */
  async readMetadata(id: string): Promise<Record<string, any>> {
    try {
      const filePath = path.join(this.metadataDir, `${id}.json`);
      return await fs.readJSON(filePath);
    } catch (error: any) {
      logger.error('Failed to read metadata', { id, error: error.message });
      throw error;
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(filePath: string): Promise<boolean> {
    return fs.pathExists(filePath);
  }

  /**
   * Delete file
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.remove(filePath);
      logger.info('File deleted', { filePath });
    } catch (error: any) {
      logger.error('Failed to delete file', { filePath, error: error.message });
      throw error;
    }
  }

  /**
   * Get file size
   */
  async getFileSize(filePath: string): Promise<number> {
    try {
      const stats = await fs.stat(filePath);
      return stats.size;
    } catch (error: any) {
      logger.error('Failed to get file size', { filePath, error: error.message });
      throw error;
    }
  }

  /**
   * List files in directory
   */
  async listFiles(directory: 'raw' | 'processed' | 'metadata'): Promise<string[]> {
    try {
      const targetDir = this[`${directory}Dir`];
      const files = await fs.readdir(targetDir);
      return files.map(file => path.join(targetDir, file));
    } catch (error: any) {
      logger.error('Failed to list files', { directory, error: error.message });
      throw error;
    }
  }

  /**
   * Get storage statistics
   */
  async getStats(): Promise<{
    rawFiles: number;
    processedFiles: number;
    metadataFiles: number;
    totalSize: number;
  }> {
    try {
      const [rawFiles, processedFiles, metadataFiles] = await Promise.all([
        fs.readdir(this.rawDir),
        fs.readdir(this.processedDir),
        fs.readdir(this.metadataDir),
      ]);

      // Calculate total size
      let totalSize = 0;
      for (const file of rawFiles) {
        const filePath = path.join(this.rawDir, file);
        const stats = await fs.stat(filePath);
        if (stats.isFile()) {
          totalSize += stats.size;
        }
      }

      return {
        rawFiles: rawFiles.length,
        processedFiles: processedFiles.length,
        metadataFiles: metadataFiles.length,
        totalSize,
      };
    } catch (error: any) {
      logger.error('Failed to get storage stats', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Calculate file hash
   */
  private calculateHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Clean old files (older than specified days)
   */
  async cleanOldFiles(days: number): Promise<number> {
    try {
      let deletedCount = 0;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const directories = [this.rawDir, this.processedDir, this.metadataDir];

      for (const dir of directories) {
        const files = await fs.readdir(dir);

        for (const file of files) {
          const filePath = path.join(dir, file);
          const stats = await fs.stat(filePath);

          if (stats.isFile() && stats.mtime < cutoffDate) {
            await fs.remove(filePath);
            deletedCount++;
          }
        }
      }

      logger.info('Old files cleaned', { deletedCount, days });
      return deletedCount;
    } catch (error: any) {
      logger.error('Failed to clean old files', { error: error.message });
      throw error;
    }
  }
}

export default FilesystemStorage;
