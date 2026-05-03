# watsonx Orchestrate UI Setup Guide for SubLeech
**Complete Workflow Configuration for Team Doreen - ANTONY's Guide**

---

## Overview

This guide walks you through setting up **Skills** and **Workflows** in the watsonx Orchestrate web UI to enable the SubLeech AI agents for cancellation letters and negotiation scripts.

**Your watsonx Orchestrate Instance:**
- **URL**: https://api.eu-de.watson-orchestrate.cloud.ibm.com/instances/4499fe8d-d4c7-48a2-a9c8-1ed6834423f8
- **Region**: EU-DE (Frankfurt)
- **API Key**: wZSTOeM8f6joljTrzSCuXiEX2haSKVxJYsYJiJ4jxbBx

---

## Part 1: Access watsonx Orchestrate UI

### Step 1: Login to IBM Cloud
1. Go to: https://cloud.ibm.com
2. Login with your IBM Cloud credentials
3. Navigate to **Resource List** → **AI / Machine Learning**
4. Find and click on your **watsonx Orchestrate** instance

### Step 2: Open Orchestrate Dashboard
1. Click **Launch watsonx Orchestrate**
2. You'll be redirected to the Orchestrate UI
3. The URL should look like: `https://dl.watson-orchestrate.ibm.com/...`

---

## Part 2: Create Skills (AI Agents)

Skills are the individual AI capabilities that your agents will use. We need to create 2 skills:

### Skill 1: Cancellation Letter Generator

#### Step 2.1: Navigate to Skills
1. In the left sidebar, click **Skills**
2. Click **Create skill** button (top right)
3. Select **Custom skill** → **Next**

#### Step 2.2: Configure Basic Information
```
Skill Name: CancellationLetterAgent
Display Name: Subscription Cancellation Letter Generator
Description: Generates formal cancellation letters for subscription services with consumer rights language
Category: Document Generation
```

#### Step 2.3: Define Input Parameters
Click **Add input** for each parameter:

**Input 1:**
```
Name: provider_name
Display Name: Provider Name
Type: Text
Required: Yes
Description: Name of the subscription service provider (e.g., Netflix, Spotify)
Example: Netflix
```

**Input 2:**
```
Name: monthly_cost
Display Name: Monthly Cost
Type: Number
Required: Yes
Description: Current monthly subscription cost in USD
Example: 15.99
```

**Input 3:**
```
Name: user_name
Display Name: User Name
Type: Text
Required: Yes
Description: Full name of the account holder
Example: John Doe
```

**Input 4:**
```
Name: account_type
Display Name: Account Type
Type: Choice (Dropdown)
Required: No
Options: personal, business
Default: personal
Description: Type of subscription account
```

**Input 5:**
```
Name: account_number
Display Name: Account Number
Type: Text
Required: No
Description: Optional customer or account ID
Example: CUST-12345
```

**Input 6:**
```
Name: cancellation_reason
Display Name: Cancellation Reason
Type: Text (Multi-line)
Required: No
Description: Optional reason for cancellation
Example: No longer using the service
```

#### Step 2.4: Define Output Parameters
Click **Add output**:

**Output 1:**
```
Name: letter_content
Display Name: Cancellation Letter
Type: Text (Multi-line)
Description: The generated formal cancellation letter
```

**Output 2:**
```
Name: confidence_score
Display Name: Confidence Score
Type: Number
Description: AI confidence in letter quality (0-1)
```

**Output 3:**
```
Name: provider_specific
Display Name: Provider-Specific Language Used
Type: Boolean
Description: Whether provider-specific terms were included
```

#### Step 2.5: Configure AI Model
1. Click **AI Model** tab
2. Select **IBM Granite** as the foundation model
3. Choose model: **granite-13b-chat-v2**
4. Set parameters:
   ```
   Temperature: 0.3
   Max Tokens: 800
   Top P: 0.9
   Frequency Penalty: 0.0
   Presence Penalty: 0.0
   ```

#### Step 2.6: Create the Prompt Template
Click **Prompt** tab and paste this exact prompt:

