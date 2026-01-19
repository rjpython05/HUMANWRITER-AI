"""
AI Detector Simulator
Simulates AI detection scoring based on text patterns
"""
import numpy as np
from typing import Dict, List, Tuple

from ..utils.text_processing import (
    split_sentences,
    count_words,
    calculate_sentence_length_variance,
    find_banned_words,
)
from ..config.prompts import BANNED_WORDS


class AIDetectorSimulator:
    """
    Simulates AI content detection algorithms.
    Scores text on AI-like patterns (0 = human, 100 = AI)
    """

    def __init__(self):
        # Weight factors for different signals
        self.weights = {
            "low_burstiness": 0.30,
            "banned_words": 0.25,
            "repetitive_structure": 0.20,
            "perfect_grammar": 0.15,
            "generic_patterns": 0.10,
        }

    def detect(self, text: str) -> Dict[str, any]:
        """
        Analyze text and return AI detection score.

        Returns:
            Dictionary with overall score and component scores
        """
        signals = {
            "low_burstiness": self._check_low_burstiness(text),
            "banned_words": self._check_banned_words(text),
            "repetitive_structure": self._check_repetitive_structure(text),
            "perfect_grammar": self._check_perfect_grammar(text),
            "generic_patterns": self._check_generic_patterns(text),
        }

        # Calculate weighted score (0-100, higher = more AI-like)
        total_score = sum(
            signals[key] * self.weights[key] * 100
            for key in self.weights
        )

        # Classify result
        if total_score < 30:
            classification = "human"
            confidence = "high"
        elif total_score < 50:
            classification = "likely_human"
            confidence = "medium"
        elif total_score < 70:
            classification = "unclear"
            confidence = "low"
        elif total_score < 85:
            classification = "likely_ai"
            confidence = "medium"
        else:
            classification = "ai"
            confidence = "high"

        return {
            "ai_score": round(total_score, 2),
            "human_score": round(100 - total_score, 2),
            "classification": classification,
            "confidence": confidence,
            "signals": {k: round(v * 100, 2) for k, v in signals.items()},
        }

    def _check_low_burstiness(self, text: str) -> float:
        """
        Check for low sentence length variation (AI signal).
        Returns: 0.0 (very bursty/human) to 1.0 (uniform/AI)
        """
        sentences = split_sentences(text)
        if len(sentences) < 3:
            return 0.5  # Inconclusive

        lengths = [count_words(s) for s in sentences]
        _, std_dev = calculate_sentence_length_variance(text)

        # Low std dev (< 5) = AI-like
        # High std dev (> 10) = human-like
        if std_dev < 3:
            return 1.0
        elif std_dev < 5:
            return 0.8
        elif std_dev < 7:
            return 0.5
        elif std_dev < 10:
            return 0.2
        else:
            return 0.0

    def _check_banned_words(self, text: str) -> float:
        """
        Check for typical AI words.
        Returns: 0.0 (no banned words) to 1.0 (many banned words)
        """
        banned = find_banned_words(text, BANNED_WORDS)
        word_count = count_words(text)

        if word_count == 0:
            return 0.0

        ratio = len(banned) / word_count
        return min(1.0, ratio * 50)  # Scale up (2% = full score)

    def _check_repetitive_structure(self, text: str) -> float:
        """
        Check for repetitive sentence structures.
        Returns: 0.0 (varied) to 1.0 (repetitive)
        """
        sentences = split_sentences(text)
        if len(sentences) < 5:
            return 0.0

        # Check for similar sentence starts
        starts = [s.split()[:2] for s in sentences if len(s.split()) >= 2]
        starts_str = [' '.join(s) for s in starts]

        unique_starts = len(set(starts_str))
        total_starts = len(starts_str)

        if total_starts == 0:
            return 0.0

        # Low diversity = AI-like
        diversity_ratio = unique_starts / total_starts
        return 1.0 - diversity_ratio

    def _check_perfect_grammar(self, text: str) -> float:
        """
        Check for overly perfect grammar (AI signal).
        Returns: 0.0 (natural) to 1.0 (too perfect)
        """
        # Simple heuristics for "too perfect"
        signals = []

        # Check for lack of contractions in Spanish
        # AI tends to use full forms
        contractions = ['pa\'', 'ta\'', 'del', 'al']
        has_contractions = any(c in text.lower() for c in contractions)
        signals.append(0.0 if has_contractions else 0.5)

        # Check for overly formal connectors
        formal_connectors = [
            'asimismo', 'por consiguiente', 'en consecuencia',
            'por ende', 'en virtud de', 'a fin de'
        ]
        formal_count = sum(1 for c in formal_connectors if c in text.lower())
        sentence_count = len(split_sentences(text))
        formal_ratio = formal_count / max(sentence_count, 1)
        signals.append(min(1.0, formal_ratio * 5))

        return np.mean(signals)

    def _check_generic_patterns(self, text: str) -> float:
        """
        Check for generic AI patterns.
        Returns: 0.0 (specific) to 1.0 (generic)
        """
        text_lower = text.lower()

        # Generic opening patterns
        generic_openings = [
            'en el presente', 'en este artículo', 'en este trabajo',
            'en la actualidad', 'hoy en día', 'es importante destacar',
            'cabe señalar', 'vale la pena mencionar'
        ]

        # Generic transition patterns
        generic_transitions = [
            'por otra parte', 'por un lado', 'por otro lado',
            'en primer lugar', 'en segundo lugar', 'finalmente'
        ]

        # Generic conclusion patterns
        generic_conclusions = [
            'en conclusión', 'para concluir', 'en resumen',
            'en definitiva', 'en síntesis'
        ]

        all_patterns = generic_openings + generic_transitions + generic_conclusions

        pattern_count = sum(1 for p in all_patterns if p in text_lower)
        sentence_count = len(split_sentences(text))

        pattern_ratio = pattern_count / max(sentence_count, 1)

        return min(1.0, pattern_ratio * 3)

    def passes_threshold(self, text: str, threshold: float = 50.0) -> Tuple[bool, Dict]:
        """
        Check if text passes AI detection threshold.

        Args:
            text: Text to check
            threshold: Maximum acceptable AI score (default 50)

        Returns:
            (passes, detection_result)
        """
        result = self.detect(text)
        passes = result["ai_score"] < threshold

        return passes, result


# Global instance
ai_detector = AIDetectorSimulator()


def simulate_ai_detection(text: str) -> Dict[str, any]:
    """
    Convenience function to simulate AI detection.

    Returns:
        Detection result dictionary
    """
    return ai_detector.detect(text)


def check_passes_ai_detection(text: str, threshold: float = 50.0) -> bool:
    """
    Check if text passes AI detection threshold.

    Args:
        text: Text to check
        threshold: Maximum acceptable AI score

    Returns:
        True if passes (appears human), False otherwise
    """
    passes, _ = ai_detector.passes_threshold(text, threshold)
    return passes
