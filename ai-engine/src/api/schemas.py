"""
Pydantic models for API request/response validation
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class DisciplineEnum(str, Enum):
    """Academic disciplines"""
    INGENIERIA = "INGENIERIA"
    CIENCIAS_SOCIALES = "CIENCIAS_SOCIALES"
    EXACTAS_NATURALES = "EXACTAS_NATURALES"
    AGRARIAS = "AGRARIAS"


class GenerateRequest(BaseModel):
    """Request model for text generation"""
    prompt: str = Field(..., min_length=10, description="Generation prompt/instruction")
    discipline: DisciplineEnum = Field(..., description="Academic discipline")
    target_words: int = Field(default=1000, ge=100, le=5000, description="Target word count")
    temperature: Optional[float] = Field(default=0.7, ge=0.0, le=2.0, description="Model temperature")
    use_rag: bool = Field(default=True, description="Enable RAG context retrieval")
    humanize: bool = Field(default=True, description="Apply humanization pipeline")

    class Config:
        json_schema_extra = {
            "example": {
                "prompt": "Escribe un ensayo sobre energías renovables en República Dominicana",
                "discipline": "INGENIERIA",
                "target_words": 1500,
                "temperature": 0.7,
                "use_rag": True,
                "humanize": True
            }
        }


class GenerateResponse(BaseModel):
    """Response model for text generation"""
    text: str = Field(..., description="Generated text")
    word_count: int = Field(..., description="Actual word count")
    discipline: str = Field(..., description="Discipline used")
    model_used: str = Field(..., description="Model used for generation")
    rag_context_used: bool = Field(..., description="Whether RAG context was used")
    humanized: bool = Field(..., description="Whether humanization was applied")
    quality_score: Optional[float] = Field(None, description="Quality score (0-100)")
    ai_detection_score: Optional[float] = Field(None, description="AI detection score (0-100, lower is better)")
    burstiness_score: Optional[float] = Field(None, description="Burstiness score")
    generation_time_ms: int = Field(..., description="Generation time in milliseconds")

    class Config:
        json_schema_extra = {
            "example": {
                "text": "Las energías renovables en República Dominicana...",
                "word_count": 1523,
                "discipline": "INGENIERIA",
                "model_used": "llama3.1:8b",
                "rag_context_used": True,
                "humanized": True,
                "quality_score": 87.5,
                "ai_detection_score": 12.3,
                "burstiness_score": 8.2,
                "generation_time_ms": 3420
            }
        }


class HumanizeRequest(BaseModel):
    """Request model for humanizing existing text"""
    text: str = Field(..., min_length=50, description="Text to humanize")
    discipline: Optional[DisciplineEnum] = Field(None, description="Academic discipline (optional)")
    intensity: float = Field(default=1.0, ge=0.0, le=2.0, description="Humanization intensity (0=none, 1=normal, 2=aggressive)")

    class Config:
        json_schema_extra = {
            "example": {
                "text": "The implementation of renewable energy sources is crucial for sustainable development...",
                "discipline": "INGENIERIA",
                "intensity": 1.0
            }
        }


class HumanizeResponse(BaseModel):
    """Response model for humanization"""
    original_text: str = Field(..., description="Original text")
    humanized_text: str = Field(..., description="Humanized text")
    changes_made: int = Field(..., description="Number of humanization changes applied")
    burstiness_before: float = Field(..., description="Burstiness score before")
    burstiness_after: float = Field(..., description="Burstiness score after")
    ai_detection_before: Optional[float] = Field(None, description="AI detection score before")
    ai_detection_after: Optional[float] = Field(None, description="AI detection score after")
    processing_time_ms: int = Field(..., description="Processing time in milliseconds")


class VectorizeRequest(BaseModel):
    """Request model for document vectorization"""
    text: str = Field(..., min_length=100, description="Text to vectorize")
    discipline: DisciplineEnum = Field(..., description="Academic discipline")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional metadata")
    document_id: Optional[str] = Field(None, description="Optional document ID")

    class Config:
        json_schema_extra = {
            "example": {
                "text": "Este documento trata sobre energías renovables...",
                "discipline": "INGENIERIA",
                "metadata": {
                    "author": "Dr. Juan Pérez",
                    "university": "UASD",
                    "year": 2024
                }
            }
        }


class VectorizeResponse(BaseModel):
    """Response model for vectorization"""
    document_id: str = Field(..., description="Document ID")
    chunks_created: int = Field(..., description="Number of chunks created")
    vectors_stored: int = Field(..., description="Number of vectors stored")
    collection: str = Field(..., description="Collection name")
    processing_time_ms: int = Field(..., description="Processing time in milliseconds")


class SearchRequest(BaseModel):
    """Request model for semantic search"""
    query: str = Field(..., min_length=5, description="Search query")
    discipline: Optional[DisciplineEnum] = Field(None, description="Filter by discipline")
    top_k: int = Field(default=5, ge=1, le=20, description="Number of results to return")
    similarity_threshold: Optional[float] = Field(default=0.7, ge=0.0, le=1.0, description="Minimum similarity score")

    class Config:
        json_schema_extra = {
            "example": {
                "query": "energías renovables en República Dominicana",
                "discipline": "INGENIERIA",
                "top_k": 5,
                "similarity_threshold": 0.7
            }
        }


class SearchResult(BaseModel):
    """Individual search result"""
    document_id: str = Field(..., description="Document ID")
    text: str = Field(..., description="Relevant text chunk")
    similarity_score: float = Field(..., description="Similarity score (0-1)")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Document metadata")


class SearchResponse(BaseModel):
    """Response model for semantic search"""
    query: str = Field(..., description="Original query")
    results: List[SearchResult] = Field(..., description="Search results")
    total_results: int = Field(..., description="Total number of results")
    search_time_ms: int = Field(..., description="Search time in milliseconds")


class CorpusStats(BaseModel):
    """Corpus statistics"""
    total_documents: int = Field(..., description="Total documents in corpus")
    total_chunks: int = Field(..., description="Total chunks/vectors")
    documents_by_discipline: Dict[str, int] = Field(..., description="Documents per discipline")
    total_words: int = Field(..., description="Total words in corpus")
    last_updated: Optional[datetime] = Field(None, description="Last update timestamp")


class ModelInfo(BaseModel):
    """Model information"""
    name: str = Field(..., description="Model name")
    size: Optional[str] = Field(None, description="Model size")
    family: Optional[str] = Field(None, description="Model family")
    parameter_size: Optional[str] = Field(None, description="Parameter count")
    quantization: Optional[str] = Field(None, description="Quantization level")
    available: bool = Field(..., description="Whether model is available")


class ModelListResponse(BaseModel):
    """Response for listing models"""
    models: List[ModelInfo] = Field(..., description="Available models")
    default_model: str = Field(..., description="Default model name")
    total_models: int = Field(..., description="Total number of models")


class HealthStatus(BaseModel):
    """Health check status"""
    status: str = Field(..., description="Overall status (healthy/degraded/unhealthy)")
    ai_engine: str = Field(..., description="AI Engine status")
    ollama: str = Field(..., description="Ollama connection status")
    chromadb: str = Field(..., description="ChromaDB connection status")
    postgres: Optional[str] = Field(None, description="PostgreSQL connection status")
    redis: Optional[str] = Field(None, description="Redis connection status")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Check timestamp")
    version: str = Field(..., description="Application version")


class StreamChunk(BaseModel):
    """Streaming response chunk"""
    chunk: str = Field(..., description="Text chunk")
    done: bool = Field(default=False, description="Whether generation is complete")
    word_count: Optional[int] = Field(None, description="Current word count")

    class Config:
        json_schema_extra = {
            "example": {
                "chunk": "Las energías renovables",
                "done": False,
                "word_count": 3
            }
        }


class FeedbackRequest(BaseModel):
    """User feedback on generated text"""
    generation_id: Optional[str] = Field(None, description="Generation ID if tracked")
    text: str = Field(..., description="Generated text that received feedback")
    rating: int = Field(..., ge=1, le=5, description="User rating (1-5)")
    issues: Optional[List[str]] = Field(None, description="List of issues identified")
    corrected_text: Optional[str] = Field(None, description="User's corrected version")
    comments: Optional[str] = Field(None, description="Additional comments")

    class Config:
        json_schema_extra = {
            "example": {
                "text": "Las energías renovables...",
                "rating": 4,
                "issues": ["too formal", "needs more local context"],
                "comments": "Good overall but could be more natural"
            }
        }


class FeedbackResponse(BaseModel):
    """Feedback submission response"""
    feedback_id: str = Field(..., description="Feedback ID")
    received: bool = Field(..., description="Whether feedback was received")
    will_retrain: bool = Field(..., description="Whether this will trigger retraining")
    message: str = Field(..., description="Response message")


class PlagiarismCheckRequest(BaseModel):
    """Request model for plagiarism check"""
    text: str = Field(..., min_length=100, description="Text to check for plagiarism")
    generation_id: Optional[str] = Field(None, description="Optional generation ID")
    top_sources: int = Field(default=5, ge=1, le=10, description="Number of top sources to return")
    similarity_threshold: float = Field(default=0.25, ge=0.0, le=1.0, description="Minimum similarity threshold")
    include_passages: bool = Field(default=True, description="Include highlighted passages")

    class Config:
        json_schema_extra = {
            "example": {
                "text": "Las energías renovables representan una alternativa...",
                "top_sources": 5,
                "similarity_threshold": 0.25,
                "include_passages": True
            }
        }


class SourceMatch(BaseModel):
    """Individual source match"""
    source_id: str = Field(..., description="Source document ID")
    title: str = Field(..., description="Source title")
    authors: List[str] = Field(default_factory=list, description="Source authors")
    year: Optional[int] = Field(None, description="Publication year")
    institution: Optional[str] = Field(None, description="Institution")
    similarity_percentage: float = Field(..., description="Similarity percentage")
    match_count: int = Field(..., description="Number of matches")
    matched_passages: List[Dict[str, Any]] = Field(default_factory=list, description="Matched text passages")


class PlagiarismCheckResponse(BaseModel):
    """Response model for plagiarism check"""
    report_id: str = Field(..., description="Report ID")
    overall_similarity: float = Field(..., description="Overall similarity score (0-1)")
    similarity_percentage: float = Field(..., description="Similarity percentage")
    risk_level: str = Field(..., description="Risk level (SAFE/MODERATE/HIGH)")
    summary: str = Field(..., description="Report summary")
    top_sources: List[Dict[str, Any]] = Field(..., description="Top matching sources")
    statistics: Dict[str, Any] = Field(..., description="Detailed statistics")
    exact_matches_count: int = Field(..., description="Number of exact matches")
    highlighted_passages: List[Dict[str, Any]] = Field(default_factory=list, description="Highlighted passages")
    processing_time_ms: int = Field(..., description="Processing time in milliseconds")

    class Config:
        json_schema_extra = {
            "example": {
                "report_id": "report_20240119_123456",
                "overall_similarity": 0.23,
                "similarity_percentage": 23.0,
                "risk_level": "MODERATE",
                "summary": "The text shows moderate similarity...",
                "top_sources": [],
                "statistics": {},
                "exact_matches_count": 2,
                "highlighted_passages": [],
                "processing_time_ms": 1234
            }
        }


class FindSourcesRequest(BaseModel):
    """Request model for finding similar sources"""
    text: str = Field(..., min_length=50, description="Query text")
    top_k: int = Field(default=5, ge=1, le=20, description="Number of sources to return")
    discipline: Optional[DisciplineEnum] = Field(None, description="Filter by discipline")

    class Config:
        json_schema_extra = {
            "example": {
                "text": "energías renovables en República Dominicana",
                "top_k": 5,
                "discipline": "INGENIERIA"
            }
        }


class SourceDetails(BaseModel):
    """Detailed source information"""
    source_id: str = Field(..., description="Source document ID")
    title: str = Field(..., description="Source title")
    authors: List[str] = Field(default_factory=list, description="Authors")
    year: Optional[int] = Field(None, description="Publication year")
    institution: Optional[str] = Field(None, description="Institution")
    discipline: Optional[str] = Field(None, description="Discipline")
    similarity_percentage: float = Field(..., description="Similarity percentage")
    citation: str = Field(..., description="Formatted citation")
    matched_text: Optional[str] = Field(None, description="Matched text excerpt")


class FindSourcesResponse(BaseModel):
    """Response model for source finding"""
    sources: List[SourceDetails] = Field(..., description="Found sources")
    total_found: int = Field(..., description="Total sources found")
    query_text: str = Field(..., description="Original query")


class ReportExportRequest(BaseModel):
    """Request model for report export"""
    report_data: Dict[str, Any] = Field(..., description="Report data to export")
    format: str = Field(default="json", description="Export format (json/text/html)")

    class Config:
        json_schema_extra = {
            "example": {
                "report_data": {},
                "format": "json"
            }
        }
