## Augustus Chat: Storage and UX Plan (Video-first, Schema 2)

### What we’re building
- ChatGPT-style conversations scoped per YouTube video (one thread per video)
- A “General” tab for cross-video queries and non-video questions (with web search fallback)
- Keep up to 5 recent conversations per user (pinned conversations are exempt)

### Why video-first + Schema 2 (efficiency-optimized)
- Fast tab rendering without joins: `video_conversations` stores denormalized previews and counts
- Fast conversation retrieval: `conversation_messages` ordered by `(conversation_id, message_index)`
- Predictable retention with `is_pinned` and `last_message_at`
- Practical tradeoff: small storage overhead for significantly better read performance

### Data model we’ll implement (summary)
- `video_conversations`
  - Keys: `conversation_id` (PK), `user_id`, `video_id` (Unique(user_id, video_id))
  - UX fields: `video_url`, `video_title`, `last_user_message`, `last_assistant_message`, `message_count`, `is_pinned`
  - Ordering/Retention: `created_at`, `last_message_at`
  - Indexes: `(user_id, is_pinned DESC, last_message_at DESC)`, `(user_id, last_message_at DESC)` and optional partial index for unpinned

- `conversation_messages`
  - Keys: `id` (PK), `(conversation_id, message_index)` Unique
  - Denormalized: `user_id`, `video_id`
  - Content: `role` ('user'|'assistant'|'system'), `content`, `content_length`, optional `tokens_estimate`, `created_at`
  - Indexes: `(conversation_id, message_index)`, `(user_id, video_id, created_at)`, `(conversation_id, created_at)`

### Tabs model
- Per-video tabs: filtered to a single `video_id`; use RAG restricted to that video
- General tab:
  - No `video_id` filter; search across all embedded user videos (namespace-wide) using integrated embeddings + rerank
  - Larger candidate pool before rerank, diversity across videos, lenient score thresholding + fallback
  - If RAG context is insufficient or the query is time-sensitive/general → use `google_search_tool`

### Retrieval behavior (current + planned)
- Per-video tab
  - Pinecone search with `filter: { video_id }`
  - Rerank via `bge-reranker-v2-m3`, diversity cap per video, context-length guard

- General tab
  - No filter; search across all user videos
  - Increase candidates (e.g., base_top_k higher), keep diversity + context-length guard
  - Keep thresholding slightly lenient; if empty after post-processing → synthesize fallback or web search

### Web search behavior
- Agent already has explicit tool protocol:
  - youtube_rag_tool returns OBSERVATION with clear next step markers
  - Time-sensitive keywords (e.g., “latest”, “today”, “2025”) trigger search guidance
  - On RAG insufficiency → instructs to call `google_search_tool`; after web results → synthesize final answer
- Ensure `GOOGLE_SEARCH_API_KEY` and `GOOGLE_SEARCH_ENGINE_ID` are set in env for this path to work

### Retention policy
- Keep all `is_pinned = true` conversations
- Among unpinned: keep top 5 by `last_message_at` per user; delete older unpinned (ON DELETE CASCADE)
- Run as a scheduled job; use partial index on unpinned for efficiency

### Write/read paths (behavioral rules)
- Write (single transaction per turn)
  - Insert into `conversation_messages` with next sequential `message_index`
  - Update parent `video_conversations`: `message_count += 1`, `last_message_at = NOW()`, update the corresponding last_*_message (truncate to 200–300 chars)

- Read
  - Tabs: single SELECT from `video_conversations` ordered by `(is_pinned DESC, last_message_at DESC)` LIMIT 5
  - Conversation: SELECT from `conversation_messages` ordered by `message_index ASC` (paginate by index if needed)

### Performance notes
- DB latency is negligible vs LLM/Pinecone when using covering/composite indexes
- Add composite indexes: `messages(session_id, message_index DESC)` for the legacy path (until fully migrated)
- For General tab, keep diversity cap and slightly larger pre-rerank `top_k` to improve recall

### Migration/implementation stance
- No historical migration required; implement fresh (only test/dummy users exist)
- Implement Schema 2 models and indexes in `database.py`
- Legacy tables `messages` and `user_sessions` are not part of the new design. They are used only by the old session-based chat flow and will be dropped once Schema 2 is fully wired into `main.py`.

### Decisions finalized (from product discussion)
- General tab: Unscoped. No advanced filters for now. It searches across all embedded videos; agent will fall back to web search when RAG is insufficient or time‑sensitive.
- Citations: Use `video_title` (not `video_id`) in answers. Trim titles to ~80–100 chars; include link; optionally add channel/date only when disambiguation is needed.
- Pinning: Pinned conversations are strictly exempt from the “last 5” limit. Show pinned + 5 most recent unpinned.
- Substring search: Defer for now (too early). Rely on semantic search + rerank. Revisit pg_trgm only if a real need emerges.

