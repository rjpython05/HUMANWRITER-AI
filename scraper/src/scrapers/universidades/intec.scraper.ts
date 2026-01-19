import { BaseScraper, DocumentInfo } from '../base.scraper';
import { SourceConfig, getSourceById } from '../../config/sources.config';
import logger from '../../utils/logger';

/**
 * INTEC Library Scraper
 * Scrapes digital library from biblioteca.intec.edu.do
 */
export class INTECScraper extends BaseScraper {
  constructor() {
    const config = getSourceById('intec');
    if (!config) {
      throw new Error('INTEC source configuration not found');
    }
    super(config);
  }

  async scrape(): Promise<void> {
    logger.info('Starting INTEC scraper', { url: this.sourceConfig.url });

    try {
      // INTEC may use a different repository system
      // Try to discover the structure
      await this.scrapeMainPage();
    } catch (error: any) {
      logger.error('INTEC scraper failed', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Scrape main page and discover structure
   */
  private async scrapeMainPage(): Promise<void> {
    try {
      const baseUrl = this.sourceConfig.url;
      const html = await this.fetchHtml(baseUrl);
      const $ = this.parseHtml(html);

      // Look for repository links
      const repositoryLinks: string[] = [];

      $('a[href*="repositorio"], a[href*="tesis"], a[href*="documentos"], a[href*="/handle/"]').each((_, elem) => {
        const href = $(elem).attr('href');
        if (href) {
          const fullUrl = href.startsWith('http') ? href : `${baseUrl}${href}`;
          if (!repositoryLinks.includes(fullUrl)) {
            repositoryLinks.push(fullUrl);
          }
        }
      });

      // If no specific links found, try common paths
      if (repositoryLinks.length === 0) {
        repositoryLinks.push(
          `${baseUrl}/handle/123456789/1`,
          `${baseUrl}/tesis`,
          `${baseUrl}/documentos`,
          `${baseUrl}/community-list`
        );
      }

      for (const link of repositoryLinks.slice(0, 10)) {
        try {
          await this.scrapeRepository(link);
        } catch (error: any) {
          logger.warn('Failed to scrape INTEC repository link', { link, error: error.message });
        }
      }
    } catch (error: any) {
      logger.error('Failed to scrape INTEC main page', { error: error.message });
    }
  }

  /**
   * Scrape repository section
   */
  private async scrapeRepository(repositoryUrl: string): Promise<void> {
    logger.info('Scraping INTEC repository', { url: repositoryUrl });

    try {
      let page = 0;
      const maxPages = this.sourceConfig.maxPages || 30;

      while (page < maxPages) {
        const pageUrl = `${repositoryUrl}${repositoryUrl.includes('?') ? '&' : '?'}offset=${page * 20}`;

        try {
          const html = await this.fetchHtml(pageUrl);
          const $ = this.parseHtml(html);

          // Find document items
          const items = $('div.artifact-description, div.item, tr.ds-table-row, li.document-item');

          if (items.length === 0) {
            logger.info('No more items found in INTEC repository', { page, repositoryUrl });
            break;
          }

          // Process each item
          for (let i = 0; i < items.length; i++) {
            const item = items.eq(i);
            const itemLink = item.find('a[href*="/handle/"], a[href*="/item/"]').first();

            if (itemLink.length > 0) {
              const itemUrl = itemLink.attr('href');
              if (itemUrl) {
                const fullItemUrl = itemUrl.startsWith('http') ? itemUrl : `${this.sourceConfig.url}${itemUrl}`;
                await this.scrapeItem(fullItemUrl);
              }
            }
          }

          page++;
          await this.sleep(this.sourceConfig.rateLimitMs);
        } catch (error: any) {
          logger.warn('Failed to fetch INTEC page', { pageUrl, error: error.message });
          break;
        }
      }
    } catch (error: any) {
      logger.error('Failed to scrape INTEC repository', { repositoryUrl, error: error.message });
    }
  }

  /**
   * Scrape a single document item
   */
  private async scrapeItem(itemUrl: string): Promise<void> {
    try {
      const html = await this.fetchHtml(itemUrl);
      const $ = this.parseHtml(html);

      // Extract title
      const title = this.cleanTitle(
        $('h1, h2.item-title, meta[name="DC.title"]').first().text() ||
        $('meta[name="DC.title"]').attr('content') ||
        'Untitled'
      );

      // Extract authors
      const authors: string[] = [];
      $('meta[name="DC.creator"], meta[name="author"]').each((_, elem) => {
        const author = $(elem).attr('content');
        if (author) {
          authors.push(this.cleanAuthorName(author));
        }
      });

      // Extract year
      const yearText = $('meta[name="DC.date"]').attr('content') ||
                      $('span.date, div.date').first().text();
      const year = this.extractYear(yearText || '') || new Date().getFullYear();

      // Find PDF download link
      const pdfLink = $('a[href$=".pdf"], a.download-link, a[href*="bitstream"]').first().attr('href');

      if (!pdfLink) {
        logger.warn('No PDF found for INTEC item', { itemUrl, title });
        this.stats.documentsSkipped++;
        return;
      }

      const pdfUrl = pdfLink.startsWith('http') ? pdfLink : `${this.sourceConfig.url}${pdfLink}`;

      const documentInfo: DocumentInfo = {
        url: pdfUrl,
        title,
        authors,
        year,
        format: 'pdf',
      };

      this.stats.documentsFound++;

      // Download and process PDF
      const buffer = await this.downloadFile(pdfUrl, documentInfo);
      if (buffer) {
        await this.processAndSaveDocument(buffer, pdfUrl, documentInfo);
      }

      await this.sleep(this.sourceConfig.rateLimitMs);
    } catch (error: any) {
      logger.error('Failed to scrape INTEC item', { itemUrl, error: error.message });
      this.stats.documentsFailed++;
    }
  }
}

export default INTECScraper;
