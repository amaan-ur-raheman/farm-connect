# Requirements Document

## Introduction

FarmConnect is a farm investment and contract platform connecting farmers with investors/consumers. The platform consists of a Node.js/Express/TypeScript backend (PostgreSQL + Prisma, Redis, Razorpay, Twilio) and a React Native/Expo mobile app. This document captures requirements for four phases of missing features and correctness fixes identified through codebase analysis:

- Phase 1: Critical correctness fixes (KYC admin flow, dispute resolution, escrow consistency, rate limiting)
- Phase 2: Real-time features (WebSocket chat, push notifications)
- Phase 3: Performance and reliability (wallet balance caching, input sanitization, dependency fixes)
- Phase 4: Testing (unit and integration tests)

---

## Glossary

- **API_Server**: The Node.js/Express backend application
- **Admin**: A user with `role = ADMIN` in the User model
- **KYC_Service**: The backend module responsible for Know Your Customer document verification
- **Dispute_Service**: The backend module responsible for managing contract disputes
- **Escrow_Service**: The backend module responsible for managing escrow funds held against contracts
- **Notification_Service**: The backend module responsible for creating in-app and push notifications
- **Socket_Server**: The Socket.io server attached to the HTTP server for real-time communication
- **Chat_Client**: The React Native chat screen that connects to the Socket_Server
- **Wallet_Service**: The backend module responsible for managing user wallet balances and transactions
- **Rate_Limiter**: The express-rate-limit middleware applied to API routes
- **Push_Service**: The component of Notification_Service that delivers push notifications via the Expo Push API
- **Sanitizer**: The middleware or utility responsible for stripping dangerous content from user-supplied text fields
- **OTP**: One-time password used for phone-based authentication
- **Escrow_Ledger**: The `EscrowLedger` Prisma model recording all escrow credit/debit events for a contract
- **Contract**: The `Contract` Prisma model representing an agreement between a farmer and a consumer
- **Dispute**: The `Dispute` Prisma model representing a raised dispute against a contract
- **Wallet_Transaction**: The `WalletTransaction` Prisma model recording credits and debits to a user's wallet
- **JWT**: JSON Web Token used for authenticating HTTP and WebSocket connections

---

## Requirements

### Requirement 1: KYC Admin Verification Flow

**User Story:** As an Admin, I want to review submitted KYC documents and approve or reject them, so that only verified users can participate in contracts.

#### Acceptance Criteria

1. THE KYC_Service SHALL expose a `GET /api/kyc/pending` endpoint that returns all users whose `kyc_status` is `SUBMITTED`, accessible only to callers whose JWT contains `role = ADMIN`.
2. WHEN an Admin sends `POST /api/kyc/:userId/verify`, THE KYC_Service SHALL update the target user's `kyc_status` to `VERIFIED` and return the updated user record.
3. WHEN an Admin sends `POST /api/kyc/:userId/reject` with a `reason` string, THE KYC_Service SHALL update the target user's `kyc_status` to `REJECTED` and persist the rejection reason.
4. IF the `userId` path parameter in a KYC verification or rejection request does not correspond to an existing user, THEN THE KYC_Service SHALL return a 404 error response.
5. IF a caller without `role = ADMIN` attempts to access any `/api/kyc/*` endpoint, THEN THE API_Server SHALL return a 401 or 403 error response.
6. WHEN a user's `kyc_status` transitions to `VERIFIED` or `REJECTED`, THE Notification_Service SHALL create an in-app notification for that user indicating the new status.

---

### Requirement 2: Dispute Resolution

**User Story:** As an Admin, I want to resolve open disputes by providing a resolution decision, so that frozen escrow funds are redistributed and contracts reach a final state.

#### Acceptance Criteria

