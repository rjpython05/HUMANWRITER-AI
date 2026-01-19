import { BaseScraper, DocumentInfo } from '../base.scraper';
import { SourceConfig, getSourceById } from '../../config/sources.config';
import logger from '../../utils/logger';

/**
 * Latindex Scraper
 * Scrapes academic journals from latindex.org
 * Filters by Dominican Republic
 */
export class LatindexScraper extends BaseScraper {
  constructor() {
    const config = getSourceById('latindex');
    if (!config) {
      throw new Error('Latindex source configuration not found');
    }
    super(config);
  }

  async scrape(): Promise<void> {
    logger.info('Starting Latindex scraper', { url: this.sourceConfig.url });

    try {
      // Search for Dominican Republic journals
      await this.scrapeDominicanJournals();
    } catch (error: any) {
      logger.error('Latindex scraper failed', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Scrape Dominican Republic journals
   */
  private async scrapeDominicanJournals(): Promise<void> {
    logger.info('Searching Latindex for Dominican Republic journals');

    try {
      // Latindex catalog URL for Dominican Republic
      const catalogUrl = `${this.sourceConfig.url}/latindex/ficha?folio=0`;

      // Try to find Dominican journals
      const searchUrl = `${this.sourceConfig.url}/latindex/buscador/resBus.html?opcion=2&paisRevista=52`; // 52 = Dominican Republic

      try {
        const html = await this.fetchHtml(searchUrl);
        const $ = this.parseHtml(html);

        // Find journal links
        const journalLinks: string[] = [];

        $('a[href*="ficha"], a[href*="revista"]').each((_, elem) => {
          const href = $(elem).attr('href');
          if (href) {
            const fullUrl = href.startsWith('http') ? href : `${this.sourceConfig.url}${href}`;
            if (!journalLinks.includes(fullUrl)) {
              journalLinks.push(fullUrl);
            }
          }
        });

        for (const journalUrl of journalLinks.slice(0, 50)) {
          await this.scrapeJournal(journalUrl);
        }
      } catch (error: any) {
        logger.warn('Failed to search Latindex journals', { error: error.message });
      }

      await this.sleep(this.sourceConfig.rateLimitMs);
    } catch (error: any) {
      logger.error('Failed to scrape Latindex Dominican journals', { error: error.message });
    }
  }

  /**
   * Scrape a single journal
   */
  private async scrapeJournal(journalUrl: string): Promise<void> {
    logger.info('Scraping Latindex journal', { url: journalUrl });

    try {
      const html = await this.fetchHtml(journalUrl);
      const $ = this.parseHtml(html);

      // Extract journal name
      const journalName = this.cleanTitle(
        $('h1, h2.journal-title').first().text() || 'Unknown Journal'
      );

      // Find article/issue links
      const articleLinks: string[] = [];

      $('a[href*="articulo"], a[href*="article"], a[href$=".pdf"]').each((_, elem) => {
        const href = $(elem).attr('href');
        if (href) {
          if (href.endsWith('.pdf')) {
            const fullUrl = href.startsWith('http') ? href : `${this.sourceConfig.url}${href}`;
            if (!articleLinks.includes(fullUrl)) {
              articleLinks.push(fullUrl);
            }
          }
        }
      });

      // Process PDF articles
      for (const pdfUrl of articleLinks.slice(0, 20)) {
        await this.downloadAndProcessPDF(pdfUrl, journalName);
      }

      await this.sleep(this.sourceConfig.rateLimitMs);
    } catch (error: any) {
      logger.warn('Failed to scrape Latindex journal', { journalUrl, error: error.message });
    }
  }

  /**
   * Download and process a PDF article
   */
  private async downloadAndProcessPDF(pdfUrl: string, journalName: string): Promise<void> {
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
        title: title || `Article from ${journalName}`,
        authors: [],
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
      logger.error('Failed to download Latindex PDF', { pdfUrl, error: error.message });
      this.stats.documentsFailed++;
    }
  }
}

export default LatindexScraper;
