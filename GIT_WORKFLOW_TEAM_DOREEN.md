# Team Doreen - Git Workflow Guide
**Safe Collaboration Strategy for 4 Team Members**

---

## 👥 Team Structure

| Member | Role | Responsibility | Git Branch |
|--------|------|----------------|------------|
| **ANTONY** | AI Agent Developer | watsonx Orchestrate agents, backend integration | `feature/ai-agents` |
| **DOREEN** | Backend Developer | FastAPI, Pandas pipeline, database | `feature/backend` |
| **GLORIA** | Frontend Developer | React, Carbon UI, dashboard | `feature/frontend` |
| **BLESSING** | DevOps/QA | Docker, OpenShift, testing, CI/CD | `feature/devops` |

---

## 🎯 Git Strategy: Feature Branch Workflow

### Why This Approach?
- ✅ Each person works in their own branch
- ✅ No conflicts with others' work
- ✅ Easy to review changes
- ✅ Safe to merge when ready
- ✅ Can work simultaneously

---

## 📁 Current Project Structure

```
IBMBobHackathon/
├── docs/
│   └── ANTONY_AI_AGENTS/          ← ANTONY's documentation
├── agents/                         ← ANTONY's agent definitions
│   ├── cancellation_agent/
│   └── negotiation_agent/
├── backend/                        ← DOREEN + ANTONY
│   ├── app/
│   │   ├── agents/                ← ANTONY's code
│   │   ├── routers/               ← DOREEN + ANTONY
│   │   ├── services/              ← DOREEN's code
│   │   └── models/                ← DOREEN's code
│   └── tests/                     ← ANTONY + BLESSING
├── frontend/                       ← GLORIA's code
│   └── src/
├── deploy/                         ← BLESSING's code
└── README.md                       ← Team collaboration
```

---

## 🚀 Step-by-Step Git Workflow for ANTONY

### Step 1: Check Current Status
```bash
# See what branch you're on
git branch

# See what files you've changed
git status

# See what changes you've made
git diff
```

### Step 2: Create Your Feature Branch (If Not Already)
```bash
# Make sure you're on main
git checkout main

# Pull latest changes
git pull origin main

# Create your feature branch
git checkout -b feature/ai-agents
```

### Step 3: Stage Your Changes
```bash
# Add specific files (RECOMMENDED)
git add docs/ANTONY_AI_AGENTS/
git add agents/
git add backend/app/agents/
git add backend/app/routers/agents.py
git add backend/tests/test_agents.py
git add backend/test_live_orchestrate.py
git add GIT_WORKFLOW_TEAM_DOREEN.md

# OR add all changes (be careful!)
git add .
```

### Step 4: Commit Your Changes
```bash
# Commit with a descriptive message
git commit -m "feat(ai-agents): Add watsonx Orchestrate integration

- Created Cancellation and Negotiation agents
- Implemented orchestration layer (orchestrator.py)
- Added watsonx Orchestrate API client
- Created comprehensive documentation (12 files)
- Added knowledge bases for agents
- Implemented mock/live mode switching
- Added test suites for agents
- Updated API routers for agent endpoints

Co-authored-by: IBM Bob <bob@ibm.com>"
```

### Step 5: Push to GitHub
```bash
# Push your branch to GitHub
git push origin feature/ai-agents

# If this is your first push, you might need:
git push -u origin feature/ai-agents
```

