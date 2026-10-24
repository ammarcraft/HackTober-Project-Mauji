# AIFlow — Custom AI Workflow Canvas (Mini n8n)

A lightweight, developer-focused, visually appealing AI workflow automation platform inspired by n8n. Users can build arbitrarily complex multi-stage AI workflows by visually connecting customizable AI execution nodes on an infinite canvas.

---

## 🌟 Core Product Principle

> **"The platform defines how nodes execute. The user defines what the AI does."**

Every node acts as a universal, configurable AI execution unit:
$$\text{Custom Prompt} + \text{Input Data} + \text{Output Schema} + \text{Row Count} \longrightarrow \text{AI-Generated Output}$$

Users are never restricted to predefined tasks (summarization, extraction, etc.). Instead, users have complete freedom to write natural language instructions from scratch, define custom JSON schemas, configure row counts, and wire outputs into downstream nodes via dynamic variables.

---

## 🚀 Key Features

### 1. Modern Dark Canvas Editor
- **Interactive Workspace**: Built with React Flow (`@xyflow/react`), featuring smooth pan, zoom, minimap, controls, and dark developer-tool aesthetic.
- **Visual Node States**: Real-time glow animations for `running`, checkmark and duration badges for `success`, alerts for `failed`, and subtle outlines for `idle` / `skipped`.
- **Top Bar Controls**: Inline workflow renaming, save status, Run Workflow button, Test Selected Node button, Template selector, JSON Import & Export, API Settings, and Execution History.
- **Draggable Node Library**: Drag and drop Universal AI Nodes, Workflow Input Nodes, and Output Inspector Nodes directly onto the canvas.

### 2. Universal Custom AI Node
- **Node Identity**: Custom label, description, model selector (**DeepSeek V4 Flash**, Llama-3-70B, Mixtral-8x7B), and enabled/disabled toggle.
- **DeepSeek V4 Flash Optimized**: Direct support for Jarvis Labs Token Factory endpoint (`https://models.jarvislabs.net/v1`), 1M context window, up to 16,384 tokens output, and configurable **Reasoning Effort** (`High`, `Low`, `Max`, `Off`).
- **Chain-of-Thought Inspection**: Dedicated reasoning stream and tab to inspect DeepSeek V4 Flash `<think>...</think>` traces before the structured JSON or text deliverable.
- **Completely Customizable Multiline Prompt Editor**: Large, comfortable monospace editor with line count, character count, and example formatting.
- **Two Prompt Fields**:
  - **System Instructions**: Defines persistent rules, role, and brand tone.
  - **User Task Prompt**: Defines the exact operational task to perform.
- **Dynamic Variables**:
  - Reference workflow inputs: `{{input.topic}}` or `{{input.brand}}`
  - Reference connected upstream node outputs: `{{nodes.node_1.output.rows}}` or `{{nodes.product_ideator.output.rows}}`
  - Direct upstream shorthand: `{{upstream.output.rows}}`
  - Interactive **Variable Picker** with 1-click cursor insertion.
- **Live Input Data & Prompt Preview**: Preview the interpolated prompt with real or sample data before running the node.

### 3. Custom JSON Output Configuration
- **Three Output Modes**:
  1. **Auto**: Free-form response; backend automatically parses JSON if present.
  2. **Structured JSON**: Enforces a strict JSON Schema validated on the backend via `jsonschema`.
  3. **Raw Text**: Returns plain text without enforcing JSON formatting.
- **Dual Schema Editors**:
  - **Visual Schema Builder**: Add fields, configure types (`string`, `number`, `integer`, `boolean`, `array`, `object`), toggle `required`, and add field descriptions.
  - **Raw JSON Schema Editor**: Syntax-checked JSON code editor with copy and bidirectional sync.
- **Bounded Repair**: Automatically retries invalid JSON responses with targeted schema correction prompts.

### 4. Custom Output Row Count
- **Single Output**: One result (text, object, or array).
- **Multiple Rows (1–50 Records)**:
  - Generates collection of distinct structured records.
  - Independent record validation against schema.
  - Duplicate detection when **Enforce Uniqueness** is toggled.
  - Tracks requested, generated, valid, and failed row counts.

### 5. Execution Engine & Results Inspector
- **Topological DAG Ordering**: Detects cycles and executes independent nodes concurrently via `asyncio.gather`.
- **Live SSE Event Streaming**: Real-time Server-Sent Events stream node states and execution logs to the UI.
- **Results Inspector**:
  - **Interactive Table View**: Auto column detection, search filter, column sorting, and pagination.
  - **Raw JSON View**: Formatted JSON tree with 1-click copy.
  - **Plain Text View**: Monospace text reader.
  - **Exporting**: One-click export to CSV and JSON.
- **Live Log Feed**: Real-time console logs with timestamps and log levels.

### 6. JARVIS Labs & Intelligent Mock Provider
- **Jarvis Labs Provider Adapter**: Configurable API key, base URL, and model name with authentication and connection testing.
- **Intelligent Mock AI Engine**: Zero-API-key mode that dynamically generates semantically accurate, schema-valid synthetic records for instant out-of-the-box development and testing.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, `@xyflow/react`
- **Backend**: Python 3.14, FastAPI, Uvicorn, SQLAlchemy (Async), SQLite (`aiosqlite`), Pydantic v2, `jsonschema`, `sse-starlette`, `httpx`
- **Testing**: `pytest`, `pytest-asyncio`

---

## 🏁 Quickstart

### 1. Start the Backend
```bash
cd backend
# Activate virtual environment
.venv\Scripts\activate   # Windows
# or: source .venv/bin/activate  # macOS / Linux

# Run backend with reload
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
The FastAPI backend will be available at `http://127.0.0.1:8000` (docs at `http://127.0.0.1:8000/docs`).

### 2. Start the Frontend
```bash
cd frontend
npm run dev
```
Open `http://127.0.0.1:5173/` in your browser.

---

## 🧪 Running Automated Tests
```bash
cd backend
.venv\Scripts\pytest.exe -v
```
All 11 unit and integration tests (DAG cycle detection, variable interpolation, schema validation, and two-node vertical slice execution) will execute.
