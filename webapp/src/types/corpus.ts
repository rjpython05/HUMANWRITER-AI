export type CorpusStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface CorpusDocument {
  id: string;
  filename: string;
  discipline: string;
  fileSize: number;
  wordCount: number;
  status: CorpusStatus;
  uploadedBy: string;
  uploadedAt: Date | string;
  processedAt?: Date | string | null;
  metadata?: CorpusMetadata;
  content?: string;
  error?: string | null;
}

export interface CorpusMetadata {
  author?: string;
  year?: number;
  source?: string;
  language?: string;
  [key: string]: any;
}

export interface CorpusStats {
  totalDocuments: number;
  totalWords: number;
  disciplines: {
    name: string;
    count: number;
    wordCount: number;
  }[];
  recentUploads: CorpusDocument[];
  statusDistribution: {
    status: CorpusStatus;
    count: number;
  }[];
}

export interface CorpusFilter {
  discipline?: string;
  status?: CorpusStatus;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  uploadedBy?: string;
}

export interface CorpusUploadResponse {
  id: string;
  filename: string;
  status: CorpusStatus;
  message: string;
}

export interface DisciplineOption {
  value: string;
  label: string;
  description?: string;
}

export const DISCIPLINES: DisciplineOption[] = [
  { value: "biology", label: "Biology", description: "Life sciences and biological research" },
  { value: "chemistry", label: "Chemistry", description: "Chemical sciences and research" },
  { value: "physics", label: "Physics", description: "Physical sciences and research" },
  { value: "mathematics", label: "Mathematics", description: "Mathematical sciences and proofs" },
  { value: "computer_science", label: "Computer Science", description: "Computing and technology" },
  { value: "engineering", label: "Engineering", description: "Engineering disciplines" },
  { value: "medicine", label: "Medicine", description: "Medical sciences and healthcare" },
  { value: "psychology", label: "Psychology", description: "Psychological research" },
  { value: "economics", label: "Economics", description: "Economic theory and research" },
  { value: "sociology", label: "Sociology", description: "Social sciences" },
  { value: "history", label: "History", description: "Historical research and analysis" },
  { value: "literature", label: "Literature", description: "Literary analysis and criticism" },
  { value: "philosophy", label: "Philosophy", description: "Philosophical texts and arguments" },
  { value: "law", label: "Law", description: "Legal documents and analysis" },
  { value: "general", label: "General", description: "General academic writing" },
];
