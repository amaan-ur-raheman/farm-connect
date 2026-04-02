# Implementation Plan: FarmConnect Implementation

## Overview

Four-phase implementation covering critical correctness fixes, real-time features, performance/reliability improvements, and a comprehensive test suite. Each task builds incrementally on the previous ones and wires into the existing Express/Prisma/React Native codebase.

## Tasks

- [-] 1. Phase 1 — Critical Correctness Fixes
    - [x] 1.1 Run Prisma schema migrations (escrow_frozen + expo_push_token)
        - Add `escrow_frozen Float @default(0)` to the `Contract` model in `backend/prisma/schema.prisma`
        - Add `expo_push_token String?` to the `User` model in `backend/prisma/schema.prisma`
        - Run `prisma migrate dev --name add_contract_escrow_frozen_and_user_push_token` to apply both changes
        - _Requirements: 3.4, 6.2_

    - [x] 1.2 Fix `freezeEscrow` in `backend/src/modules/escrow/escrow.service.ts`
        - Remove the `prisma.dispute.create` call from `freezeEscrow`
        - Update the function to only call `prisma.contract.update` setting `status = 'DISPUTED'` and `escrow_frozen` to the frozen amount
        - Update the escrow freeze route in `backend/src/modules/escrow/escrow.routes.ts` to call `createDispute` from `dispute.service.ts` after `freezeEscrow`
        - _Requirements: 3.1, 3.2, 3.3, 3.4_

    - [x] 1.3 Write property test for freezeEscrow (Property 7)
        - **Property 7: freezeEscrow Does Not Create Dispute Records**
        - **Validates: Requirements 3.1, 3.4, 10.5**
        - File: `backend/tests/unit/escrow.service.test.ts`
        - Use `fc.float({ min: 1 })` for the frozen amount; mock Prisma; assert no `dispute.create` call and that `contract.update` sets `status = 'DISPUTED'` and `escrow_frozen` to the amount

    - [x] 1.4 Create KYC module — service and schema
        - Create `backend/src/modules/kyc/kyc.schema.ts` with Zod schemas for the reject body (`{ reason: string }`)
        - Create `backend/src/modules/kyc/kyc.service.ts` exporting:
            - `getPendingKyc()` — finds all users with `kyc_status = 'SUBMITTED'`
            - `verifyKyc(userId)` — updates to `VERIFIED`, calls `createNotification` for the user
            - `rejectKyc(userId, reason)` — updates to `REJECTED`, stores `reason` in `kyc_documents.rejection_reason`, calls `createNotification`
        - Throw `NotFoundError` when `userId` does not exist
        - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6_

    - [x] 1.5 Write property test for KYC status transitions (Property 1)
        - **Property 1: KYC Status Transition Correctness**
        - **Validates: Requirements 1.2, 1.3**
        - File: `backend/tests/unit/kyc.service.test.ts`
        - Use `fc.string({ minLength: 1 })` for the rejection reason; mock Prisma; assert `verifyKyc` sets `kyc_status = 'VERIFIED'` and `rejectKyc` sets `kyc_status = 'REJECTED'` with `rejection_reason` persisted

    - [x] 1.6 Create KYC module — routes and wire into app.ts
        - Create `backend/src/modules/kyc/kyc.routes.ts` with:
            - `GET /api/kyc/pending` → `requireRole('ADMIN')` → `getPendingKyc`
            - `POST /api/kyc/:userId/verify` → `requireRole('ADMIN')` → `verifyKyc`
            - `POST /api/kyc/:userId/reject` → `requireRole('ADMIN')` + `validate(rejectSchema)` → `rejectKyc`
        - Import and mount `kycRouter` on `/api/kyc` in `backend/src/app.ts`
        - _Requirements: 1.1, 1.2, 1.3, 1.5_

    - [x] 1.7 Add dispute resolution endpoint
        - Add `resolveDispute(disputeId, adminId, resolution, outcome)` to `backend/src/modules/dispute/dispute.service.ts`
        - The function runs a single `prisma.$transaction`:
            1. Fetch dispute + contract; throw `NotFoundError` if missing; throw `BadRequestError` if status is not `OPEN` or `UNDER_REVIEW`
            2. Update `dispute.status = 'RESOLVED'`, set `resolution` and `resolved_at`
            3. If `RELEASE_TO_FARMER`: read farmer's latest `balance_after`, create `WalletTransaction` (CREDIT), set `contract.status = 'COMPLETED'`
            4. If `REFUND_TO_CONSUMER`: read consumer's latest `balance_after`, create `WalletTransaction` (CREDIT), set `contract.status = 'CANCELLED'`
            5. Call `createNotification` for both farmer and consumer with the resolution text
        - Add `POST /api/disputes/:id/resolve` route in `dispute.routes.ts` with `requireRole('ADMIN')`
        - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

    - [x] 1.8 Add global rate limiting in `backend/src/app.ts`
        - Import `rateLimit` from `express-rate-limit` (already in dependencies)
        - Create `generalLimiter`: 100 requests / 15 min per IP, `standardHeaders: true`, `legacyHeaders: false`, custom 429 handler returning `{ message: 'Too many requests, please try again later.' }`
        - Create `authLimiter`: 10 requests / 15 min per IP, same options, message `'Too many authentication attempts, please try again later.'`
        - Register `app.set('trust proxy', 1)` before the limiters so `X-Forwarded-For` is respected
        - Apply `generalLimiter` to `/api/` and `authLimiter` to `/api/auth/` before all route handlers
        - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

    - [x] 1.9 Checkpoint — Phase 1 complete
        - Ensure all tests pass, ask the user if questions arise.

