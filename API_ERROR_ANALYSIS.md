# API Internal Server Error Analysis

## Problem
User reports "internal server error in every API" - all API routes returning 500 errors.

## Investigation Results

### APIs Tested (via curl):
- ✅ `/api/health` - **WORKS** (200 OK)
- ✅ `/api/auth/session` - **WORKS** (200 OK) 
- ✅ `/api/auth/me` - **WORKS** (401 Unauthorized - expected without token)
- ✅ `/api/auth/login` - **WORKS** (400/401 - proper error responses)
- ✅ `/api/auth/signup` - **WORKS** (200 OK)

**Conclusion**: APIs work when tested directly, suggesting the issue is:
1. Browser-specific (CORS, headers, cookies)
2. Runtime error in specific scenarios
3. Missing error handling in some routes

## Potential Root Causes (5-6 Sources)

### 1. **Missing Try-Catch in `/api/auth/session` Route**
- **Location**: `src/app/api/auth/session/route.ts`
- **Issue**: No try-catch block wrapping `cookies()` call
- **Impact**: If `cookies()` throws (Next.js 15 can throw in certain contexts), unhandled exception → 500 error
- **Evidence**: Line 30 calls `await cookies()` without error handling

### 2. **Next.js 15 `cookies()` Dynamic Usage Error**
- **Issue**: In Next.js 15, `cookies()` can throw "Dynamic server usage" errors if called incorrectly
- **Impact**: Routes using `cookies()` without proper error handling will crash
- **Affected Routes**: 
  - `/api/auth/me` (has try-catch ✅)
  - `/api/auth/session` (NO try-catch ❌)

### 3. **Request Body Already Consumed**
- **Issue**: In Next.js 15, `req.json()` can only be called once
- **Impact**: If middleware or other code reads the body, API routes will fail
- **Evidence**: Multiple routes call `await req.json()` without checking if body was consumed

### 4. **Missing Error Handling in Response Parsing**
- **Issue**: Routes call `await res.json()` without try-catch when fetching from backend
- **Impact**: If backend returns non-JSON, route crashes
- **Affected Routes**:
  - `/api/auth/me` line 31: `const data = await res.json();` (no try-catch)
  - `/api/auth/login` line 32: `const data = await res.json();` (no try-catch)
  - `/api/auth/signup` line 22: `const data = await res.json();` (no try-catch)

### 5. **Environment Variable Issues**
- **Issue**: `API_BASE` might be undefined or invalid in certain contexts
- **Impact**: Routes that use `API_BASE` will fail
- **Evidence**: `src/lib/config.ts` has validation but errors might not be caught

### 6. **Middleware Interference**
- **Issue**: Middleware might be interfering with API routes
- **Impact**: Request/response modification could cause issues
- **Evidence**: Middleware skips `/api` routes, but might still affect them

## Root Causes (1-2)

### **Root Cause #1: Missing Error Handling in `/api/auth/session` Route** (Most Likely)
- **Why**: The route calls `await cookies()` without try-catch
- **Impact**: Any error from `cookies()` causes unhandled exception → 500 error
- **Fix**: Wrap entire route handler in try-catch

### **Root Cause #2: Missing Error Handling in Backend Response Parsing** (Secondary)
- **Why**: Routes call `await res.json()` without checking if response is valid JSON
- **Impact**: If backend returns non-JSON or empty response, route crashes
- **Fix**: Add try-catch around `res.json()` calls

## Recommended Fixes

### Fix 1: Add Try-Catch to `/api/auth/session`
```typescript
export async function GET() {
  try {
    const cookieStore = await cookies();
    // ... rest of code
  } catch (err) {
    console.error("Session route error:", err);
    return NextResponse.json(
      { error: "Failed to get session. Please try again." },
      { status: 500 }
    );
  }
}
```

### Fix 2: Add Error Handling to Backend Response Parsing
```typescript
let data;
try {
  data = await res.json();
} catch (parseErr) {
  console.error("Failed to parse backend response:", parseErr);
  return NextResponse.json(
    { error: "Invalid response from backend." },
    { status: 502 }
  );
}
```

