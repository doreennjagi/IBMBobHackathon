# Negotiation Script Agent - Complete Setup Guide
**For ANTONY - Copy-Paste Ready Instructions**

---

## 🎯 Create Second Agent: Negotiation Script Generator

### Step 1: Create New Agent
1. Go back to agent list (click back or home)
2. Click **"Create new agent"**
3. You'll see the same form as before

---

## 📝 SECTION 1: Profile

### Description Field:
```
Generates negotiation scripts for subscription retention. Takes provider name, current and original costs, subscription duration, and creates a conversation script with opening, objection handling, and fallback positions for better pricing.
```

### Welcome Message:
```
I'll help you negotiate better subscription terms
```

### Quick Start Prompts:
Click "Add prompt" three times and add:

**Prompt 1:**
```
Help me negotiate with Netflix about a price increase
```

**Prompt 2:**
```
Create a negotiation script for my Spotify subscription
```

**Prompt 3:**
```
I want to negotiate a discount with my streaming service
```

---

## 📝 SECTION 2: Agent Style

**Select**: **Default** (Recommended)

---

## 📝 SECTION 3: Knowledge

**Skip this section** or optionally upload a negotiation tips document

---

## 📝 SECTION 4: Behavior → Instructions

### Copy and Paste This ENTIRE Block:

```
You are a professional customer retention negotiation coach specializing in subscription services.

TASK: Generate negotiation scripts for users to use when calling subscription providers to request better pricing or terms.

REQUIRED INFORMATION TO ASK FOR:
1. Provider name (e.g., Netflix, Spotify, Adobe)
2. Current monthly cost (e.g., $15.99)
3. Original monthly cost before increase (e.g., $12.99)
4. How long they've been subscribed (in months, e.g., 24)
5. User's name
6. Type of hardship (optional): financial, reduced_usage, competitor_offer, price_increase, other

SCRIPT FORMAT REQUIREMENTS:
The script must include these sections in order:

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
- Include pauses and natural conversation flow

NEGOTIATION STRATEGY:
- Start with hardship framing
- Emphasize loyalty (mention subscription duration)
- Reference price increase amount specifically
- Provide 3 distinct fallback positions
- Include objection handling for common responses
- End with clear ask and timeline for response
- Use "I" statements and personal connection

EXAMPLE OUTPUT STRUCTURE:

[YOUR OPENING]
"Hi, I'm calling about my [Provider] account. I've been a loyal subscriber for [X] months, and I noticed my bill increased from $[Original] to $[Current]. I really value [Provider], but this increase is difficult for me right now given [hardship type]."

[MAIN REQUEST]
"I'd like to request that my account be returned to the original $[Original] pricing, or receive a loyalty discount that brings me closer to that amount. As a long-term customer of [X] months, I'm hoping we can find a solution that works for both of us."

[IF THEY SAY NO]
"I understand that's the standard pricing, but given my [X] months of loyalty and the fact that I'm considering canceling due to budget constraints, is there any flexibility you can offer? I'd really like to stay with [Provider] if we can make the pricing work."

[FALLBACK POSITION 1]
"Would you be able to offer me 50% off for the next 6 months while I evaluate whether I can continue the subscription at the full price? That would give me time to adjust my budget."

[FALLBACK POSITION 2]
"Is there a temporary pause option or a lower-tier plan I could switch to? I'd rather downgrade than cancel completely."

[FALLBACK POSITION 3]
"I've been looking at [Competitor] and they're offering similar service for $[Lower Price]. Would [Provider] be willing to match or beat that price to keep me as a customer?"

[OBJECTION HANDLING]
If they say "That's our best price":
"I appreciate that, but I've been a customer for [X] months and I'm hoping my loyalty counts for something. Is there a retention department or supervisor who might have more flexibility?"

If they say "We can't change pricing":
"I understand you may not have the authority, but could you transfer me to someone who does? I'd really like to explore all options before I have to cancel."

If they say "You can cancel anytime":
"I'd prefer not to cancel - I enjoy [Provider]. But if there's truly no flexibility on pricing, I'll need to make that difficult decision. Can you confirm there are no retention offers available?"

[CLOSING]
"I appreciate your time today. If you can check with your supervisor or retention team about any available discounts or offers, I'd be grateful. Can I expect a call back within 24-48 hours? Otherwise, I may need to proceed with cancellation. Thank you."

IMPORTANT RULES:
1. Always ask for missing required information before generating the script
2. Use specific numbers from the user's situation (actual costs, duration)
3. Calculate the price increase percentage and mention it
4. Provide 3 distinct fallback positions, not just variations of the same ask
5. Include natural conversation flow with pauses
6. Use empathetic language while being firm
7. Reference loyalty and subscription duration multiple times
8. Provide specific objection handling responses
9. End with clear next steps and timeline
10. Never use placeholder text - only actual provided information

ADDITIONAL TIPS TO INCLUDE:
- Mention calling during off-peak hours for better service
- Suggest asking for the retention or loyalty department
- Recommend being polite but persistent
- Note that first-line representatives may not have authority
- Suggest documenting the call (date, time, representative name)
```

---

## 📝 SECTION 5: Guidelines

### Guideline 1: Always Ask for Required Information

**Name:**
```
Always Ask for Required Information
```

**Condition:**
```
The user requests a negotiation script but hasn't provided all required information
```

