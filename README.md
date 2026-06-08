<div align="center">

# 🌾 FarmConnect

**Connecting Farmers with Investors Through Secure, Escrow-Based Contracts**

[![React Native](https://img.shields.io/badge/React_Native-0.83-61DAFB?logo=react)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK_55-000020?logo=expo)](https://expo.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Latest-4169E1?logo=postgresql)](https://postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://typescriptlang.org/)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Environment Variables](#-environment-variables)
- [Features](#-features)
- [API Reference](#-api-reference)
- [Database Schema](#-database-schema)
- [Available Scripts](#-available-scripts)
- [Security](#-security)
- [Testing](#-testing)
- [Troubleshooting](#-troubleshooting)
- [Documentation](#-documentation)

---

## 🎯 Overview

FarmConnect is an agricultural investment platform that bridges the gap between farmers seeking capital and investors looking for opportunities. The platform facilitates secure transactions through an escrow-based contract system, ensuring trust and transparency for all parties.

### Project Structure

```
farm-connect/
├── mobile/     # React Native + Expo (iOS, Android, Web)
└── backend/    # Node.js + Express REST API + WebSocket
```

---

## 🛠️ Tech Stack

### Mobile
- **Framework:** React Native 0.83, Expo SDK 55, Expo Router
- **State Management:** Zustand, TanStack Query
- **Styling:** NativeWind v4, Lucide Icons
- **Real-time:** Socket.io Client
- **HTTP:** Ky

### Backend
- **Runtime:** Node.js, Express, TypeScript
- **Database:** PostgreSQL, Prisma ORM
- **Queue & Cache:** Upstash Redis, BullMQ
- **Real-time:** Socket.io
- **Validation:** Zod
- **Authentication:** JWT

### Third-Party Services
- **SMS:** Twilio (OTP)
- **Payments:** Razorpay
- **Media:** Cloudinary (images)

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL
- API keys: Twilio, Razorpay, Cloudinary, Upstash Redis

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env    # Fill in your credentials
npm run db:generate
npm run db:push
npm run db:seed         # Optional: seed test data
npm run dev             # → http://localhost:3000
```

### Mobile Setup

```bash
cd mobile
npm install
echo "EXPO_PUBLIC_API_URL=http://localhost:3000" > .env
npm start
```

> **Tips:**
> - Press `i` for iOS simulator, `a` for Android emulator, `w` for web
> - For physical devices, replace `localhost` with your machine's LAN IP
> - Android emulator: use `http://10.0.2.2:3000`

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

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

### Mobile (`mobile/.env`)

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

---

## ✨ Features

### For Farmers
- Create and manage farm listings with image uploads
- Accept or reject investment contracts
- Post farm updates and progress reports
- Manage deliveries and logistics
- Handle disputes through the platform
- Withdraw earnings directly to your wallet

### For Investors
- Browse verified farm listings in the marketplace
- Invest securely via escrow-protected contracts
- Track deliveries and farm progress in real-time
- Rate and review farms after completion
- Communicate directly with farmers through in-app chat

### Platform Features
- 📱 OTP-based authentication (SMS)
- 🔐 Biometric login support
- 🆔 KYC verification
- 💳 Secure wallet & transactions
- 🔔 Push notifications
- 🌙 Dark mode
- 🌍 Internationalization (i18n)

---

## 📡 API Reference

| Resource  | Endpoints |
|-----------|-----------|
| Auth      | `POST /api/auth/otp/send` · `/otp/verify` · `/refresh` · `/logout` |
| Listings  | `GET/POST /api/listings` · `GET /api/listings/mine` · `DELETE /api/listings/:id` |
| Contracts | `GET /api/contracts/farmer\|consumer` · `POST /api/contracts` · `POST /api/contracts/:id/action` |
| Payments  | `POST /api/payments/create-order` · `/verify` · `/webhook` |
| Wallet    | `GET /api/wallet/balance` · `/transactions` · `POST /api/wallet/withdraw` |
| Chat      | `GET /api/chat/conversations` · `GET /api/chat/:id/messages` |
| KYC       | `POST /api/kyc/upload` |
| Weather   | `GET /api/weather` |
| Health    | `GET /health` |

📖 **Full reference:** [`backend/API_DOCUMENTATION.md`](./backend/API_DOCUMENTATION.md)

---

## 🗄️ Database Schema

**13 core models:** `User`, `FarmListing`, `Contract`, `FarmUpdate`, `EscrowLedger`, `Delivery`, `Dispute`, `WalletTransaction`, `Review`, `AuditLog`, `Notification`, `Conversation`, `Message`

```bash
npm run db:studio   # Open Prisma Studio for visual data management
```

---

## 📝 Available Scripts

### Root (Monorepo)
```bash
npm run dev           # Run both backend & mobile concurrently
npm run dev:backend   # Run backend only
npm run dev:mobile    # Run mobile only
```

### Backend
```bash
npm run dev           # Hot-reload dev server
npm run build         # Compile TypeScript
npm run db:generate   # Generate Prisma client
npm run db:push       # Push schema to database
npm run db:migrate    # Run database migrations
npm run db:seed       # Seed test data
npm run test          # Run Vitest unit tests
```

### Mobile
```bash
npm start             # Start Expo dev server
npm run ios           # iOS simulator
npm run android       # Android emulator
npm run web           # Browser
npm run lint          # Run ESLint
```

---

## 🔒 Security

- **Authentication:** JWT access + refresh tokens with short expiry
- **Rate Limiting:** 100 requests/15 min (general), 10 req/15 min (auth routes)
- **Headers:** Helmet security headers, CORS, XSS protection
- **Validation:** Zod input validation on all endpoints
- **Injection Prevention:** Prisma ORM prevents SQL injection
- **OTP Security:** Rate-limited OTP with bcrypt hashing

---

## 🧪 Testing

```bash
cd backend
npm test              # Run all tests
npm test -- --watch   # Watch mode
npm test auth.test.ts # Single file
```

### Test Credentials (Development)
| Field      | Value                              |
|------------|------------------------------------|
| Phone      | `+919876543210`                    |
| OTP        | Printed to backend console         |
| Visa       | `4111 1111 1111 1111`              |
| Mastercard | `5267 3181 8797 5449`              |
| CVV        | Any 3-digit number                 |

---

## 🛠️ Troubleshooting

### Mobile can't reach backend
1. Confirm backend is running: `curl http://localhost:3000/health`
2. Check `EXPO_PUBLIC_API_URL` in `mobile/.env`
3. Physical devices must be on the same WiFi; use your LAN IP:
   ```bash
   # macOS
   ipconfig getifaddr en0
   # Linux
   hostname -I
   ```

### Database errors
```bash
cd backend && npm run db:generate && npm run db:push
```

### OTP not received
- Verify Twilio credentials and account balance
- In development mode, the OTP is always logged to the backend console

---

## 📚 Documentation

- [API Documentation](./backend/API_DOCUMENTATION.md)
- [Mobile Setup Guide](./mobile/SETUP.md)
- [Testing Guide](./backend/tests/README.md)

---

<div align="center">

**FarmConnect** — Empowering Agriculture Through Technology 🌱

</div>
