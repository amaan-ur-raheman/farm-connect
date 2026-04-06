# Login TypeError Fix Plan

## Objective
Fix the `TypeError: Cannot read property 'user' of undefined` error occurring during login (OTP verification), and proactively fix similar destructuring errors in the OTP sending and token refresh flows.

## Key Files & Context
- `mobile/src/stores/authStore.ts`
- `mobile/src/config/api.ts`

The underlying issue is that the wrapper around `api.post` and `api.get` (defined in `api.ts`) already unwraps the backend's standard JSON response `{ success: true, data: { ... } }` and returns `{ data: rawData }` where `rawData` is the payload. 

In `authStore.ts`, the frontend code is trying to access `.data` twice, e.g., `(response.data as any).data`, which results in `undefined`. This triggers a TypeError when attempting to destructure `user`, `accessToken`, and `refreshToken`.

## Implementation Steps

1. **Update `mobile/src/stores/authStore.ts`**:
   - **OTP Send**: 
     - Change `const devOtp = (response.data as any)?.data?.devOtp || null;`
     - To `const devOtp = (response.data as any)?.devOtp || null;`
   - **OTP Verify**:
     - Change `const { user, accessToken, refreshToken } = (response.data as any).data;`
     - To `const { user, accessToken, refreshToken } = response.data as any;`
   - **Token Refresh**:
     - Change `const { accessToken, refreshToken: newRefreshToken } = (response.data as any).data;`
     - To `const { accessToken, refreshToken: newRefreshToken } = response.data as any;`

## Verification & Testing
1. Attempt to log in again via the mobile app UI or test script.
2. Confirm that the OTP verification completes successfully and the user is logged in.
3. Ensure no `TypeError` occurs and tokens are properly assigned in the store.