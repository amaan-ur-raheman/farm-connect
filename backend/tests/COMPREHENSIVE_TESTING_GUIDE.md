# FarmConnect Backend - Complete API Testing Guide

This guide provides comprehensive instructions for testing all FarmConnect API endpoints.

---

## 📋 Prerequisites

Before running tests, ensure:

1. ✅ **Backend server running** on `http://localhost:3000`
2. ✅ **PostgreSQL database** configured and migrated
3. ✅ **Environment variables** set in `backend/.env`
4. ✅ **Database seeded** with test data

### Quick Setup

```bash
cd backend

# 1. Install dependencies (if needed)
npm install

# 2. Generate Prisma client
npm run db:generate

# 3. Push schema to database
npm run db:push

# 4. Seed database with test data
npm run db:seed

# 5. Start the server
npm run dev
```

Keep the server running in one terminal while you run tests in another.

---

## 🚀 Test Suites Overview

FarmConnect includes **3 levels of API testing**:

| Test Suite | Purpose | Coverage | Duration |
|------------|---------|----------|----------|
| **Unit Tests** | Test individual functions | Auth, Utils, Services | ~5 sec |
| **Integration Tests** | Test module interactions | Contracts, Disputes | ~15 sec |
| **API Tests** | Test HTTP endpoints | All REST APIs | ~30 sec |

---

## 🧪 Running Tests

### Option 1: Comprehensive API Test (Recommended)

Tests **ALL** API endpoints with full authentication flow:

```bash
cd backend
npx tsx tests/api-comprehensive-test.ts
```

**What it tests:**
- ✅ Health & Infrastructure (2 tests)
- ✅ Authentication (4 tests)
- ✅ User Management (3 tests)
- ✅ Farm Listings (6 tests)
- ✅ Contracts (5 tests)
- ✅ Wallet (2 tests)
- ✅ Payments (1 test)
- ✅ Escrow (1 test)
- ✅ Farm Updates (2 tests)
- ✅ Deliveries (3 tests)
- ✅ Disputes (3 tests)
- ✅ Reviews (2 tests)
- ✅ Notifications (3 tests)
- ✅ Chat (2 tests)
- ✅ KYC (1 test)
- ✅ Session Management (2 tests)

**Total: 47 tests** covering every endpoint!

---

### Option 2: Quick API Test

Faster test for core functionality:

```bash
npx tsx tests/api-quick-test.ts
```

**Tests:**
- ✅ Health check
- ✅ Public listings
- ✅ Database connection
- ✅ Rate limiting

---

### Option 3: Vitest Unit & Integration Tests

Run the automated test suite:

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/unit/auth.test.ts

# Run in watch mode
npm test -- --watch

# Run with coverage
npm test -- --coverage
```

**Available Test Files:**
- `tests/unit/auth.test.ts` - Authentication logic
- `tests/unit/listing.test.ts` - Listing validation
- `tests/unit/utils.test.ts` - Utility functions
- `tests/unit/escrow.service.test.ts` - Escrow calculations
- `tests/unit/contract.service.test.ts` - Contract logic
- `tests/unit/payment.service.test.ts` - Payment processing
- `tests/unit/wallet.service.test.ts` - Wallet operations
- `tests/unit/kyc.service.test.ts` - KYC verification
- `tests/unit/sanitize.test.ts` - HTML sanitization
- `tests/unit/redis.test.ts` - Redis operations
- `tests/integration/contract-lifecycle.test.ts` - Full contract flow
- `tests/integration/dispute-flow.test.ts` - Dispute handling

---

### Option 4: Postman Collection (Manual Testing)

For interactive manual testing:

1. **Import Collection:**
   - Open Postman
   - Import `backend/tests/FarmConnect-API.postman_collection.json`

2. **Run Collection:**
   - Start with "Health Check"
   - Proceed through authentication
   - Test each module systematically

3. **Auto-managed Variables:**
   - `accessToken` - JWT token
   - `refreshToken` - Refresh token
   - `userId` - Current user ID
   - `listingId` - Last created listing
   - `contractId` - Last created contract

---

## 📊 Test Users

The seeded database includes these test users:

| Role | Phone | Name | OTP |
|------|-------|------|-----|
| Farmer | +919876543210 | Rajesh Kumar | 123456 |
| Investor | +919876543211 | Vikram Mehta | 123456 |
| Farmer 2 | +919876543212 | Sunita Patil | 123456 |

**Note:** In development mode, OTP is always `123456` (logged to console)

---

## 🔍 API Endpoint Reference

### Authentication (`/api/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/otp/send` | ❌ | Send OTP to phone |
| POST | `/otp/verify` | ❌ | Verify OTP & login |
| POST | `/refresh` | ❌ | Refresh access token |
| POST | `/logout` | ✅ | Logout user |

### Users (`/api/users`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/me` | ✅ | Get current user profile |
| PATCH | `/me` | ✅ | Update user profile |
| POST | `/push-token` | ✅ | Update push notification token |

### Listings (`/api/listings`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | ❌ | Get all listings (paginated) |
| GET | `/:id` | ❌ | Get listing by ID |
| POST | `/` | ✅ | Create new listing |
| PATCH | `/:id` | ✅ (owner) | Update listing |
| DELETE | `/:id` | ✅ (owner) | Delete listing |
| GET | `/my-listings` | ✅ | Get farmer's listings |

### Contracts (`/api/contracts`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | ✅ | Create contract |
| GET | `/:id` | ✅ | Get contract by ID |
| GET | `/farmer` | ✅ | Get farmer's contracts |
| GET | `/consumer` | ✅ | Get consumer's contracts |
| POST | `/:id/action` | ✅ | Accept/Reject/Cancel/Complete |

