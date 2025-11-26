## Impact of Schema 2 on `main.py` (removing `messages` and `user_sessions`)

This document explains how adopting Schema 2 (`video_conversations`, `conversation_messages`, `videos_catalog`) affects the current `main.py`, and exactly where the legacy `messages` and `user_sessions` tables are used. It also clarifies what parts of `main.py` remain unchanged.

---

### 0. Relevant legacy models in `database.py`

Current DB models used in `main.py`:

- `User`
  - Fields: `id`, `username`, `email`, `hashed_password`, `is_active`, `scopes`, timestamps.
  - Used for signup, login, tokens, and admin endpoints.
- `UserSession`
  - Fields: `session_id` (PK), `user_id`, `current_video_id`, `current_video_url`, `created_at`, `last_activity`, `is_active`, `expires_at`.
  - Used to track per-user session state and “current video” context.
- `Message`
  - Fields: `id`, `session_id`, `message_index`, `message_type` (`'human'|'ai'|'system'|'tool'`), `content`, `video_id`, `tool_name`, `tool_success`, `extra_data`, `created_at`.
  - Stores per-session conversation history (sliding window).

Schema 2 introduces:

- `video_conversations` (per user+video thread)
- `conversation_messages` (per-conversation messages, ordered by `message_index`)
- `videos_catalog` (per-video metadata: title, synopsis, topics, etc.)

---

### 1. Parts of `main.py` that are **not** impacted by Schema 2

These keep using `User` and generic DB sessions, and do not touch `UserSession` or `Message`:

- Auth & user management:
  - `/signup` (`UserSignup` → `User`)
  - `/signin` (legacy JSON login) → reads `User`, verifies password, creates JWT
  - `/api/auth/login` → wraps `/signin`
  - `/token` (OAuth2 token endpoint) → uses `User` and `authenticate_user`
  - `/me` → returns current `User`
  - `/admin/users` → lists all `User`s
  - `/admin/users/{username}/scopes` → updates `User.scopes`

- Health & CORS endpoints:
  - `/health` → uses `db.execute("SELECT 1")` and Pinecone client; no `UserSession`/`Message`.
  - `/cors-test` → no DB usage beyond env introspection.

All of these can remain unchanged when we move to Schema 2.

---

### 2. Where `UserSession` is used in `main.py` (and will be removed)

**Context:** `UserSession` is only used in the Q&A pipeline, not in auth.

#### 2.1. In `answer_from_video` (STEP 1: Session Management)

Current behavior (session-based):

- Get current user:

```python
user = db.query(User).filter(User.username == current_user["username"]).first()
```

- Resolve session:

```python
session_id_input = user_input.session_id
session = None

# If client passes a specific session_id, try to resume that
if session_id_input:
    session = db.query(UserSession).filter(
        UserSession.session_id == session_id_input,
        UserSession.user_id == user.id,
        UserSession.is_active == True,
        UserSession.expires_at > datetime.utcnow()
    ).first()
```

- Auto-resume most recent active session if none provided:

```python
if not session:
    session = db.query(UserSession).filter(
        UserSession.user_id == user.id,
        UserSession.is_active == True,
        UserSession.expires_at > datetime.utcnow()
    ).order_by(UserSession.last_activity.desc()).first()
```

- Create new session if none found:

```python
if not session:
    session = UserSession(user_id=user.id)
    db.add(session)
    db.commit()
    db.refresh(session)
```

**Effect:** `UserSession` is the central “session_id” identity used for continuity and for linking to `Message`.

After Schema 2:

- We will **not** use `UserSession` at all for chat:
  - Conversation identity becomes `conversation_id` from `video_conversations`.
  - Continuity is by tab/thread (`conversation_id`), not by `session_id`.
- The `input` model should be updated to use `conversation_id` (and/or `video_id`) instead of `session_id` for continuity.

#### 2.2. Updating session state in STEP 2 (Video Embedding)

Current behavior:

- After embedding or finding an embedded video, the code updates the session:

```python
session.current_video_id = video_id
session.current_video_url = url
session.last_activity = datetime.utcnow()
db.commit()
```

This is done both when:

- Video already embedded in Pinecone.
- Video just embedded (transcript fetched and chunks upserted).

After Schema 2:

