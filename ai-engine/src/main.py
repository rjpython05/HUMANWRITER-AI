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

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
