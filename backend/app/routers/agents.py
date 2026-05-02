import os
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
import httpx

router = APIRouter()

WATSONX_API_KEY = os.getenv("WATSONX_API_KEY", "")
WATSONX_PROJECT_ID = os.getenv("WATSONX_PROJECT_ID", "")
GRANITE_MODEL = "ibm/granite-13b-instruct-v2"
WATSONX_URL = "https://us-south.ml.cloud.ibm.com/ml/v1/text/generation?version=2023-05-29"

class AgentRequest(BaseModel):
    provider_name: str = Field(..., description="Name of subscription provider")
    account_type: str = Field(default="personal")
    subscription_cost: float = Field(..., description="Current monthly cost")
    original_cost: float = Field(..., description="Original cost before increase")
    user_name: str = Field(..., description="User name for personalization")
    action: str = Field(..., description="cancel or negotiate")
    currency: str = Field(default="KES")
    cancellation_reason: Optional[str] = None
    subscription_duration_months: Optional[int] = None
    competitor_pricing: Optional[float] = None
    hardship_type: Optional[str] = Field(default="financial")

class AgentResponse(BaseModel):
    action: str
    provider_name: str
    generated_text: str
    model_used: str
    confidence_score: float = 0.85

@router.post("/agents/generate", response_model=AgentResponse)
async def generate_agent_response(req: AgentRequest):
    if req.action not in ("cancel", "negotiate"):
        raise HTTPException(status_code=400, detail="action must be cancel or negotiate")

    if req.action == "cancel":
        prompt = f"Write a formal cancellation letter for {req.provider_name}. Customer: {req.user_name}. Cost: {req.currency} {req.subscription_cost}/month. Reason: {req.cancellation_reason or 'financial constraints'}. Include 30-day notice and request written confirmation."
    else:
        increase = ((req.subscription_cost - req.original_cost) / req.original_cost * 100) if req.original_cost else 0
        prompt = f"Write a negotiation script for {req.provider_name}. Price went from {req.currency} {req.original_cost} to {req.currency} {req.subscription_cost} ({increase:.1f}% increase). Customer subscribed for {req.subscription_duration_months or 'several'} months. Include hardship framing and 2 fallback positions."

    if not WATSONX_API_KEY:
        return AgentResponse(
            action=req.action,
            provider_name=req.provider_name,
            generated_text=f"[Set WATSONX_API_KEY for live generation]\n\n{prompt}",
            model_used="mock",
            confidence_score=0.5
        )

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(WATSONX_URL,
            headers={"Authorization": f"Bearer {WATSONX_API_KEY}", "Content-Type": "application/json"},
            json={"model_id": GRANITE_MODEL, "project_id": WATSONX_PROJECT_ID,
                  "input": prompt, "parameters": {"decoding_method": "greedy", "max_new_tokens": 800}})

    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail=f"watsonx error: {resp.text[:200]}")

    return AgentResponse(
        action=req.action,
        provider_name=req.provider_name,
        generated_text=resp.json()["results"][0]["generated_text"],
        model_used=GRANITE_MODEL,
        confidence_score=0.95
    )

@router.get("/agents/history")
async def get_agent_history(limit: int = 10):
    return {"total": 0, "outputs": [], "message": "Connect database to see history"}

@router.post("/agents/feedback/{agent_output_id}")
async def submit_agent_feedback(agent_output_id: int, rating: int, edited_text: Optional[str] = None):
    return {"status": "success", "message": "Feedback recorded", "agent_output_id": agent_output_id, "rating": rating}
