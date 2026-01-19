import { ScraperConfig } from '../config/scraper.config';
import logger from '../utils/logger';

export interface ValidationResult {
  isValid: boolean;
  score: number; // 0-100
  issues: string[];
  warnings: string[];
}

export interface ValidationCriteria {
  minWordCount?: number;
  maxWordCount?: number;
  minYear?: number;
  maxYear?: number;
  requireTitle?: boolean;
  requireAuthors?: boolean;
  requireAbstract?: boolean;
  academicKeywordsThreshold?: number;
}

/**
 * Validate document quality and academic content
 */
export class DocumentValidator {
  private readonly academicKeywords = [
    // Spanish keywords
    'investigación', 'estudio', 'análisis', 'metodología', 'resultados',
    'conclusión', 'objetivo', 'hipótesis', 'muestra', 'datos',
    'abstract', 'resumen', 'introducción', 'discusión', 'referencias',
    'bibliografía', 'marco teórico', 'variable', 'estadística',

    // English keywords
    'research', 'study', 'analysis', 'methodology', 'results',
    'conclusion', 'objective', 'hypothesis', 'sample', 'data',
    'introduction', 'discussion', 'references', 'theoretical framework',
    'statistical', 'findings', 'approach', 'literature review',
  ];

  private readonly defaultCriteria: ValidationCriteria = {
    minWordCount: ScraperConfig.minWordCount,
    maxWordCount: ScraperConfig.maxWordCount,
    minYear: ScraperConfig.minYear,
    maxYear: ScraperConfig.maxYear,
    requireTitle: true,
    requireAuthors: false,
    requireAbstract: false,
    academicKeywordsThreshold: 3,
  };

