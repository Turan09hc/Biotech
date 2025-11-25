from fastapi import APIRouter, File, UploadFile, Query, HTTPException
from fastapi.responses import JSONResponse
from typing import Optional
from datetime import datetime
from io import BytesIO

from app.services.dsf_service import DSFService
from app.models.dsf_models import (    # FIXED
    UploadResponse,
    ResultsFilterParams,
)

router = APIRouter(prefix="/api/v1", tags=["analysis"])

# Initialize service
dsf_service = DSFService()



@router.post("/upload", response_model=UploadResponse)
async def upload_dsf_data(file: UploadFile = File(...)) -> UploadResponse:
    """
    Upload and analyze nanoDSF data file.

    Accepts CSV or XLSX files with columns: temperature, F330, F350

    Args:
        file: CSV or XLSX file containing nanoDSF data

    Returns:
        UploadResponse with analysis results and plot data
    """
    try:
        # Validate file extension
        filename = file.filename.lower()
        if not (filename.endswith(".csv") or filename.endswith(".xlsx") or filename.endswith(".xls")):
            raise HTTPException(
                status_code=400,
                detail="File must be CSV or XLSX format"
            )

        # Read file content
        file_bytes = BytesIO(await file.read())
        file_bytes.seek(0)

        # Perform analysis
        result, explanation, plot_data = dsf_service.analyze_file(
            file_bytes, file.filename
        )

        # Save result
        analysis_id = dsf_service.save_result(result)

        # Build response
        response = UploadResponse(
            success=True,
            message=f"Successfully analyzed {result.sample_name}",
            analysis_id=analysis_id,
            sample_name=result.sample_name,
            metrics={
                "tm": result.metrics.tm,
                "tm_confidence": result.metrics.tm_confidence,
                "onset_temperature": result.metrics.onset_temperature,
                "offset_temperature": result.metrics.offset_temperature,
                "max_slope": result.metrics.max_slope,
                "baseline_start": result.metrics.baseline_start,
                "baseline_end": result.metrics.baseline_end,
                "transition_type": result.metrics.transition_type.value,
                "num_transitions": result.metrics.num_transitions,
            },
            quality={
                "quality": result.quality.quality.value,
                "score": result.quality.score,
                "issues": result.quality.issues,
                "snr_estimate": result.quality.snr_estimate,
                "baseline_noise": result.quality.baseline_noise,
            },
            explanation={
                "summary": explanation.summary,
                "detailed_explanation": explanation.detailed_explanation,
                "key_findings": explanation.key_findings,
                "recommendations": explanation.recommendations,
                "quality_concerns": explanation.quality_concerns,
            },
            plot_data=plot_data,
        )

        return response

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Data parsing error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.get("/results")
async def get_results(
    sample_name: Optional[str] = Query(None, description="Filter by sample name (partial match)"),
    date_from: Optional[str] = Query(None, description="Filter from date (ISO format)"),
    date_to: Optional[str] = Query(None, description="Filter to date (ISO format)"),
    min_quality_score: Optional[float] = Query(
        None, ge=0, le=100, description="Minimum quality score"
    ),
    limit: int = Query(50, ge=1, le=500, description="Maximum number of results"),
) -> JSONResponse:
    """
    Retrieve stored analysis results with optional filtering.

    Query Parameters:
        - sample_name: Filter results by sample name (case-insensitive partial match)
        - date_from: Filter results from this date (ISO 8601 format)
        - date_to: Filter results until this date (ISO 8601 format)
        - min_quality_score: Filter results with minimum quality score (0-100)
        - limit: Maximum number of results to return (default 50)

    Returns:
        List of analysis results matching filters
    """
    try:
        # Parse filter parameters
        filter_params = ResultsFilterParams(
            sample_name_contains=sample_name,
            date_from=datetime.fromisoformat(date_from) if date_from else None,
            date_to=datetime.fromisoformat(date_to) if date_to else None,
            min_quality_score=min_quality_score,
            limit=limit,
        )

        # Get filtered results
        results = dsf_service.get_results_list(filter_params)

        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "count": len(results),
                "results": results,
            },
        )

    except ValueError as e:
        raise HTTPException(
            status_code=400, detail=f"Invalid filter parameters: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve results: {str(e)}")


@router.get("/results/{analysis_id}")
async def get_result_by_id(analysis_id: str) -> JSONResponse:
    """
    Retrieve a specific analysis result by ID.

    Args:
        analysis_id: UUID of the analysis

    Returns:
        Detailed analysis result
    """
    try:
        result = dsf_service.get_result(analysis_id)

        if not result:
            raise HTTPException(
                status_code=404,
                detail=f"Analysis with ID {analysis_id} not found"
            )

        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "result": result,
            },
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve result: {str(e)}")


@router.get("/health")
async def health_check() -> JSONResponse:
    """Health check endpoint"""
    return JSONResponse(
        status_code=200,
        content={
            "status": "healthy",
            "service": "nanoDSF Analysis API",
            "version": "1.0.0",
        },
    )