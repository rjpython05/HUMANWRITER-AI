import { BaseScraper, DocumentInfo } from '../base.scraper';
import { SourceConfig, getSourceById } from '../../config/sources.config';
import logger from '../../utils/logger';

/**
 * Government Ministries Scraper
 * Scrapes publications from Dominican Republic government ministries
 */
export class MinisteriosScraper extends BaseScraper {
  private readonly ministries = [
    {
      name: 'Ministerio de Educación',
      url: 'https://www.ministeriodeeducacion.gob.do',
      paths: ['/publicaciones', '/documentos', '/investigaciones'],
    },
    {
      name: 'Ministerio de Salud Pública',
      url: 'https://www.msp.gob.do',
      paths: ['/publicaciones', '/documentos', '/estadisticas'],
    },
    {
      name: 'Ministerio de Agricultura',
      url: 'https://agricultura.gob.do',
      paths: ['/publicaciones', '/documentos', '/estudios'],
    },
    {
      name: 'Ministerio de Economía',
      url: 'https://www.economia.gob.do',
      paths: ['/publicaciones', '/estadisticas', '/informes'],
    },
    {
      name: 'Ministerio de Medio Ambiente',
      url: 'https://ambiente.gob.do',
      paths: ['/publicaciones', '/documentos', '/informes'],
    },
  ];

  constructor() {
    const config = getSourceById('ministerios');
    if (!config) {
      throw new Error('Ministerios source configuration not found');
    }
    super(config);
  }

  async scrape(): Promise<void> {
    logger.info('Starting Ministerios scraper', { url: this.sourceConfig.url });

    try {
      // Scrape each ministry
      for (const ministry of this.ministries) {
        await this.scrapeMinistry(ministry);
      }
    } catch (error: any) {
      logger.error('Ministerios scraper failed', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Scrape a single ministry
   */
  private async scrapeMinistry(ministry: { name: string; url: string; paths: string[] }): Promise<void> {
    logger.info(`Scraping ${ministry.name}`, { url: ministry.url });

    for (const path of ministry.paths) {
      const fullUrl = `${ministry.url}${path}`;

      try {
        await this.scrapeMinistrySection(fullUrl, ministry.name);
      } catch (error: any) {
        logger.warn(`Failed to scrape ${ministry.name} section`, {
          url: fullUrl,
          error: error.message,
        });
      }

      await this.sleep(this.sourceConfig.rateLimitMs);
    }
  }

  /**
   * Scrape a ministry section
   */
  private async scrapeMinistrySection(sectionUrl: string, ministryName: string): Promise<void> {
    try {
      const html = await this.fetchHtml(sectionUrl);
      const $ = this.parseHtml(html);

      // Find document links
      const documentLinks: string[] = [];

      $('a[href$=".pdf"], a[href$=".docx"], a[href$=".doc"], a.download, a[download]').each((_, elem) => {
        const href = $(elem).attr('href');
        if (href) {
          const baseUrl = new URL(sectionUrl).origin;
          const fullUrl = href.startsWith('http') ? href : `${baseUrl}${href}`;
          if (!documentLinks.includes(fullUrl)) {
            documentLinks.push(fullUrl);
          }
        }
      });

      // Also look for publication links
      $('a[href*="publicacion"], a[href*="documento"]').each((_, elem) => {
        const href = $(elem).attr('href');
        if (href && !href.endsWith('.pdf') && !href.endsWith('.docx')) {
          const baseUrl = new URL(sectionUrl).origin;
          const fullUrl = href.startsWith('http') ? href : `${baseUrl}${href}`;
          if (!documentLinks.includes(fullUrl)) {
            documentLinks.push(fullUrl);
          }
        }
      });

      for (const link of documentLinks.slice(0, 20)) {
        if (link.endsWith('.pdf') || link.endsWith('.docx') || link.endsWith('.doc')) {
          await this.downloadAndProcessDocument(link, ministryName);
        } else {
          // Try to find documents in the linked page
          await this.scrapePage(link, ministryName);
        }
      }

      await this.sleep(this.sourceConfig.rateLimitMs);
    } catch (error: any) {
      logger.warn('Failed to scrape ministry section', { sectionUrl, ministryName, error: error.message });
    }
  }

  /**
   * Scrape a page for documents
   */
  private async scrapePage(pageUrl: string, ministryName: string): Promise<void> {
    try {
      const html = await this.fetchHtml(pageUrl);
      const $ = this.parseHtml(html);

      // Find document links
      $('a[href$=".pdf"], a[href$=".docx"], a[href$=".doc"]').each(async (_, elem) => {
        const href = $(elem).attr('href');
        if (href) {
          const baseUrl = new URL(pageUrl).origin;
          const fullUrl = href.startsWith('http') ? href : `${baseUrl}${href}`;
          await this.downloadAndProcessDocument(fullUrl, ministryName);
        }
      });

      await this.sleep(this.sourceConfig.rateLimitMs);
    } catch (error: any) {
      logger.warn('Failed to scrape ministry page', { pageUrl, error: error.message });
    }
  }

  /**
   * Download and process a document
   */
  private async downloadAndProcessDocument(documentUrl: string, ministryName: string): Promise<void> {
    try {
      // Extract title from URL
      const urlParts = documentUrl.split('/');
      const filename = urlParts[urlParts.length - 1];
      const extension = filename.substring(filename.lastIndexOf('.'));
      const title = this.cleanTitle(
        decodeURIComponent(filename.replace(extension, '').replace(/-|_/g, ' '))
      );

      // Extract year from URL or filename
      const year = this.extractYear(documentUrl) || new Date().getFullYear();

      const documentInfo: DocumentInfo = {
        url: documentUrl,
        title: title || `${ministryName} Publication`,
        authors: [ministryName],
        year,
        format: extension.replace('.', ''),
      };

      this.stats.documentsFound++;

      // Download and process
      const buffer = await this.downloadFile(documentUrl, documentInfo);
      if (buffer) {
        await this.processAndSaveDocument(buffer, documentUrl, documentInfo);
      }

      await this.sleep(this.sourceConfig.rateLimitMs);
    } catch (error: any) {
      logger.error('Failed to download ministry document', { documentUrl, error: error.message });
      this.stats.documentsFailed++;
    }
  }
}

export default MinisteriosScraper;
