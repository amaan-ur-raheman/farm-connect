# Design Document: FarmConnect Implementation

## Overview

This document covers the technical design for four phases of work on the FarmConnect platform — a farm investment and contract marketplace with a Node.js/Express/TypeScript backend (PostgreSQL + Prisma + Redis) and a React Native/Expo mobile app.

The four phases address:

- **Phase 1**: Critical correctness fixes — KYC admin flow, dispute resolution, escrow consistency, global rate limiting
- **Phase 2**: Real-time features — Socket.io WebSocket chat, Expo push notifications
- **Phase 3**: Performance and reliability — wallet balance caching, input sanitization, explicit axios dependency
- **Phase 4**: Testing — vitest unit tests and integration tests

---

## Architecture

### Current State

```
┌─────────────────────────────────────────────────────────┐
│  React Native / Expo (mobile)                           │
│  - Polling-based chat (3s interval)                     │
│  - axios via transitive dep                             │
│  - No push notification registration                    │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP REST
┌────────────────────▼────────────────────────────────────┐
│  Express App (backend/src/app.ts)                       │
│  - Plain HTTP server (no Socket.io)                     │
│  - No global rate limiting                              │
│  - No input sanitization                                │
│  - Wallet balance: O(n) full table scan                 │
│  - KYC module: empty folder                             │
│  - Dispute resolve: missing endpoint                    │
│  - freezeEscrow: creates Dispute directly (wrong)       │
│  - Notification: DB only, no push                       │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
    PostgreSQL               Redis (Upstash)
    (via Prisma)             - OTP, refresh tokens
```

### Target State

```
┌─────────────────────────────────────────────────────────┐
│  React Native / Expo (mobile)                           │
│  - socket.io-client WebSocket chat                      │
│  - axios as explicit dep                                │
│  - expo-notifications push registration                 │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP REST + WebSocket
┌────────────────────▼────────────────────────────────────┐
│  Express App + Socket.io Server                         │
│  - Global rate limiter (100/15min) + auth (10/15min)    │
│  - sanitize-html middleware on text fields              │
│  - KYC admin module (GET pending, POST verify/reject)   │
│  - Dispute resolve endpoint (admin, transactional)      │
│  - freezeEscrow: sets DISPUTED only, no Dispute create  │
│  - Notification: DB + Expo Push API                     │
│  - Wallet balance: Redis cache + balance_after field    │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
    PostgreSQL               Redis (Upstash)
    (via Prisma)             - OTP, refresh tokens
                             - wallet_balance:{userId}
```

---

## Components and Interfaces

### Phase 1: Critical Fixes

#### 1.1 KYC Module (`backend/src/modules/kyc/`)

New files: `kyc.service.ts`, `kyc.routes.ts`, `kyc.schema.ts`

```
GET  /api/kyc/pending          → requireRole('ADMIN') → list SUBMITTED users
POST /api/kyc/:userId/verify   → requireRole('ADMIN') → set VERIFIED + notify
POST /api/kyc/:userId/reject   → requireRole('ADMIN') → set REJECTED + notify
```

`kyc.service.ts` exports:

- `getPendingKyc(): Promise<User[]>` — finds all users with `kyc_status = SUBMITTED`
- `verifyKyc(userId): Promise<User>` — updates to `VERIFIED`, calls `createNotification`
- `rejectKyc(userId, reason): Promise<User>` — updates to `REJECTED`, stores reason in `kyc_documents.rejection_reason`, calls `createNotification`

The rejection reason is stored in the existing `kyc_documents` JSON field under a `rejection_reason` key — no schema migration needed.

#### 1.2 Dispute Resolution (`backend/src/modules/dispute/`)

New function in `dispute.service.ts`:

```typescript
resolveDispute(disputeId, adminId, resolution, outcome: 'RELEASE_TO_FARMER' | 'REFUND_TO_CONSUMER')
```

Runs a single `prisma.$transaction`:

1. Fetch dispute + contract (throw 404 if missing, 400 if not OPEN/UNDER_REVIEW)
2. Update `dispute.status = RESOLVED`, set `resolution`, `resolved_at`
3. If `RELEASE_TO_FARMER`: credit farmer wallet, set contract `status = COMPLETED`
4. If `REFUND_TO_CONSUMER`: credit consumer wallet, set contract `status = CANCELLED`
5. Create `WalletTransaction` for the recipient with correct `balance_after`
6. Call `createNotification` for both farmer and consumer