```
You are a professional consumer rights advocate helping users write formal cancellation letters.

Generate a formal, professional cancellation letter for the following subscription:

Provider: {{provider_name}}
Monthly Cost: ${{monthly_cost}}
Account Type: {{account_type}}
User Name: {{user_name}}
{{#if account_number}}Account Number: {{account_number}}{{/if}}
{{#if cancellation_reason}}Reason: {{cancellation_reason}}{{/if}}

Requirements:
1. Use formal business letter format with proper date and address sections
2. Reference consumer protection rights where applicable (e.g., right to cancel, refund policies)
3. Request immediate cancellation with no further charges
4. Request written confirmation of cancellation
5. Include a 30-day notice period if required by law
6. Be firm but professional in tone
7. Do not include placeholder fields - use the provided information
8. Include a clear subject line
9. End with a professional closing

Generate the complete cancellation letter now:
```

#### Step 2.7: Test the Skill
1. Click **Test** tab
2. Fill in sample values:
   ```
   provider_name: Netflix
   monthly_cost: 15.99
   user_name: John Doe
   account_type: personal
   ```
3. Click **Run test**
4. Verify the output looks like a proper cancellation letter
5. If good, click **Save skill**

---

### Skill 2: Negotiation Script Generator

#### Step 2.8: Create Second Skill
1. Go back to **Skills** → **Create skill**
2. Select **Custom skill** → **Next**

#### Step 2.9: Configure Basic Information
```
Skill Name: NegotiationScriptAgent
Display Name: Subscription Negotiation Script Generator
Description: Generates hardship negotiation scripts for subscription retention with fallback positions
Category: Document Generation
```

#### Step 2.10: Define Input Parameters

**Input 1:**
```
Name: provider_name
Display Name: Provider Name
Type: Text
Required: Yes
Description: Name of the subscription service provider
Example: Netflix
```

**Input 2:**
```
Name: current_monthly_cost
Display Name: Current Monthly Cost
Type: Number
Required: Yes
Description: Current monthly subscription cost
Example: 15.99
```

**Input 3:**
```
Name: original_monthly_cost
Display Name: Original Monthly Cost
Type: Number
Required: Yes
Description: Original monthly cost before price increase
Example: 12.99
```

**Input 4:**
```
Name: subscription_duration_months
Display Name: Subscription Duration (Months)
Type: Number
Required: Yes
Description: How long the user has been subscribed
Example: 24
```

**Input 5:**
```
Name: user_name
Display Name: User Name
Type: Text
Required: Yes
Description: Name of the account holder
Example: John Doe
```

**Input 6:**
```
Name: hardship_type
Display Name: Hardship Type
Type: Choice (Dropdown)
Required: No
Options: financial, reduced_usage, competitor_offer, price_increase, other
Default: price_increase
Description: Type of hardship or reason for negotiation
```

#### Step 2.11: Define Output Parameters

**Output 1:**
```
Name: script_content
Display Name: Negotiation Script
Type: Text (Multi-line)
Description: The generated negotiation script with talking points
```

**Output 2:**
```
Name: confidence_score
Display Name: Confidence Score
Type: Number
Description: AI confidence in script effectiveness (0-1)
```

**Output 3:**
```
Name: fallback_positions
Display Name: Fallback Positions
Type: Text (Multi-line)
Description: Alternative negotiation positions if first request fails
```

#### Step 2.12: Configure AI Model
1. Click **AI Model** tab
2. Select **IBM Granite** → **granite-13b-chat-v2**
3. Set parameters:
   ```
   Temperature: 0.4
   Max Tokens: 1000
   Top P: 0.9
   Frequency Penalty: 0.0
   Presence Penalty: 0.0
   ```

#### Step 2.13: Create the Prompt Template
Click **Prompt** tab:

```
You are a professional customer retention negotiation coach helping users negotiate better subscription terms.

Generate a negotiation script for the following situation:

Provider: {{provider_name}}
Current Monthly Cost: ${{current_monthly_cost}}
Original Monthly Cost: ${{original_monthly_cost}}
Subscription Duration: {{subscription_duration_months}} months
User Name: {{user_name}}
Hardship Type: {{hardship_type}}

Requirements:
1. Open with a hardship framing that emphasizes loyalty and long-term relationship
2. Reference the price increase from ${{original_monthly_cost}} to ${{current_monthly_cost}}
3. Request a loyalty discount or return to original pricing
4. Provide 2-3 fallback positions if the first request is refused:
   - Position 1: Partial discount (e.g., 50% off for 6 months)
   - Position 2: Temporary pause or downgrade option
   - Position 3: Competitor comparison leverage
5. Use empathetic but firm language
6. Include specific talking points for common objections
7. End with a clear ask and timeline for response
8. Format as a conversational script with [YOUR OPENING], [IF THEY SAY X], [FALLBACK 1], etc.

Generate the complete negotiation script now:
```

