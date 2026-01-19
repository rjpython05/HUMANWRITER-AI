"""
Post-processing pipeline for humanization
Orchestrates all humanization steps
"""
from typing import Dict, Any
from loguru import logger

from ..config.settings import settings
from ..utils.text_processing import calculate_burstiness_score, count_words
from .burstiness import BurstinessAdjuster
from .coloquialisms import ColloquialismInjector
from .imperfections import ImperfectionInjector
from .approximators import humanize_with_approximations


class HumanizationPipeline:
    """
    Complete humanization pipeline
    Applies all humanization techniques in optimal order
    """

    def __init__(
        self,
        burstiness_target: float = None,
        colloquialism_frequency: float = None,
        imperfection_frequency: float = None,
        approximator_frequency: float = None,
        intensity: float = 1.0
    ):
        """
        Initialize humanization pipeline

        Args:
            burstiness_target: Target burstiness score
            colloquialism_frequency: Frequency of colloquialisms
            imperfection_frequency: Frequency of imperfections
            approximator_frequency: Frequency of approximations
            intensity: Overall intensity multiplier (0-2, default 1)
        """
        self.intensity = max(0.0, min(2.0, intensity))

        # Initialize components with adjusted frequencies
        self.burstiness_adjuster = BurstinessAdjuster(
            target_burstiness=burstiness_target or settings.burstiness_target
        )

        self.colloquialism_injector = ColloquialismInjector(
            frequency=(colloquialism_frequency or settings.colloquialism_frequency) * self.intensity
        )

        self.imperfection_injector = ImperfectionInjector(
            frequency=(imperfection_frequency or settings.imperfection_frequency) * self.intensity
        )

        self.approximator_frequency = (
            approximator_frequency or settings.approximator_frequency
        ) * self.intensity

        logger.info(
            f"Initialized HumanizationPipeline with intensity={self.intensity:.2f}"
        )

    def humanize(self, text: str) -> Dict[str, Any]:
        """
        Apply full humanization pipeline

        Args:
            text: Input text

        Returns:
            Dictionary with:
            - humanized_text: Processed text
            - changes_made: Number of changes
            - burstiness_before: Original burstiness
            - burstiness_after: Final burstiness
            - steps_applied: List of steps applied
        """
        logger.info(f"Starting humanization pipeline for text ({len(text)} chars)")

        original_text = text
        current_text = text
        total_changes = 0
        steps_applied = []

        # Measure original metrics
        original_burstiness = calculate_burstiness_score(original_text)
        logger.info(f"Original burstiness: {original_burstiness:.2f}")

        # Step 1: Adjust burstiness (sentence length variation)
        if self.burstiness_adjuster.needs_adjustment(current_text):
            logger.info("Step 1: Adjusting burstiness")
            current_text = self.burstiness_adjuster.adjust(current_text)
            steps_applied.append("burstiness")
            total_changes += 1

        # Step 2: Inject colloquialisms
        if self.colloquialism_injector.needs_injection(current_text):
            logger.info("Step 2: Injecting colloquialisms")
            before_length = len(current_text)
            current_text = self.colloquialism_injector.inject(current_text)
            if len(current_text) != before_length:
                total_changes += 1
                steps_applied.append("colloquialisms")

        # Step 3: Add approximations (replace exact numbers)
        logger.info("Step 3: Adding approximations")
        current_text, approx_changes = humanize_with_approximations(
            current_text,
            number_frequency=self.approximator_frequency
        )
        if approx_changes > 0:
            total_changes += approx_changes
            steps_applied.append("approximations")

        # Step 4: Inject imperfections
        logger.info("Step 4: Injecting imperfections")
        before_length = len(current_text)
        current_text = self.imperfection_injector.inject(current_text)
        if len(current_text) != before_length:
            total_changes += 1
            steps_applied.append("imperfections")

        # Measure final metrics
        final_burstiness = calculate_burstiness_score(current_text)
        logger.info(f"Final burstiness: {final_burstiness:.2f}")

        logger.info(
            f"Humanization complete: {total_changes} changes, "
            f"steps={steps_applied}"
        )

        return {
            "humanized_text": current_text,
            "original_text": original_text,
            "changes_made": total_changes,
            "burstiness_before": original_burstiness,
            "burstiness_after": final_burstiness,
            "steps_applied": steps_applied,
            "word_count_before": count_words(original_text),
            "word_count_after": count_words(current_text),
        }

    def humanize_text_only(self, text: str) -> str:
        """
        Apply humanization and return only the text

        Args:
            text: Input text

        Returns:
            Humanized text
        """
        result = self.humanize(text)
        return result["humanized_text"]

    def quick_humanize(self, text: str) -> str:
        """
        Apply lighter, faster humanization
        Skips burstiness adjustment for speed

        Args:
            text: Input text

        Returns:
            Humanized text
        """
        logger.info("Applying quick humanization")

        current_text = text

        # Only apply colloquialisms and approximations
        if self.colloquialism_injector.frequency > 0:
            current_text = self.colloquialism_injector.inject(current_text)

        current_text, _ = humanize_with_approximations(
            current_text,
            number_frequency=self.approximator_frequency
        )

        logger.info("Quick humanization complete")
        return current_text

    def validate_humanization(self, text: str) -> Dict[str, Any]:
        """
        Validate that text has been properly humanized

        Args:
            text: Text to validate

        Returns:
            Validation results
        """
        burstiness = calculate_burstiness_score(text)
        colloquialism_freq = self.colloquialism_injector.calculate_current_frequency(text)

        # Check if text meets humanization criteria
        meets_burstiness = burstiness >= self.burstiness_adjuster.target_burstiness
        has_colloquialisms = colloquialism_freq > 0

        return {
            "is_humanized": meets_burstiness and has_colloquialisms,
            "burstiness_score": burstiness,
            "meets_burstiness_target": meets_burstiness,
            "colloquialism_frequency": colloquialism_freq,
            "has_colloquialisms": has_colloquialisms,
            "word_count": count_words(text)
        }

    def get_pipeline_config(self) -> Dict[str, Any]:
        """
        Get current pipeline configuration

        Returns:
            Configuration dictionary
        """
        return {
            "intensity": self.intensity,
            "burstiness_target": self.burstiness_adjuster.target_burstiness,
            "colloquialism_frequency": self.colloquialism_injector.frequency,
            "imperfection_frequency": self.imperfection_injector.frequency,
            "approximator_frequency": self.approximator_frequency
        }


# Global instance
_humanization_pipeline = None


def get_humanization_pipeline(intensity: float = 1.0) -> HumanizationPipeline:
    """
    Get or create global HumanizationPipeline instance

    Args:
        intensity: Humanization intensity (creates new instance if different)

    Returns:
        HumanizationPipeline instance
    """
    global _humanization_pipeline

    # Create new instance if intensity is different or no instance exists
    if _humanization_pipeline is None or abs(_humanization_pipeline.intensity - intensity) > 0.01:
        _humanization_pipeline = HumanizationPipeline(intensity=intensity)

    return _humanization_pipeline


def humanize_text(text: str, intensity: float = 1.0) -> str:
    """
    Convenience function to humanize text

    Args:
        text: Input text
        intensity: Humanization intensity (0-2)

    Returns:
        Humanized text
    """
    pipeline = get_humanization_pipeline(intensity=intensity)
    return pipeline.humanize_text_only(text)
