# Changes Summary: Backend V2 API Migration

## Overview

This document summarizes the changes from the current REST-style API implementation to the new action-based V2 API as specified in `backend_reference`.

---

## What Was Previous (Current Codebase)

### API Architecture
- **Style:** RESTful API with resource-based endpoints
- **Endpoints:**
  - `GET /api/chat/conversations` - List all conversations
  - `POST /api/chat/conversations` - Create new conversation
  - `GET /api/chat/conversations/[id]/messages` - Get message history
  - `POST /api/chat/conversations/[id]/messages` - Send message

### Data Flow
1. **On Page Load:**
   - Fetch list of conversations from backend
   - Display in sidebar
   - Auto-select first conversation

2. **On Conversation Select:**
   - Fetch message history for selected conversation
   - Display messages in chat panel

3. **On Send Message:**
   - POST to `/api/chat/conversations/[id]/messages`
   - Receive separate `user_message` and `assistant_message` objects
   - Update UI with new messages
   - Refresh conversations list to update previews

### Response Format
```typescript
// SendMessageResponse
{
  user_message: {
    id: string,
    conversation_id: string,
    role: "user",
    content: string,
    message_index: number,
    created_at: string
  },
  assistant_message: {
    id: string,
    conversation_id: string,
    role: "assistant",
    content: string,
    message_index: number,
    created_at: string
  },
  conversation: {
    conversation_id: string,
    video_id: string,
    video_title: string,
    message_count: number,
    last_message_at: string,
    // ... other fields
  }
}
```

### State Management
- **Conversations:** Fetched from backend on mount
- **Messages:** Fetched separately when conversation selected
- **Conversation ID:** Known upfront (from list or creation)
- **Multiple API Calls:** Required for full conversation view

