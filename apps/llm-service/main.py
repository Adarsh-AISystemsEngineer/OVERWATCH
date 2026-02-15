from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
import time
from datetime import datetime
from typing import List

from schemas import (
    ExtractionRequest,
    ExtractionResponse,
    MissingPersonExtractionSchema,
    HealthResponse,
)
from extractor import QwenExtractor, ExtractionError, ExtractionWithRetry

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global state
extractor: QwenExtractor = None
extractor_with_retry: ExtractionWithRetry = None
start_time: float = time.time()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize and cleanup resources"""
    global extractor, extractor_with_retry
    
    logger.info("Starting LLM service...")
    try:
        extractor = QwenExtractor(model_name="Qwen2.5-7B-Instruct")
        extractor_with_retry = ExtractionWithRetry(extractor)
        logger.info("✓ LLM service initialized")
    except Exception as e:
        logger.error(f"✗ Failed to initialize LLM: {e}")
        raise
    
    yield
    
    logger.info("Shutting down LLM service...")


# Create FastAPI app
app = FastAPI(
    title="Overwatch LLM Service",
    description="Structured data extraction from missing persons HTML content",
    version="1.0.0",
    lifespan=lifespan,
)


@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    import torch
    
    return HealthResponse(
        status="healthy",
        model_loaded=extractor is not None,
        gpu_available=torch.cuda.is_available(),
        uptime_seconds=time.time() - start_time,
        timestamp=datetime.now(),
    )


@app.post("/api/extract", response_model=ExtractionResponse)
async def extract_missing_persons(request: ExtractionRequest) -> ExtractionResponse:
    """
    Extract missing person data from HTML
    
    Args:
        request: HTML content and metadata
        
    Returns:
        Extracted records with confidence scores
    """
    if extractor is None:
        raise HTTPException(status_code=503, detail="LLM service not initialized")
    
    try:
        start_time_ms = time.time() * 1000
        
        # Extract with retry
        result = await extractor_with_retry.extract_with_retry(
            html_content=request.html_content,
            source_state=request.source_state,
        )
        
        processing_time_ms = time.time() * 1000 - start_time_ms
        
        # Convert to response schema
        extracted_records: List[MissingPersonExtractionSchema] = []
        for record in result["records"]:
            try:
                extracted_records.append(
                    MissingPersonExtractionSchema(**record)
                )
            except Exception as e:
                logger.warning(f"Failed to validate record: {e}")
                continue
        
        return ExtractionResponse(
            success=True,
            extracted_records=extracted_records,
            extraction_confidence=result["confidence_scores"][:len(extracted_records)],
            processing_time_ms=processing_time_ms,
            model_used="Qwen2.5-7B-Instruct",
            message=f"Successfully extracted {len(extracted_records)} records",
        )
        
    except ExtractionError as e:
        logger.error(f"Extraction error: {e}")
        return ExtractionResponse(
            success=False,
            processing_time_ms=(time.time() * 1000 - start_time_ms),
            message=f"Extraction failed: {str(e)}",
        )
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@app.get("/api/stats")
async def get_stats():
    """Get service statistics"""
    return {
        "uptime_seconds": time.time() - start_time,
        "model": "Qwen2.5-7B-Instruct",
        "status": "running",
        "timestamp": datetime.now(),
    }


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info",
    )