### Wallet (`/api/wallet`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/balance` | ✅ | Get wallet balance |
| GET | `/transactions` | ✅ | Get transaction history |

### Payments (`/api/payments`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/order` | ✅ | Create Razorpay order |
| POST | `/escrow/deposit` | ✅ | Deposit to escrow |
| POST | `/webhook` | ❌ | Razorpay webhook |

### Escrow (`/api/escrow`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/contract/:id` | ✅ | Get escrow ledger |

### Farm Updates (`/api/updates`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | ✅ | Create farm update |
| GET | `/contract/:id` | ✅ | Get updates for contract |

### Deliveries (`/api/deliveries`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | ✅ | Create delivery |
| GET | `/contract/:id` | ✅ | Get deliveries |
| PATCH | `/:id` | ✅ | Update delivery status |

### Disputes (`/api/disputes`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | ✅ | Create dispute |
| GET | `/contract/:id` | ✅ | Get disputes |
| PATCH | `/:id` | ✅ | Update dispute |

### Reviews (`/api/reviews`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | ✅ | Create review |
| GET | `/contract/:id` | ✅ | Get reviews |

### Notifications (`/api/notifications`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | ✅ | Get notifications |
| POST | `/mark-read` | ✅ | Mark as read |
| POST | `/mark-all-read` | ✅ | Mark all as read |

### Chat (`/api/chat`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/conversations` | ✅ | Get conversations |
| POST | `/conversations` | ✅ | Create conversation |
| GET | `/conversations/:id/messages` | ✅ | Get messages |
| POST | `/conversations/:id/messages` | ✅ | Send message |

### KYC (`/api/kyc`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/status` | ✅ | Get KYC status |

---

## 🎯 Example Test Workflows

### Workflow 1: Complete Investment Cycle

```bash
# 1. Login as investor
# 2. Browse marketplace (GET /listings)
# 3. View property details (GET /listings/:id)
# 4. Create contract (POST /contracts)
# 5. Farmer accepts contract (POST /contracts/:id/action)
# 6. Create payment order (POST /payments/order)
# 7. Monitor escrow (GET /escrow/contract/:id)
# 8. Receive farm updates (GET /updates/contract/:id)
# 9. Track deliveries (GET /deliveries/contract/:id)
# 10. Leave review (POST /reviews)
```

### Workflow 2: Farmer Operations

```bash
# 1. Login as farmer
# 2. Create listing (POST /listings)
# 3. View contracts (GET /contracts/farmer)
# 4. Accept contract (POST /contracts/:id/action)
# 5. Post update (POST /updates)
# 6. Create delivery (POST /deliveries)
# 7. Check wallet (GET /wallet/balance)
# 8. Chat with investor (POST /chat/conversations)
```

### Workflow 3: Dispute Resolution

```bash
# 1. Create dispute (POST /disputes)
# 2. View dispute (GET /disputes/contract/:id)
# 3. Update status (PATCH /disputes/:id)
# 4. Resolve dispute (PATCH /disputes/:id)
```

---

## 🐛 Troubleshooting

### Server won't start

```bash
# Check if port 3000 is in use
lsof -i :3000

# Kill the process
kill -9 <PID>

# Restart server
npm run dev
```

### Database connection errors

```bash
# Verify DATABASE_URL in .env
grep DATABASE_URL backend/.env

# Regenerate Prisma client
npm run db:generate

# Push schema again
npm run db:push
```

### Tests fail with "Prisma Client not found"

```bash
# Regenerate Prisma Client
npm run db:generate

# Run tests again
npm test
```

### Rate limiting blocks tests

If you hit rate limits during testing:

```bash
# Wait 15 minutes or restart server
# Rate limits reset on server restart
```

### OTP not received

In development mode:
- OTP is always `123456`
- Check console logs for OTP value
- Twilio SMS only sent in production

---

## 📈 Test Results Interpretation

### Passing Tests (✅)

All systems operational! Your API is working correctly.

### Failing Tests (❌)

Check the error message:
- **401 Unauthorized** → Authentication issue
- **403 Forbidden** → Permission issue
- **404 Not Found** → Wrong endpoint or missing resource
- **500 Internal Server Error** → Server-side bug
- **Network Error** → Server not running

### Skipped Tests (⚠️)

Some tests may skip if prerequisites aren't met (e.g., no listings exist).

---

## 🎓 Best Practices

1. **Always seed database** before running comprehensive tests
2. **Run unit tests frequently** during development
3. **Run integration tests** before committing changes
4. **Run comprehensive API tests** before deployment
5. **Use Postman** for exploratory testing
6. **Monitor test coverage** to identify gaps

---

## 📝 Test Data Cleanup

After extensive testing, clean up test data:

```bash
# Reset database (WARNING: deletes ALL data)
npm run db:push -- --force-reset

# Re-seed with fresh data
npm run db:seed
```

---

## 🔗 Additional Resources

- **API Documentation:** `API_DOCUMENTATION.md`
- **Main README:** `../../README.md`
- **Prisma Schema:** `prisma/schema.prisma`
- **Test Utilities:** `tests/utils/helpers.ts`

---

## 🚀 Quick Command Reference

```bash
# Start server
npm run dev

# Run all tests
npm test

# Run comprehensive API test
npx tsx tests/api-comprehensive-test.ts

# Run quick API test
npx tsx tests/api-quick-test.ts

# Run specific unit test
npm test -- tests/unit/auth.test.ts

# Run integration tests
npm test -- tests/integration/

# Seed database
npm run db:seed

# Reset database
npm run db:push -- --force-reset
```

---

**Happy Testing!** 🎉

For issues or questions, refer to the main [README.md](../../README.md) or contact the development team.
