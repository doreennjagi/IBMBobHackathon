from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    email: str
    display_name: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    email: str
    display_name: Optional[str]
    created_at: datetime
    class Config:
        from_attributes = True

class PriceAlertSchema(BaseModel):
    original_price: float
    current_price: float
    percentage_change: float
    alert_level: str
    total_overcharge: float

class SubscriptionResponse(BaseModel):
    merchant_canonical: str
    category: str
    frequency: str
    average_amount: float
    latest_amount: float
    currency: str = "KES"
    status: str
    confidence_score: float
    first_seen: str
    last_seen: str
    price_alert: Optional[PriceAlertSchema] = None

class AgentRequest(BaseModel):
    provider_name: str = Field(..., min_length=1, max_length=100)
    account_type: str = Field(..., min_length=1, max_length=50)
    subscription_cost: float = Field(..., gt=0)
    original_cost: float = Field(..., gt=0)
    user_name: str = Field(..., min_length=1, max_length=100)
    action: str = Field(..., pattern="^(cancel|negotiate)$")
    currency: str = Field(default="KES", pattern="^[A-Z]{3}$")

class AgentResponse(BaseModel):
    action: str
    provider_name: str
    generated_text: str
    model_used: str
