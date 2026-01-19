export type GenerationMode = "prompt" | "document";
export type GenerationStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
export type FormalityLevel = "casual" | "neutral" | "formal";

export interface Generation {
  id: string;
  mode: GenerationMode;
  discipline: string;
  model?: string;
  prompt?: string;
  documentId?: string;
  status: GenerationStatus;
  originalText?: string;
  humanizedText?: string;
  metrics?: GenerationMetrics;
  parameters?: GenerationParameters;
  createdAt: Date | string;
  completedAt?: Date | string | null;
  userId: string;
  error?: string | null;
}

export interface GenerationMetrics {
  humanizationScore: number; // 0-1
  burstiness: number; // 0-1
  perplexity: number;
  wordCount: number;
  sentenceCount: number;
  avgSentenceLength: number;
  vocabularyRichness: number; // 0-1
  readabilityScore: number; // 0-100
  processingTime: number; // seconds
  detailsPerMetric?: {
    sentenceLengthVariation: number;
    vocabularyDiversity: number;
    syntacticComplexity: number;
  };
}

export interface GenerationParameters {
  targetLength?: number;
  creativity?: number; // 0-1
  formality?: FormalityLevel;
  temperature?: number;
  topP?: number;
  [key: string]: any;
}

export interface GenerationRequest {
  mode: GenerationMode;
  discipline: string;
  model?: string;
  prompt?: string;
  documentId?: string;
  parameters?: GenerationParameters;
}

export interface GenerationResponse {
  id: string;
  status: GenerationStatus;
  humanizedText?: string;
  metrics?: GenerationMetrics;
  message?: string;
  error?: string;
}

export interface GenerationStats {
  totalGenerations: number;
  successfulGenerations: number;
  failedGenerations: number;
  averageHumanizationScore: number;
  averageBurstiness: number;
  totalWordsGenerated: number;
  recentGenerations: Generation[];
  generationsByDiscipline: {
    discipline: string;
    count: number;
    avgScore: number;
  }[];
}

export interface GenerationFilter {
  discipline?: string;
  status?: GenerationStatus;
  mode?: GenerationMode;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export interface ComparisonView {
  original: string;
  humanized: string;
  differences: TextDifference[];
}

export interface TextDifference {
  type: "added" | "removed" | "modified" | "unchanged";
  value: string;
  position: number;
}

export interface ExportOptions {
  format: "docx" | "pdf" | "txt" | "md";
  includeMetrics: boolean;
  includeOriginal: boolean;
}

export const MODEL_OPTIONS = [
  { value: "gpt-4", label: "GPT-4", description: "Most capable model" },
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo", description: "Fast and efficient" },
  { value: "claude-2", label: "Claude 2", description: "Strong reasoning" },
  { value: "default", label: "Default", description: "Recommended model" },
];