New route in `dispute.routes.ts`:

```
POST /api/disputes/:id/resolve  → requireRole('ADMIN')
```

#### 1.3 Fix `freezeEscrow` (`backend/src/modules/escrow/escrow.service.ts`)

Current: `freezeEscrow` creates a `Dispute` record directly.
Fix: remove the `prisma.dispute.create` call. The function only updates `contract.status = 'DISPUTED'` and sets `escrow_frozen` on the contract.

The escrow freeze route will call `createDispute` from `dispute.service.ts` after calling `freezeEscrow`. A new `escrow_frozen` field is added to the `Contract` model to track the frozen amount separately from `escrow_held`.

**Schema change**: Add `escrow_frozen Float @default(0)` to the `Contract` model.

#### 1.4 Global Rate Limiting (`backend/src/app.ts`)

`express-rate-limit` is already in `package.json`. Two limiters are registered in `app.ts` before route handlers:

```typescript
// General: 100 req / 15 min per IP
app.use("/api/", generalLimiter);
// Auth: 10 req / 15 min per IP
app.use("/api/auth/", authLimiter);
```

Both use `standardHeaders: true`, `legacyHeaders: false`, and a custom `handler` that returns `{ message: '...' }` with status 429. The `trustProxy` option is set so `X-Forwarded-For` is respected.

---

### Phase 2: Real-time Features

#### 2.1 Socket.io Server (`backend/src/server.ts`)

`socket.io` and `@types/socket.io` are added to `backend/package.json`.

`server.ts` is refactored to:

1. Create `http.Server` from the Express app
2. Attach `new Server(httpServer, { cors: ... })` as the Socket.io server
3. Export `io` for use in `chat.service.ts`

JWT authentication middleware on the Socket.io server:

```typescript
io.use((socket, next) => {
	const token = socket.handshake.auth?.token;
	// verify JWT, attach userId to socket.data
});
```

On `connection`: join the socket to room `userId`.

On message send (in `chat.service.ts` `sendMessage`): after persisting the message, emit `new_message` to both participant rooms:

```typescript
io.to(participantOneId).to(participantTwoId).emit("new_message", message);
```

#### 2.2 Chat Client (`mobile/app/chat/[id].tsx`)

Replace polling with Socket.io:

- Install `socket.io-client` in `mobile/package.json`
- On mount: connect with `{ auth: { token: accessToken } }`
- Listen for `new_message` events; append to state if `conversation_id` matches
- On unmount: `socket.disconnect()`
- Remove `setInterval` polling

#### 2.3 Push Notifications

**Backend changes:**

- Add `expo_push_token String?` to `User` model in `schema.prisma`
- New route: `POST /api/users/push-token` (authenticated) — updates `user.expo_push_token`
- Install `expo-server-sdk` in `backend/package.json`
- Extend `notification.service.ts` `createNotification` to call `sendPushNotification` after DB insert if user has a token

`sendPushNotification` uses `Expo.sendPushNotificationsAsync`. On delivery error, log and continue (no throw).

**Mobile changes:**

- Install `expo-notifications` in `mobile/package.json`
- In `mobile/app/_layout.tsx`: request permissions on first launch, register token via `POST /api/users/push-token`
- Set foreground notification handler with `Notifications.setNotificationHandler`

---

### Phase 3: Performance and Reliability

#### 3.1 Wallet Balance Caching

The `WalletTransaction` model already has `balance_after Float`. The problem is that `wallet.routes.ts` ignores it and sums all transactions.

Changes:

- Extract a `wallet.service.ts` with `getBalance(userId)` and `createTransaction(userId, type, amount, description)`
- `createTransaction` reads the latest `balance_after` (or 0), computes new balance, writes atomically
- `getBalance` checks Redis key `wallet_balance:{userId}` first; on miss, reads `findFirst({ orderBy: { created_at: 'desc' } })` and caches with 60s TTL
- `createTransaction` calls `redis.del('wallet_balance:' + userId)` after writing

Add Redis helpers to `config/redis.ts`:

```typescript
export const getWalletBalance = (userId: string) =>
	redis.get<number>(`wallet_balance:${userId}`);
export const setWalletBalance = (userId: string, balance: number) =>
	redis.set(`wallet_balance:${userId}`, balance, { ex: 60 });
export const invalidateWalletBalance = (userId: string) =>
	redis.del(`wallet_balance:${userId}`);
```

