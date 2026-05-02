import os
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()
WATSONX_API_KEY = os.getenv("WATSONX_API_KEY", "")
WATSONX_PROJECT_ID = os.getenv("WATSONX_PROJECT_ID", "")
GRANITE_MODEL = "ibm/granite-13b-instruct-v2"
WATSONX_URL = "https://us-south.ml.cloud.ibm.com/ml/v1/text/generation?version=2023-05-29"

class AgentRequest(BaseModel):
    provider_name: str
    account_type: str
    subscription_cost: float
    original_cost: float
    user_name: str
    action: str
    currency: str = "KES"

class AgentResponse(BaseModel):
    action: str
    provider_name: str
    generated_text: str
    model_used: str

@router.post("/agents/generate", response_model=AgentResponse)
async def generate_agent_response(req: AgentRequest):
    if req.action not in ("cancel", "negotiate"):
        raise HTTPException(status_code=400, detail="action must be cancel or negotiate")
    if req.action == "cancel":
        prompt = f"Write a formal cancellation letter for {req.provider_name}. Customer: {req.user_name}. Cost: {req.currency} {req.subscription_cost}/month. Include 30-day notice and request confirmation."
    else:
        increase = ((req.subscription_cost - req.original_cost) / req.original_cost * 100) if req.original_cost else 0
        prompt = f"Write a negotiation script for {req.provider_name}. Price went from {req.currency} {req.original_cost} to {req.currency} {req.subscription_cost} ({increase:.1f}% increase). Include hardship framing and 2 fallback positions."
    if not WATSONX_API_KEY:
        return AgentResponse(action=req.action, provider_name=req.provider_name,
            generated_text=f"[Set WATSONX_API_KEY for live generation]\n\n{prompt}",
            model_used="mock")
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(WATSONX_URL,
            headers={"Authorization": f"Bearer {WATSONX_API_KEY}", "Content-Type": "application/json"},
            json={"model_id": GRANITE_MODEL, "project_id": WATSONX_PROJECT_ID,
                  "input": prompt, "parameters": {"decoding_method": "greedy", "max_new_tokens": 800}})
    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail=f"watsonx error: {resp.text[:200]}")
    return AgentResponse(action=req.action, provider_name=req.provider_name,
        generated_text=resp.json()["results"][0]["generated_text"], model_used=GRANITE_MODEL)
