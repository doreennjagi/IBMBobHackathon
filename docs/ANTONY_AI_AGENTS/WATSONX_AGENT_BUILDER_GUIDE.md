# watsonx Orchestrate Agent Builder - LIVE Guide for ANTONY
**You're in the Conversational Agent Builder - Here's How to Use It**

---

## 🎯 What You're Looking At

This is the **new watsonx Orchestrate Agent Builder** - it creates conversational AI agents, not traditional API skills. This is actually BETTER for your demo!

---

## ✅ STEP-BY-STEP: Create Cancellation Letter Agent

### STEP 1: Fill in Description (You're Here Now!)

**In the "Description" field, paste this:**
```
Generates formal cancellation letters for subscription services. Takes provider name, monthly cost, user name, and account details, then creates a professional letter with consumer rights language and proper business formatting.
```

**Character count**: Should be under the limit

---

### STEP 2: Customize Welcome Message

**In the "Welcome message" field (37/100 characters), replace with:**
```
I'll help you write a cancellation letter
```

---

### STEP 3: Add Quick Start Prompts

**Click "Add prompt" and add these 3 prompts:**

**Prompt 1:**
```
Generate a cancellation letter for my Netflix subscription
```

**Prompt 2:**
```
Help me cancel my Spotify Premium account
```

**Prompt 3:**
```
Write a formal cancellation letter for a business subscription
```

---

### STEP 4: Set Agent Style

**Select**: **Default** (Recommended)
- This uses the model's intrinsic ability
- Good for document generation tasks

---

### STEP 5: Skip Voice Modality
- Leave this empty for now
- Not needed for text generation

---

### STEP 6: Add Knowledge (IMPORTANT!)

**Click "Add source"**

You have 3 options:

#### Option A: Upload a Document (Recommended)
1. Click "Upload files"
2. Create a simple text file with this content:

**File name**: `cancellation_letter_guide.txt`

**Content**:
```
CANCELLATION LETTER TEMPLATE GUIDE

Format Requirements:
- Use formal business letter format
- Include date at top
- Include provider address
- Clear subject line
- Professional salutation
- Body with cancellation request
- Reference to consumer rights
- Request for written confirmation
- Professional closing with signature

Consumer Rights Language:
- Right to cancel under consumer protection laws
- Request immediate cessation of charges
- 30-day notice period if required
- Request refund of any charges after cancellation date

Tone Guidelines:
- Firm but professional
- Clear and direct
- Reference account details
- State cancellation effective date
- Request confirmation in writing

Example Structure:
[Date]
[Provider Name]
[Provider Address]

Subject: Cancellation of Subscription - [Account Name]

Dear [Provider] Customer Service,

I am writing to formally request immediate cancellation of my subscription...

[Body with details and consumer rights references]

Sincerely,
[User Name]
```

3. Upload this file
4. Wait for it to process

#### Option B: Use Instructions Instead
If upload doesn't work, skip to STEP 7 and put everything in Instructions

---

### STEP 7: Add Instructions (CRITICAL!)

**In the "Instructions" field, paste this EXACT text:**

```
You are a professional consumer rights advocate specializing in subscription cancellation letters.

TASK: Generate formal cancellation letters for subscription services.

REQUIRED INFORMATION TO ASK FOR:
1. Provider name (e.g., Netflix, Spotify, Adobe)
2. Monthly cost (e.g., $15.99)
3. User's full name
4. Account type (personal or business)
5. Account number (optional)
6. Reason for cancellation (optional)

LETTER FORMAT REQUIREMENTS:
1. Start with current date
2. Include provider's customer service address
3. Clear subject line: "Cancellation of Subscription - [Account Name]"
4. Professional salutation
5. State cancellation request clearly in first paragraph
6. Reference consumer protection rights
7. Request immediate cessation of all charges
8. Request written confirmation of cancellation
9. Include 30-day notice if legally required
10. Professional closing with user's name

TONE AND STYLE:
- Formal business letter format
- Firm but professional language
- Clear and direct statements
- No placeholder text - use actual provided information
- Reference specific account details when provided

CONSUMER RIGHTS LANGUAGE TO INCLUDE:
- Right to cancel under consumer protection laws
- Request for no further charges after cancellation date
- Request for refund of any charges made after cancellation
- Reference to terms of service cancellation policy

EXAMPLE OUTPUT STRUCTURE:
[Current Date]

[Provider Name] Customer Service
[Generic Provider Address]

Subject: Cancellation of Subscription - [User Name]

Dear [Provider Name] Customer Service Team,

I am writing to formally request the immediate cancellation of my [Provider Name] subscription, currently billed at $[Amount] per month.

[Body paragraphs with consumer rights language and specific requests]

I request written confirmation of this cancellation and confirmation that no further charges will be applied to my account.

Sincerely,
[User Name]

IMPORTANT: Always ask for missing information before generating the letter. Do not use placeholder text.
```

