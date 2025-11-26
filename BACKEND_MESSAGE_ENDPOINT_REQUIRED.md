# Backend Endpoint Required: GET /chat/conversations/{conversationId}/messages

## Issue

The frontend is receiving a **404 Not Found** error when trying to fetch message history for conversations:

```
GET http://localhost:3001/api/chat/conversations/{conversationId}/messages
Status: 404 Not Found
```

## Current Status

✅ **Frontend is handling 404 gracefully** - Returns empty array, conversation still works  
❌ **Backend endpoint doesn't exist** - Needs to be implemented

## Required Backend Implementation

### Endpoint
```
GET /chat/conversations/{conversationId}/messages
```

### Request
- **Method:** GET
- **Path Parameter:** `conversationId` (UUID string)
- **Headers:**
  - `Authorization: Bearer <token>` (required)
  - `Content-Type: application/json`

### Response Format

**Success (200 OK):**
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

**Error Responses:**
- `401 Unauthorized` - Missing/invalid token
- `403 Forbidden` - User doesn't own the conversation
- `404 Not Found` - Conversation not found
- `500 Internal Server Error` - Server error

### Requirements

1. **Authentication:** Verify user owns the conversation
2. **Ordering:** Messages must be ordered by `message_index` ASC (0, 1, 2, 3...)
3. **Filtering:** Only return messages for the specified `conversation_id`
4. **Empty Array:** Return `[]` if conversation exists but has no messages
5. **Database Query:** Query `conversation_messages` table filtered by `conversation_id`

### Database Query Example

```sql
SELECT * 
FROM conversation_messages 
WHERE conversation_id = :conversation_id 
  AND user_id = :user_id  -- Verify ownership
ORDER BY message_index ASC;
```

## Current Frontend Behavior

- ✅ Handles 404 gracefully (returns empty array)
- ✅ Conversation still works without message history
- ✅ User can continue chatting
- ⚠️ Message history won't load until backend implements endpoint

## Impact

**Without this endpoint:**
- Conversations work fine
- Users can send/receive messages
- Message history is not displayed when selecting conversations
- New conversations start empty (expected)

**With this endpoint:**
- Full message history loads when selecting conversations
- Users can see previous conversation context
- Better user experience

## Implementation Priority

**HIGH** - This endpoint is needed for the full conversation history feature to work properly.

## Next Steps

1. Implement `GET /chat/conversations/{conversationId}/messages` in backend
2. Ensure proper authentication and authorization
3. Query `conversation_messages` table
4. Return messages ordered by `message_index`
5. Test with frontend to verify message history loads

---

**Note:** The frontend will continue to work without this endpoint, but conversation history won't be displayed until it's implemented.

