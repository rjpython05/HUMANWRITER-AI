"""
Model/voice selector based on academic discipline
Maps disciplines to specialized models or configurations
"""
from typing import Dict, Any
from loguru import logger

from ..config.settings import settings


# Model mapping for different disciplines
# In a production system, you might have fine-tuned models per discipline
DISCIPLINE_MODEL_MAP = {
    "INGENIERIA": {
        "model": "llama3.1:8b",  # Base model for engineering
        "temperature": 0.7,
        "top_p": 0.9,
        "description": "Engineering and technical writing model"
    },
    "CIENCIAS_SOCIALES": {
        "model": "llama3.1:8b",  # Same base model but different temperature
        "temperature": 0.8,  # Slightly higher for more creative social analysis
        "top_p": 0.9,
        "description": "Social sciences and humanities model"
    },
    "EXACTAS_NATURALES": {
        "model": "llama3.1:8b",
        "temperature": 0.6,  # Lower for more precise scientific writing
        "top_p": 0.85,
        "description": "Exact and natural sciences model"
    },
    "AGRARIAS": {
        "model": "llama3.1:8b",
        "temperature": 0.75,
        "top_p": 0.9,
        "description": "Agricultural sciences model"
    },
}

# Fallback model configuration
DEFAULT_MODEL_CONFIG = {
    "model": settings.model_name,
    "temperature": settings.model_temperature,
    "top_p": settings.model_top_p,
    "description": "Default general-purpose model"
}


class VoiceSelector:
    """
    Selects appropriate model and configuration based on discipline
    """

    def __init__(self):
        """Initialize voice selector"""
        logger.info("Initialized VoiceSelector")

    def select_model(self, discipline: str) -> Dict[str, Any]:
        """
        Select model configuration for given discipline

        Args:
            discipline: Academic discipline (e.g., "INGENIERIA")

        Returns:
            Dictionary with model configuration:
            - model: Model name
            - temperature: Temperature setting
            - top_p: Top-p sampling parameter
            - description: Model description
        """
        # Get model configuration for discipline
        config = DISCIPLINE_MODEL_MAP.get(discipline, DEFAULT_MODEL_CONFIG)

        logger.info(
            f"Selected model for {discipline}: "
            f"{config['model']} "
            f"(temp={config['temperature']}, top_p={config['top_p']})"
        )

        return config

    def get_all_models(self) -> Dict[str, Dict[str, Any]]:
        """
        Get all available model configurations

        Returns:
            Dictionary mapping disciplines to model configurations
        """
        return DISCIPLINE_MODEL_MAP.copy()

    def add_custom_model(
        self,
        discipline: str,
        model: str,
        temperature: float = 0.7,
        top_p: float = 0.9,
        description: str = None
    ) -> None:
        """
        Add or update custom model configuration for a discipline

        Args:
            discipline: Academic discipline
            model: Model name
            temperature: Temperature setting
            top_p: Top-p sampling parameter
            description: Model description
        """
        DISCIPLINE_MODEL_MAP[discipline] = {
            "model": model,
            "temperature": temperature,
            "top_p": top_p,
            "description": description or f"Custom model for {discipline}"
        }

        logger.info(f"Added custom model for {discipline}: {model}")

    def get_model_for_discipline(self, discipline: str) -> str:
        """
        Get just the model name for a discipline

        Args:
            discipline: Academic discipline

        Returns:
            Model name string
        """
        config = self.select_model(discipline)
        return config["model"]

    def get_temperature_for_discipline(self, discipline: str) -> float:
        """
        Get temperature setting for a discipline

        Args:
            discipline: Academic discipline

        Returns:
            Temperature value
        """
        config = self.select_model(discipline)
        return config["temperature"]

    def get_top_p_for_discipline(self, discipline: str) -> float:
        """
        Get top_p setting for a discipline

        Args:
            discipline: Academic discipline

        Returns:
            Top-p value
        """
        config = self.select_model(discipline)
        return config["top_p"]

    def supports_discipline(self, discipline: str) -> bool:
        """
        Check if a discipline is supported

        Args:
            discipline: Academic discipline

        Returns:
            True if discipline has a specific model, False otherwise
        """
        return discipline in DISCIPLINE_MODEL_MAP


# Global instance
_voice_selector = None


def get_voice_selector() -> VoiceSelector:
    """
    Get or create global VoiceSelector instance

    Returns:
        VoiceSelector instance
    """
    global _voice_selector
    if _voice_selector is None:
        _voice_selector = VoiceSelector()
    return _voice_selector
