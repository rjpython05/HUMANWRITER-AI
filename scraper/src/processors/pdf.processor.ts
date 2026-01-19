import pdfParse from 'pdf-parse';
import fs from 'fs-extra';
import logger from '../utils/logger';

export interface PDFMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modDate?: Date;
  pages: number;
}

export interface PDFResult {
  text: string;
  metadata: PDFMetadata;
  pages: number;
  wordCount: number;
}

/**
 * Extract text and metadata from PDF files
 */
export class PDFProcessor {
  /**
   * Process PDF file from buffer
   */
  async processBuffer(buffer: Buffer): Promise<PDFResult> {
    try {
      const data = await pdfParse(buffer, {
        max: 0, // Parse all pages
      });

      const text = this.cleanText(data.text);
      const wordCount = this.countWords(text);

      const result: PDFResult = {
        text,
        metadata: this.extractMetadata(data.info),
        pages: data.numpages,
        wordCount,
      };

      logger.info('PDF processed successfully', {
        pages: result.pages,
        wordCount: result.wordCount,
      });

      return result;
    } catch (error: any) {
      logger.error('Failed to process PDF', { error: error.message });
      throw new Error(`PDF processing failed: ${error.message}`);
    }
  }

  /**
   * Process PDF file from file path
   */
  async processFile(filePath: string): Promise<PDFResult> {
    try {
      const buffer = await fs.readFile(filePath);
      return await this.processBuffer(buffer);
    } catch (error: any) {
      logger.error('Failed to read PDF file', { filePath, error: error.message });
      throw new Error(`Failed to read PDF file: ${error.message}`);
    }
  }

  /**
   * Extract metadata from PDF info object
   */
  private extractMetadata(info: any): PDFMetadata {
    return {
      title: info.Title || undefined,
      author: info.Author || undefined,
      subject: info.Subject || undefined,
      keywords: info.Keywords || undefined,
      creator: info.Creator || undefined,
      producer: info.Producer || undefined,
      creationDate: info.CreationDate ? new Date(info.CreationDate) : undefined,
      modDate: info.ModDate ? new Date(info.ModDate) : undefined,
      pages: info.numpages || 0,
    };
  }

  /**
   * Clean extracted text
   */
  private cleanText(text: string): string {
    // Remove null bytes
    text = text.replace(/\0/g, '');

    // Normalize whitespace
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
   * Validate PDF file
   */
  async validate(buffer: Buffer): Promise<boolean> {
    try {
      // Check if buffer starts with PDF header
      const header = buffer.slice(0, 5).toString('ascii');
      return header === '%PDF-';
    } catch (error) {
      return false;
    }
  }

  /**
   * Extract text from specific pages
   */
  async extractPages(
    buffer: Buffer,
    startPage: number,
    endPage: number
  ): Promise<string> {
    try {
      const data = await pdfParse(buffer, {
        max: endPage,
      });

      // PDF parse doesn't support page-specific extraction easily
      // This is a simplified version
      return this.cleanText(data.text);
    } catch (error: any) {
      logger.error('Failed to extract pages', {
        startPage,
        endPage,
        error: error.message,
      });
      throw error;
    }
  }
}

export default PDFProcessor;
