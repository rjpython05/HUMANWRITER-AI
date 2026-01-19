"""
Embeddings generation using sentence-transformers
"""
import numpy as np
from typing import List, Union
from sentence_transformers import SentenceTransformer
from loguru import logger
import torch


class EmbeddingGenerator:
    """
    Generates embeddings for text using sentence-transformers
    """

    def __init__(
        self,
        model_name: str = "paraphrase-multilingual-MiniLM-L12-v2",
        batch_size: int = 32,
        device: str = None
    ):
        """
        Initialize embedding generator

        Args:
            model_name: Sentence transformer model name
            batch_size: Batch size for processing
            device: Device to use ('cuda', 'cpu', or None for auto-detect)
        """
        self.model_name = model_name
        self.batch_size = batch_size

        # Auto-detect device if not specified
        if device is None:
            device = "cuda" if torch.cuda.is_available() else "cpu"
        self.device = device

        logger.info(f"Loading embedding model: {model_name} on {device}")

        try:
            self.model = SentenceTransformer(model_name, device=device)
            logger.info(f"Embedding model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load embedding model: {e}")
            raise

    def generate_embeddings(
        self,
        texts: Union[str, List[str]],
        normalize: bool = True,
        show_progress: bool = False
    ) -> np.ndarray:
        """
        Generate embeddings for text(s)

        Args:
            texts: Single text string or list of texts
            normalize: Whether to normalize embeddings
            show_progress: Show progress bar for batch processing

        Returns:
            Numpy array of embeddings
            - Shape: (embedding_dim,) for single text
            - Shape: (num_texts, embedding_dim) for multiple texts
        """
        # Convert single text to list
        if isinstance(texts, str):
            texts = [texts]
            single_text = True
        else:
            single_text = False

        logger.info(f"Generating embeddings for {len(texts)} text(s)")

        try:
            # Generate embeddings
            embeddings = self.model.encode(
                texts,
                batch_size=self.batch_size,
                show_progress_bar=show_progress,
                normalize_embeddings=normalize,
                convert_to_numpy=True
            )

            logger.info(f"Generated embeddings shape: {embeddings.shape}")

            # Return single embedding if input was single text
            if single_text:
                return embeddings[0]

            return embeddings

        except Exception as e:
            logger.error(f"Failed to generate embeddings: {e}")
            raise

    def batch_generate(
        self,
        texts: List[str],
        batch_size: int = None
    ) -> List[np.ndarray]:
        """
        Generate embeddings in batches

        Args:
            texts: List of texts
            batch_size: Batch size (overrides default if provided)

        Returns:
            List of embedding arrays
        """
        batch_size = batch_size or self.batch_size

        logger.info(f"Batch generating embeddings for {len(texts)} texts with batch size {batch_size}")

        embeddings_list = []

        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            batch_embeddings = self.generate_embeddings(batch, show_progress=False)
            embeddings_list.append(batch_embeddings)

            logger.debug(f"Processed batch {i // batch_size + 1}/{(len(texts) - 1) // batch_size + 1}")

        # Concatenate all batches
        all_embeddings = np.vstack(embeddings_list)

        logger.info(f"Batch generation complete. Total embeddings: {len(all_embeddings)}")
        return all_embeddings

    def get_embedding_dimension(self) -> int:
        """
        Get embedding dimension of the model

        Returns:
            Embedding dimension
        """
        return self.model.get_sentence_embedding_dimension()

    def compute_similarity(
        self,
        embedding1: np.ndarray,
        embedding2: np.ndarray,
        metric: str = "cosine"
    ) -> float:
        """
        Compute similarity between two embeddings

        Args:
            embedding1: First embedding
            embedding2: Second embedding
            metric: Similarity metric ('cosine', 'dot', 'euclidean')

        Returns:
            Similarity score
        """
        if metric == "cosine":
            # Cosine similarity (assumes normalized embeddings)
            return float(np.dot(embedding1, embedding2))

        elif metric == "dot":
            # Dot product
            return float(np.dot(embedding1, embedding2))

        elif metric == "euclidean":
            # Negative euclidean distance (so higher is more similar)
            return -float(np.linalg.norm(embedding1 - embedding2))

        else:
            raise ValueError(f"Unknown similarity metric: {metric}")

    def find_most_similar(
        self,
        query_embedding: np.ndarray,
        candidate_embeddings: np.ndarray,
        top_k: int = 5
    ) -> tuple:
        """
        Find most similar embeddings to query

        Args:
            query_embedding: Query embedding
            candidate_embeddings: Array of candidate embeddings
            top_k: Number of top results to return

        Returns:
            Tuple of (indices, similarities)
        """
        # Compute similarities (assuming normalized embeddings)
        similarities = np.dot(candidate_embeddings, query_embedding)

        # Get top-k indices
        top_indices = np.argsort(similarities)[::-1][:top_k]
        top_similarities = similarities[top_indices]

        return top_indices, top_similarities

    def encode_queries(
        self,
        queries: Union[str, List[str]],
        **kwargs
    ) -> np.ndarray:
        """
        Encode queries (alias for generate_embeddings with query-specific settings)

        Args:
            queries: Query string or list of queries
            **kwargs: Additional arguments for encoding

        Returns:
            Query embeddings
        """
        return self.generate_embeddings(queries, **kwargs)

    def encode_corpus(
        self,
        corpus: List[str],
        batch_size: int = None,
        show_progress: bool = True
    ) -> np.ndarray:
        """
        Encode corpus documents

        Args:
            corpus: List of documents
            batch_size: Batch size for processing
            show_progress: Show progress bar

        Returns:
            Corpus embeddings
        """
        batch_size = batch_size or self.batch_size

        logger.info(f"Encoding corpus of {len(corpus)} documents")

        embeddings = self.model.encode(
            corpus,
            batch_size=batch_size,
            show_progress_bar=show_progress,
            normalize_embeddings=True,
            convert_to_numpy=True
        )

        logger.info(f"Encoded corpus: {embeddings.shape}")
        return embeddings


# Global instance
_embedding_generator = None


def get_embedding_generator(
    model_name: str = "paraphrase-multilingual-MiniLM-L12-v2"
) -> EmbeddingGenerator:
    """
    Get or create global EmbeddingGenerator instance

    Args:
        model_name: Model name (only used if creating new instance)

    Returns:
        EmbeddingGenerator instance
    """
    global _embedding_generator
    if _embedding_generator is None:
        _embedding_generator = EmbeddingGenerator(model_name=model_name)
    return _embedding_generator
