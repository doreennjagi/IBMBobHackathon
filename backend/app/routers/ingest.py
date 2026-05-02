import io
import asyncio
import pandas as pd
from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel
from app.services.pattern_detector import SubscriptionPatternDetector

router = APIRouter()
detector = SubscriptionPatternDetector()

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_ROWS = 50000

COLUMN_ALIASES = {
    "description": "merchant_name", "narration": "merchant_name",
    "payee": "merchant_name", "details": "merchant_name",
    "debit": "amount", "transaction_date": "date",
    "value_date": "date", "trans_date": "date",
}

class IngestionResponse(BaseModel):
    status: str
    total_transactions: int
    subscriptions_found: int
    critical_alerts: int
    monthly_spend_detected: float
    annual_spend_projected: float
    subscriptions: list[dict]

def sanitize_csv_value(value):
    """Prevent CSV injection by escaping formula characters."""
    if isinstance(value, str) and value and value[0] in ('=', '+', '-', '@', '\t', '\r'):
        return "'" + value
    return value

@router.post("/subscriptions/ingest", response_model=IngestionResponse)
async def ingest_csv(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files accepted.")
    content = b""
    chunk_size = 1024 * 1024
    try:
        async with asyncio.timeout(30):
            while chunk := await file.read(chunk_size):
                content += chunk
                if len(content) > MAX_FILE_SIZE:
                    raise HTTPException(status_code=413, detail="File too large. Max 10MB.")
    except asyncio.TimeoutError:
        raise HTTPException(status_code=408, detail="Upload timeout.")
    try:
        df = pd.read_csv(io.StringIO(content.decode("utf-8", errors="replace")))
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not parse CSV: {str(e)[:100]}")
    if len(df) > MAX_ROWS:
        raise HTTPException(status_code=413, detail=f"Too many rows. Max: {MAX_ROWS}")
    df.columns = [c.lower().strip().replace(" ", "_") for c in df.columns]
    for alias, standard in COLUMN_ALIASES.items():
        if alias in df.columns and standard not in df.columns:
            df = df.rename(columns={alias: standard})
    missing = {"date", "merchant_name", "amount"} - set(df.columns)
    if missing:
        raise HTTPException(status_code=422, detail=f"Missing columns: {missing}")
    for col in df.select_dtypes(include=["object"]).columns:
        df[col] = df[col].apply(sanitize_csv_value)
    subscriptions = detector.detect(df)
    multipliers = {"weekly": 4.3, "bi-weekly": 2.15, "monthly": 1, "quarterly": 0.33, "annual": 0.083}
    monthly_spend = sum(s.latest_amount * multipliers.get(s.frequency.value, 1) for s in subscriptions)
    return IngestionResponse(
        status="success",
        total_transactions=len(df),
        subscriptions_found=len(subscriptions),
        critical_alerts=sum(1 for s in subscriptions if s.price_alert and s.price_alert.alert_level == "HIGH"),
        monthly_spend_detected=round(monthly_spend, 2),
        annual_spend_projected=round(monthly_spend * 12, 2),
        subscriptions=[{
            "merchant_canonical": s.merchant_canonical,
            "category": s.category,
            "frequency": s.frequency.value,
            "average_amount": s.average_amount,
            "latest_amount": s.latest_amount,
            "status": s.status.value,
            "confidence_score": s.confidence_score,
            "first_seen": s.first_seen,
            "last_seen": s.last_seen,
            "price_alert": {"original_price": s.price_alert.original_price,
                "current_price": s.price_alert.current_price,
                "percentage_change": s.price_alert.percentage_change,
                "alert_level": s.price_alert.alert_level,
                "total_overcharge": s.price_alert.total_overcharge,
            } if s.price_alert else None,
        } for s in subscriptions],
    )
