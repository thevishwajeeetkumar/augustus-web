# App Crash Analysis

## Root Cause: JSON Serialization Error

The app crashed due to attempting to `JSON.stringify()` an Error object directly, which is not possible in JavaScript because Error objects contain non-enumerable properties and circular references.

### The Problem

**Location**: `src/app/api/agent/query/route.ts` line 180 (original code)

```typescript
const errorDetails = {
  error: err,  // ❌ Error objects cannot be JSON.stringify'd
  errorType: err?.constructor?.name,
  errorMessage: err instanceof Error ? err.message : String(err),
  // ...
};

console.error(JSON.stringify(errorDetails, null, 2)); // ❌ This would crash
```

When an error occurred in the API route handler, the code tried to serialize the entire Error object, causing:
- **TypeError**: Converting circular structure to JSON
- **App crash**: The error handler itself threw an error, causing the entire request to fail

### Additional Issues Found

1. **Headers Serialization** (line 16):
   - `Object.fromEntries(req.headers.entries())` could potentially fail with certain header values
   - Fixed by safely iterating headers with `forEach()`

2. **Variable Name Conflict**:
   - `errorMessage` was declared twice in the catch block
   - Fixed by renaming the first declaration to `rawErrorMessage`

## Changes Made

### 1. Fixed Error Serialization
```typescript
// Before (CRASHES):
const errorDetails = {
  error: err,  // ❌ Cannot serialize Error object
  // ...
};

// After (SAFE):
const rawErrorMessage = err instanceof Error ? err.message : String(err);
const errorDetails = {
  errorType,
  errorMessage: rawErrorMessage,  // ✅ Only serializable properties
  errorStack,
  // ...
};
```

### 2. Fixed Headers Logging
```typescript
// Before (POTENTIALLY UNSAFE):
console.log("Request headers:", Object.fromEntries(req.headers.entries()));

// After (SAFE):
try {
  const headersObj: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    headersObj[key] = value;
  });
  console.log("Request headers:", headersObj);
} catch (headerErr) {
  console.log("Could not log headers:", headerErr);
}
```

### 3. Fixed Variable Naming Conflict
- Renamed first `errorMessage` to `rawErrorMessage` to avoid shadowing

## Impact

- **Before**: App would crash completely when any error occurred in the API route
- **After**: Errors are properly logged and handled, with detailed error information available in development mode

## Testing Recommendations

1. Test error scenarios:
   - Backend server not running
   - Invalid request body
   - Missing authentication token
   - Network failures

2. Verify error logs appear correctly in the console

3. Check that error responses are properly formatted JSON

## Font Preload Warning (Non-Critical)

The warning about `4cf2300e9c8272f7-s.p.woff2` is a Next.js optimization warning, not a crash cause:
- Font was preloaded but not used immediately
- This is a performance optimization issue, not a functional problem
- Can be ignored or fixed by adjusting font loading strategy

## Prevention

To prevent similar issues in the future:
1. Never try to `JSON.stringify()` Error objects directly
2. Always extract Error properties (message, stack, name) before serialization
3. Wrap potentially unsafe operations (like header iteration) in try-catch
4. Use TypeScript strict mode to catch variable shadowing issues

