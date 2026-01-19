"""
RAG (Retrieval-Augmented Generation) retriever
Retrieves relevant documents from vector database to augment generation
"""
from typing import List, Dict, Any, Optional
from loguru import logger
import numpy as np

from ..config.settings import settings
from .chromadb_client import get_chromadb_client


class RAGRetriever:
    """
    Retrieves relevant context from vector database for RAG
    """

    def __init__(
        self,
        top_k: int = None,
        similarity_threshold: float = None,
        max_context_length: int = 2000
    ):
        """
        Initialize RAG retriever

        Args:
            top_k: Number of documents to retrieve
            similarity_threshold: Minimum similarity score (0-1)
            max_context_length: Maximum length of context to return
        """
        self.top_k = top_k or settings.rag_top_k
        self.similarity_threshold = similarity_threshold or settings.rag_similarity_threshold
        self.max_context_length = max_context_length

        self.chroma_client = get_chromadb_client()

        logger.info(
            f"Initialized RAGRetriever: "
            f"top_k={self.top_k}, "
            f"threshold={self.similarity_threshold}"
        )

    def retrieve_context(
        self,
        query: str,
        discipline: str = None,
        top_k: int = None,
        collection_name: str = None
    ) -> str:
        """
        Retrieve relevant context for a query

        Args:
            query: Search query
            discipline: Filter by discipline
            top_k: Number of results (overrides default)
            collection_name: Specific collection to search (defaults to settings)

        Returns:
            Formatted context string
        """
        top_k = top_k or self.top_k
        collection_name = collection_name or settings.chromadb_collection

        logger.info(f"Retrieving context for query: '{query[:100]}...'")

        try:
            # Build metadata filter if discipline specified
            where_filter = None
            if discipline:
                where_filter = {"discipline": discipline}
                logger.debug(f"Filtering by discipline: {discipline}")

            # Query ChromaDB
            results = self.chroma_client.query_similar(
                collection_name=collection_name,
                query_text=query,
                n_results=top_k,
                where=where_filter
            )

            # Filter by similarity threshold and rerank
            filtered_results = self._filter_and_rerank(results)

            if not filtered_results:
                logger.warning("No results above similarity threshold")
                return ""

            # Format context
            context = self._format_context(filtered_results)

            logger.info(
                f"Retrieved {len(filtered_results)} relevant documents "
                f"({len(context)} chars)"
            )

            return context

        except Exception as e:
            logger.error(f"Failed to retrieve context: {e}")
            return ""

    def _filter_and_rerank(self, results: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Filter results by similarity threshold and rerank

        Args:
            results: Raw results from ChromaDB

        Returns:
            List of filtered and reranked results
        """
        documents = results.get("documents", [])
        distances = results.get("distances", [])
        metadatas = results.get("metadatas", [])
        ids = results.get("ids", [])

        if not documents:
            return []

        # Convert distances to similarity scores (ChromaDB uses L2 distance)
        # Lower distance = higher similarity
        # Convert to similarity: similarity = 1 / (1 + distance)
        similarities = [1 / (1 + d) for d in distances]

        # Filter by threshold
        filtered = []
        for i, (doc, sim, meta, doc_id) in enumerate(zip(documents, similarities, metadatas, ids)):
            if sim >= self.similarity_threshold:
                filtered.append({
                    "document": doc,
                    "similarity": sim,
                    "metadata": meta,
                    "id": doc_id,
                    "rank": i
                })

        # Sort by similarity (already sorted, but ensure it)
        filtered.sort(key=lambda x: x["similarity"], reverse=True)

        logger.debug(
            f"Filtered {len(filtered)}/{len(documents)} results "
            f"above threshold {self.similarity_threshold}"
        )

        return filtered

    def _format_context(self, results: List[Dict[str, Any]]) -> str:
        """
        Format retrieved results into context string

        Args:
            results: List of filtered results

        Returns:
            Formatted context string
        """
        if not results:
            return ""

        context_parts = []
        total_length = 0

        for i, result in enumerate(results, 1):
            doc = result["document"]
            sim = result["similarity"]
            meta = result.get("metadata", {})

            # Format this document
            part = f"\n[Documento {i} - Relevancia: {sim:.2f}]\n"

            # Add metadata if available
            if meta:
                if "author" in meta:
                    part += f"Autor: {meta['author']}\n"
                if "title" in meta:
                    part += f"Título: {meta['title']}\n"
                if "year" in meta:
                    part += f"Año: {meta['year']}\n"

            part += f"{doc}\n"

            # Check if adding this would exceed max length
            if total_length + len(part) > self.max_context_length:
                logger.debug(f"Truncating context at {i-1} documents (length limit)")
                break

            context_parts.append(part)
            total_length += len(part)

        context = "\n".join(context_parts)

        # Final truncation if needed
        if len(context) > self.max_context_length:
            context = context[:self.max_context_length] + "\n[... contexto truncado ...]"

        return context

    def retrieve_similar_documents(
        self,
        query: str,
        discipline: str = None,
        top_k: int = None,
        include_metadata: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Retrieve similar documents with full details

        Args:
            query: Search query
            discipline: Filter by discipline
            top_k: Number of results
            include_metadata: Include metadata in results

        Returns:
            List of document dictionaries
        """
        top_k = top_k or self.top_k
        collection_name = settings.chromadb_collection

        logger.info(f"Retrieving similar documents for: '{query[:100]}...'")

        try:
            where_filter = None
            if discipline:
                where_filter = {"discipline": discipline}

            results = self.chroma_client.query_similar(
                collection_name=collection_name,
                query_text=query,
                n_results=top_k,
                where=where_filter
            )

            filtered_results = self._filter_and_rerank(results)

            if include_metadata:
                return filtered_results
            else:
                # Return simplified version
                return [
                    {
                        "document": r["document"],
                        "similarity": r["similarity"]
                    }
                    for r in filtered_results
                ]

        except Exception as e:
            logger.error(f"Failed to retrieve similar documents: {e}")
            return []

    def rerank_results(
        self,
        results: List[Dict[str, Any]],
        query: str = None,
        boost_recent: bool = True,
        boost_metadata: Dict[str, float] = None
    ) -> List[Dict[str, Any]]:
        """
        Rerank results using additional signals

        Args:
            results: List of results to rerank
            query: Original query (for additional relevance scoring)
            boost_recent: Boost more recent documents
            boost_metadata: Metadata fields to boost (field -> boost factor)

        Returns:
            Reranked results
        """
        if not results:
            return results

        logger.info(f"Reranking {len(results)} results")

        # Create copy to avoid modifying original
        reranked = [r.copy() for r in results]

        for result in reranked:
            score = result["similarity"]
            metadata = result.get("metadata", {})

            # Boost recent documents
            if boost_recent and "year" in metadata:
                try:
                    year = int(metadata["year"])
                    if year >= 2020:
                        score *= 1.1
                        logger.debug(f"Boosted recent document (year={year})")
                except (ValueError, TypeError):
                    pass

            # Boost based on metadata
            if boost_metadata:
                for field, boost_factor in boost_metadata.items():
                    if field in metadata and metadata[field]:
                        score *= boost_factor
                        logger.debug(f"Boosted for metadata {field}={metadata[field]}")

            # Update score
            result["reranked_score"] = score

        # Sort by reranked score
        reranked.sort(key=lambda x: x.get("reranked_score", x["similarity"]), reverse=True)

        logger.info("Reranking complete")
        return reranked

    def get_context_stats(self, context: str) -> Dict[str, Any]:
        """
        Get statistics about retrieved context

        Args:
            context: Context string

        Returns:
            Dictionary with statistics
        """
        words = context.split()
        lines = context.split("\n")

        return {
            "total_chars": len(context),
            "total_words": len(words),
            "total_lines": len(lines),
            "avg_word_length": sum(len(w) for w in words) / len(words) if words else 0
        }


# Global instance
_rag_retriever = None


def get_rag_retriever() -> RAGRetriever:
    """
    Get or create global RAGRetriever instance

    Returns:
        RAGRetriever instance
    """
    global _rag_retriever
    if _rag_retriever is None:
        _rag_retriever = RAGRetriever()
    return _rag_retriever
