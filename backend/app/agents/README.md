# SubLeech AI Agents - LangChain Orchestration Layer

## Overview

This directory contains the AI agent orchestration layer for SubLeech, built with **LangChain** and integrated with **IBM watsonx Orchestrate**. The agents generate contextually-aware cancellation letters and negotiation scripts for subscription management.

## Architecture

```
app/agents/
├── __init__.py              # Package exports
├── orchestrator.py          # SubLeechAgentOrchestrator - main routing logic
├── prompt_loader.py         # PromptTemplateLoader - YAML skill loader
└── README.md               # This file

../../agents/                # watsonx Orchestrate skill definitions
├── cancellation_agent/
│   └── skill.yaml          # Cancellation letter generation skill
└── negotiation_agent/
    └── skill.yaml          # Negotiation script generation skill
```

## Components

### 1. SubLeechAgentOrchestrator (`orchestrator.py`)

**Purpose**: Central routing and orchestration layer for AI agents

**Key Features**:
- Routes subscription actions to specialized agents (cancel/negotiate)
- Integrates with IBM watsonx.ai via LangChain
- Uses IBM Granite LLM for text generation
- Supports mock mode when API key not configured
- Validates input against skill schemas
- Returns structured `AgentResponse` objects

**Usage**:
```python
from app.agents.orchestrator import SubLeechAgentOrchestrator

orchestrator = SubLeechAgentOrchestrator()

# Generate cancellation letter
response = await orchestrator.generate_cancellation_letter(
    provider_name="Netflix",
    monthly_cost=1100.0,
    user_name="John Doe",
    account_type="personal"
)

# Generate negotiation script
response = await orchestrator.generate_negotiation_script(
    provider_name="Spotify",
    monthly_cost=399.0,
    original_cost=299.0,
    subscription_duration_months=12
)
```

### 2. PromptTemplateLoader (`prompt_loader.py`)

**Purpose**: Loads and renders watsonx Orchestrate skill definitions

**Key Features**:
- Parses YAML skill definitions from `../../agents/`
- Renders Handlebars-style templates (`{{variable}}`, `{{#if}}...{{/if}}`)
- Validates input against skill input schemas
- Extracts model configuration (model_id, parameters)
- Caches loaded skills for performance

**Usage**:
```python
from app.agents.prompt_loader import PromptTemplateLoader

loader = PromptTemplateLoader()

# Load skill definition
skill = loader.load_skill("cancellation_agent")

# Render prompt with context
context = {
    "provider_name": "Netflix",
    "monthly_cost": 1100.0,
    "user_name": "John Doe"
}
prompt = loader.render_prompt("cancellation_agent", context)

# Validate input
is_valid, error = loader.validate_input("cancellation_agent", context)
```

## watsonx Orchestrate Skills

### Cancellation Agent (`cancellation_agent/skill.yaml`)

**Purpose**: Generates formal cancellation letters

**Input Schema**:
- `provider_name` (required): Subscription provider name
- `monthly_cost` (required): Current monthly cost
- `user_name` (required): User's name
- `account_type` (optional): "personal" or "business"
- `account_number` (optional): Account/customer ID
- `cancellation_reason` (optional): Reason for cancellation

**Output**: Formal business letter with:
- Consumer rights references
- 30-day notice period
- Request for written confirmation
- Professional, firm tone

**Model**: IBM Granite 13B Chat v2
- Temperature: 0.3 (more deterministic)
- Max tokens: 800

### Negotiation Agent (`negotiation_agent/skill.yaml`)

**Purpose**: Generates hardship negotiation scripts

**Input Schema**:
- `provider_name` (required): Subscription provider name
- `monthly_cost` (required): Current monthly cost
- `subscription_duration_months` (optional): Length of subscription
- `competitor_pricing` (optional): Competitor pricing for leverage
- `hardship_type` (optional): "financial", "temporary", "price_increase", "feature_reduction"

**Output**: Structured negotiation script with:
1. Opening (loyalty emphasis)
2. Situation (hardship framing)
3. Request (20-30% discount)
4. Leverage (competitor pricing, loyalty)
5. Fallback options (temporary discount, pause, downgrade)
6. Retention offer response
7. Professional closing

**Model**: IBM Granite 13B Chat v2
- Temperature: 0.4 (slightly more creative)
- Max tokens: 1000