- [x]   2. Phase 2 — Real-time Features
    - [x] 2.1 Install backend real-time dependencies
        - Add `socket.io` and `expo-server-sdk` to `dependencies` in `backend/package.json`
        - Add `fast-check` to `devDependencies` in `backend/package.json`
        - Run `npm install` in the `backend` directory
        - _Requirements: 5.1, 6.3_

    - [x] 2.2 Refactor `backend/src/server.ts` to attach Socket.io
        - Import `http` from Node and `Server` from `socket.io`
        - Wrap the Express app in `http.createServer(app)` and attach `new Server(httpServer, { cors: { origin: '*' } })`
        - Add JWT authentication middleware on `io.use(...)`: read `socket.handshake.auth?.token`, verify with `jwt.verify`, attach `userId` to `socket.data`; call `next(new Error('Unauthorized'))` on failure
        - On `connection`: join the socket to room `socket.data.userId`
        - Export `io` from `server.ts` for use in `chat.service.ts`
        - Update `httpServer.listen(...)` replacing `app.listen`
        - _Requirements: 5.1, 5.2, 5.3, 5.8_

    - [x] 2.3 Emit `new_message` events from `chat.service.ts`
        - Import `io` from `server.ts` into `backend/src/modules/chat/chat.service.ts`
        - After the `prisma.$transaction` in `sendMessage`, call `io.to(participantOneId).to(participantTwoId).emit('new_message', message)`
        - _Requirements: 5.4_

    - [x] 2.4 Install mobile real-time dependencies
        - Add `socket.io-client` and `expo-notifications` to `dependencies` in `mobile/package.json`
        - Add `"ky"` to `dependencies` in `mobile/package.json`
        - Run `npm install` in the `mobile` directory
        - _Requirements: 5.5, 6.5, 9.1, 9.2_

    - [x] 2.5 Replace polling with Socket.io in `mobile/app/chat/[id].tsx`
        - Import `io` from `socket.io-client` and `useAuthStore` to get the access token
        - On mount: connect with `io(BASE_URL, { auth: { token: accessToken } })`
        - Listen for `new_message` events; if `msg.conversation_id === id`, append to `messages` state (deduplicate by `id`)
        - On unmount: call `socket.disconnect()`
        - Remove the `setInterval` polling and the `pollInterval` ref
        - Keep the initial `fetchMessages` REST call on mount to load history
        - _Requirements: 5.5, 5.6, 5.7_

    - [x] 2.6 Add push token endpoint to user routes
        - Add `POST /api/users/push-token` route in `backend/src/modules/user/user.routes.ts` (authenticated)
        - Validate body with Zod: `{ expo_push_token: z.string() }`
        - In `user.service.ts`, add `savePushToken(userId, token)` that updates `user.expo_push_token`
        - _Requirements: 6.1, 6.2_

    - [x] 2.7 Extend `notification.service.ts` to send Expo push notifications
        - Import `Expo` from `expo-server-sdk`
        - After `prisma.notification.create`, look up the user's `expo_push_token`
        - If token is non-null and `Expo.isExpoPushToken(token)`, call `expo.sendPushNotificationsAsync([{ to: token, title, body: message }])`
        - On delivery error (check `receipt.status === 'error'`), log with `console.error` and continue — do not throw
        - _Requirements: 6.3, 6.4_

    - [x] 2.8 Register push notifications in `mobile/app/_layout.tsx`
        - Import `* as Notifications` from `expo-notifications`
        - Set foreground notification handler with `Notifications.setNotificationHandler`
        - In `RootLayout` `useEffect`: request permissions with `Notifications.requestPermissionsAsync()`; on grant, get token with `Notifications.getExpoPushTokenAsync()` and POST to `/api/users/push-token`
        - On failure, log silently — do not block app startup
        - _Requirements: 6.5, 6.6_

    - [x] 2.9 Checkpoint — Phase 2 complete
        - Ensure all tests pass, ask the user if questions arise.

