import logger from '../utils/logger';

export interface CleaningOptions {
  removeHeaders?: boolean;
  removeFooters?: boolean;
  removePageNumbers?: boolean;
  removeReferences?: boolean;
  removeTables?: boolean;
  normalizeWhitespace?: boolean;
  removeNonAcademic?: boolean;
}

/**
 * Clean and normalize extracted text from academic documents
 */
export class TextCleaner {
  private readonly defaultOptions: CleaningOptions = {
    removeHeaders: true,
    removeFooters: true,
    removePageNumbers: true,
    removeReferences: false, // Keep references for academic context
    removeTables: false,
    normalizeWhitespace: true,
    removeNonAcademic: true,
  };

  /**
   * Clean text with specified options
   */
  clean(text: string, options: CleaningOptions = {}): string {
    const opts = { ...this.defaultOptions, ...options };

    let cleaned = text;

    try {
      if (opts.removePageNumbers) {
        cleaned = this.removePageNumbers(cleaned);
      }

      if (opts.removeHeaders) {
        cleaned = this.removeHeaders(cleaned);
      }

      if (opts.removeFooters) {
        cleaned = this.removeFooters(cleaned);
      }

      if (opts.removeNonAcademic) {
        cleaned = this.removeNonAcademicContent(cleaned);
      }

      if (opts.normalizeWhitespace) {
        cleaned = this.normalizeWhitespace(cleaned);
      }

      logger.info('Text cleaned successfully', {
        originalLength: text.length,
        cleanedLength: cleaned.length,
        reductionPercent: ((1 - cleaned.length / text.length) * 100).toFixed(2),
      });

      return cleaned;
    } catch (error: any) {
      logger.error('Text cleaning failed', { error: error.message });
      return text; // Return original if cleaning fails
    }
  }

  /**
   * Remove page numbers
   */
  private removePageNumbers(text: string): string {
    // Remove standalone numbers (likely page numbers)
    // Pattern: line with just a number
    text = text.replace(/^\s*\d+\s*$/gm, '');

    // Remove "Page X" or "Página X"
    text = text.replace(/\b(page|página|pág\.?)\s*\d+\b/gi, '');

    // Remove "X of Y" page indicators
    text = text.replace(/\b\d+\s*(of|de)\s*\d+\b/gi, '');

    return text;
  }

  /**
   * Remove headers (repeated content at top of pages)
   */
  private removeHeaders(text: string): string {
    // Split into lines
    const lines = text.split('\n');
    const lineOccurrences = new Map<string, number>();

    // Count occurrences of each line
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length > 5 && trimmed.length < 100) {
        lineOccurrences.set(trimmed, (lineOccurrences.get(trimmed) || 0) + 1);
      }
    }

    // Identify repeated lines (potential headers)
    const repeatedLines = new Set<string>();
    for (const [line, count] of lineOccurrences) {
      if (count >= 3) { // Appears 3+ times
        repeatedLines.add(line);
      }
    }

    // Remove repeated lines
    const cleaned = lines.filter(line => {
      const trimmed = line.trim();
      return !repeatedLines.has(trimmed);
    });

    return cleaned.join('\n');
  }

  /**
   * Remove footers (repeated content at bottom of pages)
   */
  private removeFooters(text: string): string {
    // Remove common footer patterns
    text = text.replace(/^\s*(copyright|©|derechos reservados).*$/gim, '');
    text = text.replace(/^\s*www\.\S+\s*$/gim, '');
    text = text.replace(/^\s*https?:\/\/\S+\s*$/gim, '');

    return text;
  }

  /**
   * Remove non-academic content
   */
  private removeNonAcademicContent(text: string): string {
    // Remove URLs (keep domain for context)
    text = text.replace(/https?:\/\/[^\s]+/g, '');

    // Remove email addresses
    text = text.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '');

    // Remove excessive punctuation
    text = text.replace(/([!?.]){3,}/g, '$1');

    // Remove special characters (keep Spanish accents)
    text = text.replace(/[^\w\sáéíóúñÁÉÍÓÚÑüÜ.,;:()¿?¡!-]/g, '');

    return text;
  }

  /**
   * Normalize whitespace
   */
  private normalizeWhitespace(text: string): string {
    // Replace multiple spaces with single space
    text = text.replace(/[ \t]+/g, ' ');

    // Replace multiple line breaks with double line break
    text = text.replace(/\n{3,}/g, '\n\n');

    // Remove spaces at start/end of lines
    text = text.replace(/^[ \t]+|[ \t]+$/gm, '');

    // Trim
    return text.trim();
  }

  /**
   * Extract academic sections (introduction, methodology, results, etc.)
   */
  extractSections(text: string): Record<string, string> {
    const sections: Record<string, string> = {};

    const sectionPatterns = [
      { name: 'abstract', pattern: /(?:resumen|abstract)[:\n]+([\s\S]*?)(?=\n\n[A-Z]|\n\n\d+\.)/i },
      { name: 'introduction', pattern: /(?:introducción|introduction)[:\n]+([\s\S]*?)(?=\n\n[A-Z]|\n\n\d+\.)/i },
      { name: 'methodology', pattern: /(?:metodología|methodology|métodos)[:\n]+([\s\S]*?)(?=\n\n[A-Z]|\n\n\d+\.)/i },
      { name: 'results', pattern: /(?:resultados|results)[:\n]+([\s\S]*?)(?=\n\n[A-Z]|\n\n\d+\.)/i },
      { name: 'discussion', pattern: /(?:discusión|discussion)[:\n]+([\s\S]*?)(?=\n\n[A-Z]|\n\n\d+\.)/i },
      { name: 'conclusion', pattern: /(?:conclusión|conclusiones|conclusion)[:\n]+([\s\S]*?)(?=\n\n[A-Z]|\n\n\d+\.)/i },
    ];

    for (const { name, pattern } of sectionPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        sections[name] = this.normalizeWhitespace(match[1]);
      }
    }

    return sections;
  }

  /**
   * Remove references section
   */
  removeReferences(text: string): string {
    // Find "Referencias" or "References" section and remove everything after
    const patterns = [
      /\n\s*referencias\s*\n[\s\S]*$/i,
      /\n\s*references\s*\n[\s\S]*$/i,
      /\n\s*bibliografía\s*\n[\s\S]*$/i,
      /\n\s*bibliography\s*\n[\s\S]*$/i,
    ];

    for (const pattern of patterns) {
      text = text.replace(pattern, '');
    }

    return text;
  }

  /**
   * Extract keywords from text
   */
  extractKeywords(text: string, maxKeywords: number = 10): string[] {
    // Simple keyword extraction based on frequency
    const words = text.toLowerCase()
      .replace(/[^\w\sáéíóúñ]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 4); // Only words longer than 4 chars

    const frequency = new Map<string, number>();
    for (const word of words) {
      frequency.set(word, (frequency.get(word) || 0) + 1);
    }

    // Sort by frequency and get top keywords
    const sorted = Array.from(frequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxKeywords)
      .map(([word]) => word);

    return sorted;
  }

  /**
   * Calculate text statistics
   */
  getStatistics(text: string): {
    wordCount: number;
    charCount: number;
    sentenceCount: number;
    paragraphCount: number;
    avgWordsPerSentence: number;
  } {
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
    const charCount = text.length;
    const sentenceCount = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const paragraphCount = text.split(/\n\n+/).filter(p => p.trim().length > 0).length;
    const avgWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0;

    return {
      wordCount,
      charCount,
      sentenceCount,
      paragraphCount,
      avgWordsPerSentence,
    };
  }
}

export default TextCleaner;