## Integration with FastAPI Router

The orchestrator is integrated into `app/routers/agents.py`:

```python
from app.agents.orchestrator import SubLeechAgentOrchestrator

orchestrator = SubLeechAgentOrchestrator()

@router.post("/agents/generate")
async def generate_agent_response(req: AgentRequest, db: Session = Depends(get_db)):
    # Route to agent
    agent_response = await orchestrator.route_to_agent(
        action=req.action,
        provider_name=req.provider_name,
        monthly_cost=req.subscription_cost,
        user_name=req.user_name,
        # ... additional context
    )
    
    # Persist to database
    agent_output = AgentOutput(
        agent_type=req.action,
        generated_text=agent_response.generated_text,
        # ... metadata
    )
    db.add(agent_output)
    db.commit()
    
    return agent_response
```

## Database Persistence

Agent outputs are persisted to the `agent_outputs` table via the `AgentOutput` model:

```python
class AgentOutput(Base):
    __tablename__ = "agent_outputs"
    
    id: int
    agent_type: str              # "cancel" or "negotiate"
    provider_name: str
    input_context: dict          # Original request context
    generated_text: str          # AI-generated output
    model_used: str              # e.g., "ibm/granite-13b-chat-v2"
    confidence_score: float
    user_rating: int             # 1-5 stars (optional)
    user_edited_text: str        # User's edited version (optional)
    created_at: datetime
    feedback_received_at: datetime
```

This enables:
- User review and editing of AI outputs
- Feedback collection for model improvement
- Historical tracking of agent performance
- Learning from user edits

## Testing

Comprehensive test suite in `tests/test_agents.py`:

```bash
# Run agent tests
pytest backend/tests/test_agents.py -v

# Run with coverage
pytest backend/tests/test_agents.py --cov=app.agents --cov-report=html
```

**Test Coverage**:
- ✅ Prompt template loading and rendering
- ✅ Handlebars variable substitution
- ✅ Conditional block rendering
- ✅ Input validation
- ✅ Agent routing (mock mode)
- ✅ Cancellation letter generation
- ✅ Negotiation script generation
- ✅ Error handling
- ✅ Full workflow integration

## Environment Configuration

Required environment variables:

```bash
# IBM watsonx.ai credentials
WATSONX_API_KEY=your_api_key_here
WATSONX_PROJECT_ID=your_project_id_here
WATSONX_URL=https://us-south.ml.cloud.ibm.com/ml/v1/text/generation?version=2023-05-29

# Optional: Override model
GRANITE_MODEL_ID=ibm/granite-13b-chat-v2
```

**Mock Mode**: If `WATSONX_API_KEY` is not set, the orchestrator runs in mock mode, returning the rendered prompt instead of calling the LLM. This is useful for:
- Local development without API access
- Testing prompt templates
- CI/CD pipeline testing

## LangChain Integration

The orchestrator uses LangChain components:

```python
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from langchain_ibm import WatsonxLLM

# Create LLM instance
llm = WatsonxLLM(
    model_id="ibm/granite-13b-chat-v2",
    url=watsonx_url,
    apikey=api_key,
    project_id=project_id,
    params={
        "decoding_method": "greedy",
        "max_new_tokens": 800,
        "temperature": 0.3
    }
)

# Create chain
prompt_template = PromptTemplate(template=rendered_prompt)
chain = LLMChain(llm=llm, prompt=prompt_template)

# Execute
result = await chain.arun({})
```

## Future Enhancements

1. **Multi-Agent Chains**: Chain multiple agents for complex workflows
2. **Memory Integration**: Add conversation memory for multi-turn interactions
3. **RAG Integration**: Retrieve provider-specific cancellation policies
4. **Fine-tuning**: Fine-tune Granite on user-edited outputs
5. **A/B Testing**: Test different prompt variations
6. **Confidence Scoring**: Implement actual confidence calculation
7. **Provider-Specific Agents**: Specialized agents per provider

## Team Responsibility

**Owner**: ANTONY (AI Agent Developer)

**Responsibilities**:
- watsonx Orchestrate agent development
- Prompt engineering and optimization
- LangChain chain orchestration
- Agent testing and validation
- Integration with backend API

---

**Made with Bob** - IBM Bob Dev Day Hackathon 2026