from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import uvicorn
from loguru import logger
import sys

from .config.settings import settings
from .api.routes import health, models
from .api.routes import verification

# Try to import generation and corpus if they exist
try:
    from .api.routes import generation, corpus
    HAS_GENERATION = True
except ImportError:
    HAS_GENERATION = False

# Configure logger
logger.remove()
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan> - <level>{message}</level>",
    level=settings.log_level
)

# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    description="AI Engine for HumanWriter - Academic text generation with humanization",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware - Restricted for security
# In production, only allow requests from the backend API
allowed_origins = [
    "http://localhost:3000",  # Frontend
    "http://localhost:3001",  # Backend API
]

# Add production origins from environment
if settings.env_origins:
    allowed_origins.extend(settings.env_origins.split(','))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if settings.debug else allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type", "Authorization", "X-API-Key"],
    max_age=3600,  # Cache preflight requests for 1 hour
)

# Include routers
app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(models.router, prefix="/models", tags=["Models"])
app.include_router(verification.router, prefix="/verification", tags=["Verification"])

# Include generation and corpus routers if available
if HAS_GENERATION:
    app.include_router(generation.router, prefix="/generate", tags=["Generation"])
    app.include_router(corpus.router, prefix="/corpus", tags=["Corpus"])

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info(f"Starting {settings.app_name} v{settings.version}")
    logger.info(f"Ollama host: {settings.ollama_host}")
    logger.info(f"ChromaDB: {settings.chromadb_host}:{settings.chromadb_port}")
    
    # TODO: Verify Ollama connection
    # TODO: Verify ChromaDB connection
    # TODO: Preload models if configured

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down AI Engine")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": settings.app_name,
        "version": settings.version,
        "status": "running",
        "docs": "/docs"
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        workers=settings.workers,
    )
