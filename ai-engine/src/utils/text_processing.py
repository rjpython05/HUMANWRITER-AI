"""
Text processing utilities for HumanWriter AI
"""
import re
from typing import List, Tuple
import numpy as np


def split_sentences(text: str) -> List[str]:
    """
    Split text into sentences using multiple delimiters.
    Handles Spanish punctuation.
    """
    # Handle common abbreviations to avoid splitting on them
    text = text.replace("Dr.", "Dr<DOT>")
    text = text.replace("Sr.", "Sr<DOT>")
    text = text.replace("Sra.", "Sra<DOT>")
    text = text.replace("etc.", "etc<DOT>")
    text = text.replace("vs.", "vs<DOT>")

    # Split on sentence boundaries
    sentences = re.split(r'[.!?]+\s+', text)

    # Restore abbreviations
    sentences = [s.replace("<DOT>", ".") for s in sentences]

    # Remove empty sentences and strip whitespace
    sentences = [s.strip() for s in sentences if s.strip()]

    return sentences


def count_words(text: str) -> int:
    """Count words in text"""
    words = re.findall(r'\b\w+\b', text)
    return len(words)


def count_sentences(text: str) -> int:
    """Count sentences in text"""
    return len(split_sentences(text))


def calculate_average_sentence_length(text: str) -> float:
    """Calculate average sentence length in words"""
    sentences = split_sentences(text)
    if not sentences:
        return 0.0

    total_words = sum(count_words(s) for s in sentences)
    return total_words / len(sentences)


def calculate_sentence_length_variance(text: str) -> Tuple[float, float]:
    """
    Calculate variance and standard deviation of sentence lengths.
    Returns (variance, std_dev)
    """
    sentences = split_sentences(text)
    if len(sentences) < 2:
        return 0.0, 0.0

    lengths = [count_words(s) for s in sentences]
    variance = np.var(lengths, ddof=1)
    std_dev = np.std(lengths, ddof=1)

    return variance, std_dev


def extract_numbers(text: str) -> List[Tuple[str, int, int]]:
    """
    Extract all numbers from text with their positions.
    Returns list of (number_string, start_pos, end_pos)
    """
    pattern = r'\b\d+(?:[.,]\d+)?\b'
    matches = []

    for match in re.finditer(pattern, text):
        matches.append((match.group(), match.start(), match.end()))

    return matches


def find_banned_words(text: str, banned_words: List[str]) -> List[str]:
    """
    Find banned words in text (case-insensitive).
    Returns list of found banned words.
    """
    text_lower = text.lower()
    found = []

    for word in banned_words:
        if word.lower() in text_lower:
            found.append(word)

    return found


def count_word_frequency(text: str, words: List[str]) -> int:
    """
    Count total frequency of words from a list in text.
    Case-insensitive.
    """
    text_lower = text.lower()
    total = 0

    for word in words:
        # Use word boundaries to match whole words
        pattern = r'\b' + re.escape(word.lower()) + r'\b'
        matches = re.findall(pattern, text_lower)
        total += len(matches)

    return total


def truncate_text(text: str, max_words: int) -> str:
    """Truncate text to maximum number of words"""
    words = text.split()
    if len(words) <= max_words:
        return text

    truncated = ' '.join(words[:max_words])
    return truncated + '...'


def clean_whitespace(text: str) -> str:
    """Clean excessive whitespace from text"""
    # Replace multiple spaces with single space
    text = re.sub(r' +', ' ', text)

    # Replace multiple newlines with max 2
    text = re.sub(r'\n{3,}', '\n\n', text)

    # Remove trailing whitespace from lines
    lines = [line.rstrip() for line in text.split('\n')]
    text = '\n'.join(lines)

    return text.strip()


