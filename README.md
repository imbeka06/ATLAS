# ARCHITECT.AI

An AI-powered system architect that turns plain-language descriptions into full software deliverables — SRS documentation, architecture diagrams, step-by-step explanations, and complete implementation code — all in one interface.

---

## What it does

You describe a system. ATLAS (the AI engine) responds with four structured sections every time:

1. **SRS Documentation** — formal Software Requirements Specification
2. **Architecture Diagrams** — ERDs, DFDs, and flowcharts rendered live via Mermaid.js
3. **Step-by-Step Explanation** — detailed tutorial with terminal commands and rationale
4. **Implementation** — complete, runnable code files displayed in a Monaco editor

You can attach images (wireframes, screenshots, diagrams) and the system will switch to GPT-4o vision automatically. All other requests use DeepSeek for speed and cost efficiency.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Code Editor | Monaco Editor (`@monaco-editor/react`) |
| Diagrams | Mermaid.js |
| Live Preview | WebContainer API (`@webcontainer/api`) |
| Backend | FastAPI (Python 3.11) |
| AI — Text | DeepSeek (`deepseek-chat`) |
| AI — Vision | OpenAI (`gpt-4o`) |
| Storage | Browser `localStorage` (no database) |

---

## Project structure

```
architect-ai/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app, CORS, /chat and /health endpoints
│   │   ├── models.py        # Pydantic models (ProjectState, Message, etc.)
│   │   ├── services.py      # AI routing logic (DeepSeek / GPT-4o)
│   │   └── prompts.py       # Prompt reference file
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── Procfile             # For Render / Heroku
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx
    │   │   ├── page.tsx     # Main shell: sidebar, chat, workspace tabs
    │   │   └── globals.css
    │   ├── components/
    │   │   ├── ChatInterface.tsx   # Message thread + file attachment input
    │   │   ├── Workspace.tsx       # Tab router (SRS / arch / code / preview)
    │   │   ├── FileExplorer.tsx    # Monaco-based file editor
    │   │   ├── MermaidDiagram.tsx  # Mermaid renderer
    │   │   └── WebPreview.tsx      # WebContainer live preview + iframe fallback
    │   ├── lib/
    │   │   └── api.ts         # Axios client, types
    │   └── types/
    │       └── globals.d.ts   # CSS module declarations
    ├── next.config.mjs        # COOP/COEP headers required for WebContainer
    ├── custom.d.ts
    └── .env.local.example
```

---

## Local development

### Prerequisites

- Python 3.11+
- Node.js 18+
- A [DeepSeek API key](https://platform.deepseek.com/)
- An [OpenAI API key](https://platform.openai.com/) (for image/vision requests)

### 1. Backend

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS / Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your API keys

# Start the server
uvicorn app.main:app --reload
# Runs on http://127.0.0.1:8000
```

### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# .env.local already points to http://127.0.0.1:8000 by default

# Start the dev server
npm run dev
# Runs on http://localhost:3000
```

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `DEEPSEEK_API_KEY` | DeepSeek API key for text generation |
| `OPENAI_API_KEY` | OpenAI API key for vision (image) requests |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed frontend origins (e.g. `http://localhost:3000,https://your-app.vercel.app`) |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Full URL of the backend API (e.g. `http://127.0.0.1:8000`) |

---

## Deployment

### Backend → Render

1. Push this repo to GitHub
2. On [Render](https://render.com): **New → Web Service** → connect repo → set **Root Directory** to `backend`
3. **Build command:** `pip install -r requirements.txt`
4. **Start command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables in Render's dashboard (`DEEPSEEK_API_KEY`, `OPENAI_API_KEY`, `ALLOWED_ORIGINS`)
6. Copy the Render service URL (e.g. `https://architect-ai-backend.onrender.com`)

> Alternatively deploy with Docker using the provided `backend/Dockerfile` on Railway, Fly.io, or any container platform.

### Frontend → Vercel

1. On [Vercel](https://vercel.com): **New Project** → import repo → set **Root Directory** to `frontend`
2. Add environment variable: `NEXT_PUBLIC_API_URL` → your Render backend URL
3. Deploy

> After Vercel assigns your frontend URL, go back to Render and add it to `ALLOWED_ORIGINS`.

### CORS checklist

```
ALLOWED_ORIGINS=https://your-app.vercel.app,http://localhost:3000
```

Both origins must be listed if you want local dev and production to work simultaneously.

---

## Key behaviours

- **Smart routing** — requests with an attached image automatically use GPT-4o; all others use DeepSeek
- **Incremental code updates** — the AI is instructed to only output files that changed, not the full codebase every time; the frontend merges updates on top of existing files
- **Manual editing** — files in the Monaco editor can be edited live; edits are preserved in local state and merged with future AI responses
- **Live preview** — the WebPreview tab boots a WebContainer to run the generated project in-browser; falls back to a sandboxed `<iframe>` blob URL if `SharedArrayBuffer` is blocked
- **Project history** — multiple projects are stored in `localStorage` with full conversation history; switching projects restores the complete context

---

## API reference

### `POST /chat`

Request body:

```json
{
  "project_id": "string",
  "message": "string",
  "current_state": {
    "id": "string",
    "name": "string",
    "phase": "discovery | architecture | coding",
    "tech_stack": ["string"],
    "history": [{ "role": "user | assistant", "content": "string" }]
  },
  "attachment": {
    "name": "string",
    "data": "base64 data URL",
    "type": "MIME type"
  }
}
```

Response:

```json
{
  "reply": "string",
  "updated_state": { "...ProjectState" },
  "model_used": "deepseek-chat | gpt-4o"
}
```

### `GET /health`

```json
{ "status": "ARCHITECT.AI is online" }
```

---

## License

MIT