### Limitations
- ❌ Requires conversation list endpoint (backend doesn't provide)
- ❌ No General tab support
- ❌ Complex state management with multiple API calls
- ❌ Separate endpoints for different operations
- ❌ Message history requires separate fetch

---

## What Is New (V2 API Implementation)

### API Architecture
- **Style:** Action-based API with single-purpose endpoints
- **Endpoints:**
  - `POST /api/v2/chat/video` - Per-video conversations (handles new + existing)
  - `POST /api/v2/chat/general` - Cross-video queries

### Data Flow
1. **On Page Load:**
   - Load conversations from localStorage (if any)
   - Display in sidebar
   - No initial API call needed

2. **On Send First Message:**
   - POST to `/api/v2/chat/video` with `video_url` or `video_id`
   - Backend creates conversation internally
   - Receive `conversation_id` in response
   - Store `conversation_id` for subsequent messages

3. **On Send Subsequent Messages:**
   - POST to `/api/v2/chat/video` with `conversation_id`
   - Backend handles conversation lookup
   - Receive response with new messages
   - Update UI directly from response

### Response Format
```typescript
// ConversationResponse (simplified, flat structure)
{
  conversation_id: string,  // ⚠️ STORE THIS!
  video_id: string,  // YouTube ID or "GENERAL"
  video_title: string,
  user_message: string,  // Direct string, not object
  assistant_message: string,  // Direct string, not object
  message_index: number,  // Sequential: 0, 1, 2, ...
  created_at: string
}
```

### State Management
- **Conversations:** Stored in localStorage, updated on new conversations
- **Messages:** Built from responses (no separate fetch needed)
- **Conversation ID:** Received from first response, stored in state
- **Single API Call:** Per message, handles everything

### New Features
- ✅ General tab support (`/api/v2/chat/general`)
- ✅ Simplified API (single endpoint per action)
- ✅ Backend handles conversation lifecycle
- ✅ No conversation list endpoint needed
- ✅ Message history built from responses
- ✅ Query validation (2000 char limit)
- ✅ Better error handling (all status codes)
- ✅ Loading states for video processing

---

## Detailed Comparison

### 1. API Endpoints

| Operation | Old (Current) | New (V2) |
|-----------|---------------|----------|
| **List Conversations** | `GET /api/chat/conversations` | Not provided (use localStorage) |
| **Create Conversation** | `POST /api/chat/conversations` | Included in first message |
| **Get Messages** | `GET /api/chat/conversations/[id]/messages` | Build from responses |
| **Send Message** | `POST /api/chat/conversations/[id]/messages` | `POST /api/v2/chat/video` |
| **General Queries** | Not supported | `POST /api/v2/chat/general` |

### 2. Request Format

**Old:**
```typescript
// Create conversation
POST /api/chat/conversations
{ videoUrl: string }

// Send message
POST /api/chat/conversations/[id]/messages
{ content: string }
```

**New:**
```typescript
// Send message (new or existing)
POST /api/v2/chat/video
{
  conversation_id?: string,  // Optional, for existing
  video_url?: string,  // For new conversations
  video_id?: string,  // Alternative to video_url
  query: string  // Required
}

// General queries
POST /api/v2/chat/general
{
  conversation_id?: string,  // Optional
  query: string  // Required
}
```

### 3. Response Format

**Old:**
```typescript
{
  user_message: ConversationMessage,  // Full object
  assistant_message: ConversationMessage,  // Full object
  conversation: VideoConversation  // Full object
}
```

**New:**
```typescript
{
  conversation_id: string,  // Simple string
  video_id: string,
  video_title: string,
  user_message: string,  // Just the content
  assistant_message: string,  // Just the content
  message_index: number,
  created_at: string
}
```

### 4. Conversation Management

**Old:**
- Frontend fetches conversation list
- Frontend creates conversation explicitly
- Frontend tracks conversation IDs
- Multiple API calls for setup

**New:**
- Backend handles conversation creation/lookup
- Frontend receives `conversation_id` from first response
- Frontend stores `conversation_id` for reuse
- Single API call handles everything

### 5. Message History

**Old:**
- Separate endpoint to fetch message history
- Requires additional API call
- Full message objects with metadata

**New:**
- Build history from responses
- No separate fetch needed
- Simpler message structure

### 6. Error Handling

**Old:**
- Basic error handling
- Generic error messages
- Limited status code coverage

**New:**
- Comprehensive error handling
- Specific messages for each status code:
  - 400: Invalid input
  - 401: Unauthorized
  - 403: Forbidden (missing scope)
  - 404: Conversation not found
  - 503: Service unavailable
  - 504: Timeout
- Better user feedback

### 7. General Tab Support

**Old:**
- ❌ Not supported
- Only per-video conversations

**New:**
- ✅ Full support via `/api/v2/chat/general`
- Separate conversation for cross-video queries
- `video_id: "GENERAL"` in responses
- UI toggle between Video and General tabs

### 8. Query Validation

**Old:**
- No validation
- No character limit

**New:**
- ✅ 2000 character limit
- Validation before sending
- UI feedback (character count)
- Error messages for invalid queries

### 9. Loading States

**Old:**
- Generic "Thinking..." state
- No differentiation

**New:**
- ✅ "Processing video transcript..." for first embedding (10-30s)
- ✅ "Thinking..." for normal requests (<1s)
- ✅ Timeout warning after 45s
- Better user experience

### 10. Local Storage

**Old:**
- Not used for conversations
- Relies on backend for persistence

**New:**
- ✅ Stores conversation metadata in localStorage
- ✅ Persists across page refreshes
- ✅ Builds sidebar from stored data
- Works without conversation list endpoint

---

## Code Changes Summary

### Files Created
1. `src/app/api/v2/chat/video/route.ts` - New video chat endpoint
2. `src/app/api/v2/chat/general/route.ts` - New general chat endpoint
3. `src/lib/storage.ts` - LocalStorage helpers for conversations
4. `BACKEND_V2_IMPLEMENTATION_PLAN.md` - Implementation plan
5. `CHANGES_SUMMARY.md` - This document

### Files Modified
1. `src/lib/types.ts` - Add `ConversationResponse`, `VideoChatRequest`, `GeneralChatRequest`
2. `src/lib/api.ts` - Add `chatVideo()` and `chatGeneral()` helper functions
3. `src/components/chat/ChatPanel.tsx` - Refactor to use v2 API
4. `src/app/app/query/page.tsx` - Update flow, add General tab, localStorage integration
5. `src/components/chat/ConversationSidebar.tsx` - Use localStorage instead of API
6. `src/components/chat/MessageComposer.tsx` - Add query validation

### Files Deprecated (Keep for backward compatibility)
1. `src/app/api/chat/conversations/route.ts` - Old REST endpoints
2. `src/app/api/chat/conversations/[conversationId]/messages/route.ts` - Old message endpoints

---

## Migration Benefits

### For Users
- ✅ Faster initial load (no conversation list fetch)
- ✅ Simpler UI flow
- ✅ General tab for cross-video queries
- ✅ Better error messages
- ✅ Query validation prevents errors

### For Developers
- ✅ Simpler API (fewer endpoints)
- ✅ Less state management complexity
- ✅ Backend handles conversation lifecycle
- ✅ Better error handling
- ✅ Easier to test

### For System
- ✅ Fewer API calls per operation
- ✅ Reduced backend load
- ✅ Better scalability
- ✅ Simpler architecture

---

## Breaking Changes

### API Changes
- ❌ Conversation list endpoint no longer available
- ❌ Message history endpoint no longer available
- ❌ Response format changed (flat vs nested)

### Component Changes
- ❌ `ChatPanel` props changed (conversationId optional)
- ❌ `query/page.tsx` flow changed (no initial fetch)
- ❌ `ConversationSidebar` now uses localStorage

### Migration Required
- Update all components using old API
- Update state management
- Update error handling
- Test all flows

---

## Backward Compatibility

### During Migration
- Keep old API routes active
- Add feature flag to switch between APIs
- Gradual migration component by component
- Rollback plan in place

### After Migration
- Remove old API routes
- Remove deprecated types
- Clean up unused code

---

## Testing Checklist

- [ ] New video conversation creation
- [ ] Existing conversation continuation
- [ ] General tab queries
- [ ] Conversation ID persistence
- [ ] LocalStorage storage/retrieval
- [ ] Error handling (all status codes)
- [ ] Query validation (2000 char limit)
- [ ] Loading states (video processing vs normal)
- [ ] Page refresh persistence
- [ ] Multiple conversations
- [ ] Tab switching (Video ↔ General)

---

## Conclusion

The V2 API implementation represents a significant simplification and improvement over the current REST-style API. The new approach:

1. **Reduces complexity** - Single endpoint per action
2. **Improves performance** - Fewer API calls
3. **Adds features** - General tab support
4. **Better UX** - Improved loading states and error handling
5. **Easier maintenance** - Simpler codebase

The migration requires careful planning and testing, but the benefits justify the effort.

---

**End of Changes Summary**

