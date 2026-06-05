# 🛡️ Project Patchhound Swarm

**Multi-Agent Vulnerability Auditing & Automated Patch Engineering Swarm**

Project Patchhound Swarm is a state-of-the-art multi-agent framework designed to automate the cycle of security auditing, vulnerability verification, and surgical patch generation. By orchestrating cooperative **Scout**, **Exploit**, and **Fix** agents in an isolated execution sandbox, Patchhound performs high-fidelity static analysis and patch verification on uploaded source files.

---

## 🌌 Overview & Design Philosophy

Patchhound Swarm operates under a modern, high-contrast visual dashboard engineered with desktop-first precision, generous negative space, and deep cosmic accents. It avoids unrequested clutter and presents critical actions logically:
* **Upload Buggy Target Code**: Immediate sandbox enclave preparation.
* **Auto-Scroll Guidance**: Once a buggy target file is loaded, the dashboard smoothly focuses down to the **Autonomous Swarm Trigger Core**, bypassing unnecessary vertical navigation.
* **Autonomous Launch**: Instantly scrolls focus into the **Live Log Console/Terminal View** upon triggering, ensuring real-time operational feedback is clear and immediate.
* **Interactive Node Graphs**: Live visualization of the Scout, Exploit, and Fix state machines in real-time.

---

## 🛠️ Core Multi-Agent Architecture

The swarming process consists of three specialized, cooperative LLM-powered nodes communicating over real-time Server-Sent Events (SSE):

```
       [ Upload Buggy File ]
                 │
                 ▼
          ┌─────────────┐
          │ Scout Agent │ ◄─── STATIC AUDITING / PITFALL ANALYSIS
          └──────┬──────┘
                 │ (Isolates Vulnerabilities)
                 ▼
         ┌───────────────┐
         │ Exploit Agent │ ◄─── TEST VECTOR SYNTHESIS & ATTACK REPRODUCTION
         └───────┬───────┘
                 │ (Verifies Exploitability)
                 ▼
           ┌───────────┐
           │ Fix Agent │ ◄─── SURGICAL PATCH GENERATION & DIFF ANALYSIS
           └─────┬─────┘
                 │
                 ▼
        [ Verification & Merge ]
```

### 1. Scouting Agent Node (`Scout`)
* Analyzes the uploaded source code (`.py`, JSON logs, telemetry helpers) for memory leaks, execution overflows, command injections, or business logic flaws.
* Produces detailed threat matrix schemas specifying line ranges and risk vectors.

### 2. Exploitation Agent Node (`Exploit`)
* Synthesizes automated Python test cases (`exploit_vector.py`) targeting isolated vulnerabilities.
* Validates vulnerabilities by replicating conditions inside local virtual workspaces/sandboxes.

### 3. Fixing Agent Node (`Fix`)
* Generates surgical, minimally-invasive patches based on verified exploit feedback.
* Compiles unified code diffs to present side-by-side original/patched code views inside an editor.

---

## ⚙️ Core Configuration & Security Directives

To maintain production compliance, the application is locked down by strict, hardened architectural rules:

1. **Flexible Configuration & Non-Hardcoded Rules**
   * Operational settings, retry thresholds, and model parameters are read dynamically. We never hardcode retry limits or service-level response times inside functional blocks.
2. **Swappable LLM Infrastructure**
   * Supporting primary **Gemini API** integration (`gemini-2.5-flash` or `gemini-2.5-pro` model choices) as well as selectable endpoints like **Groq API** (`llama-3.3-70b-versatile`). Switching providers requires zero hardcoded top-level SDK re-implementations.
3. **Structured State Transitions**
   * Swarm states, logs, and phase updates are managed rigorously by an authorized state machine (`statetransitions.py`), enforcing consistent stage verification.
4. **Network & Host Isolation**
   * When enabled, **Network Isolation** forces sandbox processes to execute under `NetworkDisabled` Windows Sandbox (WSB) equivalent network-isolated rules inside our runtime container, guaranteeing no inbound/outbound telemetry flows during audit phases.

---

## 💻 Tech Stack & Dependencies

The system is split into a robust react-based single-page dashboard and an express-based backend proxying live Python scripts or fallback high-fidelity simulations:

### Frontend
- **React (v19) & Vite (v6)**: Fast, modern UI core.
- **Tailwind CSS (v4)**: Modern style system utilizing CSS `@theme` vars & utilities.
- **Framer Motion**: Smooth interactive visual state changes.
- **Lucide React**: Clean vector indicator icons.
- **Diff Comparison Engine (`diff`/`react-diff-viewer`)**: Side-by-side patch output inspection.

### Backend
- **Express.js (v4) / Node.js**: Handles SSE streaming, file workspace preparation, and subprocess spawning.
- **Python Subprocess (`swarm_runner.py`)**: Runs Python-based security auditing chains using Google GenAI SDKs. Includes:
  - `apaconfig.py` (API and framework configs)
  - `synthesisconfig.py` (synthesis options and local cached data)
  - `statetransitions.py` (state transitions validator)

---

## 🚀 Getting Started

### Prerequisites
Make sure you have Node.js (v18+) and Python 3.x installed.

### Setup Environment variables
Create a `.env` file (refer to `.env.example` in the workspace root):
```env
# Secure Gemini Access Vector
GEMINI_API_KEY=your_gemini_api_key_here

# Groq Access Vector (Optional)
GROQ_API_KEY=your_groq_api_key_here
```

### Installation
1. Install dependencies:
   ```bash
   npm install
   ```

### Running Development Environment
Start both the Express back-end proxy server and the Vite development asset compiler on port `3000`:
```bash
npm run dev
```

### Making Production Builds
To transpile and bundle the client SPA and compile the Express TypeScript entry-point with raw esbuild bundle routing:
```bash
npm run build
```
Launch compiled server:
```bash
npm run start
```

---

## 🧪 Testing Patchhound
1. Launch the application Dashboard.
2. Under **Workspace Enclave Target**, upload or type/paste code containing vulnerabilities (e.g., custom Python snippets with unsafe `eval`, SQL execution, or socket listeners).
3. Confirm the screen **automatically scrolls** down directly to the **Autonomous Swarm Launcher**.
4. Configure provider settings and click **Trigger Autonomous Swarm Engine**.
5. Watch the dashboard **smoothly scroll into view** of the live console terminal to inspect the real-time agent execution pipeline!
