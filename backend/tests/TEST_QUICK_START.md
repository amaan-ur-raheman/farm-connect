# 🧪 FarmConnect Backend - API Testing Quick Start

## ⚡ Quick Start (3 Steps)

### Step 1: Start the Backend Server

Open a terminal and run:

```bash
cd backend
npm run dev
```

You should see:
```
🚀 Server running on port 3000 in development mode
📖 Health check: http://localhost:3000/health
```

**Keep this terminal open!**

---

### Step 2: Open a New Terminal for Testing

In a **new terminal window**, navigate to the backend folder:

```bash
cd backend
```

---

### Step 3: Choose Your Test Type

#### Option A: Comprehensive Automated Tests (Recommended)

Tests all 47 API endpoints automatically:

```bash
npx tsx tests/api-comprehensive-test.ts
```

**Duration:** ~30 seconds  
**Coverage:** All endpoints with authentication flow

---

#### Option B: Quick cURL Tests (Manual Verification)

Test core endpoints interactively:

```bash
./test-api-curl.sh
```

**Duration:** ~10 seconds  
**Coverage:** Health, Auth, Users, Listings, Contracts, Wallet, Notifications

---

#### Option C: Unit & Integration Tests

Run Vitest test suite:

```bash
npm test
```

**Duration:** ~15 seconds  
**Coverage:** Authentication, Utils, Services, Business Logic

---

## 📊 Test Coverage Summary

| Test Suite | Tests | Duration | Best For |
|------------|-------|----------|----------|
| **Comprehensive API** | 47 | 30s | Full verification before deployment |
| **cURL Quick Test** | 15 | 10s | Quick sanity check |
| **Vitest Unit** | 25+ | 15s | Development testing |

---

## 🎯 What Gets Tested

### Comprehensive API Test (`api-comprehensive-test.ts`)

✅ **Health & Infrastructure** (2 tests)
- Server health check
- Rate limiting

✅ **Authentication** (4 tests)
- Send OTP
- Verify OTP & Login
- Token refresh
- Logout

✅ **User Management** (3 tests)
- Get profile
- Update profile
- Update push token

✅ **Farm Listings** (6 tests)
- Create listing
- Get my listings
- Get all listings (public)
- Get single listing
- Update listing

✅ **Contracts** (5 tests)
- Create contract
- Get farmer contracts
- Get consumer contracts
- Get contract by ID
- Accept contract

✅ **Wallet** (2 tests)
- Get balance
- Get transactions

✅ **Payments** (1 test)
- Create payment order

✅ **Escrow** (1 test)
- Get escrow ledger

✅ **Farm Updates** (2 tests)
- Create update
- Get updates

✅ **Deliveries** (3 tests)
- Create delivery
- Get deliveries
- Update delivery status

✅ **Disputes** (3 tests)
- Create dispute
- Get disputes
- Update dispute

✅ **Reviews** (2 tests)
- Create review
- Get reviews

✅ **Notifications** (3 tests)
- Get notifications
- Mark as read
- Mark all as read

✅ **Chat** (2 tests)
- Create conversation
- Get conversations

✅ **KYC** (1 test)
- Get KYC status

✅ **Session Management** (2 tests)
- Logout farmer
- Logout consumer

---

## 🔑 Test Credentials

All test users are pre-seeded in the database:

| Role | Phone Number | Name | OTP |
|------|-------------|------|-----|
| Farmer | +919876543210 | Rajesh Kumar | 123456 |
| Investor | +919876543211 | Vikram Mehta | 123456 |
| Farmer 2 | +919876543212 | Sunita Patil | 123456 |

**Note:** In development mode, OTP is always `123456`

---

## 🐛 Troubleshooting

### "Backend server is not running"

**Solution:**
```bash
cd backend
npm run dev
```

Make sure you see: `Server running on port 3000`

---

### "Database connection error"

**Solution:**
```bash
# Check your .env file
cat backend/.env

# Regenerate Prisma client
npm run db:generate

# Push schema to database
npm run db:push
```

