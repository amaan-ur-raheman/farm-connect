# Zod and React Query Implementation Plan

## Scope
1. Update `api.ts` to accept a ZodSchema parameter to validate API responses.
2. Complete the TanStack Query migration for `mobile/app/wallet.tsx` and `mobile/app/contracts/index.tsx`.
3. Create `mobile/src/config/schemas.ts` and ensure it exports all necessary schemas.

## Steps
1. Create `mobile/src/config/schemas.ts` with all the Zod definitions.
2. Update `mobile/src/config/api.ts` to optionally use these schemas to parse data.
3. Migrate `mobile/app/wallet.tsx` and `mobile/app/contracts/index.tsx` to use `useQuery`.
4. Update `mobile/src/stores/userStore.ts` to remove manual API fetches where possible, relying on `useQuery` in components.