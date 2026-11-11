# 🧬 MedRAG — Medical Terminology Mapping Engine

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Accuracy](https://img.shields.io/badge/Top--1%20Accuracy-93.3%25-brightgreen)](README.md)

> **An AI-powered Retrieval-Augmented Generation (RAG) framework for intelligent, accurate, and explainable medical terminology mapping.**

MedRAG transforms raw clinical language — free-text symptoms, diagnoses, procedures, medications — into standardized medical concepts across SNOMED CT, ICD-10-CM, MeSH, and UMLS. It combines dense vector retrieval with optional LLM reasoning to deliver confidence-scored, evidence-backed mappings with full explainability.

---

## 🌟 Features

- **🔍 Intelligent Term Mapping** — Maps free-text clinical terms to standardized concepts using hybrid retrieval + re-ranking
- **📚 Multi-Terminology Support** — SNOMED CT, ICD-10-CM, MeSH, and UMLS in a single query
- **🧠 LLM Semantic Reasoning** — Optional integration with OpenAI GPT-4o, Google Gemini, Groq, or local Ollama models
- **⚡ Zero-Key Mode** — Fully functional without any API keys via the built-in Local Grounded Clinical Reasoner
- **📊 Explainability Panel** — View retrieved evidence, candidate ranking signals, and reasoning trace for every mapping
- **🔁 Batch Processing** — Map multiple terms in a single API call
- **📈 Evaluation Dashboard** — Benchmark system performance on labeled clinical test cases
- **🗂️ Mapping History** — Persistent history with search, filtering, and CSV export
- **🖥️ Modern UI** — React 18 + Tailwind CSS + Framer Motion — dark, glassmorphism-style interface

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         MedRAG RAG Pipeline                             │
│                                                                         │
│   Clinical Query                                                        │
│        │                                                                │
│        ▼                                                                │
│  ┌─────────────┐    ┌──────────────────┐    ┌────────────────────┐     │
│  │  Query      │    │  Dense Vector    │    │  Top-K Retrieval   │     │
│  │  Encoding   │───▶│  Embedding       │───▶│  (FAISS Index)     │     │
│  │  (MiniLM)   │    │  Search Space    │    │  k=10 candidates   │     │
│  └─────────────┘    └──────────────────┘    └────────┬───────────┘     │
│                                                       │                 │
│                                                       ▼                 │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                   Candidate Re-ranking                           │   │
│  │   Cosine Similarity + BM25 Lexical + Semantic Overlap Score     │   │
│  └──────────────────────────────┬──────────────────────────────────┘   │
│                                 │                                       │
│                                 ▼                                       │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │              LLM Semantic Reasoning (optional)                   │  │
│  │   Local Grounded Clinical Reasoner  │  OpenAI / Gemini / Groq   │  │
│  └───────────────────────────────┬──────────────────────────────────┘  │
│                                  │                                      │
│                                  ▼                                      │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │            Evidence-Based Explanation + Final Concept           │    │
│  │   Concept ID · Terminology · Confidence · Evidence Snippets    │    │
│  └────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18, Vite 5 | UI framework and dev server |
| **Frontend** | Tailwind CSS | Utility-first styling |
| **Frontend** | Framer Motion | Animations and transitions |
| **Frontend** | Recharts | Data visualization / charts |
| **Frontend** | Lucide React | Icon set |
| **Backend** | FastAPI | REST API server |
| **Backend** | Python 3.11 | Core language |
| **Backend** | Uvicorn | ASGI server |
| **Backend** | Pydantic v2 | Data validation and settings |
| **AI / ML** | sentence-transformers | Dense vector embeddings (MiniLM-L6-v2) |
| **AI / ML** | FAISS (faiss-cpu) | Approximate nearest neighbor search |
| **AI / ML** | OpenAI API | Optional GPT-4o reasoning |
| **AI / ML** | Google Gemini API | Optional Gemini reasoning |
| **AI / ML** | Groq API | Optional Llama reasoning |
| **AI / ML** | Ollama | Optional local LLM (Meditron) |

---

## ✅ Prerequisites

Before you begin, ensure the following are installed:

| Requirement | Version | Check Command |
|------------|---------|---------------|
| **Python** | 3.11 or higher | `python --version` |
| **pip** | Latest | `pip --version` |
| **Node.js** | 18 or higher | `node --version` |
| **npm** | 9 or higher | `npm --version` |

> [!NOTE]
> `faiss-cpu` and `sentence-transformers` require an internet connection the first time they are installed/run to download model weights (~90 MB). Subsequent runs use the local cache.

---

## 🚀 Installation & Setup

### Step 1 — Get the Project

**Option A: Clone with Git**
```bash
git clone https://github.com/your-org/medrag.git
cd medrag
```

**Option B: Download ZIP**
1. Download and extract the ZIP archive
2. Open a terminal in the extracted folder

---

### Step 2 — Backend Setup

Open a terminal in the project root:

```bash
cd backend
pip install -r requirements.txt
```

> [!NOTE]
> This downloads `faiss-cpu`, `sentence-transformers`, and other ML dependencies. First run may take a few minutes depending on your internet speed.

---

### Step 3 — Backend Configuration

```bash
# Windows
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

Open `backend/.env` in any text editor. By default, the system is fully operational with **no API keys required** — the built-in Local Grounded Clinical Reasoner handles all LLM reasoning tasks.

To enable a cloud LLM provider, fill in the relevant key(s):

```env
# Optional — leave blank to use the built-in reasoner
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIza...
GROQ_API_KEY=gsk_...
```

---

### Step 4 — Start the Backend

From the `backend/` directory:

```bash
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

**Or use the Windows convenience script from the project root:**

```bat
start_backend.bat
```

The API will be available at: **http://127.0.0.1:8000**
Interactive API docs: **http://127.0.0.1:8000/docs**

---

### Step 5 — Frontend Setup

Open a **new terminal** in the project root:

```bash
cd frontend
npm install
```

---

### Step 6 — Start the Frontend

```bash
npm run dev
```

**Or use the Windows convenience script from the project root:**

```bat
start_frontend.bat
```

---

### Step 7 — Open the Application

Navigate to **[http://localhost:5173](http://localhost:5173)** in your browser.

> [!IMPORTANT]
> Both the backend (port 8000) and the frontend (port 5173) must be running simultaneously. The frontend dev server proxies all `/api/*` requests to the backend automatically.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/map` | Map a single clinical term |
| `POST` | `/api/map/batch` | Map multiple terms in one request |
| `GET` | `/api/history` | Retrieve mapping history with filters |
| `GET` | `/api/history/{id}` | Get a single mapping by ID |
| `POST` | `/api/history/{id}/review` | Accept or reject a mapping |
| `GET` | `/api/analytics/overview` | Get aggregate analytics metrics |
| `POST` | `/api/evaluate` | Run the benchmark evaluation suite |
| `GET` | `/api/history/export/csv` | Export history as a CSV file |
| `GET` | `/health` | Health check / system status |
| `GET` | `/docs` | Interactive Swagger API documentation |

### Example: Map a Term

```bash
curl -X POST http://127.0.0.1:8000/api/map \
  -H "Content-Type: application/json" \
  -d '{
    "term": "high blood pressure",
    "terminology": "SNOMED CT",
    "top_k": 5
  }'
```

**Response:**
```json
{
  "id": "map_01J...",
  "original_term": "high blood pressure",
  "mapped_concept": {
    "concept_id": "38341003",
    "concept_name": "Hypertension",
    "terminology": "SNOMED CT"
  },
  "confidence": "High",
  "similarity_score": 0.94,
  "hybrid_score": 0.91,
  "candidates": [...],
  "evidence": [...],
  "reasoning": "...",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## 📂 Sample Terminology Dataset

MedRAG ships with a curated sample dataset of medical concepts across four terminologies:

| Terminology | Coverage | Concepts Included |
|------------|---------|-------------------|
| **SNOMED CT** | Clinical findings, disorders, procedures | Cardiovascular, respiratory, neurological terms |
| **ICD-10-CM** | Diagnosis codes | Common inpatient and outpatient diagnoses |
| **MeSH** | Biomedical literature headings | Research and pharmacological terms |
| **UMLS** | Unified metathesaurus concepts | Cross-terminology semantic mappings |

The sample dataset is embedded into the FAISS vector index at startup. For production use, replace or extend the dataset via the data ingestion scripts in `backend/scripts/`.

---

## 🧠 LLM Integration

MedRAG is designed to work in **three modes**:

### Mode 1: Zero-Key (Default) ✅
No configuration required. The **Local Grounded Clinical Reasoner** uses rule-based semantic analysis, candidate scoring signals, and evidence aggregation to produce high-quality mappings entirely offline.

### Mode 2: Cloud LLM (Optional) ☁️
Configure one or more API keys in `.env` to unlock enhanced semantic reasoning:

| Provider | Model | Key Variable |
|----------|-------|-------------|
| OpenAI | gpt-4o-mini (default) | `OPENAI_API_KEY` |
| Google | gemini-1.5-flash (default) | `GEMINI_API_KEY` |
| Groq | llama-3.1-70b-versatile (default) | `GROQ_API_KEY` |

### Mode 3: Local LLM via Ollama (Optional) 🏠
Run the medical-tuned **Meditron** model locally:
```bash
# Install Ollama from https://ollama.com, then:
ollama pull meditron
```
Set `OLLAMA_BASE_URL=http://localhost:11434` in `.env`.

---

## ⚠️ Medical Safety Disclaimer

> [!CAUTION]
> **MedRAG is a research and educational tool only.**
>
> - This software is **NOT** a medical device and has **NOT** been validated for clinical use.
> - Outputs must **NOT** be used for patient care, clinical decision-making, diagnosis, or treatment without review by a qualified healthcare professional.
> - Terminology mappings may contain errors. Always verify critical mappings against official terminological databases (NLM, WHO, SNOMED International).
> - The developers assume no liability for any medical decisions made using this tool.

---

## 📊 Evaluation Results

Evaluated on **15 labeled clinical test cases** spanning cardiovascular, respiratory, neurological, and pharmacological categories.

| Metric | Score |
|--------|-------|
| **Top-1 Accuracy** | **93.3%** |
| **Top-5 Accuracy** | 100.0% |
| **Precision@1** | 0.933 |
| **Precision@5** | 0.960 |
| **Mean Reciprocal Rank (MRR)** | 0.951 |
| **Recall@5** | 1.000 |

> Results reflect the Local Grounded Clinical Reasoner (zero-key mode). Cloud LLM modes achieve comparable or higher accuracy depending on model.

---

## 🗂️ Project Structure

```
NLP/
├── README.md
├── start_backend.bat          # Windows: start FastAPI server
├── start_frontend.bat         # Windows: start Vite dev server
│
├── backend/
│   ├── .env.example           # Environment variable template
│   ├── .env                   # Your local config (not committed)
│   ├── requirements.txt       # Python dependencies
│   └── app/
│       ├── __init__.py
│       ├── main.py            # FastAPI app entry point
│       ├── config.py          # Settings (pydantic-settings)
│       ├── api/
│       │   ├── __init__.py
│       │   ├── routes.py      # API route definitions
│       │   └── schemas.py     # Request/Response Pydantic models
│       ├── services/
│       │   ├── __init__.py
│       │   ├── retriever.py   # FAISS retrieval service
│       │   ├── reasoner.py    # LLM reasoning service
│       │   ├── ranker.py      # Candidate re-ranking logic
│       │   └── evaluator.py   # Evaluation benchmark runner
│       ├── models/
│       │   ├── __init__.py
│       │   └── mapping.py     # Domain model dataclasses
│       └── data/
│           ├── concepts.json  # Sample terminology dataset
│           └── index/         # FAISS index files (auto-generated)
│
└── frontend/
    ├── package.json
    ├── vite.config.js         # Proxy config: /api → 127.0.0.1:8000
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── main.jsx           # React 18 root
        ├── App.jsx            # App shell + routing
        ├── index.css          # Global styles
        ├── services/
        │   └── api.js         # API client (fetch-based)
        ├── components/
        │   ├── Navbar.jsx
        │   ├── Sidebar.jsx
        │   ├── AnimatedBackground.jsx
        │   ├── MetricCard.jsx
        │   ├── MappingCard.jsx
        │   ├── CandidateTable.jsx
        │   └── EvidencePanel.jsx
        └── pages/
            ├── Landing.jsx
            ├── Dashboard.jsx
            ├── Workspace.jsx
            ├── Explainability.jsx
            ├── Pipeline.jsx
            ├── History.jsx
            └── Evaluation.jsx
```

---

## 📄 License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2024 MedRAG Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

<div align="center">
  <sub>Built with ❤️ for the medical informatics community</sub>
</div>
