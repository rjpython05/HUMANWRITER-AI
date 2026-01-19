import { Request } from 'express';
import { User, Role, Plan, Discipline, GenerationStatus } from '@prisma/client';

// ==========================================
// EXPRESS EXTENSIONS
// ==========================================

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: Role;
    plan: Plan;
  };
}

// ==========================================
// USER TYPES
// ==========================================

export interface UserRegistrationDto {
  email: string;
  password: string;
  name?: string;
}

export interface UserLoginDto {
  email: string;
  password: string;
}

export interface UserProfileUpdateDto {
  name?: string;
  email?: string;
  password?: string;
  currentPassword?: string;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  plan: Plan;
  isActive: boolean;
  generationsCount: number;
  generationsThisMonth: number;
  createdAt: Date;
  lastLoginAt: Date | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface AuthResponse {
  user: UserResponse;
  tokens: AuthTokens;
}

// ==========================================
// GENERATION TYPES
// ==========================================

export interface GenerationCreateDto {
  prompt: string;
  discipline: Discipline;
  modelUsed?: string;
  maxWords?: number;
  temperature?: number;
  fromDocument?: boolean;
  documentPath?: string;
}

export interface GenerationMetrics {
  burstiness: number;
  humanizationScore: number;
  aiWordsCount: number;
  academicWordsCount: number;
  perplexity?: number;
  readabilityScore?: number;
  avgSentenceLength?: number;
  vocabularyRichness?: number;
}

export interface GenerationResponse {
  id: string;
  prompt: string;
  discipline: Discipline;
  modelUsed: string;
  rawText: string;
  humanizedText: string;
  metrics: GenerationMetrics;
  duration: number;
  tokensGenerated: number | null;
  status: GenerationStatus;
  createdAt: Date;
}

export interface GenerationHistoryQuery {
  page?: number;
  limit?: number;
  discipline?: Discipline;
  status?: GenerationStatus;
  startDate?: Date;
  endDate?: Date;
}

export interface StreamGenerationDto {
  prompt: string;
  discipline: Discipline;
  modelUsed?: string;
  maxWords?: number;
  temperature?: number;
}

// ==========================================
// CORPUS/DOCUMENT TYPES
// ==========================================

export interface DocumentUploadDto {
  title: string;
  authors: string[];
  year: number;
  institution: string;
  source: string;
  discipline: Discipline;
  subdiscipline: string;
  language: string;
  keywords: string[];
}

export interface DocumentResponse {
  id: string;
  title: string;
  authors: string[];
  year: number;
  institution: string;
  source: string;
  discipline: Discipline;
  subdiscipline: string;
  language: string;
  keywords: string[];
  wordCount: number;
  filePath: string;
  vectorized: boolean;
  validated: boolean;
  validationScore: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CorpusQuery {
  page?: number;
  limit?: number;
  discipline?: Discipline;
  language?: string;
  year?: number;
  validated?: boolean;
  vectorized?: boolean;
  search?: string;
}

export interface CorpusStats {
  totalDocuments: number;
  totalWordCount: number;
  documentsByDiscipline: Record<Discipline, number>;
  documentsByLanguage: Record<string, number>;
  documentsByYear: Record<number, number>;
  validatedDocuments: number;
  vectorizedDocuments: number;
  averageValidationScore: number;
}

// ==========================================
// ADMIN TYPES
// ==========================================

export interface AdminUserQuery {
  page?: number;
  limit?: number;
  role?: Role;
  plan?: Plan;
  isActive?: boolean;
  search?: string;
}

export interface AdminUserUpdateDto {
  role?: Role;
  plan?: Plan;
  isActive?: boolean;
  generationsThisMonth?: number;
}

export interface SystemMetrics {
  timestamp: Date;
  cpuUsage: number;
  ramUsage: number;
  diskUsage: number;
  apiCalls: number;
  errors: number;
  avgResponseTime: number;
  activeUsers: number;
  generationsCount: number;
  avgGenerationTime: number;
  ollamaUptime: number;
  dbConnections: number;
  dbQueryTime: number;
}

export interface AuditLogQuery {
  page?: number;
  limit?: number;
  userId?: string;
  action?: string;
  resource?: string;
  success?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface AuditLogResponse {
  id: string;
  userId: string | null;
  userEmail: string | null;
  ipAddress: string | null;
  action: string;
  resource: string | null;
  resourceId: string | null;
  details: any;
  success: boolean;
  errorMessage: string | null;
  timestamp: Date;
}

// ==========================================
// AI ENGINE TYPES
// ==========================================

export interface AIEngineGenerateRequest {
  prompt: string;
  discipline: Discipline;
  model?: string;
  max_words?: number;
  temperature?: number;
  from_document?: boolean;
  document_path?: string;
}

export interface AIEngineGenerateResponse {
  raw_text: string;
  humanized_text: string;
  metrics: {
    burstiness: number;
    humanization_score: number;
    ai_words_count: number;
    academic_words_count: number;
    perplexity?: number;
    readability_score?: number;
    avg_sentence_length?: number;
    vocabulary_richness?: number;
  };
  duration: number;
  tokens_generated?: number;
}

export interface AIEngineHealthResponse {
  status: string;
  ollama_available: boolean;
  models_loaded: string[];
  uptime: number;
}

// ==========================================
// PAGINATION TYPES
// ==========================================

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationMeta {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// ==========================================
// API RESPONSE TYPES
// ==========================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  meta?: any;
}

export interface ApiError {
  message: string;
  code?: string;
  statusCode: number;
  details?: any;
}

// ==========================================
// FILE UPLOAD TYPES
// ==========================================

export interface FileUploadResult {
  filename: string;
  path: string;
  size: number;
  mimetype: string;
  originalname: string;
}

export interface FileValidationOptions {
  maxSize: number;
  allowedMimetypes: string[];
  allowedExtensions: string[];
}

// ==========================================
// VALIDATION ERROR TYPES
// ==========================================

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// ==========================================
// FEEDBACK TYPES
// ==========================================

export interface FeedbackCreateDto {
  generationId: string;
  rating: number;
  helpful: boolean;
  issues: string[];
  comment?: string;
}

export interface FeedbackResponse {
  id: string;
  generationId: string;
  rating: number;
  helpful: boolean;
  issues: string[];
  comment: string | null;
  createdAt: Date;
}

// ==========================================
// REDIS CACHE TYPES
// ==========================================

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  key: string;
}

// ==========================================
// ENVIRONMENT TYPES
// ==========================================

export interface Environment {
  PORT: number;
  NODE_ENV: string;
  DATABASE_URL: string;
  REDIS_URL: string;
  AI_ENGINE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  CORS_ORIGIN: string;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  UPLOAD_DIR: string;
  MAX_FILE_SIZE: number;
  ALLOWED_FILE_TYPES: string;
  LOG_LEVEL: string;
  APP_NAME: string;
  APP_URL: string;
}

// ==========================================
// JWT PAYLOAD TYPES
// ==========================================

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
  plan: Plan;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
  iat?: number;
  exp?: number;
}
