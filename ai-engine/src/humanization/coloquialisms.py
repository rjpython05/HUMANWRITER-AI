"""
Colloquialism injection - Add natural Dominican expressions
"""
import random
from typing import List
from loguru import logger

from ..utils.text_processing import split_sentences, normalize_spaces_around_punctuation
from ..config.prompts import DOMINICAN_COLLOQUIALISMS, THINKING_MARKERS
from ..config.settings import settings


class ColloquialismInjector:
    """
    Injects Dominican colloquialisms naturally into text.
    Target: ~5% of sentences
    """

    def __init__(
        self,
        frequency: float = settings.colloquialism_frequency,
        colloquialisms: List[str] = None,
    ):
        self.frequency = frequency
        self.colloquialisms = colloquialisms or DOMINICAN_COLLOQUIALISMS
        self.thinking_markers = THINKING_MARKERS

    def inject(self, text: str) -> str:
        """
        Inject colloquialisms into text.

        Args:
            text: Input text

        Returns:
            Text with colloquialisms
        """
        sentences = split_sentences(text)
        if not sentences:
            return text

        # Determine how many sentences to modify
        num_to_modify = max(1, int(len(sentences) * self.frequency))

        logger.info(f"Injecting colloquialisms into {num_to_modify}/{len(sentences)} sentences")

        # Randomly select sentences to modify
        indices_to_modify = random.sample(range(len(sentences)), min(num_to_modify, len(sentences)))

        modified_sentences = []
        for i, sentence in enumerate(sentences):
            if i in indices_to_modify:
                modified = self._inject_into_sentence(sentence)
                modified_sentences.append(modified)
                logger.debug(f"Modified sentence {i}: added colloquialism")
            else:
                modified_sentences.append(sentence)

        # Reconstruct text
        result = ' '.join(modified_sentences)
        return normalize_spaces_around_punctuation(result)

    def _inject_into_sentence(self, sentence: str) -> str:
        """
        Inject a colloquialism into a single sentence.

        Strategies:
        1. Add at the beginning (60%)
        2. Insert in the middle at a comma (30%)
        3. Add at a conjunction (10%)
        """
        strategy = random.random()

        if strategy < 0.6:
            # Add at beginning
            colloquialism = random.choice(self.colloquialisms)
            return f"{colloquialism.capitalize()}, {sentence[0].lower() + sentence[1:]}"

        elif strategy < 0.9:
            # Try to insert at comma or conjunction
            words = sentence.split()

            # Find insertion points (commas, 'y', 'pero', etc.)
            insertion_points = []
            for i, word in enumerate(words):
                if word.rstrip(',') in ['y', 'pero', 'aunque'] or word.endswith(','):
                    insertion_points.append(i)

            if insertion_points:
                # Insert at a random insertion point
                insert_at = random.choice(insertion_points)
                colloquialism = random.choice(self.colloquialisms)

                words.insert(insert_at + 1, colloquialism + ',')
                return ' '.join(words)

        # If no good insertion point, add thinking marker
        thinking = random.choice(self.thinking_markers)
        return f"{thinking.capitalize()} {sentence[0].lower() + sentence[1:]}"

    def calculate_current_frequency(self, text: str) -> float:
        """
        Calculate current colloquialism frequency in text.

        Returns:
            Ratio of sentences containing colloquialisms
        """
        sentences = split_sentences(text)
        if not sentences:
            return 0.0

        count = 0
        for sentence in sentences:
            sentence_lower = sentence.lower()
            if any(colloq in sentence_lower for colloq in self.colloquialisms):
                count += 1

        return count / len(sentences)

    def needs_injection(self, text: str) -> bool:
        """
        Check if text needs colloquialism injection.

        Returns:
            True if below target frequency
        """
        current_freq = self.calculate_current_frequency(text)
        return current_freq < self.frequency


# Global instance
colloquialism_injector = ColloquialismInjector()


def inject_colloquialisms(text: str, frequency: float = None) -> str:
    """
    Convenience function to inject colloquialisms.

    Args:
        text: Input text
        frequency: Target frequency (default from settings)

    Returns:
        Text with colloquialisms
    """
    if frequency is not None:
        injector = ColloquialismInjector(frequency=frequency)
    else:
        injector = colloquialism_injector

    return injector.inject(text)


def add_thinking_marker(sentence: str) -> str:
    """
    Add a thinking marker to a sentence.

    Args:
        sentence: Input sentence

    Returns:
        Sentence with thinking marker
    """
    marker = random.choice(THINKING_MARKERS)
    return f"{marker.capitalize()} {sentence[0].lower() + sentence[1:]}"


def add_colloquialism_to_start(sentence: str) -> str:
    """
    Add a colloquialism to the start of a sentence.

    Args:
        sentence: Input sentence

    Returns:
        Sentence with colloquialism
    """
    colloquialism = random.choice(DOMINICAN_COLLOQUIALISMS)
    return f"{colloquialism.capitalize()}, {sentence[0].lower() + sentence[1:]}"
