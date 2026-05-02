# watsonx Orchestrate - LIVE Step-by-Step Walkthrough
**For ANTONY - You're in the UI, let's build the agents NOW!**

---

## Current Status: ✅ You're in watsonx Orchestrate UI

You see:
- "AskOrchestrate" at the top
- Chat interface
- Sidebar with options

**Let's create your SubLeech AI agents!**

---

## STEP 1: Navigate to Agent Builder

### What to Click:
1. Look at the **left sidebar**
2. Find and click **"Create new agent"** or **"Manage agents"**
3. If you see "Agent builder" or "Skills" - click that

### Alternative Navigation:
- Look for a **hamburger menu** (☰) in top-left
- Click it to expand full menu
- Look for: **"Skills"**, **"Agents"**, or **"Builder"**

### What You Should See Next:
- A page with options to create custom skills/agents
- Possibly a "Create" or "New" button
- A list of existing agents (might be empty)

---

## STEP 2: Create Your First Agent - Cancellation Letter Generator

### Click: "Create new agent" or "New skill" or "+" button

### Fill in Basic Information:

```
Agent/Skill Name: CancellationLetterAgent

Display Name: Subscription Cancellation Letter Generator

Description: 
Generates formal cancellation letters for subscription services 
with consumer rights language and professional formatting

Category: Document Generation (or Text Generation)
```

### Click: "Next" or "Continue"

---

## STEP 3: Define Input Parameters

You should see a form to add inputs. Click **"Add input"** or **"Add parameter"** for each:

### Input 1:
```
Name: provider_name
Label: Provider Name
Type: Text / String
Required: ✓ Yes
Description: Name of the subscription service (e.g., Netflix, Spotify)
Example value: Netflix
```

### Input 2:
```
Name: monthly_cost
Label: Monthly Cost
Type: Number / Decimal
Required: ✓ Yes
Description: Current monthly subscription cost in USD
Example value: 15.99
```

### Input 3:
```
Name: user_name
Label: User Name
Type: Text / String
Required: ✓ Yes
Description: Full name of the account holder
Example value: John Doe
```

### Input 4:
```
Name: account_type
Label: Account Type
Type: Choice / Dropdown / Select
Required: ☐ No
Options: 
  - personal
  - business
Default: personal
Description: Type of subscription account
```

### Input 5 (Optional):
```
Name: account_number
Label: Account Number
Type: Text / String
Required: ☐ No
Description: Customer or account ID (if available)
Example value: CUST-12345
```

### Click: "Next" or "Continue"

---

## STEP 4: Define Output Parameters

Click **"Add output"** for each:

### Output 1:
```
Name: letter_content
Label: Cancellation Letter
Type: Text / String (Multi-line)
Description: The generated formal cancellation letter
```

### Output 2:
```
Name: confidence_score
Label: Confidence Score
Type: Number / Decimal
Description: AI confidence in letter quality (0 to 1)
```

### Click: "Next" or "Continue"

---

## STEP 5: Configure AI Model

Look for **"Model"** or **"AI Configuration"** section:

### Select Model:
```
Foundation Model: IBM Granite
Specific Model: granite-13b-chat-v2
(or the latest Granite chat model available)
```

### Set Parameters:
```
Temperature: 0.3
(Lower = more consistent, formal)

Max Tokens: 800
(Length of response)

Top P: 0.9
(Nucleus sampling)

Frequency Penalty: 0.0
Presence Penalty: 0.0
```

### Click: "Next" or "Continue"

---

## STEP 6: Write the Prompt

Look for **"Prompt"** or **"Instructions"** section.

### Copy and paste this EXACT prompt:

