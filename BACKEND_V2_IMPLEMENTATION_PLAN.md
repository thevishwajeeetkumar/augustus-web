# Backend V2 API Implementation Plan

## Executive Summary

This document outlines the migration from the current REST-style chat API to the new action-based V2 API as specified in `backend_reference`. The new API uses `/api/v2/chat/video` and `/api/v2/chat/general` endpoints with a simplified response format.

---

## Current State vs Target State

### Current Implementation (Before)

**API Structure:**
- REST-style endpoints:
  - `GET /api/chat/conversations` - List all conversations
  - `POST /api/chat/conversations` - Create new conversation
  - `GET /api/chat/conversations/[id]/messages` - Get message history
  - `POST /api/chat/conversations/[id]/messages` - Send message

**Response Format:**
```typescript
// SendMessageResponse
{
  user_message: ConversationMessage,
  assistant_message: ConversationMessage,
  conversation: VideoConversation
}

// ConversationMessage
{
  id: string,
  conversation_id: string,
  role: "user" | "assistant" | "system",
  content: string,
  message_index: number,
  created_at: string
}
```

**Flow:**
1. Load conversations list on mount
2. Select conversation → fetch message history
3. Send message → POST to messages endpoint
4. Refresh conversations list after message

**Issues:**
- Requires separate endpoints for conversations and messages
- Backend doesn't provide conversation list endpoint (frontend expects it)
- No General tab support
- Complex state management with multiple API calls

---

### Target Implementation (After)

**API Structure:**
- Action-based endpoints:
  - `POST /api/v2/chat/video` - Per-video conversations (handles new + existing)
  - `POST /api/v2/chat/general` - Cross-video queries

**Response Format:**
```typescript
// ConversationResponse
{
  conversation_id: string,  // ⚠️ STORE THIS!
  video_id: string,  // YouTube ID or "GENERAL"
  video_title: string,
  user_message: string,
  assistant_message: string,
  message_index: number,  // Sequential: 0, 1, 2, ...
  created_at: string
}
```

**Flow:**
1. Send message with `conversation_id` (if exists) or `video_url`/`video_id` (if new)
2. Backend handles conversation creation/lookup internally
3. Store `conversation_id` from response
4. Use `conversation_id` for all subsequent messages

**Benefits:**
- Single endpoint handles both new and existing conversations
- Simpler state management
- General tab support built-in
- Backend handles conversation lifecycle
- No need for conversation list endpoint

---

## Detailed Implementation Plan

### TODO 1: Update types.ts to match backend_reference

**Current Types:**
```typescript
interface SendMessageResponse {
  user_message: ConversationMessage;
  assistant_message: ConversationMessage;
  conversation: VideoConversation;
}
```

**New Types:**
```typescript
// Match backend_reference ConversationResponse
interface ConversationResponse {
  conversation_id: string;  // UUID - ⚠️ STORE THIS!
  video_id: string;  // YouTube video ID (11 chars) or "GENERAL"
  video_title: string;
  user_message: string;
  assistant_message: string;
  message_index: number;  // Sequential: 0, 1, 2, ...
  created_at: string;  // ISO 8601
}

// Request types for v2 API
interface VideoChatRequest {
  conversation_id?: string;  // For existing conversations
  video_url?: string;  // For new conversations
  video_id?: string;  // Alternative to video_url
  query: string;  // Required, max 2000 chars
}

interface GeneralChatRequest {
  conversation_id?: string;  // Optional for new
  query: string;  // Required, max 2000 chars
}
```

**Changes:**
- Add `ConversationResponse` interface
- Add `VideoChatRequest` and `GeneralChatRequest` interfaces
- Keep old types for backward compatibility (mark as deprecated)
- Update imports in components

**Files to modify:**
- `src/lib/types.ts`

---

### TODO 2: Create new API route /api/v2/chat/video

**Location:** `src/app/api/v2/chat/video/route.ts`

**Purpose:** Proxy to backend `/api/v2/chat/video` endpoint

**Request Body:**
```typescript
{
  conversation_id?: string,
  video_url?: string,
  video_id?: string,
  query: string
}
```

**Response:** `ConversationResponse`

