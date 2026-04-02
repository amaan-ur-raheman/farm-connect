# FarmConnect API Documentation

## Base URL
```
Development: http://localhost:3000
Production: https://your-domain.com
```

## Authentication

All protected endpoints require JWT authentication via the `Authorization` header:

```
Authorization: Bearer <access_token>
```

### Getting Access Token

1. **Send OTP**
   ```bash
   POST /api/auth/otp/send
   Content-Type: application/json
   
   {
     "phone": "+919876543210"
   }
   ```

2. **Verify OTP & Login**
   ```bash
   POST /api/auth/otp/verify
   Content-Type: application/json
   
   {
     "phone": "+919876543210",
     "otp": "123456"
   }
   
   Response:
   {
     "success": true,
     "data": {
       "user": { "id": "...", "phone": "...", "role": "FARMER" },
       "accessToken": "eyJhbG...",
       "refreshToken": "eyJhbG..."
     }
   }
   ```

---

## API Endpoints

### 👤 Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/otp/send` | Send OTP to phone | ❌ |
| POST | `/otp/verify` | Verify OTP and login | ❌ |
| POST | `/refresh` | Refresh access token | ❌ |
| POST | `/logout` | Logout user | ✅ |

---

### 📋 Listings (`/api/listings`)

#### Get All Listings
```bash
GET /api/listings?page=1&limit=12&status=ACTIVE&search=nashik
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 12)
- `status` (string): Filter by status (DRAFT, ACTIVE, SOLD, INACTIVE)
- `search` (string): Search by name or location
- `is_organic` (boolean): Filter organic farms
- `sort` (string): Sort order (price_asc, price_desc, newest)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "listing-123",
      "name": "Sahyadri Farms",
      "area_acres": 10.5,
      "price_per_acre": 50000,
      "crops": ["Wheat", "Corn"],
      "location_name": "Nashik",
      "latitude": 19.9975,
      "longitude": 73.7898,
      "soil_type": "Black",
      "irrigation_type": "Drip",
      "is_organic": true,
      "images": ["https://..."],
      "status": "ACTIVE",
      "farmer": {
        "id": "farmer-123",
        "name": "Rajesh Kumar",
        "kyc_status": "VERIFIED"
      }
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 12,
    "pages": 5
  }
}
```

#### Create Listing
```bash
POST /api/listings
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "My Farm",
  "description": "Beautiful farm land",
  "area_acres": 10.5,
  "price_per_acre": 50000,
  "crops": ["Wheat", "Corn"],
  "location_name": "Nashik",
  "latitude": 19.9975,
  "longitude": 73.7898,
  "soil_type": "Black",
  "irrigation_type": "Drip",
  "is_organic": true
}
```

#### Upload Images
```bash
POST /api/listings/:id/upload-image
Content-Type: multipart/form-data
Authorization: Bearer <token>

FormData:
- image: <file>
```

#### Get My Listings
```bash
GET /api/listings/mine
Authorization: Bearer <token>
```

#### Delete Listing
```bash
DELETE /api/listings/:id
Authorization: Bearer <token>
```

---

### 📜 Contracts (`/api/contracts`)

#### Get Farmer Contracts
```bash
GET /api/contracts/farmer
Authorization: Bearer <token>
```

#### Get Consumer Contracts
```bash
GET /api/contracts/consumer
Authorization: Bearer <token>
```

#### Create Contract
```bash
POST /api/contracts
Content-Type: application/json
Authorization: Bearer <token>

{
  "listing_id": "listing-123",
  "acreage": 5.0,
  "start_date": "2024-01-01",
  "end_date": "2025-01-01"
}
```

#### Contract Actions
```bash
POST /api/contracts/:id/action
Content-Type: application/json
Authorization: Bearer <token>

{
  "action": "ACCEPT" // ACCEPT, REJECT, COMPLETE, RELEASE_WAGE
}
```

#### Get Contract Details
```bash
GET /api/contracts/:id
Authorization: Bearer <token>
```

---

### 💰 Wallet (`/api/wallet`)

#### Get Balance
```bash
GET /api/wallet/balance
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "balance": 150000,
    "currency": "INR"
  }
}
```

#### Get Transactions
```bash
GET /api/wallet/transactions
Authorization: Bearer <token>
```

#### Withdraw Funds
```bash
POST /api/wallet/withdraw
Content-Type: application/json
Authorization: Bearer <token>

{
  "amount": 50000
}
```

---

### 💳 Payments (`/api/payments`)

#### Create Payment Order
```bash
POST /api/payments/create-order
Content-Type: application/json
Authorization: Bearer <token>

{
  "contract_id": "contract-123",
  "amount": 50000
}

Response:
{
  "success": true,
  "data": {
    "order_id": "order_xxx",
    "amount": 50000,
    "currency": "INR"
  }
}
```