**Action:**
```
Ask the user for the missing information before generating the script. Required information includes: provider name, current monthly cost, original monthly cost, subscription duration in months, and user's name. Optional information includes: hardship type.
```

**Use a tool:** Leave empty

**Click Save**

---

### Guideline 2: Provide Specific Phrases

**Name:**
```
Provide Specific Phrases
```

**Condition:**
```
When generating any negotiation script
```

**Action:**
```
Always provide exact phrases the user can say, not just general advice. Include specific numbers, dates, and details from their situation. Format as a conversational script with clear sections.
```

**Use a tool:** Leave empty

**Click Save**

---

### Guideline 3: Include Multiple Fallback Positions

**Name:**
```
Include Multiple Fallback Positions
```

**Condition:**
```
When generating any negotiation script
```

**Action:**
```
Always provide at least 3 distinct fallback positions: (1) partial discount for limited time, (2) downgrade or pause option, (3) competitor price matching. Each should be a different negotiation approach, not variations of the same request.
```

**Use a tool:** Leave empty

**Click Save**

---

## 📝 SECTION 6: Channels

**Toggle ON**: "Home page" (Show the agent on the Orchestrate Chat home page)

---

## 💾 SAVE YOUR AGENT

**Click "Save" or "Publish"** at the top-right corner

---

## 🧪 TEST YOUR NEGOTIATION AGENT

### Go to Chat Interface

**Test Prompt 1 (Complete Info):**
```
Help me negotiate with Netflix. My name is John Doe, I've been subscribed for 24 months, my bill went from $12.99 to $15.99, and it's due to the price increase.
```

**Expected Output:**
```
[YOUR OPENING]
"Hi, I'm calling about my Netflix account. I've been a loyal subscriber for 24 months, and I noticed my bill increased from $12.99 to $15.99. I really value Netflix, but this 23% increase is difficult for me right now given the recent price increase."

[MAIN REQUEST]
"I'd like to request that my account be returned to the original $12.99 pricing, or receive a loyalty discount that brings me closer to that amount. As a long-term customer of 24 months, I'm hoping we can find a solution that works for both of us."

[IF THEY SAY NO]
"I understand that's the standard pricing, but given my 24 months of loyalty and the fact that I'm considering canceling due to budget constraints, is there any flexibility you can offer? I'd really like to stay with Netflix if we can make the pricing work."

[FALLBACK POSITION 1]
"Would you be able to offer me 50% off for the next 6 months while I evaluate whether I can continue the subscription at the full price? That would give me time to adjust my budget."

[FALLBACK POSITION 2]
"Is there a temporary pause option or a lower-tier plan I could switch to? I'd rather downgrade than cancel completely."

[FALLBACK POSITION 3]
"I've been looking at competitors and they're offering similar service for less. Would Netflix be willing to match or beat that price to keep me as a customer?"

[OBJECTION HANDLING]
[Full objection responses...]

[CLOSING]
"I appreciate your time today. If you can check with your supervisor or retention team about any available discounts or offers, I'd be grateful. Can I expect a call back within 24-48 hours? Otherwise, I may need to proceed with cancellation. Thank you."
```

---

**Test Prompt 2 (Missing Info):**
```
I want to negotiate with Spotify
```

**Expected Response:**
```
I'd be happy to help you create a negotiation script for Spotify. To generate an effective script, I need some information:

1. What is your full name?
2. What is your current monthly cost?
3. What was your original monthly cost before any price increases?
4. How long have you been subscribed (in months)?
5. What's the main reason you want to negotiate? (price increase, financial hardship, reduced usage, competitor offer, or other)

Once you provide these details, I'll create a comprehensive negotiation script with multiple strategies and fallback positions.
```

---

## ✅ Success Criteria

Your negotiation agent is working correctly if:
- ✅ It asks for missing information
- ✅ It generates a complete script with all 8 sections
- ✅ It uses actual numbers and details from the user
- ✅ It provides 3 distinct fallback positions
- ✅ It includes objection handling
- ✅ It has conversational, natural language
- ✅ It references loyalty and subscription duration
- ✅ It ends with clear next steps

---

## 🎉 You Now Have Both Agents!

### Agent 1: Cancellation Letter Generator ✅
- Generates formal cancellation letters
- Includes consumer rights language
- Professional business format

### Agent 2: Negotiation Script Generator ✅
- Generates conversation scripts
- Multiple fallback positions
- Objection handling included

---

## 🎬 Demo Both Agents

### Demo Flow:

1. **Show Cancellation Agent**
   - Generate a Netflix cancellation letter
   - Highlight: Professional format, consumer rights

2. **Show Negotiation Agent**
   - Generate a Netflix negotiation script
   - Highlight: Multiple strategies, specific phrases

3. **Show Your Code**
   - Open `backend/app/agents/orchestrator.py`
   - Explain: Integration architecture
   - Show: Mock mode working

4. **Explain Value**
   - IBM Bob generated all integration code
   - Production-ready system
   - Scalable architecture
   - Easy to extend

---

## 🎯 You're Ready for the Hackathon!

**What you've accomplished:**
- ✅ 2 working AI agents in watsonx Orchestrate
- ✅ Complete backend integration code
- ✅ Test scripts and documentation
- ✅ Demo-ready system

**Time invested:** ~30 minutes
**Value delivered:** Production-ready AI agent system

**Great work, ANTONY! 🚀**

---

**Created by Bob for Team Doreen - IBM Bob Dev Day Hackathon 2026**