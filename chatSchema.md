### Chat Storage Schema (Schema 2 - Efficiency Optimized)

#### Context and Objective
- Goal: ChatGPT-style interface where each conversation is scoped to a single video; retain up to 5 video conversations per user.
- Requirements:
  - Fast tab rendering (no heavy joins).
  - Quick load of a conversation thread.
  - Deterministic retention (last 5 by recency) with user override via pinning.
  - Minimal write/read queries per user action.
- Fit with current app:
  - Users and authentication remain as-is (`users` table).
  - Conversations are independent from ephemeral sessions: we persist per-video histories for UX parity with ChatGPT threads.

#### Why Schema 2
- Optimized for read performance and UX responsiveness:
  - Denormalized previews in the parent table → tabs load in one read.
  - Denormalized `user_id` and `video_id` in messages → direct user/video queries without joining parent.
  - Precomputed counters and ordering columns → no COUNT() scans or complex sorts.
- Storage tradeoff is small and justified by faster paths for hot queries.
- Clear retention semantics with `is_pinned`; predictable eviction.

---

### Finalized Data Model

#### Table: video_conversations
Purpose: One row per (user, video) conversation; used to render tabs quickly and enforce retention.

Columns
- conversation_id: UUID, PK, not null. Unique conversation identifier.
- user_id: UUID, FK to `users.id`, not null, indexed. Owner of the conversation.
- video_id: VARCHAR(11), not null, indexed. YouTube video ID (11 chars).
- video_url: TEXT, not null. Canonical video URL for direct linking.
- video_title: VARCHAR(500), not null. Stored to avoid repeated API fetches in UI.
- created_at: TIMESTAMP WITH TIME ZONE (UTC), not null. Conversation creation time.
- last_message_at: TIMESTAMP WITH TIME ZONE (UTC), not null, indexed. Sort key for recency and “last 5” logic.
- message_count: INTEGER, not null. Total messages (user+assistant) precomputed for tab stats.
- last_user_message: TEXT, nullable. Truncated preview (recommend 200–300 chars).
- last_assistant_message: TEXT, nullable. Truncated preview (recommend 200–300 chars).
- is_pinned: BOOLEAN, not null, default false, indexed. User-controlled retention override.
- synopsis_preview: TEXT, nullable. Optional cached excerpt of `videos_catalog.synopsis` for General-tab routing and previews.

Constraints
- Unique (user_id, video_id): Enforces one conversation per video per user.

Indexes (recommended)
- (user_id, is_pinned DESC, last_message_at DESC): Primary index for tab ordering and “last 5 with pins” display.
- (user_id, last_message_at DESC): Efficient “last 5 unpinned” query.
- Optional partial index: (user_id, last_message_at DESC) WHERE is_pinned = false → accelerates eviction over unpinned rows.

Behavioral notes
- Previews (last_user_message / last_assistant_message) are truncated on write, not recalculated on read.
- `last_message_at` is updated atomically with user/assistant message inserts to guarantee correct ordering. Background jobs (summarization, archival, retention) MUST NOT modify `last_message_at`.

---

#### Table: conversation_messages
Purpose: All messages for a conversation in strict chronological order.

Columns
- id: UUID, PK, not null. Unique message identifier.
- conversation_id: UUID, FK to `video_conversations.conversation_id` (ON DELETE CASCADE), not null. Conversation linkage.
- user_id: UUID, not null, indexed. Denormalized from parent for direct user queries without joins.
- video_id: VARCHAR(11), not null, indexed. Denormalized from parent for direct video queries without joins.
- message_index: INTEGER, not null. Sequential order within the conversation (0, 1, 2…).
- role: VARCHAR(10), not null. One of 'user', 'assistant', 'system'.
- content: TEXT, not null. Full message text.
- content_length: INTEGER, not null. Precomputed character length for heuristics/limits.
- tokens_estimate: INTEGER, nullable. Optional rough token count for cost and context budgeting.
- created_at: TIMESTAMP WITH TIME ZONE (UTC), not null. Message timestamp.

Constraints
- Unique (conversation_id, message_index): Ensures deterministic ordering and prevents duplicates.
- CHECK role IN ('user','assistant','system'): Guards role correctness.

Indexes (recommended)
- (conversation_id, message_index): Primary path for chronological retrieval.
- (conversation_id, created_at): Time-range queries within the same conversation.
- (user_id, video_id, created_at): Direct user/video lookups without parent join.
- Optional covering index if you often fetch latest N: (conversation_id, created_at DESC) INCLUDE (role, content).

