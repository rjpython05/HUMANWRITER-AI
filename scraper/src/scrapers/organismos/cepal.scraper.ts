import { BaseScraper, DocumentInfo } from '../base.scraper';
import { SourceConfig, getSourceById } from '../../config/sources.config';
import logger from '../../utils/logger';

/**
 * CEPAL Repository Scraper
 * Scrapes economic and social studies from repositorio.cepal.org
 * Filters by Dominican Republic
 */
export class CEPALScraper extends BaseScraper {
  constructor() {
    const config = getSourceById('cepal');
    if (!config) {
      throw new Error('CEPAL source configuration not found');
    }
    super(config);
  }

  async scrape(): Promise<void> {
    logger.info('Starting CEPAL scraper', { url: this.sourceConfig.url });

    try {
      // Search for Dominican Republic publications
      await this.scrapeByCountry('República Dominicana');
      await this.scrapeByCountry('Dominican Republic');
    } catch (error: any) {
      logger.error('CEPAL scraper failed', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Scrape publications filtered by country
   */
  private async scrapeByCountry(country: string): Promise<void> {
    logger.info(`Searching CEPAL for ${country}`, { country });

    try {
      // CEPAL repository search URL
      const searchUrl = `${this.sourceConfig.url}/discover?filtertype=country&filter_relational_operator=equals&filter=${encodeURIComponent(country)}`;

      let page = 0;
      const maxPages = this.sourceConfig.maxPages || 100;

      while (page < maxPages) {
        const pageUrl = `${searchUrl}&page=${page}`;

        try {
          const html = await this.fetchHtml(pageUrl);
          const $ = this.parseHtml(html);

          // Find publication items
          const items = $('div.artifact-description, div.discovery-result-results div.row');

          if (items.length === 0) {
            logger.info('No more items found in CEPAL search', { page, country });
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
        } catch (error: any) {
          logger.warn('Failed to fetch CEPAL search page', { pageUrl, error: error.message });
          break;
        }
      }
    } catch (error: any) {
      logger.error('Failed to search CEPAL by country', { country, error: error.message });
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
        $('h1, h2.page-header, meta[name="DC.title"]').first().text() ||
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

      // If no authors found, use CEPAL
      if (authors.length === 0) {
        authors.push('CEPAL');
      }

      // Extract year
      const yearText = $('meta[name="DC.date"], meta[name="DC.date.issued"]').attr('content') ||
                      $('span.date').first().text();
      const year = this.extractYear(yearText || '') || new Date().getFullYear();

      // Find PDF download link
      const pdfLink = $('a[href$=".pdf"], a.btn-primary[href*="bitstream"]').first().attr('href');

      if (!pdfLink) {
        logger.warn('No PDF found for CEPAL item', { itemUrl, title });
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
      logger.error('Failed to scrape CEPAL item', { itemUrl, error: error.message });
      this.stats.documentsFailed++;
    }
  }
}

export default CEPALScraper;
