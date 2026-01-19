"""
Similarity detection using TF-IDF and vector embeddings
Compares text against corpus documents to identify plagiarism
"""
import numpy as np
from typing import List, Dict, Any, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from loguru import logger
import re

from ..vectorization.chromadb_client import get_chromadb_client
from ..vectorization.embeddings import get_embedding_generator
from ..utils.text_processing import clean_text, split_into_sentences


class SimilarityChecker:
    """
    Detects similarity between text and corpus documents
    using both TF-IDF and vector embeddings
    """

    def __init__(
        self,
        collection_name: str = "academic_corpus",
        min_chunk_length: int = 50,
        overlap_size: int = 20
    ):
        """
        Initialize similarity checker

        Args:
            collection_name: ChromaDB collection name
            min_chunk_length: Minimum words in a chunk for comparison
            overlap_size: Number of words to overlap between chunks
        """
        self.collection_name = collection_name
        self.min_chunk_length = min_chunk_length
        self.overlap_size = overlap_size

        # Initialize clients
        self.chroma_client = get_chromadb_client()
        self.embedding_generator = get_embedding_generator()

        logger.info("SimilarityChecker initialized")

    def check_similarity(
        self,
        text: str,
        top_k: int = 10,
        similarity_threshold: float = 0.3
    ) -> Dict[str, Any]:
        """
        Check text for similarity against corpus

        Args:
            text: Text to check
            top_k: Number of top similar documents to retrieve
            similarity_threshold: Minimum similarity score to report

        Returns:
            Dictionary containing similarity results
        """
        logger.info(f"Checking similarity for text of {len(text)} characters")

        # Split text into chunks for analysis
        chunks = self._create_chunks(text)
        logger.info(f"Created {len(chunks)} chunks for analysis")

        # Find similar passages using both methods
        vector_matches = self._find_vector_matches(chunks, top_k)
        tfidf_matches = self._find_tfidf_matches(text, chunks, vector_matches)

        # Merge and score matches
        all_matches = self._merge_matches(vector_matches, tfidf_matches)

        # Filter by threshold
        significant_matches = [
            m for m in all_matches
            if m["similarity"] >= similarity_threshold
        ]

        # Calculate overall similarity
        overall_similarity = self._calculate_overall_similarity(
            significant_matches, len(chunks)
        )

        logger.info(
            f"Found {len(significant_matches)} significant matches. "
            f"Overall similarity: {overall_similarity:.2%}"
        )

        return {
            "overall_similarity": overall_similarity,
            "total_chunks": len(chunks),
            "matched_chunks": len(significant_matches),
            "matches": significant_matches,
            "text_length": len(text),
            "chunks": chunks
        }

    def _create_chunks(self, text: str) -> List[Dict[str, Any]]:
        """
        Split text into overlapping chunks for analysis

        Args:
            text: Input text

        Returns:
            List of chunk dictionaries with text and metadata
        """
        # Clean text
        cleaned = clean_text(text)

        # Split into sentences
        sentences = split_into_sentences(cleaned)

        # Split into words
        words = cleaned.split()

        chunks = []
        chunk_id = 0

        # Create overlapping chunks
        i = 0
        while i < len(words):
            # Get chunk of words
            chunk_words = words[i:i + self.min_chunk_length]

            if len(chunk_words) < self.min_chunk_length and chunks:
                # Last chunk is too small, merge with previous
                break

            chunk_text = " ".join(chunk_words)

            # Find which sentences this chunk covers
            chunk_sentences = []
            for sentence in sentences:
                if any(word in sentence.lower() for word in chunk_words[:5]):
                    chunk_sentences.append(sentence)

            chunks.append({
                "id": chunk_id,
                "text": chunk_text,
                "start_word": i,
                "end_word": i + len(chunk_words),
                "word_count": len(chunk_words),
                "sentences": chunk_sentences
            })

            chunk_id += 1
            i += self.min_chunk_length - self.overlap_size

        return chunks

    def _find_vector_matches(
        self,
        chunks: List[Dict[str, Any]],
        top_k: int
    ) -> List[Dict[str, Any]]:
        """
        Find similar passages using vector similarity

        Args:
            chunks: Text chunks to search
            top_k: Number of results per chunk

        Returns:
            List of vector-based matches
        """
        matches = []

        for chunk in chunks:
            try:
                # Query ChromaDB for similar passages
                results = self.chroma_client.query_similar(
                    collection_name=self.collection_name,
                    query_text=chunk["text"],
                    n_results=min(top_k, 5)  # Limit per chunk
                )

                # Process results
                for i, (doc, distance, metadata, doc_id) in enumerate(zip(
                    results.get("documents", []),
                    results.get("distances", []),
                    results.get("metadatas", []),
                    results.get("ids", [])
                )):
                    # Convert distance to similarity (ChromaDB uses L2 distance)
                    # Normalize to 0-1 range
                    similarity = 1.0 / (1.0 + distance)

                    matches.append({
                        "chunk_id": chunk["id"],
                        "chunk_text": chunk["text"],
                        "matched_text": doc,
                        "similarity": similarity,
                        "method": "vector",
                        "source_id": doc_id,
                        "source_metadata": metadata,
                        "rank": i + 1
                    })

            except Exception as e:
                logger.warning(f"Vector search failed for chunk {chunk['id']}: {e}")

        return matches

    def _find_tfidf_matches(
        self,
        full_text: str,
        chunks: List[Dict[str, Any]],
        vector_matches: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Find similar passages using TF-IDF

        Args:
            full_text: Full text being checked
            chunks: Text chunks
            vector_matches: Existing vector matches to compare against

        Returns:
            List of TF-IDF-based matches
        """
        if not vector_matches:
            return []

        matches = []

        # Extract unique source texts from vector matches
        source_texts = []
        source_metadata = []

        seen_sources = set()
        for match in vector_matches:
            source_id = match["source_id"]
            if source_id not in seen_sources:
                source_texts.append(match["matched_text"])
                source_metadata.append({
                    "source_id": source_id,
                    "metadata": match["source_metadata"]
                })
                seen_sources.add(source_id)

        if not source_texts:
            return []

        try:
            # Create TF-IDF vectorizer
            vectorizer = TfidfVectorizer(
                max_features=1000,
                stop_words=None,  # Keep all words for academic text
                ngram_range=(1, 3),  # Unigrams, bigrams, and trigrams
                min_df=1
            )

            # Combine chunks and sources
            all_texts = [chunk["text"] for chunk in chunks] + source_texts

            # Fit and transform
            tfidf_matrix = vectorizer.fit_transform(all_texts)

            # Calculate similarities between chunks and sources
            chunk_vectors = tfidf_matrix[:len(chunks)]
            source_vectors = tfidf_matrix[len(chunks):]

            similarities = cosine_similarity(chunk_vectors, source_vectors)

            # Process matches
            for chunk_idx, chunk in enumerate(chunks):
                for source_idx, source_info in enumerate(source_metadata):
                    similarity = similarities[chunk_idx, source_idx]

                    if similarity > 0.3:  # Minimum threshold for TF-IDF
                        matches.append({
                            "chunk_id": chunk["id"],
                            "chunk_text": chunk["text"],
                            "matched_text": source_texts[source_idx],
                            "similarity": float(similarity),
                            "method": "tfidf",
                            "source_id": source_info["source_id"],
                            "source_metadata": source_info["metadata"]
                        })

        except Exception as e:
            logger.warning(f"TF-IDF matching failed: {e}")

        return matches

    def _merge_matches(
        self,
        vector_matches: List[Dict[str, Any]],
        tfidf_matches: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Merge vector and TF-IDF matches, combining scores

        Args:
            vector_matches: Vector-based matches
            tfidf_matches: TF-IDF-based matches

        Returns:
            Merged and scored matches
        """
        # Group by chunk_id and source_id
        match_groups = {}

        for match in vector_matches + tfidf_matches:
            key = (match["chunk_id"], match["source_id"])

            if key not in match_groups:
                match_groups[key] = {
                    "chunk_id": match["chunk_id"],
                    "chunk_text": match["chunk_text"],
                    "matched_text": match["matched_text"],
                    "source_id": match["source_id"],
                    "source_metadata": match["source_metadata"],
                    "vector_similarity": 0.0,
                    "tfidf_similarity": 0.0
                }

            if match["method"] == "vector":
                match_groups[key]["vector_similarity"] = match["similarity"]
            else:
                match_groups[key]["tfidf_similarity"] = match["similarity"]

        # Calculate combined similarity scores
        merged_matches = []
        for match_data in match_groups.values():
            # Weighted combination: 60% vector, 40% TF-IDF
            combined_similarity = (
                0.6 * match_data["vector_similarity"] +
                0.4 * match_data["tfidf_similarity"]
            )

            # Use max if only one method found a match
            if match_data["vector_similarity"] == 0.0:
                combined_similarity = match_data["tfidf_similarity"]
            elif match_data["tfidf_similarity"] == 0.0:
                combined_similarity = match_data["vector_similarity"]

            merged_matches.append({
                "chunk_id": match_data["chunk_id"],
                "chunk_text": match_data["chunk_text"],
                "matched_text": match_data["matched_text"],
                "similarity": combined_similarity,
                "vector_similarity": match_data["vector_similarity"],
                "tfidf_similarity": match_data["tfidf_similarity"],
                "source_id": match_data["source_id"],
                "source_metadata": match_data["source_metadata"]
            })

        # Sort by similarity descending
        merged_matches.sort(key=lambda x: x["similarity"], reverse=True)

        return merged_matches

    def _calculate_overall_similarity(
        self,
        matches: List[Dict[str, Any]],
        total_chunks: int
    ) -> float:
        """
        Calculate overall similarity percentage

        Args:
            matches: Similarity matches
            total_chunks: Total number of chunks

        Returns:
            Overall similarity score (0-1)
        """
        if not matches or total_chunks == 0:
            return 0.0

        # Group matches by chunk to avoid double-counting
        chunks_with_matches = set()
        chunk_max_similarities = {}

        for match in matches:
            chunk_id = match["chunk_id"]
            chunks_with_matches.add(chunk_id)

            # Keep highest similarity for each chunk
            if chunk_id not in chunk_max_similarities:
                chunk_max_similarities[chunk_id] = match["similarity"]
            else:
                chunk_max_similarities[chunk_id] = max(
                    chunk_max_similarities[chunk_id],
                    match["similarity"]
                )

        # Calculate weighted average
        # Number of matched chunks * average similarity
        matched_chunk_count = len(chunks_with_matches)
        avg_similarity = sum(chunk_max_similarities.values()) / matched_chunk_count if matched_chunk_count > 0 else 0.0

        # Overall score considers both coverage and similarity
        coverage = matched_chunk_count / total_chunks
        overall = coverage * avg_similarity

        return float(overall)

    def find_exact_matches(
        self,
        text: str,
        min_words: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Find exact phrase matches in corpus

        Args:
            text: Text to check
            min_words: Minimum consecutive words for a match

        Returns:
            List of exact matches
        """
        logger.info(f"Searching for exact matches (min {min_words} words)")

        exact_matches = []
        words = clean_text(text).split()

        # Create n-grams
        for n in range(min_words, min(20, len(words))):  # Check up to 20-word phrases
            for i in range(len(words) - n + 1):
                phrase = " ".join(words[i:i + n])

                # Search in ChromaDB using exact text matching
                try:
                    results = self.chroma_client.query_similar(
                        collection_name=self.collection_name,
                        query_text=phrase,
                        n_results=3
                    )

                    for doc, distance, metadata, doc_id in zip(
                        results.get("documents", []),
                        results.get("distances", []),
                        results.get("metadatas", []),
                        results.get("ids", [])
                    ):
                        # Check if it's a very close match (exact or near-exact)
                        if distance < 0.1:  # Very low distance = very similar
                            exact_matches.append({
                                "phrase": phrase,
                                "length": n,
                                "position": i,
                                "matched_text": doc,
                                "source_id": doc_id,
                                "source_metadata": metadata,
                                "confidence": 1.0 - distance
                            })

                except Exception as e:
                    logger.debug(f"Exact match search failed for phrase: {e}")

        # Remove duplicates and sort by length
        unique_matches = []
        seen_phrases = set()

        for match in sorted(exact_matches, key=lambda x: x["length"], reverse=True):
            if match["phrase"] not in seen_phrases:
                unique_matches.append(match)
                seen_phrases.add(match["phrase"])

        logger.info(f"Found {len(unique_matches)} exact matches")
        return unique_matches

    def highlight_similar_passages(
        self,
        text: str,
        matches: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Identify and highlight similar passages in the original text

        Args:
            text: Original text
            matches: Similarity matches

        Returns:
            List of highlighted passages with positions
        """
        highlighted_passages = []

        # Group matches by chunk
        chunks_with_matches = {}
        for match in matches:
            chunk_id = match["chunk_id"]
            if chunk_id not in chunks_with_matches:
                chunks_with_matches[chunk_id] = []
            chunks_with_matches[chunk_id].append(match)

        # Create highlighted passages
        for chunk_id, chunk_matches in chunks_with_matches.items():
            # Get best match for this chunk
            best_match = max(chunk_matches, key=lambda x: x["similarity"])

            chunk_text = best_match["chunk_text"]

            # Find position in original text (approximate)
            try:
                start_pos = text.lower().find(chunk_text[:50].lower())

                if start_pos != -1:
                    highlighted_passages.append({
                        "text": chunk_text,
                        "start_position": start_pos,
                        "similarity": best_match["similarity"],
                        "source_id": best_match["source_id"],
                        "source_metadata": best_match["source_metadata"],
                        "matched_text": best_match["matched_text"]
                    })
            except Exception as e:
                logger.debug(f"Could not highlight passage: {e}")

        # Sort by position
        highlighted_passages.sort(key=lambda x: x["start_position"])

        return highlighted_passages
