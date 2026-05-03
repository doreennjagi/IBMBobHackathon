import asyncio
import logging
from fastapi import APIRouter, File, HTTPException, UploadFile

from app.services.merchant_fingerprint import MerchantFingerprint
from app.services.pattern_detector import SubscriptionPatternDetector

router = APIRouter()
logger = logging.getLogger(__name__)

COLUMN_ALIASES = {
    "date": "date", "transaction_date": "date", "posting_date": "date", "value_date": "date",
    "amount": "amount", "debit": "amount", "credit": "amount", "value": "amount",
    "description": "merchant_name", "narration": "merchant_name",
    "payee": "merchant_name", "details": "merchant_name",
    "merchant": "merchant_name", "merchant_name": "merchant_name",
}

MAX_BYTES = 10 * 1024 * 1024

@router.post("/subscriptions/ingest")
async def ingest_csv(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Invalid file type. Upload a CSV.")
    
    try:
        raw = await asyncio.wait_for(file.read(), timeout=25.0)
    except asyncio.TimeoutError:
        raise HTTPException(status_code=408, detail="Upload timed out.")
    
    if len(raw) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="File too large. Max 10MB.")
    
    import io
    import pandas as pd
    
    try:
        df = pd.read_csv(io.BytesIO(raw))
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Unable to parse CSV: {e}")
    
    # Rename columns
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
    df.rename(columns={k: v for k, v in COLUMN_ALIASES.items() if k in df.columns}, inplace=True)
    
    missing = {"date", "merchant_name", "amount"} - set(df.columns)
    if missing:
        raise HTTPException(status_code=422, detail=f"Missing columns: {missing}")
    
    fingerprint = MerchantFingerprint()
    df["merchant_name"] = df["merchant_name"].apply(fingerprint.normalize)
    
    detector = SubscriptionPatternDetector()
    subscriptions = detector.detect(df)
    
    monthly_spend = sum(
        s.average_amount for s in subscriptions if s.frequency == "monthly"
    )
    
    # Format response to match frontend expectations
    formatted_subs = []
    for s in subscriptions:
        price_changes = []
        if s.price_alert:
            price_changes.append({
                "date": s.last_seen,
                "old_price": s.price_alert.original_price,
                "new_price": s.price_alert.current_price,
                "change_percent": s.price_alert.percentage_change,
                "is_increase": s.price_alert.percentage_change > 0,
            })
        formatted_subs.append({
            "merchant": s.merchant_canonical,
            "billing_cycle": s.frequency,
            "frequency": 1,
            "avg_amount": s.average_amount,
            "monthly_cost": s.average_amount if s.frequency == "monthly" else s.average_amount / 12,
            "first_charge": s.first_seen,
            "last_charge": s.last_seen,
            "price_changes": price_changes,
            "health_status": s.status,
            "confidence_score": s.confidence_score,
        })
    
    return {
        "success": True,
        "message": f"Found {len(subscriptions)} subscriptions",
        "summary": {
            "total_transactions": len(df),
            "subscriptions_detected": len(subscriptions),
            "total_monthly_cost": monthly_spend,
            "date_range": {
                "start": str(df["date"].min()) if len(df) else None,
                "end": str(df["date"].max()) if len(df) else None,
            }
        },
        "subscriptions": formatted_subs,
    }
