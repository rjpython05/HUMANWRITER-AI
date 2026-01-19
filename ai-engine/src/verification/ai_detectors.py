"""
AI Detector Integration Module

Integrates with external AI detection services:
- GPTZero
- ZeroGPT
- Copyleaks
- Winston AI

Aggregates results to provide comprehensive AI detection reports.
"""
import asyncio
import os
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
from datetime import datetime

import aiohttp
from loguru import logger

from ..config.settings import settings


@dataclass
class DetectionResult:
    """Individual detector result"""
    detector: str
    score: float  # 0-100, higher = more likely AI-generated
    confidence: float  # 0-1, confidence in the score
    success: bool
    error_message: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    timestamp: datetime = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.utcnow()


@dataclass
class AggregatedDetectionReport:
    """Aggregated results from all detectors"""
    text: str
    results: List[DetectionResult]
    average_score: float
    weighted_score: float
    consensus_score: float  # Score based on agreement between detectors
    total_detectors: int
    successful_detectors: int
    timestamp: datetime = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.utcnow()


class AIDetectorService:
    """
    Service for running AI detection checks using multiple external APIs
    """

    def __init__(self):
        """Initialize AI detector service with API keys from environment"""
        self.gptzero_api_key = os.getenv("GPTZERO_API_KEY")
        self.zerogpt_api_key = os.getenv("ZEROGPT_API_KEY")
        self.copyleaks_api_key = os.getenv("COPYLEAKS_API_KEY")
        self.copyleaks_api_email = os.getenv("COPYLEAKS_API_EMAIL")
        self.winston_api_key = os.getenv("WINSTON_API_KEY")

        # Timeout for API calls (seconds)
        self.timeout = aiohttp.ClientTimeout(total=30)

        logger.info("AI Detector Service initialized")
        self._log_available_detectors()

    def _log_available_detectors(self):
        """Log which detectors are available based on API keys"""
        available = []
        if self.gptzero_api_key:
            available.append("GPTZero")
        if self.zerogpt_api_key:
            available.append("ZeroGPT")
        if self.copyleaks_api_key and self.copyleaks_api_email:
            available.append("Copyleaks")
        if self.winston_api_key:
            available.append("Winston AI")

        logger.info(f"Available AI detectors: {', '.join(available) if available else 'None'}")

    async def verify_text(self, text: str) -> AggregatedDetectionReport:
        """
        Run AI detection on text using all available detectors

        Args:
            text: The text to verify

        Returns:
            AggregatedDetectionReport with results from all detectors
        """
        if not text or len(text.strip()) < 50:
            raise ValueError("Text must be at least 50 characters long")

        logger.info(f"Starting AI detection for text ({len(text)} chars)")

        # Run all detectors in parallel
        tasks = []

        if self.gptzero_api_key:
            tasks.append(self._check_gptzero(text))
        if self.zerogpt_api_key:
            tasks.append(self._check_zerogpt(text))
        if self.copyleaks_api_key and self.copyleaks_api_email:
            tasks.append(self._check_copyleaks(text))
        if self.winston_api_key:
            tasks.append(self._check_winston(text))

        if not tasks:
            logger.warning("No AI detectors available - no API keys configured")
            # Return a result with no successful detections
            return AggregatedDetectionReport(
                text=text[:500],  # Store preview
                results=[],
                average_score=0.0,
                weighted_score=0.0,
                consensus_score=0.0,
                total_detectors=0,
                successful_detectors=0
            )

        # Wait for all results
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Process results
        detection_results = []
        for result in results:
            if isinstance(result, Exception):
                logger.error(f"Detector task failed: {result}")
            elif isinstance(result, DetectionResult):
                detection_results.append(result)

        # Calculate aggregated scores
        successful_results = [r for r in detection_results if r.success]

        if not successful_results:
            logger.warning("No successful AI detections")
            return AggregatedDetectionReport(
                text=text[:500],
                results=detection_results,
                average_score=0.0,
                weighted_score=0.0,
                consensus_score=0.0,
                total_detectors=len(detection_results),
                successful_detectors=0
            )

        # Calculate scores
        average_score = sum(r.score for r in successful_results) / len(successful_results)

        # Weighted score (weight by confidence)
        total_confidence = sum(r.confidence for r in successful_results)
        if total_confidence > 0:
            weighted_score = sum(r.score * r.confidence for r in successful_results) / total_confidence
        else:
            weighted_score = average_score

        # Consensus score (how much do detectors agree?)
        scores = [r.score for r in successful_results]
        if len(scores) > 1:
            # Calculate standard deviation
            mean = sum(scores) / len(scores)
            variance = sum((x - mean) ** 2 for x in scores) / len(scores)
            std_dev = variance ** 0.5
            # Consensus is high when std_dev is low
            # Normalize std_dev (assume max std_dev of 30 for AI detection scores)
            consensus_score = max(0, 100 - (std_dev / 30 * 100))
        else:
            consensus_score = 100.0  # Single detector = full consensus

        logger.info(
            f"AI Detection complete: avg={average_score:.2f}, "
            f"weighted={weighted_score:.2f}, consensus={consensus_score:.2f}"
        )

        return AggregatedDetectionReport(
            text=text[:500],  # Store preview
            results=detection_results,
            average_score=average_score,
            weighted_score=weighted_score,
            consensus_score=consensus_score,
            total_detectors=len(detection_results),
            successful_detectors=len(successful_results)
        )

    async def _check_gptzero(self, text: str) -> DetectionResult:
        """
        Check text using GPTZero API

        API Docs: https://gptzero.me/docs
        """
        try:
            logger.info("Checking with GPTZero...")

            headers = {
                "X-Api-Key": self.gptzero_api_key,
                "Content-Type": "application/json"
            }

            payload = {
                "document": text,
                "version": "2024-01-09"
            }

            async with aiohttp.ClientSession(timeout=self.timeout) as session:
                async with session.post(
                    "https://api.gptzero.me/v2/predict/text",
                    json=payload,
                    headers=headers
                ) as response:
                    if response.status == 200:
                        data = await response.json()

                        # GPTZero returns completely_generated_prob (0-1)
                        ai_probability = data.get("documents", [{}])[0].get("completely_generated_prob", 0)
                        score = ai_probability * 100  # Convert to 0-100

                        # Confidence based on perplexity and burstiness
                        average_perplexity = data.get("documents", [{}])[0].get("average_generated_prob", 0.5)
                        confidence = abs(average_perplexity - 0.5) * 2  # 0-1 scale

                        logger.info(f"GPTZero result: score={score:.2f}, confidence={confidence:.2f}")

                        return DetectionResult(
                            detector="GPTZero",
                            score=score,
                            confidence=confidence,
                            success=True,
                            details={
                                "completely_generated_prob": ai_probability,
                                "average_generated_prob": average_perplexity,
                                "class_probabilities": data.get("documents", [{}])[0].get("class_probabilities", {})
                            }
                        )
                    else:
                        error_text = await response.text()
                        logger.error(f"GPTZero API error: {response.status} - {error_text}")
                        return DetectionResult(
                            detector="GPTZero",
                            score=0,
                            confidence=0,
                            success=False,
                            error_message=f"API error: {response.status}"
                        )

        except asyncio.TimeoutError:
            logger.error("GPTZero request timed out")
            return DetectionResult(
                detector="GPTZero",
                score=0,
                confidence=0,
                success=False,
                error_message="Request timed out"
            )
        except Exception as e:
            logger.error(f"GPTZero error: {e}")
            return DetectionResult(
                detector="GPTZero",
                score=0,
                confidence=0,
                success=False,
                error_message=str(e)
            )

    async def _check_zerogpt(self, text: str) -> DetectionResult:
        """
        Check text using ZeroGPT API

        API Docs: https://zerogpt.com/api
        """
        try:
            logger.info("Checking with ZeroGPT...")

            headers = {
                "ApiKey": self.zerogpt_api_key,
                "Content-Type": "application/json"
            }

            payload = {
                "input_text": text
            }

            async with aiohttp.ClientSession(timeout=self.timeout) as session:
                async with session.post(
                    "https://api.zerogpt.com/api/detect/detectText",
                    json=payload,
                    headers=headers
                ) as response:
                    if response.status == 200:
                        data = await response.json()

                        # ZeroGPT returns data with fakePercentage and isHuman
                        fake_percentage = data.get("data", {}).get("fakePercentage", 0)
                        is_human = data.get("data", {}).get("isHuman", True)

                        score = fake_percentage  # Already 0-100
                        confidence = 0.8 if not is_human else 0.6  # Higher confidence for AI detection

                        logger.info(f"ZeroGPT result: score={score:.2f}, is_human={is_human}")

                        return DetectionResult(
                            detector="ZeroGPT",
                            score=score,
                            confidence=confidence,
                            success=True,
                            details={
                                "fake_percentage": fake_percentage,
                                "is_human": is_human,
                                "text_words": data.get("data", {}).get("textWords", 0),
                                "h": data.get("data", {}).get("h", [])
                            }
                        )
                    else:
                        error_text = await response.text()
                        logger.error(f"ZeroGPT API error: {response.status} - {error_text}")
                        return DetectionResult(
                            detector="ZeroGPT",
                            score=0,
                            confidence=0,
                            success=False,
                            error_message=f"API error: {response.status}"
                        )

        except asyncio.TimeoutError:
            logger.error("ZeroGPT request timed out")
            return DetectionResult(
                detector="ZeroGPT",
                score=0,
                confidence=0,
                success=False,
                error_message="Request timed out"
            )
        except Exception as e:
            logger.error(f"ZeroGPT error: {e}")
            return DetectionResult(
                detector="ZeroGPT",
                score=0,
                confidence=0,
                success=False,
                error_message=str(e)
            )

    async def _check_copyleaks(self, text: str) -> DetectionResult:
        """
        Check text using Copyleaks AI Content Detector API

        API Docs: https://api.copyleaks.com/documentation/v3/ai-content-detector
        """
        try:
            logger.info("Checking with Copyleaks...")

            # First, get access token
            auth_headers = {
                "Content-Type": "application/json"
            }

            auth_payload = {
                "email": self.copyleaks_api_email,
                "key": self.copyleaks_api_key
            }

            async with aiohttp.ClientSession(timeout=self.timeout) as session:
                # Get token
                async with session.post(
                    "https://id.copyleaks.com/v3/account/login/api",
                    json=auth_payload,
                    headers=auth_headers
                ) as auth_response:
                    if auth_response.status != 200:
                        error_text = await auth_response.text()
                        logger.error(f"Copyleaks auth error: {auth_response.status} - {error_text}")
                        return DetectionResult(
                            detector="Copyleaks",
                            score=0,
                            confidence=0,
                            success=False,
                            error_message=f"Auth error: {auth_response.status}"
                        )

                    auth_data = await auth_response.json()
                    access_token = auth_data.get("access_token")

                # Submit text for analysis
                headers = {
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json"
                }

                payload = {
                    "text": text,
                    "sandbox": True  # Use sandbox mode for testing
                }

                async with session.post(
                    "https://api.copyleaks.com/v2/writer-detector/detect",
                    json=payload,
                    headers=headers
                ) as response:
                    if response.status == 200:
                        data = await response.json()

                        # Copyleaks returns ai_score (0-100)
                        ai_score = data.get("summary", {}).get("ai", 0)
                        human_score = data.get("summary", {}).get("human", 0)

                        score = ai_score  # Already 0-100
                        confidence = 0.85  # Copyleaks is generally reliable

                        logger.info(f"Copyleaks result: ai_score={ai_score:.2f}, human_score={human_score:.2f}")

                        return DetectionResult(
                            detector="Copyleaks",
                            score=score,
                            confidence=confidence,
                            success=True,
                            details={
                                "ai_score": ai_score,
                                "human_score": human_score,
                                "mixed_score": data.get("summary", {}).get("mixed", 0)
                            }
                        )
                    else:
                        error_text = await response.text()
                        logger.error(f"Copyleaks API error: {response.status} - {error_text}")
                        return DetectionResult(
                            detector="Copyleaks",
                            score=0,
                            confidence=0,
                            success=False,
                            error_message=f"API error: {response.status}"
                        )

        except asyncio.TimeoutError:
            logger.error("Copyleaks request timed out")
            return DetectionResult(
                detector="Copyleaks",
                score=0,
                confidence=0,
                success=False,
                error_message="Request timed out"
            )
        except Exception as e:
            logger.error(f"Copyleaks error: {e}")
            return DetectionResult(
                detector="Copyleaks",
                score=0,
                confidence=0,
                success=False,
                error_message=str(e)
            )

    async def _check_winston(self, text: str) -> DetectionResult:
        """
        Check text using Winston AI API

        API Docs: https://docs.gowinston.ai/
        """
        try:
            logger.info("Checking with Winston AI...")

            headers = {
                "Authorization": f"Bearer {self.winston_api_key}",
                "Content-Type": "application/json"
            }

            payload = {
                "text": text,
                "language": "es",  # Spanish by default for HumanWriter AI
                "sentences": True,
                "version": "3.0"
            }

            async with aiohttp.ClientSession(timeout=self.timeout) as session:
                async with session.post(
                    "https://api.gowinston.ai/v3/predict",
                    json=payload,
                    headers=headers
                ) as response:
                    if response.status == 200:
                        data = await response.json()

                        # Winston returns score (0-100, higher = more AI)
                        ai_score = data.get("score", 0)
                        prediction = data.get("prediction", "HUMAN")

                        score = ai_score  # Already 0-100
                        confidence = 0.9 if prediction != "UNDETERMINED" else 0.5

                        logger.info(f"Winston AI result: score={ai_score:.2f}, prediction={prediction}")

                        return DetectionResult(
                            detector="Winston AI",
                            score=score,
                            confidence=confidence,
                            success=True,
                            details={
                                "score": ai_score,
                                "prediction": prediction,
                                "model_version": data.get("model_version"),
                                "word_count": data.get("word_count", 0)
                            }
                        )
                    else:
                        error_text = await response.text()
                        logger.error(f"Winston AI API error: {response.status} - {error_text}")
                        return DetectionResult(
                            detector="Winston AI",
                            score=0,
                            confidence=0,
                            success=False,
                            error_message=f"API error: {response.status}"
                        )

        except asyncio.TimeoutError:
            logger.error("Winston AI request timed out")
            return DetectionResult(
                detector="Winston AI",
                score=0,
                confidence=0,
                success=False,
                error_message="Request timed out"
            )
        except Exception as e:
            logger.error(f"Winston AI error: {e}")
            return DetectionResult(
                detector="Winston AI",
                score=0,
                confidence=0,
                success=False,
                error_message=str(e)
            )


# Singleton instance
_detector_service: Optional[AIDetectorService] = None


def get_detector_service() -> AIDetectorService:
    """Get or create the AI detector service singleton"""
    global _detector_service
    if _detector_service is None:
        _detector_service = AIDetectorService()
    return _detector_service
