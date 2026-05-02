# SubLeech watsonx Orchestrate Agent Skills

## Overview

This directory contains **watsonx Orchestrate skill definitions** for SubLeech's AI agents. These YAML files define the input/output schemas, prompt templates, and model configurations that power SubLeech's subscription management intelligence.

## Directory Structure

```
agents/
├── README.md                    # This file - Integration guide
├── cancellation_agent/
│   └── skill.yaml              # Cancellation letter generation skill
└── negotiation_agent/
    └── skill.yaml              # Negotiation script generation skill
```

---

## 🎯 What are watsonx Orchestrate Skills?

**watsonx Orchestrate** is IBM's AI automation platform that allows you to create, deploy, and manage AI agents as reusable "skills". Each skill is defined by:

1. **Input Schema** - What data the agent needs
2. **Output Schema** - What the agent returns
3. **Prompt Template** - Instructions for the LLM
4. **Model Configuration** - Which model to use and its parameters

SubLeech uses these skill definitions to generate contextually-aware responses for subscription management.

---

## 📋 Agent Skills

### 1. Cancellation Agent (`cancellation_agent/skill.yaml`)

**Purpose**: Generates formal cancellation letters for subscription services

**Skill Name**: `CancellationLetterAgent`  
**Version**: `1.0.0`

#### Input Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `provider_name` | string | ✅ Yes | Name of subscription provider (e.g., "Netflix") |
| `monthly_cost` | number | ✅ Yes | Current monthly subscription cost |
| `user_name` | string | ✅ Yes | Name of account holder |
| `account_type` | string | ❌ No | "personal" or "business" (default: "personal") |
| `account_number` | string | ❌ No | Account or customer ID |
| `cancellation_reason` | string | ❌ No | Reason for cancellation |

#### Output Schema

| Field | Type | Description |
|-------|------|-------------|
| `letter_content` | string | Generated cancellation letter |
| `confidence_score` | number | Confidence in letter quality (0-1) |
| `provider_specific` | boolean | Whether provider-specific language was used |

#### Model Configuration

- **Model**: `ibm/granite-13b-chat-v2`
- **Temperature**: `0.3` (more deterministic, formal tone)
- **Max Tokens**: `800`
- **Top P**: `0.9`

#### Prompt Template Features

The cancellation agent generates letters that:
- Use formal business letter format
- Reference consumer protection rights
- Request immediate cancellation with no further charges
- Request written confirmation
- Include 30-day notice period if required by law
- Maintain firm but professional tone

#### Example Usage

```yaml
Input:
  provider_name: "Netflix"
  monthly_cost: 1100.0
  user_name: "John Doe"
  account_type: "personal"
  cancellation_reason: "Price increased without notice"

Output:
  letter_content: |
    [Date]
    
    Netflix Customer Service
    [Address]
    
    Dear Sir/Madam,
    
    I am writing to formally request the immediate cancellation of my Netflix subscription...
    [Full formal letter with consumer rights references]
    
    Sincerely,
    John Doe
```

---

### 2. Negotiation Agent (`negotiation_agent/skill.yaml`)

**Purpose**: Generates hardship negotiation scripts for subscription retention calls

**Skill Name**: `NegotiationScriptAgent`  
**Version**: `1.0.0`

#### Input Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `provider_name` | string | ✅ Yes | Name of subscription provider |
| `monthly_cost` | number | ✅ Yes | Current monthly subscription cost |
| `subscription_duration_months` | integer | ❌ No | How long the user has been subscribed |
| `competitor_pricing` | number | ❌ No | Competitor pricing for leverage |
| `hardship_type` | string | ❌ No | "financial", "temporary", "price_increase", "feature_reduction" |

#### Output Schema

| Field | Type | Description |
|-------|------|-------------|
| `script_content` | string | Generated negotiation script |
| `confidence_score` | number | Confidence in script effectiveness (0-1) |
| `expected_discount_range` | string | Expected discount percentage range |

#### Model Configuration

- **Model**: `ibm/granite-13b-chat-v2`
- **Temperature**: `0.4` (slightly more creative for conversational tone)
- **Max Tokens**: `1000`
- **Top P**: `0.9`

#### Prompt Template Features

The negotiation agent generates scripts with:

1. **OPENING**: Friendly introduction emphasizing loyalty
2. **SITUATION**: Brief explanation of hardship without over-explaining
3. **REQUEST**: Specific discount request (20-30% is reasonable)
4. **LEVERAGE**: Mention competitor pricing or length of subscription
5. **FALLBACK OPTIONS**:
   - Temporary discount
   - Pause subscription
   - Downgrade to lower tier
6. **RETENTION OFFER RESPONSE**: How to respond if they offer a discount
7. **CLOSING**: Professional thank you regardless of outcome

#### Example Usage