**Error Handling:**
- 400: Invalid input, empty query, query too long (>2000 chars)
- 401: Missing/invalid token
- 403: Missing `write` scope
- 404: User or conversation not found
- 503: Pinecone not configured
- 504: Agent timeout (>60s)

**Implementation:**
- Extract Bearer token from cookie
- Validate query length (2000 chars max)
- Forward request to `${API_BASE}/api/v2/chat/video`
- Handle all error codes
- Return `ConversationResponse` on success

---

### TODO 3: Create new API route /api/v2/chat/general

**Location:** `src/app/api/v2/chat/general/route.ts`

**Purpose:** Proxy to backend `/api/v2/chat/general` endpoint for cross-video queries

**Request Body:**
```typescript
{
  conversation_id?: string,  // Optional for new
  query: string
}
```

**Response:** `ConversationResponse` (same format, `video_id` will be `"GENERAL"`)

**Error Handling:** Same as video endpoint

**Implementation:**
- Similar to video endpoint
- Forward to `${API_BASE}/api/v2/chat/general`
- Handle `video_id: "GENERAL"` in response

---

### TODO 4: Create helper functions in lib/api.ts

**New Functions:**
```typescript
/**
 * POST /api/v2/chat/video
 * Per-video conversation endpoint
 */
export async function chatVideo(req: VideoChatRequest): Promise<ConversationResponse>

/**
 * POST /api/v2/chat/general
 * Cross-video query endpoint
 */
export async function chatGeneral(req: GeneralChatRequest): Promise<ConversationResponse>
```

**Implementation:**
- Use Next.js API routes (not direct backend calls)
- Handle errors consistently
- Validate query length before sending
- Return typed responses

**Benefits:**
- Centralized error handling
- Type safety
- Consistent API usage across components

---

### TODO 5: Refactor ChatPanel to use new v2 API

**Current Implementation:**
- Uses `POST /api/chat/conversations/[id]/messages`
- Expects `SendMessageResponse` with separate message objects
- Manually constructs ChatMessage objects

**New Implementation:**
- Use `POST /api/v2/chat/video` or `/api/v2/chat/general`
- Receive `ConversationResponse` with flat structure
- Convert to ChatMessage format:
  ```typescript
  const userMsg: ChatMessage = {
    id: `user_${data.message_index - 1}`,
    role: "human",
    content: data.user_message,
    createdAt: data.created_at
  };
  const aiMsg: ChatMessage = {
    id: `ai_${data.message_index}`,
    role: "ai",
    content: data.assistant_message,
    createdAt: data.created_at
  };
  ```

**Key Changes:**
- Remove dependency on `conversationId` prop (can be null for new)
- Accept `videoId` or `videoUrl` for new conversations
- Store `conversation_id` from response in local state
- Update parent with `conversation_id` via callback
- Handle both video and general tabs

**Props Update:**
```typescript
type Props = {
  conversationId?: string | null;  // Optional now
  videoId?: string | null;  // For new conversations
  videoUrl?: string | null;  // Alternative to videoId
  videoTitle?: string;
  isGeneral?: boolean;  // true for General tab
  initialMessages?: ChatMessage[];
  onConversationCreated?: (conversationId: string, response: ConversationResponse) => void;
  onMessageSent?: () => void;
};
```

---

### TODO 6: Add General tab UI toggle and state management

**UI Changes:**
- Add tab switcher in query page header or sidebar
- Two tabs: "Video" and "General"
- Visual indicator for active tab

**State Management:**
- Add `activeTab: "video" | "general"` state
- Track `generalConversationId: string | null`
- Separate conversation IDs for video and general tabs

**Implementation:**
- Add tab component in query page
- Switch between video and general chat panels
- Maintain separate conversation state for each tab
- Show appropriate empty states

**Location:** `src/app/app/query/page.tsx`

---

### TODO 7: Update query page to handle conversation_id storage

**Current Flow:**
1. Load conversations list
2. Select conversation
3. Load messages
4. Send message

**New Flow:**
1. Start with no conversation_id
2. Send first message with `video_url` or `video_id`
3. Receive `conversation_id` from response
4. Store in state/localStorage
5. Use `conversation_id` for subsequent messages

**Key Changes:**
- Remove `loadConversations()` call (no endpoint exists)
- Remove `loadMessages()` call (messages come from responses)
- Store conversation_id in component state
- Optionally persist to localStorage for page refresh
- Build message history from responses (or fetch if needed)

