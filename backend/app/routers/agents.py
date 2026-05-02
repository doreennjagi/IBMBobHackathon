"""
SubLeech AI Agents Router
Enhanced with LangChain orchestration and watsonx Orchestrate integration
"""

import os
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from typing import Optional

from app.agents.orchestrator import SubLeechAgentOrchestrator
from app.core.database import get_db
from app.models.agent_output import AgentOutput

router = APIRouter()

# Initialize orchestrator
orchestrator = SubLeechAgentOrchestrator(
    watsonx_api_key=os.getenv("WATSONX_API_KEY"),
    watsonx_project_id=os.getenv("WATSONX_PROJECT_ID"),
    watsonx_url=os.getenv("WATSONX_URL")
)


class AgentRequest(BaseModel):
    """Request model for agent generation"""
    provider_name: str = Field(..., description="Name of subscription provider")
    account_type: str = Field(default="personal", description="Account type: personal or business")
    subscription_cost: float = Field(..., description="Current monthly subscription cost")
    original_cost: float = Field(..., description="Original subscription cost (for negotiation)")
    user_name: str = Field(..., description="User's name for personalization")
    action: str = Field(..., description="Action: cancel or negotiate")
    currency: str = Field(default="KES", description="Currency code")
    account_number: Optional[str] = Field(None, description="Optional account/customer ID")
    cancellation_reason: Optional[str] = Field(None, description="Optional cancellation reason")
    subscription_duration_months: Optional[int] = Field(None, description="How long subscribed (months)")
    competitor_pricing: Optional[float] = Field(None, description="Competitor pricing for leverage")
    hardship_type: Optional[str] = Field(default="financial", description="Type of hardship")


class AgentResponse(BaseModel):
    """Response model for agent generation"""
    action: str
    provider_name: str
    generated_text: str
    model_used: str
    confidence_score: float
    agent_output_id: Optional[int] = None
    metadata: dict


@router.post("/agents/generate", response_model=AgentResponse)
async def generate_agent_response(
    req: AgentRequest,
    db: Session = Depends(get_db)
):
    """
    Generate AI-powered cancellation letter or negotiation script
    
    Uses LangChain orchestration with watsonx Orchestrate skill definitions
    Persists output to database for user review and learning
    """
    # Validate action
    if req.action not in ("cancel", "negotiate"):
        raise HTTPException(
            status_code=400,
            detail="action must be 'cancel' or 'negotiate'"
        )
    
    try:
        # Route to appropriate agent via orchestrator
        agent_response = await orchestrator.route_to_agent(
            action=req.action,
            provider_name=req.provider_name,
            monthly_cost=req.subscription_cost,
            user_name=req.user_name,
            account_type=req.account_type,
            original_cost=req.original_cost,
            account_number=req.account_number,
            cancellation_reason=req.cancellation_reason,
            subscription_duration_months=req.subscription_duration_months,
            competitor_pricing=req.competitor_pricing,
            hardship_type=req.hardship_type
        )
        
        # Persist to database for learning and review
        agent_output = AgentOutput(
            agent_type=req.action,
            provider_name=req.provider_name,
            input_context={
                "subscription_cost": req.subscription_cost,
                "original_cost": req.original_cost,
                "user_name": req.user_name,
                "account_type": req.account_type,
                "currency": req.currency
            },
            generated_text=agent_response.generated_text,
            model_used=agent_response.model_used,
            confidence_score=agent_response.confidence_score,
            created_at=datetime.utcnow()
        )
        
        db.add(agent_output)
        db.commit()
        db.refresh(agent_output)
        
        return AgentResponse(
            action=agent_response.action,
            provider_name=agent_response.provider_name,
            generated_text=agent_response.generated_text,
            model_used=agent_response.model_used,
            confidence_score=agent_response.confidence_score,
            agent_output_id=agent_output.id,
            metadata=agent_response.metadata
        )
        
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=f"Agent execution failed: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


@router.post("/agents/feedback/{agent_output_id}")
async def submit_agent_feedback(
    agent_output_id: int,
    rating: int = Field(..., ge=1, le=5, description="Rating 1-5"),
    edited_text: Optional[str] = Field(None, description="User's edited version"),
    db: Session = Depends(get_db)
):
    """
    Submit feedback on agent-generated output
    
    Enables agent learning from user edits and ratings
    """
    agent_output = db.query(AgentOutput).filter(AgentOutput.id == agent_output_id).first()
    
    if not agent_output:
        raise HTTPException(status_code=404, detail="Agent output not found")
    
    agent_output.user_rating = rating
    agent_output.user_edited_text = edited_text
    agent_output.feedback_received_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "status": "success",
        "message": "Feedback recorded",
        "agent_output_id": agent_output_id,
        "rating": rating
    }


@router.get("/agents/history")
async def get_agent_history(
    limit: int = 10,
    agent_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Retrieve agent generation history
    
    Useful for reviewing past cancellations and negotiations
    """
    query = db.query(AgentOutput).order_by(AgentOutput.created_at.desc())
    
    if agent_type:
        query = query.filter(AgentOutput.agent_type == agent_type)
    
    outputs = query.limit(limit).all()
    
    return {
        "total": len(outputs),
        "outputs": [
            {
                "id": output.id,
                "agent_type": output.agent_type,
                "provider_name": output.provider_name,
                "generated_text": output.generated_text[:200] + "..." if len(output.generated_text) > 200 else output.generated_text,
                "model_used": output.model_used,
                "confidence_score": output.confidence_score,
                "user_rating": output.user_rating,
                "created_at": output.created_at.isoformat()
            }
            for output in outputs
        ]
    }


# Made with Bob - Enhanced with LangChain orchestration
