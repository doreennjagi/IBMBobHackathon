"""
CSV Ingestion Router

Handles bank statement CSV file uploads and processing.
Accepts CSV files, normalizes transactions, and triggers subscription detection.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse
from typing import List
import pandas as pd
import io
import logging

from app.core.config import settings
from app.services.pattern_detector import SubscriptionPatternDetector
from app.services.merchant_fingerprint import MerchantFingerprintService

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/upload")
async def upload_csv(
    file: UploadFile = File(..., description="Bank statement CSV file")
):
    """
    Upload and process a bank statement CSV file.
    
    This endpoint:
    1. Validates the CSV file format and size
    2. Normalizes transaction data
    3. Detects subscription patterns
    4. Returns structured subscription data
    
    Args:
        file: CSV file upload (max 10MB)
        
    Returns:
        JSON response with detected subscriptions and analysis summary
    """
    
    # Validate file type
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Please upload a CSV file."
        )
    
    # Read file content
    try:
        content = await file.read()
        
        # Check file size
        file_size_mb = len(content) / (1024 * 1024)
        if file_size_mb > settings.MAX_CSV_SIZE_MB:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Maximum size is {settings.MAX_CSV_SIZE_MB}MB"
            )
        
        # Try different encodings
        df = None
        for encoding in settings.ALLOWED_CSV_ENCODINGS:
            try:
                df = pd.read_csv(io.BytesIO(content), encoding=encoding)
                logger.info(f"Successfully parsed CSV with {encoding} encoding")
                break
            except UnicodeDecodeError:
                continue
        
        if df is None:
            raise HTTPException(
                status_code=400,
                detail="Unable to parse CSV file. Please check the file encoding."
            )
        
        # Validate required columns (flexible - will be normalized)
        if df.empty:
            raise HTTPException(
                status_code=400,
                detail="CSV file is empty"
            )
        
        logger.info(f"Processing CSV with {len(df)} transactions")
        
        # Initialize services
        pattern_detector = SubscriptionPatternDetector()
        merchant_service = MerchantFingerprintService()
        
        # Normalize merchant names
        df = merchant_service.normalize_transactions(df)
        
        # Detect subscription patterns
        subscriptions = pattern_detector.detect_subscriptions(df)
        
        # Calculate summary statistics
        summary = {
            "total_transactions": len(df),
            "subscriptions_detected": len(subscriptions),
            "total_monthly_cost": sum(sub.get("monthly_cost", 0) for sub in subscriptions),
            "date_range": {
                "start": df["date"].min().isoformat() if "date" in df.columns else None,
                "end": df["date"].max().isoformat() if "date" in df.columns else None,
            }
        }
        
        return {
            "success": True,
            "summary": summary,
            "subscriptions": subscriptions,
            "message": f"Successfully detected {len(subscriptions)} subscriptions"
        }
        
    except pd.errors.EmptyDataError:
        raise HTTPException(
            status_code=400,
            detail="CSV file is empty or invalid"
        )
    except Exception as e:
        logger.error(f"Error processing CSV: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error processing CSV file: {str(e)}"
        )


@router.get("/supported-banks")
async def get_supported_banks():
    """
    Get list of supported bank CSV formats.
    
    Returns information about which banks' CSV exports are supported
    and any special formatting requirements.
    """
    return {
        "supported_banks": [
            {
                "name": "M-Pesa (Safaricom)",
                "country": "Kenya",
                "format": "Standard M-Pesa statement export",
                "notes": "Export from M-Pesa app or MySafaricom portal"
            },
            {
                "name": "Equity Bank",
                "country": "Kenya",
                "format": "Equitel or Equity Online statement",
                "notes": "Download from online banking portal"
            },
            {
                "name": "KCB Bank",
                "country": "Kenya",
                "format": "KCB Mobile or Internet Banking export",
                "notes": "CSV export from transaction history"
            },
            {
                "name": "Standard Bank",
                "country": "International",
                "format": "Standard CSV export",
                "notes": "Generic format supported"
            }
        ],
        "general_requirements": {
            "max_file_size": f"{settings.MAX_CSV_SIZE_MB}MB",
            "required_columns": ["date", "description/merchant", "amount"],
            "supported_encodings": settings.ALLOWED_CSV_ENCODINGS
        }
    }

# Made with Bob
