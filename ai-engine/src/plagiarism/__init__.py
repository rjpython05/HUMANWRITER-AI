"""
Plagiarism and Similarity Detection Module

Provides comprehensive plagiarism detection including:
- TF-IDF and vector-based similarity detection
- Source identification and ranking
- Comprehensive report generation
- Citation formatting
"""
from .similarity_checker import SimilarityChecker
from .source_finder import SourceFinder
from .report_generator import ReportGenerator, RiskLevel

__all__ = [
    "SimilarityChecker",
    "SourceFinder",
    "ReportGenerator",
    "RiskLevel"
]