#### 3.2 Input Sanitization

Install `sanitize-html` and `@types/sanitize-html` in `backend/package.json`.

New utility `backend/src/shared/utils/sanitize.ts`:

```typescript
import sanitizeHtml from "sanitize-html";
export const sanitizeText = (input: string): string =>
	sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} });
```

New middleware `backend/src/shared/middleware/sanitize.ts`:

```typescript
// Strips HTML from specified body fields before the request reaches the service layer
export const sanitizeFields = (...fields: string[]) => (req, _res, next) => { ... }
```

Applied in routes:

- `listing.routes.ts` on `description`
- `chat.routes.ts` on `text`
- `dispute.routes.ts` on `description`

#### 3.3 Mobile Axios Dependency

Add `"axios": "^1.7.0"` to `dependencies` in `mobile/package.json`.

---

### Phase 4: Testing

Test framework: **vitest** (already in `backend/devDependencies`).

Test files live in `backend/tests/`:

- `unit/escrow.service.test.ts`
- `unit/contract.service.test.ts`
- `unit/payment.service.test.ts`
- `unit/redis.test.ts`
- `integration/contract-lifecycle.test.ts`
- `integration/dispute-flow.test.ts`

All unit tests mock Prisma using `vi.mock('@/config/database')`. Integration tests use a real test database (separate `DATABASE_URL` in `.env.test`).

---

## Data Models

### Schema Changes

#### `Contract` — add `escrow_frozen`

```prisma
model Contract {
  // ... existing fields ...
  escrow_frozen   Float          @default(0)   // amount locked by active dispute
}
```

#### `User` — add `expo_push_token`

```prisma
model User {
  // ... existing fields ...
  expo_push_token String?
}
```

No other schema changes are needed. The `kyc_documents` JSON field already accommodates the rejection reason. The `WalletTransaction.balance_after` field already exists.

### Migration Plan

Two Prisma migrations:

1. `add_contract_escrow_frozen` — adds `escrow_frozen` column with default 0
2. `add_user_expo_push_token` — adds `expo_push_token` nullable column

---

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: KYC Status Transition Correctness

_For any_ user with `kyc_status = SUBMITTED`, calling `verifyKyc` should result in `kyc_status = VERIFIED`, and calling `rejectKyc` with any non-empty reason string should result in `kyc_status = REJECTED` with the reason persisted in `kyc_documents.rejection_reason`.

**Validates: Requirements 1.2, 1.3**

### Property 2: KYC Admin Authorization

_For any_ HTTP request to `/api/kyc/*` made with a JWT whose `role` is not `ADMIN`, the server should respond with 401 or 403.

**Validates: Requirements 1.5**

### Property 3: KYC Status Change Triggers Notification

_For any_ user whose `kyc_status` transitions to `VERIFIED` or `REJECTED`, a `Notification` row should be created for that user in the database.

**Validates: Requirements 1.6**

### Property 4: Dispute Resolution Outcome Correctness

_For any_ open dispute with a non-zero `escrow_frozen` amount, resolving with `RELEASE_TO_FARMER` should credit the farmer's wallet by `escrow_frozen` and set `contract.status = COMPLETED`; resolving with `REFUND_TO_CONSUMER` should credit the consumer's wallet by `escrow_frozen` and set `contract.status = CANCELLED`. In both cases, `dispute.status` should be `RESOLVED`.

**Validates: Requirements 2.1, 2.2, 2.3**

### Property 5: Dispute Resolution Notifies Both Parties

_For any_ resolved dispute, two `Notification` rows should be created — one for the contract's `farmer_id` and one for the `consumer_id` — both containing the resolution text.

**Validates: Requirements 2.4**

### Property 6: Dispute Resolution Atomicity

_For any_ dispute resolution that encounters a database error mid-transaction, no partial state should be written — the dispute status, wallet balance, and contract status should all remain unchanged.

**Validates: Requirements 2.8**

### Property 7: freezeEscrow Does Not Create Dispute Records

_For any_ contract, calling `freezeEscrow` should set `contract.status = DISPUTED` and set `contract.escrow_frozen` to the frozen amount, but should NOT insert any row into the `Dispute` table.

**Validates: Requirements 3.1, 3.4, 10.5**

### Property 8: Socket.io Rejects Invalid JWT Connections