1. WHEN an Admin sends `POST /api/disputes/:id/resolve` with a `resolution` string and an `outcome` of either `RELEASE_TO_FARMER` or `REFUND_TO_CONSUMER`, THE Dispute_Service SHALL update the dispute's `status` to `RESOLVED`, set the `resolution` field, and set `resolved_at` to the current timestamp.
2. WHEN a dispute is resolved with outcome `RELEASE_TO_FARMER`, THE Escrow_Service SHALL transfer the `escrow_frozen` amount from the contract's escrow to the farmer's wallet and update the contract `status` to `COMPLETED`.
3. WHEN a dispute is resolved with outcome `REFUND_TO_CONSUMER`, THE Escrow_Service SHALL transfer the `escrow_frozen` amount from the contract's escrow back to the consumer's wallet and update the contract `status` to `CANCELLED`.
4. WHEN a dispute is resolved, THE Notification_Service SHALL create an in-app notification for both the contract's `farmer_id` and `consumer_id` containing the resolution text.
5. IF the dispute `id` in the path parameter does not correspond to an existing dispute, THEN THE Dispute_Service SHALL return a 404 error response.
6. IF the dispute's current `status` is not `OPEN` or `UNDER_REVIEW`, THEN THE Dispute_Service SHALL return a 400 error response and leave all records unchanged.
7. IF a caller without `role = ADMIN` attempts to access `POST /api/disputes/:id/resolve`, THEN THE API_Server SHALL return a 401 or 403 error response.
8. THE Dispute_Service SHALL perform the dispute status update, escrow redistribution, wallet credit, and contract status update within a single database transaction so that partial failures leave no inconsistent state.

---

### Requirement 3: Fix freezeEscrow Inconsistency

**User Story:** As a developer, I want escrow freezing to route through the Dispute module rather than creating disputes directly in the Escrow module, so that dispute creation logic is not duplicated and remains consistent.

#### Acceptance Criteria

1. THE Escrow_Service `freezeEscrow` function SHALL update the contract `status` to `DISPUTED` and return without creating a `Dispute` record.
2. WHEN a caller invokes the escrow freeze endpoint, THE API_Server SHALL subsequently call the Dispute_Service `createDispute` function to create the associated `Dispute` record.
3. THE Dispute_Service `createDispute` function SHALL remain the single authoritative location for inserting rows into the `Dispute` table.
4. WHEN `freezeEscrow` is called, THE Escrow_Service SHALL set the `escrow_frozen` field on the contract to the frozen amount rather than creating a duplicate dispute entry.

---

### Requirement 4: Global Rate Limiting

**User Story:** As a platform operator, I want all API endpoints to be protected by rate limiting, so that abusive clients cannot overwhelm the server or brute-force authentication.

#### Acceptance Criteria

1. THE Rate_Limiter SHALL apply a limit of no more than 100 requests per 15-minute window per IP address to all routes matching `/api/*`.
2. THE Rate_Limiter SHALL apply a stricter limit of no more than 10 requests per 15-minute window per IP address to all routes matching `/api/auth/*`.
3. WHEN a client exceeds the applicable rate limit, THE API_Server SHALL respond with HTTP status 429 and a JSON body containing a human-readable `message` field.
4. THE Rate_Limiter SHALL be registered in `app.ts` before any route handlers so that it applies to all subsequent middleware.
5. WHERE the `X-Forwarded-For` header is present, THE Rate_Limiter SHALL use the first IP in that header as the client identifier to support reverse-proxy deployments.

---

### Requirement 5: WebSocket Real-time Chat

**User Story:** As a user, I want chat messages to appear instantly without polling, so that conversations feel responsive and live.

#### Acceptance Criteria

1. THE Socket_Server SHALL be attached to the same HTTP server instance used by the Express application in `server.ts`.
2. WHEN a client initiates a WebSocket connection, THE Socket_Server SHALL require a valid JWT in the `auth.token` handshake field and reject connections with missing or invalid tokens with a 401 error.
3. WHEN a client successfully authenticates, THE Socket_Server SHALL join that socket to a room named after the authenticated user's `userId`.
4. WHEN a new `Message` record is persisted via the chat REST endpoint, THE Socket_Server SHALL emit a `new_message` event containing the full message payload to the room of each participant in the conversation.
5. THE Chat_Client SHALL connect to the Socket_Server on mount using the `socket.io-client` library, passing the stored JWT as the `auth.token` handshake option.
6. WHEN the Chat_Client receives a `new_message` event for the active conversation, THE Chat_Client SHALL append the message to the displayed message list without requiring a page reload or manual refresh.
7. WHEN the Chat_Client unmounts or the user navigates away, THE Chat_Client SHALL disconnect the socket to release server resources.
8. IF the Socket_Server receives a connection from a client whose JWT is expired or malformed, THEN THE Socket_Server SHALL emit an `error` event and close the connection.

