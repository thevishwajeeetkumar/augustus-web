# Backend Implementation Plan: GET /chat/conversations/{conversationId}/messages

## Problem
Frontend is getting **404 Not Found** when trying to fetch message history:
```
GET /chat/conversations/{conversationId}/messages → 404
```

## Solution
Implement the endpoint in your FastAPI backend to return conversation messages.

---

## Step-by-Step Implementation

### Step 1: Add the Route Handler

**File:** `main.py` (or your FastAPI router file)

**Location:** Add after your existing chat endpoints

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from your_auth_module import get_current_user  # Your auth dependency
from your_models import ConversationMessage, VideoConversation  # Your SQLAlchemy models
from your_database import get_db  # Your database dependency

router = APIRouter()

@router.get(
    "/chat/conversations/{conversation_id}/messages",
    response_model=List[ConversationMessageResponse],
    status_code=status.HTTP_200_OK
)
async def get_conversation_messages(
    conversation_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)  # Verify authentication
):
    """
    Get all messages for a conversation.
    
    Returns messages ordered by message_index (0, 1, 2, 3...)
    """
    # Step 1: Verify conversation exists and user owns it
    conversation = db.query(VideoConversation).filter(
        VideoConversation.id == conversation_id,
        VideoConversation.user_id == current_user.id  # Verify ownership
    ).first()
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation {conversation_id} not found"
        )
    
    # Step 2: Query messages ordered by message_index
    messages = db.query(ConversationMessage).filter(
        ConversationMessage.conversation_id == conversation_id,
        ConversationMessage.user_id == current_user.id  # Extra security check
    ).order_by(ConversationMessage.message_index.asc()).all()
    
    # Step 3: Convert to response format
    return [
        ConversationMessageResponse(
            id=str(msg.id),
            conversation_id=str(msg.conversation_id),
            user_id=str(msg.user_id),
            video_id=msg.video_id,
            message_index=msg.message_index,
            role=msg.role,  # "user" | "assistant" | "system"
            content=msg.content,
            content_length=len(msg.content),
            tokens_estimate=msg.tokens_estimate,
            created_at=msg.created_at.isoformat()
        )
        for msg in messages
    ]
```

---

### Step 2: Create Response Model

**File:** `schemas.py` (or your Pydantic models file)

```python
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ConversationMessageResponse(BaseModel):
    id: str  # UUID as string
    conversation_id: str  # UUID as string
    user_id: str  # UUID as string
    video_id: str  # Video ID or "GENERAL"
    message_index: int  # Sequential: 0, 1, 2, 3...
    role: str  # "user" | "assistant" | "system"
    content: str  # The actual message text
    content_length: int  # Length of content
    tokens_estimate: Optional[int] = None  # Can be null
    created_at: str  # ISO 8601 format
    
    class Config:
        from_attributes = True
```

---

### Step 3: Register the Route

**File:** `main.py` (or your main FastAPI app file)

```python
from fastapi import FastAPI
from your_router import router  # Your router with the endpoint

app = FastAPI()

# Include the router
app.include_router(router, prefix="/api", tags=["chat"])  # Adjust prefix as needed
```

**OR if you're using a router prefix:**

```python
# If your chat routes are under /api/v2/chat
app.include_router(router, prefix="/api/v2/chat", tags=["chat"])
```

**Important:** The route path should match what the frontend expects:
- Frontend calls: `/api/chat/conversations/{id}/messages`
- Next.js proxies to: `${API_BASE}/chat/conversations/{id}/messages`
- So backend should have: `/chat/conversations/{conversation_id}/messages`

---

### Step 4: Database Query Optimization

**Add Index (if not exists):**

```python
# In your database migration or model definition
# Ensure you have an index on (conversation_id, message_index)

# SQL:
CREATE INDEX IF NOT EXISTS idx_conversation_messages_lookup 
ON conversation_messages(conversation_id, message_index);

# Or in SQLAlchemy:
from sqlalchemy import Index

Index('idx_conversation_messages_lookup', 
      ConversationMessage.conversation_id, 
      ConversationMessage.message_index)
```

---

### Step 5: Error Handling

**Complete Implementation with Error Handling:**

```python
@router.get(
    "/chat/conversations/{conversation_id}/messages",
    response_model=List[ConversationMessageResponse],
    status_code=status.HTTP_200_OK,
    responses={
        200: {"description": "Success"},
        401: {"description": "Unauthorized"},
        403: {"description": "Forbidden - user doesn't own conversation"},
        404: {"description": "Conversation not found"},
        500: {"description": "Internal server error"}
    }
)
async def get_conversation_messages(
    conversation_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        # Validate UUID format
        try:
            uuid.UUID(conversation_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid conversation_id format: {conversation_id}"
            )
        
        # Verify conversation exists and user owns it
        conversation = db.query(VideoConversation).filter(
            VideoConversation.id == conversation_id,
            VideoConversation.user_id == current_user.id
        ).first()
        
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Conversation {conversation_id} not found or you don't have access"
            )
        
        # Query messages
        messages = db.query(ConversationMessage).filter(
            ConversationMessage.conversation_id == conversation_id,
            ConversationMessage.user_id == current_user.id
        ).order_by(ConversationMessage.message_index.asc()).all()
        
        # Convert to response format
        return [
            ConversationMessageResponse(
                id=str(msg.id),
                conversation_id=str(msg.conversation_id),
                user_id=str(msg.user_id),
                video_id=msg.video_id,
                message_index=msg.message_index,
                role=msg.role,
                content=msg.content,
                content_length=len(msg.content),
                tokens_estimate=getattr(msg, 'tokens_estimate', None),
                created_at=msg.created_at.isoformat() if hasattr(msg.created_at, 'isoformat') else str(msg.created_at)
            )
            for msg in messages
        ]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching messages for conversation {conversation_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while fetching messages"
        )
