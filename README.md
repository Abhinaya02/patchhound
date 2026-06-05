# 🐕 PatchHound

**An autonomous multi-agent swarm that detects, reproduces, patches, and validates bugs in Python codebases.**

Built as a submission for the **Meta Scaler Open AI 2026** hackathon — where the theme is *Agent Swarms*.

---

## 🔍 What It Does

PatchHound ingests a Python source file and runs it through a cyclic multi-agent graph that:

1. **Scouts** the code for logical flaws and security vulnerabilities
2. **Architects** a reproducing test case using `unittest`
3. **Engineers** a fix — outputting a complete corrected source file
4. **Validates** the patch inside a deterministic Python sandbox
5. **Explains** the bug and the patch rationale in natural language

If the patch fails validation, the error logs loop back into the graph for a self-correcting retry — up to a configurable iteration limit.

---

## 🧠 Architecture

```text
[Uploaded .py File]
        │
        ▼
┌───────────────────────────────┐
│    SCOUT AGENT                │ ← Detects bugs & vulnerabilities
│  (Static Analysis + Heuristic)│
└──────────────┬────────────────┘
               │ flaws
               ▼
┌───────────────────────────────┐
│  EXPLOIT ARCHITECT            │ ← Writes reproducing unittest
│   (Test Generation)           │
└──────────────┬────────────────┘
               │ test
               ▼
┌───────────────────────────────┐
│    FIX ENGINEER               │ ← Proposes full corrected file
│  (Code Refactoring)           │
└──────────────┬────────────────┘
               │ patch
               ▼
┌───────────────────────────────┐
│    QA VALIDATOR               │ ← Runs patch in isolated sandbox
│  (Deterministic Subprocess)   │◄─── If FAIL, loop back ──┐
└──────────────┬────────────────┘
               │ PASS
               ▼
┌───────────────────────────────┐
│     EXPLAINER                 │ ← Human-readable bug + fix report
│    (Rationale Synthesis)      │
└───────────────────────────────┘
```

The entire swarm state is tracked in a shared `SwarmState` TypedDict, enabling explicit, auditable transitions between each agent node.

---

## 🏗️ Stack

| Layer | Technology |
|-------|----------|
| **LLM Provider** | Google Gemini API / Groq (Llama‑3.1‑70B) |
| **Agent Orchestration** | Custom cyclic graph (LangGraph-style pattern) |
| **Frontend** | React + TypeScript + Vite |
| **Backend** | Python 3.10+ |
| **Sandbox** | Isolated Python `subprocess` runner |
| **Deployment** | Docker-ready |

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- `GEMINIAPIKEY` in environment (for Gemini provider)

### Clone & Run

```bash
# 1. Clone
git clone https://github.com/Abhinaya02/patchhound.git
cd patchhound

# 2. Backend setup
python -m venv .venv
source .venv/bin/activate    # or `.venv\Scripts\activate` on Windows
pip install -r requirements.txt

# 3. Frontend setup
cd frontend
npm install
npm run dev
```

---

## 📋 LLM Providers

PatchHound supports swappable LLM backends. Set the provider in your task config:

| Provider | Config | When to use |
|----------|--------|------------|
| **Gemini** | `provider: "Gemini"` | Primary — structured outputs, large context |
| **Groq** | `provider: "Groq"` | Fallback — ultra-fast inference |
| **LocalSimulation** | `provider: "LocalSimulation"` | Offline / demo mode |

---

## 📦 Repository Structure

```
patchhound/
├── swarm_runner.py        # Main multi-agent orchestration loop
├── statetransitions.py    # Stateless state machine for swarm transitions
├── apaconfig.py           # Provider routing, retry policies, defaults
├── synthesisconfig.py     # System prompts for all agent roles
├── types.ts               # Shared TypeScript types for SwarmState
├── frontend/              # React + Vite UI (dashboard, logs, diffs)
├── sandbox/               # Isolated test execution environments
├── benchmark/             # Sample buggy Python scripts for demo
└── README.md
```

---

## 🎯 Hackathon Alignment

This project directly addresses the **Meta Scaler Open AI 2026** challenge:

- **AI Integration & Intelligence** — Self-correcting multi-agent loop with explicit state management
- **System Architecture** — Deterministic sandbox validation with non-LLM subprocess layer
- **Prototype Readiness** — Docker-ready, deployable demo with Streamlit/React dashboard
- **Communication & Design** — Real-time agent log streaming with visual state transitions

---

## 🛠️ Built by

**[@Abhinaya02](https://github.com/Abhinaya02)** — Applied AI Engineer | Python Automation | GenAI

---

*Open for collaboration — PRs and issues welcome!*