#### Step 2.14: Test and Save
1. Click **Test** tab
2. Fill in sample values:
   ```
   provider_name: Netflix
   current_monthly_cost: 15.99
   original_monthly_cost: 12.99
   subscription_duration_months: 24
   user_name: John Doe
   hardship_type: price_increase
   ```
3. Click **Run test**
4. Verify the script has opening, fallbacks, and objection handling
5. Click **Save skill**

---

## Part 3: Create Workflows (Orchestration)

Workflows connect your skills together and define the business logic.

### Workflow 1: Subscription Defense Workflow

#### Step 3.1: Create New Workflow
1. In the left sidebar, click **Workflows**
2. Click **Create workflow** button
3. Select **Start from scratch**

#### Step 3.2: Configure Workflow Basics
```
Workflow Name: SubscriptionDefenseWorkflow
Display Name: Subscription Defense Assistant
Description: Analyzes subscription issues and generates appropriate response (cancel or negotiate)
```

#### Step 3.3: Add Input Node
1. Drag **Input** node to canvas
2. Configure inputs:
   ```
   Input 1:
   Name: action_type
   Type: Choice
   Options: cancel, negotiate
   Required: Yes
   Description: Whether to cancel or negotiate
   
   Input 2:
   Name: provider_name
   Type: Text
   Required: Yes
   
   Input 3:
   Name: monthly_cost
   Type: Number
   Required: Yes
   
   Input 4:
   Name: user_name
   Type: Text
   Required: Yes
   
   Input 5:
   Name: account_type
   Type: Text
   Required: No
   Default: personal
   ```

#### Step 3.4: Add Decision Node
1. Drag **Decision** node to canvas
2. Connect Input → Decision
3. Configure decision:
   ```
   Condition: action_type equals "cancel"
   If True: Route to Cancellation Skill
   If False: Route to Negotiation Skill
   ```

#### Step 3.5: Add Cancellation Branch
1. Drag **Skill** node to canvas
2. Select **CancellationLetterAgent** skill
3. Map inputs:
   ```
   provider_name → Input.provider_name
   monthly_cost → Input.monthly_cost
   user_name → Input.user_name
   account_type → Input.account_type
   ```
4. Connect Decision (True) → Cancellation Skill

#### Step 3.6: Add Negotiation Branch
1. Drag another **Skill** node
2. Select **NegotiationScriptAgent** skill
3. Map inputs:
   ```
   provider_name → Input.provider_name
   current_monthly_cost → Input.monthly_cost
   original_monthly_cost → Input.monthly_cost * 0.8 (or add as input)
   subscription_duration_months → 12 (or add as input)
   user_name → Input.user_name
   ```
4. Connect Decision (False) → Negotiation Skill

#### Step 3.7: Add Output Node
1. Drag **Output** node to canvas
2. Connect both skills → Output
3. Configure outputs:
   ```
   Output 1:
   Name: generated_content
   Type: Text
   Value: If cancel branch: CancellationSkill.letter_content
          If negotiate branch: NegotiationSkill.script_content
   
   Output 2:
   Name: confidence_score
   Type: Number
   Value: Skill.confidence_score (from whichever branch executed)
   
   Output 3:
   Name: action_taken
   Type: Text
   Value: Input.action_type
   ```

#### Step 3.8: Test Workflow
1. Click **Test** button
2. Test Case 1 (Cancel):
   ```
   action_type: cancel
   provider_name: Netflix
   monthly_cost: 15.99
   user_name: John Doe
   account_type: personal
   ```
3. Test Case 2 (Negotiate):
   ```
   action_type: negotiate
   provider_name: Netflix
   monthly_cost: 15.99
   user_name: John Doe
   ```
4. Verify both paths work correctly
5. Click **Save workflow**

