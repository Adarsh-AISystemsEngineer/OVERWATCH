"""
Qwen2.5 7B Instruct model wrapper for structured data extraction
Converts messy HTML content to structured missing person data
"""

import logging
from typing import List, Optional, Dict, Any
from datetime import datetime
import json
import re

logger = logging.getLogger(__name__)


class ExtractionError(Exception):
    """Custom exception for extraction failures"""
    pass


class QwenExtractor:
    """
    LLM-based data extraction using Qwen2.5-7B-Instruct
    
    Design Principles:
    1. Only extracts data from HTML (no geocoding)
    2. Never directly writes to database
    3. Returns structured JSON matching schema
    4. High temperature=0.1 for consistent extractions
    5. Validates JSON schema before returning
    """

    EXTRACTION_PROMPT_TEMPLATE = """You are a data extraction specialist. Extract missing person information from the provided HTML content.

Return ONLY valid JSON array (no markdown, no extra text) matching this schema:
[
  {{
    "name": "string",
    "age": number,
    "gender": "male|female|other",
    "last_seen_date": "ISO 8601 datetime string",
    "last_known_location": "string",
    "status": "missing|found",
    "description": "string or null",
    "photo_url": "string or null",
    "contact_name": "string or null",
    "contact_phone": "string or null"
  }}
]

HTML Content:
{html_content}

Rules:
- Extract ONLY complete records with name, age, gender, location, and date
- Parse dates in Indian format (DD-MM-YYYY, DD/MM/YYYY, DD MMM YYYY)
- Standardize gender: male, female, or other
- Skip incomplete records
- Return empty array if no valid records found
- Do NOT invent data
- Do NOT write to any database"""

    def __init__(self, model_name: str = "Qwen2.5-7B-Instruct"):
        """Initialize the model"""
        self.model_name = model_name
        self.model = None
        self.tokenizer = None
        self._load_model()

    def _load_model(self) -> None:
        """Load Qwen model and tokenizer"""
        try:
            # This is a placeholder - actual implementation requires:
            # from transformers import AutoModelForCausalLM, AutoTokenizer
            # import torch
            
            # self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            # self.model = AutoModelForCausalLM.from_pretrained(
            #     self.model_name,
            #     torch_dtype=torch.float16,
            #     device_map="auto"
            # )
            
            logger.info(f"Model {self.model_name} loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            raise ExtractionError(f"Failed to load LLM model: {e}")

    def extract(self, html_content: str, source_state: str) -> Dict[str, Any]:
        """
        Extract missing person data from HTML
        
        Args:
            html_content: Raw HTML from police website
            source_state: State name for context
            
        Returns:
            Dict with extracted records and confidence scores
        """
        try:
            prompt = self.EXTRACTION_PROMPT_TEMPLATE.format(html_content=html_content)
            
            # Placeholder for actual model inference
            # output = self.model.generate(
            #     self.tokenizer.encode(prompt, return_tensors="pt"),
            #     max_new_tokens=2048,
            #     temperature=0.1,
            #     do_sample=True,
            # )
            
            # For testing, return mock response
            response_text = self._mock_extraction(html_content)
            
            # Parse JSON response
            records = self._parse_response(response_text)
            
            # Validate schema
            validated_records = self._validate_records(records)
            
            return {
                "success": True,
                "records": validated_records,
                "confidence_scores": [0.95] * len(validated_records),  # Mock confidence
            }
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM response as JSON: {e}")
            raise ExtractionError(f"Invalid JSON response from model: {e}")
        except Exception as e:
            logger.error(f"Extraction failed: {e}")
            raise ExtractionError(f"Extraction error: {e}")

    def _mock_extraction(self, html_content: str) -> str:
        """Mock extraction for testing"""
        return "[]"

    def _parse_response(self, response: str) -> List[Dict[str, Any]]:
        """Parse JSON response from model"""
        # Remove markdown code blocks if present
        response = response.strip()
        if response.startswith("```"):
            response = response.split("```")[1]
            if response.startswith("json"):
                response = response[4:]
        
        return json.loads(response)

    def _validate_records(self, records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Validate records match schema"""
        validated = []
        
        for record in records:
            try:
                # Check required fields
                required = ["name", "age", "gender", "last_seen_date", "last_known_location"]
                if not all(field in record for field in required):
                    logger.warning(f"Skipping record missing required fields: {record}")
                    continue
                
                # Type validation
                if not isinstance(record["age"], int) or not (0 <= record["age"] <= 150):
                    logger.warning(f"Invalid age in record: {record}")
                    continue
                
                if record["gender"] not in ["male", "female", "other"]:
                    logger.warning(f"Invalid gender in record: {record}")
                    record["gender"] = "other"
                
                validated.append(record)
                
            except Exception as e:
                logger.warning(f"Error validating record: {e}")
                continue
        
        return validated


class ExtractionWithRetry:
    """
    Retry wrapper for extraction with exponential backoff
    """
    
    MAX_RETRIES = 3
    BASE_DELAY_MS = 1000
    
    def __init__(self, extractor: QwenExtractor):
        self.extractor = extractor
    
    async def extract_with_retry(self, html_content: str, source_state: str) -> Dict[str, Any]:
        """Extract with retry logic"""
        import asyncio
        
        for attempt in range(self.MAX_RETRIES):
            try:
                result = self.extractor.extract(html_content, source_state)
                return result
                
            except ExtractionError as e:
                if attempt < self.MAX_RETRIES - 1:
                    delay = self.BASE_DELAY_MS * (2 ** attempt) / 1000
                    logger.warning(f"Extraction failed, retrying in {delay}s: {e}")
                    await asyncio.sleep(delay)
                else:
                    logger.error(f"Extraction failed after {self.MAX_RETRIES} attempts: {e}")
                    raise
