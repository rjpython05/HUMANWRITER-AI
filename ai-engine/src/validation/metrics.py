"""
Metrics calculation for text quality and humanization
"""
from typing import Dict, List
import numpy as np

from ..utils.text_processing import (
    split_sentences,
    count_words,
    count_sentences,
    calculate_sentence_length_variance,
    calculate_burstiness_score,
    find_banned_words,
    count_word_frequency,
)
from ..config.prompts import (
    BANNED_WORDS,
    DOMINICAN_COLLOQUIALISMS,
    THINKING_MARKERS,
    UNCERTAINTY_EXPRESSIONS,
)


def burstiness_score(text: str) -> float:
    """
    Calculate burstiness score (sentence length variation).
    Higher score = more human-like variation.
    Target: > 8.0

    Returns:
        Standard deviation of sentence lengths
    """
    return calculate_burstiness_score(text)


def humanization_score(text: str) -> float:
    """
    Calculate overall humanization score (0-100).

    Combines multiple factors:
    - Burstiness (40%)
    - Colloquialisms presence (20%)
    - Lack of banned words (20%)
    - Thinking markers (10%)
    - Sentence count variation (10%)

    Returns:
        Score from 0 to 100
    """
    # Burstiness component (40 points max)
    burst = burstiness_score(text)
    burstiness_points = min(40, (burst / 8.0) * 40)

    # Colloquialisms component (20 points max)
    colloq_count = count_colloquialisms(text)
    sentence_count = count_sentences(text)
    colloq_ratio = colloq_count / max(sentence_count, 1)
    colloquialism_points = min(20, colloq_ratio * 20 * 20)  # ~5% target

    # Banned words component (20 points max - deduction)
    banned_count = count_banned_words(text)
    word_count = count_words(text)
    banned_ratio = banned_count / max(word_count, 1)
    banned_penalty = min(20, banned_ratio * 100 * 20)
    banned_points = 20 - banned_penalty

    # Thinking markers component (10 points max)
    thinking_count = count_thinking_markers(text)
    thinking_ratio = thinking_count / max(sentence_count, 1)
    thinking_points = min(10, thinking_ratio * 10 * 30)  # ~3% target

    # Sentence variation (10 points max)
    if sentence_count >= 3:
        lengths = [count_words(s) for s in split_sentences(text)]
        variation_coeff = np.std(lengths) / (np.mean(lengths) + 1e-6)
        variation_points = min(10, variation_coeff * 20)
    else:
        variation_points = 0

    # Combine all components
    total_score = (
        burstiness_points +
        colloquialism_points +
        banned_points +
        thinking_points +
        variation_points
    )

    return min(100, max(0, total_score))


def count_banned_words(text: str) -> int:
    """Count occurrences of banned AI-typical words"""
    banned = find_banned_words(text, BANNED_WORDS)
    return len(banned)


def count_colloquialisms(text: str) -> int:
    """Count occurrences of Dominican colloquialisms"""
    return count_word_frequency(text, DOMINICAN_COLLOQUIALISMS)


def count_thinking_markers(text: str) -> int:
    """Count occurrences of thinking markers (opinion expressions)"""
    return count_word_frequency(text, THINKING_MARKERS)


def count_uncertainty_expressions(text: str) -> int:
    """Count occurrences of uncertainty expressions"""
    return count_word_frequency(text, UNCERTAINTY_EXPRESSIONS)


def sentence_variation(text: str) -> Dict[str, float]:
    """
    Calculate sentence length variation metrics.

    Returns:
        Dict with mean, std_dev, min, max, coefficient_of_variation
    """
    sentences = split_sentences(text)
    if not sentences:
        return {
            "mean": 0.0,
            "std_dev": 0.0,
            "min": 0,
            "max": 0,
            "coefficient_of_variation": 0.0,
            "sentence_count": 0,
        }

    lengths = [count_words(s) for s in sentences]
    mean_length = np.mean(lengths)
    std_dev = np.std(lengths, ddof=1) if len(lengths) > 1 else 0.0
    coeff_var = std_dev / (mean_length + 1e-6)

    return {
        "mean": float(mean_length),
        "std_dev": float(std_dev),
        "min": int(min(lengths)),
        "max": int(max(lengths)),
        "coefficient_of_variation": float(coeff_var),
        "sentence_count": len(sentences),
    }


def calculate_all_metrics(text: str) -> Dict[str, any]:
    """
    Calculate all available metrics for a text.

    Returns:
        Comprehensive metrics dictionary
    """
    word_count = count_words(text)
    sentence_count = count_sentences(text)
    sent_variation = sentence_variation(text)

    return {
        "word_count": word_count,
        "sentence_count": sentence_count,
        "avg_sentence_length": sent_variation["mean"],
        "burstiness_score": burstiness_score(text),
        "humanization_score": humanization_score(text),
        "banned_word_count": count_banned_words(text),
        "colloquialism_count": count_colloquialisms(text),
        "thinking_marker_count": count_thinking_markers(text),
        "uncertainty_expression_count": count_uncertainty_expressions(text),
        "sentence_variation": sent_variation,
        "colloquialism_ratio": count_colloquialisms(text) / max(sentence_count, 1),
        "banned_word_ratio": count_banned_words(text) / max(word_count, 1),
    }


def assess_quality(text: str, min_words: int = 100, target_burstiness: float = 8.0) -> Dict[str, any]:
    """
    Assess text quality against targets.

    Returns:
        Dictionary with pass/fail status and recommendations
    """
    metrics = calculate_all_metrics(text)
    issues = []
    recommendations = []

    # Check word count
    if metrics["word_count"] < min_words:
        issues.append(f"Text too short: {metrics['word_count']} words (minimum: {min_words})")
        recommendations.append("Generate more content")

    # Check burstiness
    if metrics["burstiness_score"] < target_burstiness:
        issues.append(f"Low burstiness: {metrics['burstiness_score']:.2f} (target: {target_burstiness})")
        recommendations.append("Increase sentence length variation")

    # Check banned words
    if metrics["banned_word_count"] > 0:
        issues.append(f"Contains {metrics['banned_word_count']} banned AI words")
        recommendations.append("Remove typical AI words")

    # Check colloquialisms
    if metrics["colloquialism_count"] == 0 and metrics["sentence_count"] > 10:
        issues.append("No colloquialisms found")
        recommendations.append("Add natural Dominican expressions")

    # Check humanization score
    h_score = metrics["humanization_score"]
    quality_level = "excellent" if h_score >= 80 else "good" if h_score >= 60 else "fair" if h_score >= 40 else "poor"

    return {
        "passes_quality_check": len(issues) == 0 and h_score >= 60,
        "quality_level": quality_level,
        "humanization_score": h_score,
        "issues": issues,
        "recommendations": recommendations,
        "metrics": metrics,
    }


def compare_texts(original: str, humanized: str) -> Dict[str, any]:
    """
    Compare original and humanized text.

    Returns:
        Dictionary showing improvements/changes
    """
    original_metrics = calculate_all_metrics(original)
    humanized_metrics = calculate_all_metrics(humanized)

    return {
        "original": original_metrics,
        "humanized": humanized_metrics,
        "improvements": {
            "burstiness_delta": humanized_metrics["burstiness_score"] - original_metrics["burstiness_score"],
            "humanization_delta": humanized_metrics["humanization_score"] - original_metrics["humanization_score"],
            "colloquialisms_added": humanized_metrics["colloquialism_count"] - original_metrics["colloquialism_count"],
            "banned_words_removed": original_metrics["banned_word_count"] - humanized_metrics["banned_word_count"],
        }
    }
