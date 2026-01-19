import { BaseScraper, DocumentInfo } from '../base.scraper';
import { SourceConfig, getSourceById } from '../../config/sources.config';
import logger from '../../utils/logger';

/**
 * Banco Central Scraper
 * Scrapes economic publications from bancentral.gov.do
 */
export class BCRDScraper extends BaseScraper {
  constructor() {
    const config = getSourceById('bcrd');
    if (!config) {
      throw new Error('BCRD source configuration not found');
    }
    super(config);
  }

  async scrape(): Promise<void> {
    logger.info('Starting BCRD scraper', { url: this.sourceConfig.url });

    try {
      // Scrape publications sections
      await this.scrapePublications();
      await this.scrapeEconomicReports();
      await this.scrapeStatistics();
    } catch (error: any) {
      logger.error('BCRD scraper failed', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Scrape general publications section
   */
  private async scrapePublications(): Promise<void> {
    const publicationsUrl = `${this.sourceConfig.url}/publicaciones`;

    try {
      const html = await this.fetchHtml(publicationsUrl);
      const $ = this.parseHtml(html);

      // Find publication links
      const publicationLinks: string[] = [];

      $('a[href*=".pdf"], a[href*="/publicaciones/"], a.publication-link').each((_, elem) => {
        const href = $(elem).attr('href');
        if (href) {
          const fullUrl = href.startsWith('http') ? href : `${this.sourceConfig.url}${href}`;
          if (!publicationLinks.includes(fullUrl)) {
            publicationLinks.push(fullUrl);
          }
        }
      });

      for (const link of publicationLinks.slice(0, 50)) {
        if (link.endsWith('.pdf')) {
          await this.downloadAndProcessPDF(link);
        } else {
          await this.scrapePage(link);
        }
      }
    } catch (error: any) {
      logger.warn('Failed to scrape BCRD publications', { error: error.message });
    }
  }

  /**
   * Scrape economic reports
   */
  private async scrapeEconomicReports(): Promise<void> {
    const reportsUrls = [
      `${this.sourceConfig.url}/informes-economicos`,
      `${this.sourceConfig.url}/estadisticas/sector-real`,
      `${this.sourceConfig.url}/estadisticas/sector-externo`,
      `${this.sourceConfig.url}/estadisticas/sector-monetario-financiero`,
    ];

    for (const url of reportsUrls) {
      try {
        const html = await this.fetchHtml(url);
        const $ = this.parseHtml(html);

        // Find PDF links
        $('a[href$=".pdf"]').each(async (_, elem) => {
          const href = $(elem).attr('href');
          if (href) {
            const pdfUrl = href.startsWith('http') ? href : `${this.sourceConfig.url}${href}`;
            await this.downloadAndProcessPDF(pdfUrl);
          }
        });

        await this.sleep(this.sourceConfig.rateLimitMs);
      } catch (error: any) {
        logger.warn('Failed to scrape BCRD reports section', { url, error: error.message });
      }
    }
  }

  /**
   * Scrape statistics publications
   */
  private async scrapeStatistics(): Promise<void> {
    const statsUrl = `${this.sourceConfig.url}/estadisticas/publicaciones`;

    try {
      const html = await this.fetchHtml(statsUrl);
      const $ = this.parseHtml(html);

      // Find document links
      $('a[href$=".pdf"], a[href*="documento"]').each(async (_, elem) => {
        const href = $(elem).attr('href');
        if (href) {
          const fullUrl = href.startsWith('http') ? href : `${this.sourceConfig.url}${href}`;
          if (fullUrl.endsWith('.pdf')) {
            await this.downloadAndProcessPDF(fullUrl);
          }
        }
      });
    } catch (error: any) {
      logger.warn('Failed to scrape BCRD statistics', { error: error.message });
    }
  }

  /**
   * Scrape a page for documents
   */
  private async scrapePage(pageUrl: string): Promise<void> {
    try {
      const html = await this.fetchHtml(pageUrl);
      const $ = this.parseHtml(html);

      // Find PDF links on this page
      $('a[href$=".pdf"]').each(async (_, elem) => {
        const href = $(elem).attr('href');
        if (href) {
          const pdfUrl = href.startsWith('http') ? href : `${this.sourceConfig.url}${href}`;
          await this.downloadAndProcessPDF(pdfUrl);
        }
      });

      await this.sleep(this.sourceConfig.rateLimitMs);
    } catch (error: any) {
      logger.warn('Failed to scrape BCRD page', { pageUrl, error: error.message });
    }
  }

  /**
   * Download and process a PDF document
   */
  private async downloadAndProcessPDF(pdfUrl: string): Promise<void> {
    try {
      // Extract title from URL or page context
      const urlParts = pdfUrl.split('/');
      const filename = urlParts[urlParts.length - 1];
      const title = this.cleanTitle(decodeURIComponent(filename.replace('.pdf', '').replace(/-|_/g, ' ')));

      // Determine year from URL or filename
      const year = this.extractYear(pdfUrl) || new Date().getFullYear();

      const documentInfo: DocumentInfo = {
        url: pdfUrl,
        title: title || 'BCRD Publication',
        authors: ['Banco Central de la República Dominicana'],
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
      logger.error('Failed to download BCRD PDF', { pdfUrl, error: error.message });
      this.stats.documentsFailed++;
    }
  }
}

export default BCRDScraper;
