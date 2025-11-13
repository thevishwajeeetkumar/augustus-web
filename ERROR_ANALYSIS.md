# Error Flow Analysis: 500 Internal Server Error

## Error Stack Trace Analysis

```
POST http://localhost:3000/api/agent/query 500 (Internal Server Error)
onSubmit @ VideoUrlForm.tsx:44
```

## Execution Flow

### 1. Frontend Request (VideoUrlForm.tsx:44)
```typescript
const res = await fetch("/api/agent/query", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ query: finalQuery, url }),
  credentials: "include",
});
```
- **Line 44**: `fetch()` is called
- **Status**: Request is sent successfully
- **No error thrown here** - fetch() succeeds even if server returns 500

### 2. API Route Processing (/api/agent/query/route.ts)

#### Step 2.1: Request Body Parsing (Lines 14-23)
- ✅ Safely wrapped in try-catch
- ✅ Returns 400 if JSON is invalid
- **Status**: Working correctly

#### Step 2.2: Query Validation (Lines 27-32)
- ✅ Validates query is present and is a string
- ✅ Returns 400 if invalid
- **Status**: Working correctly

#### Step 2.3: Cookie Parsing (Lines 37-38)
- ✅ Safely wrapped in parseCookie() with try-catch
- ✅ Returns 401 if token is missing
- **Status**: Working correctly

#### Step 2.4: API_BASE Validation (Lines 47-65)
- ✅ Validates API_BASE is set
- ✅ Validates URL format
- ✅ Returns 500 if invalid
- **Status**: Working correctly

#### Step 2.5: Backend Fetch (Lines 72-93)
- ✅ Wrapped in try-catch
- ✅ Returns 502 for connection errors
- **Potential Issue**: If fetch succeeds but backend returns error, we continue

#### Step 2.6: Response Reading (Lines 95-109)
- ✅ Wrapped in try-catch
- ✅ Returns 502 for reading errors
- **Potential Issue**: If `res.text()` returns empty string, `safeJson("")` returns `{ raw: "" }`

#### Step 2.7: Error Response Handling (Lines 111-135)
- ✅ Handles backend error responses
- ✅ Returns appropriate status codes
- **Status**: Working correctly

#### Step 2.8: Success Response (Line 146)
- ✅ Returns 200 with payload
- **Status**: Working correctly

#### Step 2.9: Outer Catch Block (Lines 147-175)
- ✅ Catches any unhandled errors
- ✅ Returns 500 with error message
- **This is where the 500 error originates**

### 3. Frontend Response Handling (VideoUrlForm.tsx:51)

```typescript
const data = (await res.json()) as AgentOk | AgentErr | { error: string; detail?: string };
```

**CRITICAL ISSUE**: This line is called BEFORE checking `if (!res.ok)`.

**Potential Problems**:
1. If API route returns 500 with valid JSON: ✅ Works fine
2. If API route returns 500 with empty body: ❌ `res.json()` throws
3. If API route returns 500 with malformed JSON: ❌ `res.json()` throws
4. If network error occurs during response reading: ❌ `res.json()` throws

## Root Cause Analysis

### Most Likely Scenarios:

#### Scenario 1: Backend Connection Failure
1. Frontend calls `/api/agent/query`
2. API route tries to fetch from backend at `http://127.0.0.1:8000/`
3. Backend is not running or unreachable
4. `fetch()` throws error (ECONNREFUSED or network error)
5. Error is caught by outer catch block (line 147)
6. Returns 500 with error message
7. Frontend receives 500 response
8. Frontend tries to parse as JSON at line 51
9. If response body is valid JSON: Works, shows error message
10. If response body is empty/malformed: `res.json()` throws, caught at line 87

#### Scenario 2: Response Reading Failure
1. Backend fetch succeeds
2. `res.text()` is called
3. Response stream is corrupted or network fails during read
4. Error caught at line 101-108
5. Returns 502 with error message
6. Frontend receives 502 response
7. Frontend tries to parse as JSON
8. Should work if error message is valid JSON

#### Scenario 3: Unhandled Exception in API Route
1. Some code in API route throws unexpected error
2. Not caught by inner try-catch blocks
3. Caught by outer catch block (line 147)
4. Returns 500 with error message
5. Frontend receives 500 response
6. Frontend tries to parse as JSON

## Why Error Occurs at VideoUrlForm.tsx:44

The error is **reported** at line 44 because:
1. That's where the `fetch()` call is made
2. Browser dev tools show the error at the fetch call site
3. However, the actual error originates in the API route

## Exact Error Timing

The error occurs **AFTER**:
- ✅ Request is sent successfully
- ✅ API route receives the request
- ✅ API route processes the request
- ✅ API route encounters an error
- ✅ API route returns 500 response

The error occurs **BEFORE**:
- ❌ Frontend can parse the response
- ❌ Frontend can display error message to user

## Fix Required

### Issue: Frontend doesn't handle non-JSON responses gracefully

**Current Code (VideoUrlForm.tsx:51)**:
```typescript
const data = (await res.json()) as AgentOk | AgentErr | { error: string; detail?: string };
```

**Problem**: If response is not valid JSON, `res.json()` throws and is caught by generic catch block.

**Solution**: Wrap `res.json()` in try-catch and handle non-JSON responses.

## Recommendations

1. **Add safe JSON parsing in frontend**:
   ```typescript
   let data;
   try {
     const text = await res.text();
     data = JSON.parse(text);
   } catch {
     data = { error: `Server returned invalid response (status ${res.status})` };
   }
   ```

2. **Check response content-type before parsing**:
   ```typescript
   const contentType = res.headers.get("content-type");
   if (!contentType?.includes("application/json")) {
     // Handle non-JSON response
   }
   ```

3. **Ensure API route always returns valid JSON**:
   - All error responses should be valid JSON
   - Empty responses should return `{}` or `{ error: "..." }`

4. **Add better error logging**:
   - Log the exact response body when errors occur
   - Log response headers
   - Log response status

