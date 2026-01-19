"""
Plagiarism detection API routes
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import Response, JSONResponse
from typing import Dict, Any
from loguru import logger
import uuid

from ..schemas import (
    PlagiarismCheckRequest,
    PlagiarismCheckResponse,
    FindSourcesRequest,
    FindSourcesResponse,
    SourceDetails,
    ReportExportRequest
)
from ...plagiarism import ReportGenerator, SourceFinder


# Create router
router = APIRouter(prefix="/plagiarism", tags=["plagiarism"])

# Initialize services
report_generator = ReportGenerator()
source_finder = SourceFinder()

# In-memory cache for reports (in production, use Redis)
_report_cache: Dict[str, Dict[str, Any]] = {}


@router.post("/check", response_model=PlagiarismCheckResponse)
async def check_plagiarism(
    request: PlagiarismCheckRequest
) -> PlagiarismCheckResponse:
    """
    Check text for plagiarism against corpus

    Args:
        request: Plagiarism check request

    Returns:
        Comprehensive plagiarism report
    """
    logger.info(f"Plagiarism check requested for text of {len(request.text)} characters")

    try:
        # Generate report
        report = report_generator.generate_full_report(
            text=request.text,
            report_id=str(uuid.uuid4()),
            top_sources=request.top_sources,
            include_passages=request.include_passages
        )

        # Cache report
        _report_cache[report["report_id"]] = report

        # Build response
        response = PlagiarismCheckResponse(
            report_id=report["report_id"],
            overall_similarity=report["overall_similarity"],
            similarity_percentage=report["similarity_percentage"],
            risk_level=report["risk_level"],
            summary=report["summary"],
            top_sources=report["top_sources"],
            statistics=report["statistics"],
            exact_matches_count=len(report.get("exact_matches", [])),
            highlighted_passages=report.get("highlighted_passages", []),
            processing_time_ms=report["processing_time_ms"]
        )

        logger.info(
            f"Plagiarism check complete: {response.risk_level} "
            f"({response.similarity_percentage:.1f}% similarity)"
        )

        return response

    except Exception as e:
        logger.error(f"Plagiarism check failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Plagiarism check failed: {str(e)}"
        )


@router.get("/report/{report_id}")
async def get_report(report_id: str) -> JSONResponse:
    """
    Get detailed plagiarism report by ID

    Args:
        report_id: Report ID

    Returns:
        Full report data
    """
    logger.info(f"Fetching report: {report_id}")

    # Check cache
    if report_id not in _report_cache:
        raise HTTPException(
            status_code=404,
            detail=f"Report not found: {report_id}"
        )

    report = _report_cache[report_id]

    return JSONResponse(content=report)


@router.post("/sources", response_model=FindSourcesResponse)
async def find_sources(
    request: FindSourcesRequest
) -> FindSourcesResponse:
    """
    Find similar sources for given text

    Args:
        request: Source finding request

    Returns:
        List of similar sources
    """
    logger.info(f"Finding sources for text query")

    try:
        # Find sources
        sources = source_finder.find_similar_sources(
            text=request.text,
            top_k=request.top_k,
            discipline=request.discipline.value if request.discipline else None
        )

        # Convert to SourceDetails
        source_details = []
        for source in sources:
            metadata = source.get("metadata", {})

            detail = SourceDetails(
                source_id=source["source_id"],
                title=metadata.get("title", "Unknown"),
                authors=metadata.get("authors", []),
                year=metadata.get("year"),
                institution=metadata.get("institution"),
                discipline=metadata.get("discipline"),
                similarity_percentage=source["percentage"],
                citation=source.get("citation", ""),
                matched_text=source.get("matched_text", "")[:200]  # First 200 chars
            )

            source_details.append(detail)

        response = FindSourcesResponse(
            sources=source_details,
            total_found=len(source_details),
            query_text=request.text[:100]  # First 100 chars
        )

        logger.info(f"Found {len(source_details)} sources")

        return response

    except Exception as e:
        logger.error(f"Source finding failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Source finding failed: {str(e)}"
        )


@router.get("/source/{source_id}")
async def get_source_details(source_id: str) -> JSONResponse:
    """
    Get detailed information about a specific source

    Args:
        source_id: Source document ID

    Returns:
        Source details
    """
    logger.info(f"Fetching source details: {source_id}")

    try:
        details = source_finder.get_source_details(source_id)

        if not details:
            raise HTTPException(
                status_code=404,
                detail=f"Source not found: {source_id}"
            )

        # Get citations in multiple formats
        citations = source_finder.get_citation_formats(details["metadata"])
        details["citations"] = citations

        return JSONResponse(content=details)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get source details: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get source details: {str(e)}"
        )


@router.post("/compare/{source_id}")
async def compare_with_source(
    source_id: str,
    text: str
) -> JSONResponse:
    """
    Compare text with a specific source document

    Args:
        source_id: Source document ID
        text: Text to compare

    Returns:
        Comparison results
    """
    logger.info(f"Comparing text with source: {source_id}")

    try:
        results = source_finder.compare_with_specific_source(
            text=text,
            source_id=source_id
        )

        if "error" in results:
            raise HTTPException(
                status_code=404 if "not found" in results["error"].lower() else 500,
                detail=results["error"]
            )

        return JSONResponse(content=results)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Comparison failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Comparison failed: {str(e)}"
        )


@router.post("/export")
async def export_report(
    request: ReportExportRequest
) -> Response:
    """
    Export report in various formats

    Args:
        request: Export request with report data and format

    Returns:
        Exported report
    """
    logger.info(f"Exporting report in {request.format} format")

    try:
        exported = report_generator.export_report(
            report=request.report_data,
            format=request.format
        )

        # Set content type based on format
        content_types = {
            "json": "application/json",
            "text": "text/plain",
            "html": "text/html"
        }

        content_type = content_types.get(request.format, "text/plain")

        return Response(
            content=exported,
            media_type=content_type,
            headers={
                "Content-Disposition": f"attachment; filename=plagiarism_report.{request.format}"
            }
        )

    except Exception as e:
        logger.error(f"Report export failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Report export failed: {str(e)}"
        )


@router.get("/stats")
async def get_plagiarism_stats() -> JSONResponse:
    """
    Get plagiarism detection statistics

    Returns:
        Statistics about plagiarism checks
    """
    logger.info("Fetching plagiarism stats")

    try:
        stats = {
            "total_reports": len(_report_cache),
            "cached_reports": list(_report_cache.keys())[-10:],  # Last 10 reports
            "service_status": "operational"
        }

        return JSONResponse(content=stats)

    except Exception as e:
        logger.error(f"Failed to get stats: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get stats: {str(e)}"
        )


@router.delete("/report/{report_id}")
async def delete_report(report_id: str) -> JSONResponse:
    """
    Delete a cached report

    Args:
        report_id: Report ID to delete

    Returns:
        Deletion confirmation
    """
    logger.info(f"Deleting report: {report_id}")

    if report_id not in _report_cache:
        raise HTTPException(
            status_code=404,
            detail=f"Report not found: {report_id}"
        )

    del _report_cache[report_id]

    return JSONResponse(content={
        "success": True,
        "message": f"Report {report_id} deleted"
    })


# Include router in main app
def get_plagiarism_router() -> APIRouter:
    """Get plagiarism router instance"""
    return router
