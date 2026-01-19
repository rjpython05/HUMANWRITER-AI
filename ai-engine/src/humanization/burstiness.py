"""
Burstiness adjustment - Vary sentence lengths for human-like text
"""
import random
from typing import List
from loguru import logger

from ..utils.text_processing import (
    split_sentences,
    count_words,
    calculate_burstiness_score,
    merge_sentences,
    split_long_sentence,
)
from ..config.settings import settings


class BurstinessAdjuster:
    """
    Adjusts sentence length variation to achieve target burstiness.
    Target: std dev > 8.0
    """

    def __init__(self, target_burstiness: float = settings.burstiness_target):
        self.target_burstiness = target_burstiness

    def adjust(self, text: str, max_iterations: int = 3) -> str:
        """
        Adjust sentence lengths to meet burstiness target.

        Args:
            text: Input text
            max_iterations: Maximum adjustment iterations

        Returns:
            Text with adjusted sentence lengths
        """
        current_text = text
        current_burstiness = calculate_burstiness_score(current_text)

        logger.info(f"Initial burstiness: {current_burstiness:.2f}")

        for iteration in range(max_iterations):
            if current_burstiness >= self.target_burstiness:
                logger.info(f"Target burstiness achieved: {current_burstiness:.2f}")
                break

            # Apply adjustments
            current_text = self._adjust_iteration(current_text)
            current_burstiness = calculate_burstiness_score(current_text)

            logger.info(f"Iteration {iteration + 1} burstiness: {current_burstiness:.2f}")

        return current_text

    def _adjust_iteration(self, text: str) -> str:
        """
        Perform one iteration of burstiness adjustment.
        Strategy: Split long sentences and merge short ones.
        """
        sentences = split_sentences(text)
        if len(sentences) < 3:
            return text

        # Calculate sentence lengths
        lengths = [count_words(s) for s in sentences]
        avg_length = sum(lengths) / len(lengths)

        adjusted_sentences = []
        i = 0

        while i < len(sentences):
            sentence = sentences[i]
            length = lengths[i]

            # Split very long sentences (> 30 words)
            if length > 30 and random.random() < 0.7:
                split_parts = split_long_sentence(sentence, max_words=20)
                adjusted_sentences.extend(split_parts)
                logger.debug(f"Split long sentence ({length} words) into {len(split_parts)} parts")

            # Merge very short sentences (< 8 words)
            elif length < 8 and i < len(sentences) - 1 and random.random() < 0.5:
                next_sentence = sentences[i + 1]
                next_length = lengths[i + 1]

                # Only merge if combined is reasonable
                if length + next_length <= 35:
                    merged = merge_sentences([sentence, next_sentence])
                    adjusted_sentences.append(merged)
                    logger.debug(f"Merged short sentences ({length} + {next_length} words)")
                    i += 1  # Skip next sentence
                else:
                    adjusted_sentences.append(sentence)
            else:
                adjusted_sentences.append(sentence)

            i += 1

        # Reconstruct text
        return ' '.join(adjusted_sentences)

    def needs_adjustment(self, text: str) -> bool:
        """
        Check if text needs burstiness adjustment.

        Returns:
            True if below target
        """
        current_burstiness = calculate_burstiness_score(text)
        return current_burstiness < self.target_burstiness

    def get_adjustment_stats(self, original: str, adjusted: str) -> dict:
        """
        Get statistics about the adjustment.

        Returns:
            Dictionary with before/after metrics
        """
        original_sentences = split_sentences(original)
        adjusted_sentences = split_sentences(adjusted)

        original_lengths = [count_words(s) for s in original_sentences]
        adjusted_lengths = [count_words(s) for s in adjusted_sentences]

        return {
            "original_sentence_count": len(original_sentences),
            "adjusted_sentence_count": len(adjusted_sentences),
            "original_burstiness": calculate_burstiness_score(original),
            "adjusted_burstiness": calculate_burstiness_score(adjusted),
            "original_avg_length": sum(original_lengths) / len(original_lengths) if original_lengths else 0,
            "adjusted_avg_length": sum(adjusted_lengths) / len(adjusted_lengths) if adjusted_lengths else 0,
            "original_length_range": (min(original_lengths), max(original_lengths)) if original_lengths else (0, 0),
            "adjusted_length_range": (min(adjusted_lengths), max(adjusted_lengths)) if adjusted_lengths else (0, 0),
        }


# Global instance
burstiness_adjuster = BurstinessAdjuster()


def adjust_burstiness(text: str, target: float = settings.burstiness_target) -> str:
    """
    Convenience function to adjust text burstiness.

    Args:
        text: Input text
        target: Target burstiness score

    Returns:
        Adjusted text
    """
    adjuster = BurstinessAdjuster(target_burstiness=target)
    return adjuster.adjust(text)


def create_variation_pattern(sentences: List[str]) -> List[str]:
    """
    Rearrange sentences to create a varied length pattern.
    Pattern: short, long, medium, very long, short, medium...

    Args:
        sentences: List of sentences

    Returns:
        Reordered sentences (by length variation)
    """
    if len(sentences) < 3:
        return sentences

    # Sort by length
    indexed_sentences = [(count_words(s), s) for s in sentences]
    indexed_sentences.sort(key=lambda x: x[0])

    # Create alternating pattern
    result = []
    short_idx = 0
    long_idx = len(indexed_sentences) - 1

    while short_idx <= long_idx:
        if len(result) % 2 == 0:
            result.append(indexed_sentences[short_idx][1])
            short_idx += 1
        else:
            result.append(indexed_sentences[long_idx][1])
            long_idx -= 1

    return result