**Conversation Storage Strategy:**
- Store in component state: `Map<videoId, conversationId>`
- Persist to localStorage: `{ [videoId]: conversationId }`
- Load from localStorage on mount
- Update when new conversation_id received

**Message History:**
- Option 1: Build from responses (no separate fetch)
- Option 2: Backend provides message history endpoint (if available)
- **Decision:** Start with Option 1, add Option 2 if needed

---

### TODO 8: Add query length validation (2000 chars max)

**Location:** Multiple places
- `MessageComposer` component
- `ChatPanel` before sending
- API route handlers

**Implementation:**
```typescript
const MAX_QUERY_LENGTH = 2000;

function validateQuery(query: string): { valid: boolean; error?: string } {
  if (!query.trim()) {
    return { valid: false, error: "Query cannot be empty" };
  }
  if (query.length > MAX_QUERY_LENGTH) {
    return { 
      valid: false, 
      error: `Query too long (${query.length}/${MAX_QUERY_LENGTH} characters)` 
    };
  }
  return { valid: true };
}
```

**UI Feedback:**
- Show character count in MessageComposer
- Disable send button if over limit
- Show error message if validation fails
- Trim whitespace before validation

---

### TODO 9: Handle all error codes from backend_reference

**Error Codes:**
- `400 Bad Request` - Invalid input, empty query, query too long
- `401 Unauthorized` - Missing/invalid token
- `403 Forbidden` - Missing `write` scope
- `404 Not Found` - User or conversation not found
- `503 Service Unavailable` - Pinecone not configured
- `504 Gateway Timeout` - Agent timeout (>60s)

**Error Handling Strategy:**
```typescript
if (res.status === 400) {
  // Show validation error
  setError("Invalid request. Please check your input.");
} else if (res.status === 401) {
  // Redirect to login
  signOut();
} else if (res.status === 403) {
  // Show permission error
  setError("You don't have permission to perform this action.");
} else if (res.status === 404) {
  // Start new conversation (conversation not found)
  // Clear conversation_id and retry with video_url
  handleNewConversation();
} else if (res.status === 503) {
  // Show service unavailable
  setError("Service temporarily unavailable. Please try again later.");
} else if (res.status === 504) {
  // Show timeout
  setError("Request timed out. The query may be too complex. Please try again.");
}
```

**Implementation:**
- Update all API route handlers
- Update ChatPanel error handling
- Update query page error handling
- Show user-friendly error messages

---

### TODO 10: Update ConversationSidebar to work without conversation list endpoint

**Problem:** Backend doesn't provide conversation list endpoint, but sidebar needs to show conversations.

**Solution Options:**

**Option A: Local Storage (Recommended)**
- Store conversation metadata in localStorage
- Build sidebar from stored conversations
- Update when new conversations created
- Persist across page refreshes

**Option B: Build from Message History**
- Fetch message history for known conversation_ids
- Extract conversation metadata from messages
- More complex, requires message history endpoint

**Option C: Hybrid Approach**
- Use localStorage for quick access
- Optionally fetch from backend if endpoint added later

**Implementation (Option A):**
```typescript
interface StoredConversation {
  conversation_id: string;
  video_id: string;
  video_title: string;
  last_message_at: string;
  message_count: number;
  last_user_message: string | null;
  last_assistant_message: string | null;
}

// Store in localStorage
const STORAGE_KEY = "augustus_conversations";

function saveConversation(conv: StoredConversation) {
  const stored = getStoredConversations();
  const updated = stored.filter(c => c.conversation_id !== conv.conversation_id);
  updated.push(conv);
  // Sort by last_message_at, keep last 5
  updated.sort((a, b) => 
    new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(0, 5)));
}

function getStoredConversations(): StoredConversation[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}
```

**Update ConversationSidebar:**
- Accept `conversations: StoredConversation[]` prop
- Update from localStorage on mount
- Refresh when new conversation created

---

### TODO 11: Add loading states for video processing

**Different Loading States:**
1. **First video embedding:** 10-30 seconds
   - Show: "Processing video transcript..."
   - Show progress indicator
   - Disable input

2. **Subsequent requests:** <1 second
   - Show: "Thinking..."
   - Quick spinner