#### Step 3.9: Publish Workflow
1. Click **Publish** button
2. Select **Production** environment
3. Note the workflow ID (you'll need this for API calls)

---

## Part 4: Get API Credentials for Code Integration

### Step 4.1: Get Skill IDs
1. Go to **Skills** page
2. Click on **CancellationLetterAgent**
3. Copy the **Skill ID** (looks like: `skill-abc123...`)
4. Repeat for **NegotiationScriptAgent**

### Step 4.2: Get Workflow ID
1. Go to **Workflows** page
2. Click on **SubscriptionDefenseWorkflow**
3. Copy the **Workflow ID** (looks like: `workflow-xyz789...`)

### Step 4.3: Update Backend Configuration
Update your `backend/.env` file:

```env
# Add these new lines:
ORCHESTRATE_CANCELLATION_SKILL_ID=skill-abc123...
ORCHESTRATE_NEGOTIATION_SKILL_ID=skill-def456...
ORCHESTRATE_WORKFLOW_ID=workflow-xyz789...
```

---

## Part 5: Test from Code

### Step 5.1: Update orchestrate_client.py
The skill IDs need to be added to the API calls. Update the methods:

```python
async def invoke_cancellation_agent(self, ...):
    skill_id = os.getenv("ORCHESTRATE_CANCELLATION_SKILL_ID")
    # Use skill_id in API call
```

### Step 5.2: Run Live Test
```bash
cd backend
python test_live_orchestrate.py
```

Expected output:
```
[OK] Live watsonx Orchestrate test SUCCESSFUL!
[OK] Generated cancellation letter: 650+ characters
[OK] Confidence score: 0.85+
```

---

## Part 6: Alternative Approach (If Skills UI is Limited)

If the watsonx Orchestrate UI doesn't support custom skills yet, use the **Direct API** approach:

### Option A: Use watsonx.ai Directly
1. Go to https://dataplatform.cloud.ibm.com/wx/home
2. Create a **Prompt Lab** session
3. Save your prompts as **Prompt Templates**
4. Get the template IDs
5. Call watsonx.ai API directly (already implemented in `orchestrator.py`)

### Option B: Use Pre-built Skills
1. In Orchestrate UI, browse **Skill Catalog**
2. Look for **Document Generation** or **Text Generation** skills
3. Customize the prompts within those skills
4. Use those skill IDs in your code

---

## Part 7: Verification Checklist

Before demo, verify:

- [ ] Both skills created and tested in UI
- [ ] Workflow created and published
- [ ] Skill IDs copied to `.env` file
- [ ] Workflow ID copied to `.env` file
- [ ] `test_live_orchestrate.py` runs successfully
- [ ] API returns properly formatted letters/scripts
- [ ] Confidence scores are reasonable (>0.7)
- [ ] Frontend can call `/api/v1/agents/cancel` endpoint
- [ ] Frontend can call `/api/v1/agents/negotiate` endpoint

---

## Troubleshooting

### Issue: "Skill not found"
**Solution**: Verify skill ID is correct and skill is published

### Issue: "Unauthorized"
**Solution**: Regenerate API key in IBM Cloud → watsonx Orchestrate → Credentials

### Issue: "Model not available"
**Solution**: Check your watsonx.ai entitlements, may need to provision Granite model access

### Issue: "Timeout"
**Solution**: Increase timeout in `orchestrate_client.py` (currently 30s)

---

## Quick Reference: API Endpoints

Once configured, your SubLeech backend exposes:

```
POST /api/v1/agents/cancel
Body: {
  "provider_name": "Netflix",
  "monthly_cost": 15.99,
  "user_name": "John Doe",
  "account_type": "personal"
}

POST /api/v1/agents/negotiate
Body: {
  "provider_name": "Netflix",
  "current_monthly_cost": 15.99,
  "original_monthly_cost": 12.99,
  "subscription_duration_months": 24,
  "user_name": "John Doe"
}
```

---

## Summary

You now have:
1. ✅ Two AI skills in watsonx Orchestrate UI
2. ✅ One workflow orchestrating both skills
3. ✅ API credentials configured in backend
4. ✅ Test scripts to verify everything works
5. ✅ REST endpoints for frontend integration

**Next**: Run `python test_live_orchestrate.py` to verify live integration!

---

**Created by Bob for Team Doreen - IBM Bob Dev Day Hackathon 2026**