```yaml
Input:
  provider_name: "Spotify"
  monthly_cost: 399.0
  subscription_duration_months: 24
  competitor_pricing: 299.0
  hardship_type: "price_increase"

Output:
  script_content: |
    OPENING:
    "Hi, I've been a loyal Spotify subscriber for 2 years now..."
    
    SITUATION:
    "I noticed my subscription increased from 299 to 399 KES..."
    
    REQUEST:
    "I'd like to request a 25% discount to bring it back to 299 KES..."
    
    [Full structured negotiation script]
```

---

## 🔧 Integration with watsonx Orchestrate

### Step 1: Set Up watsonx Orchestrate Environment

1. **Create IBM Cloud Account**
   - Go to https://cloud.ibm.com
   - Sign up or log in

2. **Provision watsonx.ai Service**
   ```bash
   # Via IBM Cloud CLI
   ibmcloud login
   ibmcloud resource service-instance-create watsonx-subleech watsonxai lite us-south
   ```

3. **Get API Credentials**
   - Navigate to watsonx.ai dashboard
   - Go to "Manage" → "Access (IAM)"
   - Create API key
   - Note your Project ID

4. **Set Environment Variables**
   ```bash
   export WATSONX_API_KEY="your_api_key_here"
   export WATSONX_PROJECT_ID="your_project_id_here"
   export WATSONX_URL="https://us-south.ml.cloud.ibm.com/ml/v1/text/generation?version=2023-05-29"
   ```

### Step 2: Deploy Skills to watsonx Orchestrate

#### Option A: Using watsonx Orchestrate UI

1. **Access watsonx Orchestrate**
   - Go to https://orchestrate.ibm.com
   - Log in with IBM Cloud credentials

2. **Create New Skill**
   - Click "Create Skill"
   - Select "Custom Skill"
   - Upload `cancellation_agent/skill.yaml`

3. **Configure Skill**
   - Set skill name: "CancellationLetterAgent"
   - Configure input/output mappings
   - Test with sample data

4. **Repeat for Negotiation Agent**
   - Upload `negotiation_agent/skill.yaml`
   - Configure as "NegotiationScriptAgent"

#### Option B: Using watsonx Orchestrate API

```python
import requests
import yaml

# Load skill definition
with open('agents/cancellation_agent/skill.yaml', 'r') as f:
    skill_def = yaml.safe_load(f)

# Deploy to watsonx Orchestrate
response = requests.post(
    'https://orchestrate.ibm.com/api/v1/skills',
    headers={
        'Authorization': f'Bearer {WATSONX_API_KEY}',
        'Content-Type': 'application/json'
    },
    json={
        'name': skill_def['name'],
        'version': skill_def['version'],
        'description': skill_def['description'],
        'input_schema': skill_def['input_schema'],
        'output_schema': skill_def['output_schema'],
        'model_config': skill_def['model_config'],
        'prompt_template': skill_def['prompt_template']
    }
)

print(f"Skill deployed: {response.json()['skill_id']}")
```

#### Option C: Using SubLeech's Built-in Integration (Recommended)

SubLeech's backend automatically loads these skill definitions via the `PromptTemplateLoader`:

```python
from app.agents.prompt_loader import PromptTemplateLoader

# Automatically loads from agents/ directory
loader = PromptTemplateLoader()

# Load and use skills
skill = loader.load_skill("cancellation_agent")
prompt = loader.render_prompt("cancellation_agent", context)
```

**No manual deployment needed** - the skills are loaded at runtime!

### Step 3: Invoke Skills from SubLeech Backend

The SubLeech backend (`backend/app/agents/orchestrator.py`) handles skill invocation:

```python
from app.agents.orchestrator import SubLeechAgentOrchestrator

# Initialize orchestrator with watsonx credentials
orchestrator = SubLeechAgentOrchestrator(
    watsonx_api_key=os.getenv("WATSONX_API_KEY"),
    watsonx_project_id=os.getenv("WATSONX_PROJECT_ID")
)

# Generate cancellation letter
response = await orchestrator.generate_cancellation_letter(
    provider_name="Netflix",
    monthly_cost=1100.0,
    user_name="John Doe"
)

print(response.generated_text)
```

### Step 4: Test Skills

```bash
# Run agent tests
cd backend
pytest tests/test_agents.py -v

# Test specific skill
pytest tests/test_agents.py::TestPromptTemplateLoader::test_load_cancellation_skill -v
```

---

## 🔐 Security & Best Practices

### API Key Management

**DO NOT** commit API keys to Git:

```bash
# .env file (gitignored)
WATSONX_API_KEY=your_api_key_here
WATSONX_PROJECT_ID=your_project_id_here
```

**DO** use environment variables:

```python
import os
api_key = os.getenv("WATSONX_API_KEY")
```