_For any_ WebSocket connection attempt with a missing, expired, or malformed JWT in `auth.token`, the Socket.io server should reject the connection with an error and not allow the socket to join any room.

**Validates: Requirements 5.2, 5.8**

### Property 9: New Message Emitted to Both Participants

_For any_ message persisted via the chat REST endpoint, the Socket.io server should emit a `new_message` event to the rooms of both conversation participants, containing the full message payload.

**Validates: Requirements 5.4**

### Property 10: Chat Client Appends Incoming Messages

_For any_ `new_message` socket event received by the Chat_Client for the active conversation, the message should be appended to the displayed message list without duplicating existing messages.

**Validates: Requirements 5.6**

### Property 11: Push Notification Sent When Token Exists

_For any_ user with a non-null `expo_push_token`, when `createNotification` is called for that user, the Expo Push API should be invoked with the notification title and message. For users without a token, the Expo Push API should not be called.

**Validates: Requirements 6.3**

### Property 12: Wallet Balance Round Trip

_For any_ sequence of CREDIT and DEBIT `WalletTransaction` records for a user, the `balance_after` field of the most recent transaction should equal the algebraic sum of all transaction amounts (credits positive, debits negative), and `getBalance` should return this same value.

**Validates: Requirements 7.1, 7.2**

### Property 13: Wallet Cache Invalidation on Write

_For any_ user, after a new `WalletTransaction` is created, the Redis key `wallet_balance:{userId}` should not exist (i.e., it is invalidated), so the next `getBalance` call recomputes from the database.

**Validates: Requirements 7.4**

### Property 14: Sanitizer Strips HTML from Text Fields

_For any_ input string containing HTML tags or JavaScript event attributes submitted to `FarmListing.description`, `Message.text`, or `Dispute.description`, the value stored in the database should contain no HTML tags or event attributes.

**Validates: Requirements 8.1, 8.2**

### Property 15: Sanitizer Preserves Plain Text

_For any_ input string containing no HTML (plain text with Unicode characters, line breaks, and standard punctuation), the sanitized output should be identical to the input.

**Validates: Requirements 8.3**

### Property 16: Escrow Deposit Increments escrow_held

_For any_ active contract and any positive deposit amount, calling `createEscrowDeposit` should increment `contract.escrow_held` by exactly that amount.

**Validates: Requirements 10.1**

### Property 17: Wage Release Updates Escrow and Farmer Paid

_For any_ active contract with sufficient escrow, calling `releaseWageToFarmer` with a valid amount should decrement `contract.escrow_held` by that amount and increment `contract.farmer_paid` by the same amount.

**Validates: Requirements 10.2**

### Property 18: Wage Release Rejects Overdraft

_For any_ contract, calling `releaseWageToFarmer` with an amount greater than `escrow_held - farmer_paid` should throw a `BadRequestError` and leave the contract unchanged.

**Validates: Requirements 10.4**

### Property 19: Contract State Machine Transitions

_For any_ contract, `acceptContract` transitions `PENDING → ACTIVE`, `rejectContract` transitions `PENDING → CANCELLED`, and `completeContract` transitions `ACTIVE → COMPLETED`. Calling `acceptContract` on a non-PENDING contract or `cancelContract` on an ACTIVE contract with `escrow_held > 0` should throw a `BadRequestError`.

**Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5**

### Property 20: Payment Signature Verification

_For any_ Razorpay order ID and payment ID, `verifyRazorpaySignature` should return `true` if and only if the provided signature matches the HMAC-SHA256 of `orderId|paymentId` using the Razorpay key secret. Any other signature value should return `false`.

**Validates: Requirements 12.1, 12.2**

### Property 21: OTP Rate Limit Enforcement

_For any_ phone number, `checkOtpRateLimit` should return `true` for the first 5 calls within a one-hour window and `false` for the 6th and subsequent calls within the same window. After the one-hour TTL expires, it should return `true` again.

**Validates: Requirements 13.1, 13.2, 13.3**

---

## Error Handling

### Backend

All errors flow through the existing `errorHandler` middleware in `shared/errors/index.ts`. New code follows the same pattern — throw typed `AppError` subclasses (`NotFoundError`, `BadRequestError`, `ForbiddenError`) from service functions; the middleware serializes them to `{ success: false, error: { code, message } }`.

Key error scenarios per phase:

**Phase 1 — KYC:**

