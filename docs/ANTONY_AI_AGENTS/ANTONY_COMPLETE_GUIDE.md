# 🎓 ANTONY's Complete Setup & Usage Guide
## SubLeech AI Agent System - Step-by-Step Tutorial

**Team**: Team Doreen  
**Your Role**: AI Agent Developer  
**Date**: May 2, 2026

---

## 📚 Table of Contents

1. [What You Built](#what-you-built)
2. [How Everything Works](#how-everything-works)
3. [Setup Instructions](#setup-instructions)
4. [Using watsonx Orchestrate](#using-watsonx-orchestrate)
5. [Using LangChain](#using-langchain)
6. [Testing Your System](#testing-your-system)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 What You Built

You created an **AI Agent System** that generates two types of documents:

1. **Cancellation Letters** - Formal letters to cancel subscriptions
2. **Negotiation Scripts** - Scripts to negotiate better prices

### The System Has Two Modes:

**MOCK MODE** (Development):
- Uses local prompt templates
- No API calls
- Free and fast
- Perfect for testing

**LIVE MODE** (Production):
- Uses IBM watsonx Orchestrate
- Real AI generation with IBM Granite LLM
- Costs ~$0.001 per request
- Production-quality output

---

## 🏗️ How Everything Works

### The Flow:

```
User Request
    ↓
FastAPI Endpoint (/api/v1/agents/generate)
    ↓
SubLeechAgentOrchestrator (orchestrator.py)
    ↓
    ├─→ MOCK MODE: PromptTemplateLoader → Renders template → Returns text
    │
    └─→ LIVE MODE: WatsonxOrchestrateClient → IBM API → IBM Granite LLM → Returns AI text
```

### The Files:

1. **`agents/cancellation_agent/skill.yaml`**
   - Defines what the cancellation agent does
   - Contains the prompt template
   - Specifies input/output format

2. **`agents/negotiation_agent/skill.yaml`**
   - Defines what the negotiation agent does
   - Contains the prompt template
   - Specifies input/output format

3. **`backend/app/agents/prompt_loader.py`**
   - Loads the skill.yaml files
   - Renders templates with user data
   - Validates inputs

4. **`backend/app/agents/orchestrator.py`**
   - Main orchestration logic
   - Routes to correct agent
   - Handles both MOCK and LIVE modes

5. **`backend/app/agents/orchestrate_client.py`**
   - Connects to IBM watsonx Orchestrate API
   - Handles authentication
   - Makes API calls

6. **`backend/app/routers/agents.py`**
   - REST API endpoints
   - Receives HTTP requests
   - Returns JSON responses

---

## 🚀 Setup Instructions

### Step 1: Install Python Dependencies

```bash
cd IBMBobHackathon/backend

# Install all dependencies
pip install -r requirements.txt

# Or install individually if needed:
pip install fastapi uvicorn httpx pydantic-settings
pip install langchain langchain-ibm pyyaml
pip install pandas numpy sqlalchemy alembic psycopg2-binary
```

**What each package does**:
- `fastapi` - Web framework for API
- `httpx` - HTTP client for API calls
- `langchain` - AI agent orchestration framework
- `langchain-ibm` - IBM watsonx integration
- `pyyaml` - Reads skill.yaml files
- `pydantic-settings` - Configuration management

### Step 2: Configure Environment

Your `.env` file is already set up in `backend/.env`:

```bash
# Agent Mode
AGENT_MODE=mock  # Change to "live" for production

# watsonx Orchestrate Credentials
ORCHESTRATE_APIKEY=wZSTOeM8f6joljTrzSCuXiEX2haSKVxJYsYJiJ4jxbBx
ORCHESTRATE_IAM_APIKEY=wZSTOeM8f6joljTrzSCuXiEX2haSKVxJYsYJiJ4jxbBx
ORCHESTRATE_URL=https://api.eu-de.watson-orchestrate.cloud.ibm.com/instances/4499fe8d-d4c7-48a2-a9c8-1ed6834423f8
ORCHESTRATE_AUTH_TYPE=iam

# Database
DATABASE_URL=postgresql://subleech_user:subleech_pass@localhost:5432/subleech
```

### Step 3: Test the System

```bash
# Test in MOCK mode (no API calls)
python test_live_orchestrate.py
```

---

## 🌐 Using watsonx Orchestrate

### What is watsonx Orchestrate?

watsonx Orchestrate is IBM's AI automation platform that:
- Hosts AI agents (called "skills")
- Uses IBM Granite LLM for text generation
- Provides REST API for integration
- Handles authentication and scaling

### Your Reserved Instance

You have a watsonx Orchestrate instance already reserved:
```
URL: https://api.eu-de.watson-orchestrate.cloud.ibm.com/instances/4499fe8d-d4c7-48a2-a9c8-1ed6834423f8
Region: EU-DE (Europe - Germany)
API Key: wZSTOeM8f6joljTrzSCuXiEX2haSKVxJYsYJiJ4jxbBx
```

### How to Deploy Your Skills

#### Option 1: Using watsonx Orchestrate UI (Recommended)

1. **Login to watsonx Orchestrate**:
   ```
   https://watson-orchestrate.ibm.com
   ```

2. **Navigate to Skills**:
   - Click "Skills" in left menu
   - Click "Create Skill"

3. **Upload Cancellation Agent**:
   - Name: `cancellation_agent`
   - Upload: `agents/cancellation_agent/skill.yaml`
   - Click "Deploy"

4. **Upload Negotiation Agent**:
   - Name: `negotiation_agent`
   - Upload: `agents/negotiation_agent/skill.yaml`
   - Click "Deploy"

5. **Get Skill IDs**:
   - After deployment, note the skill IDs
   - You'll need these for API calls

#### Option 2: Using REST API

```bash
# Get access token
curl -X POST https://iam.cloud.ibm.com/identity/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=urn:ibm:params:oauth:grant-type:apikey" \
  -d "apikey=wZSTOeM8f6joljTrzSCuXiEX2haSKVxJYsYJiJ4jxbBx"

# Deploy skill (use token from above)
curl -X POST https://api.eu-de.watson-orchestrate.cloud.ibm.com/instances/4499fe8d-d4c7-48a2-a9c8-1ed6834423f8/v1/skills \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d @agents/cancellation_agent/skill.yaml
```

#### Option 3: Using SubLeech Built-in (Easiest)

Your system automatically loads skills from the `agents/` folder:

```python
from app.agents.orchestrator import SubLeechAgentOrchestrator

# This automatically loads agents/cancellation_agent/skill.yaml
# and agents/negotiation_agent/skill.yaml
orchestrator = SubLeechAgentOrchestrator()

# Use it directly
response = await orchestrator.generate_cancellation_letter(
    provider_name="Netflix",
    monthly_cost=1100.0,
    user_name="John Doe"
)
```

### Understanding the skill.yaml Files

#### Structure of skill.yaml:

```yaml
name: cancellation_agent
description: Generates formal cancellation letters

# What inputs the agent needs
input_schema:
  provider_name:
    type: string
    required: true
    description: Name of the subscription provider
  
  monthly_cost:
    type: number
    required: true
    description: Monthly subscription cost

# What the agent returns
output_schema:
  generated_text:
    type: string
    description: The generated cancellation letter

# AI model configuration
model_config:
  model_id: ibm/granite-13b-chat-v2
  parameters:
    temperature: 0.3  # Lower = more consistent
    max_tokens: 800   # Maximum length
    top_p: 0.9

# The actual prompts
prompts:
  system_prompt: |
    You are a professional legal document writer...
  
  user_prompt: |
    Generate a formal cancellation letter for {{provider_name}}...
```

#### How Templates Work:

Templates use Handlebars syntax:

```yaml
user_prompt: |
  Generate a letter for {{provider_name}}.
  Cost: ${{monthly_cost}}/month
  User: {{user_name}}
  
  {{#if cancellation_reason}}
  Reason: {{cancellation_reason}}
  {{/if}}
```

When you call it with:
```python
{
  "provider_name": "Netflix",
  "monthly_cost": 1100.0,
  "user_name": "John Doe",
  "cancellation_reason": "Price increase"
}
```

It becomes:
```
Generate a letter for Netflix.
Cost: $1100.0/month
User: John Doe

Reason: Price increase
```

---

## 🔗 Using LangChain

### What is LangChain?

LangChain is a framework for building AI applications. It provides:
- **Chains**: Sequences of AI operations
- **Prompts**: Template management
- **LLMs**: Integration with AI models
- **Memory**: Conversation history

### How SubLeech Uses LangChain

#### 1. Loading Prompts

```python
from langchain.prompts import PromptTemplate

# Create a prompt template
template = PromptTemplate(
    input_variables=["provider_name", "monthly_cost"],
    template="Generate a cancellation letter for {provider_name} costing ${monthly_cost}"
)

# Render it
prompt = template.format(
    provider_name="Netflix",
    monthly_cost=1100.0
)
```

#### 2. Using LLMs

```python
from langchain_ibm import WatsonxLLM

# Create IBM watsonx LLM
llm = WatsonxLLM(
    model_id="ibm/granite-13b-chat-v2",
    url="https://us-south.ml.cloud.ibm.com/ml/v1/text/generation",
    apikey="your_api_key",
    project_id="your_project_id",
    params={
        "temperature": 0.3,
        "max_new_tokens": 800
    }
)

# Generate text
result = llm("Write a cancellation letter for Netflix")
print(result)
```

#### 3. Creating Chains

```python
from langchain.chains import LLMChain

# Combine prompt + LLM into a chain
chain = LLMChain(
    llm=llm,
    prompt=template
)

# Run the chain
result = await chain.arun({
    "provider_name": "Netflix",
    "monthly_cost": 1100.0
})
```

### Your LangChain Implementation

In `backend/app/agents/orchestrator.py`:

```python
class SubLeechAgentOrchestrator:
    def __init__(self):
        # Load prompt templates from skill.yaml
        self.prompt_loader = PromptTemplateLoader()
        
        # Create LLM instance
        self.llm = WatsonxLLM(
            model_id="ibm/granite-13b-chat-v2",
            apikey=self.api_key,
            project_id=self.project_id
        )
    
    async def generate_cancellation_letter(self, **kwargs):
        # 1. Load and render prompt
        prompt = self.prompt_loader.render_prompt(
            "cancellation_agent",
            kwargs
        )
        
        # 2. Create LangChain chain
        chain = LLMChain(
            llm=self.llm,
            prompt=PromptTemplate(template=prompt)
        )
        
        # 3. Execute chain
        result = await chain.arun({})
        
        return result
```

---

## 🧪 Testing Your System

### Test 1: Mock Mode (No API Calls)

```bash
cd backend

# Make sure AGENT_MODE=mock in .env
python test_live_orchestrate.py
```

**Expected Output**:
```
============================================================
TEST 4: Mock Mode (Fallback)
============================================================
✅ SUCCESS: Mock mode working
Model Used: mock
Mode: mock
```

### Test 2: Python API

Create a test file `test_my_agent.py`:

```python
import asyncio
from app.agents.orchestrator import SubLeechAgentOrchestrator

async def test():
    orchestrator = SubLeechAgentOrchestrator()
    
    # Test cancellation
    response = await orchestrator.generate_cancellation_letter(
        provider_name="Netflix",
        monthly_cost=1100.0,
        user_name="John Doe",
        account_type="personal"
    )
    
    print("Generated Letter:")
    print(response.generated_text)
    print(f"\nModel: {response.model_used}")
    print(f"Confidence: {response.confidence_score}")

# Run it
asyncio.run(test())
```

Run it:
```bash
python test_my_agent.py
```

### Test 3: REST API

Start the backend:
```bash
uvicorn app.main:app --reload
```

Test with curl:
```bash
curl -X POST http://localhost:8000/api/v1/agents/generate \
  -H "Content-Type: application/json" \
  -d '{
    "action": "cancel",
    "provider_name": "Netflix",
    "subscription_cost": 1100.0,
    "user_name": "John Doe",
    "account_type": "personal",
    "cancellation_reason": "Price increased without notice"
  }'
```

Or use Postman/Insomnia:
- Method: POST
- URL: `http://localhost:8000/api/v1/agents/generate`
- Headers: `Content-Type: application/json`
- Body: (JSON above)

### Test 4: Integration with Frontend

GLORIA can call your API from React:

```typescript
// In React component
const generateCancellation = async () => {
  const response = await fetch('http://localhost:8000/api/v1/agents/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'cancel',
      provider_name: 'Netflix',
      subscription_cost: 1100.0,
      user_name: 'John Doe'
    })
  });
  
  const data = await response.json();
  console.log(data.generated_text);
};
```

---

## 🔧 Troubleshooting

### Issue 1: Import Errors

**Error**: `ModuleNotFoundError: No module named 'langchain'`

**Solution**:
```bash
pip install langchain langchain-ibm pyyaml httpx pydantic-settings
```

### Issue 2: pydantic_settings Not Found

**Error**: `ModuleNotFoundError: No module named 'pydantic_settings'`

**Solution**:
```bash
pip install pydantic-settings
```

### Issue 3: Unicode Encoding Error (Windows)

**Error**: `UnicodeEncodeError: 'charmap' codec can't encode character`

**Solution**: Already fixed in `test_live_orchestrate.py` with:
```python
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
```

### Issue 4: 404 Error from watsonx Orchestrate

**Error**: `Client error '404 Not Found' for url '...v1/skills'`

**Possible Causes**:
1. Skills not deployed yet
2. Wrong API endpoint
3. Instance ID incorrect

**Solutions**:
1. Deploy skills via watsonx Orchestrate UI first
2. Use MOCK mode for development:
   ```bash
   # In .env
   AGENT_MODE=mock
   ```
3. Verify instance ID in IBM Cloud console

### Issue 5: Schema Validation Errors

**Error**: `Invalid input for cancellation_agent: Field 'account_number' must be a string`

**Solution**: Make optional fields actually optional in skill.yaml:
```yaml
input_schema:
  account_number:
    type: string
    required: false  # ← Make sure this is false
```

---

## 📊 Understanding the Code Flow

### Example: Generating a Cancellation Letter

```
1. User Request
   ↓
   POST /api/v1/agents/generate
   Body: { "action": "cancel", "provider_name": "Netflix", ... }

2. FastAPI Router (agents.py)
   ↓
   @router.post("/generate")
   async def generate_agent_response(request: AgentRequest):

3. Orchestrator (orchestrator.py)
   ↓
   orchestrator = SubLeechAgentOrchestrator()
   response = await orchestrator.route_to_agent(...)

4. Mode Detection
   ↓
   if self.use_live_mode:
       → Call watsonx Orchestrate API
   else:
       → Use local prompt rendering

5. MOCK MODE Path:
   ↓
   prompt_loader.load_skill("cancellation_agent")
   ↓
   prompt_loader.render_prompt(agent_name, context)
   ↓
   Return rendered template

6. LIVE MODE Path:
   ↓
   orchestrate_client.invoke_cancellation_agent(...)
   ↓
   Get IAM token from IBM Cloud
   ↓
   POST to watsonx Orchestrate API
   ↓
   IBM Granite LLM generates text
   ↓
   Return AI-generated letter

7. Response
   ↓
   AgentResponse(
       action="cancel",
       provider_name="Netflix",
       generated_text="Dear Netflix Team, ...",
       model_used="watsonx-orchestrate-live" or "mock",
       confidence_score=0.95
   )

8. Database Persistence
   ↓
   Save to AgentOutput table

9. Return to User
   ↓
   JSON response with generated letter
```

---

## 🎯 Quick Reference Commands

### Setup
```bash
cd IBMBobHackathon/backend
pip install -r requirements.txt
```

### Test Mock Mode
```bash
python test_live_orchestrate.py
```

### Start Backend
```bash
uvicorn app.main:app --reload
```

### Test API
```bash
curl -X POST http://localhost:8000/api/v1/agents/generate \
  -H "Content-Type: application/json" \
  -d '{"action":"cancel","provider_name":"Netflix","subscription_cost":1100.0,"user_name":"Test"}'
```

### Switch Modes
```bash
# Edit backend/.env
AGENT_MODE=mock   # For development
AGENT_MODE=live   # For production
```

---

## 📚 Additional Resources

### Documentation Files
1. **ANTONY_COMPLETE_DELIVERABLES.md** - Full project overview
2. **QUICKSTART.md** - 5-minute setup
3. **LIVE_ORCHESTRATE_SETUP.md** - Detailed setup guide
4. **agents/README.md** - watsonx Orchestrate guide
5. **backend/app/agents/README.md** - Backend architecture

### IBM Documentation
- [watsonx Orchestrate Docs](https://www.ibm.com/docs/en/watson-orchestrate)
- [watsonx.ai API Reference](https://cloud.ibm.com/apidocs/watsonx-ai)
- [LangChain Documentation](https://python.langchain.com/docs/get_started/introduction)
- [IBM Granite Models](https://www.ibm.com/products/watsonx-ai/foundation-models)

### Code Examples
- `backend/test_live_orchestrate.py` - Integration tests
- `backend/tests/test_agents.py` - Unit tests
- `backend/app/routers/agents.py` - API examples

---

## ✅ Summary

You now have:

1. ✅ **Two AI Agents** (cancellation & negotiation)
2. ✅ **Dual-mode system** (mock & live)
3. ✅ **LangChain integration** for orchestration
4. ✅ **watsonx Orchestrate** ready for deployment
5. ✅ **REST API** for frontend integration
6. ✅ **Complete documentation** for the team
7. ✅ **Working tests** in mock mode

**Next Steps**:
1. Test in mock mode ✅
2. Deploy skills to watsonx Orchestrate (when ready)
3. Switch to live mode
4. Integrate with GLORIA's frontend
5. Demo to judges!

---

**Made with Bob** 🤖  
**IBM Bob Dev Day Hackathon 2026**  
**Team Doreen - SubLeech**

Good luck with your demo! 🎉