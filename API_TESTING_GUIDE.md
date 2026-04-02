# 🧪 FarmConnect API Testing Setup - Complete

## ✅ What's Been Created

### 1. Automated Test Script
**File:** `backend/tests/api-manual-test.ts`

A comprehensive TypeScript script that tests all major API endpoints:
- ✅ Health check
- ✅ Authentication (OTP send/verify, token refresh, logout)
- ✅ User profile (get/update)
- ✅ Farm listings (CRUD operations)
- ✅ Contracts (create, get, manage)
- ✅ Wallet (balance, transactions)
- ✅ Notifications (get, mark as read)

**Run with:**
```bash
cd backend
npx tsx tests/api-manual-test.ts
```

**Features:**
- Color-coded console output
- Automatic token management
- Test result summary with pass/fail count
- Creates test data automatically
- Cleans up after tests

---

### 2. Postman Collection
**File:** `backend/tests/FarmConnect-API.postman_collection.json`

Complete Postman collection with 40+ requests organized by feature:
- 📁 Health & System
- 📁 Authentication (4 requests)
- 📁 User Profile (3 requests)
- 📁 Farm Listings (6 requests)
- 📁 Contracts (8 requests)
- 📁 Wallet & Payments (4 requests)
- 📁 Notifications (3 requests)
- 📁 Chat (4 requests)

**Features:**
- Automatic token management via environment variables
- Pre-configured test data
- Request chaining (auto-extracts IDs from responses)
- Bearer token authentication configured

**Import:**
1. Open Postman → Import
2. Select `backend/tests/FarmConnect-API.postman_collection.json`
3. Start testing!

---

### 3. Testing Guide
**File:** `backend/tests/README.md`

Comprehensive documentation including:
- Quick start instructions
- cURL command examples
- API endpoint reference table
- Test data information
- Troubleshooting tips
- Testing checklist

---

## 🚀 How to Test Your APIs

### Method 1: Automated Script (Fastest)

```bash
# Terminal 1: Start the server
cd backend
npm run dev

# Terminal 2: Run tests
cd backend
npx tsx tests/api-manual-test.ts
```

**Expected Output:**
```
🚀 FarmConnect API Test Suite
Starting comprehensive API tests...

============================================================
🧪 TEST: 0. Health Check
============================================================
ℹ️  GET http://localhost:3000/health
✅ Status: 200
✅ Server Status: OK
...

============================================================
📊 TEST SUMMARY
============================================================
✅ Health Check
✅ Send OTP
✅ Verify OTP
✅ Refresh Token
...
------------------------------------------------------------
Total: 18/18 tests passed (100.00%)
============================================================
```

---

### Method 2: Postman (Best for Manual Testing)

**Step 1: Import Collection**
1. Open Postman
2. Click **Import**
3. Select `backend/tests/FarmConnect-API.postman_collection.json`

**Step 2: Test Authentication Flow**
1. Open **Health Check** → Send → Verify 200 OK
2. Open **Authentication → Send OTP** → Send
3. Open **Authentication → Verify OTP** → Send (OTP: `123456`)
4. Access token is now automatically set for all requests

**Step 3: Test Other Endpoints**
- Navigate through each folder
- Send requests in order (they build on each other)
- Observe responses and auto-populated variables

---

### Method 3: cURL (Quick Spot Checks)

**Example: Complete Auth Flow**
```bash
# 1. Health Check
curl http://localhost:3000/health

# 2. Send OTP
curl -X POST http://localhost:3000/api/auth/otp/send \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919999888877"}'

# 3. Verify OTP (Dev Mode: OTP is 123456)
curl -X POST http://localhost:3000/api/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919999888877", "otp": "123456"}'

# Save the accessToken from response

# 4. Get User Profile
curl http://localhost:3000/api/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# 5. Create Listing
curl -X POST http://localhost:3000/api/listings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "Test Farm",
    "area_acres": 5,
    "price_per_acre": 50000,
    "crops": ["Tomato"],
    "location_name": "Nashik",
    "latitude": 19.9975,
    "longitude": 73.7898,
    "is_organic": true
  }'
```

---

## 📋 Existing Integration Tests

