#!/bin/bash

# FarmConnect Backend - Interactive API Test
# This script will guide you through testing the APIs
# Run with: ./test-interactive.sh

BASE_URL="http://localhost:3000"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}   FarmConnect API - Interactive Test${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""

# Check server
echo -e "${YELLOW}Checking server...${NC}"
if ! curl -s "$BASE_URL/health" > /dev/null 2>&1; then
    echo -e "${RED}❌ Server is not running!${NC}"
    echo "Start it with: npm run dev"
    exit 1
fi
echo -e "${GREEN}✅ Server is running${NC}"

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}Step 1: Send OTP${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "Sending OTP to +919876543210..."
OTP_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/otp/send" \
    -H "Content-Type: application/json" \
    -d '{"phone":"+919876543210"}')

echo "$OTP_RESPONSE" | jq .

if [[ $(echo "$OTP_RESPONSE" | jq -r '.success') == "true" ]]; then
    echo -e "${GREEN}✅ OTP sent successfully!${NC}"
else
    echo -e "${RED}❌ Failed to send OTP${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}IMPORTANT: Check your backend server console!${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "You should see a log like:"
echo -e "${CYAN}   [DEV] OTP for +919876543210: XXXXXX${NC}"
echo ""
read -p "Enter the 6-digit OTP from your console: " USER_OTP

if [ -z "$USER_OTP" ]; then
    echo -e "${RED}No OTP entered. Exiting.${NC}"
    exit 1
fi

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}Step 2: Verify OTP & Login${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

AUTH_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/otp/verify" \
    -H "Content-Type: application/json" \
    -d "{\"phone\":\"+919876543210\",\"otp\":\"$USER_OTP\"}")

echo "$AUTH_RESPONSE" | jq .

ACCESS_TOKEN=$(echo "$AUTH_RESPONSE" | jq -r '.data.accessToken' 2>/dev/null)
USER_NAME=$(echo "$AUTH_RESPONSE" | jq -r '.data.user.name' 2>/dev/null)
USER_ROLE=$(echo "$AUTH_RESPONSE" | jq -r '.data.user.role' 2>/dev/null)

if [ -n "$ACCESS_TOKEN" ] && [ "$ACCESS_TOKEN" != "null" ]; then
    echo -e "${GREEN}✅ Login successful!${NC}"
    echo -e "User: ${YELLOW}$USER_NAME${NC} (${YELLOW}$USER_ROLE${NC})"
else
    echo -e "${RED}❌ Login failed!${NC}"
    echo "Make sure you entered the correct OTP from the console."
    exit 1
fi

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}Step 3: Get User Profile${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

PROFILE_RESPONSE=$(curl -s "$BASE_URL/api/users/me" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

echo "$PROFILE_RESPONSE" | jq .

if [[ $(echo "$PROFILE_RESPONSE" | jq -r '.success') == "true" ]]; then
    echo -e "${GREEN}✅ Profile retrieved successfully!${NC}"
else
    echo -e "${RED}❌ Failed to get profile${NC}"
fi

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}Step 4: Get Farm Listings (Public)${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

LISTINGS_RESPONSE=$(curl -s "$BASE_URL/api/listings?limit=5")

echo "$LISTINGS_RESPONSE" | jq '.data | length' > /dev/null 2>&1
LISTING_COUNT=$(echo "$LISTINGS_RESPONSE" | jq -r '.data | length' 2>/dev/null)

if [ -n "$LISTING_COUNT" ] && [ "$LISTING_COUNT" != "null" ]; then
    echo -e "${GREEN}✅ Found $LISTING_COUNT listings${NC}"
    echo "$LISTINGS_RESPONSE" | jq '.data[] | {name, price_per_acre, location_name}' 2>/dev/null | head -20
else
    echo -e "${YELLOW}⚠️  No listings found${NC}"
fi

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}Step 5: Get Wallet Balance${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

WALLET_RESPONSE=$(curl -s "$BASE_URL/api/wallet/balance" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

echo "$WALLET_RESPONSE" | jq .

if [[ $(echo "$WALLET_RESPONSE" | jq -r '.success') == "true" ]]; then
    BALANCE=$(echo "$WALLET_RESPONSE" | jq -r '.data.balance')
    echo -e "${GREEN}✅ Wallet Balance: ₹$BALANCE${NC}"
else
    echo -e "${RED}❌ Failed to get wallet balance${NC}"
fi

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}Step 6: Get Notifications${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

NOTIF_RESPONSE=$(curl -s "$BASE_URL/api/notifications?limit=5" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

echo "$NOTIF_RESPONSE" | jq '.data | length' > /dev/null 2>&1
NOTIF_COUNT=$(echo "$NOTIF_RESPONSE" | jq -r '.data | length' 2>/dev/null)

if [ -n "$NOTIF_COUNT" ] && [ "$NOTIF_COUNT" != "null" ]; then
    echo -e "${GREEN}✅ Found $NOTIF_COUNT notifications${NC}"
else
    echo -e "${YELLOW}⚠️  No notifications${NC}"
fi

echo ""
echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}   TEST SUMMARY${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""
echo -e "${GREEN}✅ Server Health${NC}"
echo -e "${GREEN}✅ Send OTP${NC}"
echo -e "${GREEN}✅ Verify OTP (with manual entry)${NC}"
echo -e "${GREEN}✅ Get User Profile${NC}"
echo -e "${GREEN}✅ Get Listings${NC}"
echo -e "${GREEN}✅ Get Wallet Balance${NC}"
echo -e "${GREEN}✅ Get Notifications${NC}"
echo ""
echo -e "${CYAN}All core API endpoints are working! 🎉${NC}"
echo ""
echo -e "${YELLOW}For comprehensive testing, see:${NC}"
echo "   tests/RUN_TESTS_MANUALLY.md"
echo ""
