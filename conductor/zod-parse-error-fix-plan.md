# Zod Parse Error Fix Plan

## Objective
Fix the Zod parsing errors in `mobile/src/config/api.ts` by passing the entire `result` object (which includes `success` and `data` fields) to `schema.parse()`, rather than the unwrapped `rawData`.

## Key Files & Context
- `mobile/src/config/api.ts`

The wrapper extracts `result.data` into `rawData`. However, the API response schemas defined in `schemas.ts` are wrapped with `SuccessResponse` (which expects an object like `{ success: boolean, data: <actual data> }`). When we pass `rawData` to `schema.parse`, Zod fails because it expects the `{ success, data }` outer envelope.

By changing `schema.parse(rawData)` to `schema.parse(result)` in the three occurrences within `api.ts`, we ensure the schema correctly validates the full response envelope, fixing the validation errors.

## Implementation Steps

1. **Update `mobile/src/config/api.ts`**:
   - At line 97: Change `const parsedData = schema.parse(rawData);` to `const parsedData = schema.parse(result);`
   - At line 135: Change `resolve({ data: schema.parse(rawData) });` to `resolve({ data: schema.parse(result) });`
   - At line 163: Change `return { data: schema.parse(rawData) };` to `return { data: schema.parse(result) };`

## Verification & Testing
1. Reload the app.
2. Verify that API calls mapped to schemas (such as user profile or wallet fetching) no longer throw a Zod parse error in the console.