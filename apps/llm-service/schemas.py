from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum


class GenderEnum(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"


class StatusEnum(str, Enum):
    MISSING = "missing"
    FOUND = "found"


class CoordinatesSchema(BaseModel):
    """GeoJSON Point coordinates"""
    type: str = Field("Point", const=True)
    coordinates: tuple[float, float] = Field(
        ..., description="[longitude, latitude]"
    )

    @field_validator("coordinates")
    @classmethod
    def validate_coordinates(cls, v):
        lon, lat = v
        if not (-180 <= lon <= 180):
            raise ValueError("Longitude must be between -180 and 180")
        if not (-90 <= lat <= 90):
            raise ValueError("Latitude must be between -90 and 90")
        return v


class ExtractionRequest(BaseModel):
    """Request to extract missing person data from HTML"""
    html_content: str = Field(..., description="Raw HTML content from police website")
    source_state: str = Field(..., description="State name (e.g., Maharashtra)")
    source_url: str = Field(..., description="URL where data was scraped from")

    class Config:
        json_schema_extra = {
            "example": {
                "html_content": "<div>Name: John Doe, Age: 25...</div>",
                "source_state": "Maharashtra",
                "source_url": "https://example.com/missing",
            }
        }


class MissingPersonExtractionSchema(BaseModel):
    """Structured extracted missing person data"""
    name: str = Field(..., min_length=1, max_length=255)
    age: int = Field(..., ge=0, le=150)
    gender: GenderEnum
    last_seen_date: datetime
    last_known_location: str = Field(..., min_length=1)
    status: StatusEnum = StatusEnum.MISSING
    description: Optional[str] = Field(None, max_length=1000)
    photo_url: Optional[str] = None
    contact_name: Optional[str] = Field(None, max_length=255)
    contact_phone: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Priya Sharma",
                "age": 28,
                "gender": "female",
                "last_seen_date": "2024-01-15T10:30:00",
                "last_known_location": "Mumbai, Maharashtra",
                "status": "missing",
                "description": "5'4\", wearing blue saree",
                "contact_name": "Raj Sharma",
                "contact_phone": "+91-9876543210",
            }
        }


class ExtractionResponse(BaseModel):
    """Response from extraction service"""
    success: bool
    extracted_records: List[MissingPersonExtractionSchema] = Field(
        default_factory=list
    )
    failed_extractions: List[dict] = Field(default_factory=list)
    extraction_confidence: List[float] = Field(
        default_factory=list, description="Confidence scores for each extraction"
    )
    processing_time_ms: float
    model_used: str = "Qwen2.5-7B-Instruct"
    message: str = ""

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "extracted_records": [
                    {
                        "name": "Priya Sharma",
                        "age": 28,
                        "gender": "female",
                        "last_seen_date": "2024-01-15T10:30:00",
                        "last_known_location": "Mumbai, Maharashtra",
                        "status": "missing",
                    }
                ],
                "extraction_confidence": [0.95],
                "processing_time_ms": 2341,
                "model_used": "Qwen2.5-7B-Instruct",
            }
        }


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    model_loaded: bool
    gpu_available: bool
    uptime_seconds: float
    timestamp: datetime
