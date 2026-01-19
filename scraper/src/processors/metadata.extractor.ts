import logger from '../utils/logger';

export interface ExtractedMetadata {
  title?: string;
  authors: string[];
  year?: number;
  institution?: string;
  keywords: string[];
  abstract?: string;
  language: string;
}

/**
 * Extract metadata from academic document text
 */
export class MetadataExtractor {
  /**
   * Extract metadata from text
   */
  extract(text: string, sourceUrl?: string): ExtractedMetadata {
    try {
      const metadata: ExtractedMetadata = {
        authors: [],
        keywords: [],
        language: this.detectLanguage(text),
      };

      // Extract title
      metadata.title = this.extractTitle(text);

      // Extract authors
      metadata.authors = this.extractAuthors(text);

      // Extract year
      metadata.year = this.extractYear(text);

      // Extract institution
      metadata.institution = this.extractInstitution(text, sourceUrl);

      // Extract keywords
      metadata.keywords = this.extractKeywords(text);

      // Extract abstract
      metadata.abstract = this.extractAbstract(text);

      logger.info('Metadata extracted successfully', {
        title: metadata.title?.substring(0, 50),
        authorsCount: metadata.authors.length,
        year: metadata.year,
      });

      return metadata;
    } catch (error: any) {
      logger.error('Metadata extraction failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Extract title from text
   */
  private extractTitle(text: string): string | undefined {
    // Try to find title at the beginning of document
    const lines = text.split('\n').filter(line => line.trim().length > 0);

    if (lines.length === 0) return undefined;

    // First non-empty line is usually the title
    let title = lines[0].trim();

    // Look for common title patterns
    const titlePatterns = [
      /^título:\s*(.+)$/im,
      /^title:\s*(.+)$/im,
      /^(.+)\n\s*$/m, // Title followed by blank line
    ];

    for (const pattern of titlePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        title = match[1].trim();
        break;
      }
    }

    // Clean title
    title = title.replace(/[#*_]/g, '').trim();

    // Validate title length
    if (title.length < 10 || title.length > 300) {
      return lines[0].substring(0, 200).trim();
    }

    return title;
  }

  /**
   * Extract authors from text
   */
  private extractAuthors(text: string): string[] {
    const authors: string[] = [];

    // Patterns for author extraction
    const patterns = [
      /(?:autor(?:es)?|author(?:s)?)[:\s]+(.+?)(?:\n|\.)/i,
      /(?:por|by)[:\s]+(.+?)(?:\n|\.)/i,
      /(?:elaborado por|prepared by)[:\s]+(.+?)(?:\n|\.)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const authorText = match[1];

        // Split by common separators
        const authorNames = authorText
          .split(/[,;&]|\sy\s|\sand\s/)
          .map(name => name.trim())
          .filter(name => name.length > 2 && name.length < 100)
          .filter(name => /^[A-ZÁÉÍÓÚÑa-záéíóúñ\s.]+$/.test(name));

        if (authorNames.length > 0) {
          authors.push(...authorNames);
          break;
        }
      }
    }

    // If no authors found, look for name patterns in first few lines
    if (authors.length === 0) {
      const lines = text.split('\n').slice(0, 10);
      for (const line of lines) {
        // Look for capitalized names
        const namePattern = /^([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)+)$/;
        const match = line.trim().match(namePattern);
        if (match && match[1]) {
          authors.push(match[1]);
        }
      }
    }

    return authors.slice(0, 10); // Limit to 10 authors
  }

  /**
   * Extract publication year
   */
  private extractYear(text: string): number | undefined {
    // Look for 4-digit years between 1990 and 2030
    const yearPattern = /\b(19[9]\d|20[0-3]\d)\b/g;
    const matches = text.match(yearPattern);

    if (!matches) return undefined;

    // Get the most common year (likely publication year)
    const yearCounts = new Map<number, number>();
    for (const match of matches) {
      const year = parseInt(match, 10);
      yearCounts.set(year, (yearCounts.get(year) || 0) + 1);
    }

    if (yearCounts.size === 0) return undefined;

    // Return most frequent year
    const sortedYears = Array.from(yearCounts.entries())
      .sort((a, b) => b[1] - a[1]);

    return sortedYears[0][0];
  }

  /**
   * Extract institution from text or URL
   */
  private extractInstitution(text: string, sourceUrl?: string): string | undefined {
    // Try to extract from URL first
    if (sourceUrl) {
      const urlInstitutions = [
        { pattern: /uasd\.edu\.do/, name: 'Universidad Autónoma de Santo Domingo (UASD)' },
        { pattern: /pucmm\.edu\.do/, name: 'Pontificia Universidad Católica Madre y Maestra (PUCMM)' },
        { pattern: /intec\.edu\.do/, name: 'Instituto Tecnológico de Santo Domingo (INTEC)' },
        { pattern: /unphu\.edu\.do/, name: 'Universidad Nacional Pedro Henríquez Ureña (UNPHU)' },
        { pattern: /uapa\.edu\.do/, name: 'Universidad Abierta Para Adultos (UAPA)' },
        { pattern: /unibe\.edu\.do/, name: 'Universidad Iberoamericana (UNIBE)' },
        { pattern: /bancentral\.gov\.do/, name: 'Banco Central de la República Dominicana' },
        { pattern: /one\.gob\.do/, name: 'Oficina Nacional de Estadística (ONE)' },
        { pattern: /cepal\.org/, name: 'CEPAL' },
        { pattern: /iadb\.org|bid\.org/, name: 'Banco Interamericano de Desarrollo (BID)' },
        { pattern: /worldbank\.org/, name: 'Banco Mundial' },
        { pattern: /imf\.org/, name: 'Fondo Monetario Internacional (FMI)' },
        { pattern: /fao\.org/, name: 'FAO' },
        { pattern: /paho\.org|ops\.org/, name: 'OPS/OMS' },
      ];

      for (const { pattern, name } of urlInstitutions) {
        if (pattern.test(sourceUrl)) {
          return name;
        }
      }
    }

    // Try to extract from text
    const institutionPatterns = [
      /(?:universidad|university|instituto|institute)\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ\s]+/i,
      /(?:u\.?a\.?s\.?d|pucmm|intec|unphu|uapa|unibe)/i,
    ];

    for (const pattern of institutionPatterns) {
      const match = text.match(pattern);
      if (match && match[0]) {
        return match[0].trim();
      }
    }

    return undefined;
  }

  /**
   * Extract keywords
   */
  private extractKeywords(text: string): string[] {
    const keywords: string[] = [];

    // Look for explicit keywords section
    const keywordPatterns = [
      /(?:palabras clave|keywords)[:\s]+(.+?)(?:\n\n|\.)/i,
      /(?:key words)[:\s]+(.+?)(?:\n\n|\.)/i,
    ];

    for (const pattern of keywordPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const extractedKeywords = match[1]
          .split(/[,;]/)
          .map(kw => kw.trim())
          .filter(kw => kw.length > 2 && kw.length < 50);

        if (extractedKeywords.length > 0) {
          keywords.push(...extractedKeywords);
          break;
        }
      }
    }

    return keywords.slice(0, 20); // Limit to 20 keywords
  }

  /**
   * Extract abstract
   */
  private extractAbstract(text: string): string | undefined {
    const abstractPatterns = [
      /(?:resumen|abstract)[:\n]\s*([\s\S]{100,2000}?)(?:\n\n|palabras clave|keywords|introducción|introduction)/i,
    ];

    for (const pattern of abstractPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return undefined;
  }

  /**
   * Detect document language
   */
  private detectLanguage(text: string): string {
    // Simple language detection based on common words
    const spanishWords = ['el', 'la', 'de', 'en', 'y', 'que', 'los', 'del', 'se', 'por'];
    const englishWords = ['the', 'and', 'of', 'to', 'in', 'is', 'for', 'that', 'with', 'as'];

    const words = text.toLowerCase().split(/\s+/).slice(0, 1000);

    let spanishCount = 0;
    let englishCount = 0;

    for (const word of words) {
      if (spanishWords.includes(word)) spanishCount++;
      if (englishWords.includes(word)) englishCount++;
    }

    return spanishCount > englishCount ? 'es' : 'en';
  }

  /**
   * Extract all available metadata with fallbacks
   */
  extractWithFallbacks(
    text: string,
    pdfMetadata?: any,
    docxMetadata?: any,
    sourceUrl?: string
  ): ExtractedMetadata {
    const extracted = this.extract(text, sourceUrl);

    // Use PDF metadata as fallback
    if (pdfMetadata) {
      if (!extracted.title && pdfMetadata.title) {
        extracted.title = pdfMetadata.title;
      }
      if (extracted.authors.length === 0 && pdfMetadata.author) {
        extracted.authors = [pdfMetadata.author];
      }
      if (!extracted.year && pdfMetadata.creationDate) {
        extracted.year = new Date(pdfMetadata.creationDate).getFullYear();
      }
    }

    // Use DOCX metadata as fallback
    if (docxMetadata) {
      // Add DOCX-specific metadata if available
    }

    return extracted;
  }
}

export default MetadataExtractor;
