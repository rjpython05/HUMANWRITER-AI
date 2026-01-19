import { BaseScraper, DocumentInfo } from '../base.scraper';
import { SourceConfig, getSourceById } from '../../config/sources.config';
import logger from '../../utils/logger';

/**
 * ONE (Oficina Nacional de Estadística) Scraper
 * Scrapes statistical reports and research papers from one.gob.do
 */
export class ONEScraper extends BaseScraper {
  constructor() {
    const config = getSourceById('one');
    if (!config) {
      throw new Error('ONE source configuration not found');
    }
    super(config);
  }

  async scrape(): Promise<void> {
    logger.info('Starting ONE scraper', { url: this.sourceConfig.url });

    try {
      // Scrape different publication sections
      await this.scrapeCensus();
      await this.scrapeSurveys();
      await this.scrapeReports();
      await this.scrapePublications();
    } catch (error: any) {
      logger.error('ONE scraper failed', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Scrape census data and reports
   */
  private async scrapeCensus(): Promise<void> {
    const censusUrls = [
      `${this.sourceConfig.url}/censos`,
      `${this.sourceConfig.url}/estadisticas/censos`,
    ];

    for (const url of censusUrls) {
      try {
        await this.scrapeSection(url, 'Census');
      } catch (error: any) {
        logger.warn('Failed to scrape ONE census section', { url, error: error.message });
      }
    }
  }

  /**
   * Scrape survey reports
   */
  private async scrapeSurveys(): Promise<void> {
    const surveyUrls = [
      `${this.sourceConfig.url}/encuestas`,
      `${this.sourceConfig.url}/estadisticas/encuestas`,
    ];

    for (const url of surveyUrls) {
      try {
        await this.scrapeSection(url, 'Survey');
      } catch (error: any) {
        logger.warn('Failed to scrape ONE surveys section', { url, error: error.message });
      }
    }
  }

  /**
   * Scrape statistical reports
   */
  private async scrapeReports(): Promise<void> {
    const reportUrls = [
      `${this.sourceConfig.url}/estadisticas`,
      `${this.sourceConfig.url}/publicaciones/informes`,
    ];

    for (const url of reportUrls) {
      try {
        await this.scrapeSection(url, 'Statistical Report');
      } catch (error: any) {
        logger.warn('Failed to scrape ONE reports section', { url, error: error.message });
      }
    }
  }

  /**
   * Scrape publications section
   */
  private async scrapePublications(): Promise<void> {
    const pubUrl = `${this.sourceConfig.url}/publicaciones`;

    try {
      await this.scrapeSection(pubUrl, 'Publication');
    } catch (error: any) {
      logger.warn('Failed to scrape ONE publications section', { error: error.message });
    }
  }

  /**
   * Scrape a section of the ONE website
   */
  private async scrapeSection(sectionUrl: string, documentType: string): Promise<void> {
    logger.info(`Scraping ONE ${documentType} section`, { url: sectionUrl });

    try {
      const html = await this.fetchHtml(sectionUrl);
      const $ = this.parseHtml(html);

      // Find PDF and document links
      const documentLinks: string[] = [];

      $('a[href$=".pdf"], a[href*="documento"], a.download-link').each((_, elem) => {
        const href = $(elem).attr('href');
        if (href) {
          const fullUrl = href.startsWith('http') ? href : `${this.sourceConfig.url}${href}`;
          if (!documentLinks.includes(fullUrl)) {
            documentLinks.push(fullUrl);
          }
        }
      });

      for (const link of documentLinks.slice(0, 30)) {
        if (link.endsWith('.pdf')) {
          await this.downloadAndProcessPDF(link, documentType);
        } else {
          // Try to find PDFs in the linked page
          await this.scrapePage(link, documentType);
        }
      }

      await this.sleep(this.sourceConfig.rateLimitMs);
    } catch (error: any) {
      logger.warn(`Failed to scrape ONE ${documentType} section`, { sectionUrl, error: error.message });
    }
  }

  /**
   * Scrape a page for PDF documents
   */
  private async scrapePage(pageUrl: string, documentType: string): Promise<void> {
    try {
      const html = await this.fetchHtml(pageUrl);
      const $ = this.parseHtml(html);

      // Find PDF links
      $('a[href$=".pdf"]').each(async (_, elem) => {
        const href = $(elem).attr('href');
        if (href) {
          const pdfUrl = href.startsWith('http') ? href : `${this.sourceConfig.url}${href}`;
          await this.downloadAndProcessPDF(pdfUrl, documentType);
        }
      });

      await this.sleep(this.sourceConfig.rateLimitMs);
    } catch (error: any) {
      logger.warn('Failed to scrape ONE page', { pageUrl, error: error.message });
    }
  }

  /**
   * Download and process a PDF document
   */
  private async downloadAndProcessPDF(pdfUrl: string, documentType: string): Promise<void> {
    try {
      // Extract title from URL
      const urlParts = pdfUrl.split('/');
      const filename = urlParts[urlParts.length - 1];
      const title = this.cleanTitle(
        decodeURIComponent(filename.replace('.pdf', '').replace(/-|_/g, ' '))
      );

      // Extract year from URL or filename
      const year = this.extractYear(pdfUrl) || new Date().getFullYear();

      const documentInfo: DocumentInfo = {
        url: pdfUrl,
        title: title || `ONE ${documentType}`,
        authors: ['Oficina Nacional de Estadística (ONE)'],
        year,
        format: 'pdf',
      };

      this.stats.documentsFound++;

      // Download and process
      const buffer = await this.downloadFile(pdfUrl, documentInfo);
      if (buffer) {
        await this.processAndSaveDocument(buffer, pdfUrl, documentInfo);
      }

      await this.sleep(this.sourceConfig.rateLimitMs);
    } catch (error: any) {
      logger.error('Failed to download ONE PDF', { pdfUrl, error: error.message });
      this.stats.documentsFailed++;
    }
  }
}

export default ONEScraper;
