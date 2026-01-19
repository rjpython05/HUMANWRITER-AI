import axios, { AxiosInstance } from 'axios';
import puppeteer, { Browser, Page } from 'puppeteer';
import * as cheerio from 'cheerio';
import UserAgent from 'user-agents';
import fs from 'fs-extra';
import path from 'path';
import mime from 'mime-types';
import { ScraperConfig } from '../config/scraper.config';
import { SourceConfig } from '../config/sources.config';
import { RateLimiter, createDefaultRateLimiter } from '../utils/rate-limiter';
import { retry, retryFileDownload } from '../utils/retry';
import logger, { logScraperProgress, logFileDownload } from '../utils/logger';
import { FilesystemStorage } from '../storage/filesystem.storage';
import { DatabaseStorage, DocumentMetadata } from '../storage/database.storage';
import { PDFProcessor } from '../processors/pdf.processor';
import { DOCXProcessor } from '../processors/docx.processor';
import { TextCleaner } from '../processors/text.cleaner';
import { MetadataExtractor } from '../processors/metadata.extractor';
import { DocumentValidator } from '../processors/validator';
import { DisciplineClassifier } from '../classifier/discipline.classifier';

export interface ScraperStats {
  documentsFound: number;
  documentsDownloaded: number;
  documentsFailed: number;
  documentsSkipped: number;
  startTime: Date;
  endTime?: Date;
  duration?: number;
}

export interface DocumentInfo {
  url: string;
  title?: string;
  authors?: string[];
  year?: number;
  format?: string;
}

/**
 * Base abstract class for all scrapers
 * Provides common functionality for scraping, downloading, and processing documents
 */
export abstract class BaseScraper {
  protected sourceConfig: SourceConfig;
  protected rateLimiter: RateLimiter;
  protected axiosClient: AxiosInstance;
  protected browser?: Browser;
  protected userAgentGenerator: UserAgent;

  // Storage and processing
  protected filesystemStorage: FilesystemStorage;
  protected databaseStorage: DatabaseStorage;
  protected pdfProcessor: PDFProcessor;
  protected docxProcessor: DOCXProcessor;
  protected textCleaner: TextCleaner;
  protected metadataExtractor: MetadataExtractor;
  protected validator: DocumentValidator;
  protected classifier: DisciplineClassifier;

  // Statistics
  protected stats: ScraperStats;

  constructor(sourceConfig: SourceConfig) {
    this.sourceConfig = sourceConfig;
    this.rateLimiter = createDefaultRateLimiter();
    this.userAgentGenerator = new UserAgent();

    // Initialize axios client
    this.axiosClient = axios.create({
      timeout: ScraperConfig.timeout,
      headers: {
        'User-Agent': this.getRandomUserAgent(),
      },
    });

    // Initialize processors
    this.filesystemStorage = new FilesystemStorage();
    this.databaseStorage = new DatabaseStorage();
    this.pdfProcessor = new PDFProcessor();
    this.docxProcessor = new DOCXProcessor();
    this.textCleaner = new TextCleaner();
    this.metadataExtractor = new MetadataExtractor();
    this.validator = new DocumentValidator();
    this.classifier = new DisciplineClassifier();

    // Initialize stats
    this.stats = {
      documentsFound: 0,
      documentsDownloaded: 0,
      documentsFailed: 0,
      documentsSkipped: 0,
      startTime: new Date(),
    };
  }

  /**
   * Abstract method to be implemented by each scraper
   * This is the main scraping logic
   */
  abstract scrape(): Promise<void>;