  /**
   * Validate document
   */
  validate(
    text: string,
    metadata: Record<string, any>,
    criteria: ValidationCriteria = {}
  ): ValidationResult {
    const crit = { ...this.defaultCriteria, ...criteria };
    const issues: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    try {
      // Word count validation
      const wordCount = this.countWords(text);
      if (crit.minWordCount && wordCount < crit.minWordCount) {
        issues.push(`Word count too low: ${wordCount} (min: ${crit.minWordCount})`);
        score -= 30;
      }
      if (crit.maxWordCount && wordCount > crit.maxWordCount) {
        warnings.push(`Word count very high: ${wordCount} (max: ${crit.maxWordCount})`);
        score -= 10;
      }

      // Year validation
      if (metadata.year) {
        if (crit.minYear && metadata.year < crit.minYear) {
          issues.push(`Year too old: ${metadata.year} (min: ${crit.minYear})`);
          score -= 20;
        }
        if (crit.maxYear && metadata.year > crit.maxYear) {
          issues.push(`Year in future: ${metadata.year} (max: ${crit.maxYear})`);
          score -= 20;
        }
      } else {
        warnings.push('No publication year found');
        score -= 5;
      }

      // Title validation
      if (crit.requireTitle && !metadata.title) {
        issues.push('No title found');
        score -= 15;
      } else if (metadata.title && metadata.title.length < 10) {
        warnings.push('Title seems too short');
        score -= 5;
      }

      // Authors validation
      if (crit.requireAuthors && (!metadata.authors || metadata.authors.length === 0)) {
        warnings.push('No authors found');
        score -= 10;
      }

      // Abstract validation
      if (crit.requireAbstract && !metadata.abstract) {
        warnings.push('No abstract found');
        score -= 5;
      }

      // Academic content validation
      const academicKeywordCount = this.countAcademicKeywords(text);
      if (crit.academicKeywordsThreshold && academicKeywordCount < crit.academicKeywordsThreshold) {
        issues.push(`Insufficient academic content: ${academicKeywordCount} keywords found`);
        score -= 25;
      }

      // Language validation
      const hasProperLanguage = this.validateLanguage(text);
      if (!hasProperLanguage) {
        warnings.push('Document language quality seems low');
        score -= 10;
      }

      // Structure validation
      const structureScore = this.validateStructure(text);
      if (structureScore < 50) {
        warnings.push('Document structure seems incomplete');
        score -= 15;
      }

      // Quality checks
      const qualityIssues = this.checkQuality(text);
      if (qualityIssues.length > 0) {
        warnings.push(...qualityIssues);
        score -= qualityIssues.length * 5;
      }

      // Ensure score is between 0 and 100
      score = Math.max(0, Math.min(100, score));

      const isValid = issues.length === 0 && score >= 60;

      logger.info('Document validation completed', {
        isValid,
        score,
        issuesCount: issues.length,
        warningsCount: warnings.length,
      });

      return {
        isValid,
        score,
        issues,
        warnings,
      };
    } catch (error: any) {
      logger.error('Validation failed', { error: error.message });
      return {
        isValid: false,
        score: 0,
        issues: [`Validation error: ${error.message}`],
        warnings: [],
      };
    }
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Count academic keywords
   */
  private countAcademicKeywords(text: string): number {
    const lowerText = text.toLowerCase();
    let count = 0;

    for (const keyword of this.academicKeywords) {
      if (lowerText.includes(keyword)) {
        count++;
      }
    }

    return count;
  }

  /**
   * Validate language quality
   */
  private validateLanguage(text: string): boolean {
    // Check for minimum sentence structure
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

    if (sentences.length < 10) {
      return false;
    }

    // Check for reasonable sentence length
    const avgSentenceLength = text.length / sentences.length;
    if (avgSentenceLength < 20 || avgSentenceLength > 500) {
      return false;
    }

    return true;
  }

  /**
   * Validate document structure
   */
  private validateStructure(text: string): number {
    let score = 0;

    // Check for common sections
    const sections = [
      /(?:resumen|abstract)/i,
      /(?:introducción|introduction)/i,
      /(?:metodología|methodology|métodos)/i,
      /(?:resultados|results)/i,
      /(?:conclusión|conclusion)/i,
      /(?:referencias|references|bibliografía)/i,
    ];

    for (const section of sections) {
      if (section.test(text)) {
        score += 20;
      }
    }

    return Math.min(100, score);
  }

  /**
   * Check document quality
   */
  private checkQuality(text: string): string[] {
    const issues: string[] = [];

    // Check for excessive repetition
    const words = text.toLowerCase().split(/\s+/);
    const wordFreq = new Map<string, number>();
    for (const word of words) {
      if (word.length > 3) {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      }
    }

    const maxFreq = Math.max(...Array.from(wordFreq.values()));
    if (maxFreq > words.length * 0.1) {
      issues.push('Excessive word repetition detected');
    }

    // Check for minimum paragraph count
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
    if (paragraphs.length < 5) {
      issues.push('Document has too few paragraphs');
    }

    // Check for special characters that might indicate OCR errors
    const specialCharCount = (text.match(/[^a-zA-Z0-9\s.,;:()¿?¡!áéíóúñÁÉÍÓÚÑüÜ-]/g) || []).length;
    if (specialCharCount > text.length * 0.05) {
      issues.push('High number of special characters (possible OCR errors)');
    }

    // Check for minimum unique words
    const uniqueWords = new Set(words.filter(w => w.length > 3));
    if (uniqueWords.size < 100) {
      issues.push('Limited vocabulary (possible poor quality)');
    }

    return issues;
  }

  /**
   * Validate file metadata
   */
  validateFile(
    filePath: string,
    fileSize: number,
    extension: string
  ): ValidationResult {
    const issues: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    // Check file size
    if (fileSize > ScraperConfig.maxFileSize) {
      issues.push(`File too large: ${fileSize} bytes (max: ${ScraperConfig.maxFileSize})`);
      score -= 50;
    }
    if (fileSize < 1000) {
      issues.push('File too small (likely corrupted)');
      score -= 50;
    }

    // Check extension
    if (!ScraperConfig.allowedExtensions.includes(extension)) {
      issues.push(`Invalid file extension: ${extension}`);
      score -= 100;
    }

    return {
      isValid: issues.length === 0,
      score: Math.max(0, score),
      issues,
      warnings,
    };
  }

  /**
   * Quick validation (minimal checks)
   */
  quickValidate(text: string, metadata: Record<string, any>): boolean {
    const wordCount = this.countWords(text);
    const hasMinWords = wordCount >= (ScraperConfig.minWordCount || 2000);
    const hasTitle = !!metadata.title;
    const hasAcademicContent = this.countAcademicKeywords(text) >= 3;

    return hasMinWords && hasTitle && hasAcademicContent;
  }
}

export default DocumentValidator;