- Non-existent userId → `NotFoundError` (404)
- Non-admin caller → `UnauthorizedError` (401) via `requireRole`

**Phase 1 — Dispute Resolution:**

- Non-existent dispute → `NotFoundError` (404)
- Dispute not in OPEN/UNDER_REVIEW → `BadRequestError` (400)
- Non-admin caller → `UnauthorizedError` (401)

**Phase 2 — Socket.io:**

- Invalid JWT on handshake → emit `error` event, call `next(new Error('Unauthorized'))` to reject the connection
- Expired JWT → same path

**Phase 2 — Push Notifications:**

- Expo Push API delivery error → log with `console.error`, do not rethrow; the in-app notification is already persisted

**Phase 3 — Wallet:**

- Insufficient balance on withdraw → `BadRequestError` (400)
- Redis unavailable → fall back to DB read (log warning, do not fail the request)

**Phase 3 — Sanitization:**

- Field exceeds max length after sanitization → `BadRequestError` (400) with field name in message

### Mobile

- Socket.io connection errors → display a toast/banner; fall back to REST polling as a degraded mode
- Push token registration failure → log silently; app remains functional without push

---

## Testing Strategy

### Dual Testing Approach

Both unit tests and property-based tests are used. Unit tests cover specific examples, integration points, and edge cases. Property-based tests verify universal invariants across many generated inputs.

### Unit Tests (`backend/tests/unit/`)

Focus on specific examples and edge cases:

- `escrow.service.test.ts` — mock Prisma, test each escrow function with concrete inputs
- `contract.service.test.ts` — mock Prisma, test state machine transitions
- `payment.service.test.ts` — test `verifyRazorpaySignature` with known HMAC values
- `redis.test.ts` — mock Upstash Redis client, test `checkOtpRateLimit` counter behavior

### Integration Tests (`backend/tests/integration/`)

Use a real test database (separate `DATABASE_URL` in `.env.test`). Each test seeds its own data and cleans up after.

- `contract-lifecycle.test.ts` — full flow: create listing → create contract → accept → deposit escrow → release wage → final settlement
- `dispute-flow.test.ts` — create active contract → freeze escrow → resolve dispute (both outcomes)

### Property-Based Tests

Use **fast-check** (to be added to `backend/devDependencies`). Each property test runs a minimum of 100 iterations.

Tag format: `// Feature: farmconnect-implementation, Property {N}: {property_text}`

Property test mapping:

| Property                            | Test File                       | fast-check Arbitraries                  |
| ----------------------------------- | ------------------------------- | --------------------------------------- |
| P1: KYC status transition           | `unit/kyc.service.test.ts`      | `fc.string()` for reason                |
| P7: freezeEscrow no Dispute         | `unit/escrow.service.test.ts`   | `fc.float({ min: 1 })` for amount       |
| P12: Wallet balance round trip      | `unit/wallet.service.test.ts`   | `fc.array(fc.record({ type, amount }))` |
| P13: Wallet cache invalidation      | `unit/wallet.service.test.ts`   | `fc.float({ min: 0.01 })` for amount    |
| P14: Sanitizer strips HTML          | `unit/sanitize.test.ts`         | `fc.string()` + HTML injection          |
| P15: Sanitizer preserves plain text | `unit/sanitize.test.ts`         | `fc.unicodeString()`                    |
| P16: Escrow deposit increments      | `unit/escrow.service.test.ts`   | `fc.float({ min: 0.01 })`               |
| P17: Wage release updates fields    | `unit/escrow.service.test.ts`   | `fc.float({ min: 0.01 })`               |
| P18: Wage release rejects overdraft | `unit/escrow.service.test.ts`   | `fc.float({ min: 0.01 })`               |
| P19: Contract state machine         | `unit/contract.service.test.ts` | `fc.constantFrom(statuses)`             |
| P20: Payment signature              | `unit/payment.service.test.ts`  | `fc.string()` for orderId/paymentId     |
| P21: OTP rate limit                 | `unit/redis.test.ts`            | `fc.string()` for phone                 |

Properties 2, 3, 4, 5, 6, 8, 9, 10, 11 are tested as integration examples (specific scenarios) rather than property-based tests, since they require HTTP/socket infrastructure or multi-service coordination.

### Test Configuration

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		alias: { "@": "/src" },
	},
});
```

Each property-based test uses `fc.assert(fc.property(...), { numRuns: 100 })`.
