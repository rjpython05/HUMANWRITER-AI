"""
ChromaDB client for vector storage and retrieval
"""
import chromadb
from chromadb.config import Settings
from chromadb.utils import embedding_functions
from typing import List, Dict, Any, Optional
from loguru import logger
import uuid

from ..config.settings import settings
from .embeddings import get_embedding_generator


class ChromaDBClient:
    """
    Client for interacting with ChromaDB vector database
    """

    def __init__(
        self,
        host: str = None,
        port: int = None,
        persist_directory: str = None
    ):
        """
        Initialize ChromaDB client

        Args:
            host: ChromaDB host
            port: ChromaDB port
            persist_directory: Directory for persistent storage (if not using server)
        """
        self.host = host or settings.chromadb_host
        self.port = port or settings.chromadb_port

        logger.info(f"Initializing ChromaDB client: {self.host}:{self.port}")

        try:
            # Try to connect to ChromaDB server
            self.client = chromadb.HttpClient(
                host=self.host,
                port=self.port,
                settings=Settings(
                    anonymized_telemetry=False
                )
            )

            # Test connection
            self.client.heartbeat()
            logger.info("Connected to ChromaDB server successfully")

        except Exception as e:
            logger.warning(f"Failed to connect to ChromaDB server: {e}")
            logger.info("Falling back to persistent client")

            # Fallback to persistent client
            persist_dir = persist_directory or "./chroma_data"
            self.client = chromadb.PersistentClient(
                path=persist_dir,
                settings=Settings(
                    anonymized_telemetry=False
                )
            )
            logger.info(f"Using persistent ChromaDB at {persist_dir}")

        # Initialize embedding function
        self.embedding_generator = get_embedding_generator()

    def _get_embedding_function(self):
        """Get custom embedding function for ChromaDB"""
        # Create a wrapper for our embedding generator
        class CustomEmbeddingFunction:
            def __init__(self, generator):
                self.generator = generator

            def __call__(self, input: List[str]) -> List[List[float]]:
                embeddings = self.generator.generate_embeddings(input)
                return embeddings.tolist()

        return CustomEmbeddingFunction(self.embedding_generator)

    def create_collection(
        self,
        name: str,
        metadata: Dict[str, Any] = None,
        get_or_create: bool = True
    ) -> chromadb.Collection:
        """
        Create a new collection

        Args:
            name: Collection name
            metadata: Collection metadata
            get_or_create: Get existing collection if it exists

        Returns:
            ChromaDB collection
        """
        try:
            if get_or_create:
                collection = self.client.get_or_create_collection(
                    name=name,
                    metadata=metadata or {},
                    embedding_function=self._get_embedding_function()
                )
                logger.info(f"Got or created collection: {name}")
            else:
                collection = self.client.create_collection(
                    name=name,
                    metadata=metadata or {},
                    embedding_function=self._get_embedding_function()
                )
                logger.info(f"Created collection: {name}")

            return collection

        except Exception as e:
            logger.error(f"Failed to create collection {name}: {e}")
            raise

    def get_collection(self, name: str) -> Optional[chromadb.Collection]:
        """
        Get existing collection

        Args:
            name: Collection name

        Returns:
            Collection or None if not found
        """
        try:
            collection = self.client.get_collection(
                name=name,
                embedding_function=self._get_embedding_function()
            )
            logger.info(f"Retrieved collection: {name}")
            return collection
        except Exception as e:
            logger.warning(f"Collection {name} not found: {e}")
            return None

    def delete_collection(self, name: str) -> bool:
        """
        Delete a collection

        Args:
            name: Collection name

        Returns:
            True if deleted, False otherwise
        """
        try:
            self.client.delete_collection(name)
            logger.info(f"Deleted collection: {name}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete collection {name}: {e}")
            return False

    def list_collections(self) -> List[str]:
        """
        List all collections

        Returns:
            List of collection names
        """
        try:
            collections = self.client.list_collections()
            collection_names = [c.name for c in collections]
            logger.info(f"Found {len(collection_names)} collections")
            return collection_names
        except Exception as e:
            logger.error(f"Failed to list collections: {e}")
            return []

    def add_documents(
        self,
        collection_name: str,
        documents: List[str],
        metadatas: List[Dict[str, Any]] = None,
        ids: List[str] = None
    ) -> List[str]:
        """
        Add documents to a collection

        Args:
            collection_name: Collection name
            documents: List of document texts
            metadatas: List of metadata dicts (one per document)
            ids: List of document IDs (auto-generated if not provided)

        Returns:
            List of document IDs
        """
        collection = self.get_collection(collection_name)
        if collection is None:
            collection = self.create_collection(collection_name)

        # Generate IDs if not provided
        if ids is None:
            ids = [str(uuid.uuid4()) for _ in documents]

        # Ensure metadatas is proper length
        if metadatas is None:
            metadatas = [{} for _ in documents]

        try:
            collection.add(
                documents=documents,
                metadatas=metadatas,
                ids=ids
            )
            logger.info(f"Added {len(documents)} documents to {collection_name}")
            return ids

        except Exception as e:
            logger.error(f"Failed to add documents: {e}")
            raise

    def query_similar(
        self,
        collection_name: str,
        query_text: str,
        n_results: int = 5,
        where: Dict[str, Any] = None,
        where_document: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Query similar documents

        Args:
            collection_name: Collection name
            query_text: Query text
            n_results: Number of results to return
            where: Metadata filter
            where_document: Document content filter

        Returns:
            Query results with documents, distances, metadatas, and ids
        """
        collection = self.get_collection(collection_name)
        if collection is None:
            logger.warning(f"Collection {collection_name} not found")
            return {
                "documents": [],
                "distances": [],
                "metadatas": [],
                "ids": []
            }

        try:
            results = collection.query(
                query_texts=[query_text],
                n_results=n_results,
                where=where,
                where_document=where_document
            )

            # Flatten results (since we only query with one text)
            flattened = {
                "documents": results["documents"][0] if results["documents"] else [],
                "distances": results["distances"][0] if results["distances"] else [],
                "metadatas": results["metadatas"][0] if results["metadatas"] else [],
                "ids": results["ids"][0] if results["ids"] else []
            }

            logger.info(f"Query returned {len(flattened['documents'])} results")
            return flattened

        except Exception as e:
            logger.error(f"Query failed: {e}")
            raise

    def get_collection_stats(self, collection_name: str) -> Dict[str, Any]:
        """
        Get collection statistics

        Args:
            collection_name: Collection name

        Returns:
            Dictionary with collection stats
        """
        collection = self.get_collection(collection_name)
        if collection is None:
            return {
                "exists": False,
                "count": 0
            }

        try:
            count = collection.count()
            metadata = collection.metadata

            return {
                "exists": True,
                "name": collection_name,
                "count": count,
                "metadata": metadata
            }

        except Exception as e:
            logger.error(f"Failed to get collection stats: {e}")
            return {
                "exists": True,
                "count": 0,
                "error": str(e)
            }

    def update_document(
        self,
        collection_name: str,
        document_id: str,
        document: str = None,
        metadata: Dict[str, Any] = None
    ) -> bool:
        """
        Update a document

        Args:
            collection_name: Collection name
            document_id: Document ID
            document: New document text (optional)
            metadata: New metadata (optional)

        Returns:
            True if successful
        """
        collection = self.get_collection(collection_name)
        if collection is None:
            logger.error(f"Collection {collection_name} not found")
            return False

        try:
            update_params = {"ids": [document_id]}

            if document:
                update_params["documents"] = [document]
            if metadata:
                update_params["metadatas"] = [metadata]

            collection.update(**update_params)
            logger.info(f"Updated document {document_id} in {collection_name}")
            return True

        except Exception as e:
            logger.error(f"Failed to update document: {e}")
            return False

    def delete_documents(
        self,
        collection_name: str,
        ids: List[str]
    ) -> bool:
        """
        Delete documents from collection

        Args:
            collection_name: Collection name
            ids: List of document IDs to delete

        Returns:
            True if successful
        """
        collection = self.get_collection(collection_name)
        if collection is None:
            logger.error(f"Collection {collection_name} not found")
            return False

        try:
            collection.delete(ids=ids)
            logger.info(f"Deleted {len(ids)} documents from {collection_name}")
            return True

        except Exception as e:
            logger.error(f"Failed to delete documents: {e}")
            return False

    def check_health(self) -> bool:
        """
        Check if ChromaDB is healthy

        Returns:
            True if healthy
        """
        try:
            self.client.heartbeat()
            return True
        except Exception as e:
            logger.error(f"ChromaDB health check failed: {e}")
            return False


# Global instance
_chromadb_client = None


def get_chromadb_client() -> ChromaDBClient:
    """
    Get or create global ChromaDBClient instance

    Returns:
        ChromaDBClient instance
    """
    global _chromadb_client
    if _chromadb_client is None:
        _chromadb_client = ChromaDBClient()
    return _chromadb_client
