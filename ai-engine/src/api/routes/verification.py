"""
AI Detection Verification Endpoints

Endpoints for verifying text with external AI detectors
and calculating safety scores.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

from loguru import logger

from ...verification.ai_detectors import get_detector_service, DetectionResult
from ...verification.safety_score import get_safety_calculator, RiskLevel

router = APIRouter()


# ==========================================
# REQUEST/RESPONSE MODELS
# ==========================================

class VerifyRequest(BaseModel):
    """Request model for text verification"""
    text: str = Field(..., min_length=50, description="Text to verify for AI detection")

    class Config:
        json_schema_extra = {
            "example": {
                "text": "Las energías renovables en República Dominicana representan una oportunidad..."
            }
        }


class DetectorResultResponse(BaseModel):
    """Individual detector result"""
    detector: str = Field(..., description="Detector name")
    score: float = Field(..., description="AI detection score (0-100, higher = more AI)")
    confidence: float = Field(..., description="Confidence in the score (0-1)")
    success: bool = Field(..., description="Whether detection was successful")
    error_message: Optional[str] = Field(None, description="Error message if failed")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional details")
    timestamp: datetime = Field(..., description="Timestamp of detection")


class VerifyResponse(BaseModel):
    """Response model for verification"""
    text_preview: str = Field(..., description="Preview of verified text")
    text_length: int = Field(..., description="Length of text in characters")

    # Detector results
    results: List[DetectorResultResponse] = Field(..., description="Individual detector results")
    total_detectors: int = Field(..., description="Total number of detectors")
    successful_detectors: int = Field(..., description="Number of successful detectors")

    # Aggregated scores
    average_score: float = Field(..., description="Average AI detection score")
    weighted_score: float = Field(..., description="Confidence-weighted AI detection score")
    consensus_score: float = Field(..., description="Agreement between detectors (0-100)")

    # Safety assessment
    safety_score: float = Field(..., description="Overall safety score (0-100, higher is better)")
    risk_level: str = Field(..., description="Risk level: LOW, MEDIUM, HIGH")
    confidence: float = Field(..., description="Confidence in assessment (0-1)")
    recommendations: List[str] = Field(..., description="Actionable recommendations")

    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Verification timestamp")

    class Config:
        json_schema_extra = {
            "example": {
                "text_preview": "Las energías renovables en República Dominicana...",
                "text_length": 1523,
                "results": [
                    {
                        "detector": "GPTZero",
                        "score": 23.5,
                        "confidence": 0.85,
                        "success": True,
                        "error_message": None,
                        "details": {},
                        "timestamp": "2024-01-15T10:30:00Z"
                    }
                ],
                "total_detectors": 3,
                "successful_detectors": 2,
                "average_score": 25.3,
                "weighted_score": 24.1,
                "consensus_score": 87.5,
                "safety_score": 78.5,
                "risk_level": "MEDIUM",
                "confidence": 0.82,
                "recommendations": [
                    "Consider re-humanizing for safer results",
                    "Add more transitional phrases"
                ],
                "timestamp": "2024-01-15T10:30:00Z"
            }
        }


class SafetyScoreRequest(BaseModel):
    """Request model for calculating safety score from existing detection scores"""
    average_ai_score: float = Field(..., ge=0, le=100, description="Average AI detection score")
    weighted_ai_score: Optional[float] = Field(None, ge=0, le=100, description="Weighted AI detection score")
    consensus_score: Optional[float] = Field(None, ge=0, le=100, description="Consensus score")
    detector_count: int = Field(default=1, ge=0, description="Number of detectors used")

    class Config:
        json_schema_extra = {
            "example": {
                "average_ai_score": 25.3,
                "weighted_ai_score": 24.1,
                "consensus_score": 87.5,
                "detector_count": 3
            }
        }


class SafetyScoreResponse(BaseModel):
    """Response model for safety score calculation"""
    safety_score: float = Field(..., description="Overall safety score (0-100)")
    risk_level: str = Field(..., description="Risk level: LOW, MEDIUM, HIGH")
    confidence: float = Field(..., description="Confidence in assessment (0-1)")
    recommendations: List[str] = Field(..., description="Actionable recommendations")
    factors: Dict[str, float] = Field(..., description="Individual factor scores")

    class Config:
        json_schema_extra = {
            "example": {
                "safety_score": 78.5,
                "risk_level": "MEDIUM",
                "confidence": 0.82,
                "recommendations": [
                    "Consider re-humanizing for safer results"
                ],
                "factors": {
                    "avg_detection_score": 74.7,
                    "weighted_detection_score": 75.9,
                    "consensus": 87.5,
                    "detector_coverage": 100.0,
                    "worst_case": 71.2
                }
            }
        }


# ==========================================
# ENDPOINTS
# ==========================================

@router.post("/verify", response_model=VerifyResponse)
async def verify_text(request: VerifyRequest):
    """
    Verify text with external AI detectors and calculate safety score

    This endpoint:
    1. Runs the text through all available AI detectors
    2. Aggregates the results
    3. Calculates a safety score
    4. Provides recommendations

    **Note:** Requires API keys for external detectors to be configured.
    Set environment variables:
    - GPTZERO_API_KEY
    - ZEROGPT_API_KEY
    - COPYLEAKS_API_KEY and COPYLEAKS_API_EMAIL
    - WINSTON_API_KEY

    Args:
        request: VerifyRequest with text to verify

    Returns:
        VerifyResponse with detection results and safety assessment

    Raises:
        HTTPException: If text is invalid or verification fails
    """
    try:
        logger.info(f"Verification requested for text ({len(request.text)} chars)")

        # Validate text length
        if len(request.text) < 50:
            raise HTTPException(
                status_code=400,
                detail="Text must be at least 50 characters long"
            )

        if len(request.text) > 50000:
            raise HTTPException(
                status_code=400,
                detail="Text must be less than 50,000 characters"
            )

        # Get detector service
        detector_service = get_detector_service()

        # Run AI detection
        detection_report = await detector_service.verify_text(request.text)

        # Calculate safety score
        calculator = get_safety_calculator()
        safety_result = calculator.calculate_safety_score(detection_report)

        # Convert results to response format
        detector_results = [
            DetectorResultResponse(
                detector=r.detector,
                score=r.score,
                confidence=r.confidence,
                success=r.success,
                error_message=r.error_message,
                details=r.details,
                timestamp=r.timestamp
            )
            for r in detection_report.results
        ]

        logger.info(
            f"Verification complete: safety_score={safety_result.safety_score:.2f}, "
            f"risk={safety_result.risk_level.value}"
        )

        return VerifyResponse(
            text_preview=request.text[:500],
            text_length=len(request.text),
            results=detector_results,
            total_detectors=detection_report.total_detectors,
            successful_detectors=detection_report.successful_detectors,
            average_score=detection_report.average_score,
            weighted_score=detection_report.weighted_score,
            consensus_score=detection_report.consensus_score,
            safety_score=safety_result.safety_score,
            risk_level=safety_result.risk_level.value,
            confidence=safety_result.confidence,
            recommendations=safety_result.recommendations,
            timestamp=datetime.utcnow()
        )

    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Verification error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Verification failed: {str(e)}"
        )


@router.post("/safety-score", response_model=SafetyScoreResponse)
async def calculate_safety_score(request: SafetyScoreRequest):
    """
    Calculate safety score from existing detection scores

    This is a lightweight endpoint for cases where you already have
    AI detection scores and just want to calculate the safety assessment.

    Args:
        request: SafetyScoreRequest with detection scores

    Returns:
        SafetyScoreResponse with safety score and recommendations

    Raises:
        HTTPException: If calculation fails
    """
    try:
        logger.info(f"Safety score calculation requested: avg={request.average_ai_score:.2f}")

        calculator = get_safety_calculator()

        # Use simple score if only average provided
        if request.weighted_ai_score is None and request.consensus_score is None:
            safety_score, risk_level = calculator.calculate_simple_score(request.average_ai_score)

            # Generate basic recommendations
            if risk_level == RiskLevel.HIGH:
                recommendations = [
                    "⚠️ HIGH RISK: Re-humanize text before using",
                    "Run through humanization pipeline with higher intensity"
                ]
            elif risk_level == RiskLevel.MEDIUM:
                recommendations = [
                    "⚠️ MEDIUM RISK: Consider re-humanizing",
                    "Add more varied sentence structures"
                ]
            else:
                recommendations = [
                    "✅ LOW RISK: Text appears sufficiently human-like"
                ]

            return SafetyScoreResponse(
                safety_score=safety_score,
                risk_level=risk_level.value,
                confidence=0.5,  # Lower confidence for simple calculation
                recommendations=recommendations,
                factors={
                    "avg_detection_score": 100 - request.average_ai_score
                }
            )

        # For more detailed calculation, create a mock detection report
        # This is a simplified path - ideally you'd store full reports
        from ...verification.ai_detectors import AggregatedDetectionReport, DetectionResult

        mock_results = [
            DetectionResult(
                detector=f"Detector {i+1}",
                score=request.average_ai_score,
                confidence=0.8,
                success=True
            )
            for i in range(request.detector_count)
        ]

        mock_report = AggregatedDetectionReport(
            text="[Calculated from scores]",
            results=mock_results,
            average_score=request.average_ai_score,
            weighted_score=request.weighted_ai_score or request.average_ai_score,
            consensus_score=request.consensus_score or 50.0,
            total_detectors=request.detector_count,
            successful_detectors=request.detector_count
        )

        safety_result = calculator.calculate_safety_score(mock_report)

        logger.info(f"Safety score calculated: {safety_result.safety_score:.2f}")

        return SafetyScoreResponse(
            safety_score=safety_result.safety_score,
            risk_level=safety_result.risk_level.value,
            confidence=safety_result.confidence,
            recommendations=safety_result.recommendations,
            factors=safety_result.factors
        )

    except Exception as e:
        logger.error(f"Safety score calculation error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Safety score calculation failed: {str(e)}"
        )


@router.get("/detectors")
async def list_available_detectors():
    """
    List available AI detectors and their configuration status

    Returns:
        Dictionary with detector availability information
    """
    import os

    detectors = {
        "GPTZero": {
            "name": "GPTZero",
            "configured": bool(os.getenv("GPTZERO_API_KEY")),
            "description": "AI content detection by GPTZero",
            "website": "https://gptzero.me"
        },
        "ZeroGPT": {
            "name": "ZeroGPT",
            "configured": bool(os.getenv("ZEROGPT_API_KEY")),
            "description": "AI content detection by ZeroGPT",
            "website": "https://zerogpt.com"
        },
        "Copyleaks": {
            "name": "Copyleaks",
            "configured": bool(
                os.getenv("COPYLEAKS_API_KEY") and os.getenv("COPYLEAKS_API_EMAIL")
            ),
            "description": "AI content detection by Copyleaks",
            "website": "https://copyleaks.com"
        },
        "Winston AI": {
            "name": "Winston AI",
            "configured": bool(os.getenv("WINSTON_API_KEY")),
            "description": "AI content detection by Winston AI",
            "website": "https://gowinston.ai"
        }
    }

    available_count = sum(1 for d in detectors.values() if d["configured"])

    return {
        "detectors": detectors,
        "total": len(detectors),
        "available": available_count,
        "configured": available_count > 0,
        "message": f"{available_count} of {len(detectors)} detectors configured"
    }


@router.get("/health")
async def verification_health():
    """
    Health check for verification service

    Returns:
        Health status of verification service
    """
    import os

    # Check if any detectors are configured
    has_detectors = any([
        os.getenv("GPTZERO_API_KEY"),
        os.getenv("ZEROGPT_API_KEY"),
        os.getenv("COPYLEAKS_API_KEY"),
        os.getenv("WINSTON_API_KEY")
    ])

    return {
        "status": "healthy" if has_detectors else "degraded",
        "service": "verification",
        "detectors_configured": has_detectors,
        "message": "Verification service is operational" if has_detectors else "No AI detectors configured",
        "timestamp": datetime.utcnow()
    }
