# Mobile App Setup Guide

## 🔧 Configuration

### API URL Configuration

The app supports multiple ways to configure the API base URL:

#### Option 1: Environment Variable (Recommended)

Create `.env` file in the mobile directory:

```bash
# For iOS Simulator / Web
EXPO_PUBLIC_API_URL=http://localhost:3000

# For Android Emulator
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000

# For Physical Device (replace with your computer's IP)
EXPO_PUBLIC_API_URL=http://192.168.1.100:3000

# For Production
EXPO_PUBLIC_API_URL=https://api.yourdomain.com
```

#### Option 2: app.json Configuration

Add to `app.json`:

```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://localhost:3000"
    }
  }
}
```

**Note:** `app.json` takes precedence over `.env`

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. Configure API URL

Choose based on your device:

| Device Type | API URL |
|-------------|---------|
| iOS Simulator | `http://localhost:3000` |
| Android Emulator | `http://10.0.2.2:3000` |
| Physical Device (WiFi) | `http://YOUR_IP:3000` |
| Web Browser | `http://localhost:3000` |

**Find your computer's IP:**
- **macOS:** `ipconfig getifaddr en0`
- **Windows:** `ipconfig`
- **Linux:** `hostname -I`

### 3. Start Development Server

```bash
npm start
```

Then choose:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Press `w` for web
- Scan QR code with Expo Go app for physical device

---

## 📱 Running on Physical Device

### Step 1: Find Your Computer's IP

**macOS:**
```bash
ipconfig getifaddr en0
# Output: 192.168.1.100
```

**Windows:**
```bash
ipconfig
# Look for IPv4 Address under your network adapter
```

### Step 2: Update .env

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.100:3000
```

### Step 3: Ensure Backend is Running

Make sure your backend server is running and accessible:

```bash
cd ../backend
npm run dev
```

Verify backend is reachable from your phone:
- Open browser on phone
- Navigate to: `http://YOUR_IP:3000/health`
- Should see: `{"status": "ok", ...}`

### Step 4: Connect Phone to Same WiFi

⚠️ **Important:** Your phone and computer must be on the **same WiFi network**.

### Step 5: Scan QR Code

1. Start Expo: `npm start`
2. Open Expo Go app on phone
3. Scan QR code from terminal

---

## 🔍 Troubleshooting

### "Network request failed"

**Causes:**
1. Backend server not running
2. Wrong IP address
3. Phone and computer on different networks
4. Firewall blocking connection

**Solutions:**
```bash
# 1. Check backend is running
curl http://localhost:3000/health

# 2. Test from phone browser
# Visit: http://YOUR_IP:3000/health

# 3. Disable firewall temporarily (for testing)
# macOS: System Preferences → Security → Firewall
# Windows: Windows Defender Firewall

# 4. Ensure same WiFi network
# Check WiFi name on both devices
```

### "Invalid host" error

Make sure CORS is configured in backend:

```typescript
// backend/src/app.ts
app.use(cors({
  origin: '*', // For development only!
  credentials: true
}));
```

### Backend not accessible from Android

Android requires cleartext HTTP traffic to be explicitly allowed:

The app already has this configured in `android/app/src/main/AndroidManifest.xml`:

```xml
<application android:usesCleartextTraffic="true">
```

---

## 🌐 Production Deployment

For production builds, update the API URL to your production server:

```bash
EXPO_PUBLIC_API_URL=https://api.farmconnect.com
```

Then build:

```bash
eas build --platform ios
eas build --platform android
```

---

## 📋 Environment Variables Summary

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `EXPO_PUBLIC_API_URL` | Backend API base URL | `http://localhost:3000` | ✅ Yes |

---

## 🔗 Related Documentation

- [Backend API Docs](../backend/API_DOCUMENTATION.md)
- [Testing Guide](../backend/tests/README.md)
- [Main README](../README.md)
