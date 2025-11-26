# Backend Implementation Checklist

Based on the latest frontend changes, here are the checkpoints you need to verify/implement in your backend.

---

## ✅ 1. V2 Chat Endpoints

### 1.1 POST `/api/v2/chat/video`

**Request Format:**
```json
{
  "conversation_id": "uuid-string",  // Optional - for existing conversations
  "video_url": "https://youtube.com/watch?v=...",  // Optional - for new conversations
  "video_id": "dQw4w9WgXcQ",  // Optional - alternative to video_url
  "query": "What is this video about?"  // Required, max 2000 chars
}
```

**Response Format (MUST MATCH EXACTLY):**
```json
{
  "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
  "video_id": "dQw4w9WgXcQ",
  "video_title": "Rick Astley - Never Gonna Give You Up",
  "user_message": "What is this video about?",
  "assistant_message": "This video is Rick Astley's...",
  "message_index": 1,
  "created_at": "2025-01-15T10:30:00.123456Z"
}
```

**Checkpoints:**
- [ ] Endpoint accepts `conversation_id`, `video_url`, or `video_id` (at least one required)
- [ ] Validates `query` is present and is a string
- [ ] Validates `query` length ≤ 2000 characters
- [ ] Returns 400 if query is missing, empty, or too long
- [ ] Returns 401 if token is missing/invalid
- [ ] Returns 403 if token lacks 'write' scope
- [ ] Returns 404 if conversation_id provided but not found
- [ ] Returns 503 if Pinecone/vector DB not configured
- [ ] Returns 504 if agent timeout (>60s)
- [ ] Creates new conversation if `conversation_id` not provided
- [ ] Returns existing conversation if `conversation_id` provided
- [ ] Response includes ALL fields: `conversation_id`, `video_id`, `video_title`, `user_message`, `assistant_message`, `message_index`, `created_at`
- [ ] `message_index` is sequential (0, 1, 2, 3...)
- [ ] `created_at` is ISO 8601 format
- [ ] Stores messages in `conversation_messages` table with correct `message_index`

---

### 1.2 POST `/api/v2/chat/general`

**Request Format:**
```json
{
  "conversation_id": "uuid-string",  // Optional - for existing conversations
  "query": "Explain machine learning from my videos"  // Required, max 2000 chars
}
```

**Response Format (SAME AS VIDEO ENDPOINT):**
```json
{
  "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
  "video_id": "GENERAL",  // ⚠️ MUST be "GENERAL" (not a real video ID)
  "video_title": "General Conversation",  // Or any title you prefer
  "user_message": "Explain machine learning from my videos",
  "assistant_message": "Based on your videos...",
  "message_index": 1,
  "created_at": "2025-01-15T10:30:00.123456Z"
}
```

**Checkpoints:**
- [ ] Endpoint accepts `conversation_id` (optional) and `query` (required)
- [ ] Validates `query` is present and is a string
- [ ] Validates `query` length ≤ 2000 characters
- [ ] Returns same error codes as video endpoint (400, 401, 403, 404, 503, 504)
- [ ] Creates new conversation if `conversation_id` not provided
- [ ] Uses `video_id = "GENERAL"` for all general conversations
- [ ] Searches across ALL user's videos (not just one)
- [ ] Response format matches video endpoint exactly
- [ ] Stores messages in `conversation_messages` table

---

## ✅ 2. Message History Endpoint

### 2.1 GET `/api/chat/conversations/{conversationId}/messages`

**Request:**
- Path parameter: `conversationId` (UUID string)
- Headers: `Authorization: Bearer <token>`

**Response Format (MUST MATCH EXACTLY):**
```json
[
  {
    "id": "msg-uuid-1",
    "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "user-uuid",
    "video_id": "dQw4w9WgXcQ",
    "message_index": 0,
    "role": "user",
    "content": "What is this video about?",
    "content_length": 25,
    "tokens_estimate": 5,
    "created_at": "2025-01-15T10:30:00.123456Z"
  },
  {
    "id": "msg-uuid-2",
    "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "user-uuid",
    "video_id": "dQw4w9WgXcQ",
    "message_index": 1,
    "role": "assistant",
    "content": "This video is about...",
    "content_length": 50,
    "tokens_estimate": 10,
    "created_at": "2025-01-15T10:30:05.123456Z"
  }
]
```

