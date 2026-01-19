import { BaseScraper, DocumentInfo } from '../base.scraper';
import { SourceConfig, getSourceById } from '../../config/sources.config';
import logger from '../../utils/logger';

/**
 * BID (Inter-American Development Bank) Scraper
 * Scrapes publications from publications.iadb.org
 * Filters by Dominican Republic
 */
export class BIDScraper extends BaseScraper {
  constructor() {
    const config = getSourceById('bid');
    if (!config) {
      throw new Error('BID source configuration not found');
    }
    super(config);
  }

  async scrape(): Promise<void> {
    logger.info('Starting BID scraper', { url: this.sourceConfig.url });

    try {
      // Search for Dominican Republic publications
      await this.scrapeByCountry('Dominican Republic');
      await this.scrapeByCountry('República Dominicana');
    } catch (error: any) {
      logger.error('BID scraper failed', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Scrape publications filtered by country
   */
  private async scrapeByCountry(country: string): Promise<void> {
    logger.info(`Searching BID for ${country}`, { country });

    try {
      // BID search URL
      const searchUrl = `${this.sourceConfig.url}/en/search?query=${encodeURIComponent(country)}`;

      let page = 0;
      const maxPages = this.sourceConfig.maxPages || 75;

      while (page < maxPages) {
        const pageUrl = `${searchUrl}&page=${page}`;

        try {
          const html = await this.fetchHtml(pageUrl);
          const $ = this.parseHtml(html);

          // Find publication items
          const items = $('div.search-result, div.publication-item, article.result-item');

          if (items.length === 0) {
            logger.info('No more items found in BID search', { page, country });
            break;
          }

          // Process each item
          for (let i = 0; i < items.length; i++) {
            const item = items.eq(i);
            const itemLink = item.find('a[href*="/publications/"], h3 a, h2 a').first();

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
          logger.warn('Failed to fetch BID search page', { pageUrl, error: error.message });
          break;
        }
      }
    } catch (error: any) {
      logger.error('Failed to search BID by country', { country, error: error.message });
    }
  }

  /**
   * Scrape a single publication item
   */
  private async scrapeItem(itemUrl: string): Promise<void> {
    try {
      const html = await this.fetchHtml(itemUrl);
      const $ = this.parseHtml(html);

      // Extract title
      const title = this.cleanTitle(
        $('h1.publication-title, h1, meta[property="og:title"]').first().text() ||
        $('meta[property="og:title"]').attr('content') ||
        'Untitled'
      );

      // Extract authors
      const authors: string[] = [];
      $('span.author, div.author, meta[name="author"]').each((_, elem) => {
        const author = $(elem).text().trim() || $(elem).attr('content');
        if (author) {
          authors.push(this.cleanAuthorName(author));
        }
      });

      // If no authors found, use BID
      if (authors.length === 0) {
        authors.push('Inter-American Development Bank');
      }

      // Extract year
      const yearText = $('span.publication-date, span.date, meta[name="publication_date"]').first().text() ||
                      $('meta[name="publication_date"]').attr('content');
      const year = this.extractYear(yearText || '') || new Date().getFullYear();

      // Find PDF download link
      const pdfLink = $('a[href$=".pdf"], a.download-pdf, a.btn-download[href*=".pdf"]').first().attr('href');

      if (!pdfLink) {
        logger.warn('No PDF found for BID item', { itemUrl, title });
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
      logger.error('Failed to scrape BID item', { itemUrl, error: error.message });
      this.stats.documentsFailed++;
    }
  }
}

export default BIDScraper;
