# FarmConnect API Testing Guide

This guide provides comprehensive instructions for testing the FarmConnect backend APIs.

---

## 📋 Prerequisites

Before testing, ensure you have:

1. **Backend server running** on `http://localhost:3000`
2. **PostgreSQL database** configured and migrated
3. **Environment variables** set in `backend/.env`
4. **Database seeded** with test data

---

## 🚀 Quick Start

### Option 1: Automated Test Script (Recommended)

Run the comprehensive test script that tests all endpoints:

```bash
cd backend

# Make sure server is running in another terminal
npm run dev

# In a new terminal, run the test script
npx tsx tests/api-manual-test.ts
```

**What it tests:**
- ✅ Health check
- ✅ OTP authentication (send & verify)
- ✅ Token refresh
- ✅ User profile (get & update)
- ✅ Farm listings (CRUD operations)
- ✅ Contracts (create & manage)
- ✅ Wallet balance & transactions
- ✅ Notifications
- ✅ Logout

---

### Option 2: Postman Collection (Manual Testing)

**Import the collection:**
1. Open Postman
2. Click **Import**
3. Select `backend/tests/FarmConnect-API.postman_collection.json`
4. Collection will be imported with all endpoints

**Using the collection:**
1. Start with **Health Check** to verify server is running
2. Proceed to **Authentication → Send OTP**
3. Verify OTP (use `123456` in development mode)
4. All subsequent requests will automatically use the access token
5. Test each endpoint group systematically

**Environment variables** (automatically set by collection):
- `baseUrl` - API base URL (default: `http://localhost:3000`)
- `accessToken` - JWT access token
- `refreshToken` - JWT refresh token
- `userId` - Current user ID
- `listingId` - Last created listing ID
- `contractId` - Last created contract ID
- `testPhone` - Test phone number

---

### Option 3: cURL Commands (Quick Tests)

#### Health Check
```bash
curl http://localhost:3000/health
```

#### Send OTP
```bash
curl -X POST http://localhost:3000/api/auth/otp/send \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919999888877"}'
```

#### Verify OTP (Dev Mode)
```bash
curl -X POST http://localhost:3000/api/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919999888877", "otp": "123456"}'
```

#### Get User Profile
```bash
curl http://localhost:3000/api/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Create Listing
```bash
curl -X POST http://localhost:3000/api/listings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "Test Farm",
    "description": "Organic farm",
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

## 📁 Existing Integration Tests

The project includes comprehensive Vitest integration tests:

### Run All Tests
```bash
cd backend
npm test
```

### Run Specific Test Files

**Contract Lifecycle Tests:**
```bash
npm test -- tests/integration/contract-lifecycle.test.ts
```

**Dispute Flow Tests:**
```bash
npm test -- tests/integration/dispute-flow.test.ts
```

**Unit Tests:**
```bash
npm test -- tests/unit/
```

---

## 🔍 API Endpoint Reference

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/otp/send` | Send OTP to phone | ❌ |
| POST | `/otp/verify` | Verify OTP & login | ❌ |
| POST | `/refresh` | Refresh access token | ❌ |
| POST | `/logout` | Logout user | ✅ |

### Users (`/api/users`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/me` | Get current user profile | ✅ |
| PATCH | `/me` | Update user profile | ✅ |
| POST | `/push-token` | Update push notification token | ✅ |

### Listings (`/api/listings`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | Get all listings (paginated) | ❌ |
| GET | `/:id` | Get listing by ID | ❌ |
| POST | `/` | Create new listing | ✅ |
| PATCH | `/:id` | Update listing | ✅ (owner) |
| DELETE | `/:id` | Delete listing | ✅ (owner) |
| GET | `/my-listings` | Get farmer's listings | ✅ |

### Contracts (`/api/contracts`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/` | Create contract | ✅ |
| GET | `/:id` | Get contract by ID | ✅ |
| GET | `/farmer` | Get farmer's contracts | ✅ |
| GET | `/consumer` | Get consumer's contracts | ✅ |
| POST | `/:id/action` | Accept/Reject/Cancel/Complete | ✅ |