---

### Requirement 6: Push Notifications

**User Story:** As a user, I want to receive push notifications on my device when important events occur, so that I stay informed even when the app is in the background.

#### Acceptance Criteria

1. THE API_Server SHALL expose `POST /api/users/push-token` (authenticated) that accepts an `expo_push_token` string and persists it to the `expo_push_token` field on the authenticated user's record.
2. THE Prisma schema SHALL include an `expo_push_token` field of type `String?` on the `User` model.
3. WHEN the Notification_Service creates an in-app notification for a user, THE Push_Service SHALL check whether that user has a non-null `expo_push_token` and, if so, send a push notification via the Expo Push API containing the notification `title` and `message`.
4. IF the Expo Push API returns a delivery error for a specific token, THEN THE Push_Service SHALL log the error and continue processing remaining notifications without throwing an exception.
5. THE mobile app SHALL request push notification permissions from the device on first launch using `expo-notifications` and, upon grant, register the Expo push token with the backend via `POST /api/users/push-token`.
6. WHEN the mobile app receives a foreground push notification, THE mobile app SHALL display it using the `expo-notifications` foreground handler.

---

### Requirement 7: Wallet Balance Caching

**User Story:** As a user, I want wallet balance reads to be fast and consistent, so that the app feels responsive and balance figures are accurate.

#### Acceptance Criteria

1. THE Wallet_Service SHALL maintain a `balance` field on the `WalletTransaction` model (already present as `balance_after`) that reflects the running balance after each transaction, so that the current balance can be read from the most recent transaction record rather than aggregating all rows.
2. WHEN a new `WalletTransaction` is created, THE Wallet_Service SHALL compute the new balance as `previous_balance + amount` for CREDIT or `previous_balance - amount` for DEBIT and store it in `balance_after` atomically within the same database write.
3. THE API_Server SHALL cache the wallet balance for each user in Redis under the key `wallet_balance:{userId}` with a TTL of 60 seconds.
4. WHEN a new `WalletTransaction` is created for a user, THE Wallet_Service SHALL invalidate the Redis cache entry `wallet_balance:{userId}` so that the next read reflects the updated balance.
5. WHEN `GET /api/wallet/balance` is called, THE Wallet_Service SHALL return the cached balance if present, or compute it from the latest `WalletTransaction.balance_after` and repopulate the cache.

---

### Requirement 8: Input Sanitization

**User Story:** As a platform operator, I want user-supplied text to be sanitized before storage, so that stored content cannot be used to inject scripts or malicious markup.

#### Acceptance Criteria

1. THE Sanitizer SHALL strip HTML tags and JavaScript event attributes from the following fields before they are written to the database: `FarmListing.description`, `Message.text`, and `Dispute.description`.
2. WHEN a request body contains a text field subject to sanitization, THE Sanitizer SHALL process the field value before the request reaches the service layer.
3. THE Sanitizer SHALL preserve plain-text content including Unicode characters, line breaks, and standard punctuation after stripping HTML.
4. IF a sanitized field value exceeds the maximum allowed length after sanitization, THEN THE API_Server SHALL return a 400 error response with a descriptive message.

---

### Requirement 9: Mobile Axios Dependency

**User Story:** As a developer, I want axios to be an explicit dependency in the mobile project, so that the build is reproducible and does not rely on transitive resolution.

#### Acceptance Criteria

1. THE mobile project's `package.json` SHALL list `axios` as a direct dependency in the `dependencies` section.
2. WHEN the mobile project is installed with `npm install`, THE `axios` package SHALL be resolvable without relying on a transitive dependency from another package.

---

### Requirement 10: Backend Unit Tests — Escrow Logic

**User Story:** As a developer, I want unit tests for escrow operations, so that regressions in fund management are caught before deployment.

#### Acceptance Criteria