### Step 6: Create Pull Request on GitHub
1. Go to: https://github.com/doreennjagi/IBMBobHackathon
2. Click **"Compare & pull request"** (should appear automatically)
3. Fill in PR details:
   ```
   Title: AI Agents: watsonx Orchestrate Integration
   
   Description:
   ## What's New
   - ✅ 2 watsonx Orchestrate agents (Cancellation + Negotiation)
   - ✅ Complete backend integration layer
   - ✅ Mock/Live mode orchestration
   - ✅ REST API endpoints for agents
   - ✅ Comprehensive documentation (12 files, 5,500+ lines)
   - ✅ Knowledge bases (850 lines)
   - ✅ Test suites (unit + integration)
   
   ## Files Changed
   - `docs/ANTONY_AI_AGENTS/` - All documentation
   - `agents/` - Agent skill definitions
   - `backend/app/agents/` - Orchestration code
   - `backend/app/routers/agents.py` - API endpoints
   - `backend/tests/test_agents.py` - Tests
   
   ## Testing
   - ✅ Mock mode tested and working
   - ✅ All unit tests passing
   - ✅ Integration tests ready
   
   ## Dependencies
   - Added: httpx, langchain, langchain-ibm, pyyaml
   
   ## Ready for Review
   @doreennjagi @gloria @blessing
   ```
4. Click **"Create pull request"**

---

## 🛡️ Avoiding Conflicts with Team Members

### ANTONY's Safe Zone (Your Files)
```
✅ SAFE TO MODIFY:
docs/ANTONY_AI_AGENTS/          (all files)
agents/                         (all files)
backend/app/agents/             (all files)
backend/app/routers/agents.py   (your endpoints only)
backend/tests/test_agents.py    (your tests)
backend/test_live_orchestrate.py
backend/.env                    (add your config, don't delete others')
backend/requirements.txt        (add your deps, don't delete others')
```

### ⚠️ Shared Files (Coordinate with Team)
```
⚠️ COORDINATE BEFORE MODIFYING:
backend/app/routers/__init__.py     (DOREEN might also edit)
backend/app/main.py                 (DOREEN might also edit)
backend/requirements.txt            (Everyone adds dependencies)
backend/.env                        (Everyone adds config)
README.md                           (Team collaboration)
```

### ❌ Don't Touch (Other Team Members' Files)
```
❌ DON'T MODIFY:
frontend/                       (GLORIA's code)
backend/app/services/           (DOREEN's code - except if coordinated)
backend/app/models/             (DOREEN's code - except if coordinated)
deploy/                         (BLESSING's code)
docker-compose.yml              (BLESSING's code)
```

---

## 🔄 Handling Merge Conflicts

### If You Get a Conflict:

#### Step 1: Pull Latest Changes
```bash
# Switch to main
git checkout main

# Pull latest
git pull origin main

# Switch back to your branch
git checkout feature/ai-agents

# Merge main into your branch
git merge main
```

#### Step 2: If Conflicts Occur
```bash
# Git will tell you which files have conflicts
# Open each file and look for:
<<<<<<< HEAD
Your changes
=======
Their changes
>>>>>>> main

# Decide what to keep, remove the markers, save the file
```

#### Step 3: Resolve and Commit
```bash
# After fixing conflicts
git add <conflicted-files>
git commit -m "fix: Resolve merge conflicts with main"
git push origin feature/ai-agents
```

---

## 📋 Pre-Push Checklist for ANTONY

Before pushing your code, verify:

```bash
# 1. All your files are in the right place
ls docs/ANTONY_AI_AGENTS/        # Should show 12 files
ls agents/                        # Should show 2 agent folders
ls backend/app/agents/            # Should show your Python files

# 2. No sensitive data in commits
cat backend/.env                  # Check for API keys
# Make sure .env is in .gitignore!

# 3. Tests pass
cd backend
python test_live_orchestrate.py  # Should pass in mock mode

# 4. No accidental changes to others' files
git status                        # Review the list carefully

# 5. Commit message is clear
git log -1                        # Check your last commit message
```

---

## 🤝 Team Coordination

### Daily Standup Communication
```
ANTONY: "I'm working on AI agents in feature/ai-agents branch.
         I'll be modifying:
         - backend/app/agents/ (new folder)
         - backend/app/routers/agents.py (new file)
         - Adding dependencies to requirements.txt
         
         DOREEN: Will you be editing routers/__init__.py today?
         If yes, let's coordinate."
```

### Before Modifying Shared Files
```
# In team chat:
ANTONY: "I need to add my agent routes to backend/app/main.py.
         Anyone else working on that file right now?"

# Wait for responses, then proceed
```