```

---

## Complete Code Example

### File Structure
```
backend/
├── main.py
├── routers/
│   └── chat.py
├── models/
│   └── conversation.py
├── schemas/
│   └── conversation.py
└── dependencies/
    └── auth.py
```

### `routers/chat.py`
```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid
import logging

from ..dependencies.auth import get_current_user
from ..database import get_db
from ..models.conversation import ConversationMessage, VideoConversation
from ..schemas.conversation import ConversationMessageResponse

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get(
    "/chat/conversations/{conversation_id}/messages",
    response_model=List[ConversationMessageResponse],
    status_code=status.HTTP_200_OK
)
async def get_conversation_messages(
    conversation_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get all messages for a conversation.
    
    - **conversation_id**: UUID of the conversation
    - Returns: List of messages ordered by message_index
    - Raises 404 if conversation not found or user doesn't own it
    """
    try:
        # Validate UUID
        try:
            uuid.UUID(conversation_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid conversation_id format"
            )
        
        # Verify conversation exists and user owns it
        conversation = db.query(VideoConversation).filter(
            VideoConversation.id == conversation_id,
            VideoConversation.user_id == current_user.id
        ).first()
        
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Conversation {conversation_id} not found"
            )
        
        # Query messages ordered by message_index
        messages = db.query(ConversationMessage).filter(
            ConversationMessage.conversation_id == conversation_id,
            ConversationMessage.user_id == current_user.id
        ).order_by(ConversationMessage.message_index.asc()).all()
        
        # Convert to response format
        result = []
        for msg in messages:
            result.append(ConversationMessageResponse(
                id=str(msg.id),
                conversation_id=str(msg.conversation_id),
                user_id=str(msg.user_id),
                video_id=msg.video_id,
                message_index=msg.message_index,
                role=msg.role,
                content=msg.content,
                content_length=len(msg.content),
                tokens_estimate=getattr(msg, 'tokens_estimate', None),
                created_at=msg.created_at.isoformat() if hasattr(msg.created_at, 'isoformat') else str(msg.created_at)
            ))
        
        logger.info(f"Fetched {len(result)} messages for conversation {conversation_id}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching messages: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch messages"
        )
```

### `schemas/conversation.py`
```python
from pydantic import BaseModel
from typing import Optional

class ConversationMessageResponse(BaseModel):
    id: str
    conversation_id: str
    user_id: str
    video_id: str
    message_index: int
    role: str  # "user" | "assistant" | "system"
    content: str
    content_length: int
    tokens_estimate: Optional[int] = None
    created_at: str
    
    class Config:
        from_attributes = True
```

### `main.py` (Register Route)
```python
from fastapi import FastAPI
from routers import chat

app = FastAPI()

# Register the chat router
app.include_router(chat.router)
```

---

## Testing

### Test with curl:
```bash
# Get token first
TOKEN="your_jwt_token_here"
CONVERSATION_ID="9338ebf4-1407-46c1-b822-3f68aa42334f"

curl -X GET \
  "http://localhost:8000/chat/conversations/${CONVERSATION_ID}/messages" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json"
```

### Expected Response:
```json
[
  {
    "id": "msg-uuid-1",
    "conversation_id": "9338ebf4-1407-46c1-b822-3f68aa42334f",
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
    "conversation_id": "9338ebf4-1407-46c1-b822-3f68aa42334f",
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

---

## Checklist

- [ ] Add route handler `GET /chat/conversations/{conversation_id}/messages`
- [ ] Create `ConversationMessageResponse` Pydantic model
- [ ] Verify conversation exists and user owns it
- [ ] Query `conversation_messages` table filtered by `conversation_id`
- [ ] Order results by `message_index` ASC
- [ ] Return proper error codes (401, 403, 404, 500)
- [ ] Add database index on `(conversation_id, message_index)`
- [ ] Test with curl/Postman
- [ ] Verify frontend can now load message history

---

## Important Notes

1. **Path Matching:** 
   - Frontend calls: `/api/chat/conversations/{id}/messages`
   - Next.js proxies to: `${API_BASE}/chat/conversations/{id}/messages`
   - Backend should implement: `/chat/conversations/{conversation_id}/messages`

2. **Authentication:** 
   - Must verify user owns the conversation
   - Return 403 if user tries to access another user's conversation

3. **Ordering:** 
   - Messages MUST be ordered by `message_index` ASC (0, 1, 2, 3...)
   - Frontend expects this order

4. **Empty Array:** 
   - Return `[]` if conversation exists but has no messages
   - Return 404 only if conversation doesn't exist

5. **Response Format:** 
   - Must match `ConversationMessageResponse` exactly
   - All fields are required (except `tokens_estimate` which can be null)

---

## After Implementation

Once you implement this endpoint:
1. The 404 error will disappear
2. Frontend will load full message history
3. Users can see previous conversation context
4. Better user experience overall

The frontend is already ready and will automatically work once the backend endpoint is implemented!