  /**
   * Run the scraper
   */
  async run(): Promise<ScraperStats> {
    try {
      logScraperProgress(this.sourceConfig.id, 'started', {
        source: this.sourceConfig.name,
        url: this.sourceConfig.url,
      });

      await this.scrape();

      this.stats.endTime = new Date();
      this.stats.duration = this.stats.endTime.getTime() - this.stats.startTime.getTime();

      logScraperProgress(this.sourceConfig.id, 'completed', {
        ...this.stats,
        durationSeconds: (this.stats.duration / 1000).toFixed(2),
      });

      return this.stats;
    } catch (error: any) {
      logScraperProgress(this.sourceConfig.id, 'failed', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Download a file from URL
   */
  protected async downloadFile(url: string, documentInfo?: DocumentInfo): Promise<Buffer | null> {
    try {
      const downloadFn = async () => {
        const response = await this.axiosClient.get(url, {
          responseType: 'arraybuffer',
          headers: {
            'User-Agent': this.getRandomUserAgent(),
          },
        });

        return Buffer.from(response.data);
      };

      const buffer = await this.rateLimiter.execute(() =>
        retryFileDownload(downloadFn)
      );

      logFileDownload(url, 'memory', true);
      return buffer;
    } catch (error: any) {
      logFileDownload(url, 'memory', false, error.message);
      logger.error('Failed to download file', { url, error: error.message });
      return null;
    }
  }

  /**
   * Process and save document
   */
  protected async processAndSaveDocument(
    buffer: Buffer,
    url: string,
    documentInfo?: DocumentInfo
  ): Promise<boolean> {
    try {
      // Check if document already exists
      const exists = await this.databaseStorage.documentExists(url);
      if (exists) {
        logger.info('Document already exists, skipping', { url });
        this.stats.documentsSkipped++;
        return false;
      }

      // Determine file extension
      const extension = this.detectFileExtension(buffer, documentInfo?.format);

      // Validate file
      const fileName = `${path.basename(url)}${extension}`;
      const fileValidation = this.validator.validateFile(fileName, buffer.length, extension);

      if (!fileValidation.isValid) {
        logger.warn('File validation failed', { url, issues: fileValidation.issues });
        this.stats.documentsSkipped++;
        return false;
      }

      // Save raw file
      const fileMetadata = await this.filesystemStorage.saveRawFile(
        buffer,
        fileName,
        this.sourceConfig.category
      );

      // Extract text based on file type
      let extractedText = '';
      let pdfMetadata: any = undefined;
      let docxMetadata: any = undefined;

      if (extension === '.pdf') {
        const pdfResult = await this.pdfProcessor.processBuffer(buffer);
        extractedText = pdfResult.text;
        pdfMetadata = pdfResult.metadata;
      } else if (extension === '.docx' || extension === '.doc') {
        const docxResult = await this.docxProcessor.processBuffer(buffer);
        extractedText = docxResult.text;
        docxMetadata = docxResult.metadata;
      } else {
        logger.warn('Unsupported file format', { extension, url });
        this.stats.documentsSkipped++;
        return false;
      }

      // Clean text
      const cleanedText = this.textCleaner.clean(extractedText);

      // Extract metadata
      const metadata = this.metadataExtractor.extractWithFallbacks(
        cleanedText,
        pdfMetadata,
        docxMetadata,
        url
      );

      // Classify discipline
      const classification = this.classifier.classifyWithMetadata(cleanedText, {
        title: metadata.title || documentInfo?.title,
        keywords: metadata.keywords,
        institution: metadata.institution,
        source: url,
      });

      // Validate document
      const validation = this.validator.validate(cleanedText, {
        ...metadata,
        year: metadata.year || documentInfo?.year,
        title: metadata.title || documentInfo?.title,
        authors: metadata.authors.length > 0 ? metadata.authors : documentInfo?.authors,
      });

      if (!validation.isValid) {
        logger.warn('Document validation failed', {
          url,
          score: validation.score,
          issues: validation.issues,
        });
        this.stats.documentsSkipped++;
        return false;
      }

      // Save processed text
      const processedPath = await this.filesystemStorage.saveProcessedText(
        cleanedText,
        fileMetadata.id,
        this.sourceConfig.category
      );

      // Save metadata
      await this.filesystemStorage.saveMetadata(
        {
          ...metadata,
          url,
          fileId: fileMetadata.id,
          filePath: fileMetadata.filePath,
          processedPath,
          discipline: classification.discipline,
          subdiscipline: classification.subdiscipline,
          validationScore: validation.score,
          validationIssues: validation.issues,
          classificationConfidence: classification.confidence,
        },
        fileMetadata.id
      );

      // Save to database
      const documentMetadata: DocumentMetadata = {
        title: metadata.title || documentInfo?.title || 'Untitled',
        authors: metadata.authors.length > 0 ? metadata.authors : documentInfo?.authors || [],
        year: metadata.year || documentInfo?.year || new Date().getFullYear(),
        institution: metadata.institution || this.sourceConfig.name,
        source: url,
        discipline: classification.discipline,
        subdiscipline: classification.subdiscipline || 'General',
        language: metadata.language,
        keywords: metadata.keywords,
        wordCount: this.textCleaner.getStatistics(cleanedText).wordCount,
        filePath: fileMetadata.filePath,
        processedPath,
        validationScore: validation.score,
        qualityIssues: validation.issues,
      };

      await this.databaseStorage.saveDocument(documentMetadata);

      this.stats.documentsDownloaded++;
      logger.info('Document processed and saved successfully', {
        url,
        discipline: classification.discipline,
        validationScore: validation.score,
      });

      return true;
    } catch (error: any) {
      logger.error('Failed to process and save document', { url, error: error.message });
      this.stats.documentsFailed++;
      return false;
    }
  }

  /**
   * Initialize Puppeteer browser
   */
  protected async initBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch(ScraperConfig.puppeteerOptions);
    }
    return this.browser;
  }

  /**
   * Create a new page with random user agent
   */
  protected async createPage(): Promise<Page> {
    const browser = await this.initBrowser();
    const page = await browser.newPage();

    await page.setUserAgent(this.getRandomUserAgent());
    await page.setViewport({ width: 1920, height: 1080 });

    return page;
  }

  /**
   * Fetch HTML with axios
   */
  protected async fetchHtml(url: string): Promise<string> {
    try {
      const response = await this.rateLimiter.execute(async () => {
        return await retry(async () => {
          const resp = await this.axiosClient.get(url, {
            headers: {
              'User-Agent': this.getRandomUserAgent(),
            },
          });
          return resp.data;
        });
      });

      return response;
    } catch (error: any) {
      logger.error('Failed to fetch HTML', { url, error: error.message });
      throw error;
    }
  }

  /**
   * Parse HTML with Cheerio
   */
  protected parseHtml(html: string): cheerio.CheerioAPI {
    return cheerio.load(html);
  }

  /**
   * Detect file extension from buffer or format hint
   */
  protected detectFileExtension(buffer: Buffer, formatHint?: string): string {
    // Check format hint first
    if (formatHint) {
      const ext = formatHint.toLowerCase();
      if (ext.includes('pdf')) return '.pdf';
      if (ext.includes('docx') || ext.includes('word')) return '.docx';
      if (ext.includes('doc')) return '.doc';
    }

    // Check file signature (magic numbers)
    const header = buffer.slice(0, 10).toString('hex');

    // PDF: %PDF- (25 50 44 46 2D)
    if (header.startsWith('255044462d')) return '.pdf';

    // DOCX/ZIP: PK (50 4B)
    if (header.startsWith('504b')) {
      // Check if it's a DOCX by looking for word/ directory
      const content = buffer.toString('utf-8', 0, 1000);
      if (content.includes('word/')) return '.docx';
      return '.zip';
    }

    // DOC: D0 CF 11 E0
    if (header.startsWith('d0cf11e0')) return '.doc';

    // Default to PDF
    return '.pdf';
  }

  /**
   * Get random user agent
   */
  protected getRandomUserAgent(): string {
    const randomIndex = Math.floor(Math.random() * ScraperConfig.userAgents.length);
    return ScraperConfig.userAgents[randomIndex];
  }

  /**
   * Sleep for specified milliseconds
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Extract year from text
   */
  protected extractYear(text: string): number | undefined {
    const yearMatch = text.match(/\b(19[9]\d|20[0-3]\d)\b/);
    return yearMatch ? parseInt(yearMatch[1], 10) : undefined;
  }

  /**
   * Clean title text
   */
  protected cleanTitle(title: string): string {
    return title
      .replace(/\s+/g, ' ')
      .replace(/[^\w\sáéíóúñÁÉÍÓÚÑüÜ.,;:()\-]/g, '')
      .trim()
      .substring(0, 300);
  }

  /**
   * Clean author name
   */
  protected cleanAuthorName(name: string): string {
    return name
      .replace(/\s+/g, ' ')
      .replace(/[^\w\sáéíóúñÁÉÍÓÚÑüÜ.]/g, '')
      .trim()
      .substring(0, 100);
  }

  /**
   * Cleanup resources
   */
  protected async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = undefined;
    }
    await this.rateLimiter.onIdle();
    await this.databaseStorage.disconnect();
  }

  /**
   * Get scraper statistics
   */
  getStats(): ScraperStats {
    return this.stats;
  }
}

export default BaseScraper;