- “Current video” context will be encoded in the active `video_conversations` row (per user+video) and in the chosen tab on the frontend.
- We no longer maintain `current_video_id` or `current_video_url` on `UserSession`.
- All references to `session.current_video_id` and `session.current_video_url` must be replaced with (`conversation_id`, `video_id`) + `video_conversations` lookups.

#### 2.3. In `youtube_rag_tool` (STEP 4: Tool closures)

Current behavior:

- The tool uses a fresh DB session (`SessionLocal`) and retrieves the `UserSession` again using `session_id_str`:

```python
sess = tool_db.query(UserSession).filter(
    UserSession.session_id == session_id_str
).first()
```

- It then uses `sess.current_video_id` to decide whether to filter Pinecone search by video:

```python
if sess.current_video_id:
    query_dict["filter"] = {"video_id": sess.current_video_id}
else:
    # search across all user videos
```

After Schema 2:

- The tool should not query `UserSession` at all.
- It should receive or derive:
  - `conversation_id` and the associated `video_id` from `video_conversations`.
- Filtering should use:
  - Per-video tab: `filter: {"video_id": <this tab’s video_id>}`
  - General tab: no filter, plus optional shortlist from `videos_catalog`/catalog index.

---

### 3. Where `Message` is used in `main.py` (and will be removed)

`Message` is only used in the Q&A pipeline, for history and storage.

#### 3.1. STEP 3: Build Agent Context from DB

Current behavior:

- Fetch recent messages by `session_id`:

```python
recent_messages = db.query(Message).filter(
    Message.session_id == session.session_id
).order_by(Message.message_index.desc()).limit(10).all()
recent_messages.reverse()  # Chronological order
```

- Map to LangChain messages based on `message_type` and `content`:

```python
history = [
    HumanMessage(content=m.content) if m.message_type == 'human'
    else AIMessage(content=m.content)
    for m in recent_messages
]
```

After Schema 2:

- History must come from `conversation_messages` by `conversation_id`:

  - Filter: `conversation_messages.conversation_id == <conversation_id>`
  - Order: `message_index` descending, then reverse to chronological.
  - `role` field replaces `message_type`:
    - 'user' → `HumanMessage`
    - 'assistant' → `AIMessage`
    - 'system' → `SystemMessage` (if used later)
- No `session_id` involved.

#### 3.2. STEP 6: Store Conversation in DB

Current behavior:

- Determine next `message_index` per session:

```python
last_msg = db.query(Message).filter(
    Message.session_id == session.session_id
).order_by(Message.message_index.desc()).first()

next_index = (last_msg.message_index + 1) if last_msg else 0
```

- Insert user message and AI reply:

```python
user_msg = Message(
    session_id=session.session_id,
    message_index=next_index,
    message_type='human',
    content=query,
    video_id=current_vid
)
ai_msg = Message(
    session_id=session.session_id,
    message_index=next_index + 1,
    message_type='ai',
    content=answer,
    video_id=current_vid
)
db.add(user_msg)
db.add(ai_msg)
db.commit()
```

After Schema 2:

- Use `conversation_messages` and `video_conversations`:

  - Compute next `message_index` per `conversation_id`:

    - `last_msg = db.query(ConversationMessage).filter(conversation_id == ...).order_by(message_index.desc()).first()`

  - Insert messages:

    - user: `role='user'`, `content=query`, `video_id=<conversation’s video_id>`.
    - assistant: `role='assistant'`, `content=answer`.

  - Update parent `video_conversations` in the same transaction:

    - `message_count += 2`
    - `last_message_at = now`
    - `last_user_message` and `last_assistant_message` previews.

- `session_id` is no longer used for ordering or identity.

---

### 4. CRUD behavior: before vs after Schema 2

#### 4.1. Before (legacy `UserSession` + `Message`)

- **Create**
  - `UserSession` created on first request per user if no active session.
  - `Message` created for each user and AI turn, keyed by `session_id`.

- **Read**
  - History: last 10 `Message`s for a given `session_id`.
  - Session: `UserSession` used to remember and resume the “current video” and session.

- **Update**
  - `UserSession`: updated on each request when embedding a new video (`current_video_id`, `current_video_url`, `last_activity`).

- **Delete**
  - Not explicitly in `main.py`; comments suggest a DB trigger to clean up old messages, but that’s outside this file.