**Checkpoints:**
- [ ] Endpoint exists at `/api/chat/conversations/{conversationId}/messages`
- [ ] Requires authentication (Bearer token)
- [ ] Returns 401 if token is missing/invalid
- [ ] Returns 404 if conversation not found
- [ ] Returns 403 if user doesn't own the conversation
- [ ] Returns array of messages (can be empty array `[]`)
- [ ] Messages are ordered by `message_index` ASC (0, 1, 2, 3...)
- [ ] Each message has ALL required fields:
  - [ ] `id` (UUID string)
  - [ ] `conversation_id` (UUID string)
  - [ ] `user_id` (UUID string)
  - [ ] `video_id` (string - video ID or "GENERAL")
  - [ ] `message_index` (integer, sequential)
  - [ ] `role` ("user" | "assistant" | "system")
  - [ ] `content` (string - the actual message text)
  - [ ] `content_length` (integer)
  - [ ] `tokens_estimate` (integer or null)
  - [ ] `created_at` (ISO 8601 string)
- [ ] Messages are paired: user (even index) + assistant (odd index)
- [ ] First message is always index 0 (user), then 1 (assistant), etc.

---

## ✅ 3. Database Schema Requirements

### 3.1 Tables

**Checkpoints:**
- [ ] `video_conversations` table exists with:
  - [ ] `id` (UUID, primary key)
  - [ ] `user_id` (UUID, foreign key)
  - [ ] `video_id` (string - video ID or "GENERAL")
  - [ ] `video_title` (string)
  - [ ] `created_at` (timestamp)
  - [ ] `last_message_at` (timestamp)
  - [ ] `message_count` (integer)
  - [ ] `last_user_message` (text, nullable)
  - [ ] `last_assistant_message` (text, nullable)
  - [ ] `is_pinned` (boolean, default false)
  - [ ] Unique constraint on `(user_id, video_id)` for non-GENERAL conversations

- [ ] `conversation_messages` table exists with:
  - [ ] `id` (UUID, primary key)
  - [ ] `conversation_id` (UUID, foreign key to `video_conversations`)
  - [ ] `user_id` (UUID, foreign key)
  - [ ] `video_id` (string)
  - [ ] `message_index` (integer)
  - [ ] `role` (enum: "user", "assistant", "system")
  - [ ] `content` (text)
  - [ ] `content_length` (integer)
  - [ ] `tokens_estimate` (integer, nullable)
  - [ ] `created_at` (timestamp)
  - [ ] Unique constraint on `(conversation_id, message_index)`
  - [ ] Foreign key with ON DELETE CASCADE

- [ ] `videos_catalog` table exists (for video metadata)

### 3.2 Indexes

**Checkpoints:**
- [ ] Index on `video_conversations(user_id, is_pinned DESC, last_message_at DESC)`
- [ ] Index on `video_conversations(user_id, last_message_at DESC)`
- [ ] Index on `conversation_messages(conversation_id, message_index)`
- [ ] Index on `conversation_messages(user_id, video_id, created_at)`

---

## ✅ 4. Business Logic Requirements

### 4.1 Conversation Creation

**Checkpoints:**
- [ ] When `conversation_id` NOT provided:
  - [ ] Check if conversation exists for `(user_id, video_id)` pair
  - [ ] If exists, use existing conversation
  - [ ] If not exists, create new conversation
  - [ ] Generate UUID for `conversation_id`
  - [ ] Store in `video_conversations` table
  - [ ] Return `conversation_id` in response

- [ ] When `conversation_id` IS provided:
  - [ ] Verify conversation exists
  - [ ] Verify user owns the conversation
  - [ ] Return 404 if not found or not owned
  - [ ] Use existing conversation

### 4.2 Message Storage

**Checkpoints:**
- [ ] When storing messages:
  - [ ] Calculate next `message_index` (get max index + 1, or start at 0)
  - [ ] Store user message with even index (0, 2, 4...)
  - [ ] Store assistant message with odd index (1, 3, 5...)
  - [ ] Both messages have same `conversation_id`
  - [ ] Update `video_conversations.message_count`
  - [ ] Update `video_conversations.last_message_at`
  - [ ] Update `video_conversations.last_user_message` (truncate to 200-300 chars)
  - [ ] Update `video_conversations.last_assistant_message` (truncate to 200-300 chars)

### 4.3 Video Processing

**Checkpoints:**
- [ ] When `video_url` or `video_id` provided (new conversation):
  - [ ] Extract video ID from URL if needed
  - [ ] Check if video exists in `videos_catalog`
  - [ ] If not exists:
    - [ ] Fetch YouTube transcript
    - [ ] Translate if needed
    - [ ] Chunk the transcript
    - [ ] Embed chunks in vector DB (Pinecone)
    - [ ] Store video metadata in `videos_catalog`
  - [ ] If exists, skip embedding (already done)
  - [ ] Return video title in response

### 4.4 General Tab Logic

