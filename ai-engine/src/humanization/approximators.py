"""
Replace exact numbers with approximations to make text more human
"""
import re
import random
from typing import Tuple
from loguru import logger

from ..config.prompts import APPROXIMATORS
from ..config.settings import settings


def replace_numbers_with_approximations(
    text: str,
    frequency: float = None
) -> Tuple[str, int]:
    """
    Replace exact numbers with approximations

    Args:
        text: Input text
        frequency: Probability of replacing a number (0-1, default from settings)

    Returns:
        Tuple of (modified_text, num_replacements)
    """
    frequency = frequency if frequency is not None else settings.approximator_frequency

    if frequency <= 0:
        return text, 0

    logger.debug(f"Replacing numbers with approximations (frequency={frequency})")

    # Pattern to match numbers (integers and decimals)
    # Matches standalone numbers, not part of years or IDs
    number_pattern = r'\b(\d+(?:\.\d+)?)\b'

    replacements_made = 0
    result = text

    def replace_number(match):
        nonlocal replacements_made

        # Don't replace if random check fails
        if random.random() > frequency:
            return match.group(0)

        number_str = match.group(1)

        # Don't replace numbers that look like years (4 digits in range 1900-2100)
        try:
            num = float(number_str)
            if len(number_str) == 4 and 1900 <= num <= 2100:
                return match.group(0)
        except ValueError:
            return match.group(0)

        # Choose random approximator
        approximator = random.choice(APPROXIMATORS)

        # Format replacement based on number type
        try:
            if '.' in number_str:
                # Decimal number
                replacement = f"{approximator} {number_str}"
            else:
                # Integer
                num = int(number_str)

                # For large numbers, might round them
                if num >= 100 and random.random() < 0.3:
                    # Round to nearest 10 or 100
                    if num >= 1000:
                        rounded = round(num, -2)  # Round to nearest 100
                    else:
                        rounded = round(num, -1)  # Round to nearest 10
                    replacement = f"{approximator} {rounded}"
                else:
                    replacement = f"{approximator} {number_str}"

            replacements_made += 1
            return replacement

        except ValueError:
            return match.group(0)

    # Apply replacements
    result = re.sub(number_pattern, replace_number, result)

    logger.info(f"Replaced {replacements_made} numbers with approximations")

    return result, replacements_made


def approximate_percentages(
    text: str,
    frequency: float = 0.5
) -> Tuple[str, int]:
    """
    Approximate exact percentages

    Args:
        text: Input text
        frequency: Probability of approximating a percentage

    Returns:
        Tuple of (modified_text, num_replacements)
    """
    logger.debug("Approximating percentages")

    # Pattern to match percentages like "47%" or "47.5%"
    percentage_pattern = r'\b(\d+(?:\.\d+)?)\s*%'

    replacements_made = 0

    def replace_percentage(match):
        nonlocal replacements_made

        if random.random() > frequency:
            return match.group(0)

        try:
            value = float(match.group(1))

            # Round to nearest 5 or 10
            if random.random() < 0.5:
                rounded = round(value / 5) * 5
            else:
                rounded = round(value / 10) * 10

            # Use approximator sometimes
            if random.random() < 0.3:
                approximator = random.choice(["alrededor del", "cerca del", "aproximadamente"])
                replacement = f"{approximator} {int(rounded)}%"
            else:
                replacement = f"{int(rounded)}%"

            replacements_made += 1
            return replacement

        except ValueError:
            return match.group(0)

    result = re.sub(percentage_pattern, replace_percentage, text)

    logger.info(f"Approximated {replacements_made} percentages")

    return result, replacements_made


def soften_precise_statements(
    text: str,
    frequency: float = 0.1
) -> Tuple[str, int]:
    """
    Soften overly precise or absolute statements

    Args:
        text: Input text
        frequency: Probability of softening a statement

    Returns:
        Tuple of (modified_text, num_replacements)
    """
    logger.debug("Softening precise statements")

    # Patterns for absolute statements
    absolute_patterns = [
        (r'\b(siempre)\b', ['generalmente', 'casi siempre', 'usualmente']),
        (r'\b(nunca)\b', ['rara vez', 'casi nunca', 'pocas veces']),
        (r'\b(todos)\b', ['la mayoría', 'casi todos', 'muchos']),
        (r'\b(nadie)\b', ['pocos', 'casi nadie', 'muy pocos']),
        (r'\b(completamente)\b', ['en gran medida', 'mayormente', 'bastante']),
        (r'\b(totalmente)\b', ['en gran parte', 'mayormente', 'bastante']),
        (r'\b(absolutamente)\b', ['muy', 'bastante', 'considerablemente']),
    ]

    replacements_made = 0
    result = text

    for pattern, alternatives in absolute_patterns:
        def replace_absolute(match):
            nonlocal replacements_made

            if random.random() > frequency:
                return match.group(0)

            replacement = random.choice(alternatives)
            replacements_made += 1
            return replacement

        result = re.sub(pattern, replace_absolute, result, flags=re.IGNORECASE)

    logger.info(f"Softened {replacements_made} absolute statements")

    return result, replacements_made


def humanize_with_approximations(
    text: str,
    number_frequency: float = None,
    percentage_frequency: float = 0.5,
    statement_frequency: float = 0.1
) -> Tuple[str, int]:
    """
    Apply all approximation humanization techniques

    Args:
        text: Input text
        number_frequency: Frequency for number approximation (None = use settings)
        percentage_frequency: Frequency for percentage approximation
        statement_frequency: Frequency for statement softening

    Returns:
        Tuple of (modified_text, total_replacements)
    """
    logger.info("Applying approximation-based humanization")

    result = text
    total_replacements = 0

    # Replace numbers with approximations
    result, count = replace_numbers_with_approximations(result, number_frequency)
    total_replacements += count

    # Approximate percentages
    result, count = approximate_percentages(result, percentage_frequency)
    total_replacements += count

    # Soften absolute statements
    result, count = soften_precise_statements(result, statement_frequency)
    total_replacements += count

    logger.info(f"Total approximation replacements: {total_replacements}")

    return result, total_replacements
