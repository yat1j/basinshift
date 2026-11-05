"""
BASINSHIFT FastAPI Dependencies
Author: Lead ML Engineer
Authoritative Plan: BASINSHIFT_Final_Master_Plan_Rubric_Aligned.html (Version 2.0)
"""

from fastapi import Request, HTTPException, status
from src.basinshift.inference import InferencePipeline


def get_pipeline(request: Request) -> InferencePipeline:
    """
    Dependency that provides the singleton InferencePipeline instance from app state.
    Raises HTTP 503 if the pipeline failed to initialize or is not available.
    """
    pipeline = getattr(request.app.state, "pipeline", None)
    if pipeline is None:
        init_err = getattr(request.app.state, "init_error", "Unknown initialization failure")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "error_code": "PIPELINE_NOT_INITIALIZED",
                "message": f"Inference pipeline is not ready: {init_err}",
                "field": None
            }
        )
    return pipeline