**Checkpoints:**
- [ ] When handling general queries:
  - [ ] Search across ALL videos in user's catalog
  - [ ] Use `video_id = "GENERAL"` for conversation
  - [ ] Aggregate context from multiple videos
  - [ ] Return response with `video_id: "GENERAL"`

---

## ✅ 5. Error Handling

**Checkpoints:**
- [ ] All endpoints return proper HTTP status codes:
  - [ ] 200 - Success
  - [ ] 400 - Bad Request (invalid input, query too long, missing fields)
  - [ ] 401 - Unauthorized (missing/invalid token)
  - [ ] 403 - Forbidden (missing 'write' scope)
  - [ ] 404 - Not Found (conversation/user not found)
  - [ ] 503 - Service Unavailable (Pinecone not configured)
  - [ ] 504 - Gateway Timeout (agent timeout >60s)

- [ ] Error responses include `detail` or `error` field:
```json
{
  "detail": "Conversation not found"  // or "error": "..."
}
```

---

## ✅ 6. Authentication & Authorization

**Checkpoints:**
- [ ] All endpoints require Bearer token in `Authorization` header
- [ ] Token is validated (JWT signature, expiration)
- [ ] User ID is extracted from token
- [ ] User ownership is verified for conversation access
- [ ] Token must have 'write' scope for chat endpoints
- [ ] Returns 401 if token invalid/missing
- [ ] Returns 403 if scope insufficient

---

## ✅ 7. Response Format Validation

**Checkpoints:**
- [ ] `ConversationResponse` format is EXACTLY:
  ```typescript
  {
    conversation_id: string;  // UUID
    video_id: string;  // Video ID or "GENERAL"
    video_title: string;  // Human-readable title
    user_message: string;  // Plain text, not object
    assistant_message: string;  // Plain text, not object
    message_index: number;  // Integer, sequential
    created_at: string;  // ISO 8601
  }
  ```

- [ ] `ConversationMessage[]` format is EXACTLY:
  ```typescript
  {
    id: string;  // UUID
    conversation_id: string;  // UUID
    user_id: string;  // UUID
    video_id: string;  // Video ID or "GENERAL"
    message_index: number;  // Integer
    role: "user" | "assistant" | "system";
    content: string;  // Plain text
    content_length: number;  // Integer
    tokens_estimate: number | null;  // Integer or null
    created_at: string;  // ISO 8601
  }[]
  ```

---

## ✅ 8. Performance Requirements

**Checkpoints:**
- [ ] First video embedding: 10-30 seconds (acceptable)
- [ ] Subsequent requests: <1 second (video already embedded)
- [ ] Message history fetch: <500ms for typical conversations
- [ ] Agent timeout: 60 seconds max
- [ ] Database queries are optimized (use indexes)
- [ ] No N+1 query problems

---

## ✅ 9. Testing Scenarios

**Checkpoints:**
- [ ] Test new video conversation creation
- [ ] Test existing conversation continuation
- [ ] Test general tab conversation
- [ ] Test message history retrieval
- [ ] Test error cases (401, 403, 404, 503, 504)
- [ ] Test query length validation (2000 char limit)
- [ ] Test video URL parsing
- [ ] Test video ID extraction
- [ ] Test conversation ownership verification
- [ ] Test message ordering (by message_index)
- [ ] Test multiple users (isolation)

---

## ✅ 10. Critical Implementation Notes

**Checkpoints:**
- [ ] **ALWAYS return `conversation_id` in response** - Frontend stores this
- [ ] **Message index must be sequential** - No gaps (0, 1, 2, 3...)
- [ ] **Messages are paired** - User (even) + Assistant (odd)
- [ ] **General tab uses `video_id = "GENERAL"`** - Not a real video ID
- [ ] **Query limit is 2000 characters** - Enforce strictly
- [ ] **ISO 8601 timestamps** - Format: `2025-01-15T10:30:00.123456Z`
- [ ] **UUID format** - All IDs must be valid UUIDs
- [ ] **Content is plain text** - Not JSON objects in `user_message`/`assistant_message`

---

## Summary

The frontend expects:
1. ✅ V2 chat endpoints (`/api/v2/chat/video` and `/api/v2/chat/general`)
2. ✅ Message history endpoint (`/api/chat/conversations/{id}/messages`)
3. ✅ Exact response formats (no deviations)
4. ✅ Proper error codes and messages
5. ✅ Sequential message indexing
6. ✅ Conversation creation/continuation logic
7. ✅ Authentication and authorization
8. ✅ Database schema with proper constraints

**Priority Order:**
1. **HIGH**: V2 chat endpoints with correct response format
2. **HIGH**: Message history endpoint
3. **MEDIUM**: Database schema and indexes
4. **MEDIUM**: Error handling
5. **LOW**: Performance optimization

