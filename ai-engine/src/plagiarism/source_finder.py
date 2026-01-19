"""
Source identification - finds which documents are most similar
and extracts matching passages with citations
"""
from typing import List, Dict, Any, Optional
from collections import defaultdict
from loguru import logger

from ..vectorization.chromadb_client import get_chromadb_client


class SourceFinder:
    """
    Identifies source documents that match the checked text
    """

    def __init__(self, collection_name: str = "academic_corpus"):
        """
        Initialize source finder

        Args:
            collection_name: ChromaDB collection name
        """
        self.collection_name = collection_name
        self.chroma_client = get_chromadb_client()
        logger.info("SourceFinder initialized")

    def find_top_sources(
        self,
        matches: List[Dict[str, Any]],
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Find top K most similar source documents

        Args:
            matches: Similarity matches from SimilarityChecker
            top_k: Number of top sources to return

        Returns:
            List of top source documents with statistics
        """
        logger.info(f"Finding top {top_k} sources from {len(matches)} matches")

        # Group matches by source
        source_groups = defaultdict(list)

        for match in matches:
            source_id = match.get("source_id")
            if source_id:
                source_groups[source_id].append(match)

        # Calculate statistics for each source
        source_stats = []

        for source_id, source_matches in source_groups.items():
            # Calculate metrics
            match_count = len(source_matches)
            avg_similarity = sum(m["similarity"] for m in source_matches) / match_count
            max_similarity = max(m["similarity"] for m in source_matches)
            total_similarity = sum(m["similarity"] for m in source_matches)

            # Get metadata from first match
            metadata = source_matches[0].get("source_metadata", {})

            # Extract passages
            passages = self._extract_passages(source_matches)

            source_stats.append({
                "source_id": source_id,
                "metadata": metadata,
                "match_count": match_count,
                "average_similarity": avg_similarity,
                "max_similarity": max_similarity,
                "total_similarity": total_similarity,
                "matched_passages": passages,
                "percentage": avg_similarity * 100  # Convert to percentage
            })

        # Sort by total similarity (considers both frequency and strength)
        source_stats.sort(key=lambda x: x["total_similarity"], reverse=True)

        # Return top K
        top_sources = source_stats[:top_k]

        logger.info(f"Found {len(top_sources)} top sources")

        return top_sources

    def _extract_passages(
        self,
        matches: List[Dict[str, Any]],
        max_passages: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Extract matching passages from matches

        Args:
            matches: List of matches for a source
            max_passages: Maximum number of passages to extract

        Returns:
            List of passage dictionaries
        """
        passages = []

        # Sort matches by similarity
        sorted_matches = sorted(
            matches,
            key=lambda x: x["similarity"],
            reverse=True
        )[:max_passages]

        for match in sorted_matches:
            passages.append({
                "original_text": match.get("chunk_text", ""),
                "matched_text": match.get("matched_text", ""),
                "similarity": match["similarity"],
                "chunk_id": match.get("chunk_id")
            })

        return passages

    def generate_citation(
        self,
        source_metadata: Dict[str, Any],
        citation_style: str = "apa"
    ) -> str:
        """
        Generate citation for a source document

        Args:
            source_metadata: Source document metadata
            citation_style: Citation style ('apa', 'mla', 'chicago')

        Returns:
            Formatted citation string
        """
        # Extract metadata fields
        authors = source_metadata.get("authors", [])
        title = source_metadata.get("title", "Unknown Title")
        year = source_metadata.get("year", "n.d.")
        institution = source_metadata.get("institution", "")
        source = source_metadata.get("source", "")

        # Format authors
        if isinstance(authors, list) and authors:
            if len(authors) == 1:
                author_str = authors[0]
            elif len(authors) == 2:
                author_str = f"{authors[0]} & {authors[1]}"
            else:
                author_str = f"{authors[0]} et al."
        else:
            author_str = "Unknown Author"

        # Generate citation based on style
        if citation_style.lower() == "apa":
            citation = f"{author_str} ({year}). {title}. {institution}."
            if source:
                citation += f" Retrieved from {source}"

        elif citation_style.lower() == "mla":
            citation = f"{author_str}. \"{title}.\" {institution}, {year}."
            if source:
                citation += f" Web. {source}"

        elif citation_style.lower() == "chicago":
            citation = f"{author_str}. \"{title}.\" {institution} ({year})."
            if source:
                citation += f" {source}."

        else:
            # Default to simple format
            citation = f"{author_str} ({year}). {title}. {institution}."

        return citation

    def find_similar_sources(
        self,
        text: str,
        top_k: int = 5,
        discipline: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Find similar sources directly from text query

        Args:
            text: Query text
            top_k: Number of sources to return
            discipline: Optional discipline filter

        Returns:
            List of similar sources
        """
        logger.info(f"Finding similar sources for text query")

        try:
            # Build filter
            where = {}
            if discipline:
                where["discipline"] = discipline

            # Query ChromaDB
            results = self.chroma_client.query_similar(
                collection_name=self.collection_name,
                query_text=text,
                n_results=top_k,
                where=where if where else None
            )

            sources = []

            for doc, distance, metadata, doc_id in zip(
                results.get("documents", []),
                results.get("distances", []),
                results.get("metadatas", []),
                results.get("ids", [])
            ):
                # Convert distance to similarity
                similarity = 1.0 / (1.0 + distance)

                sources.append({
                    "source_id": doc_id,
                    "metadata": metadata,
                    "matched_text": doc,
                    "similarity": similarity,
                    "percentage": similarity * 100,
                    "citation": self.generate_citation(metadata)
                })

            logger.info(f"Found {len(sources)} similar sources")
            return sources

        except Exception as e:
            logger.error(f"Failed to find similar sources: {e}")
            return []

    def get_source_details(
        self,
        source_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Get detailed information about a source document

        Args:
            source_id: Source document ID

        Returns:
            Source details or None if not found
        """
        logger.info(f"Retrieving details for source: {source_id}")

        try:
            collection = self.chroma_client.get_collection(self.collection_name)

            if not collection:
                logger.warning(f"Collection {self.collection_name} not found")
                return None

            # Get document by ID
            results = collection.get(ids=[source_id])

            if not results or not results.get("ids"):
                logger.warning(f"Source {source_id} not found")
                return None

            # Extract data
            metadata = results["metadatas"][0] if results.get("metadatas") else {}
            document = results["documents"][0] if results.get("documents") else ""

            return {
                "source_id": source_id,
                "metadata": metadata,
                "text_preview": document[:500] + "..." if len(document) > 500 else document,
                "citation": self.generate_citation(metadata),
                "title": metadata.get("title", "Unknown"),
                "authors": metadata.get("authors", []),
                "year": metadata.get("year"),
                "institution": metadata.get("institution"),
                "discipline": metadata.get("discipline")
            }

        except Exception as e:
            logger.error(f"Failed to get source details: {e}")
            return None

    def compare_with_specific_source(
        self,
        text: str,
        source_id: str
    ) -> Dict[str, Any]:
        """
        Compare text specifically with one source document

        Args:
            text: Text to check
            source_id: Specific source ID to compare against

        Returns:
            Comparison results
        """
        logger.info(f"Comparing text with source: {source_id}")

        try:
            # Get source details
            source_details = self.get_source_details(source_id)

            if not source_details:
                return {
                    "error": "Source not found",
                    "source_id": source_id
                }

            # Query for similarity
            results = self.chroma_client.query_similar(
                collection_name=self.collection_name,
                query_text=text,
                n_results=10
            )

            # Filter results for this specific source
            source_matches = []

            for doc, distance, metadata, doc_id in zip(
                results.get("documents", []),
                results.get("distances", []),
                results.get("metadatas", []),
                results.get("ids", [])
            ):
                # Check if this result is from our target source
                # (either exact ID match or same document metadata)
                if doc_id == source_id or (
                    metadata.get("title") == source_details["title"] and
                    metadata.get("year") == source_details["year"]
                ):
                    similarity = 1.0 / (1.0 + distance)

                    source_matches.append({
                        "matched_text": doc,
                        "similarity": similarity,
                        "metadata": metadata
                    })

            # Calculate overall similarity
            if source_matches:
                avg_similarity = sum(m["similarity"] for m in source_matches) / len(source_matches)
            else:
                avg_similarity = 0.0

            return {
                "source_id": source_id,
                "source_details": source_details,
                "similarity_percentage": avg_similarity * 100,
                "match_count": len(source_matches),
                "matches": source_matches[:5]  # Top 5 matches
            }

        except Exception as e:
            logger.error(f"Comparison failed: {e}")
            return {
                "error": str(e),
                "source_id": source_id
            }

    def get_citation_formats(
        self,
        source_metadata: Dict[str, Any]
    ) -> Dict[str, str]:
        """
        Get citations in multiple formats

        Args:
            source_metadata: Source metadata

        Returns:
            Dictionary with different citation formats
        """
        return {
            "apa": self.generate_citation(source_metadata, "apa"),
            "mla": self.generate_citation(source_metadata, "mla"),
            "chicago": self.generate_citation(source_metadata, "chicago")
        }
