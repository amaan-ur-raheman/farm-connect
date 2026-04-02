# 🧪 FarmConnect Backend - Complete API Testing Guide

## 🎯 Quick Start (Choose One Method)

### Method 1: Interactive Test Script (Recommended for First Time) ⭐

This script will guide you through testing step-by-step:

```bash
cd backend
./test-interactive.sh
```

**What it does:**
1. ✅ Checks server health
2. ✅ Sends OTP and asks you to enter it from console
3. ✅ Verifies OTP and logs in
4. ✅ Tests user profile, listings, wallet, notifications
5. ✅ Shows a summary of results

**Duration:** ~2 minutes  
**Best for:** Manual verification, learning the APIs

---

### Method 2: cURL Commands (Full Control)

Follow the step-by-step guide in [`RUN_TESTS_MANUALLY.md`](./RUN_TESTS_MANUALLY.md)

**Best for:** Understanding each API call, debugging

---

### Method 3: Comprehensive Automated Test (Advanced)

Tests all 40+ endpoints automatically:

```bash
cd backend
npx tsx tests/api-test-with-otp.ts
```

**What it does:**
- Prompts for OTPs for both farmer and consumer
- Tests all major business flows
- Creates listings, contracts, deliveries, etc.
- Provides detailed test report

**Duration:** ~5 minutes  
**Best for:** Full regression testing before deployment

---

### Method 4: Unit & Integration Tests (Development)

Run the Vitest test suite:

```bash
cd backend
npm test
```

**Tests:**
- Authentication logic
- Service layer functions
- Business logic (contracts, escrow, payments)
- Integration flows

**Duration:** ~15 seconds  
**Best for:** Development workflow

---

## 📊 Test Coverage Overview

| Test Type | Count | Coverage | Duration | When to Use |
|-----------|-------|----------|----------|-------------|
| **Interactive** | 7 | Core APIs | 2 min | First-time setup, demos |
| **cURL Manual** | 15+ | All endpoints | 10 min | Debugging, exploration |
| **Comprehensive** | 40+ | Full system | 5 min | Pre-deployment |
| **Unit/Integration** | 25+ | Logic layer | 15 sec | Development |

---

## 🔑 Test Credentials

All test users are available after running:

```bash
npm run db:generate
npm run db:push
```

### Test Users

| Role | Phone Number | Name | Default OTP |
|------|-------------|------|-------------|
| Farmer | +919876543210 | Rajesh Kumar | From console |
| Investor | +919876543211 | Vikram Mehta | From console |
| Farmer 2 | +919876543212 | Sunita Patil | From console |

**Important:** In development mode, the OTP is logged to your backend server console:
```
[DEV] OTP for +919876543210: 123456
```

---

## 🚀 Running Each Test Method

### Method 1: Interactive Script

```bash
cd backend
./test-interactive.sh
```

**You'll be prompted to:**
1. Check console for OTP
2. Enter the OTP
3. Watch as tests run automatically

**Expected Output:**
```
✅ Server Health
✅ Send OTP
✅ Verify OTP (with manual entry)
✅ Get User Profile
✅ Get Listings
✅ Get Wallet Balance
✅ Get Notifications

All core API endpoints are working! 🎉
```

---

### Method 2: Manual cURL

See detailed instructions in [`RUN_TESTS_MANUALLY.md`](./RUN_TESTS_MANUALLY.md)

Quick example:
```bash
# Health check
curl http://localhost:3000/health | jq .

# Send OTP
curl -X POST http://localhost:3000/api/auth/otp/send \
  -H "Content-Type: application/json" \
  -d '{"phone":"+919876543210"}' | jq .

# Check console for OTP, then verify
curl -X POST http://localhost:3000/api/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"phone":"+919876543210","otp":"FROM_CONSOLE"}' | jq .
```

---

### Method 3: Comprehensive Test

```bash
cd backend
npx tsx tests/api-test-with-otp.ts
```

**You'll be prompted for:**
1. OTP for Farmer (+919876543210)
2. OTP for Consumer (+919876543211)

**Test Modules:**
- ✅ Health & Infrastructure
- ✅ Authentication (both users)
- ✅ User Management
- ✅ Farm Listings (CRUD)
- ✅ Contracts (creation, acceptance)
- ✅ Wallet (balance, transactions)
- ✅ Payments (order creation)
- ✅ Escrow (ledger viewing)
- ✅ Farm Updates
- ✅ Deliveries
- ✅ Notifications
- ✅ KYC Status

---

### Method 4: Vitest Suite

```bash
cd backend
npm test
```

