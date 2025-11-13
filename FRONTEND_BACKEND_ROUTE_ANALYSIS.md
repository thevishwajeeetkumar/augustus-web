# Frontend-Backend Route Analysis

## Executive Summary

This document analyzes the alignment between the frontend Next.js application and the backend FastAPI documentation. The analysis reveals several mismatches that need to be addressed.

---

## Frontend API Routes (Next.js API Routes)

These are Next.js API routes that act as proxies to the backend FastAPI server.

### ✅ Implemented & Aligned

| Frontend Route | Backend Route | Status | Notes |
|---------------|---------------|--------|-------|
| `POST /api/agent/query` | `POST /` | ✅ Aligned | Proxies Q&A endpoint with session management |
| `POST /api/auth/login` | `POST /signin` | ✅ Aligned | Uses `/signin` endpoint (JSON-based) |
| `POST /api/auth/signup` | `POST /signup` | ✅ Aligned | User registration |
| `GET /api/auth/me` | `GET /me` | ✅ Aligned | Get current user info |
| `GET /api/health` | `GET /health` | ✅ Aligned | Health check |

### ⚠️ Frontend-Only Routes (Not in Backend)

| Frontend Route | Purpose | Status | Notes |
|---------------|---------|--------|-------|
| `GET /api/auth/session` | Decode JWT token to check auth status | ⚠️ Frontend-only | Reads `augustus_token` cookie and decodes JWT. Backend doesn't have this endpoint, but it's fine - this is a frontend convenience route. |
| `POST /api/auth/logout` | Clear authentication cookie | ⚠️ Frontend-only | Clears `augustus_token` cookie. Backend doesn't have logout endpoint (JWT tokens are stateless). This is acceptable. |

---

## Frontend Pages (UI Routes)

### ✅ Implemented & Functional

| Frontend Page | Backend Support | Status | Notes |
|--------------|-----------------|--------|-------|
| `/app/videos/new` | ✅ Uses `POST /` with `url` param | ✅ Functional | Video ingestion page - works with backend Q&A endpoint |
| `/app/videos/[videoId]` | ✅ Uses `POST /` with `session_id` | ✅ Functional | Video chat page - uses Q&A endpoint for conversations |
| `/auth/sign-in` | ✅ Uses `POST /api/auth/login` | ✅ Functional | Login page |
| `/auth/sign-up` | ✅ Uses `POST /api/auth/signup` | ✅ Functional | Registration page |
| `/app/health` | ✅ Uses `GET /api/health` | ✅ Functional | Health check page |

### ❌ Missing Backend Endpoints

| Frontend Page | Expected Backend Endpoint | Current Status | Impact |
|--------------|---------------------------|----------------|--------|
| `/app/sessions` | `GET /sessions` or `GET /api/sessions` | ❌ **NOT IMPLEMENTED** | Page exists but shows empty state. Cannot list user sessions. |
| `/app/videos` | `GET /videos` or `GET /api/videos` | ❌ **NOT IMPLEMENTED** | Page exists but shows empty state. Cannot list user's analyzed videos. |

**Current Implementation:**
- `/app/sessions/page.tsx` - Shows empty state with comment: "When you expose /api/sessions (proxying FastAPI), replace this with a real fetch"
- `/app/videos/page.tsx` - Shows empty state, expects to list analyzed videos
- `SessionCard` component exists but has no data source

---

## Backend Routes NOT Implemented in Frontend

| Backend Route | Purpose | Frontend Status | Recommendation |
|--------------|---------|-----------------|----------------|
| `GET /cors-test` | Test CORS configuration | ❌ Not implemented | Low priority - debugging tool |
| `POST /token` | OAuth2 token endpoint (form-urlencoded) | ⚠️ Not used | Frontend uses `/signin` instead (JSON). This is fine. |
| `GET /admin/users` | List all users (admin only) | ❌ Not implemented | Admin panel not built yet |
| `POST /admin/users/{username}/scopes` | Update user scopes (admin only) | ❌ Not implemented | Admin panel not built yet |

---

## Critical Gaps & Recommendations

