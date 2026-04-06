# Wallet Currency Schema Fix Plan

## Objective
Fix the Zod parse error on the `/api/wallet/balance` endpoint where `currency` is missing from the backend response.

## Key Files & Context
- `mobile/src/config/schemas.ts`

The `WalletBalanceSchema` expects a `currency` string field, but the backend's `/balance` endpoint only returns `{ balance }` without a currency. We can resolve this immediately on the frontend by making the `currency` field optional and defaulting it to "INR" (or handling it safely) inside the Zod schema.

## Implementation Steps
1. **Update `mobile/src/config/schemas.ts`**:
   - Locate `WalletBalanceSchema`.
   - Change `currency: z.string(),` to `currency: z.string().optional().default("INR"),`.

## Verification & Testing
1. Ensure the wallet balance fetches successfully in the app without throwing a Zod parsing error.
2. The UI should display the balance properly.