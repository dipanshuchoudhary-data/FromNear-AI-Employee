# Configuration Guide

## Overview

**All configuration lives in `backend/.env`.** No model names, URLs, or provider strings are hardcoded anywhere in the codebase. To switch LLM providers, edit `.env` and restart the backend.

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `LLM_BASE_URL` | ✅ | — | Base URL of the OpenAI-compatible API endpoint |
| `CHAT_MODEL` | ✅ | — | Model name for chat completions (must be pulled in Ollama) |
| `EMBED_MODEL` | ✅ | — | Model name for text embeddings |
| `DATABASE_URL` | ✅ | — | Async SQLAlchemy DB URL (use `sqlite+aiosqlite:///./data.db`) |
| `VECTOR_STORE_PATH` | ✅ | — | Directory path where ChromaDB persists data |
| `CORS_ORIGINS` | ✅ | — | Comma-separated list of allowed frontend origins |
| `MAX_RETRIES` | ❌ | `2` | Max validator retry attempts before accepting output |
| `MIN_CAMPAIGN_POSTS` | ❌ | `5` | Minimum number of posts required in a campaign |

---

## Ollama (Local, Recommended)

1. Install Ollama from [ollama.com](https://ollama.com)
2. Pull your models:
   ```bash
   ollama pull llama3.2          # or mistral, phi3, qwen2.5, etc.
   ollama pull nomic-embed-text  # or mxbai-embed-large
   ```
3. Configure `.env`:
   ```env
   LLM_BASE_URL=http://localhost:11434/v1
   CHAT_MODEL=llama3.2
   EMBED_MODEL=nomic-embed-text
   ```

Ollama exposes an OpenAI-compatible `/v1` endpoint — no other changes needed.

---

## Other OpenAI-Compatible Runtimes

### LM Studio
```env
LLM_BASE_URL=http://localhost:1234/v1
CHAT_MODEL=<model-name-shown-in-lm-studio>
EMBED_MODEL=<embedding-model-name>
```

### vLLM
```env
LLM_BASE_URL=http://localhost:8080/v1
CHAT_MODEL=<model-id>
EMBED_MODEL=<embedding-model-id>
```

### OpenAI (cloud fallback)
```env
LLM_BASE_URL=https://api.openai.com/v1
CHAT_MODEL=gpt-4o
EMBED_MODEL=text-embedding-3-small
```
> Note: You'd also need to set `api_key` in the client. For local use with Ollama, the key is ignored.

---

## Full `.env` Example

```env
LLM_BASE_URL=http://localhost:11434/v1
CHAT_MODEL=llama3.2
EMBED_MODEL=nomic-embed-text
DATABASE_URL=sqlite+aiosqlite:///./data.db
VECTOR_STORE_PATH=./vector_store
CORS_ORIGINS=http://localhost:5173
MAX_RETRIES=2
MIN_CAMPAIGN_POSTS=5
```

---

## Frontend Config

Frontend reads from `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

If your backend runs on a different port or host, update this value.