The project already has comprehensive Vitest tests:

### Run All Tests
```bash
cd backend
npm test
```

### Test Files

| File | Description |
|------|-------------|
| `tests/integration/contract-lifecycle.test.ts` | Full contract flow from creation to completion |
| `tests/integration/dispute-flow.test.ts` | Dispute creation and resolution |
| `tests/unit/payment.service.test.ts` | Payment processing logic |
| `tests/unit/escrow.service.test.ts` | Escrow operations |
| `tests/unit/wallet.service.test.ts` | Wallet transactions |
| `tests/unit/kyc.service.test.ts` | KYC verification |
| `tests/unit/redis.test.ts` | Redis caching |
| `tests/unit/sanitize.test.ts` | HTML sanitization |

---

## 🎯 Testing Checklist

Use this checklist to ensure comprehensive testing:

### Authentication
- [ ] Send OTP
- [ ] Verify OTP with correct code
- [ ] Verify OTP with wrong code (should fail)
- [ ] Refresh access token
- [ ] Logout

### User Management
- [ ] Get current user profile
- [ ] Update user profile
- [ ] Update push token

### Farm Listings
- [ ] Get all listings (paginated)
- [ ] Get single listing
- [ ] Create listing
- [ ] Update listing
- [ ] Delete listing
- [ ] Get farmer's listings

### Contracts
- [ ] Create contract
- [ ] Get contract by ID
- [ ] Get farmer contracts
- [ ] Get consumer contracts
- [ ] Accept contract
- [ ] Reject contract
- [ ] Cancel contract
- [ ] Complete contract

### Wallet & Payments
- [ ] Get wallet balance
- [ ] Get wallet transactions
- [ ] Create Razorpay order
- [ ] Test webhook signature verification

### Notifications
- [ ] Get notifications
- [ ] Mark as read
- [ ] Mark all as read

### Chat (Real-time)
- [ ] Get conversations
- [ ] Create conversation
- [ ] Send message
- [ ] Receive message (WebSocket)

---

## 🔧 Troubleshooting

### Server Won't Start
```bash
# Check if .env exists
ls backend/.env

# If not, create from example
cp backend/.env.example backend/.env

# Edit with your credentials
code backend/.env
```

### Database Connection Error
```bash
# Verify PostgreSQL is running
psql -U postgres -h localhost -c "\l"

# Check connection string
grep DATABASE_URL backend/.env
```

### Tests Fail
```bash
# Regenerate Prisma client
cd backend
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database
npm run db:seed
```

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill it
kill -9 <PID>

# Restart server
npm run dev
```

---

## 📊 Test Coverage

### Automated Script Coverage
- ✅ 18 endpoints tested
- ✅ Authentication flow
- ✅ CRUD operations
- ✅ Error handling

### Postman Collection Coverage
- ✅ 40+ requests
- ✅ All major features
- ✅ Real-world scenarios

### Integration Test Coverage
- ✅ Contract lifecycle
- ✅ Dispute resolution
- ✅ Payment processing
- ✅ Escrow management
- ✅ Wallet operations
- ✅ KYC verification
- ✅ Redis caching

---

## 🎓 Learning Resources

### Understanding the Tests
1. **Read the test script**: `backend/tests/api-manual-test.ts`
   - See how authentication works
   - Learn request/response formats
   - Understand error handling

2. **Study the Postman collection**: 
   - See all available endpoints
   - Understand request chaining
   - Learn environment variables

3. **Review integration tests**:
   - See complex business logic testing
   - Learn test data setup/teardown
   - Understand edge cases

---

## 🚀 Next Steps

1. **Start the server:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Run automated tests:**
   ```bash
   npx tsx tests/api-manual-test.ts
   ```

3. **Import Postman collection** and explore endpoints

4. **Run existing integration tests:**
   ```bash
   npm test
   ```

5. **Test specific features** using cURL or Postman

---

## 📞 Support

If you encounter issues:
1. Check `backend/tests/README.md` for troubleshooting
2. Review server logs for errors
3. Verify `.env` configuration
4. Ensure database is running and seeded

**Happy Testing! 🎉**