1. THE test suite SHALL verify that `createEscrowDeposit` increments `contract.escrow_held` by the deposited amount.
2. THE test suite SHALL verify that `releaseWageToFarmer` decrements `contract.escrow_held` and increments `contract.farmer_paid` by the released amount.
3. THE test suite SHALL verify that `finalSettlement` sets `contract.status` to `COMPLETED` and transfers the remaining escrow balance.
4. IF `releaseWageToFarmer` is called with an amount greater than the available escrow, THEN the function SHALL throw a `BadRequestError`.
5. THE test suite SHALL verify that after `freezeEscrow` is called, the contract `status` is `DISPUTED` and no `Dispute` record is created by the Escrow_Service.

---

### Requirement 11: Backend Unit Tests — Contract State Machine

**User Story:** As a developer, I want unit tests for contract state transitions, so that invalid state changes are reliably rejected.

#### Acceptance Criteria

1. THE test suite SHALL verify that `acceptContract` transitions a `PENDING` contract to `ACTIVE`.
2. THE test suite SHALL verify that `rejectContract` transitions a `PENDING` contract to `CANCELLED`.
3. IF `acceptContract` is called on a contract whose `status` is not `PENDING`, THEN the function SHALL throw a `BadRequestError`.
4. IF `cancelContract` is called on an `ACTIVE` contract with `escrow_held > 0`, THEN the function SHALL throw a `BadRequestError`.
5. THE test suite SHALL verify that `completeContract` transitions an `ACTIVE` contract to `COMPLETED`.

---

### Requirement 12: Backend Unit Tests — Payment Signature Verification

**User Story:** As a developer, I want unit tests for Razorpay payment signature verification, so that tampered payment callbacks are reliably rejected.

#### Acceptance Criteria

1. THE test suite SHALL verify that a correctly computed HMAC-SHA256 signature passes verification.
2. THE test suite SHALL verify that a tampered or incorrect signature fails verification and causes the handler to return a 400 error.
3. THE test suite SHALL verify that a missing signature field in the request body causes the handler to return a 400 error.

---

### Requirement 13: Backend Unit Tests — OTP Rate Limiting

**User Story:** As a developer, I want unit tests for OTP rate limiting, so that the brute-force protection on authentication is verified.

#### Acceptance Criteria

1. THE test suite SHALL verify that `checkOtpRateLimit` returns `true` for the first 5 calls within a one-hour window for a given phone number.
2. THE test suite SHALL verify that `checkOtpRateLimit` returns `false` on the 6th call within the same one-hour window.
3. THE test suite SHALL verify that after the one-hour window expires, `checkOtpRateLimit` returns `true` again for the same phone number.

---

### Requirement 14: Integration Tests — Full Contract Lifecycle

**User Story:** As a developer, I want integration tests covering the full contract lifecycle, so that end-to-end correctness of the contract and escrow flow is verified.

#### Acceptance Criteria

1. THE integration test SHALL create a listing, create a contract, accept the contract, deposit escrow, release a wage, and complete the contract in sequence, asserting correct state at each step.
2. THE integration test SHALL verify that `contract.escrow_held` equals the sum of all deposits minus the sum of all wage releases after each operation.
3. THE integration test SHALL verify that `contract.status` is `COMPLETED` after `finalSettlement` is called.
4. THE integration test SHALL verify that a consumer cannot deposit escrow into a contract they do not own.
5. THE integration test SHALL verify that a farmer cannot release a wage exceeding the available escrow balance.

---

### Requirement 15: Integration Tests — Dispute Flow

**User Story:** As a developer, I want integration tests for the dispute and resolution flow, so that escrow redistribution correctness is verified end-to-end.

#### Acceptance Criteria

1. THE integration test SHALL create an active contract with deposited escrow, raise a dispute, and verify that the contract `status` transitions to `DISPUTED`.
2. THE integration test SHALL verify that resolving a dispute with `RELEASE_TO_FARMER` credits the farmer's wallet by the `escrow_frozen` amount and sets the contract `status` to `COMPLETED`.
3. THE integration test SHALL verify that resolving a dispute with `REFUND_TO_CONSUMER` credits the consumer's wallet by the `escrow_frozen` amount and sets the contract `status` to `CANCELLED`.
4. THE integration test SHALL verify that attempting to resolve an already-resolved dispute returns a 400 error.
5. THE integration test SHALL verify that a non-admin user cannot call the resolve endpoint and receives a 401 or 403 response.
