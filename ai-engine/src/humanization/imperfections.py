"""
Imperfection injection - Add natural human writing imperfections
"""
import random
from typing import List
from loguru import logger

from ..utils.text_processing import split_sentences, normalize_spaces_around_punctuation
from ..config.settings import settings


class ImperfectionInjector:
    """
    Injects natural imperfections to make text more human.
    Target: ~5% of sentences

    Imperfections include:
    - Slight repetitions
    - Natural transitions
    - Clarifications
    - Hedging
    """

    def __init__(self, frequency: float = settings.imperfection_frequency):
        self.frequency = frequency

        # Natural transition phrases
        self.transitions = [
            "Ahora bien",
            "Dicho esto",
            "De hecho",
            "En efecto",
            "Por cierto",
            "Cabe destacar",
            "Es más",
            "Incluso",
        ]

        # Clarification phrases
        self.clarifications = [
            "es decir",
            "o sea",
            "en otras palabras",
            "dicho de otro modo",
            "mejor dicho",
            "para ser más claro",
        ]

        # Hedging expressions
        self.hedges = [
            "en cierta medida",
            "hasta cierto punto",
            "en general",
            "por lo general",
            "generalmente",
            "en la mayoría de casos",
            "usualmente",
        ]

        # Minor repetition templates
        self.repetition_patterns = [
            "sí, {word}",
            "{word}, exactamente {word}",
            "muy {word}",
        ]

    def inject(self, text: str) -> str:
        """
        Inject natural imperfections into text.

        Args:
            text: Input text

        Returns:
            Text with imperfections
        """
        sentences = split_sentences(text)
        if not sentences:
            return text

        # Determine how many sentences to modify
        num_to_modify = max(1, int(len(sentences) * self.frequency))

        logger.info(f"Injecting imperfections into {num_to_modify}/{len(sentences)} sentences")

        # Randomly select sentences to modify
        indices_to_modify = random.sample(range(len(sentences)), min(num_to_modify, len(sentences)))

        modified_sentences = []
        for i, sentence in enumerate(sentences):
            if i in indices_to_modify:
                imperfection_type = random.choice(['transition', 'clarification', 'hedge', 'repetition'])
                modified = self._inject_imperfection(sentence, imperfection_type)
                modified_sentences.append(modified)
                logger.debug(f"Modified sentence {i}: added {imperfection_type}")
            else:
                modified_sentences.append(sentence)

        # Reconstruct text
        result = ' '.join(modified_sentences)
        return normalize_spaces_around_punctuation(result)

    def _inject_imperfection(self, sentence: str, imperfection_type: str) -> str:
        """
        Inject a specific type of imperfection.

        Args:
            sentence: Input sentence
            imperfection_type: Type of imperfection to inject

        Returns:
            Modified sentence
        """
        if imperfection_type == 'transition':
            return self._add_transition(sentence)
        elif imperfection_type == 'clarification':
            return self._add_clarification(sentence)
        elif imperfection_type == 'hedge':
            return self._add_hedge(sentence)
        elif imperfection_type == 'repetition':
            return self._add_repetition(sentence)
        else:
            return sentence

    def _add_transition(self, sentence: str) -> str:
        """Add a natural transition at the beginning"""
        transition = random.choice(self.transitions)
        return f"{transition}, {sentence[0].lower() + sentence[1:]}"

    def _add_clarification(self, sentence: str) -> str:
        """Add a clarification phrase in the middle"""
        words = sentence.split()
        if len(words) < 5:
            return sentence

        # Try to insert at a comma or after a clause
        insertion_points = []
        for i, word in enumerate(words):
            if word.endswith(',') or word in ['que', 'cual', 'donde']:
                insertion_points.append(i)

        if insertion_points:
            insert_at = random.choice(insertion_points)
            clarification = random.choice(self.clarifications)
            words.insert(insert_at + 1, clarification + ',')
            return ' '.join(words)

        return sentence

    def _add_hedge(self, sentence: str) -> str:
        """Add a hedging expression"""
        words = sentence.split()
        if len(words) < 4:
            return sentence

        hedge = random.choice(self.hedges)

        # Insert after verb or at strategic point
        insert_at = random.randint(2, min(len(words) - 2, 5))
        words.insert(insert_at, hedge + ',')

        return ' '.join(words)

    def _add_repetition(self, sentence: str) -> str:
        """Add a minor natural repetition"""
        words = sentence.split()
        if len(words) < 5:
            return sentence

        # Find adjectives or adverbs (simple heuristic: words ending in -mente, -oso, -ivo)
        candidates = []
        for i, word in enumerate(words):
            word_lower = word.lower().rstrip('.,;:!?')
            if any(word_lower.endswith(suffix) for suffix in ['mente', 'oso', 'osa', 'ivo', 'iva']):
                candidates.append((i, word_lower))

        if candidates:
            idx, word = random.choice(candidates)
            # Add emphasis: "muy importante" or "realmente importante"
            emphasis = random.choice(['muy', 'realmente', 'verdaderamente', 'sumamente'])
            words[idx] = f"{emphasis} {words[idx]}"
            return ' '.join(words)

        return sentence


# Global instance
imperfection_injector = ImperfectionInjector()


def inject_imperfections(text: str, frequency: float = None) -> str:
    """
    Convenience function to inject imperfections.

    Args:
        text: Input text
        frequency: Target frequency (default from settings)

    Returns:
        Text with imperfections
    """
    if frequency is not None:
        injector = ImperfectionInjector(frequency=frequency)
    else:
        injector = imperfection_injector

    return injector.inject(text)


def add_natural_transition(sentence: str) -> str:
    """
    Add a natural transition to a sentence.

    Args:
        sentence: Input sentence

    Returns:
        Sentence with transition
    """
    transitions = [
        "Ahora bien", "Dicho esto", "De hecho", "En efecto",
        "Por cierto", "Es más", "Incluso"
    ]
    transition = random.choice(transitions)
    return f"{transition}, {sentence[0].lower() + sentence[1:]}"


def add_hedge_expression(sentence: str) -> str:
    """
    Add a hedging expression to a sentence.

    Args:
        sentence: Input sentence

    Returns:
        Sentence with hedge
    """
    hedges = [
        "en cierta medida", "hasta cierto punto", "en general",
        "por lo general", "usualmente"
    ]
    hedge = random.choice(hedges)

    words = sentence.split()
    if len(words) >= 4:
        insert_at = random.randint(2, min(len(words) - 2, 5))
        words.insert(insert_at, hedge + ',')
        return ' '.join(words)

    return sentence
