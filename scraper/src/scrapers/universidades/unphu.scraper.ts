import { BaseScraper, DocumentInfo } from '../base.scraper';
import { SourceConfig, getSourceById } from '../../config/sources.config';
import logger from '../../utils/logger';

/**
 * UNPHU Repository Scraper
 * Scrapes institutional repository from repositorio.unphu.edu.do
 */
export class UNPHUScraper extends BaseScraper {
  constructor() {
    const config = getSourceById('unphu');
    if (!config) {
      throw new Error('UNPHU source configuration not found');
    }
    super(config);
  }

  async scrape(): Promise<void> {
    logger.info('Starting UNPHU scraper', { url: this.sourceConfig.url });

    try {
      // UNPHU uses DSpace repository
      const collections = await this.discoverCollections();

      for (const collectionUrl of collections) {
        await this.scrapeCollection(collectionUrl);
      }
    } catch (error: any) {
      logger.error('UNPHU scraper failed', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Discover all collections in the repository
   */
  private async discoverCollections(): Promise<string[]> {
    const collections: string[] = [];
    const baseUrl = this.sourceConfig.url;

    try {
      const html = await this.fetchHtml(`${baseUrl}/community-list`);
      const $ = this.parseHtml(html);

      // Extract collection URLs
      $('a[href*="/handle/"]').each((_, elem) => {
        const href = $(elem).attr('href');
        if (href && href.includes('/handle/')) {
          const fullUrl = href.startsWith('http') ? href : `${baseUrl}${href}`;
          if (!collections.includes(fullUrl)) {
            collections.push(fullUrl);
          }
        }
      });

      logger.info(`Found ${collections.length} collections in UNPHU`, { count: collections.length });
      return collections.slice(0, 20);
    } catch (error: any) {
      logger.error('Failed to discover UNPHU collections', { error: error.message });
      return [];
    }
  }

  /**
   * Scrape a single collection
   */
  private async scrapeCollection(collectionUrl: string): Promise<void> {
    logger.info('Scraping UNPHU collection', { url: collectionUrl });

    try {
      let page = 0;
      const maxPages = this.sourceConfig.maxPages || 50;

      while (page < maxPages) {
        const pageUrl = `${collectionUrl}?offset=${page * 20}`;
        const html = await this.fetchHtml(pageUrl);
        const $ = this.parseHtml(html);

        // Find document items
        const items = $('div.artifact-description, div.artifact-title, tr.ds-table-row');

        if (items.length === 0) {
          logger.info('No more items found in UNPHU collection', { page, collectionUrl });
          break;
        }

        // Process each item
        for (let i = 0; i < items.length; i++) {
          const item = items.eq(i);
          const itemLink = item.find('a[href*="/handle/"]').first();

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
      }
    } catch (error: any) {
      logger.error('Failed to scrape UNPHU collection', { collectionUrl, error: error.message });
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
        $('h1.page-header, h2.item-title, meta[name="DC.title"]').first().text() ||
        $('meta[name="DC.title"]').attr('content') ||
        'Untitled'
      );

      // Extract authors
      const authors: string[] = [];
      $('meta[name="DC.creator"], meta[name="DC.contributor.author"]').each((_, elem) => {
        const author = $(elem).attr('content');
        if (author) {
          authors.push(this.cleanAuthorName(author));
        }
      });

      // Extract year
      const yearText = $('meta[name="DC.date"], meta[name="DC.date.issued"]').attr('content') ||
                      $('span.date').first().text();
      const year = this.extractYear(yearText || '') || new Date().getFullYear();

      // Find PDF download link
      const pdfLink = $('a[href$=".pdf"], a.btn-primary[href*="bitstream"]').first().attr('href');

      if (!pdfLink) {
        logger.warn('No PDF found for UNPHU item', { itemUrl, title });
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
      logger.error('Failed to scrape UNPHU item', { itemUrl, error: error.message });
      this.stats.documentsFailed++;
    }
  }
}

export default UNPHUScraper;
