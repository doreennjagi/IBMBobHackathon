# 🚀 SubLeech AI Agents - Quick Start Guide

## ⚡ Fast Setup (5 Minutes)

### Step 1: Install Dependencies

**Windows:**
```bash
cd IBMBobHackathon\backend
install_dependencies.bat
```

**Mac/Linux:**
```bash
cd IBMBobHackathon/backend
pip install -r requirements.txt
```

### Step 2: Verify Configuration

Your `.env` file is already configured with live watsonx Orchestrate credentials:
```bash
AGENT_MODE=live
ORCHESTRATE_APIKEY=wZSTOeM8f6joljTrzSCuXiEX2haSKVxJYsYJiJ4jxbBx
ORCHESTRATE_URL=https://api.eu-de.watson-orchestrate.cloud.ibm.com/...
```

### Step 3: Test Live Integration

```bash
python test_live_orchestrate.py
```

**Expected Output:**
```
✅ SUCCESS: watsonx Orchestrate API is accessible
✅ SUCCESS: Generated cancellation letter
✅ SUCCESS: Generated negotiation script
✅ SUCCESS: Mock mode working

Total: 4/4 tests passed
🎉 All tests passed!
```

---

## 🎯 Usage Examples

### Python API

```python
from app.agents.orchestrator import SubLeechAgentOrchestrator

# Initialize (automatically uses live mode from .env)
orchestrator = SubLeechAgentOrchestrator()

# Generate cancellation letter
response = await orchestrator.generate_cancellation_letter(
    provider_name="Netflix",
    monthly_cost=1100.0,
    user_name="John Doe"
)

print(response.generated_text)
```

### REST API

```bash
# Start backend
uvicorn app.main:app --reload

# Call API
curl -X POST http://localhost:8000/api/v1/agents/generate \
  -H "Content-Type: application/json" \
  -d '{
    "action": "cancel",
    "provider_name": "Netflix",
    "subscription_cost": 1100.0,
    "user_name": "John Doe"
  }'
```

---

## 🔄 Switch Modes

### Development (Mock Mode)
Edit `.env`:
```bash
AGENT_MODE=mock
```

### Production (Live Mode)
Edit `.env`:
```bash
AGENT_MODE=live
```

---

## 📚 Full Documentation

- **Setup Guide**: `LIVE_ORCHESTRATE_SETUP.md` (438 lines)
- **watsonx Integration**: `agents/README.md` (485 lines)
- **Backend Docs**: `backend/app/agents/README.md` (310 lines)

---

## ❓ Troubleshooting

### "ModuleNotFoundError"
```bash
pip install -r requirements.txt
```

### "Cannot connect to API"
Check `.env` credentials are correct

### "Mock response in live mode"
Verify `AGENT_MODE=live` in `.env`

---

## ✅ What's Working

✅ Live watsonx Orchestrate API integration  
✅ IBM Cloud IAM authentication  
✅ Cancellation letter generation  
✅ Negotiation script generation  
✅ Mock mode for development  
✅ Database persistence  
✅ User feedback system  

---

**Made with Bob** 🤖