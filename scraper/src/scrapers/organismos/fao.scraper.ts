import { BaseScraper, DocumentInfo } from '../base.scraper';
import { SourceConfig, getSourceById } from '../../config/sources.config';
import logger from '../../utils/logger';

/**
 * FAO (Food and Agriculture Organization) Scraper
 * Scrapes agriculture and food documents from fao.org
 * Filters by Dominican Republic
 */
export class FAOScraper extends BaseScraper {
  constructor() {
    const config = getSourceById('fao');
    if (!config) {
      throw new Error('FAO source configuration not found');
    }
    super(config);
  }

  async scrape(): Promise<void> {
    logger.info('Starting FAO scraper', { url: this.sourceConfig.url });

    try {
      // Search for Dominican Republic publications
      await this.scrapeByCountry('Dominican Republic');
      await this.scrapeByCountry('República Dominicana');
    } catch (error: any) {
      logger.error('FAO scraper failed', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Scrape publications filtered by country
   */
  private async scrapeByCountry(country: string): Promise<void> {
    logger.info(`Searching FAO for ${country}`, { country });

    try {
      // FAO document search URL
      const searchUrl = `${this.sourceConfig.url}/search/en/?q=${encodeURIComponent(country)}`;

      let page = 0;
      const maxPages = this.sourceConfig.maxPages || 50;

      while (page < maxPages) {
        const pageUrl = `${searchUrl}&page=${page}`;

        try {
          const html = await this.fetchHtml(pageUrl);
          const $ = this.parseHtml(html);

          // Find document items
          const items = $('div.result-item, div.document-item, article.search-result');

          if (items.length === 0) {
            logger.info('No more items found in FAO search', { page, country });
            break;
          }

          // Process each item
          for (let i = 0; i < items.length; i++) {
            const item = items.eq(i);
            const itemLink = item.find('a[href*="/documents/"]').first();

            if (itemLink.length > 0) {
              const itemUrl = itemLink.attr('href');
              if (itemUrl) {
                const fullItemUrl = itemUrl.startsWith('http') ? itemUrl : `https://www.fao.org${itemUrl}`;
                await this.scrapeItem(fullItemUrl);
              }
            }
          }

          page++;
          await this.sleep(this.sourceConfig.rateLimitMs);
        } catch (error: any) {
          logger.warn('Failed to fetch FAO search page', { pageUrl, error: error.message });
          break;
        }
      }
    } catch (error: any) {
      logger.error('Failed to search FAO by country', { country, error: error.message });
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
        $('h1.document-title, h1, meta[property="og:title"]').first().text() ||
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

      // If no authors found, use FAO
      if (authors.length === 0) {
        authors.push('FAO');
      }

      // Extract year
      const yearText = $('span.publication-year, span.year, time').first().text() ||
                      $('meta[name="citation_publication_date"]').attr('content');
      const year = this.extractYear(yearText || '') || new Date().getFullYear();

      // Find PDF download link
      const pdfLink = $('a[href$=".pdf"], a.download-pdf, a.btn-download[href*=".pdf"]').first().attr('href');

      if (!pdfLink) {
        logger.warn('No PDF found for FAO item', { itemUrl, title });
        this.stats.documentsSkipped++;
        return;
      }

      const pdfUrl = pdfLink.startsWith('http') ? pdfLink : `https://www.fao.org${pdfLink}`;

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
      logger.error('Failed to scrape FAO item', { itemUrl, error: error.message });
      this.stats.documentsFailed++;
    }
  }
}

export default FAOScraper;