#### 4.2. After (Schema 2 + `videos_catalog`)

- **Create**
  - `video_conversations`: one per user+video, created when user starts a new thread/tab for that video.
  - `conversation_messages`: messages per conversation, ordered by `message_index`.
  - `videos_catalog`: one per video_id at ingestion (with title, synopsis, topics), also upserted into Pinecone catalog index.

- **Read**
  - Tabs: from `video_conversations` by `user_id`, ordered by `(is_pinned DESC, last_message_at DESC)`, LIMIT 5.
  - History: from `conversation_messages` by `conversation_id`, ordered by `message_index ASC`.
  - Routing (General tab): from `videos_catalog` + Pinecone catalog index (to shortlist video_ids), then from chunks index for detailed RAG.

- **Update**
  - `video_conversations`:
    - `message_count`, `last_message_at`, `last_user_message`, `last_assistant_message`.
  - `videos_catalog`:
    - Rare updates to synopsis/topics → re-embed synopsis in catalog index.

- **Delete**
  - Retention job:
    - Deletes old/unpinned `video_conversations` beyond “last 5” per user.
    - `conversation_messages` cascade delete via FK.
  - Legacy tables:
    - `messages` and `user_sessions` dropped entirely after switchover.

---

### 5. Specific `main.py` areas affected by Schema 2

1) **Input model and identifiers**
   - Current: `input` model has `session_id` for continuity.
   - After:
     - Replace/augment with `conversation_id` so frontend can target a specific conversation/tab.
     - `session_id` can be removed from Q&A flow.

2) **Session Management (STEP 1)**
   - All `UserSession` create/resume/update logic is removed.
   - Replacement:
     - Use `video_conversations`:
       - On a request with `conversation_id`: fetch that conversation and validate it belongs to the user.
       - On a request with a new `video_id` and no `conversation_id`: create a new `video_conversations` row.

3) **Video Embedding (STEP 2)**
   - Currently updates `UserSession` with `current_video_id` and `current_video_url`.
   - After:
     - Ensure `videos_catalog` entry exists (if not, create it).
     - Ensure `video_conversations` row exists for (user, video_id).
     - No `UserSession` fields are updated.

4) **Agent Context (STEP 3)**
   - Currently uses `Message` by `session_id`.
   - After:
     - Use `conversation_messages` by `conversation_id`, mapping `role` → LangChain message types.

5) **Tools & closures (STEP 4, especially `youtube_rag_tool`)**
   - Currently:
     - Looks up `UserSession` again by `session_id_str`.
     - Uses `sess.current_video_id` to decide Pinecone filter.
   - After:
     - Tools should be bound to `conversation_id`, `video_id`, and `user_id` in the closure (from `video_conversations`).
     - Filtering logic:
       - Per-video tab: filter Pinecone chunks by `video_id`.
       - General tab: no filter; use `videos_catalog` + catalog index for shortlist.

6) **Store Conversation (STEP 6)**
   - Currently:
     - Computes `next_index` per `session_id`.
     - Inserts into `Message`.
   - After:
     - Compute `next_index` per `conversation_id`.
     - Insert into `conversation_messages`.
     - Update `video_conversations` counters and previews.

7) **Response payload (STEP 7)**
   - Currently returns `session_id` for continuity.
   - After:
     - Should return `conversation_id` (and possibly `video_id`) so the frontend can maintain per-video tabs and pass the correct conversation on subsequent requests.

---

### 6. Summary of legacy table impact

- Dropping `messages` impacts:
  - History retrieval (`recent_messages` query in STEP 3).
  - Message storage (next_index calculation and inserts in STEP 6).

- Dropping `user_sessions` impacts:
  - Session creation/resume logic in STEP 1.
  - Video embedding state management (`current_video_id`, `current_video_url`, `last_activity`) in STEP 2.
  - Tool context lookup in `youtube_rag_tool` (STEP 4).
  - Response payload (`session_id` in STEP 7).

All of these responsibilities will be handled by Schema 2 constructs:

- `video_conversations` for per-video threads, tab rendering, and high-level metadata.
- `conversation_messages` for ordered conversation history.
- `videos_catalog` and the Pinecone catalog index for General-tab routing and video shortlisting.

Once Schema 2 is fully wired into `main.py`, `messages` and `user_sessions` can be safely dropped from the database.

