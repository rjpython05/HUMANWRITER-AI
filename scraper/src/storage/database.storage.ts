import { PrismaClient, Document, Discipline } from '@prisma/client';
import logger from '../utils/logger';

export interface DocumentMetadata {
  title: string;
  authors: string[];
  year: number;
  institution: string;
  source: string;
  discipline: Discipline;
  subdiscipline: string;
  language: string;
  keywords: string[];
  wordCount: number;
  filePath: string;
  processedPath: string;
  validationScore?: number;
  qualityIssues?: string[];
}

/**
 * Manages database operations for scraped documents
 */
export class DatabaseStorage {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
  }

  /**
   * Save document metadata to database
   */
  async saveDocument(metadata: DocumentMetadata): Promise<Document> {
    try {
      const document = await this.prisma.document.create({
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
          wordCount: metadata.wordCount,
          filePath: metadata.filePath,
          processedPath: metadata.processedPath,
          validated: false,
          vectorized: false,
          validationScore: metadata.validationScore,
          qualityIssues: metadata.qualityIssues || [],
        },
      });

      logger.info('Document saved to database', {
        id: document.id,
        title: document.title,
        discipline: document.discipline,
      });

      return document;
    } catch (error: any) {
      logger.error('Failed to save document to database', {
        title: metadata.title,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Update document
   */
  async updateDocument(
    id: string,
    updates: Partial<DocumentMetadata>
  ): Promise<Document> {
    try {
      const document = await this.prisma.document.update({
        where: { id },
        data: updates,
      });

      logger.info('Document updated', { id, updates: Object.keys(updates) });
      return document;
    } catch (error: any) {
      logger.error('Failed to update document', { id, error: error.message });
      throw error;
    }
  }

  /**
   * Mark document as validated
   */
  async markAsValidated(
    id: string,
    validationScore: number,
    qualityIssues: string[]
  ): Promise<Document> {
    try {
      const document = await this.prisma.document.update({
        where: { id },
        data: {
          validated: true,
          validationScore,
          qualityIssues,
        },
      });

      logger.info('Document marked as validated', { id, validationScore });
      return document;
    } catch (error: any) {
      logger.error('Failed to mark document as validated', { id, error: error.message });
      throw error;
    }
  }

  /**
   * Mark document as vectorized
   */
  async markAsVectorized(id: string, embeddingId: string): Promise<Document> {
    try {
      const document = await this.prisma.document.update({
        where: { id },
        data: {
          vectorized: true,
          embeddingId,
        },
      });

      logger.info('Document marked as vectorized', { id, embeddingId });
      return document;
    } catch (error: any) {
      logger.error('Failed to mark document as vectorized', { id, error: error.message });
      throw error;
    }
  }

  /**
   * Find document by source URL
   */
  async findBySource(source: string): Promise<Document | null> {
    try {
      return await this.prisma.document.findFirst({
        where: { source },
      });
    } catch (error: any) {
      logger.error('Failed to find document by source', { source, error: error.message });
      throw error;
    }
  }

  /**
   * Check if document exists by source
   */
  async documentExists(source: string): Promise<boolean> {
    try {
      const count = await this.prisma.document.count({
        where: { source },
      });
      return count > 0;
    } catch (error: any) {
      logger.error('Failed to check if document exists', { source, error: error.message });
      throw error;
    }
  }

  /**
   * Get documents by discipline
   */
  async getByDiscipline(
    discipline: Discipline,
    limit: number = 100,
    offset: number = 0
  ): Promise<Document[]> {
    try {
      return await this.prisma.document.findMany({
        where: { discipline },
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      });
    } catch (error: any) {
      logger.error('Failed to get documents by discipline', {
        discipline,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get documents by institution
   */
  async getByInstitution(
    institution: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<Document[]> {
    try {
      return await this.prisma.document.findMany({
        where: { institution },
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      });
    } catch (error: any) {
      logger.error('Failed to get documents by institution', {
        institution,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get unvalidated documents
   */
  async getUnvalidated(limit: number = 100): Promise<Document[]> {
    try {
      return await this.prisma.document.findMany({
        where: { validated: false },
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
    } catch (error: any) {
      logger.error('Failed to get unvalidated documents', { error: error.message });
      throw error;
    }
  }

  /**
   * Get unvectorized documents
   */
  async getUnvectorized(limit: number = 100): Promise<Document[]> {
    try {
      return await this.prisma.document.findMany({
        where: { vectorized: false },
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
    } catch (error: any) {
      logger.error('Failed to get unvectorized documents', { error: error.message });
      throw error;
    }
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    total: number;
    byDiscipline: Record<string, number>;
    validated: number;
    vectorized: number;
    avgWordCount: number;
  }> {
    try {
      const [total, validated, vectorized, byDiscipline, avgResult] = await Promise.all([
        this.prisma.document.count(),
        this.prisma.document.count({ where: { validated: true } }),
        this.prisma.document.count({ where: { vectorized: true } }),
        this.prisma.document.groupBy({
          by: ['discipline'],
          _count: { discipline: true },
        }),
        this.prisma.document.aggregate({
          _avg: { wordCount: true },
        }),
      ]);

      const disciplineCounts: Record<string, number> = {};
      byDiscipline.forEach(item => {
        disciplineCounts[item.discipline] = item._count.discipline;
      });

      return {
        total,
        byDiscipline: disciplineCounts,
        validated,
        vectorized,
        avgWordCount: avgResult._avg.wordCount || 0,
      };
    } catch (error: any) {
      logger.error('Failed to get database stats', { error: error.message });
      throw error;
    }
  }

  /**
   * Delete document
   */
  async deleteDocument(id: string): Promise<void> {
    try {
      await this.prisma.document.delete({
        where: { id },
      });

      logger.info('Document deleted from database', { id });
    } catch (error: any) {
      logger.error('Failed to delete document', { id, error: error.message });
      throw error;
    }
  }

  /**
   * Delete documents by source pattern
   */
  async deleteBySourcePattern(pattern: string): Promise<number> {
    try {
      const result = await this.prisma.document.deleteMany({
        where: {
          source: {
            contains: pattern,
          },
        },
      });

      logger.info('Documents deleted by pattern', { pattern, count: result.count });
      return result.count;
    } catch (error: any) {
      logger.error('Failed to delete documents by pattern', {
        pattern,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Close database connection
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
    logger.info('Database connection closed');
  }
}

export default DatabaseStorage;
