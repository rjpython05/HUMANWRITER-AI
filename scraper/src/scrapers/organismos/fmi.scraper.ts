import { BaseScraper, DocumentInfo } from '../base.scraper';
import { SourceConfig, getSourceById } from '../../config/sources.config';
import logger from '../../utils/logger';

/**
 * IMF (International Monetary Fund) Scraper
 * Scrapes economic and fiscal reports from imf.org
 * Filters by Dominican Republic
 */
export class FMIScraper extends BaseScraper {
  constructor() {
    const config = getSourceById('fmi');
    if (!config) {
      throw new Error('FMI source configuration not found');
    }
    super(config);
  }

  async scrape(): Promise<void> {
    logger.info('Starting IMF scraper', { url: this.sourceConfig.url });

    try {
      // Search for Dominican Republic publications
      await this.scrapeByCountry('Dominican Republic');
    } catch (error: any) {
      logger.error('IMF scraper failed', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Scrape publications filtered by country
   */
  private async scrapeByCountry(country: string): Promise<void> {
    logger.info(`Searching IMF for ${country}`, { country });

    try {
      // IMF publications search URL
      const searchUrl = `${this.sourceConfig.url}/Search?query=${encodeURIComponent(country)}`;

      let page = 0;
      const maxPages = this.sourceConfig.maxPages || 50;

      while (page < maxPages) {
        const pageUrl = `${searchUrl}&page=${page}`;

        try {
          const html = await this.fetchHtml(pageUrl);
          const $ = this.parseHtml(html);

          // Find publication items
          const items = $('div.publication-item, div.search-result, article.publication');

          if (items.length === 0) {
            logger.info('No more items found in IMF search', { page, country });
            break;
          }

          // Process each item
          for (let i = 0; i < items.length; i++) {
            const item = items.eq(i);
            const itemLink = item.find('a[href*="/Publications/"]').first();

            if (itemLink.length > 0) {
              const itemUrl = itemLink.attr('href');
              if (itemUrl) {
                const fullItemUrl = itemUrl.startsWith('http') ? itemUrl : `https://www.imf.org${itemUrl}`;
                await this.scrapeItem(fullItemUrl);
              }
            }
          }

          page++;
          await this.sleep(this.sourceConfig.rateLimitMs);
        } catch (error: any) {
          logger.warn('Failed to fetch IMF search page', { pageUrl, error: error.message });
          break;
        }
      }
    } catch (error: any) {
      logger.error('Failed to search IMF by country', { country, error: error.message });
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
        $('h1.title, h1, meta[property="og:title"]').first().text() ||
        $('meta[property="og:title"]').attr('content') ||
        'Untitled'
      );

      // Extract authors
      const authors: string[] = [];
      $('span.author, div.authors span, meta[name="author"]').each((_, elem) => {
        const author = $(elem).text().trim() || $(elem).attr('content');
        if (author) {
          authors.push(this.cleanAuthorName(author));
        }
      });

      // If no authors found, use IMF
      if (authors.length === 0) {
        authors.push('International Monetary Fund');
      }

      // Extract year
      const yearText = $('span.publication-date, span.date, time').first().text() ||
                      $('meta[name="publication_date"]').attr('content');
      const year = this.extractYear(yearText || '') || new Date().getFullYear();

      // Find PDF download link
      const pdfLink = $('a[href$=".pdf"], a.download-link[href*=".pdf"]').first().attr('href');

      if (!pdfLink) {
        logger.warn('No PDF found for IMF item', { itemUrl, title });
        this.stats.documentsSkipped++;
        return;
      }

      const pdfUrl = pdfLink.startsWith('http') ? pdfLink : `https://www.imf.org${pdfLink}`;

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
      logger.error('Failed to scrape IMF item', { itemUrl, error: error.message });
      this.stats.documentsFailed++;
    }
  }
}

export default FMIScraper;