### 🔴 High Priority: Missing Session List Endpoint

**Problem:**
- Frontend has `/app/sessions` page that expects to display user sessions
- Backend manages sessions internally but doesn't expose a list endpoint
- Backend documentation shows `UserSessions` table exists with fields: `session_id`, `user_id`, `current_video_id`, `current_video_url`, `created_at`, `last_activity`, `is_active`, `expires_at`

**Backend Schema (from docs):**
```typescript
{
  session_id: UUID;
  user_id: UUID;
  current_video_id: string;
  current_video_url: string;
  created_at: DateTime;
  last_activity: DateTime;
  is_active: boolean;
  expires_at: DateTime;
}
```

**Required Backend Endpoint:**
```typescript
GET /sessions
Authorization: Bearer {token}
Response: {
  sessions: Array<{
    session_id: string;
    current_video_id: string;
    current_video_url: string;
    created_at: string;
    last_activity: string;
    is_active: boolean;
    expires_at: string;
  }>;
}
```

**Frontend Implementation Needed:**
1. Create `GET /api/sessions` Next.js API route that proxies to `GET /sessions`
2. Update `/app/sessions/page.tsx` to fetch and display sessions
3. Use existing `SessionCard` component to render sessions

---

### 🔴 High Priority: Missing Video List Endpoint

**Problem:**
- Frontend has `/app/videos` page that expects to list analyzed videos
- Backend doesn't have an endpoint to list videos
- Videos are stored in Pinecone indexes (per-user), but there's no way to list which videos have been processed

**Possible Solutions:**

**Option 1: Extract from Sessions**
- List all unique `current_video_id` values from user's sessions
- This gives a list of videos the user has interacted with

**Option 2: Backend Video Metadata Table**
- Backend would need to track video metadata separately
- Store: `video_id`, `video_url`, `title` (from YouTube), `processed_at`, `user_id`

**Option 3: Pinecone Metadata Query**
- Query Pinecone index for all unique `video_id` values in metadata
- More complex but uses existing data

**Recommended Approach:**
- **Short-term**: Use sessions to derive video list (Option 1)
- **Long-term**: Backend should add video metadata tracking (Option 2)

**Required Backend Endpoint (Option 1 - from sessions):**
```typescript
GET /videos
Authorization: Bearer {token}
Response: {
  videos: Array<{
    video_id: string;
    video_url: string;
    first_processed_at: string;
    last_activity: string;
    session_count: number;
    active_sessions: Array<{
      session_id: string;
      last_activity: string;
    }>;
  }>;
}
```

**Frontend Implementation Needed:**
1. Create `GET /api/videos` Next.js API route
2. Update `/app/videos/page.tsx` to fetch and display videos
3. Create `VideoCard` component (similar to `SessionCard`)

---

## Frontend-Backend Data Flow

### Current Working Flow

1. **User Registration:**
   ```
   Frontend: POST /api/auth/signup
   → Next.js: POST /signup (backend)
   → Response: { username, email, created_at }
   ```

2. **User Login:**
   ```
   Frontend: POST /api/auth/login
   → Next.js: POST /signin (backend)
   → Response: { access_token, token_type, expires_in }
   → Next.js: Sets httpOnly cookie "augustus_token"
   ```

3. **Video Ingestion + Q&A:**
   ```
   Frontend: POST /api/agent/query { query, url }
   → Next.js: POST / (backend) with Bearer token
   → Backend: Processes video, creates session, returns answer
   → Response: { answer, session_id, video_context }
   ```

4. **Follow-up Questions:**
   ```
   Frontend: POST /api/agent/query { query, session_id }
   → Next.js: POST / (backend) with Bearer token
   → Backend: Resumes session, returns answer
   → Response: { answer, session_id, video_context }
   ```

### Missing Flow: Session List

```
Frontend: GET /api/sessions
→ Next.js: GET /sessions (backend) ❌ DOES NOT EXIST
→ Backend: Should return user's sessions
→ Response: { sessions: [...] }
```

### Missing Flow: Video List