### Videos catalog (authoritative per‑video metadata)
### Videos catalog (authoritative per‑video metadata)
- Add a separate `videos_catalog` table (single source of truth per `video_id`) for General‑tab routing and UX:
  - video_id (VARCHAR(11), PK, indexed), video_title (VARCHAR(500)), channel_title (VARCHAR(300), nullable), published_at (TIMESTAMPTZ, nullable), video_url (TEXT), synopsis (TEXT, 250–300 chars), topics (TEXT[]), last_refreshed_at (TIMESTAMPTZ), embedding_version (TEXT, nullable).
  - Link to Schema 2 via `video_id`. No hard SQL FK in this iteration; the relationship is logical only to avoid cascading deletes of user conversations when catalog rows are removed.

  Note: `video_conversations.video_title` is a denormalized snapshot taken when the conversation is created or updated. It is not automatically kept in sync with `videos_catalog.video_title`, so historical conversations may show the title as it was at the time, which is acceptable for performance and UX.
- General tab routing:
  1) Match query against `videos_catalog.synopsis/topics` (keyword or tiny embedding search).
  2) Select top M video_ids (e.g., 5–10).
  3) Run dense search + rerank over chunks restricted to those video_ids.
  4) If shortlist too small, fall back to global (unfiltered) dense search.

### Pinecone embeddings for catalog shortlisting (decision logged)
- Storage: Embeddings are NOT stored in Postgres. Vectors are stored in Pinecone indexes (per AGENTS.md). Postgres continues to hold Schema 2 entities and `videos_catalog` metadata only.
- Index layout (separate indexes):
  - Chunks index: dedicated Pinecone index for RAG chunks (unchanged).
  - Catalog index: a separate Pinecone index for video synopses (clean isolation from chunks). Each record is one video’s synopsis with `_id = video_id`, `content = synopsis`, and metadata (title, topics).
  - Region/Model: `aws/us-east-1` with integrated embeddings model `llama-text-embed-v2`.
- Ingestion:
  - On creating/updating a `videos_catalog` row, upsert a catalog record into the catalog index via `upsert_records()` (batch ≤ 96) with fields `{"_id": video_id, "content": synopsis, "video_id": video_id, "video_title": ..., "topics": [...]}`.
  - Optional metadata fields in `videos_catalog`: `embedding_version` (TEXT) and `last_embedded_at` (TIMESTAMPTZ) to track freshness. No vector columns in DB.
- Retrieval flow (General tab):
  1) Shortlist videos by searching the catalog index with `inputs.text = user query` (top_k 10–20), rerank, take top M video_ids (5–10).
  2) Retrieve chunks from the chunks index restricted to those video_ids (filter or per‑video searches), with rerank + diversity caps.
  3) If context insufficient/time‑sensitive → call `google_search_tool`, then synthesize.
  4) If shortlist too small → fall back to global (unfiltered) chunk search to avoid misses.
- Performance/cost:
  - Adds one extra Pinecone search (~50–150 ms typical) per General-tab query; negligible vs LLM latency and improves chunk precision.
  - Integrated embeddings avoid client‑side vector generation overhead.

### Limits, summarization, and archival (policy) — Phase 2
- NOTE: This section is Phase 2 work. It describes future behavior and does not require schema changes or implementation in the initial Schema 2 rollout.
- Storage caps (initial targets; configurable):
  - Per user (all conversations): cap total stored messages at 600 (range 500–700). When exceeded, summarize and/or evict per the rules below.
  - Per conversation: keep the most recent 150 messages in hot storage and summarize older content.
- Time-based summaries:
  - Summarize messages older than 7 days OR older than the last 150 messages (whichever set is larger) into concise ‘system’ summaries that preserve key points, decisions, and references (with `video_title` citations).
  - Insert summary markers (e.g., “Summary of messages 0..999”) and archive covered raw messages to cold storage.
- Archival:
  - Move raw older messages to a cold storage table or object store; maintain a pointer from the conversation.
  - UI can expose a “View raw archive” option for transparency/audit.
- Eviction order (when per‑user cap exceeded):
  1) Never evict pinned conversations.
  2) Apply summarization to the oldest unpinned conversations first to reduce message count.
  3) If still over cap, evict oldest unpinned conversations by `last_message_at` (ON DELETE CASCADE clears child rows).
- Background jobs (summarization/archival) must not change `last_message_at`; it is updated only on user/assistant messages to preserve true recency ordering.
- Rationale:
  - Protects cost and performance while keeping conversational continuity.
  - Maintains high‑utility, recent context in hot storage.