```
You are a professional consumer rights advocate helping users write formal cancellation letters.

Generate a formal, professional cancellation letter for the following subscription:

Provider: {{provider_name}}
Monthly Cost: ${{monthly_cost}}
Account Type: {{account_type}}
User Name: {{user_name}}
{{#if account_number}}Account Number: {{account_number}}{{/if}}

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

### Important Notes:
- The `{{variable_name}}` syntax is for variable substitution
- The `{{#if}}...{{/if}}` is for conditional content
- Keep the exact formatting

### Click: "Next" or "Continue"

---

## STEP 7: Test Your Agent

You should see a **"Test"** or **"Try it"** section.

### Fill in test values:
```
provider_name: Netflix
monthly_cost: 15.99
user_name: John Doe
account_type: personal
account_number: (leave empty or put "CUST-12345")
```

### Click: "Run" or "Test" or "Generate"

### Expected Output:
You should see a formal letter that looks like:

```
[Date]

Netflix Customer Service
[Address]

Subject: Cancellation of Subscription - Account [Name]

Dear Netflix Customer Service Team,

I am writing to formally request the immediate cancellation of my Netflix subscription...

[Professional letter content with consumer rights language]

Sincerely,
John Doe
```

### If it looks good:
- ✅ Click **"Save"** or **"Publish"**
- ✅ Note the **Skill ID** (looks like: `skill-abc123...`)
- ✅ Copy this ID - you'll need it later!

---

## STEP 8: Create Second Agent - Negotiation Script Generator

### Go back to agent/skill list
Click **"Create new agent"** again

### Fill in Basic Information:
```
Agent/Skill Name: NegotiationScriptAgent

Display Name: Subscription Negotiation Script Generator

Description: 
Generates hardship negotiation scripts for subscription retention 
with fallback positions and objection handling

Category: Document Generation
```

### Click: "Next"

---

## STEP 9: Define Negotiation Agent Inputs

### Input 1:
```
Name: provider_name
Label: Provider Name
Type: Text
Required: ✓ Yes
Example: Netflix
```

### Input 2:
```
Name: current_monthly_cost
Label: Current Monthly Cost
Type: Number
Required: ✓ Yes
Example: 15.99
```

### Input 3:
```
Name: original_monthly_cost
Label: Original Monthly Cost
Type: Number
Required: ✓ Yes
Example: 12.99
```

### Input 4:
```
Name: subscription_duration_months
Label: Subscription Duration (Months)
Type: Number / Integer
Required: ✓ Yes
Example: 24
```

### Input 5:
```
Name: user_name
Label: User Name
Type: Text
Required: ✓ Yes
Example: John Doe
```

### Input 6 (Optional):
```
Name: hardship_type
Label: Hardship Type
Type: Choice / Dropdown
Required: ☐ No
Options:
  - financial
  - reduced_usage
  - competitor_offer
  - price_increase
  - other
Default: price_increase
```

### Click: "Next"

---

## STEP 10: Define Negotiation Agent Outputs

### Output 1:
```
Name: script_content
Label: Negotiation Script
Type: Text (Multi-line)
Description: The generated negotiation script with talking points
```

### Output 2:
```
Name: confidence_score
Label: Confidence Score
Type: Number
Description: AI confidence in script effectiveness
```

### Output 3:
```
Name: fallback_positions
Label: Fallback Positions
Type: Text (Multi-line)
Description: Alternative negotiation positions
```

### Click: "Next"

---

## STEP 11: Configure Negotiation Agent Model

```
Foundation Model: IBM Granite
Model: granite-13b-chat-v2

Temperature: 0.4
(Slightly higher for more creative negotiation strategies)

Max Tokens: 1000
Top P: 0.9
Frequency Penalty: 0.0
Presence Penalty: 0.0
```

### Click: "Next"

---

## STEP 12: Write Negotiation Prompt

### Copy and paste this EXACT prompt:

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
8. Format as a conversational script with sections like:
   [YOUR OPENING]
   [IF THEY SAY NO]
   [FALLBACK POSITION 1]
   [FALLBACK POSITION 2]
   [CLOSING]

Generate the complete negotiation script now:
```

### Click: "Next"

---

## STEP 13: Test Negotiation Agent

### Test values:
```
provider_name: Netflix
current_monthly_cost: 15.99
original_monthly_cost: 12.99
subscription_duration_months: 24
user_name: John Doe
hardship_type: price_increase
```

### Click: "Run Test"

### Expected Output:
```
[YOUR OPENING]
Hi, I'm calling about my Netflix account. I've been a loyal subscriber 
for 24 months, and I noticed my bill increased from $12.99 to $15.99...

[IF THEY SAY NO]
I understand, but I'm on a tight budget right now...

[FALLBACK POSITION 1]
Would you be able to offer me 50% off for the next 6 months?...

[FALLBACK POSITION 2]
Is there a pause option or a lower-tier plan I could switch to?...

[CLOSING]
I really value Netflix, but I need to make this work financially...
```

### If it looks good:
- ✅ Click **"Save"** or **"Publish"**
- ✅ Note the **Skill ID** for this agent too!

---

## STEP 14: Get Your Skill IDs

### For each agent you created:
1. Click on the agent name in the list
2. Look for **"Skill ID"** or **"Agent ID"** in the details
3. It looks like: `skill-abc123def456...`
4. Copy both IDs

### You should have:
```
CancellationLetterAgent ID: skill-[copy this]
NegotiationScriptAgent ID: skill-[copy this]
```

---

## STEP 15: Update Your Backend Code

### Open your `.env` file in the backend folder

### Add these lines (replace with your actual IDs):
```env
# watsonx Orchestrate Skill IDs
ORCHESTRATE_CANCELLATION_SKILL_ID=skill-abc123...
ORCHESTRATE_NEGOTIATION_SKILL_ID=skill-def456...

# Switch to live mode
AGENT_MODE=live
```

### Save the file

---

## STEP 16: Test Live Integration

### Open terminal in backend folder:
```bash
cd backend
python test_live_orchestrate.py
```

### Expected Output:
```
[OK] Live watsonx Orchestrate test SUCCESSFUL!
[OK] Generated cancellation letter: 650+ characters
[OK] Confidence: 0.85+
[OK] Provider: Netflix
[OK] Model: granite-13b-chat-v2
[OK] API latency: 2-3 seconds
```

### If you see errors:
- Check skill IDs are correct
- Check API key is valid
- Check internet connection
- Try mock mode first: `AGENT_MODE=mock`

---

## STEP 17: You're Done! 🎉

### What You've Accomplished:
✅ Created 2 AI agents in watsonx Orchestrate UI
✅ Configured IBM Granite LLM with proper parameters
✅ Written production-quality prompts
✅ Tested agents in the UI
✅ Integrated agents with your SubLeech backend
✅ Verified live API calls work

### For the Demo:
1. Show the watsonx Orchestrate UI with your agents
2. Run `python test_live_orchestrate.py` to show live responses
3. Explain the prompt engineering approach
4. Show the confidence scores from IBM Granite
5. Highlight IBM Bob generated all the integration code

---

## Quick Troubleshooting

### Can't find "Create agent" button?
- Try clicking the hamburger menu (☰)
- Look for "Skills", "Agents", or "Builder"
- Check if you have the right permissions

### Prompt not working?
- Make sure you used `{{variable_name}}` syntax
- Check all variable names match your inputs exactly
- Try removing the `{{#if}}` conditionals first, add them later

### Test fails?
- Check all required inputs are filled
- Try simpler test values first
- Look at error messages for clues

### Can't find Skill ID?
- Click on the agent name
- Look in "Settings" or "Details" tab
- It might be called "Agent ID" or "Skill ID"

---

## Alternative: If UI Doesn't Support Custom Agents

### Use the Chat Interface Instead:
1. In the chat, type: "Generate a cancellation letter for Netflix subscription"
2. See what it produces
3. Explain to judges: "This shows watsonx Orchestrate's capabilities"
4. Then show your code that would integrate with custom agents

### Or Use Mock Mode:
1. Keep `AGENT_MODE=mock` in `.env`
2. Show the skill.yaml files as your "agent definitions"
3. Run tests in mock mode
4. Explain: "This demonstrates the architecture, production would use live API"

---

## Summary

**You now have:**
- ✅ 2 working AI agents in watsonx Orchestrate
- ✅ Live integration with your SubLeech backend
- ✅ Production-ready prompt engineering
- ✅ Test scripts that verify everything works
- ✅ A complete demo-ready system

**Next**: Practice your demo walkthrough!

---

**Created by Bob for Team Doreen - IBM Bob Dev Day Hackathon 2026**