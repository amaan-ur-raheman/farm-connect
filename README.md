# FarmConnect

An agricultural investment platform connecting farmers with investors through a secure, escrow-based contract system.

```
farm-connect-v2/
├── mobile/     # React Native + Expo (iOS, Android, Web)
└── backend/    # Node.js + Express REST API + WebSocket
```

---

## Tech Stack

**Mobile** — React Native 0.83, Expo SDK 55, Expo Router, Zustand, TanStack Query, NativeWind v4, Ky, Socket.io, Lucide icons

**Backend** — Node.js, Express, TypeScript, PostgreSQL + Prisma, Upstash Redis, BullMQ, Socket.io, JWT, Zod

**Services** — Twilio (OTP), Razorpay (payments), Cloudinary (images)

---

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL
- API keys: Twilio, Razorpay, Cloudinary, Upstash Redis

### Backend

```bash
cd backend
npm install
cp .env.example .env    # fill in credentials
npm run db:generate
npm run db:push
npm run db:seed         # optional test data
npm run dev             # → http://localhost:3000
```

### Mobile

```bash
cd mobile
npm install
echo "EXPO_PUBLIC_API_URL=http://localhost:3000" > .env
npm start
```

Press `i` (iOS simulator), `a` (Android emulator), `w` (web), or scan QR for a physical device.

> **Physical device / Android emulator:** replace `localhost` with your machine's LAN IP or use `http://10.0.2.2:3000` for Android emulator.

---

## Environment Variables

### `backend/.env`

```env
# Database
DATABASE_URL="postgresql://user:pass@host:5432/farmconnect"
DIRECT_URL="postgresql://user:pass@host:5432/farmconnect"

# JWT
JWT_SECRET="min-32-char-secret"
JWT_REFRESH_SECRET="min-32-char-secret"
ACCESS_TOKEN_EXPIRY="15m"
REFRESH_TOKEN_EXPIRY="7d"

# Twilio
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."
TWILIO_PHONE_NUMBER="+1..."

# Razorpay
RAZORPAY_KEY_ID="rzp_test_..."
RAZORPAY_KEY_SECRET="..."
RAZORPAY_WEBHOOK_SECRET="whsec_..."

# Cloudinary
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."

# Upstash Redis
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."
```

### `mobile/.env`

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

---

## Features

**Farmers** — create/manage listings, upload images, accept/reject contracts, post farm updates, manage deliveries, handle disputes, withdraw earnings via wallet

**Investors** — browse marketplace, invest via contracts, escrow-protected payments, track deliveries, rate farms, real-time chat

**Shared** — OTP authentication (SMS), biometric login, KYC verification, wallet, push notifications, dark mode, i18n

---

## API Reference

| Resource | Endpoints |
|---|---|
| Auth | `POST /api/auth/otp/send` · `/otp/verify` · `/refresh` · `/logout` |
| Listings | `GET/POST /api/listings` · `GET /api/listings/mine` · `DELETE /api/listings/:id` |
| Contracts | `GET /api/contracts/farmer\|consumer` · `POST /api/contracts` · `POST /api/contracts/:id/action` |
| Payments | `POST /api/payments/create-order` · `/verify` · `/webhook` |
| Wallet | `GET /api/wallet/balance` · `/transactions` · `POST /api/wallet/withdraw` |
| Chat | `GET /api/chat/conversations` · `GET /api/chat/:id/messages` |
| KYC | `POST /api/kyc/upload` |
| Weather | `GET /api/weather` |
| Health | `GET /health` |

Full reference: [`backend/API_DOCUMENTATION.md`](./backend/API_DOCUMENTATION.md)

---

## Database Schema

13 models: `User`, `FarmListing`, `Contract`, `FarmUpdate`, `EscrowLedger`, `Delivery`, `Dispute`, `WalletTransaction`, `Review`, `AuditLog`, `Notification`, `Conversation`, `Message`

```bash
npm run db:studio   # open Prisma Studio
```

---

## Scripts

```bash
# Root — run both services concurrently
npm run dev
npm run dev:backend
npm run dev:mobile

# Backend
npm run dev           # hot-reload dev server
npm run build         # compile TypeScript
npm run db:generate   # generate Prisma client
npm run db:push       # push schema to DB
npm run db:migrate    # run migrations
npm run db:seed       # seed test data
npm run test          # Vitest unit tests

# Mobile
npm start             # Expo dev server
npm run ios           # iOS simulator
npm run android       # Android emulator
npm run web           # browser
npm run lint          # ESLint
```

---

## Security

- JWT access + refresh tokens with short expiry
- Rate limiting: 100 req/15 min general, 10 req/15 min on auth routes
- Helmet security headers, CORS, XSS protection
- Input validation with Zod on all endpoints
- SQL injection prevention via Prisma ORM
- OTP rate limiting + bcrypt hashing

---

## Testing

```bash
cd backend
npm test              # run all tests
npm test -- --watch   # watch mode
npm test auth.test.ts # single file
```

**Test credentials (development)**
- Phone: `+919876543210` — OTP prints to backend console
- Visa: `4111 1111 1111 1111` · Mastercard: `5267 3181 8797 5449` (any CVV)

---

## Troubleshooting

**Mobile can't reach backend**
1. Confirm backend is up: `curl http://localhost:3000/health`
2. Check `EXPO_PUBLIC_API_URL` in `mobile/.env`
3. Physical device must be on the same WiFi; use your LAN IP (`ipconfig getifaddr en0` on macOS)

**Database errors**
```bash
cd backend && npm run db:generate && npm run db:push
```

**OTP not received** — check Twilio credentials and account balance; in dev mode the OTP is logged to the console regardless.

---

## Documentation

- [API Documentation](./backend/API_DOCUMENTATION.md)
- [Mobile Setup Guide](./mobile/SETUP.md)
- [Testing Guide](./backend/tests/README.md)
