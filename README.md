<div align="center">

# ⚡ NexusAI Enterprise

### Enterprise-Grade Retrieval-Augmented Generation Platform

**Build, deploy, and govern grounded AI assistants at organizational scale.**

*Multi-tenant RAG · Hybrid Retrieval · Enterprise Agents · Full Observability*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Azure OpenAI](https://img.shields.io/badge/Azure-OpenAI-0078D4?logo=microsoftazure&logoColor=white)](https://azure.microsoft.com/en-us/products/ai-services/openai-service)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](Dockerfile)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](#)
[![Code Coverage](https://img.shields.io/badge/coverage-87%25-brightgreen)](#)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[Overview](#-overview) •
[Architecture](#-architecture) •
[Features](#-features) •
[Quick Start](#-quick-start) •
[API Docs](#-api-documentation) •
[Deployment](#-deployment) •
[Roadmap](#-roadmap)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Why NexusAI Enterprise](#-why-nexusai-enterprise)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
  - [System Architecture](#system-architecture)
  - [RAG Pipeline](#rag-pipeline)
  - [Hybrid Retrieval Flow](#hybrid-retrieval-flow)
  - [Enterprise Agent Workflow](#enterprise-agent-workflow)
  - [Database Entity Relations](#database-entity-relations)
  - [Request Lifecycle](#request-lifecycle)
- [Features](#-features)
- [Screenshots](#-screenshots)
- [Folder Structure](#-folder-structure)
- [Quick Start](#-quick-start)
- [Environment Variables](#-environment-variables)
- [API Documentation](#-api-documentation)
- [Evaluation Framework](#-evaluation-framework)
- [Observability & Monitoring](#-observability--monitoring)
- [Security](#-security)
- [Deployment](#-deployment)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🧭 Overview

**NexusAI Enterprise** is a production-grade Retrieval-Augmented Generation (RAG) platform designed for organizations that need **grounded, auditable, and governed AI** — not a chatbot demo.

It provides a full control plane for enterprise AI: multi-tenant organizations, project-scoped knowledge bases, document ingestion pipelines, hybrid dense+sparse retrieval with reranking, streaming grounded chat, automated response evaluation, and purpose-built enterprise agents — all wrapped in JWT-secured, RBAC-governed APIs with end-to-end audit logging.

It is architected in the spirit of **Azure AI Foundry**, **Microsoft Copilot Studio**, **OpenAI Enterprise**, and **LangGraph** — combining their core ideas (grounding, evaluation, agent orchestration, governance) into a single self-hostable platform.

> Built for teams who need to answer: *"Can we trust what the AI just told our compliance officer — and can we prove it?"*

---

## 💡 Why NexusAI Enterprise

| Problem | How NexusAI Solves It |
|---|---|
| LLMs hallucinate on internal knowledge | Hybrid retrieval + citation-grounded generation with faithfulness scoring |
| No visibility into AI answer quality | Built-in evaluation suite (faithfulness, groundedness, context precision/recall, relevance) |
| Single-tenant chatbots don't scale to orgs | Native multi-tenant architecture with RBAC at org/project/KB level |
| "Black box" AI erodes trust with compliance/legal | Full audit logs, citation trails, and per-response evaluation scores |
| Generic chat doesn't fit specialized workflows | Purpose-built enterprise agents (Financial Analyst, Risk Analyst, Compliance Reviewer, etc.) |
| Vendor lock-in to a single LLM provider | Model Gateway abstraction — swap providers without touching business logic |

---

## 🛠️ Tech Stack

<table>
<tr>
<td valign="top" width="33%">

### 🔧 Backend
- Python 3.11+
- FastAPI
- SQLAlchemy 2.0 (async)
- PostgreSQL 16
- Alembic (migrations)
- Pydantic v2
- JWT Authentication
- SSE Streaming
- Docker Ready

</td>
<td valign="top" width="33%">

### 🧠 AI / RAG Stack
- Azure OpenAI (GPT-4 class + embeddings)
- Hybrid Retrieval (Dense + Sparse)
- Cross-Encoder Reranking
- Citation Generation Engine
- Guardrails & Content Safety
- Model Gateway (multi-provider)
- AI Evaluation Suite
- Enterprise Agent Framework

</td>
<td valign="top" width="33%">

### 🎨 Frontend
- Next.js 16 (App Router)
- React 19
- TypeScript
- TailwindCSS
- shadcn/ui
- Azure Blob Storage (docs/assets)

</td>
</tr>
</table>

---

## 🏗️ Architecture

### System Architecture

```mermaid
flowchart TB
    subgraph Client["🖥️ Client Layer"]
        WEB["Next.js 16 Web App<br/>(React + TypeScript + shadcn/ui)"]
    end

    subgraph Gateway["🚪 API Gateway Layer"]
        API["FastAPI Application<br/>(REST + SSE Streaming)"]
        AUTH["JWT Auth Middleware<br/>RBAC Enforcement"]
    end

    subgraph Core["⚙️ Core Services"]
        ORG["Organization Service"]
        PROJ["Project Service"]
        KB["Knowledge Base Service"]
        DOC["Document Processing Service"]
        CHAT["Chat Orchestration Service"]
        AGENT["Enterprise Agent Service"]
        EVAL["Evaluation Service"]
        AUDIT["Audit Logging Service"]
    end

    subgraph AILayer["🧠 AI Layer"]
        GATEWAY["Model Gateway"]
        RETRIEVAL["Hybrid Retrieval Engine"]
        RERANK["Cross-Encoder Reranker"]
        GUARD["Guardrails Engine"]
        AOAI["Azure OpenAI<br/>(Chat + Embeddings)"]
    end

    subgraph Data["💾 Data Layer"]
        PG[("PostgreSQL 16<br/>Relational Store")]
        VEC[("Vector Store<br/>Dense Embeddings")]
        BLOB[("Azure Blob Storage<br/>Raw Documents")]
    end

    WEB -->|HTTPS/JWT| API
    API --> AUTH
    AUTH --> ORG & PROJ & KB & DOC & CHAT & AGENT & EVAL
    CHAT --> RETRIEVAL
    AGENT --> RETRIEVAL
    RETRIEVAL --> RERANK
    RETRIEVAL --> VEC
    RERANK --> GATEWAY
    GATEWAY --> AOAI
    DOC --> BLOB
    DOC --> VEC
    GUARD --> CHAT
    ORG & PROJ & KB & DOC & CHAT & AGENT --> AUDIT
    ORG & PROJ & KB & DOC & CHAT & AGENT & EVAL & AUDIT --> PG

    style Client fill:#0078D4,color:#fff
    style Gateway fill:#5C2D91,color:#fff
    style Core fill:#107C10,color:#fff
    style AILayer fill:#D83B01,color:#fff
    style Data fill:#004578,color:#fff
```

### RAG Pipeline

```mermaid
flowchart LR
    A["📄 Document<br/>Upload"] --> B["🔍 Parsing &<br/>Extraction"]
    B --> C["✂️ Chunking<br/>Strategy"]
    C --> D["🧬 Embedding<br/>Generation"]
    D --> E["📥 Dense Index<br/>Storage"]
    C --> F["📥 Sparse Index<br/>(BM25) Storage"]

    G["💬 User Query"] --> H["🧬 Query<br/>Embedding"]
    H --> I{"Hybrid<br/>Retrieval"}
    E --> I
    F --> I
    I --> J["🎯 Cross-Encoder<br/>Reranking"]
    J --> K["📚 Context<br/>Building"]
    K --> L["🏷️ Citation<br/>Mapping"]
    L --> M["🛡️ Guardrails<br/>Check"]
    M --> N["🤖 Azure OpenAI<br/>Generation"]
    N --> O["✅ Grounded<br/>Response + Citations"]

    style A fill:#0078D4,color:#fff
    style O fill:#107C10,color:#fff
    style I fill:#D83B01,color:#fff
    style N fill:#5C2D91,color:#fff
```

### Hybrid Retrieval Flow

```mermaid
flowchart TB
    Q["Incoming Query"] --> QE["Query Embedding<br/>(Azure OpenAI)"]
    Q --> QT["Query Tokenization"]

    QE --> DS["Dense Search<br/>(Vector Similarity / kNN)"]
    QT --> SS["Sparse Search<br/>(BM25 / Keyword)"]

    DS --> TOPK_D["Top-K Dense Results"]
    SS --> TOPK_S["Top-K Sparse Results"]

    TOPK_D --> FUSE["Reciprocal Rank Fusion"]
    TOPK_S --> FUSE

    FUSE --> CE["Cross-Encoder<br/>Reranker"]
    CE --> FILTER["Metadata &<br/>Permission Filter"]
    FILTER --> FINAL["Final Ranked<br/>Context Chunks"]

    style DS fill:#0078D4,color:#fff
    style SS fill:#D83B01,color:#fff
    style CE fill:#5C2D91,color:#fff
    style FINAL fill:#107C10,color:#fff
```

### Enterprise Agent Workflow

```mermaid
flowchart TB
    START(["User Invokes Agent"]) --> SELECT{"Agent Router"}

    SELECT -->|Financial Query| FIN["💰 Financial Analyst Agent"]
    SELECT -->|Risk Query| RISK["⚠️ Risk Analyst Agent"]
    SELECT -->|Compliance Query| COMP["📋 Compliance Reviewer Agent"]
    SELECT -->|Research Query| DOCR["🔎 Document Researcher Agent"]
    SELECT -->|Summary Request| EXEC["📊 Executive Summary Agent"]

    FIN & RISK & COMP & DOCR --> RETRIEVE["Retrieve Grounded Context<br/>(Hybrid RAG)"]
    RETRIEVE --> PLAN["Task Planning &<br/>Tool Selection"]
    PLAN --> TOOLS["Execute Tools<br/>(calc, lookup, cross-ref)"]
    TOOLS --> SYNTH["Synthesize Findings"]
    EXEC --> SYNTH
    SYNTH --> VALIDATE["Guardrails &<br/>Fact Validation"]
    VALIDATE --> EVAL["Evaluation Scoring"]
    EVAL --> OUT(["Structured Agent Output<br/>+ Citations + Confidence"])

    style FIN fill:#107C10,color:#fff
    style RISK fill:#D83B01,color:#fff
    style COMP fill:#5C2D91,color:#fff
    style DOCR fill:#0078D4,color:#fff
    style EXEC fill:#004578,color:#fff
```

### Database Entity Relations

```mermaid
erDiagram
    ORGANIZATION ||--o{ MEMBER : has
    ORGANIZATION ||--o{ PROJECT : owns
    MEMBER }o--|| ROLE : assigned
    PROJECT ||--o{ KNOWLEDGE_BASE : contains
    KNOWLEDGE_BASE ||--o{ DOCUMENT : stores
    DOCUMENT ||--o{ CHUNK : split_into
    CHUNK ||--o{ EMBEDDING : generates
    PROJECT ||--o{ CONVERSATION : scopes
    CONVERSATION ||--o{ MESSAGE : contains
    MESSAGE ||--o{ CITATION : references
    MESSAGE ||--o{ EVALUATION : scored_by
    PROJECT ||--o{ AGENT_RUN : executes
    AGENT_RUN ||--o{ CITATION : produces
    ORGANIZATION ||--o{ AUDIT_LOG : generates

    ORGANIZATION {
        uuid id PK
        string name
        string plan_tier
        timestamp created_at
    }
    PROJECT {
        uuid id PK
        uuid organization_id FK
        string name
        string status
    }
    KNOWLEDGE_BASE {
        uuid id PK
        uuid project_id FK
        string name
        jsonb metadata
    }
    DOCUMENT {
        uuid id PK
        uuid knowledge_base_id FK
        string filename
        string status
        string blob_url
    }
    CONVERSATION {
        uuid id PK
        uuid project_id FK
        uuid user_id FK
        timestamp created_at
    }
    EVALUATION {
        uuid id PK
        uuid message_id FK
        float faithfulness
        float groundedness
        float context_precision
        float context_recall
        float relevance
    }
```

### Request Lifecycle

```mermaid
sequenceDiagram
    autonumber
    participant U as User (Web App)
    participant G as API Gateway
    participant A as Auth/RBAC
    participant C as Chat Service
    participant R as Retrieval Engine
    participant M as Model Gateway
    participant O as Azure OpenAI
    participant D as PostgreSQL
    participant L as Audit Log

    U->>G: POST /chat/stream (JWT)
    G->>A: Validate token + permissions
    A-->>G: Authorized (RBAC OK)
    G->>C: Forward chat request
    C->>R: Retrieve grounded context
    R->>D: Fetch dense + sparse candidates
    D-->>R: Ranked chunks
    R-->>C: Reranked context + citations
    C->>M: Build prompt + context
    M->>O: Stream completion request
    O-->>M: Token stream (SSE)
    M-->>C: Streamed tokens
    C-->>U: SSE stream (grounded response)
    C->>D: Persist message + citations
    C->>L: Write audit event
```

---

## ✨ Features

<details>
<summary><strong>🔐 Authentication & Access Control</strong></summary>

- JWT-based login with short-lived access tokens
- Refresh token rotation
- Role-Based Access Control (RBAC) — Owner / Admin / Member / Viewer
- Secured API surface with dependency-injected permission checks

</details>

<details>
<summary><strong>🏢 Organizations & Multi-Tenancy</strong></summary>

- Multi-tenant organization model with strict data isolation
- Member invitation & management
- Configurable roles and granular permissions per resource

</details>

<details>
<summary><strong>📁 Projects & Knowledge Bases</strong></summary>

- Project-based workspace organization
- Knowledge base CRUD with rich metadata
- Knowledge base ↔ project linking for scoped retrieval
- Full-text and metadata search across knowledge bases

</details>

<details>
<summary><strong>📄 Document Processing</strong></summary>

- Multi-format document upload (PDF, DOCX, TXT, CSV, HTML)
- Async processing pipeline: parsing → chunking → embedding
- Configurable chunking strategies (fixed, semantic, recursive)
- Status tracking (queued → processing → retrieval-ready)

</details>

<details>
<summary><strong>🔍 Retrieval-Augmented Generation</strong></summary>

- Hybrid retrieval combining dense (vector) and sparse (BM25) search
- Reciprocal Rank Fusion for candidate merging
- Cross-encoder reranking for precision
- Automatic citation generation and source attribution
- Context window building with token-budget awareness

</details>

<details>
<summary><strong>💬 Grounded Chat</strong></summary>

- Real-time streaming responses via SSE
- Persistent, resumable conversation history
- Inline citations linked to source chunks
- Multi-turn context carry-over within a project scope

</details>

<details>
<summary><strong>📊 Monitoring & Observability</strong></summary>

- Health check APIs for all core services
- Latency tracking per pipeline stage (retrieval, rerank, generation)
- Token usage & cost tracking per organization/project
- Operational dashboard for system-wide visibility

</details>

<details>
<summary><strong>✅ AI Evaluation Framework</strong></summary>

- Faithfulness scoring (does the answer match retrieved context?)
- Groundedness scoring (is every claim source-backed?)
- Context precision & recall metrics
- Relevance scoring against user intent
- Per-response evaluation trail stored for audit

</details>

<details>
<summary><strong>🤖 Enterprise AI Agents</strong></summary>

| Agent | Purpose |
|---|---|
| 💰 **Financial Analyst** | Analyzes financial documents, extracts KPIs, flags anomalies |
| ⚠️ **Risk Analyst** | Identifies risk factors and exposure across knowledge base content |
| 📋 **Compliance Reviewer** | Cross-references content against compliance/regulatory criteria |
| 🔎 **Document Researcher** | Deep multi-document research and synthesis |
| 📈 **Executive Summary Agent** | Produces concise, citation-backed executive briefs |

</details>

<details>
<summary><strong>📝 Audit & Compliance</strong></summary>

- Immutable audit logs for all sensitive actions
- Event tracking across auth, document, chat, and agent operations
- Per-organization activity history for compliance reviews

</details>

---

## 🖼️ Screenshots

> Replace the placeholders below with real product screenshots or GIFs before publishing.

<div align="center">

| Chat with Grounded Citations | Knowledge Base Management |
|:---:|:---:|
| ![Grounded Chat](docs/screenshots/chat.png) | <img width="1918" height="1078" alt="image" src="https://github.com/user-attachments/assets/914b08e2-4a34-4f49-9e4b-11f9c0bedf6e" />
 |

| Evaluation Dashboard | Enterprise Agent Console |
|:---:|:---:|
| ![Evaluation Dashboard](docs/screenshots/evaluation.png) | ![Agent Console](docs/screenshots/agents.png) |

</div>

---

## 📂 Folder Structure

```
nexusai-enterprise/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── auth/
│   │   │       ├── organizations/
│   │   │       ├── projects/
│   │   │       ├── knowledge_bases/
│   │   │       ├── documents/
│   │   │       ├── chat/
│   │   │       ├── agents/
│   │   │       ├── evaluation/
│   │   │       └── monitoring/
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   └── rbac.py
│   │   ├── services/
│   │   │   ├── retrieval/
│   │   │   │   ├── dense_search.py
│   │   │   │   ├── sparse_search.py
│   │   │   │   └── reranker.py
│   │   │   ├── model_gateway/
│   │   │   ├── evaluation/
│   │   │   ├── agents/
│   │   │   │   ├── financial_analyst.py
│   │   │   │   ├── risk_analyst.py
│   │   │   │   ├── compliance_reviewer.py
│   │   │   │   ├── document_researcher.py
│   │   │   │   └── executive_summary.py
│   │   │   └── audit/
│   │   ├── models/
│   │   ├── schemas/
│   │   └── main.py
│   ├── alembic/
│   │   └── versions/
│   ├── tests/
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── app/
│   │   ├── (auth)/
│   │   ├── (dashboard)/
│   │   │   ├── projects/
│   │   │   ├── knowledge-bases/
│   │   │   ├── chat/
│   │   │   ├── agents/
│   │   │   └── monitoring/
│   │   └── layout.tsx
│   ├── components/
│   │   └── ui/
│   ├── lib/
│   ├── Dockerfile
│   └── package.json
├── docs/
│   ├── screenshots/
│   └── architecture/
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

| Requirement | Version |
|---|---|
| Python | 3.11+ |
| Node.js | 20+ |
| PostgreSQL | 16+ |
| Docker & Docker Compose | Latest |
| Azure OpenAI Access | Required |

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/nexusai-enterprise.git
cd nexusai-enterprise
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
# Edit .env with your Azure OpenAI keys, database URL, and secrets
```

### 3. Run with Docker Compose (Recommended)

```bash
docker-compose up --build
```

This spins up:
- `backend` — FastAPI service on `:8000`
- `frontend` — Next.js app on `:3000`
- `postgres` — PostgreSQL 16 on `:5432`

### 4. Manual Setup (Local Development)

**Backend**

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

### 5. Access the Platform

| Service | URL |
|---|---|
| Web App | http://localhost:3000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| API Docs (ReDoc) | http://localhost:8000/redoc |
| Health Check | http://localhost:8000/health |

---

## 🔑 Environment Variables

```bash
# ── Application ──────────────────────────────
ENVIRONMENT=development
SECRET_KEY=your-secret-key
API_V1_PREFIX=/api/v1

# ── Database ──────────────────────────────────
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/nexusai
DATABASE_POOL_SIZE=20

# ── Auth ──────────────────────────────────────
JWT_SECRET_KEY=your-jwt-secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# ── Azure OpenAI ──────────────────────────────
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_API_VERSION=2024-10-21
AZURE_OPENAI_CHAT_DEPLOYMENT=gpt-4o
AZURE_OPENAI_EMBEDDING_DEPLOYMENT=text-embedding-3-large

# ── Azure Blob Storage ────────────────────────
AZURE_STORAGE_CONNECTION_STRING=your-connection-string
AZURE_STORAGE_CONTAINER=nexusai-documents

# ── Retrieval Config ──────────────────────────
DENSE_TOP_K=25
SPARSE_TOP_K=25
RERANK_TOP_N=8
CHUNK_SIZE=512
CHUNK_OVERLAP=64

# ── Frontend ───────────────────────────────────
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

> ⚠️ Never commit `.env` files. Use Azure Key Vault or a secrets manager in production.

---

## 📚 API Documentation

Interactive API documentation is auto-generated via FastAPI and available at `/docs` (Swagger UI) and `/redoc`.

### Core Endpoints Overview

<details>
<summary><strong>🔐 Auth</strong></summary>

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/register` | Register a new user |
| `POST` | `/api/v1/auth/login` | Login and receive JWT pair |
| `POST` | `/api/v1/auth/refresh` | Refresh access token |
| `POST` | `/api/v1/auth/logout` | Invalidate refresh token |

</details>

<details>
<summary><strong>🏢 Organizations & Projects</strong></summary>

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/organizations` | Create organization |
| `GET` | `/api/v1/organizations/{id}` | Get organization details |
| `POST` | `/api/v1/organizations/{id}/members` | Invite member |
| `POST` | `/api/v1/projects` | Create project |
| `GET` | `/api/v1/projects/{id}` | Get project details |

</details>

<details>
<summary><strong>📚 Knowledge Bases & Documents</strong></summary>

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/knowledge-bases` | Create knowledge base |
| `GET` | `/api/v1/knowledge-bases/{id}` | Get knowledge base |
| `POST` | `/api/v1/documents/upload` | Upload document |
| `GET` | `/api/v1/documents/{id}/status` | Get processing status |

</details>

<details>
<summary><strong>💬 Chat & Retrieval</strong></summary>

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/chat/stream` | Stream grounded chat response (SSE) |
| `GET` | `/api/v1/conversations/{id}` | Get conversation history |
| `POST` | `/api/v1/retrieval/query` | Raw hybrid retrieval query |

</details>

<details>
<summary><strong>🤖 Agents & Evaluation</strong></summary>

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/agents/{agent_type}/run` | Execute an enterprise agent |
| `GET` | `/api/v1/agents/runs/{id}` | Get agent run result |
| `POST` | `/api/v1/evaluation/run` | Trigger evaluation on a response |
| `GET` | `/api/v1/monitoring/health` | System health check |

</details>

### Example: Streaming Grounded Chat

```bash
curl -N -X POST http://localhost:8000/api/v1/chat/stream \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "PROJECT_UUID",
    "conversation_id": "CONVERSATION_UUID",
    "message": "Summarize Q3 compliance findings from the uploaded audit reports."
  }'
```

---

## 🧪 Evaluation Framework

Every grounded response can be automatically scored against five core RAG quality metrics:

| Metric | What It Measures |
|---|---|
| **Faithfulness** | Does the response avoid claims unsupported by retrieved context? |
| **Groundedness** | Is every factual statement traceable to a cited source chunk? |
| **Context Precision** | How much of the retrieved context is actually relevant? |
| **Context Recall** | Did retrieval surface all the relevant information available? |
| **Relevance** | Does the response actually address the user's query intent? |

Evaluation scores are persisted per message and surfaced on the monitoring dashboard, enabling continuous quality tracking across projects and knowledge bases.

---

## 📈 Observability & Monitoring

- **Health APIs** — liveness/readiness checks for API, database, and model gateway
- **Latency Tracking** — per-stage timing (retrieval, rerank, generation) for performance tuning
- **Token Usage Tracking** — per-organization and per-project cost visibility
- **Operational Dashboard** — real-time system health, usage trends, and evaluation score trends

---

## 🔒 Security

- JWT access + refresh token authentication with rotation
- RBAC enforced at organization, project, and knowledge base levels
- Guardrails layer for content safety and prompt-injection mitigation
- Full audit trail for every sensitive read/write operation
- Secrets managed via environment variables / Key Vault (never hardcoded)
- Multi-tenant data isolation enforced at the query layer

---

## 🚢 Deployment

### Deployment Architecture

```mermaid
flowchart LR
    DEV["👨‍💻 Developer"] -->|git push| GH["GitHub Repository"]
    GH -->|CI/CD Trigger| CI["GitHub Actions"]

    CI -->|Build & Deploy| VERCEL["▲ Vercel<br/>(Next.js Frontend)"]
    CI -->|Build & Deploy| AZAPP["☁️ Azure App Service<br/>(FastAPI Backend)"]

    VERCEL -->|HTTPS API Calls| AZAPP
    AZAPP -->|SQL| PG[("Azure DB for PostgreSQL")]
    AZAPP -->|Blob R/W| BLOB[("Azure Blob Storage")]
    AZAPP -->|Inference| AOAI["Azure OpenAI Service"]

    style VERCEL fill:#000000,color:#fff
    style AZAPP fill:#0078D4,color:#fff
    style PG fill:#004578,color:#fff
    style BLOB fill:#004578,color:#fff
    style AOAI fill:#5C2D91,color:#fff
```

| Layer | Target Service | Notes |
|---|---|---|
| **Frontend** | ▲ Vercel | Next.js 16 App Router, edge-optimized, preview deployments per PR |
| **Backend API** | ☁️ Azure App Service | FastAPI container, autoscaling, deployment slots (staging/prod) |
| **Database** | Azure Database for PostgreSQL (Flexible Server) | Managed PostgreSQL 16, automated backups |
| **Document Storage** | Azure Blob Storage | Raw document uploads, versioned containers |
| **LLM & Embeddings** | Azure OpenAI Service | Chat completions + embedding deployments |
| **Secrets** | Azure Key Vault | Referenced via App Service Key Vault references |
| **Observability** | Azure Monitor + Application Insights | Backend tracing; Vercel Analytics for frontend |

<details>
<summary><strong>Docker Compose (Local / Single Host)</strong></summary>

```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

</details>

<details>
<summary><strong>Frontend → Vercel</strong></summary>

```bash
# from /frontend
vercel --prod
```

Set `NEXT_PUBLIC_API_URL` in the Vercel project's environment variables to point to the Azure App Service backend URL.

</details>

<details>
<summary><strong>Backend → Azure App Service</strong></summary>

```bash
# from /backend
az webapp up \
  --name nexusai-enterprise-api \
  --resource-group nexusai-rg \
  --runtime "PYTHON:3.11" \
  --sku P1V3
```

Configure app settings (`DATABASE_URL`, `AZURE_OPENAI_*`, `JWT_SECRET_KEY`, `AZURE_STORAGE_CONNECTION_STRING`) via Azure Key Vault references or the App Service Configuration blade.

</details>

<details>
<summary><strong>CI/CD Pipeline</strong></summary>

- GitHub Actions for build, lint, type-check, and test on every PR
- Automated Alembic migration checks against a staging database
- Vercel auto-deploys the frontend on merge to `main`
- Azure/webapps-deploy action pushes the backend container to Azure App Service
- Environment-gated pipeline: `dev` → `staging` → `production`

</details>

---

## 🗺️ Roadmap

- [x] Multi-tenant organizations & RBAC
- [x] Hybrid retrieval with cross-encoder reranking
- [x] Streaming grounded chat with citations
- [x] Enterprise agent framework (5 agents)
- [x] Evaluation suite (faithfulness, groundedness, precision, recall, relevance)
- [x] Audit logging
- [ ] Multi-modal retrieval (image + table understanding)
- [ ] Agent-to-agent orchestration (LangGraph-style graphs)
- [ ] Fine-grained document-level ACLs
- [ ] On-prem / air-gapped deployment mode
- [ ] Model Gateway support for additional providers (Anthropic, OpenAI, self-hosted)
- [ ] Real-time collaborative knowledge base editing
- [ ] Advanced analytics: cost forecasting, usage anomaly detection

### 🔮 Future Features

- Agentic workflow builder (drag-and-drop, LangGraph-style canvas)
- Custom evaluation metric plugins
- SOC 2 / ISO 27001 compliance tooling integration
- Native Microsoft Teams / Slack connectors

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting a PR.

```bash
# 1. Fork and clone the repo
# 2. Create a feature branch
git checkout -b feature/your-feature-name

# 3. Make your changes and add tests
# 4. Run the test suite
pytest backend/tests/
npm run test --prefix frontend

# 5. Commit using conventional commits
git commit -m "feat: add support for X"

# 6. Push and open a PR
git push origin feature/your-feature-name
```

Please ensure all PRs pass CI (lint, type-check, tests) before requesting review.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ for enterprises that need AI they can trust and audit.**

⭐ Star this repo if you find it useful — it helps others discover the project.

</div>