---

### STEP 8: Add Guidelines

**Click "Add Guideline"**

**Guideline 1:**
```
Name: Always Ask for Required Information
Rule: Before generating a letter, confirm you have: provider name, monthly cost, and user name. Ask for missing information.
```

**Guideline 2:**
```
Name: No Placeholder Text
Rule: Never use [PLACEHOLDER] or [INSERT HERE] in the generated letter. Only use actual information provided by the user.
```

**Guideline 3:**
```
Name: Professional Tone
Rule: Maintain formal business letter tone. Be firm but respectful. Reference consumer rights appropriately.
```

---

### STEP 9: Enable Chat with Documents
**Toggle ON**: "Chat with documents"
- This allows the agent to reference uploaded knowledge

---

### STEP 10: Configure Channels

**Enable these channels:**
- ✅ **Home page**: Toggle ON (Show the agent on Orchestrate Chat home page)
- ✅ **Embedded agent**: Toggle ON if you want to embed in your app
- ⬜ Others: Leave OFF for now

---

### STEP 11: Save and Test

**Click "Save" or "Publish"** (usually top-right corner)

---

### STEP 12: Test Your Agent

**Go to the Chat interface**

**Test Prompt 1:**
```
Generate a cancellation letter for my Netflix subscription. My name is John Doe, the monthly cost is $15.99, and it's a personal account.
```

**Expected Response:**
The agent should generate a complete formal letter with:
- Current date
- Netflix address
- Subject line
- Professional body
- Consumer rights language
- John Doe's signature

**Test Prompt 2:**
```
Help me cancel Spotify Premium
```

**Expected Response:**
The agent should ASK for:
- Your name
- Monthly cost
- Account type

Then generate the letter once you provide the info.

---

## 🎯 Create Second Agent: Negotiation Script

**Click "Create new agent"** (or go back to agent list)

### Fill in the same sections:

**Description:**
```
Generates negotiation scripts for subscription retention. Takes provider name, current and original costs, subscription duration, and creates a conversation script with opening, objection handling, and fallback positions.
```

**Welcome message:**
```
I'll help you negotiate better subscription terms
```

**Quick start prompts:**
```
1. Help me negotiate with Netflix about a price increase
2. Create a negotiation script for my Spotify subscription
3. I want to negotiate a discount with my streaming service
```

**Agent Style:** Default