#### Verify Payment
```bash
POST /api/payments/verify
Content-Type: application/json
Authorization: Bearer <token>

{
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "signature_xxx"
}
```

#### Webhook (Razorpay)
```bash
POST /api/payments/webhook
Content-Type: application/json
X-Razorpay-Signature: <webhook_signature>

{
  "event": "payment.captured",
  "payload": { ... }
}
```

---

### 💬 Chat (`/api/chat`)

#### Get Conversations
```bash
GET /api/chat/conversations
Authorization: Bearer <token>
```

#### Get Messages
```bash
GET /api/chat/conversations/:id/messages
Authorization: Bearer <token>
```

#### Send Message
```bash
POST /api/chat/conversations/:id/messages
Content-Type: application/json
Authorization: Bearer <token>

{
  "text": "Hello!"
}
```

---

### 📢 Notifications (`/api/notifications`)

#### Get Notifications
```bash
GET /api/notifications
Authorization: Bearer <token>
```

#### Mark as Read
```bash
PATCH /api/notifications/:id/read
Authorization: Bearer <token>
```

#### Mark All as Read
```bash
PATCH /api/notifications/read-all
Authorization: Bearer <token>
```

---

### 📦 Deliveries (`/api/deliveries`)

#### Get Deliveries
```bash
GET /api/deliveries
Authorization: Bearer <token>

# Filter by contract
GET /api/deliveries/contract/:contractId
```

#### Create Delivery
```bash
POST /api/deliveries
Content-Type: application/json
Authorization: Bearer <token>

{
  "contract_id": "contract-123",
  "yield_amount_kg": 5000,
  "quality_grade": "A"
}
```

#### Verify Delivery
```bash
PATCH /api/deliveries/:id/verify
Authorization: Bearer <token>
```

---

### ⚖️ Disputes (`/api/disputes`)

#### Get Disputes
```bash
GET /api/disputes
Authorization: Bearer <token>
```

#### Create Dispute
```bash
POST /api/disputes
Content-Type: application/json
Authorization: Bearer <token>

{
  "contract_id": "contract-123",
  "reason": "Quality issue",
  "description": "Crops damaged during delivery",
  "evidence_urls": ["https://..."]
}
```

#### Resolve Dispute
```bash
PATCH /api/disputes/:id/resolve
Content-Type: application/json
Authorization: Bearer <token>

{
  "resolution": "Refund approved",
  "escrow_frozen": 10000
}
```

---

### ⭐ Reviews (`/api/reviews`)

#### Get Listing Reviews
```bash
GET /api/reviews/listing/:listingId
```

#### Create Review
```bash
POST /api/reviews
Content-Type: application/json
Authorization: Bearer <token>

{
  "contract_id": "contract-123",
  "rating": 5,
  "comment": "Great experience!"
}
```

---

### 📱 Farm Updates (`/api/updates`)

#### Get Updates
```bash
GET /api/updates/:contractId
Authorization: Bearer <token>
```

#### Create Update
```bash
POST /api/updates
Content-Type: multipart/form-data
Authorization: Bearer <token>

FormData:
- contract_id: contract-123
- caption: "Harvest season begins!"
- media: <file>
```

---

### 👤 Users (`/api/users`)

#### Get Profile
```bash
GET /api/users/me
Authorization: Bearer <token>
```

#### Update Profile
```bash
PATCH /api/users/me
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "John Doe",
  "email": "john@example.com",
  "address": "123 Main St"
}
```

#### Update Push Token
```bash
POST /api/users/push-token
Content-Type: application/json
Authorization: Bearer <token>

{
  "expo_push_token": "ExponentPushToken[...]"
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

### Common HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

---

## Rate Limiting

- **General API:** 100 requests per 15 minutes
- **Auth endpoints:** 10 requests per 15 minutes

Headers included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

---

## WebSocket (Real-time Chat)

Connect to WebSocket:
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: { token: accessToken }
});

// Join your room automatically
socket.on('connect', () => {
  console.log('Connected:', socket.id);
});

// Receive messages
socket.on('new_message', (message) => {
  console.log('New message:', message);
});

// Send message
socket.emit('send_message', {
  conversation_id: 'conv-123',
  text: 'Hello!'
});
```

---

## Testing

Use these test credentials in development mode:

```
Phone: +919876543210
OTP: Check server console (dev mode only)
```

Test Razorpay cards:
- Visa: `4111 1111 1111 1111`
- Mastercard: `5267 3181 8797 5449`
- CVV: Any 3 digits
