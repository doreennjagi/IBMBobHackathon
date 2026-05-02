from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

MOCK_SUBSCRIPTIONS = [
    {"id": 1, "merchant_canonical": "Netflix", "category": "Streaming", "frequency": "monthly", "average_amount": 1100.0, "latest_amount": 1100.0, "currency": "KES", "status": "Active", "confidence_score": 0.97, "first_seen": "2023-06-15", "last_seen": "2025-04-15", "known_provider": True, "monthly_cost": 1100.0, "price_alert": None},
    {"id": 2, "merchant_canonical": "Spotify", "category": "Music", "frequency": "monthly", "average_amount": 299.0, "latest_amount": 399.0, "currency": "KES", "status": "Critical", "confidence_score": 0.95, "first_seen": "2023-08-01", "last_seen": "2025-04-01", "known_provider": True, "monthly_cost": 399.0, "price_alert": {"original_price": 299.0, "current_price": 399.0, "percentage_change": 33.4, "alert_level": "HIGH", "total_overcharge": 100.0}},
    {"id": 3, "merchant_canonical": "iCloud", "category": "Cloud Storage", "frequency": "annual", "average_amount": 1200.0, "latest_amount": 1200.0, "currency": "KES", "status": "Active", "confidence_score": 0.91, "first_seen": "2022-03-01", "last_seen": "2024-03-01", "known_provider": True, "monthly_cost": 99.6, "price_alert": None},
    {"id": 4, "merchant_canonical": "DStv", "category": "Streaming", "frequency": "monthly", "average_amount": 3500.0, "latest_amount": 3500.0, "currency": "KES", "status": "Zombie", "confidence_score": 0.88, "first_seen": "2023-01-10", "last_seen": "2024-08-10", "known_provider": True, "monthly_cost": 3500.0, "price_alert": None},
    {"id": 5, "merchant_canonical": "Canva", "category": "Design", "frequency": "monthly", "average_amount": 650.0, "latest_amount": 650.0, "currency": "KES", "status": "Active", "confidence_score": 0.82, "first_seen": "2024-01-05", "last_seen": "2025-04-05", "known_provider": True, "monthly_cost": 650.0, "price_alert": None},
]

class DashboardSummary(BaseModel):
    total_subscriptions: int
    active_count: int
    zombie_count: int
    critical_count: int
    escalating_count: int
    total_monthly_spend: float
    total_annual_spend: float
    potential_savings: float
    high_alerts: int
    currency: str

class HealthScore(BaseModel):
    merchant: str
    status: str
    risk_score: int
    monthly_cost: float
    recommendation: str
    alert_level: Optional[str] = None

@router.get("/subscriptions")
def list_subscriptions(status: Optional[str] = None, category: Optional[str] = None):
    subs = MOCK_SUBSCRIPTIONS
    if status:
        subs = [s for s in subs if s["status"].lower() == status.lower()]
    if category:
        subs = [s for s in subs if s["category"].lower() == category.lower()]
    return subs

@router.get("/subscriptions/{subscription_id}")
def get_subscription(subscription_id: int):
    sub = next((s for s in MOCK_SUBSCRIPTIONS if s["id"] == subscription_id), None)
    if not sub:
        raise HTTPException(status_code=404, detail=f"Subscription {subscription_id} not found.")
    return sub

@router.delete("/subscriptions/{subscription_id}")
def cancel_subscription(subscription_id: int):
    sub = next((s for s in MOCK_SUBSCRIPTIONS if s["id"] == subscription_id), None)
    if not sub:
        raise HTTPException(status_code=404, detail=f"Subscription {subscription_id} not found.")
    return {"status": "cancelled", "message": f"{sub['merchant_canonical']} marked for cancellation.", "estimated_monthly_saving": sub["monthly_cost"]}

@router.get("/dashboard/summary", response_model=DashboardSummary)
def get_dashboard_summary():
    subs = MOCK_SUBSCRIPTIONS
    total_monthly = sum(s["monthly_cost"] for s in subs)
    zombie_monthly = sum(s["monthly_cost"] for s in subs if s["status"] == "Zombie")
    return DashboardSummary(
        total_subscriptions=len(subs), active_count=sum(1 for s in subs if s["status"] == "Active"),
        zombie_count=sum(1 for s in subs if s["status"] == "Zombie"),
        critical_count=sum(1 for s in subs if s["status"] == "Critical"),
        escalating_count=sum(1 for s in subs if s["status"] == "Escalating"),
        total_monthly_spend=round(total_monthly, 2), total_annual_spend=round(total_monthly * 12, 2),
        potential_savings=round(zombie_monthly, 2),
        high_alerts=sum(1 for s in subs if s.get("price_alert") and s["price_alert"]["alert_level"] == "HIGH"),
        currency="KES")

@router.get("/subscriptions/health/{merchant_name}", response_model=HealthScore)
def get_health_score(merchant_name: str):
    sub = next((s for s in MOCK_SUBSCRIPTIONS if merchant_name.lower() in s["merchant_canonical"].lower()), None)
    if not sub:
        return HealthScore(merchant=merchant_name, status="Unknown", risk_score=0, monthly_cost=0.0, recommendation="No data found.")
    risk, rec = 10, "Low risk — stable pricing."
    if sub["status"] == "Zombie": risk, rec = 85, "Zombie subscription — paying for nothing. Cancel immediately."
    elif sub["status"] == "Critical": risk, rec = 90, "Price increased >10%. Use AI Agent to negotiate or cancel."
    elif sub["status"] == "Escalating": risk, rec = 60, "Gradual price creep. Review your plan options."
    return HealthScore(merchant=sub["merchant_canonical"], status=sub["status"], risk_score=risk,
        monthly_cost=sub["monthly_cost"], recommendation=rec,
        alert_level=sub["price_alert"]["alert_level"] if sub.get("price_alert") else None)
