"""
Ollama API client for text generation
"""
import httpx
import asyncio
import json
from typing import AsyncGenerator, Optional, Dict, Any
from loguru import logger
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from ..config.settings import settings


class OllamaError(Exception):
    """Custom exception for Ollama-related errors"""
    pass


class OllamaClient:
    """Client for interacting with Ollama API"""

    def __init__(
        self,
        host: str = None,
        timeout: int = 300,
        max_retries: int = 3
    ):
        """
        Initialize Ollama client

        Args:
            host: Ollama API host URL
            timeout: Request timeout in seconds
            max_retries: Maximum number of retry attempts
        """
        self.host = host or settings.ollama_host
        self.timeout = timeout
        self.max_retries = max_retries

        # Remove trailing slash from host
        self.host = self.host.rstrip('/')

        logger.info(f"Initialized OllamaClient with host: {self.host}")

    async def _request(
        self,
        method: str,
        endpoint: str,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Make HTTP request to Ollama API

        Args:
            method: HTTP method
            endpoint: API endpoint
            **kwargs: Additional request parameters

        Returns:
            Response JSON

        Raises:
            OllamaError: If request fails
        """
        url = f"{self.host}{endpoint}"

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.request(method, url, **kwargs)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                logger.error(f"Ollama request failed: {e}")
                raise OllamaError(f"Request to Ollama failed: {str(e)}")
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse Ollama response: {e}")
                raise OllamaError(f"Invalid JSON response from Ollama: {str(e)}")

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((OllamaError, httpx.HTTPError)),
        reraise=True
    )
    async def generate(
        self,
        prompt: str,
        model: str = None,
        temperature: float = None,
        top_p: float = None,
        max_tokens: int = None,
        system: str = None,
        **options
    ) -> str:
        """
        Generate text using Ollama

        Args:
            prompt: Generation prompt
            model: Model name (defaults to settings.model_name)
            temperature: Sampling temperature
            top_p: Top-p sampling parameter
            max_tokens: Maximum tokens to generate
            system: System prompt
            **options: Additional Ollama options

        Returns:
            Generated text

        Raises:
            OllamaError: If generation fails
        """
        model = model or settings.model_name
        temperature = temperature if temperature is not None else settings.model_temperature
        top_p = top_p if top_p is not None else settings.model_top_p
        max_tokens = max_tokens or settings.model_max_tokens

        payload = {
            "model": model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": temperature,
                "top_p": top_p,
                "num_predict": max_tokens,
                **options
            }
        }

        if system:
            payload["system"] = system

        logger.info(f"Generating with model {model}, temp={temperature}, max_tokens={max_tokens}")

        try:
            response = await self._request(
                "POST",
                "/api/generate",
                json=payload
            )

            generated_text = response.get("response", "")

            if not generated_text:
                logger.warning("Ollama returned empty response")
                raise OllamaError("Empty response from Ollama")

            logger.info(f"Generated {len(generated_text)} characters")
            return generated_text

        except Exception as e:
            logger.error(f"Generation failed: {e}")
            raise OllamaError(f"Failed to generate text: {str(e)}")

    async def generate_stream(
        self,
        prompt: str,
        model: str = None,
        temperature: float = None,
        top_p: float = None,
        max_tokens: int = None,
        system: str = None,
        **options
    ) -> AsyncGenerator[str, None]:
        """
        Generate text using Ollama with streaming

        Args:
            prompt: Generation prompt
            model: Model name
            temperature: Sampling temperature
            top_p: Top-p sampling parameter
            max_tokens: Maximum tokens to generate
            system: System prompt
            **options: Additional Ollama options

        Yields:
            Text chunks as they are generated

        Raises:
            OllamaError: If generation fails
        """
        model = model or settings.model_name
        temperature = temperature if temperature is not None else settings.model_temperature
        top_p = top_p if top_p is not None else settings.model_top_p
        max_tokens = max_tokens or settings.model_max_tokens

        payload = {
            "model": model,
            "prompt": prompt,
            "stream": True,
            "options": {
                "temperature": temperature,
                "top_p": top_p,
                "num_predict": max_tokens,
                **options
            }
        }

        if system:
            payload["system"] = system

        logger.info(f"Starting streaming generation with model {model}")

        url = f"{self.host}/api/generate"

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                async with client.stream("POST", url, json=payload) as response:
                    response.raise_for_status()

                    async for line in response.aiter_lines():
                        if not line.strip():
                            continue

                        try:
                            data = json.loads(line)

                            if "response" in data:
                                chunk = data["response"]
                                if chunk:
                                    yield chunk

                            # Check if generation is done
                            if data.get("done", False):
                                logger.info("Streaming generation completed")
                                break

                        except json.JSONDecodeError:
                            logger.warning(f"Failed to parse streaming chunk: {line}")
                            continue

        except httpx.HTTPError as e:
            logger.error(f"Streaming generation failed: {e}")
            raise OllamaError(f"Streaming generation failed: {str(e)}")

    async def list_models(self) -> list:
        """
        List available models

        Returns:
            List of available models

        Raises:
            OllamaError: If request fails
        """
        try:
            response = await self._request("GET", "/api/tags")
            models = response.get("models", [])
            logger.info(f"Found {len(models)} available models")
            return models
        except Exception as e:
            logger.error(f"Failed to list models: {e}")
            raise OllamaError(f"Failed to list models: {str(e)}")

    async def get_model_info(self, model_name: str) -> Dict[str, Any]:
        """
        Get information about a specific model

        Args:
            model_name: Name of the model

        Returns:
            Model information

        Raises:
            OllamaError: If request fails
        """
        try:
            response = await self._request(
                "POST",
                "/api/show",
                json={"name": model_name}
            )
            logger.info(f"Retrieved info for model: {model_name}")
            return response
        except Exception as e:
            logger.error(f"Failed to get model info: {e}")
            raise OllamaError(f"Failed to get model info: {str(e)}")

    async def check_health(self) -> bool:
        """
        Check if Ollama is healthy and accessible

        Returns:
            True if healthy, False otherwise
        """
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                response = await client.get(f"{self.host}/api/tags")
                return response.status_code == 200
        except Exception as e:
            logger.warning(f"Ollama health check failed: {e}")
            return False

    async def pull_model(self, model_name: str) -> None:
        """
        Pull/download a model

        Args:
            model_name: Name of the model to pull

        Raises:
            OllamaError: If pull fails
        """
        logger.info(f"Pulling model: {model_name}")

        try:
            await self._request(
                "POST",
                "/api/pull",
                json={"name": model_name}
            )
            logger.info(f"Successfully pulled model: {model_name}")
        except Exception as e:
            logger.error(f"Failed to pull model: {e}")
            raise OllamaError(f"Failed to pull model: {str(e)}")


# Global client instance
_ollama_client: Optional[OllamaClient] = None


def get_ollama_client() -> OllamaClient:
    """
    Get or create global Ollama client instance

    Returns:
        OllamaClient instance
    """
    global _ollama_client
    if _ollama_client is None:
        _ollama_client = OllamaClient()
    return _ollama_client
