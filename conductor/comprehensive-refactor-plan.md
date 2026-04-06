# Comprehensive Refactoring Plan

## Background & Motivation
The codebase investigator identified several architectural areas for improvement to make the app production-ready. The user has requested to implement **all** of them: migrating to TanStack Query, enforcing strict Zod schemas, unifying role terminology, and adding an offline sync queue.

## Scope & Impact
1.  **Migrate to TanStack Query (React Query)**: Replace manual `isLoading`, `isRefreshing`, and Zustand caching logic with React Query for robust caching, pagination, and data synchronization.
2.  **Strict Type Safety & Zod Schemas**: Define Zod schemas for API responses in the frontend and parse incoming data to ensure type safety at runtime, preventing silent failures.
3.  **Unify Role Terminology**: Align the frontend's `investor` role with the backend's `CONSUMER` role to prevent mapping confusion. We will update the frontend state and conditionals to use `consumer`.
4.  **Robust Offline Sync Queue**: Implement an offline queue using AsyncStorage and NetInfo to store "Post Update" actions when offline, automatically syncing them when connectivity is restored.

**Affected Files:**
- `mobile/package.json` (New dependencies: `@tanstack/react-query`, `zod`, `@react-native-community/netinfo`)
- `mobile/app/_layout.tsx` (Add QueryClientProvider)
- `mobile/src/config/api.ts` & `mobile/src/config/schemas.ts` (Zod integration)
- `mobile/src/stores/authStore.ts` (Role mapping update)
- `mobile/src/utils/syncQueue.ts` (New offline queue)
- Screens: `marketplace.tsx`, `dashboard.tsx`, `investor-dashboard.tsx`, `contracts/index.tsx`, `property/[id].tsx`, `updates/[contractId].tsx`.

## Implementation Steps

### Phase 1: Setup & Role Unification
1. Add `@tanstack/react-query`, `zod`, and `@react-native-community/netinfo` to `mobile/package.json`.
2. Find and replace `'investor'` with `'consumer'` across frontend UI logic (e.g., `userRole === 'consumer'`).
3. Update `authStore.ts` to set `userRole` as `'consumer'` instead of `'investor'`.

### Phase 2: Strict Type Safety (Zod)
1. Create `mobile/src/config/schemas.ts` and define schemas: `ListingSchema`, `ContractSchema`, `UserSchema`, `FarmUpdateSchema`.
2. Update `api.ts` to expose typed query helpers that parse data through these Zod schemas, stripping out the unsafe `(response.data as any).data` patterns.

### Phase 3: TanStack Query Migration
1. Initialize `QueryClient` in `mobile/app/_layout.tsx` and wrap the app in `<QueryClientProvider>`.
2. Refactor `mobile/app/marketplace.tsx` to use `useInfiniteQuery` instead of manual `FlatList` pagination and Zustand state.
3. Refactor `mobile/app/dashboard.tsx` and `investor-dashboard.tsx` to use `useQuery` for fetching stats, contracts, and wallet balances.
4. Remove manual fetching logic from `userStore.ts` and `marketplaceStore.ts` (deprecate `isLoading` and properties caching).

### Phase 4: Offline Sync Queue
1. Create `mobile/src/utils/syncQueue.ts` to manage an array of pending requests in `AsyncStorage`.
2. Implement a `useNetworkStatus` hook using NetInfo.
3. In `mobile/app/updates/[contractId].tsx`, modify the submit logic to push to the sync queue if offline, and provide visual feedback to the user via `haptic` and Toasts.
4. Add a sync listener in `mobile/app/_layout.tsx` that checks for network connectivity and processes the queue in the background.

## Verification
- Verify that logging in as a Consumer routes to the correct dashboard.
- Ensure the Marketplace still infinitely scrolls but now uses React Query devtools/cache.
- Disconnect internet, post an update, and verify it enters the queue. Reconnect, and verify it successfully uploads.
- Run the app and ensure no Zod parsing errors occur with standard API responses.