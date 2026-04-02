# FarmConnect Monorepo

## Structure

```
farm-connect-v2/
├── mobile/          # React Native + Expo app
│   ├── app/         # Expo Router screens
│   ├── src/         # Components, stores, utils
│   ├── package.json
│   └── ...
│
├── backend/         # Node.js + Express + Prisma API
│   ├── src/
│   ├── prisma/
│   ├── package.json
│   └── ...
│
└── package.json    # Root workspace config
```

## Getting Started

### Mobile
```bash
cd mobile && npm install && npm run dev
```

### Backend
```bash
cd backend && npm install && npm run dev
```

## Tech Stack

- **Mobile**: React Native, Expo SDK 55, Zustand, NativeWind, expo-router
- **Backend**: Node.js, Express, TypeScript, Prisma, PostgreSQL, JWT, Twilio, Razorpay, Upstash Redis, Cloudinary