3. **Agent timeout:** 60 seconds
   - Show timeout warning after 45s
   - Allow cancel

**Implementation:**
```typescript
const [processingVideo, setProcessingVideo] = React.useState(false);
const [thinking, setThinking] = React.useState(false);

// In sendToAgent
if (!conversationId) {
  // First message - video processing
  setProcessingVideo(true);
  // Show "Processing video transcript..."
} else {
  // Subsequent message - normal thinking
  setThinking(true);
  // Show "Thinking..."
}
```

**UI Updates:**
- Different loading messages
- Progress indicator for video processing
- Timeout warning
- Cancel button (optional)

---

### TODO 12: Test and verify all flows

**Test Cases:**

1. **New Video Conversation:**
   - Start with video_url
   - Receive conversation_id
   - Send follow-up message
   - Verify conversation_id persists

2. **Existing Conversation:**
   - Use stored conversation_id
   - Send message
   - Verify continuity

3. **General Tab:**
   - Switch to General tab
   - Send query
   - Receive response with video_id: "GENERAL"
   - Verify separate conversation state

4. **Error Handling:**
   - Test 400 (invalid input)
   - Test 401 (unauthorized)
   - Test 404 (conversation not found → start new)
   - Test 503 (service unavailable)
   - Test 504 (timeout)

5. **Query Validation:**
   - Test empty query
   - Test query > 2000 chars
   - Test normal query

6. **Local Storage:**
   - Create conversation
   - Refresh page
   - Verify conversation persists
   - Verify sidebar shows stored conversations

7. **Video Processing:**
   - First video embedding
   - Verify loading state
   - Verify completion

---

## Migration Strategy

### Phase 1: Add New API (Non-Breaking)
- Add new v2 API routes alongside existing ones
- Add new types without removing old ones
- Test new endpoints independently

### Phase 2: Update Components (Gradual)
- Update ChatPanel to support both old and new APIs
- Add feature flag to switch between APIs
- Test thoroughly

### Phase 3: Full Migration
- Remove old API routes
- Remove old types
- Clean up unused code

### Rollback Plan
- Keep old API routes until migration verified
- Feature flag to switch back if needed
- Maintain backward compatibility during transition

---

## Files to Create/Modify

### New Files:
1. `src/app/api/v2/chat/video/route.ts`
2. `src/app/api/v2/chat/general/route.ts`
3. `src/lib/storage.ts` (localStorage helpers)

### Modified Files:
1. `src/lib/types.ts` - Add new types
2. `src/lib/api.ts` - Add v2 helper functions
3. `src/components/chat/ChatPanel.tsx` - Refactor to use v2 API
4. `src/app/app/query/page.tsx` - Update flow and add General tab
5. `src/components/chat/ConversationSidebar.tsx` - Use localStorage
6. `src/components/chat/MessageComposer.tsx` - Add query validation

### Deprecated (Keep for now):
1. `src/app/api/chat/conversations/route.ts`
2. `src/app/api/chat/conversations/[conversationId]/messages/route.ts`

---

## Key Differences Summary

| Aspect | Old (Current) | New (V2) |
|--------|--------------|----------|
| **API Style** | REST (separate endpoints) | Action-based (single endpoint) |
| **Conversation List** | GET endpoint expected | Not provided (use localStorage) |
| **Message History** | GET endpoint | Build from responses |
| **Response Format** | Nested objects | Flat structure |
| **General Tab** | Not supported | Built-in support |
| **State Management** | Multiple API calls | Single API call per message |
| **Conversation ID** | Provided upfront | Received from first response |

---

## Success Criteria

✅ All v2 API endpoints implemented and tested  
✅ ChatPanel works with both video and general tabs  
✅ Conversation_id properly stored and used  
✅ Error handling covers all status codes  
✅ Query validation works (2000 char limit)  
✅ LocalStorage persistence works  
✅ Loading states differentiate video processing vs normal  
✅ UI shows General tab option  
✅ Backward compatibility maintained during migration  

---

## Next Steps

1. Review and approve this plan
2. Start with TODO 1 (types)
3. Implement TODOs in order
4. Test each TODO before moving to next
5. Document any deviations from plan
6. Final integration testing
7. Remove deprecated code

---

**End of Implementation Plan**

