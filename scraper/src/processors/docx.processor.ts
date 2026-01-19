import mammoth from 'mammoth';
import fs from 'fs-extra';
import logger from '../utils/logger';

export interface DOCXMetadata {
  wordCount: number;
  hasImages: boolean;
  hasTables: boolean;
}

export interface DOCXResult {
  text: string;
  html: string;
  metadata: DOCXMetadata;
  wordCount: number;
}

/**
 * Extract text and metadata from DOCX files
 */
export class DOCXProcessor {
  /**
   * Process DOCX file from buffer
   */
  async processBuffer(buffer: Buffer): Promise<DOCXResult> {
    try {
      const textResult = await mammoth.extractRawText({ buffer });
      const htmlResult = await mammoth.convertToHtml({ buffer });

      const text = this.cleanText(textResult.value);
      const html = htmlResult.value;
      const wordCount = this.countWords(text);

      const result: DOCXResult = {
        text,
        html,
        metadata: {
          wordCount,
          hasImages: html.includes('<img'),
          hasTables: html.includes('<table'),
        },
        wordCount,
      };

      if (textResult.messages.length > 0) {
        logger.warn('DOCX processing warnings', {
          warnings: textResult.messages.map(m => m.message),
        });
      }

      logger.info('DOCX processed successfully', {
        wordCount: result.wordCount,
        hasImages: result.metadata.hasImages,
        hasTables: result.metadata.hasTables,
      });

      return result;
    } catch (error: any) {
      logger.error('Failed to process DOCX', { error: error.message });
      throw new Error(`DOCX processing failed: ${error.message}`);
    }
  }

  /**
   * Process DOCX file from file path
   */
  async processFile(filePath: string): Promise<DOCXResult> {
    try {
      const buffer = await fs.readFile(filePath);
      return await this.processBuffer(buffer);
    } catch (error: any) {
      logger.error('Failed to read DOCX file', { filePath, error: error.message });
      throw new Error(`Failed to read DOCX file: ${error.message}`);
    }
  }

  /**
   * Extract only text (no HTML)
   */
  async extractText(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return this.cleanText(result.value);
    } catch (error: any) {
      logger.error('Failed to extract text from DOCX', { error: error.message });
      throw error;
    }
  }

  /**
   * Extract with markdown formatting
   */
  async extractMarkdown(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.convertToMarkdown({ buffer });
      return result.value;
    } catch (error: any) {
      logger.error('Failed to extract markdown from DOCX', { error: error.message });
      throw error;
    }
  }

  /**
   * Clean extracted text
   */
  private cleanText(text: string): string {
    // Remove excessive whitespace
    text = text.replace(/\s+/g, ' ');

    // Remove excessive line breaks
    text = text.replace(/\n{3,}/g, '\n\n');

    // Trim
    return text.trim();
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Validate DOCX file
   */
  async validate(buffer: Buffer): Promise<boolean> {
    try {
      // DOCX files are ZIP archives starting with PK
      const header = buffer.slice(0, 2).toString('ascii');
      return header === 'PK';
    } catch (error) {
      return false;
    }
  }

  /**
   * Extract custom properties if available
   */
  async extractProperties(buffer: Buffer): Promise<Record<string, any>> {
    try {
      // Mammoth doesn't expose custom properties directly
      // This is a placeholder for future enhancement
      return {};
    } catch (error: any) {
      logger.error('Failed to extract properties', { error: error.message });
      return {};
    }
  }
}

export default DOCXProcessor;
