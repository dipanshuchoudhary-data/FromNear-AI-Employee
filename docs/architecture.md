# Architecture — FromNear AI Employee

## Agent Pipeline

```
[VendorInput]
     │
     ▼
┌──────────────┐
│  research    │  Scrapes website + Instagram → formats research_prompt
│  agent       │  → chat() → BusinessSummary + QualificationScore
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  sales       │  Reads summary + qualification + recall() from vector store
│  agent       │  → formats sales_prompt → chat() → SalesPitch
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  marketing   │  Reads summary + vendor → formats marketing_prompt
│  agent       │  → chat() → Campaign
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  validator   │  Deterministic checks (no LLM):
│  agent       │  - Pitch: name mentioned, non-trivial CTA, 3 follow-ups, no generic opener
│              │  - Campaign: ≥ min_posts
└──────┬───────┘
       │
  valid? ─────────────────────────────────────▶ END
       │ (no, retries < max)
       └──────────────────────────────────────▶ sales (retry w/ errors injected)
```

## State TypedDict

```python
class State(TypedDict, total=False):
    vendor_input: VendorInput
    vendor_id: Optional[int]
    raw_research: Optional[Dict]
    summary: Optional[BusinessSummary]
    qualification: Optional[QualificationScore]
    pitch: Optional[SalesPitch]
    campaign: Optional[Campaign]
    valid: bool
    retries: int
    errors: List[str]
```

## Validator Retry Loop

1. After `marketing` agent finishes, `validator` runs deterministic checks.
2. If **all pass** → `valid=True` → graph ends.
3. If **any fail** → `valid=False` → errors appended to `state["errors"]`.
4. If `retries < max_retries` → loop back to `sales` agent. The sales prompt includes `{errors}` so the LLM knows what to fix.
5. If `retries >= max_retries` → accept current output and end (graceful degradation).

## Memory Layer

### SQLite (SQLAlchemy + aiosqlite)

| Table | Purpose |
|---|---|
| `vendors` | Stores business info + latest run artifacts as JSON blobs |
| `interactions` | Append-only log of every pipeline run and follow-up |

### ChromaDB (Vector Store)

- Persistent on disk at `VECTOR_STORE_PATH`
- Embeddings via `embed()` function (calls Ollama `EMBED_MODEL`)
- Used by `sales_agent` to `recall()` prior pitch content
- Each document tagged with `vendor_id` for filtered retrieval
- `remember()` is called after each successful pipeline run

## LLM Client

- Single `openai.AsyncOpenAI` client pointed at `LLM_BASE_URL`
- `chat(prompt, schema)` → forces JSON output → validates with Pydantic
- `embed(texts)` → returns float vectors
- Both functions have retry-with-backoff via `tenacity`
- Zero hardcoded model names — all from settings

## Tools

`tools/scraper.py`:
- `scrape_website(url)` → `{title, meta_description, headings[], text_sample}`
- `scrape_instagram(url)` → `{bio, recent_captions[]}`
- Both return empty structs on error (never raise)
- Realistic browser User-Agent, follow redirects, 15s timeout
