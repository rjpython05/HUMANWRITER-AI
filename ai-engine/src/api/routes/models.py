"""
Models endpoint - List and get info about available models
"""
from fastapi import APIRouter, HTTPException, Path
from loguru import logger

from ...config.settings import settings
from ...generation.ollama_client import get_ollama_client
from ...generation.voice_selector import get_voice_selector
from ..schemas import ModelListResponse, ModelInfo

router = APIRouter()


@router.get("", response_model=ModelListResponse)
async def list_models():
    """
    List all available models from Ollama

    Returns:
        List of available models with metadata
    """
    logger.info("Listing available models")

    try:
        ollama_client = get_ollama_client()
        models_data = await ollama_client.list_models()

        # Convert to ModelInfo schema
        models = []
        for model_data in models_data:
            model_name = model_data.get("name", "unknown")

            # Extract model info
            model_info = ModelInfo(
                name=model_name,
                size=model_data.get("size", None),
                family=model_data.get("details", {}).get("family", None),
                parameter_size=model_data.get("details", {}).get("parameter_size", None),
                quantization=model_data.get("details", {}).get("quantization_level", None),
                available=True
            )
            models.append(model_info)

        logger.info(f"Found {len(models)} available models")

        return ModelListResponse(
            models=models,
            default_model=settings.model_name,
            total_models=len(models)
        )

    except Exception as e:
        logger.error(f"Failed to list models: {e}")
        raise HTTPException(
            status_code=503,
            detail=f"Failed to retrieve models: {str(e)}"
        )


@router.get("/{model_name:path}", response_model=ModelInfo)
async def get_model_info(
    model_name: str = Path(..., description="Model name")
):
    """
    Get detailed information about a specific model

    Args:
        model_name: Name of the model (e.g., "llama3.1:8b")

    Returns:
        Detailed model information
    """
    logger.info(f"Getting info for model: {model_name}")

    try:
        ollama_client = get_ollama_client()
        model_data = await ollama_client.get_model_info(model_name)

        # Parse model info
        details = model_data.get("details", {})

        model_info = ModelInfo(
            name=model_name,
            size=model_data.get("size"),
            family=details.get("family"),
            parameter_size=details.get("parameter_size"),
            quantization=details.get("quantization_level"),
            available=True
        )

        logger.info(f"Retrieved info for {model_name}")
        return model_info

    except Exception as e:
        logger.error(f"Failed to get model info for {model_name}: {e}")
        raise HTTPException(
            status_code=404,
            detail=f"Model not found or error retrieving info: {str(e)}"
        )


@router.get("/discipline-mapping")
async def get_discipline_mapping():
    """
    Get mapping of disciplines to models

    Returns:
        Dictionary mapping disciplines to their configured models
    """
    logger.info("Getting discipline to model mapping")

    try:
        voice_selector = get_voice_selector()
        mapping = voice_selector.get_all_models()

        # Format for response
        formatted_mapping = {}
        for discipline, config in mapping.items():
            formatted_mapping[discipline] = {
                "model": config["model"],
                "temperature": config["temperature"],
                "top_p": config["top_p"],
                "description": config.get("description", "")
            }

        logger.info(f"Retrieved mapping for {len(formatted_mapping)} disciplines")

        return {
            "discipline_models": formatted_mapping,
            "default_model": settings.model_name,
            "available_disciplines": list(formatted_mapping.keys())
        }

    except Exception as e:
        logger.error(f"Failed to get discipline mapping: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve discipline mapping: {str(e)}"
        )


@router.get("/discipline/{discipline}")
async def get_model_for_discipline(
    discipline: str = Path(..., description="Academic discipline")
):
    """
    Get the model configured for a specific discipline

    Args:
        discipline: Academic discipline (e.g., "INGENIERIA")

    Returns:
        Model configuration for the discipline
    """
    logger.info(f"Getting model for discipline: {discipline}")

    try:
        voice_selector = get_voice_selector()

        # Check if discipline is supported
        if not voice_selector.supports_discipline(discipline):
            available_disciplines = list(voice_selector.get_all_models().keys())
            raise HTTPException(
                status_code=404,
                detail=f"Discipline '{discipline}' not found. Available: {available_disciplines}"
            )

        model_config = voice_selector.select_model(discipline)

        logger.info(f"Retrieved model config for {discipline}: {model_config['model']}")

        return {
            "discipline": discipline,
            "model": model_config["model"],
            "temperature": model_config["temperature"],
            "top_p": model_config["top_p"],
            "description": model_config.get("description", "")
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get model for discipline {discipline}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve model configuration: {str(e)}"
        )


@router.post("/pull/{model_name:path}")
async def pull_model(
    model_name: str = Path(..., description="Model name to pull")
):
    """
    Pull/download a model from Ollama registry

    Args:
        model_name: Name of the model to pull

    Returns:
        Success message
    """
    logger.info(f"Pulling model: {model_name}")

    try:
        ollama_client = get_ollama_client()
        await ollama_client.pull_model(model_name)

        logger.info(f"Successfully pulled model: {model_name}")

        return {
            "success": True,
            "message": f"Model {model_name} pulled successfully",
            "model": model_name
        }

    except Exception as e:
        logger.error(f"Failed to pull model {model_name}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to pull model: {str(e)}"
        )
