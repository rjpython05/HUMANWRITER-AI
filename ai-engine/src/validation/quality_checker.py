"""
Quality checker for generated text
"""
from typing import Dict, List, Tuple
from loguru import logger

from .metrics import calculate_all_metrics, assess_quality
from .ai_detector_sim import simulate_ai_detection
from ..utils.text_processing import count_words, count_sentences
from ..config.settings import settings


class QualityChecker:
    """
    Comprehensive quality checker for generated text.
    Validates against multiple criteria.
    """

    def __init__(
        self,
        min_words: int = settings.min_words,
        max_words: int = settings.max_words,
        target_burstiness: float = settings.burstiness_target,
        max_ai_score: float = 50.0,
        min_humanization_score: float = 60.0,
    ):
        self.min_words = min_words
        self.max_words = max_words
        self.target_burstiness = target_burstiness
        self.max_ai_score = max_ai_score
        self.min_humanization_score = min_humanization_score

    def check(self, text: str, strict: bool = False) -> Dict[str, any]:
        """
        Perform comprehensive quality check.

        Args:
            text: Text to check
            strict: If True, apply stricter validation

        Returns:
            Detailed quality report
        """
        # Calculate metrics
        metrics = calculate_all_metrics(text)

        # Run AI detection
        ai_detection = simulate_ai_detection(text)

        # Assess quality
        quality_assessment = assess_quality(
            text,
            min_words=self.min_words,
            target_burstiness=self.target_burstiness
        )

        # Collect validation results
        validations = []
        passed = True

        # Word count validation
        word_count = metrics["word_count"]
        if word_count < self.min_words:
            validations.append({
                "check": "word_count_min",
                "passed": False,
                "message": f"Text too short: {word_count} words (minimum: {self.min_words})",
            })
            passed = False
        elif word_count > self.max_words:
            validations.append({
                "check": "word_count_max",
                "passed": False,
                "message": f"Text too long: {word_count} words (maximum: {self.max_words})",
            })
            passed = False
        else:
            validations.append({
                "check": "word_count",
                "passed": True,
                "message": f"Word count OK: {word_count}",
            })

        # Burstiness validation
        burstiness = metrics["burstiness_score"]
        if burstiness < self.target_burstiness:
            validations.append({
                "check": "burstiness",
                "passed": False if strict else True,  # Warning only if not strict
                "message": f"Low burstiness: {burstiness:.2f} (target: {self.target_burstiness})",
            })
            if strict:
                passed = False
        else:
            validations.append({
                "check": "burstiness",
                "passed": True,
                "message": f"Burstiness OK: {burstiness:.2f}",
            })

        # AI detection validation
        ai_score = ai_detection["ai_score"]
        if ai_score > self.max_ai_score:
            validations.append({
                "check": "ai_detection",
                "passed": False,
                "message": f"High AI score: {ai_score:.2f}% (max: {self.max_ai_score}%)",
            })
            passed = False
        else:
            validations.append({
                "check": "ai_detection",
                "passed": True,
                "message": f"AI score OK: {ai_score:.2f}%",
            })

        # Humanization score validation
        h_score = metrics["humanization_score"]
        if h_score < self.min_humanization_score:
            validations.append({
                "check": "humanization_score",
                "passed": False if strict else True,
                "message": f"Low humanization: {h_score:.2f} (minimum: {self.min_humanization_score})",
            })
            if strict:
                passed = False
        else:
            validations.append({
                "check": "humanization_score",
                "passed": True,
                "message": f"Humanization score OK: {h_score:.2f}",
            })

        # Banned words validation
        banned_count = metrics["banned_word_count"]
        if banned_count > 0:
            validations.append({
                "check": "banned_words",
                "passed": False if strict else True,
                "message": f"Contains {banned_count} banned AI words",
            })
            if strict:
                passed = False
        else:
            validations.append({
                "check": "banned_words",
                "passed": True,
                "message": "No banned words found",
            })

        # Sentence count validation
        sentence_count = metrics["sentence_count"]
        if sentence_count < 3:
            validations.append({
                "check": "sentence_count",
                "passed": False,
                "message": f"Too few sentences: {sentence_count}",
            })
            passed = False
        else:
            validations.append({
                "check": "sentence_count",
                "passed": True,
                "message": f"Sentence count OK: {sentence_count}",
            })

        # Overall result
        result = {
            "passed": passed,
            "quality_level": quality_assessment["quality_level"],
            "validations": validations,
            "metrics": metrics,
            "ai_detection": ai_detection,
            "recommendations": quality_assessment["recommendations"],
        }

        # Log result
        if passed:
            logger.info(f"Quality check PASSED - Humanization: {h_score:.2f}, AI Score: {ai_score:.2f}")
        else:
            logger.warning(f"Quality check FAILED - Issues: {len([v for v in validations if not v['passed']])}")

        return result

    def get_improvement_suggestions(self, text: str) -> List[str]:
        """
        Get specific suggestions to improve text quality.

        Returns:
            List of actionable suggestions
        """
        check_result = self.check(text, strict=False)
        suggestions = []

        metrics = check_result["metrics"]
        ai_detection = check_result["ai_detection"]

        # Burstiness suggestions
        if metrics["burstiness_score"] < self.target_burstiness:
            suggestions.append(
                "Increase sentence length variation: mix very short sentences (5-8 words) "
                "with longer ones (20-30 words)"
            )

        # Banned words suggestions
        if metrics["banned_word_count"] > 0:
            suggestions.append(
                f"Remove {metrics['banned_word_count']} banned AI words "
                "(delve, crucial, comprehensive, etc.)"
            )

        # Colloquialisms suggestions
        if metrics["colloquialism_count"] == 0:
            suggestions.append(
                "Add 1-2 natural Dominican colloquialisms "
                "(fíjate que, o sea, la cosa es que)"
            )

        # AI score suggestions
        if ai_detection["ai_score"] > self.max_ai_score:
            suggestions.append(
                "Text sounds too AI-generated. Add more natural imperfections, "
                "contractions, and informal expressions"
            )

        # Structural suggestions
        if ai_detection["signals"]["repetitive_structure"] > 50:
            suggestions.append(
                "Vary sentence structures more - avoid starting sentences the same way"
            )

        # Generic patterns
        if ai_detection["signals"]["generic_patterns"] > 50:
            suggestions.append(
                "Reduce generic phrases like 'en conclusión', 'es importante destacar', etc."
            )

        return suggestions