### Rate Limiting

watsonx.ai has rate limits:
- **Free tier**: 20 requests/minute
- **Standard tier**: 100 requests/minute
- **Enterprise**: Custom limits

SubLeech implements caching to reduce API calls.

### Cost Management

**IBM Granite Model Pricing** (as of 2026):
- Input: $0.0005 per 1K tokens
- Output: $0.0015 per 1K tokens

**Estimated costs per request**:
- Cancellation letter: ~$0.001 (800 tokens)
- Negotiation script: ~$0.0015 (1000 tokens)

**Monthly estimate** (100 users, 5 requests each):
- 500 requests × $0.00125 = **$0.625/month**

---

## 🧪 Testing Skills Locally

### Mock Mode (No API Key Required)

```python
# Set no API key
os.environ.pop("WATSONX_API_KEY", None)

# Orchestrator runs in mock mode
orchestrator = SubLeechAgentOrchestrator()

# Returns rendered prompt instead of LLM output
response = await orchestrator.generate_cancellation_letter(
    provider_name="Netflix",
    monthly_cost=1100.0,
    user_name="Test User"
)

# response.model_used == "mock"
# response.generated_text contains the prompt template
```

### Live Testing with watsonx.ai

```python
# Set API key
os.environ["WATSONX_API_KEY"] = "your_key"

# Orchestrator uses real LLM
orchestrator = SubLeechAgentOrchestrator()

response = await orchestrator.generate_cancellation_letter(
    provider_name="Netflix",
    monthly_cost=1100.0,
    user_name="Test User"
)

# response.model_used == "ibm/granite-13b-chat-v2"
# response.generated_text contains actual LLM output
```

---

## 📊 Monitoring & Analytics

### Track Agent Performance

SubLeech persists all agent outputs to the database:

```sql
SELECT 
    agent_type,
    provider_name,
    AVG(confidence_score) as avg_confidence,
    AVG(user_rating) as avg_rating,
    COUNT(*) as total_generations
FROM agent_outputs
GROUP BY agent_type, provider_name
ORDER BY avg_rating DESC;
```

### User Feedback Loop

Users can rate and edit agent outputs:

```python
# Submit feedback
POST /api/v1/agents/feedback/{agent_output_id}
{
    "rating": 5,
    "edited_text": "User's improved version..."
}
```

This data can be used to:
- Fine-tune prompts
- Identify problematic providers
- Improve model performance
- A/B test different prompt variations

---

## 🚀 Advanced Usage

### Custom Skills

Create your own skills by following the YAML structure:

```yaml
name: YourCustomAgent
version: 1.0.0
description: Your agent description

input_schema:
  type: object
  required:
    - field1
  properties:
    field1:
      type: string

output_schema:
  type: object
  properties:
    result:
      type: string

model_config:
  model_id: ibm/granite-13b-chat-v2
  parameters:
    temperature: 0.3
    max_tokens: 800

prompt_template: |
  Your prompt here with {{field1}}
```

### Multi-Agent Chains

Chain multiple agents together:

```python
# Step 1: Detect price increase
detection_response = await detector_agent.analyze(subscription)

# Step 2: If increase detected, generate negotiation script
if detection_response.price_increased:
    negotiation_response = await orchestrator.generate_negotiation_script(
        provider_name=subscription.provider,
        monthly_cost=subscription.current_cost,
        original_cost=subscription.original_cost
    )
```

---

## 📚 Additional Resources

### IBM Documentation
- [watsonx.ai Documentation](https://www.ibm.com/docs/en/watsonx-as-a-service)
- [watsonx Orchestrate Guide](https://www.ibm.com/docs/en/watsonx/orchestrate)
- [IBM Granite Models](https://www.ibm.com/products/watsonx-ai/foundation-models)

### LangChain Integration
- [LangChain IBM Integration](https://python.langchain.com/docs/integrations/llms/ibm_watsonx)
- [LangChain Chains](https://python.langchain.com/docs/modules/chains/)

### SubLeech Documentation
- Backend Agent Implementation: `backend/app/agents/README.md`
- API Documentation: `backend/app/routers/agents.py`
- Test Suite: `backend/tests/test_agents.py`

---

## 🤝 Contributing

To add new agent skills:

1. Create new directory: `agents/your_agent_name/`
2. Add `skill.yaml` with proper schema
3. Update `PromptTemplateLoader` if needed
4. Add tests in `backend/tests/test_agents.py`
5. Document in this README

---

## 📞 Support

**Team Contact**: ANTONY (AI Agent Developer)  
**Project**: SubLeech - IBM Bob Dev Day Hackathon 2026  
**GitHub**: https://github.com/doreennjagi/IBMBobHackathon

---

**Made with Bob** 🤖 - Demonstrating IBM watsonx Orchestrate + LangChain Integration