- [x]   3. Phase 3 — Performance and Reliability
    - [x] 3.1 Install backend sanitization dependency
        - Add `sanitize-html` and `@types/sanitize-html` to `backend/package.json` (`dependencies` and `devDependencies` respectively)
        - Run `npm install` in the `backend` directory
        - _Requirements: 8.1_

    - [x] 3.2 Create sanitize utility and middleware
        - Create `backend/src/shared/utils/sanitize.ts` exporting `sanitizeText(input: string): string` using `sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} })`
        - Create `backend/src/shared/middleware/sanitize.ts` exporting `sanitizeFields(...fields: string[])` middleware that calls `sanitizeText` on each named field in `req.body` before passing to `next()`
        - _Requirements: 8.1, 8.2, 8.3_

    - [x] 3.3 Apply sanitization middleware to listing, chat, and dispute routes
        - In `backend/src/modules/listing/listing.routes.ts`: apply `sanitizeFields('description')` before the validate middleware on create/update routes
        - In `backend/src/modules/chat/chat.routes.ts`: apply `sanitizeFields('text')` before the validate middleware on the send-message route
        - In `backend/src/modules/dispute/dispute.routes.ts`: apply `sanitizeFields('description')` before the validate middleware on the create-dispute route
        - _Requirements: 8.1, 8.2_

    - [x] 3.4 Write property tests for sanitizer (Properties 14 and 15)
        - **Property 14: Sanitizer Strips HTML from Text Fields**
        - **Validates: Requirements 8.1, 8.2**
        - **Property 15: Sanitizer Preserves Plain Text**
        - **Validates: Requirements 8.3**
        - File: `backend/tests/unit/sanitize.test.ts`
        - P14: use `fc.string()` combined with HTML injection templates; assert output contains no `<` or `>` characters
        - P15: use `fc.unicodeString()` filtered to strings with no HTML; assert `sanitizeText(input) === input`

    - [x] 3.5 Extract `wallet.service.ts` and add Redis caching helpers
        - Add Redis helpers to `backend/src/config/redis.ts`:
            - `getWalletBalance(userId)` → `redis.get<number>('wallet_balance:' + userId)`
            - `setWalletBalance(userId, balance)` → `redis.set('wallet_balance:' + userId, balance, { ex: 60 })`
            - `invalidateWalletBalance(userId)` → `redis.del('wallet_balance:' + userId)`
        - Create `backend/src/modules/wallet/wallet.service.ts` exporting:
            - `getBalance(userId)`: check Redis first; on miss, read `findFirst({ orderBy: { created_at: 'desc' } })` for `balance_after` (default 0), cache it, return it
            - `createTransaction(userId, type, amount, description)`: read latest `balance_after`, compute new balance (`CREDIT`: add, `DEBIT`: subtract), write `WalletTransaction` with correct `balance_after`, then call `invalidateWalletBalance`
        - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

    - [x] 3.6 Update `wallet.routes.ts` to use `wallet.service.ts`
        - Replace the inline balance aggregation in `GET /wallet/balance` with `getBalance(userId)` from `wallet.service.ts`
        - Replace the inline balance check in `POST /wallet/withdraw` with `getBalance(userId)` from `wallet.service.ts`
        - _Requirements: 7.3, 7.5_

    - [x] 3.7 Write property tests for wallet balance (Properties 12 and 13)
        - **Property 12: Wallet Balance Round Trip**
        - **Validates: Requirements 7.1, 7.2**
        - **Property 13: Wallet Cache Invalidation on Write**
        - **Validates: Requirements 7.4**
        - File: `backend/tests/unit/wallet.service.test.ts`
        - P12: use `fc.array(fc.record({ type: fc.constantFrom('CREDIT', 'DEBIT'), amount: fc.float({ min: 0.01, max: 10000 }) }), { minLength: 1 })`; mock Prisma and Redis; assert `balance_after` of last transaction equals algebraic sum
        - P13: use `fc.float({ min: 0.01 })` for amount; mock Redis; assert `invalidateWalletBalance` is called after `createTransaction`

    - [x] 3.8 Checkpoint — Phase 3 complete
        - Ensure all tests pass, ask the user if questions arise.

