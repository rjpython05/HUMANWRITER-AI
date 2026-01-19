"""
Plagiarism report generation with comprehensive analysis
Color-coded risk levels and detailed breakdowns
"""
from typing import Dict, Any, List
from datetime import datetime
from enum import Enum
from loguru import logger
import json

from .similarity_checker import SimilarityChecker
from .source_finder import SourceFinder


class RiskLevel(str, Enum):
    """Risk level classification"""
    SAFE = "SAFE"           # < 15%
    MODERATE = "MODERATE"   # 15-30%
    HIGH = "HIGH"           # > 30%


class ReportGenerator:
    """
    Generates comprehensive plagiarism reports
    """

    def __init__(self):
        """Initialize report generator"""
        self.similarity_checker = SimilarityChecker()
        self.source_finder = SourceFinder()
        logger.info("ReportGenerator initialized")

    def generate_full_report(
        self,
        text: str,
        report_id: str = None,
        top_sources: int = 5,
        include_passages: bool = True
    ) -> Dict[str, Any]:
        """
        Generate comprehensive plagiarism report

        Args:
            text: Text to check
            report_id: Optional report ID
            top_sources: Number of top sources to include
            include_passages: Whether to include highlighted passages

        Returns:
            Complete plagiarism report
        """
        logger.info(f"Generating plagiarism report for text of {len(text)} characters")

        start_time = datetime.now()

        # Run similarity check
        similarity_results = self.similarity_checker.check_similarity(
            text=text,
            top_k=10,
            similarity_threshold=0.25
        )

        # Find top sources
        top_source_list = self.source_finder.find_top_sources(
            matches=similarity_results["matches"],
            top_k=top_sources
        )

        # Find exact matches
        exact_matches = self.similarity_checker.find_exact_matches(
            text=text,
            min_words=5
        )

        # Highlight passages if requested
        highlighted_passages = []
        if include_passages:
            highlighted_passages = self.similarity_checker.highlight_similar_passages(
                text=text,
                matches=similarity_results["matches"]
            )

        # Calculate overall similarity
        overall_similarity = similarity_results["overall_similarity"]

        # Determine risk level
        risk_level = self._determine_risk_level(overall_similarity)

        # Calculate statistics
        stats = self._calculate_statistics(
            similarity_results,
            top_source_list,
            exact_matches
        )

        # Generate summary
        summary = self._generate_summary(
            overall_similarity,
            risk_level,
            stats,
            top_source_list
        )

        # Calculate processing time
        processing_time = (datetime.now() - start_time).total_seconds() * 1000

        # Build report
        report = {
            "report_id": report_id or f"report_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "timestamp": datetime.now().isoformat(),
            "text_length": len(text),
            "word_count": len(text.split()),
            "overall_similarity": overall_similarity,
            "similarity_percentage": overall_similarity * 100,
            "risk_level": risk_level.value,
            "summary": summary,
            "statistics": stats,
            "top_sources": top_source_list,
            "exact_matches": exact_matches,
            "highlighted_passages": highlighted_passages,
            "all_matches_count": len(similarity_results["matches"]),
            "processing_time_ms": int(processing_time)
        }

        logger.info(
            f"Report generated: {risk_level.value} risk, "
            f"{overall_similarity * 100:.1f}% similarity, "
            f"{len(top_source_list)} sources found"
        )

        return report

    def _determine_risk_level(self, similarity: float) -> RiskLevel:
        """
        Determine risk level based on similarity percentage

        Args:
            similarity: Overall similarity score (0-1)

        Returns:
            Risk level enum
        """
        percentage = similarity * 100

        if percentage < 15:
            return RiskLevel.SAFE
        elif percentage < 30:
            return RiskLevel.MODERATE
        else:
            return RiskLevel.HIGH

    def _calculate_statistics(
        self,
        similarity_results: Dict[str, Any],
        top_sources: List[Dict[str, Any]],
        exact_matches: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Calculate detailed statistics

        Args:
            similarity_results: Similarity check results
            top_sources: Top source documents
            exact_matches: Exact phrase matches

        Returns:
            Statistics dictionary
        """
        total_chunks = similarity_results["total_chunks"]
        matched_chunks = similarity_results["matched_chunks"]

        # Calculate coverage
        coverage_percentage = (matched_chunks / total_chunks * 100) if total_chunks > 0 else 0

        # Group matches by similarity range
        matches = similarity_results["matches"]

        high_similarity_matches = [m for m in matches if m["similarity"] >= 0.7]
        medium_similarity_matches = [m for m in matches if 0.4 <= m["similarity"] < 0.7]
        low_similarity_matches = [m for m in matches if m["similarity"] < 0.4]

        # Calculate average similarities
        if matches:
            avg_similarity = sum(m["similarity"] for m in matches) / len(matches)
            max_similarity = max(m["similarity"] for m in matches)
        else:
            avg_similarity = 0.0
            max_similarity = 0.0

        # Count unique sources
        unique_sources = len(set(m["source_id"] for m in matches))

        # Calculate exact match statistics
        exact_match_words = sum(m["length"] for m in exact_matches)
        total_words = len(similarity_results.get("text_length", 0))

        return {
            "total_chunks_analyzed": total_chunks,
            "matched_chunks": matched_chunks,
            "coverage_percentage": coverage_percentage,
            "unique_sources_found": unique_sources,
            "high_similarity_matches": len(high_similarity_matches),
            "medium_similarity_matches": len(medium_similarity_matches),
            "low_similarity_matches": len(low_similarity_matches),
            "average_match_similarity": avg_similarity,
            "maximum_match_similarity": max_similarity,
            "exact_matches_found": len(exact_matches),
            "exact_match_total_words": exact_match_words
        }

    def _generate_summary(
        self,
        overall_similarity: float,
        risk_level: RiskLevel,
        stats: Dict[str, Any],
        top_sources: List[Dict[str, Any]]
    ) -> str:
        """
        Generate human-readable summary

        Args:
            overall_similarity: Overall similarity score
            risk_level: Risk level
            stats: Statistics
            top_sources: Top source documents

        Returns:
            Summary text
        """
        similarity_pct = overall_similarity * 100

        # Risk level description
        if risk_level == RiskLevel.SAFE:
            risk_desc = "The text shows minimal similarity to corpus documents and appears to be mostly original."
        elif risk_level == RiskLevel.MODERATE:
            risk_desc = "The text shows moderate similarity to corpus documents. Review recommended."
        else:
            risk_desc = "The text shows high similarity to corpus documents. Significant overlap detected."

        # Source summary
        if top_sources:
            top_source = top_sources[0]
            source_title = top_source["metadata"].get("title", "Unknown")
            source_similarity = top_source["percentage"]

            source_desc = f"The most similar source is '{source_title}' with {source_similarity:.1f}% similarity."
        else:
            source_desc = "No significant source matches found."

        # Statistics summary
        matched_chunks = stats["matched_chunks"]
        total_chunks = stats["total_chunks_analyzed"]
        coverage = stats["coverage_percentage"]

        stats_desc = f"Analysis: {matched_chunks} of {total_chunks} text segments matched ({coverage:.1f}% coverage)."

        # Exact matches
        exact_matches = stats["exact_matches_found"]
        if exact_matches > 0:
            exact_desc = f" {exact_matches} exact phrase matches detected."
        else:
            exact_desc = " No exact phrase matches found."

        # Combine summary
        summary = f"{risk_desc} Overall similarity: {similarity_pct:.1f}%. {stats_desc}{exact_desc} {source_desc}"

        return summary

    def generate_json_report(
        self,
        text: str,
        **kwargs
    ) -> str:
        """
        Generate report as JSON string

        Args:
            text: Text to check
            **kwargs: Additional arguments for generate_full_report

        Returns:
            JSON string
        """
        report = self.generate_full_report(text, **kwargs)
        return json.dumps(report, indent=2, ensure_ascii=False)

    def generate_detailed_breakdown(
        self,
        report: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate detailed breakdown by source

        Args:
            report: Generated report

        Returns:
            Detailed breakdown
        """
        breakdown = {
            "by_source": [],
            "by_risk_level": {
                "high": [],
                "medium": [],
                "low": []
            },
            "timeline": []
        }

        # Break down by source
        for source in report.get("top_sources", []):
            source_breakdown = {
                "source_id": source["source_id"],
                "title": source["metadata"].get("title", "Unknown"),
                "authors": source["metadata"].get("authors", []),
                "year": source["metadata"].get("year"),
                "similarity_percentage": source["percentage"],
                "match_count": source["match_count"],
                "passages": source.get("matched_passages", [])
            }

            breakdown["by_source"].append(source_breakdown)

            # Categorize by risk level
            if source["percentage"] >= 30:
                breakdown["by_risk_level"]["high"].append(source_breakdown)
            elif source["percentage"] >= 15:
                breakdown["by_risk_level"]["medium"].append(source_breakdown)
            else:
                breakdown["by_risk_level"]["low"].append(source_breakdown)

        return breakdown

    def get_risk_color(self, risk_level: str) -> str:
        """
        Get color code for risk level

        Args:
            risk_level: Risk level string

        Returns:
            Hex color code
        """
        colors = {
            "SAFE": "#10b981",      # Green
            "MODERATE": "#f59e0b",  # Yellow/Orange
            "HIGH": "#ef4444"       # Red
        }

        return colors.get(risk_level, "#6b7280")  # Default gray

    def export_report(
        self,
        report: Dict[str, Any],
        format: str = "json"
    ) -> str:
        """
        Export report in various formats

        Args:
            report: Report dictionary
            format: Export format ('json', 'text', 'html')

        Returns:
            Formatted report string
        """
        if format == "json":
            return json.dumps(report, indent=2, ensure_ascii=False)

        elif format == "text":
            return self._export_text(report)

        elif format == "html":
            return self._export_html(report)

        else:
            raise ValueError(f"Unsupported export format: {format}")

    def _export_text(self, report: Dict[str, Any]) -> str:
        """Export as plain text"""
        lines = [
            "=" * 60,
            "PLAGIARISM DETECTION REPORT",
            "=" * 60,
            f"Report ID: {report['report_id']}",
            f"Date: {report['timestamp']}",
            f"Text Length: {report['word_count']} words",
            "",
            "OVERALL RESULTS",
            "-" * 60,
            f"Similarity: {report['similarity_percentage']:.1f}%",
            f"Risk Level: {report['risk_level']}",
            "",
            "SUMMARY",
            "-" * 60,
            report['summary'],
            "",
            "TOP SOURCES",
            "-" * 60
        ]

        for i, source in enumerate(report.get("top_sources", []), 1):
            lines.append(f"\n{i}. {source['metadata'].get('title', 'Unknown')}")
            lines.append(f"   Similarity: {source['percentage']:.1f}%")
            lines.append(f"   Matches: {source['match_count']}")

            authors = source['metadata'].get('authors', [])
            if authors:
                lines.append(f"   Authors: {', '.join(authors)}")

        lines.append("\n" + "=" * 60)

        return "\n".join(lines)

    def _export_html(self, report: Dict[str, Any]) -> str:
        """Export as HTML"""
        risk_color = self.get_risk_color(report['risk_level'])

        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Plagiarism Report - {report['report_id']}</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 40px; }}
                .header {{ background: #f3f4f6; padding: 20px; border-radius: 8px; }}
                .risk-badge {{
                    background: {risk_color};
                    color: white;
                    padding: 8px 16px;
                    border-radius: 4px;
                    display: inline-block;
                    font-weight: bold;
                }}
                .section {{ margin: 30px 0; }}
                .source {{
                    border: 1px solid #e5e7eb;
                    padding: 15px;
                    margin: 10px 0;
                    border-radius: 6px;
                }}
                .similarity {{ font-weight: bold; color: {risk_color}; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Plagiarism Detection Report</h1>
                <p><strong>Report ID:</strong> {report['report_id']}</p>
                <p><strong>Date:</strong> {report['timestamp']}</p>
                <p><strong>Text Length:</strong> {report['word_count']} words</p>
            </div>

            <div class="section">
                <h2>Overall Results</h2>
                <p><span class="risk-badge">{report['risk_level']}</span></p>
                <p class="similarity">Similarity: {report['similarity_percentage']:.1f}%</p>
            </div>

            <div class="section">
                <h2>Summary</h2>
                <p>{report['summary']}</p>
            </div>

            <div class="section">
                <h2>Top Sources</h2>
        """

        for i, source in enumerate(report.get("top_sources", []), 1):
            title = source['metadata'].get('title', 'Unknown')
            similarity = source['percentage']
            matches = source['match_count']

            html += f"""
                <div class="source">
                    <h3>{i}. {title}</h3>
                    <p><strong>Similarity:</strong> {similarity:.1f}%</p>
                    <p><strong>Matches:</strong> {matches}</p>
                </div>
            """

        html += """
            </div>
        </body>
        </html>
        """

        return html
