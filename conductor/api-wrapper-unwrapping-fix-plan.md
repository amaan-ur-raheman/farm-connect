# API Wrapper Unwrapping Fix Plan

## Objective
Fix the issue where API endpoints without schemas (like `/api/chat/conversations`) return undefined `res.data.data`, causing empty screens in the app.

## Key Files & Context
- `mobile/src/config/api.ts`

The `api.ts` `request` wrapper was eagerly extracting the inner `data` payload of the backend's standard JSON response envelope (`{ success: true, data: [...] }`) and returning `{ data: rawData }`. However, across the mobile app, callers without a Zod schema typed their return objects as `{ data: T[] }` and tried to access `res.data.data`. Because `res.data` was actually the inner payload array (due to the eager unwrapping), `res.data.data` resulted in `undefined`.
Changing the return value in `api.ts` to `return { data: result as T };` will ensure that `res.data` receives the full envelope (`{ success: true, data: [...] }`), resolving `res.data.data` correctly for the 27 occurrences in the app.

## Implementation Steps
1. **Update `mobile/src/config/api.ts`**:
   - In `try { const result = await doRequest(); ... }`: Change `return { data: rawData as T };` to `return { data: result as T };`.
   - In the token refresh catch block: Change `return { data: rawData as T };` to `return { data: result as T };`.
   - In the queued requests block: Change `resolve({ data: rawData as T });` to `resolve({ data: result as T });`.

## Verification & Testing
1. Navigate to the Messages tab.
2. The conversations should load perfectly because `res.data.data` will correctly resolve the array of conversations.