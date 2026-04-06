# Contract Schema Fix Plan

## Objective
Fix the Zod validation errors occurring when fetching contracts, because the backend only returns a partial `listing` and partial `farmer`/`consumer` objects (specifically missing `farmer_id`, `area_acres`, `price_per_acre`, `location_name` from listing, and `phone` from consumer/farmer), which `ContractSchema` expected to be present.

## Key Files & Context
- `mobile/src/config/schemas.ts`

The `ContractSchema` nests a full `ListingSchema` and expects `phone` to be present on `consumer` and `farmer`. However, the `/api/contracts/farmer` (and consumer) endpoints use a Prisma `select` clause that only returns a subset of properties (like `id`, `name`, `images` for listing, and `id`, `name`, `avatar_url` for users).

## Implementation Steps

1. **Update `mobile/src/config/schemas.ts`**:
   - Change `listing: ListingSchema.optional().nullable(),` to `listing: ListingSchema.partial().optional().nullable(),` in `ContractSchema`.
   - Make `phone` optional in the nested `consumer` object: `phone: z.string().optional(),`
   - Make `phone` optional in the nested `farmer` object: `phone: z.string().optional(),`

## Verification & Testing
1. The Zod parse error should no longer occur when contracts are fetched.
2. The UI should render the available contract data correctly.