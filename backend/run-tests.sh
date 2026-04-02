#!/bin/bash

# FarmConnect Backend - Test Runner Script
# This script runs all API tests with proper setup

set -e

echo "🚀 FarmConnect Backend - Test Runner"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check if server is running
echo -e "${CYAN}Checking backend server...${NC}"
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend server is running${NC}"
else
    echo -e "${RED}❌ Backend server is not running!${NC}"
    echo ""
    echo "Please start the server first:"
    echo "  cd backend"
    echo "  npm run dev"
    echo ""
    echo "Then run this script again in a new terminal."
    exit 1
fi

echo ""
echo -e "${CYAN}Running comprehensive API tests...${NC}"
echo ""

# Run comprehensive API test
npx tsx tests/api-comprehensive-test.ts

TEST_EXIT_CODE=$?

echo ""
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
else
    echo -e "${RED}❌ Some tests failed${NC}"
fi

exit $TEST_EXIT_CODE
