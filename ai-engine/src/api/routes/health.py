"""
Health check endpoint
"""
from fastapi import APIRouter, HTTPException
from datetime import datetime
from loguru import logger

from ...config.settings import settings
from ...generation.ollama_client import get_ollama_client
from ...vectorization.chromadb_client import get_chromadb_client
from ..schemas import HealthStatus

router = APIRouter()


@router.get("", response_model=HealthStatus)
async def health_check():
    """
    Comprehensive health check for all services

    Returns:
        HealthStatus with status of all components
    """
    logger.info("Performing health check")

    # Initialize status
    statuses = {
        "ai_engine": "healthy",
        "ollama": "unknown",
        "chromadb": "unknown",
        "postgres": "unknown",
        "redis": "unknown"
    }

    # Check Ollama
    try:
        ollama_client = get_ollama_client()
        ollama_healthy = await ollama_client.check_health()

        if ollama_healthy:
            statuses["ollama"] = "healthy"
            logger.info("Ollama: healthy")
        else:
            statuses["ollama"] = "unhealthy"
            logger.warning("Ollama: unhealthy")

    except Exception as e:
        statuses["ollama"] = "unhealthy"
        logger.error(f"Ollama health check failed: {e}")

    # Check ChromaDB
    try:
        chroma_client = get_chromadb_client()
        chroma_healthy = chroma_client.check_health()

        if chroma_healthy:
            statuses["chromadb"] = "healthy"
            logger.info("ChromaDB: healthy")
        else:
            statuses["chromadb"] = "unhealthy"
            logger.warning("ChromaDB: unhealthy")

    except Exception as e:
        statuses["chromadb"] = "unhealthy"
        logger.error(f"ChromaDB health check failed: {e}")

    # Check PostgreSQL (optional - can add later)
    try:
        # TODO: Add PostgreSQL health check
        statuses["postgres"] = "not_checked"
    except Exception as e:
        statuses["postgres"] = "unhealthy"
        logger.error(f"PostgreSQL health check failed: {e}")

    # Check Redis (optional - can add later)
    try:
        # TODO: Add Redis health check
        statuses["redis"] = "not_checked"
    except Exception as e:
        statuses["redis"] = "unhealthy"
        logger.error(f"Redis health check failed: {e}")

    # Determine overall status
    critical_services = [statuses["ollama"], statuses["chromadb"]]

    if all(s == "healthy" for s in critical_services):
        overall_status = "healthy"
    elif any(s == "unhealthy" for s in critical_services):
        overall_status = "degraded"
    else:
        overall_status = "unhealthy"

    logger.info(f"Overall health status: {overall_status}")

    return HealthStatus(
        status=overall_status,
        ai_engine=statuses["ai_engine"],
        ollama=statuses["ollama"],
        chromadb=statuses["chromadb"],
        postgres=statuses["postgres"],
        redis=statuses["redis"],
        timestamp=datetime.utcnow(),
        version=settings.version
    )


@router.get("/ollama")
async def check_ollama():
    """
    Check Ollama service specifically

    Returns:
        Ollama service status
    """
    try:
        ollama_client = get_ollama_client()
        is_healthy = await ollama_client.check_health()

        if is_healthy:
            # Try to get list of models
            try:
                models = await ollama_client.list_models()
                return {
                    "status": "healthy",
                    "models_available": len(models),
                    "host": settings.ollama_host
                }
            except Exception as e:
                return {
                    "status": "degraded",
                    "message": "Connected but cannot list models",
                    "error": str(e)
                }
        else:
            return {
                "status": "unhealthy",
                "message": "Cannot connect to Ollama",
                "host": settings.ollama_host
            }

    except Exception as e:
        logger.error(f"Ollama health check failed: {e}")
        raise HTTPException(
            status_code=503,
            detail=f"Ollama service unavailable: {str(e)}"
        )


@router.get("/chromadb")
async def check_chromadb():
    """
    Check ChromaDB service specifically

    Returns:
        ChromaDB service status
    """
    try:
        chroma_client = get_chromadb_client()
        is_healthy = chroma_client.check_health()

        if is_healthy:
            # Try to get collections
            try:
                collections = chroma_client.list_collections()
                return {
                    "status": "healthy",
                    "collections": len(collections),
                    "collection_names": collections,
                    "host": f"{settings.chromadb_host}:{settings.chromadb_port}"
                }
            except Exception as e:
                return {
                    "status": "degraded",
                    "message": "Connected but cannot list collections",
                    "error": str(e)
                }
        else:
            return {
                "status": "unhealthy",
                "message": "Cannot connect to ChromaDB",
                "host": f"{settings.chromadb_host}:{settings.chromadb_port}"
            }

    except Exception as e:
        logger.error(f"ChromaDB health check failed: {e}")
        raise HTTPException(
            status_code=503,
            detail=f"ChromaDB service unavailable: {str(e)}"
        )


@router.get("/ready")
async def readiness_check():
    """
    Kubernetes-style readiness check

    Returns 200 if ready to serve requests, 503 otherwise
    """
    try:
        # Check critical services
        ollama_client = get_ollama_client()
        ollama_ready = await ollama_client.check_health()

        chroma_client = get_chromadb_client()
        chroma_ready = chroma_client.check_health()

        if ollama_ready and chroma_ready:
            return {"ready": True, "status": "ready"}
        else:
            raise HTTPException(
                status_code=503,
                detail="Service not ready"
            )

    except Exception as e:
        logger.error(f"Readiness check failed: {e}")
        raise HTTPException(
            status_code=503,
            detail="Service not ready"
        )


@router.get("/live")
async def liveness_check():
    """
    Kubernetes-style liveness check

    Returns 200 if application is alive
    """
    return {
        "alive": True,
        "status": "alive",
        "timestamp": datetime.utcnow()
    }
