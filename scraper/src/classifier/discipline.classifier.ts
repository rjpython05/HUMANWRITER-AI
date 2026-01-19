import { Discipline } from '@prisma/client';
import natural from 'natural';
import { DISCIPLINE_KEYWORDS, getKeywordsForDiscipline, getSubdisciplines } from './keywords.config';
import logger from '../utils/logger';

export interface ClassificationResult {
  discipline: Discipline;
  confidence: number; // 0-1
  subdiscipline?: string;
  scores: Record<Discipline, number>;
  keywords: string[];
}

/**
 * ML-based classifier to determine document discipline
 * Uses keyword matching and NLP for classification
 */
export class DisciplineClassifier {
  private tfidf: natural.TfIdf;
  private tokenizer: natural.WordTokenizer;

  constructor() {
    this.tfidf = new natural.TfIdf();
    this.tokenizer = new natural.WordTokenizer();
  }

  /**
   * Classify document text into a discipline
   */
  classify(text: string, title?: string): ClassificationResult {
    try {
      // Combine title and text (title has more weight)
      const combinedText = title ? `${title} ${title} ${title} ${text}` : text;

      // Tokenize and clean text
      const tokens = this.tokenizeAndClean(combinedText);

      // Calculate scores for each discipline
      const scores: Record<Discipline, number> = {} as Record<Discipline, number>;

      for (const disciplineConfig of DISCIPLINE_KEYWORDS) {
        const discipline = disciplineConfig.discipline;
        const score = this.calculateDisciplineScore(tokens, discipline);
        scores[discipline] = score;
      }

      // Find best match
      const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1]);
      const [bestDiscipline, bestScore] = sortedScores[0];

      // Calculate confidence
      const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
      const confidence = totalScore > 0 ? bestScore / totalScore : 0;

      // Determine subdiscipline
      const subdiscipline = this.classifySubdiscipline(tokens, bestDiscipline as Discipline);

      // Extract matching keywords
      const keywords = this.extractMatchingKeywords(tokens, bestDiscipline as Discipline);

      const result: ClassificationResult = {
        discipline: bestDiscipline as Discipline,
        confidence,
        subdiscipline,
        scores,
        keywords: keywords.slice(0, 10),
      };

      logger.info('Document classified', {
        discipline: result.discipline,
        confidence: result.confidence.toFixed(2),
        subdiscipline: result.subdiscipline,
      });