Behavioral notes
- `message_index` must be assigned sequentially and atomically per conversation.
- Denormalized `user_id` and `video_id` enable flexible query patterns without parent join cost.

---

### Retention and Eviction Policy

Policy
- Keep all conversations where `is_pinned = true`.
- Among unpinned conversations for a user, keep the most recent 5 by `last_message_at`.
- Delete older unpinned conversations (ON DELETE CASCADE removes messages).

Performance tip
- Use the partial index on unpinned to speed the eviction scan: (user_id, last_message_at DESC) WHERE is_pinned = false.

Operator guidance
- Run retention as a scheduled background job (e.g., every hour/day).
- Eviction should be deterministic: filter by user, sort unpinned by `last_message_at`, keep top 5, delete the rest.

---

### Read/Write Paths (Behavioral Guidance)

Write path (on each new message)
- Insert one row into `conversation_messages` with:
  - Next `message_index` (sequential, 0-based).
  - Denormalized `user_id` and `video_id` from the conversation.
  - `content_length` and (optional) `tokens_estimate` precomputed in the app layer.
- In the same transaction, update parent `video_conversations`:
  - `message_count += 1`
  - `last_message_at = NOW()`
  - Set `last_user_message` or `last_assistant_message` to the truncated content based on role.

Read path (tabs)
- Query `video_conversations` by `user_id` ordered by `(is_pinned DESC, last_message_at DESC)`, limit 5.
- Use the fields already present (title, previews, `message_count`) — no join required.

Read path (full conversation)
- Query `conversation_messages` by `conversation_id` ordered by `message_index ASC`.
- Support pagination via `message_index` if needed.

---

### Implementation Plan (Where and How in database.py)

Scope
- This schema lives in `database.py` alongside `users`.
- Legacy tables `messages` and `user_sessions` are not part of Schema 2. They are used only by the old session-based chat flow and will be dropped once Schema 2 is fully wired into `main.py`.
- No migration required (fresh adoption; only test/dummy users exist).

Model definitions
- Add two ORM models:
  - `video_conversations` (parent)
  - `conversation_messages` (child)
- Ensure:
  - Parent has the columns, constraints, and indexes listed above.
  - Child references parent with ON DELETE CASCADE (so deleting a conversation removes its messages).

Indexes and constraints
- Create the exact composite unique constraint `(user_id, video_id)` on `video_conversations`.
- Create composite indexes:
  - `video_conversations`: `(user_id, is_pinned DESC, last_message_at DESC)` and `(user_id, last_message_at DESC)`.
  - `conversation_messages`: `(conversation_id, message_index)`, `(user_id, video_id, created_at)`, `(conversation_id, created_at)`.
- Optional partial index (database-level) on `video_conversations` WHERE `is_pinned = false` to accelerate eviction.

Application responsibilities
- Truncate previews (last_user_message / last_assistant_message) at write time to a fixed length (e.g., 200–300 chars).
- Assign `message_index` sequentially using the latest index per conversation (read last index then +1), inside a transaction.
- Update parent counters/ordering in the same transaction as the message insert.

Retention executor (outside database.py)
- Scheduled background task:
  - For each user, select pinned conversations → keep.
  - For each user, select unpinned by `last_message_at` → keep top 5, delete older unpinned.
- Rely on ON DELETE CASCADE for cleanup of `conversation_messages`.

---

### Verification Checklist (Use Before Shipping)

Schema
- [ ] `video_conversations` has all columns listed above, with Unique(user_id, video_id).
- [ ] `conversation_messages` has Unique(conversation_id, message_index) and proper CHECK on role.
- [ ] ON DELETE CASCADE is active on `conversation_messages.conversation_id`.

Indexes
- [ ] `video_conversations`: (user_id, is_pinned DESC, last_message_at DESC).
- [ ] `video_conversations`: (user_id, last_message_at DESC).
- [ ] Optional partial: (user_id, last_message_at DESC) WHERE is_pinned = false.
- [ ] `conversation_messages`: (conversation_id, message_index).
- [ ] `conversation_messages`: (user_id, video_id, created_at).
- [ ] `conversation_messages`: (conversation_id, created_at) or (conversation_id, created_at DESC) INCLUDE (role, content) if needed.

Write path
- [ ] Messages inserted with proper sequential `message_index`.
- [ ] Parent updated in the same transaction (message_count, last_message_at, preview fields).
- [ ] Previews are truncated at write time.

