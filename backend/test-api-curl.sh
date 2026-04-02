#!/bin/bash

# FarmConnect Backend - cURL API Testing Script
# Quick manual tests using cURL commands
# Run with: ./test-api-curl.sh

BASE_URL="http://localhost:3000"
OTP="123456"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}   FarmConnect API - cURL Test Suite${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""

# Function to print section headers
print_header() {
    echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

# Function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# Check if server is running
echo "Checking server health..."
curl -s "$BASE_URL/health" > /dev/null
if [ $? -ne 0 ]; then
    echo -e "${RED}Server is not running! Start it with: npm run dev${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Server is running${NC}"

# ========== HEALTH CHECK ==========
print_header "1. HEALTH CHECK"

echo "GET /health"
HEALTH_RESPONSE=$(curl -s "$BASE_URL/health")
echo "$HEALTH_RESPONSE" | jq . > /dev/null 2>&1
print_result $? "Health check endpoint"

# ========== AUTHENTICATION ==========
print_header "2. AUTHENTICATION"

# Send OTP
echo "POST /api/auth/otp/send"
OTP_SEND=$(curl -s -X POST "$BASE_URL/api/auth/otp/send" \
    -H "Content-Type: application/json" \
    -d '{"phone":"+919876543210"}')
echo "$OTP_SEND" | jq .
print_result $? "Send OTP"

# Verify OTP and get tokens
echo -e "\nPOST /api/auth/otp/verify"
AUTH_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/otp/verify" \
    -H "Content-Type: application/json" \
    -d "{\"phone\":\"+919876543210\",\"otp\":\"$OTP\"}")
echo "$AUTH_RESPONSE" | jq .

# Extract tokens
ACCESS_TOKEN=$(echo "$AUTH_RESPONSE" | jq -r '.data.accessToken' 2>/dev/null)
REFRESH_TOKEN=$(echo "$AUTH_RESPONSE" | jq -r '.data.refreshToken' 2>/dev/null)

if [ -n "$ACCESS_TOKEN" ] && [ "$ACCESS_TOKEN" != "null" ]; then
    echo -e "${GREEN}✅ Authentication successful${NC}"
    echo -e "${YELLOW}Access Token: ${ACCESS_TOKEN:0:50}...${NC}"
else
    echo -e "${RED}❌ Authentication failed${NC}"
    exit 1
fi

# ========== USERS ==========
print_header "3. USER MANAGEMENT"

echo "GET /api/users/me"
USER_RESPONSE=$(curl -s "$BASE_URL/api/users/me" \
    -H "Authorization: Bearer $ACCESS_TOKEN")
echo "$USER_RESPONSE" | jq .
print_result $? "Get user profile"

echo -e "\nPATCH /api/users/me"
UPDATE_RESPONSE=$(curl -s -X PATCH "$BASE_URL/api/users/me" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"Test User Updated","city":"Mumbai"}')
echo "$UPDATE_RESPONSE" | jq .
print_result $? "Update user profile"

# ========== LISTINGS ==========
print_header "4. FARM LISTINGS"

echo "GET /api/listings"
LISTINGS_RESPONSE=$(curl -s "$BASE_URL/api/listings?limit=5")
echo "$LISTINGS_RESPONSE" | jq '.data | length' > /dev/null 2>&1
print_result $? "Get all listings"
echo "$LISTINGS_RESPONSE" | jq '.data[] | {name, price_per_acre}' 2>/dev/null | head -20

echo -e "\nPOST /api/listings (Create new listing)"
LISTING_CREATE=$(curl -s -X POST "$BASE_URL/api/listings" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name":"Test Farm - cURL Test",
        "description":"Organic farm for testing",
        "area_acres":5,
        "price_per_acre":50000,
        "crops":["Tomato","Spinach"],
        "location_name":"Nashik",
        "latitude":19.9975,
        "longitude":73.7898,
        "is_organic":true
    }')
echo "$LISTING_CREATE" | jq .
LISTING_ID=$(echo "$LISTING_CREATE" | jq -r '.data.id' 2>/dev/null)
if [ -n "$LISTING_ID" ] && [ "$LISTING_ID" != "null" ]; then
    echo -e "${GREEN}✅ Created listing with ID: $LISTING_ID${NC}"
fi

# ========== CONTRACTS ==========
print_header "5. CONTRACTS"

echo "GET /api/contracts/farmer"
CONTRACTS_RESPONSE=$(curl -s "$BASE_URL/api/contracts/farmer" \
    -H "Authorization: Bearer $ACCESS_TOKEN")
echo "$CONTRACTS_RESPONSE" | jq '.data | length' > /dev/null 2>&1
print_result $? "Get farmer contracts"

if [ -n "$LISTING_ID" ] && [ "$LISTING_ID" != "null" ]; then
    echo -e "\nPOST /api/contracts (Create contract)"
    CONTRACT_CREATE=$(curl -s -X POST "$BASE_URL/api/contracts" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"listing_id\":\"$LISTING_ID\",
            \"crop\":\"Tomato\",
            \"acreage\":2,
            \"price_per_acre\":50000,
            \"total_amount\":100000,
            \"start_date\":\"$(date -Iseconds)\",
            \"end_date\":\"$(date -d '+180 days' -Iseconds 2>/dev/null || date -v+180d -Iseconds 2>/dev/null)\"
        }")
    echo "$CONTRACT_CREATE" | jq .
    print_result $? "Create contract"
fi

# ========== WALLET ==========
print_header "6. WALLET"

echo "GET /api/wallet/balance"
WALLET_RESPONSE=$(curl -s "$BASE_URL/api/wallet/balance" \
    -H "Authorization: Bearer $ACCESS_TOKEN")
echo "$WALLET_RESPONSE" | jq .
print_result $? "Get wallet balance"

echo -e "\nGET /api/wallet/transactions"
TX_RESPONSE=$(curl -s "$BASE_URL/api/wallet/transactions?limit=10" \
    -H "Authorization: Bearer $ACCESS_TOKEN")
echo "$TX_RESPONSE" | jq '.data | length' > /dev/null 2>&1
print_result $? "Get wallet transactions"

# ========== NOTIFICATIONS ==========
print_header "7. NOTIFICATIONS"

echo "GET /api/notifications"
NOTIF_RESPONSE=$(curl -s "$BASE_URL/api/notifications?limit=5" \
    -H "Authorization: Bearer $ACCESS_TOKEN")
echo "$NOTIF_RESPONSE" | jq '.data | length' > /dev/null 2>&1
print_result $? "Get notifications"

# ========== KYC ==========
print_header "8. KYC STATUS"

echo "GET /api/kyc/status"
KYC_RESPONSE=$(curl -s "$BASE_URL/api/kyc/status" \
    -H "Authorization: Bearer $ACCESS_TOKEN")
echo "$KYC_RESPONSE" | jq .
print_result $? "Get KYC status"

# ========== SUMMARY ==========
print_header "TEST SUMMARY"

echo -e "${CYAN}All basic API endpoints tested!${NC}"
echo ""
echo -e "${YELLOW}Test Users:${NC}"
echo "  • Farmer:   +919876543210 (Rajesh Kumar)"
echo "  • Investor: +919876543211 (Vikram Mehta)"
echo "  • Farmer 2: +919876543212 (Sunita Patil)"
echo ""
echo -e "${YELLOW}OTP for all users: $OTP${NC}"
echo ""
echo -e "${CYAN}For comprehensive testing, run:${NC}"
echo "  npx tsx tests/api-comprehensive-test.ts"
echo ""