def split_into_chunks(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    """
    Split text into overlapping chunks by word count.
    Useful for processing long documents.
    """
    words = text.split()
    chunks = []

    start = 0
    while start < len(words):
        end = start + chunk_size
        chunk_words = words[start:end]
        chunks.append(' '.join(chunk_words))

        if end >= len(words):
            break

        start = end - overlap

    return chunks


def merge_sentences(sentences: List[str]) -> str:
    """
    Merge multiple sentences into one.
    Handles proper spacing and punctuation.
    """
    if not sentences:
        return ""

    # Remove trailing punctuation from all but last
    merged_parts = []
    for i, sentence in enumerate(sentences):
        s = sentence.strip()
        if i < len(sentences) - 1:
            # Remove trailing punctuation
            s = re.sub(r'[.!?]+$', '', s)
        merged_parts.append(s)

    # Join with comma or 'y'
    if len(merged_parts) == 2:
        return f"{merged_parts[0]} y {merged_parts[1]}"
    else:
        return ', '.join(merged_parts[:-1]) + f" y {merged_parts[-1]}"


def split_long_sentence(sentence: str, max_words: int = 25) -> List[str]:
    """
    Split a long sentence into shorter ones.
    Tries to split at natural boundaries (conjunctions, commas).
    """
    words = sentence.split()
    if len(words) <= max_words:
        return [sentence]

    # Try to split at conjunctions or commas
    split_points = []
    conjunctions = ['y', 'pero', 'aunque', 'sin embargo', 'mientras', 'cuando', 'porque']

    for i, word in enumerate(words):
        if word.rstrip(',') in conjunctions or word.endswith(','):
            split_points.append(i)

    if not split_points:
        # No natural split point, split at midpoint
        mid = len(words) // 2
        part1 = ' '.join(words[:mid]) + '.'
        part2 = ' '.join(words[mid:])
        return [part1, part2]

    # Split at first good point after 40% through sentence
    target = len(words) * 0.4
    best_split = min(split_points, key=lambda x: abs(x - target))

    part1 = ' '.join(words[:best_split + 1]).rstrip(',') + '.'
    part2 = ' '.join(words[best_split + 1:])

    return [part1, part2]


def calculate_burstiness_score(text: str) -> float:
    """
    Calculate burstiness score (sentence length variation).
    Higher score = more human-like variation.
    Target: > 8.0
    """
    _, std_dev = calculate_sentence_length_variance(text)
    return float(std_dev)


def is_question(sentence: str) -> bool:
    """Check if sentence is a question"""
    return sentence.strip().endswith('?')


def get_sentence_sentiment_markers(sentence: str) -> List[str]:
    """
    Extract sentiment/opinion markers from sentence.
    Returns list of found markers.
    """
    markers = [
        'creo que', 'pienso que', 'me parece', 'considero',
        'en mi opinión', 'desde mi perspectiva', 'quizás',
        'probablemente', 'posiblemente'
    ]

    found = []
    sentence_lower = sentence.lower()

    for marker in markers:
        if marker in sentence_lower:
            found.append(marker)

    return found


def normalize_spaces_around_punctuation(text: str) -> str:
    """
    Normalize spacing around punctuation marks.
    Spanish rules: space after, no space before (except opening marks).
    """
    # Remove spaces before closing punctuation
    text = re.sub(r'\s+([.,;:!?])', r'\1', text)

    # Ensure space after closing punctuation (if followed by letter)
    text = re.sub(r'([.,;:!?])([A-Za-zÁÉÍÓÚáéíóúÑñ])', r'\1 \2', text)

    # Handle opening punctuation (¿ ¡)
    text = re.sub(r'([¿¡])\s+', r'\1', text)
    text = re.sub(r'([A-Za-zÁÉÍÓÚáéíóúÑñ])([¿¡])', r'\1 \2', text)

    return text


def extract_paragraphs(text: str) -> List[str]:
    """Split text into paragraphs"""
    paragraphs = text.split('\n\n')
    return [p.strip() for p in paragraphs if p.strip()]


def count_characters_no_spaces(text: str) -> int:
    """Count characters excluding spaces"""
    return len(text.replace(' ', '').replace('\n', '').replace('\t', ''))