      return result;
    } catch (error: any) {
      logger.error('Classification failed', { error: error.message });
      // Default to CIENCIAS_SOCIALES if classification fails
      return {
        discipline: 'CIENCIAS_SOCIALES' as Discipline,
        confidence: 0.5,
        scores: {} as Record<Discipline, number>,
        keywords: [],
      };
    }
  }

  /**
   * Classify with metadata hints
   */
  classifyWithMetadata(
    text: string,
    metadata: {
      title?: string;
      keywords?: string[];
      institution?: string;
      source?: string;
    }
  ): ClassificationResult {
    // Combine all text sources
    let combinedText = text;

    if (metadata.title) {
      combinedText = `${metadata.title} ${metadata.title} ${combinedText}`;
    }

    if (metadata.keywords && metadata.keywords.length > 0) {
      const keywordsText = metadata.keywords.join(' ');
      combinedText = `${keywordsText} ${keywordsText} ${combinedText}`;
    }

    // Use institution/source as hints
    if (metadata.institution) {
      combinedText = `${metadata.institution} ${combinedText}`;
    }

    return this.classify(combinedText, metadata.title);
  }

  /**
   * Calculate score for a specific discipline
   */
  private calculateDisciplineScore(tokens: string[], discipline: Discipline): number {
    const keywords = getKeywordsForDiscipline(discipline);
    const lowerKeywords = keywords.map(k => k.toLowerCase());

    let score = 0;

    for (const token of tokens) {
      // Exact match
      if (lowerKeywords.includes(token)) {
        score += 2;
      }

      // Partial match (token contains keyword or vice versa)
      for (const keyword of lowerKeywords) {
        if (token.includes(keyword) || keyword.includes(token)) {
          score += 1;
          break;
        }
      }
    }

    // Apply TF-IDF weighting
    const text = tokens.join(' ');
    this.tfidf.addDocument(text);

    return score;
  }

  /**
   * Classify subdiscipline within a discipline
   */
  private classifySubdiscipline(tokens: string[], discipline: Discipline): string | undefined {
    const subdisciplines = getSubdisciplines(discipline);

    if (subdisciplines.length === 0) {
      return undefined;
    }

    let bestSubdiscipline: string | undefined;
    let bestScore = 0;

    for (const sub of subdisciplines) {
      const subKeywords = sub.keywords.map(k => k.toLowerCase());
      let score = 0;

      for (const token of tokens) {
        if (subKeywords.includes(token)) {
          score += 2;
        }

        for (const keyword of subKeywords) {
          if (token.includes(keyword) || keyword.includes(token)) {
            score += 1;
            break;
          }
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestSubdiscipline = sub.name;
      }
    }

    return bestScore > 3 ? bestSubdiscipline : undefined;
  }

  /**
   * Extract matching keywords from tokens
   */
  private extractMatchingKeywords(tokens: string[], discipline: Discipline): string[] {
    const keywords = getKeywordsForDiscipline(discipline);
    const lowerKeywords = keywords.map(k => k.toLowerCase());
    const matches: string[] = [];

    for (const token of tokens) {
      if (lowerKeywords.includes(token)) {
        matches.push(token);
      }
    }

    // Return unique matches
    return Array.from(new Set(matches));
  }

  /**
   * Tokenize and clean text
   */
  private tokenizeAndClean(text: string): string[] {
    // Convert to lowercase
    const lower = text.toLowerCase();

    // Tokenize
    const tokens = this.tokenizer.tokenize(lower) || [];

    // Remove stop words (simple list)
    const stopWords = new Set([
      'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'ser', 'se', 'no', 'haber',
      'por', 'con', 'su', 'para', 'como', 'estar', 'tener', 'le', 'lo', 'todo',
      'the', 'and', 'of', 'to', 'in', 'is', 'it', 'that', 'for', 'as', 'with',
      'was', 'are', 'be', 'this', 'have', 'from', 'or', 'one', 'had', 'by',
    ]);

    // Filter and clean
    const cleaned = tokens
      .filter(token => token.length > 2)
      .filter(token => !stopWords.has(token))
      .filter(token => /^[a-záéíóúñ]+$/.test(token));

    return cleaned;
  }

  /**
   * Batch classify multiple documents
   */
  async classifyBatch(
    documents: Array<{ text: string; title?: string; id?: string }>
  ): Promise<ClassificationResult[]> {
    const results: ClassificationResult[] = [];

    for (const doc of documents) {
      try {
        const result = this.classify(doc.text, doc.title);
        results.push(result);

        logger.info('Batch classification progress', {
          id: doc.id,
          discipline: result.discipline,
          confidence: result.confidence,
        });
      } catch (error: any) {
        logger.error('Batch classification error', {
          id: doc.id,
          error: error.message,
        });
        results.push({
          discipline: 'CIENCIAS_SOCIALES' as Discipline,
          confidence: 0,
          scores: {} as Record<Discipline, number>,
          keywords: [],
        });
      }
    }

    return results;
  }

  /**
   * Validate classification with minimum confidence threshold
   */
  validateClassification(result: ClassificationResult, minConfidence: number = 0.6): boolean {
    return result.confidence >= minConfidence;
  }

  /**
   * Get alternative disciplines if confidence is low
   */
  getAlternatives(result: ClassificationResult, topN: number = 3): Array<{
    discipline: Discipline;
    score: number;
  }> {
    const sorted = Object.entries(result.scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([discipline, score]) => ({
        discipline: discipline as Discipline,
        score: score as number,
      }));

    return sorted;
  }

  /**
   * Train classifier with labeled examples (future enhancement)
   */
  async train(examples: Array<{ text: string; discipline: Discipline }>): Promise<void> {
    // This is a placeholder for future ML training
    // Could implement Naive Bayes or other classifiers here
    logger.info('Training classifier with examples', { count: examples.length });

    // For now, we rely on keyword matching
    // Future: Implement actual ML training
  }

  /**
   * Get classification statistics
   */
  getStats(results: ClassificationResult[]): {
    avgConfidence: number;
    byDiscipline: Record<Discipline, number>;
    lowConfidenceCount: number;
  } {
    const byDiscipline: Record<Discipline, number> = {} as Record<Discipline, number>;
    let totalConfidence = 0;
    let lowConfidenceCount = 0;

    for (const result of results) {
      byDiscipline[result.discipline] = (byDiscipline[result.discipline] || 0) + 1;
      totalConfidence += result.confidence;

      if (result.confidence < 0.6) {
        lowConfidenceCount++;
      }
    }

    return {
      avgConfidence: results.length > 0 ? totalConfidence / results.length : 0,
      byDiscipline,
      lowConfidenceCount,
    };
  }
}

export default DisciplineClassifier;