**Test Files:**
- `tests/unit/auth.test.ts` - Authentication
- `tests/unit/contract.service.test.ts` - Contract logic
- `tests/unit/escrow.service.test.ts` - Escrow calculations
- `tests/unit/payment.service.test.ts` - Payment processing
- `tests/unit/wallet.service.test.ts` - Wallet operations
- `tests/unit/kyc.service.test.ts` - KYC verification
- `tests/integration/contract-lifecycle.test.ts` - Full contract flow
- `tests/integration/dispute-flow.test.ts` - Dispute handling

---

## 📝 Step-by-Step: First Time Testing

### Step 1: Start Backend Server

```bash
cd backend
npm run dev
```

Keep this terminal open!

### Step 2: Run Interactive Test

Open a **new terminal**:

```bash
cd backend
./test-interactive.sh
```

### Step 3: Follow Prompts

1. Script sends OTP automatically
2. Check backend console for OTP
3. Enter OTP when prompted
4. Watch tests run

### Step 4: Review Results

All green ✅ = API is working perfectly!

---

## 🐛 Troubleshooting

### Problem: "Invalid or expired OTP"

**Cause:** Using wrong OTP or OTP expired (5 min TTL)

**Solution:**
1. Send fresh OTP: `curl -X POST http://localhost:3000/api/auth/otp/send ...`
2. Check console IMMEDIATELY for new OTP
3. Use the latest OTP within 5 minutes

---

### Problem: "Server not running"

**Solution:**
```bash
cd backend
npm run dev
```

Wait for: `🚀 Server running on port 3000`

---

### Problem: "Cannot find module 'tsx'"

**Solution:**
```bash
npm install tsx --save-dev
```

---

### Problem: "Prisma Client not found"

**Solution:**
```bash
npm run db:generate
```

---

### Problem: "Database connection error"

**Solution:**
1. Check `.env` file has correct `DATABASE_URL`
2. Verify PostgreSQL is running
3. Run: `npm run db:push`

---

## 📈 Interpreting Results

### All Tests Pass ✅

Your API is production-ready! You can:
- Deploy with confidence
- Show to stakeholders
- Begin mobile app integration

### Some Tests Fail ❌

Check error messages:
- **401 Unauthorized** → Authentication issue (wrong token)
- **403 Forbidden** → Permission problem (wrong user role)
- **404 Not Found** → Endpoint doesn't exist or wrong URL
- **500 Internal Server Error** → Server-side bug (check logs)
- **Network Error** → Server not running

---

## 🎯 Testing Checklist

Before deployment, verify:

- [ ] Health check works
- [ ] OTP authentication works (both users)
- [ ] Token refresh works
- [ ] Protected endpoints require auth
- [ ] Public endpoints work without auth
- [ ] Can create listings
- [ ] Can create contracts
- [ ] Can view wallet balance
- [ ] Can get notifications
- [ ] Database queries return data
- [ ] All unit tests pass
- [ ] Integration tests pass

---

## 📚 Additional Resources

| Document | Purpose |
|----------|---------|
| [`RUN_TESTS_MANUALLY.md`](./RUN_TESTS_MANUALLY.md) | Detailed cURL commands |
| [`COMPREHENSIVE_TESTING_GUIDE.md`](./COMPREHENSIVE_TESTING_GUIDE.md) | Full testing documentation |
| [`TEST_QUICK_START.md`](./TEST_QUICK_START.md) | Quick reference guide |
| [`../API_DOCUMENTATION.md`](../API_DOCUMENTATION.md) | Complete API reference |
| [`../../README.md`](../../README.md) | Main project README |

---

## 🔗 Postman Collection

For manual testing with a GUI:

1. Import: `backend/tests/FarmConnect-API.postman_collection.json`
2. Run requests in order
3. Check console for OTPs
4. Variables auto-manage tokens

---

## 💡 Pro Tips

1. **Always check server logs** - They show OTPs and errors
2. **Use the interactive script first** - It's the easiest
3. **Save access tokens** - Reuse for multiple tests
4. **Test both user roles** - Farmer and Investor have different permissions
5. **Run unit tests frequently** - Catch bugs early

---

## 🎉 Success Criteria

Your FarmConnect API is working correctly if:

✅ Health endpoint returns status "ok"  
✅ OTP is sent and logged to console  
✅ OTP verification returns valid tokens  
✅ Protected endpoints work with token  
✅ Public endpoints work without token  
✅ Database operations succeed  
✅ All unit tests pass  

**If all above pass → Production Ready!** 🚀

---

**Questions?** Check the server logs in your backend terminal for detailed error messages!