Read path
- [ ] Tabs loaded via `video_conversations` only (LIMIT 5 by ordering index).
- [ ] Full conversation loaded via `conversation_messages` ordered by `message_index`.

Retention
- [ ] Scheduled job keeps pinned; among unpinned, keeps last 5 by `last_message_at`.
- [ ] Deletes older unpinned conversations; child rows cascade.

Operational
- [ ] Concurrency-safe conversation creation (enforce Unique(user_id, video_id) under contention).
- [ ] Optional size controls documented (max message_count; summarize-and-archive strategy if needed later).

---

### Notes and Future Extensions
- Search: If substring search is needed later, consider pg_trgm indexes on `content` (be mindful of storage cost).
- Favorites vs Pinning: If you want separate user features, add a small `user_favorites(user_id, conversation_id)` table and keep `is_pinned` strictly for retention override.
- Analytics: Build rollups offline (materialized views or a warehouse), not in the OLTP path, to keep this schema fast.

This document is the source of truth for Schema 2. Keep it in sync with `database.py` and any retention job logic used in the application.

---

### Videos Catalog (Authoritative per-video metadata for routing)

Purpose: Single source of truth per `video_id` to store concise summaries and topics used for General-tab routing and UX. Avoids duplicating summaries per user and prevents drift.

Table: `videos_catalog`
- video_id: VARCHAR(11), PK, not null, indexed. YouTube video ID.
- video_title: VARCHAR(500), not null. Canonical title (used in citations).
- channel_title: VARCHAR(300), nullable. For optional disambiguation.
- published_at: TIMESTAMP WITH TIME ZONE, nullable. Optional for disambiguation.
- video_url: TEXT, not null. Canonical URL.
- synopsis: TEXT, not null, 250–300 chars. Concise 2–3 sentence summary for routing/UX (not used as LLM context).
- topics: TEXT[], not null. 5–10 compact tags for routing.
- embedding_version: TEXT, nullable. Optional embedding version tag to support re-embedding workflows.
- last_refreshed_at: TIMESTAMP WITH TIME ZONE, not null. When the synopsis/topics were last generated.

Linkage with Schema 2:
- `video_conversations.video_id` references the same `video_id` logically. In this iteration, we **do not** create a hard SQL FOREIGN KEY constraint between these tables, to avoid cascading deletions of user conversations when a catalog row is removed (e.g., DMCA takedown). The relationship is enforced at the application level.

General tab routing flow:
1) Match user query against `videos_catalog.synopsis` and/or `topics` (keyword overlap or small embedding index over synopses).
2) Select top M `video_id`s (e.g., 5–10).
3) Run standard dense search + rerank over chunks restricted to those video_ids.
4) If shortlist is too small, fall back to global (unfiltered) dense search.

Notes:
- Keep synopsis neutral and factual; refresh only if ingestion materially changes.
- Do not inject synopsis into the final LLM context; use retrieved chunks only.

#### Pinecone embeddings for catalog shortlist (adopted)
- Vectors are stored in Pinecone (not Postgres). Postgres continues to store Schema 2 entities and `videos_catalog` metadata only.
- Index layout (separate indexes):
  - Chunks index: dedicated Pinecone index for RAG chunks (unchanged).
  - Catalog index: separate Pinecone index for video synopses. Each record represents a single video synopsis with `_id = video_id`, `content = synopsis`, and metadata (e.g., `video_title`, `topics`).
  - Region/Model: `aws/us-east-1` with integrated embeddings model `llama-text-embed-v2`.
  - Use integrated embeddings via `upsert_records()` (batch ≤ 96) for catalog ingestion.
- Optional tracking fields in `videos_catalog`:
  - `embedding_version` (TEXT) and `last_embedded_at` (TIMESTAMPTZ) to track embedding freshness (no vector columns).
- Retrieval (General tab):
  1) Search the catalog index with `query.inputs.text = user query` (top_k 10–20), rerank, keep top 5–10 `video_id`s.
  2) Run dense search + rerank over the chunks index restricted to those video_ids (with diversity caps).
  3) If insufficient or time‑sensitive, use `google_search_tool`; else synthesize.
  4) If shortlist too small, fall back to global (unfiltered) chunk search.

---

### Phase 2: Summarization and archival (future work)

Summarization/archival policies (caps, age-based summaries, cold storage) are defined behaviorally in `plans.md` but are **Phase 2** and intentionally not modeled in this schema yet. When we implement those jobs, we may extend `conversation_messages` (e.g., special roles/flags for summary messages and pointers to cold storage) in a subsequent schema revision.