# 🧪 How to Run API Tests - Manual Instructions

Due to shell configuration issues, please follow these steps manually:

---

## ✅ Step 1: Verify Server is Running

In your terminal where you ran `npm run dev`, you should see:
```
🚀 Server running on port 3000 in development mode
📖 Health check: http://localhost:3000/health
```

If not running, start it:
```bash
cd backend
npm run dev
```

---

## ✅ Step 2: Test with cURL (Quick Verification)

Open a **new terminal** and run these commands one by one:

### Test 1: Health Check
```bash
curl http://localhost:3000/health | jq .
```

Expected output:
```json
{
  "status": "ok",
  "timestamp": "..."
}
```

---

### Test 2: Send OTP to Farmer
```bash
curl -X POST http://localhost:3000/api/auth/otp/send \
  -H "Content-Type: application/json" \
  -d '{"phone":"+919876543210"}' | jq .
```

**IMPORTANT:** Now check your **backend server console** (the terminal where `npm run dev` is running). You should see:
```
[DEV] OTP for +919876543210: 123456
```

Note down the 6-digit OTP!

---

### Test 3: Verify OTP (Replace XXXXXX with actual OTP)
```bash
curl -X POST http://localhost:3000/api/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"phone":"+919876543210","otp":"XXXXXX"}' | jq .
```

Replace `XXXXXX` with the OTP from your server console.

Expected output:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "name": "Rajesh Kumar",
      "role": "FARMER"
    },
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG..."
  }
}
```

**Copy the `accessToken`!**

---

### Test 4: Get User Profile (Replace TOKEN)
```bash
curl http://localhost:3000/api/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" | jq .
```

Replace `YOUR_ACCESS_TOKEN_HERE` with the actual token from step 3.

Expected output:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "name": "Rajesh Kumar",
      "phone": "+919876543210"
    }
  }
}
```

---

### Test 5: Get Listings (Public - No Auth Required)
```bash
curl "http://localhost:3000/api/listings?limit=5" | jq .
```

Expected output:
```json
{
  "success": true,
  "data": [...],
  "pagination": {...}
}
```

---

### Test 6: Get Wallet Balance (Protected)
```bash
curl http://localhost:3000/api/wallet/balance \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" | jq .
```

Expected output:
```json
{
  "success": true,
  "data": {
    "balance": 0
  }
}
```

---

## ✅ Step 3: Run Automated Test Script (Alternative)

If you want to run the full automated test suite:

### Option A: Using the Test Script

1. Open your backend server console and note the OTP when sent

2. In a new terminal, run:
```bash
cd backend
node --loader tsx tests/api-test-with-otp.ts
```

3. When prompted, enter the OTP from your server console

---

### Option B: Using Postman

1. Import the Postman collection from `tests/FarmConnect-API.postman_collection.json`

2. Run the requests in order:
   - Health Check
   - Send OTP → Check console for OTP
   - Verify OTP → Enter OTP from console
   - Continue with other endpoints

---

## 🔍 Troubleshooting

### Issue: "Invalid or expired OTP"

**Solution:** 
1. Send OTP again: `curl -X POST http://localhost:3000/api/auth/otp/send ...`
2. Check server console for the NEW OTP
3. Use the latest OTP (they expire after 5 minutes)

---

### Issue: "Server not running"

**Solution:**
```bash
cd backend
npm run dev
```

---

### Issue: "Cannot find module 'tsx'"

**Solution:**
```bash
npm install tsx --save-dev
```

---

### Issue: "Prisma Client not found"

**Solution:**
```bash
npm run db:generate
```

---

## 📊 Quick Test Checklist

Run these in order to verify your API:

- [ ] Health check works
- [ ] Can send OTP
- [ ] Can verify OTP (with correct code from console)
- [ ] Can access protected endpoint with token
- [ ] Can get listings
- [ ] Can get wallet balance

If all above pass, your API is working correctly! ✅

---

## 🎯 Full Endpoint Testing

For comprehensive testing, test each module:

### Authentication
```bash
# Send OTP
curl -X POST http://localhost:3000/api/auth/otp/send \
  -H "Content-Type: application/json" \
  -d '{"phone":"+919876543210"}'

# Verify (use OTP from console)
curl -X POST http://localhost:3000/api/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"phone":"+919876543210","otp":"FROM_CONSOLE"}'
```

### Users (requires auth token)
```bash
curl http://localhost:3000/api/users/me \
  -H "Authorization: Bearer TOKEN"
```

### Listings
```bash
# Public
curl "http://localhost:3000/api/listings?limit=5"

# Create (requires auth)
curl -X POST http://localhost:3000/api/listings \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Farm",
    "area_acres": 5,
    "price_per_acre": 50000,
    "crops": ["Tomato"],
    "location_name": "Nashik",
    "latitude": 19.9975,
    "longitude": 73.7898
  }'
```

### Contracts (requires auth)
```bash
# Get farmer contracts
curl http://localhost:3000/api/contracts/farmer \
  -H "Authorization: Bearer TOKEN"

# Create contract
curl -X POST http://localhost:3000/api/contracts \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "listing_id": "LISTING_ID",
    "crop": "Tomato",
    "acreage": 2,
    "total_amount": 100000,
    "start_date": "2026-04-03T00:00:00Z",
    "end_date": "2026-10-03T00:00:00Z"
  }'
```

### Wallet (requires auth)
```bash
curl http://localhost:3000/api/wallet/balance \
  -H "Authorization: Bearer TOKEN"
```

### Notifications (requires auth)
```bash
curl http://localhost:3000/api/notifications?limit=10 \
  -H "Authorization: Bearer TOKEN"
```

---

## 📝 Test Results Template

Use this to track your test results:

```
API Test Results
================

✅ Health Check: PASS/FAIL
✅ Send OTP: PASS/FAIL
✅ Verify OTP: PASS/FAIL (OTP: ______)
✅ Get Profile: PASS/FAIL
✅ Get Listings: PASS/FAIL
✅ Get Wallet: PASS/FAIL
✅ Get Notifications: PASS/FAIL

Overall: X/7 tests passed
```

---

## 🎉 Success Criteria

Your API is working correctly if:
- ✅ Health check returns status "ok"
- ✅ OTP is sent and logged to console
- ✅ OTP verification returns access token
- ✅ Protected endpoints work with valid token
- ✅ Public endpoints work without token
- ✅ Database queries return data

---

**Need Help?** 

Check the server logs in your backend terminal for detailed error messages!