### General tab retrieval defaults (explicit)
- Candidate pool before rerank: 24 (configurable; 20–32 acceptable)
- Rerank top‑N: 12 (configurable; 10–16 acceptable)
- Diversity cap per video: 10 chunks (consistent with existing defaults)
- Score thresholding: slightly lenient in General; if empty after post‑processing, synthesize from best available or switch to web search per tool instruction

### Citation format (answers)
- Use: “From: <video_title>” (trim to ~90 chars) with a compact link to the video.
- Disambiguate duplicate titles only when detected by appending channel name (and/or published date) minimally, e.g., “From: <title> — <channel>”.

### Ops runbook (retention & summarization)
- Schedule: Run daily during off‑peak hours; support manual run.
- Dry‑run mode: Report planned summaries/evictions without executing; toggle via env/flag.
- Metrics to log: `messages_reduced`, `conversations_summarized`, `conversations_evicted`, `pinned_skipped`, duration, errors.
- Alerting: Notify on job failure, repeated per‑user cap breaches, or anomalous token_estimate spikes.
- Safety: Process in small batches per user to avoid long transactions; use pagination; honor pinned exemption strictly.

### Next steps
- Implement `video_conversations` and `conversation_messages` models + constraints + indexes in `database.py`
- Wire write-path to dual actions (insert child + update parent)
- Implement retention job (pinned exempt; unpinned keep 5 by recency)
- Update endpoints/UI to:
  - Render tabs from `video_conversations`
  - Route per-video vs. General tab queries to the appropriate retrieval mode
  - Surface pin/unpin and show previews/counts

### Minor clarifications (confirm)
- Title disambiguation: OK to append channel name when duplicate titles detected? (Default: yes, only when needed)
- Default thresholds: OK to start with 600 total messages/user cap and 150 recent messages/conversation, 7‑day summary window? (All configurable)

### Documentation hygiene
- Keep `chatSchema.md` and this `plans.md` in sync. Any schema or policy change must update both documents in the same PR.

---

## Schema replacement plan (from legacy to Schema 2)

### Legacy tables to deprecate and drop
- `messages`: Previously stored per-session messages with `message_index`, `message_type`, `content`, optional `video_id`.
- `user_sessions`: Previously tracked ephemeral session state (`current_video_id`, lifecycle timestamps).

### Rationale for removal
- Schema 2 replaces session-scoped storage with video-scoped conversations (`video_conversations` + `conversation_messages`), matching the ChatGPT-style per‑video threads.
- Auth/session presence is handled via JWT/OAuth2; conversation context no longer depends on `user_sessions`.

### Bring-up (no migration required)
1) Create new tables as defined in `chatSchema.md`:
   - `videos_catalog` (authoritative per‑video metadata for routing/UX)
   - `video_conversations` (parent; one per user+video)
   - `conversation_messages` (child; chronological thread storage)
2) Ensure indexes/constraints:
   - `video_conversations`: Unique `(user_id, video_id)`; ordering index `(user_id, is_pinned DESC, last_message_at DESC)`; `(user_id, last_message_at DESC)`; optional partial index for unpinned
   - `conversation_messages`: `(conversation_id, message_index)`, `(user_id, video_id, created_at)`, `(conversation_id, created_at)`
   - `videos_catalog`: index on `video_id`; optional index on `topics`/`synopsis` if you add small embedding or keyword search
3) Switch code paths:
   - Writes: insert into `conversation_messages` + update `video_conversations` counters/ordering in the same transaction
   - Reads: tabs from `video_conversations`; full thread from `conversation_messages` by `conversation_id`
   - General-tab routing: shortlist via `videos_catalog` (synopsis/topics) → dense+rerrank over shortlisted videos; fallback to global

### Drop legacy tables (after code switch)
- Verify: No code reads/writes `messages` or `user_sessions`
- Take snapshot/backups (optional, since no real data)
- Drop order:
  1) `messages`
  2) `user_sessions` (if not needed for any remaining auth/presence)
- Confirm: foreign keys and triggers referencing these tables do not exist (none defined in current codebase)

### Operational checklist
- [ ] New tables created exactly per `chatSchema.md`
- [ ] Code paths switched to Schema 2
- [ ] Retention job deployed (pinned exempt; unpinned keep 5)
- [ ] General-tab routing uses `videos_catalog` synopsis/topics (optional cache in `video_conversations.synopsis_preview`)
- [ ] Legacy tables dropped: `messages`, `user_sessions` (unless explicitly retained for non-chat reasons)
- [ ] Dashboards/metrics updated to reflect new tables and jobs

### Questions before execution
- Do we retain `user_sessions` for any non-chat, non-auth feature (e.g., device presence analytics)? If not, we will drop it.
- For `videos_catalog` routing: start with keyword overlap only, or also add a tiny embedding index over synopses? (default: keyword first; embedding optional later)
- Any compliance/logging requirements before dropping legacy tables (even though they contain only test/dummy data)?