### Wallet (`/api/wallet`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/balance` | Get wallet balance | ✅ |
| GET | `/transactions` | Get transaction history | ✅ |

### Payments (`/api/payments`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/order` | Create Razorpay order | ✅ |
| POST | `/escrow/deposit` | Deposit to escrow | ✅ |
| POST | `/webhook` | Razorpay webhook | ❌ |

### Notifications (`/api/notifications`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | Get notifications (paginated) | ✅ |
| POST | `/mark-read` | Mark notification as read | ✅ |
| POST | `/mark-all-read` | Mark all as read | ✅ |

### Chat (`/api/chat`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/conversations` | Get user conversations | ✅ |
| POST | `/conversations` | Create conversation | ✅ |
| GET | `/conversations/:id/messages` | Get messages | ✅ |
| POST | `/conversations/:id/messages` | Send message | ✅ |

---

## 🧪 Test Data

### Default Test Users (from seed)

**Farmer:**
- Phone: `+919876543210`
- Name: Rajesh Kumar
- Role: FARMER

**Investor:**
- Phone: `+919876543211`
- Name: Vikram Mehta
- Role: CONSUMER

**Farmer 2:**
- Phone: `+919876543212`
- Name: Sunita Patil
- Role: FARMER

### Development Mode OTP

In development mode, the OTP is always: **`123456`**

This is logged to the console when you send an OTP.

---

## 🔧 Testing Tips

### 1. Rate Limiting
- Auth endpoints are rate-limited (10 requests per 15 minutes)
- General API: 100 requests per 15 minutes
- If you hit limits, wait or restart the server

### 2. Token Management
- Access token expires in 15 minutes
- Refresh token expires in 7 days
- Use the refresh endpoint to get new access tokens

### 3. Database Cleanup
After testing, you may want to clean up test data:
```bash
# Reset database (WARNING: deletes all data)
npm run db:push -- --force-reset

# Re-seed
npm run db:seed
```

### 4. WebSocket Testing (Chat)
For real-time chat testing, use the Socket.IO client:
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: { token: 'YOUR_ACCESS_TOKEN' }
});

socket.on('new_message', (message) => {
  console.log('New message:', message);
});
```

---

## 🐛 Troubleshooting

### Server won't start
```bash
# Check if port 3000 is in use
lsof -i :3000

# Kill the process
kill -9 <PID>

# Check .env configuration
cat backend/.env
```

### Database connection errors
```bash
# Verify PostgreSQL is running
psql -U postgres -h localhost -c "\l"

# Check DATABASE_URL in .env
grep DATABASE_URL backend/.env
```

### Prisma client not generated
```bash
cd backend
npm run db:generate
```

### Tests fail with "Prisma Client not found"
```bash
# Regenerate Prisma Client
npm run db:generate

# Run tests again
npm test
```

---

## 📊 Testing Checklist

Before deployment, verify:

- [ ] Health check returns 200
- [ ] OTP authentication works
- [ ] Token refresh works
- [ ] User CRUD operations work
- [ ] Listing CRUD operations work
- [ ] Contract creation works
- [ ] Contract actions (accept/reject) work
- [ ] Wallet balance displays correctly
- [ ] Notifications are created and retrieved
- [ ] Chat messaging works in real-time
- [ ] Webhook signature verification works
- [ ] Rate limiting is active
- [ ] Error handling returns proper responses
- [ ] All existing integration tests pass

---

## 📝 Additional Resources

- **Postman Collection**: `backend/tests/FarmConnect-API.postman_collection.json`
- **Automated Tests**: `backend/tests/`
- **API Documentation**: See README.md
- **Prisma Schema**: `backend/prisma/schema.prisma`

---

## 🎯 Next Steps

1. **Run automated tests**: `npx tsx tests/api-manual-test.ts`
2. **Import Postman collection** for manual testing
3. **Test critical flows**: Authentication → Listing → Contract → Payment
4. **Verify WebSocket**: Test real-time chat
5. **Test webhooks**: Use Razorpay test webhooks
6. **Run integration tests**: `npm test`

Happy Testing! 🚀
