import { BaseScraper, DocumentInfo } from '../base.scraper';
import { SourceConfig, getSourceById } from '../../config/sources.config';
import logger from '../../utils/logger';

/**
 * Redalyc Scraper
 * Scrapes academic articles from redalyc.org
 * Filters by Dominican Republic
 */
export class RedalycScraper extends BaseScraper {
  constructor() {
    const config = getSourceById('redalyc');
    if (!config) {
      throw new Error('Redalyc source configuration not found');
    }
    super(config);
  }

  async scrape(): Promise<void> {
    logger.info('Starting Redalyc scraper', { url: this.sourceConfig.url });

    try {
      // Search for Dominican Republic publications
      await this.searchArticles('República Dominicana');
      await this.searchArticles('Dominican Republic');
    } catch (error: any) {
      logger.error('Redalyc scraper failed', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Search for articles
   */
  private async searchArticles(query: string): Promise<void> {
    logger.info(`Searching Redalyc for ${query}`, { query });

    try {
      // Redalyc search URL
      const searchUrl = `${this.sourceConfig.url}/busqueda/search.jsp?query=${encodeURIComponent(query)}`;

      let page = 0;
      const maxPages = this.sourceConfig.maxPages || 100;

      while (page < maxPages) {
        const pageUrl = `${searchUrl}&page=${page}`;

        try {
          const html = await this.fetchHtml(pageUrl);
          const $ = this.parseHtml(html);

          // Find article items
          const items = $('div.resultado, div.result-item, article.search-result');

          if (items.length === 0) {
            logger.info('No more items found in Redalyc search', { page, query });
            break;
          }

          // Process each item
          for (let i = 0; i < items.length; i++) {
            const item = items.eq(i);
            const itemLink = item.find('a[href*="articulo.oa"], a.article-link').first();

            if (itemLink.length > 0) {
              const itemUrl = itemLink.attr('href');
              if (itemUrl) {
                const fullItemUrl = itemUrl.startsWith('http') ? itemUrl : `${this.sourceConfig.url}${itemUrl}`;
                await this.scrapeArticle(fullItemUrl);
              }
            }
          }

          page++;
          await this.sleep(this.sourceConfig.rateLimitMs);
        } catch (error: any) {
          logger.warn('Failed to fetch Redalyc search page', { pageUrl, error: error.message });
          break;
        }
      }
    } catch (error: any) {
      logger.error('Failed to search Redalyc', { query, error: error.message });
    }
  }

  /**
   * Scrape a single article
   */
  private async scrapeArticle(articleUrl: string): Promise<void> {
    try {
      const html = await this.fetchHtml(articleUrl);
      const $ = this.parseHtml(html);

      // Extract title
      const title = this.cleanTitle(
        $('h1.titulo, h1, meta[name="citation_title"]').first().text() ||
        $('meta[name="citation_title"]').attr('content') ||
        'Untitled'
      );

      // Extract authors
      const authors: string[] = [];
      $('meta[name="citation_author"]').each((_, elem) => {
        const author = $(elem).attr('content');
        if (author) {
          authors.push(this.cleanAuthorName(author));
        }
      });

      // If no meta tags, try from page
      if (authors.length === 0) {
        $('span.autor, div.autores span').each((_, elem) => {
          const author = $(elem).text().trim();
          if (author) {
            authors.push(this.cleanAuthorName(author));
          }
        });
      }

      // Extract year
      const yearText = $('meta[name="citation_publication_date"]').attr('content') ||
                      $('span.anio, span.fecha').first().text();
      const year = this.extractYear(yearText || '') || new Date().getFullYear();

      // Find PDF download link
      const pdfLink = $('a[href$=".pdf"], a.descargar-pdf, a[href*="pdf"]').first().attr('href');

      if (!pdfLink) {
        logger.warn('No PDF found for Redalyc article', { articleUrl, title });
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
      logger.error('Failed to scrape Redalyc article', { articleUrl, error: error.message });
      this.stats.documentsFailed++;
    }
  }
}

export default RedalycScraper;