```
Frontend: GET /api/videos
→ Next.js: GET /videos (backend) ❌ DOES NOT EXIST
→ Backend: Should return user's analyzed videos
→ Response: { videos: [...] }
```

---

## Authentication Flow Analysis

### Current Implementation ✅

1. **Login:** Frontend uses `POST /signin` (JSON) - ✅ Correct
2. **Token Storage:** httpOnly cookie `augustus_token` - ✅ Secure
3. **Token Validation:** Frontend decodes JWT in `/api/auth/session` - ✅ Acceptable
4. **Logout:** Frontend clears cookie - ✅ Acceptable (JWT is stateless)

### Backend Alternatives Available

- `POST /token` (OAuth2 form-urlencoded) - Not used, but available
- `POST /api/auth/login` - Alias for `/signin` - Not used by frontend

**Recommendation:** Current implementation is fine. No changes needed.

---

## Type Definitions Alignment

### Frontend Types (`src/lib/types.ts`)

```typescript
export interface Session {
  session_id: string;
  user_id: string;
  current_video_id: string | null;
  current_video_url: string | null;
  is_active: boolean;
  created_at: string;
  last_activity: string;
}
```

### Backend Schema (from docs)

```typescript
{
  session_id: UUID;
  user_id: UUID;
  current_video_id: string;
  current_video_url: string;
  created_at: DateTime;
  last_activity: DateTime;
  is_active: boolean;
  expires_at: DateTime;  // ⚠️ Missing in frontend type
}
```

**Issue:** Frontend `Session` type is missing `expires_at` field.

**Recommendation:** Add `expires_at: string` to frontend `Session` interface.

---

## Summary of Required Actions

### Backend Changes Required

1. **Add `GET /sessions` endpoint**
   - Returns list of user's sessions
   - Filter by `user_id` from JWT token
   - Include: `session_id`, `current_video_id`, `current_video_url`, `created_at`, `last_activity`, `is_active`, `expires_at`
   - Authentication: Required (Bearer token with "read" scope)

2. **Add `GET /videos` endpoint** (or derive from sessions)
   - Returns list of user's analyzed videos
   - Can be derived from sessions (unique `current_video_id` values)
   - Include: `video_id`, `video_url`, `first_processed_at`, `last_activity`, `session_count`
   - Authentication: Required (Bearer token with "read" scope)

### Frontend Changes Required

1. **Create `GET /api/sessions` route**
   - Proxy to backend `GET /sessions`
   - Handle authentication cookie
   - Return sessions array

2. **Update `/app/sessions/page.tsx`**
   - Fetch sessions from `/api/sessions`
   - Render `SessionCard` components
   - Handle loading and error states

3. **Create `GET /api/videos` route**
   - Proxy to backend `GET /videos`
   - Handle authentication cookie
   - Return videos array

4. **Update `/app/videos/page.tsx`**
   - Fetch videos from `/api/videos`
   - Render video cards
   - Handle loading and error states

5. **Update `Session` type**
   - Add `expires_at: string` field

---

## Testing Checklist

Once backend endpoints are added:

- [ ] Test `GET /sessions` with valid token
- [ ] Test `GET /sessions` with invalid token (should return 401)
- [ ] Test `GET /sessions` with no sessions (should return empty array)
- [ ] Test `GET /videos` with valid token
- [ ] Test `GET /videos` with invalid token (should return 401)
- [ ] Test `GET /videos` with no videos (should return empty array)
- [ ] Test frontend `/app/sessions` page displays sessions
- [ ] Test frontend `/app/videos` page displays videos
- [ ] Test session cards link to correct video chat pages
- [ ] Test video cards link to correct video detail pages

---

## Notes

- The backend documentation shows sessions are managed internally and auto-resumed
- Sessions expire after 24 hours of inactivity
- The Q&A endpoint (`POST /`) handles session creation/resumption automatically
- Frontend doesn't need to manually create sessions - backend handles this
- Frontend only needs to **list** sessions and videos for UI purposes

---

**Last Updated:** Based on codebase analysis and backend documentation  
**Status:** Frontend routes are mostly aligned, but missing backend endpoints for session/video listing

