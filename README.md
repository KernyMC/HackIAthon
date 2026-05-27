# AI Projects

A collection of Artificial Intelligence projects built with **Google Agent Development Kit (ADK)**, **Gemini**, and **Google Cloud** services during the Gen AI Academy Hackathon.

---

## Projects

### [support-agent](./support-agent)

**AI Multi-Level Support Agent**

A customer support system with a sequential 3-agent pipeline. Users submit issues and the system automatically classifies them (billing / bug / feature request), provides an expert response, and generates a structured escalation report if the issue cannot be resolved.

- Framework: Google ADK `SequentialAgent`
- Agents: classifier → specialist → escalator
- UI: Gradio chat interface
- Model: Gemini 2.0 Flash / 2.5 Flash

---

### [github-analyst-assistant](./github-analyst-assistant)

**GitHub Repository Health Analyst**

An AI agent that analyzes any public GitHub repository and produces a full health report: open issue classification, PR flow velocity, contributor activity, and a scored action plan for the next 7 days.

- Framework: Google ADK `SequentialAgent`
- Agents: issues analyst → activity analyst → health reporter
- Data: GitHub REST API (issues, PRs, commits)
- Model: Gemini 2.5 Flash

---

### [doc-search](./doc-search)

**Semantic Document Search (RAG)**

Upload PDF or TXT documents and ask questions about them in natural language. Embeddings are generated natively inside AlloyDB using the built-in `embedding()` function — no external embedding API needed. Answers are grounded in retrieved document chunks.

- Framework: Google ADK + Flask REST API
- Vector DB: AlloyDB AI (`pgvector` + in-database `embedding()`)
- Pattern: RAG (Retrieval-Augmented Generation)
- Model: Gemini 2.5 Flash

---

### [task-manager-agent](./task-manager-agent)

**Personal Task Manager — Multi-Agent System**

An intelligent personal productivity assistant with 4 specialized sub-agents: task management, calendar with conflict detection, notes with semantic search, and a workflow orchestrator that combines all three for multi-step requests like weekly planning and daily standups.

- Framework: Google ADK multi-agent with `AgentTool`
- Agents: coordinator → tasks / calendar / notes / workflow
- DB: AlloyDB AI (tasks, events, notes + pgvector embeddings)
- Model: Gemini 2.5 Flash

---

### [neighbor-loop](./neighbor-loop)

**NeighborLoop — Community Item Sharing**

A Tinder-style platform where neighbors share surplus items. Gemini Vision generates a witty bio for each listed item. Other neighbors swipe right to match and receive the provider's contact info. Semantic search powered by AlloyDB AI lets users find items by description.

- Stack: Flask + Gemini Vision + AlloyDB AI + Google Cloud Storage
- Features: AI-generated item bios, swipe UI, pgvector semantic search, `ai.if()` Gemini SQL filter
- Model: Gemini 3 Flash Preview (Vision)

---

### [mcp-toolbox](./mcp-toolbox)

**MCP Toolbox — Google Cloud Release Notes**

> Note: the `toolbox` binary (159 MB) exceeds GitHub's file size limit and is excluded from this repository. The configuration file `tools.yaml` documents the setup.

An MCP (Model Context Protocol) server that exposes Google Cloud release notes from BigQuery as a callable tool for any MCP-compatible AI agent.

- Protocol: Model Context Protocol (MCP)
- Data source: `bigquery-public-data.google_cloud_release_notes`
- Tool: `search_release_notes_bq` — last 7 days of GCP release notes

---

## Tech Stack

| Technology | Role |
|---|---|
| [Google ADK](https://google.github.io/adk-docs/) | Multi-agent orchestration framework |
| Gemini 2.0 / 2.5 Flash | LLM backbone for all agents |
| AlloyDB AI | PostgreSQL + pgvector + in-database embeddings |
| Vertex AI | Managed Gemini API on Google Cloud |
| Google Cloud Run | Serverless container deployment |
| Google Cloud Storage | Object storage (images) |
| BigQuery | Analytical data warehouse (release notes) |
| MCP (Model Context Protocol) | Tool protocol for agent-data connectivity |
| Flask / Gradio | Web interfaces |

---

## Environment Variables

Each project has a `.env.example` file with the required variables. Copy it to `.env` and fill in your values before running.

| Project | Required variables |
|---|---|
| `support-agent` | `GOOGLE_CLOUD_PROJECT`, `GOOGLE_GENAI_USE_VERTEXAI` |
| `github-analyst-assistant` | `GOOGLE_API_KEY`, `GITHUB_TOKEN` |
| `doc-search` | `DATABASE_URL`, `GOOGLE_CLOUD_PROJECT` |
| `task-manager-agent` | `GOOGLE_API_KEY`, `DB_HOST`, `DB_PASSWORD` |
| `neighbor-loop` | `GEMINI_API_KEY`, `DATABASE_URL`, `GCS_BUCKET_NAME` |
# HackIAthon
# HackIAthon