---

### "Prisma Client not found"

**Solution:**
```bash
npm run db:generate
```

---

### "Rate limit exceeded"

**Solution:** Restart the server or wait 15 minutes

```bash
# Restart server (Ctrl+C then restart)
npm run dev
```

---

### "OTP not received"

In development mode:
- OTP is always `123456`
- Check console logs for the actual OTP
- SMS is only sent in production

---

## 📁 Test Files Location

```
backend/tests/
├── api-comprehensive-test.ts      # Full API test suite (47 tests)
├── api-quick-test.ts              # Quick sanity check (5 tests)
├── api-simple-test.ts             # Simple test example
├── auth.test.ts                   # Unit tests for auth
├── listing.test.ts                # Unit tests for listings
├── utils.test.ts                  # Unit tests for utils
├── integration/
│   ├── contract-lifecycle.test.ts
│   └── dispute-flow.test.ts
└── unit/
    ├── auth.test.ts
    ├── contract.service.test.ts
    ├── escrow.service.test.ts
    ├── kyc.service.test.ts
    ├── listing.test.ts
    ├── payment.service.test.ts
    ├── redis.test.ts
    ├── sanitize.test.ts
    ├── wallet.service.test.ts
    └── utils.test.ts
```

---

## 🎓 Testing Best Practices

1. **Before Development:** Run unit tests
   ```bash
   npm test -- tests/unit/
   ```

2. **During Development:** Run specific module tests
   ```bash
   npm test -- tests/unit/auth.test.ts
   ```

3. **Before Commit:** Run integration tests
   ```bash
   npm test -- tests/integration/
   ```

4. **Before Deployment:** Run comprehensive API test
   ```bash
   npx tsx tests/api-comprehensive-test.ts
   ```

5. **For Manual Testing:** Use Postman collection or cURL script
   ```bash
   ./test-api-curl.sh
   ```

---

## 📈 Interpreting Results

### ✅ All Tests Pass (Green)

Your API is working perfectly! Ready for deployment.

### ⚠️ Some Tests Fail (Yellow/Red)

Check the error messages:
- **401 Unauthorized** → Authentication issue
- **403 Forbidden** → Permission problem
- **404 Not Found** → Wrong endpoint or missing resource
- **500 Internal Server Error** → Server-side bug
- **Network Error** → Server not running

### Example Output

```
══════════════════════════════════════════════════════════════
📊 COMPREHENSIVE TEST SUMMARY
══════════════════════════════════════════════════════════════

📦 BY MODULE:
──────────────────────────────────────────────────────────────
   ✅ Health & Infrastructure: 2/2 (100%)
   ✅ Authentication: 4/4 (100%)
   ✅ User Management: 3/3 (100%)
   ✅ Farm Listings: 6/6 (100%)
   ✅ Contracts: 5/5 (100%)
   ✅ Wallet: 2/2 (100%)
   ...

──────────────────────────────────────────────────────────────

📈 OVERALL: 47/47 tests passed (100.0%)
══════════════════════════════════════════════════════════════
```

---

## 🔗 Additional Resources

- **Full Testing Guide:** `tests/COMPREHENSIVE_TESTING_GUIDE.md`
- **API Documentation:** `API_DOCUMENTATION.md`
- **Main README:** `../../README.md`
- **Postman Collection:** `tests/FarmConnect-API.postman_collection.json`

---

## 🚀 One-Liner Commands

```bash
# Start server and run tests (in separate terminals)
Terminal 1: npm run dev
Terminal 2: npx tsx tests/api-comprehensive-test.ts

# Run all Vitest tests
npm test

# Run specific test file
npm test -- tests/unit/auth.test.ts

# Quick API check
./test-api-curl.sh

# Reset database and re-seed
npm run db:push -- --force-reset && npm run db:seed
```

---

**Happy Testing!** 🎉

If all tests pass, your FarmConnect API is production-ready!
