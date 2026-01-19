"""
Safety Score Calculator

Calculates an overall "safety" score (0-100) for generated text based on
multiple AI detector results. Lower scores indicate higher risk of AI detection.

Safety Score Scale:
- 80-100: Low Risk (Safe to use)
- 50-79: Medium Risk (Consider re-humanizing)
- 0-49: High Risk (Strong AI detection signals)
"""
from typing import List, Tuple, Optional
from dataclasses import dataclass
from enum import Enum

from loguru import logger

from .ai_detectors import AggregatedDetectionReport, DetectionResult


class RiskLevel(str, Enum):
    """Risk level classification"""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


@dataclass
class SafetyScoreResult:
    """Result of safety score calculation"""
    safety_score: float  # 0-100, higher is better
    risk_level: RiskLevel
    confidence: float  # 0-1, confidence in the assessment
    recommendations: List[str]
    factors: dict  # Individual factor scores


class SafetyScoreCalculator:
    """
    Calculates safety scores based on AI detection results
    """

    # Thresholds for risk levels (based on safety score)
    LOW_RISK_THRESHOLD = 80.0
    MEDIUM_RISK_THRESHOLD = 50.0

    # Weights for different factors
    WEIGHTS = {
        "avg_detection_score": 0.35,  # Average AI detection score
        "weighted_detection_score": 0.25,  # Confidence-weighted score
        "consensus": 0.20,  # Agreement between detectors
        "detector_coverage": 0.15,  # Number of successful detectors
        "worst_case": 0.05  # Highest individual detection score
    }

    def __init__(self):
        """Initialize the safety score calculator"""
        logger.info("Safety Score Calculator initialized")

    def calculate_safety_score(
        self,
        detection_report: AggregatedDetectionReport
    ) -> SafetyScoreResult:
        """
        Calculate overall safety score from detection results

        Args:
            detection_report: Aggregated detection report from AI detectors

        Returns:
            SafetyScoreResult with score, risk level, and recommendations
        """
        logger.info("Calculating safety score...")

        # Calculate individual factors
        factors = self._calculate_factors(detection_report)

        # Calculate weighted safety score
        safety_score = self._calculate_weighted_score(factors)

        # Determine risk level
        risk_level = self._determine_risk_level(safety_score)

        # Calculate confidence in assessment
        confidence = self._calculate_confidence(detection_report, factors)

        # Generate recommendations
        recommendations = self._generate_recommendations(
            safety_score,
            risk_level,
            detection_report,
            factors
        )

        logger.info(
            f"Safety score calculated: {safety_score:.2f}/100 "
            f"({risk_level.value} risk, {confidence:.2f} confidence)"
        )

        return SafetyScoreResult(
            safety_score=round(safety_score, 2),
            risk_level=risk_level,
            confidence=round(confidence, 2),
            recommendations=recommendations,
            factors=factors
        )

    def _calculate_factors(
        self,
        report: AggregatedDetectionReport
    ) -> dict:
        """
        Calculate individual safety factors

        Returns:
            Dictionary with factor scores (each 0-100, higher is better)
        """
        factors = {}

        # Factor 1: Average detection score (inverted - lower AI detection is better)
        if report.successful_detectors > 0:
            factors["avg_detection_score"] = 100 - report.average_score
        else:
            factors["avg_detection_score"] = 50  # Neutral when no detectors

        # Factor 2: Weighted detection score (inverted)
        if report.successful_detectors > 0:
            factors["weighted_detection_score"] = 100 - report.weighted_score
        else:
            factors["weighted_detection_score"] = 50

        # Factor 3: Consensus score (high consensus is good if low AI detection)
        # Adjust consensus based on whether detection is high or low
        avg_ai_detection = report.average_score
        if report.successful_detectors > 1:
            if avg_ai_detection < 30:  # Low AI detection
                # High consensus is good
                factors["consensus"] = report.consensus_score
            elif avg_ai_detection > 70:  # High AI detection
                # High consensus is bad (all agree it's AI)
                factors["consensus"] = 100 - report.consensus_score
            else:
                # Medium detection - consensus less important
                factors["consensus"] = 50 + (50 - avg_ai_detection) / 2
        else:
            factors["consensus"] = 50  # Neutral for single detector

        # Factor 4: Detector coverage (more detectors = more confidence)
        # Optimal is 3-4 detectors
        if report.successful_detectors >= 3:
            factors["detector_coverage"] = 100
        elif report.successful_detectors == 2:
            factors["detector_coverage"] = 75
        elif report.successful_detectors == 1:
            factors["detector_coverage"] = 50
        else:
            factors["detector_coverage"] = 0

        # Factor 5: Worst case score (highest AI detection, inverted)
        if report.successful_detectors > 0:
            successful = [r for r in report.results if r.success]
            worst_score = max(r.score for r in successful)
            factors["worst_case"] = 100 - worst_score
        else:
            factors["worst_case"] = 50

        return factors

    def _calculate_weighted_score(self, factors: dict) -> float:
        """
        Calculate weighted safety score from factors

        Args:
            factors: Dictionary of factor scores

        Returns:
            Weighted safety score (0-100)
        """
        score = 0.0

        for factor_name, weight in self.WEIGHTS.items():
            factor_value = factors.get(factor_name, 50)  # Default to neutral
            score += factor_value * weight

        # Ensure score is in valid range
        return max(0.0, min(100.0, score))

    def _determine_risk_level(self, safety_score: float) -> RiskLevel:
        """
        Determine risk level based on safety score

        Args:
            safety_score: Safety score (0-100)

        Returns:
            RiskLevel enum
        """
        if safety_score >= self.LOW_RISK_THRESHOLD:
            return RiskLevel.LOW
        elif safety_score >= self.MEDIUM_RISK_THRESHOLD:
            return RiskLevel.MEDIUM
        else:
            return RiskLevel.HIGH

    def _calculate_confidence(
        self,
        report: AggregatedDetectionReport,
        factors: dict
    ) -> float:
        """
        Calculate confidence in the safety assessment

        Confidence is higher when:
        - More detectors were successful
        - Detectors show high consensus
        - Individual detector confidence scores are high

        Args:
            report: Detection report
            factors: Calculated factors

        Returns:
            Confidence score (0-1)
        """
        confidence_factors = []

        # Factor 1: Number of successful detectors (0-1)
        detector_count_factor = min(1.0, report.successful_detectors / 3.0)
        confidence_factors.append(detector_count_factor)

        # Factor 2: Consensus score (0-1)
        if report.successful_detectors > 1:
            consensus_factor = report.consensus_score / 100.0
            confidence_factors.append(consensus_factor)

        # Factor 3: Average detector confidence (0-1)
        successful = [r for r in report.results if r.success]
        if successful:
            avg_detector_confidence = sum(r.confidence for r in successful) / len(successful)
            confidence_factors.append(avg_detector_confidence)

        # Calculate overall confidence
        if confidence_factors:
            overall_confidence = sum(confidence_factors) / len(confidence_factors)
        else:
            overall_confidence = 0.0

        return overall_confidence

    def _generate_recommendations(
        self,
        safety_score: float,
        risk_level: RiskLevel,
        report: AggregatedDetectionReport,
        factors: dict
    ) -> List[str]:
        """
        Generate actionable recommendations based on results

        Args:
            safety_score: Calculated safety score
            risk_level: Determined risk level
            report: Detection report
            factors: Calculated factors

        Returns:
            List of recommendation strings
        """
        recommendations = []

        # Risk-based recommendations
        if risk_level == RiskLevel.HIGH:
            recommendations.append(
                "⚠️ HIGH RISK: This text shows strong AI detection signals. "
                "Re-humanize before using."
            )
            recommendations.append(
                "Run the text through humanization pipeline with higher intensity"
            )
            recommendations.append(
                "Consider adding more personal anecdotes or examples"
            )
            recommendations.append(
                "Vary sentence structure and length to increase burstiness"
            )
        elif risk_level == RiskLevel.MEDIUM:
            recommendations.append(
                "⚠️ MEDIUM RISK: Some AI detection signals present. "
                "Consider re-humanizing for safer results."
            )
            recommendations.append(
                "Run through humanization pipeline to reduce AI patterns"
            )
            recommendations.append(
                "Add transitional phrases and varied punctuation"
            )
        else:  # LOW risk
            recommendations.append(
                "✅ LOW RISK: Text appears sufficiently human-like. Safe to use."
            )

        # Detector-specific recommendations
        successful = [r for r in report.results if r.success]

        if successful:
            # Find highest scoring detector
            highest = max(successful, key=lambda r: r.score)
            if highest.score > 60:
                recommendations.append(
                    f"Note: {highest.detector} detected higher AI probability ({highest.score:.1f}%). "
                    f"This may be a focus area for improvement."
                )

        # Coverage recommendations
        if report.successful_detectors == 0:
            recommendations.append(
                "⚠️ No AI detectors were available. Add API keys to enable verification."
            )
        elif report.successful_detectors == 1:
            recommendations.append(
                "Note: Only one detector was used. For more reliable results, "
                "configure additional AI detector API keys."
            )

        # Consensus recommendations
        if report.successful_detectors > 1:
            if report.consensus_score < 50:
                recommendations.append(
                    "⚠️ Low consensus between detectors. Results may be less reliable. "
                    "Consider running verification again or using more detectors."
                )

        # Specific factor recommendations
        if factors.get("worst_case", 100) < 30:
            recommendations.append(
                "At least one detector flagged this text with high confidence. "
                "Review the detection details for specific patterns to address."
            )

        return recommendations

    def calculate_simple_score(self, avg_ai_score: float) -> Tuple[float, RiskLevel]:
        """
        Calculate a simple safety score from a single average AI detection score

        This is a simplified method for cases where you only have one aggregated score.

        Args:
            avg_ai_score: Average AI detection score (0-100, higher = more AI)

        Returns:
            Tuple of (safety_score, risk_level)
        """
        # Simply invert the AI score
        safety_score = 100 - avg_ai_score

        # Determine risk level
        risk_level = self._determine_risk_level(safety_score)

        return safety_score, risk_level


# Singleton instance
_calculator: Optional[SafetyScoreCalculator] = None


def get_safety_calculator() -> SafetyScoreCalculator:
    """Get or create the safety score calculator singleton"""
    global _calculator
    if _calculator is None:
        _calculator = SafetyScoreCalculator()
    return _calculator