# Global instance
quality_checker = QualityChecker()


def validate_text(text: str, strict: bool = False) -> Dict[str, any]:
    """
    Convenience function to validate text quality.

    Args:
        text: Text to validate
        strict: Apply strict validation

    Returns:
        Quality check result
    """
    return quality_checker.check(text, strict=strict)


def get_quality_report(text: str) -> str:
    """
    Get human-readable quality report.

    Returns:
        Formatted report string
    """
    result = quality_checker.check(text)

    report_lines = [
        "=" * 60,
        "QUALITY REPORT",
        "=" * 60,
        f"Status: {'PASSED' if result['passed'] else 'FAILED'}",
        f"Quality Level: {result['quality_level'].upper()}",
        "",
        "METRICS:",
        f"  Words: {result['metrics']['word_count']}",
        f"  Sentences: {result['metrics']['sentence_count']}",
        f"  Burstiness: {result['metrics']['burstiness_score']:.2f}",
        f"  Humanization Score: {result['metrics']['humanization_score']:.2f}/100",
        f"  AI Detection Score: {result['ai_detection']['ai_score']:.2f}%",
        "",
        "VALIDATIONS:",
    ]

    for validation in result["validations"]:
        status = "✓" if validation["passed"] else "✗"
        report_lines.append(f"  {status} {validation['message']}")

    if result["recommendations"]:
        report_lines.append("")
        report_lines.append("RECOMMENDATIONS:")
        for rec in result["recommendations"]:
            report_lines.append(f"  - {rec}")

    report_lines.append("=" * 60)

    return "\n".join(report_lines)
