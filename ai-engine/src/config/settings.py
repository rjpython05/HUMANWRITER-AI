from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Application
    app_name: str = "HumanWriter AI Engine"
    version: str = "1.0.0"
    debug: bool = False

    # Server
    host: str = "0.0.0.0"
    port: int = 8001
    workers: int = 1

    # CORS - Allowed origins (comma-separated)
    env_origins: Optional[str] = None
    
    # Ollama
    ollama_host: str = "http://localhost:11434"
    model_name: str = "llama3.1:8b"
    model_temperature: float = 0.7
    model_top_p: float = 0.9
    model_max_tokens: int = 4096
    
    # ChromaDB
    chromadb_host: str = "localhost"
    chromadb_port: int = 8000
    chromadb_collection: str = "corpus_full"
    
    # PostgreSQL
    postgres_url: str = "postgresql://humanwriter:dev_password@localhost:5432/humanwriter_db"
    
    # Redis
    redis_url: str = "redis://localhost:6379"
    redis_ttl: int = 3600  # 1 hour cache
    
    # Generation settings
    default_max_words: int = 1000
    min_words: int = 100
    max_words: int = 5000
    
    # Humanization settings
    burstiness_target: float = 8.0
    colloquialism_frequency: float = 0.05
    thinking_marker_frequency: float = 0.03
    approximator_frequency: float = 0.08
    uncertainty_frequency: float = 0.04
    imperfection_frequency: float = 0.05
    
    # RAG settings
    rag_top_k: int = 5
    rag_similarity_threshold: float = 0.7
    
    # Fine-tuning
    fine_tune_threshold: int = 50  # Documents before triggering
    
    # Logging
    log_level: str = "INFO"
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