### When Ready to Merge
```
# In team chat:
ANTONY: "My AI agents PR is ready for review:
         https://github.com/doreennjagi/IBMBobHackathon/pull/X
         
         Can someone review? It adds:
         - AI agent integration
         - New /api/v1/agents/ endpoints
         - Documentation
         
         No conflicts with main branch."
```

---

## 🎯 Merge Strategy

### Option 1: Merge After Review (Recommended)
```
1. ANTONY creates PR
2. Team reviews (DOREEN, GLORIA, BLESSING)
3. Address any feedback
4. Get approval from at least 1 team member
5. ANTONY or DOREEN merges to main
6. Everyone pulls latest main
```

### Option 2: Merge at End (For Hackathon)
```
1. Everyone works in their feature branches
2. At the end, merge in order:
   - feature/backend (DOREEN) - foundation
   - feature/ai-agents (ANTONY) - depends on backend
   - feature/frontend (GLORIA) - depends on backend
   - feature/devops (BLESSING) - final deployment
```

---

## 🚨 Emergency: "I Messed Up Git!"

### Undo Last Commit (Not Pushed Yet)
```bash
# Keep changes, undo commit
git reset --soft HEAD~1

# Discard changes, undo commit
git reset --hard HEAD~1
```

### Undo Changes to a File
```bash
# Discard changes to a specific file
git checkout -- <filename>

# Discard all changes
git reset --hard HEAD
```

### Start Over from Main
```bash
# Save your work first!
git stash

# Get fresh main
git checkout main
git pull origin main

# Create new branch
git checkout -b feature/ai-agents-v2

# Get your work back
git stash pop
```

### Ask for Help
```
# In team chat:
ANTONY: "Git emergency! I think I broke something.
         Can someone help me with [specific issue]?"

# Or create a backup:
git branch backup-before-fix
# Then try to fix, knowing you have a backup
```

---

## 📊 Git Commands Cheat Sheet

### Daily Commands
```bash
# Check status
git status

# See changes
git diff

# Add files
git add <file>

# Commit
git commit -m "message"

# Push
git push origin feature/ai-agents

# Pull latest
git pull origin main
```

### Branch Commands
```bash
# List branches
git branch

# Create branch
git checkout -b feature/ai-agents

# Switch branch
git checkout main

# Delete branch
git branch -d feature/ai-agents
```

### Viewing History
```bash
# See commits
git log

# See commits (one line each)
git log --oneline

# See what changed in last commit
git show

# See who changed what
git blame <file>
```

---

## ✅ Final Checklist Before Demo

### For ANTONY:
- [ ] All code pushed to `feature/ai-agents` branch
- [ ] PR created and reviewed
- [ ] Merged to `main` (or ready to merge)
- [ ] Documentation in `docs/ANTONY_AI_AGENTS/`
- [ ] Tests passing
- [ ] No merge conflicts
- [ ] `.env` file not committed (only `.env.example`)
- [ ] Team knows what you changed

### For Team:
- [ ] All feature branches created
- [ ] No conflicts between branches
- [ ] Everyone has pulled latest `main`
- [ ] Merge order decided
- [ ] Demo script prepared
- [ ] Backup of working code

---

## 🎉 You're Ready!

**Your Git workflow:**
1. ✅ Work in `feature/ai-agents` branch
2. ✅ Commit often with clear messages
3. ✅ Push to GitHub regularly
4. ✅ Create PR when ready
5. ✅ Coordinate with team on shared files
6. ✅ Merge after review

**Safe collaboration:**
- ✅ Your files are isolated in `docs/ANTONY_AI_AGENTS/` and `backend/app/agents/`
- ✅ Minimal overlap with team members
- ✅ Clear communication prevents conflicts
- ✅ Feature branches keep main stable

**You've got this! 🚀**

---

**Created by Bob for Team Doreen - IBM Bob Dev Day Hackathon 2026**