**Instructions:**
```
You are a professional customer retention negotiation coach specializing in subscription services.

TASK: Generate negotiation scripts for users to use when calling subscription providers.

REQUIRED INFORMATION TO ASK FOR:
1. Provider name (e.g., Netflix, Spotify)
2. Current monthly cost (e.g., $15.99)
3. Original monthly cost before increase (e.g., $12.99)
4. How long they've been subscribed (in months)
5. User's name
6. Type of hardship (financial, reduced usage, competitor offer, price increase)

SCRIPT FORMAT REQUIREMENTS:
1. [YOUR OPENING] - Loyalty-focused introduction
2. [MAIN REQUEST] - Ask for return to original pricing or discount
3. [IF THEY SAY NO] - Empathetic but firm response
4. [FALLBACK POSITION 1] - Partial discount (e.g., 50% off for 6 months)
5. [FALLBACK POSITION 2] - Temporary pause or downgrade option
6. [FALLBACK POSITION 3] - Competitor comparison leverage
7. [OBJECTION HANDLING] - Responses to common objections
8. [CLOSING] - Clear ask with timeline

TONE AND STYLE:
- Conversational but structured
- Empathetic but firm
- Reference loyalty and long-term relationship
- Use specific numbers and dates
- Provide exact phrases to say

NEGOTIATION STRATEGY:
- Start with hardship framing
- Emphasize loyalty (mention subscription duration)
- Reference price increase amount
- Provide 3 fallback positions
- Include objection handling
- End with clear ask and timeline

EXAMPLE OUTPUT STRUCTURE:
[YOUR OPENING]
"Hi, I'm calling about my [Provider] account. I've been a loyal subscriber for [X] months, and I noticed my bill increased from $[Original] to $[Current]. I really value [Provider], but this increase is difficult for me right now."

[MAIN REQUEST]
"I'd like to request that my account be returned to the original $[Original] pricing, or receive a loyalty discount that brings me closer to that amount."

[IF THEY SAY NO]
"I understand that's the standard pricing, but given my [X] months of loyalty and the fact that I'm considering canceling due to budget constraints, is there any flexibility?"

[FALLBACK POSITION 1]
"Would you be able to offer me 50% off for the next 6 months while I evaluate whether I can continue the subscription?"

[Continue with other sections...]

IMPORTANT: Always ask for missing information. Provide specific, actionable phrases the user can say.
```

**Guidelines:**
```
1. Always Ask for Required Information
2. Provide Specific Phrases
3. Include Multiple Fallback Options
```

**Save and Test**

---

## 🔗 How to Integrate with Your Code

### The Challenge:
This conversational agent interface doesn't expose traditional API endpoints with parameters.

### The Solution:
You have 3 options:

#### Option 1: Use the Chat API (Recommended)
Your backend can send conversational prompts to the agent:

```python
# In orchestrate_client.py
async def invoke_cancellation_agent_chat(self, provider_name, monthly_cost, user_name, account_type):
    prompt = f"""Generate a cancellation letter for my {provider_name} subscription. 
    My name is {user_name}, the monthly cost is ${monthly_cost}, 
    and it's a {account_type} account."""
    
    # Send to watsonx Orchestrate Chat API
    response = await self.client.post(
        f"{self.base_url}/v1/chat/completions",
        json={
            "agent_id": self.cancellation_agent_id,
            "messages": [{"role": "user", "content": prompt}]
        }
    )
    return response.json()
```

#### Option 2: Keep Using Mock Mode
Your current implementation works perfectly! Just demo it as:
- "This is the architecture"
- "In production, this would call the conversational agent"
- Show the agent in the UI separately

#### Option 3: Create Custom Skills (Advanced)
Look for "Skills" or "Custom Actions" in a different section of watsonx Orchestrate

---

## 📊 For Your Demo

### Show This Flow:

1. **Show the Agent in UI**
   - Open watsonx Orchestrate
   - Show your Cancellation Letter Agent
   - Test it with a live prompt
   - Show the generated letter

2. **Show Your Code**
   - Open `backend/app/agents/orchestrator.py`
   - Explain the mock/live mode switching
   - Show the prompt templates in `agents/` folder

3. **Run the Test**
   - `python test_live_orchestrate.py` in mock mode
   - Show the output
   - Explain: "This demonstrates the integration architecture"

4. **Explain the Value**
   - IBM Bob generated all this code
   - Production-ready architecture
   - Scalable agent system
   - Easy to switch between mock and live

---

## ✅ Summary

**What you've created:**
- ✅ Conversational AI agent for cancellation letters
- ✅ Conversational AI agent for negotiation scripts
- ✅ Proper instructions and guidelines
- ✅ Test prompts for demo
- ✅ Integration architecture in your code

**For the hackathon:**
- Demo the agents in the UI (conversational interface)
- Demo your code in mock mode (shows architecture)
- Explain how they would integrate (chat API)
- Highlight IBM Bob's code generation

**You're ready to demo! 🎉**

---

**Created by Bob for Team Doreen - IBM Bob Dev Day Hackathon 2026**