- [ ]   4. Phase 4 — Testing
    - [ ] 4.1 Set up test infrastructure
        - Create `backend/vitest.config.ts` with `globals: true`, `environment: 'node'`, and `alias: { '@': '/src' }`
        - Create `backend/tests/unit/` and `backend/tests/integration/` directories (add `.gitkeep` if needed)
        - _Requirements: 10, 11, 12, 13, 14, 15_

    - [ ] 4.2 Write unit tests for escrow service
        - Create `backend/tests/unit/escrow.service.test.ts`
        - Mock `@/config/database` with `vi.mock`
        - Write example-based tests for:
            - `createEscrowDeposit` increments `escrow_held` by the deposited amount (Req 10.1)
            - `releaseWageToFarmer` decrements `escrow_held` and increments `farmer_paid` (Req 10.2)
            - `finalSettlement` sets `status = 'COMPLETED'` and transfers remaining balance (Req 10.3)
            - `releaseWageToFarmer` throws `BadRequestError` when amount > available escrow (Req 10.4)
            - `freezeEscrow` sets `status = 'DISPUTED'` and does NOT call `prisma.dispute.create` (Req 10.5)
        - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

    - [ ] 4.3 Write property tests for escrow service (Properties 16, 17, 18)
        - **Property 16: Escrow Deposit Increments escrow_held**
        - **Validates: Requirements 10.1**
        - **Property 17: Wage Release Updates Escrow and Farmer Paid**
        - **Validates: Requirements 10.2**
        - **Property 18: Wage Release Rejects Overdraft**
        - **Validates: Requirements 10.4**
        - File: `backend/tests/unit/escrow.service.test.ts`
        - P16: `fc.float({ min: 0.01 })` for deposit amount; assert `escrow_held` delta equals amount
        - P17: `fc.float({ min: 0.01 })` for wage; assert `escrow_held` decrements and `farmer_paid` increments by same value
        - P18: generate amount > `escrow_held - farmer_paid`; assert `BadRequestError` is thrown

    - [ ] 4.4 Write unit tests for contract service
        - Create `backend/tests/unit/contract.service.test.ts`
        - Mock `@/config/database` with `vi.mock`
        - Write example-based tests for:
            - `acceptContract` transitions `PENDING → ACTIVE` (Req 11.1)
            - `rejectContract` transitions `PENDING → CANCELLED` (Req 11.2)
            - `acceptContract` throws `BadRequestError` on non-PENDING contract (Req 11.3)
            - `cancelContract` throws `BadRequestError` on ACTIVE contract with `escrow_held > 0` (Req 11.4)
            - `completeContract` transitions `ACTIVE → COMPLETED` (Req 11.5)
        - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

    - [ ] 4.5 Write property test for contract state machine (Property 19)
        - **Property 19: Contract State Machine Transitions**
        - **Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5**
        - File: `backend/tests/unit/contract.service.test.ts`
        - Use `fc.constantFrom('ACTIVE', 'COMPLETED', 'DISPUTED', 'CANCELLED')` to generate non-PENDING statuses; assert `acceptContract` throws `BadRequestError` for all of them

    - [ ] 4.6 Write unit tests for payment signature verification
        - Create `backend/tests/unit/payment.service.test.ts`
        - Import `verifyRazorpaySignature` directly (no Prisma mock needed for this function)
        - Write tests for:
            - Correctly computed HMAC-SHA256 signature passes (Req 12.1)
            - Tampered signature fails and returns `false` (Req 12.2)
            - Missing/empty signature returns `false` (Req 12.3)
        - _Requirements: 12.1, 12.2, 12.3_

    - [ ] 4.7 Write property test for payment signature (Property 20)
        - **Property 20: Payment Signature Verification**
        - **Validates: Requirements 12.1, 12.2**
        - File: `backend/tests/unit/payment.service.test.ts`
        - Use `fc.string()` for `orderId` and `paymentId`; compute expected HMAC in the test; assert `verifyRazorpaySignature` returns `true` for correct signature and `false` for any other string

    - [ ] 4.8 Write unit tests for OTP rate limiting
        - Create `backend/tests/unit/redis.test.ts`
        - Mock `@upstash/redis` with `vi.mock` to simulate in-memory counter behavior
        - Write tests for:
            - First 5 calls within one-hour window return `true` (Req 13.1)
            - 6th call within same window returns `false` (Req 13.2)
            - After TTL expiry (reset mock counter), returns `true` again (Req 13.3)
        - _Requirements: 13.1, 13.2, 13.3_

    - [ ] 4.9 Write property test for OTP rate limit (Property 21)
        - **Property 21: OTP Rate Limit Enforcement**
        - **Validates: Requirements 13.1, 13.2, 13.3**
        - File: `backend/tests/unit/redis.test.ts`
        - Use `fc.string({ minLength: 7, maxLength: 15 })` for phone numbers; mock Redis with a fresh counter per run; assert first 5 calls return `true` and 6th returns `false`

    - [ ] 4.10 Write integration tests for contract lifecycle
        - Create `backend/tests/integration/contract-lifecycle.test.ts`
        - Use a real test database (read `DATABASE_URL` from `.env.test`)
        - Seed: create two users (farmer + consumer), create a listing
        - Test sequence: create contract → accept → deposit escrow → release wage → final settlement
        - Assert `escrow_held` equals deposits minus releases after each step (Req 14.2)
        - Assert `status = 'COMPLETED'` after `finalSettlement` (Req 14.3)
        - Assert consumer cannot deposit into another user's contract (Req 14.4)
        - Assert farmer cannot release wage exceeding available escrow (Req 14.5)
        - Clean up seeded data in `afterAll`
        - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

    - [ ] 4.11 Write integration tests for dispute flow
        - Create `backend/tests/integration/dispute-flow.test.ts`
        - Use a real test database (read `DATABASE_URL` from `.env.test`)
        - Seed: create active contract with deposited escrow, create admin user
        - Test: freeze escrow → assert `contract.status = 'DISPUTED'` (Req 15.1)
        - Test: resolve with `RELEASE_TO_FARMER` → assert farmer wallet credited by `escrow_frozen`, `contract.status = 'COMPLETED'` (Req 15.2)
        - Test: resolve with `REFUND_TO_CONSUMER` → assert consumer wallet credited by `escrow_frozen`, `contract.status = 'CANCELLED'` (Req 15.3)
        - Test: resolve already-resolved dispute → assert 400 error (Req 15.4)
        - Test: non-admin resolve attempt → assert 401/403 (Req 15.5)
        - Clean up seeded data in `afterAll`
        - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

    - [ ] 4.12 Final checkpoint — Ensure all tests pass
        - Run `npx vitest --run` in the `backend` directory and confirm all unit tests pass.
        - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at the end of each phase
- Property tests use `fast-check` with `fc.assert(fc.property(...), { numRuns: 100 })`
- Integration tests require a separate `.env.test` file with a test `DATABASE_URL`
- The `io` export from `server.ts` creates a circular-style dependency with `chat.service.ts`; use a module-level singleton pattern to avoid issues
