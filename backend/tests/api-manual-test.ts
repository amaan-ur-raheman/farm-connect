/**
 * API Test Script for FarmConnect Backend
 * 
 * This script tests all API endpoints using fetch
 * Run with: npx tsx tests/api-manual-test.ts
 * 
 * Prerequisites:
 * 1. Backend server running on http://localhost:3000
 * 2. Database seeded with test data
 * 3. Environment variables configured
 */

import { randomUUID } from 'crypto';

const BASE_URL = 'http://localhost:3000';

// Test data
const TEST_PHONE = `+91${Math.floor(1000000000 + Math.random() * 9000000000)}`;
const TEST_EMAIL = `test.${Date.now()}@example.com`;

// Store tokens and IDs between tests
let accessToken: string | null = null;
let refreshToken: string | null = null;
let userId: string | null = null;
let listingId: string | null = null;
let contractId: string | null = null;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color = 'reset') {
  console.log(`${colors[color as keyof typeof colors]}${message}${colors.reset}`);
}

function logTest(name: string) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`🧪 TEST: ${name}`, 'cyan');
  log('='.repeat(60), 'cyan');
}

function logSuccess(message: string) {
  log(`✅ ${message}`, 'green');
}

function logError(message: string) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message: string) {
  log(`ℹ️  ${message}`, 'yellow');
}

// Helper function to make API requests
async function apiRequest(
  endpoint: string,
  method = 'GET',
  body?: unknown,
  useAuth = false
) {
  const url = `${BASE_URL}${endpoint}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (useAuth && accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  logInfo(`${method} ${url}`);

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      logError(`Status: ${response.status} - ${JSON.stringify(data)}`);
    } else {
      logSuccess(`Status: ${response.status}`);
    }

    return { response, data };
  } catch (error) {
    logError(`Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}

// ============== AUTH TESTS ==============

async function testSendOtp() {
  logTest('1. Send OTP');
  const { data } = await apiRequest('/api/auth/otp/send', 'POST', { phone: TEST_PHONE });
  return data.success === true;
}

async function testVerifyOtp() {
  logTest('2. Verify OTP (using dev OTP: 123456)');
  const { data } = await apiRequest('/api/auth/otp/verify', 'POST', {
    phone: TEST_PHONE,
    otp: '123456', // Default dev OTP
  });

  if (data.success) {
    accessToken = data.data?.accessToken;
    refreshToken = data.data?.refreshToken;
    userId = data.data?.user?.id;
    logSuccess(`User ID: ${userId}`);
    logSuccess(`Role: ${data.data?.user?.role}`);
  }
  return data.success === true;
}

async function testRefreshToken() {
  logTest('3. Refresh Access Token');
  if (!refreshToken) {
    logError('No refresh token available');
    return false;
  }

  const { data } = await apiRequest('/api/auth/refresh', 'POST', {
    refreshToken,
  });

  if (data.success) {
    accessToken = data.data?.accessToken;
    refreshToken = data.data?.refreshToken;
    logSuccess('Token refreshed successfully');
  }
  return data.success === true;
}

async function testLogout() {
  logTest('4. Logout');
  if (!accessToken) {
    logError('No access token available');
    return false;
  }

  const { data } = await apiRequest('/api/auth/logout', 'POST', undefined, true);
  accessToken = null;
  return data.success === true;
}

// ============== USER TESTS ==============

async function testGetUserProfile() {
  logTest('5. Get User Profile');
  const { data } = await apiRequest('/api/users/me', 'GET', undefined, true);
  if (data.success) {
    logSuccess(`Name: ${data.data?.name || 'Not set'}`);
    logSuccess(`Email: ${data.data?.email || 'Not set'}`);
  }
  return data.success === true;
}

async function testUpdateUserProfile() {
  logTest('6. Update User Profile');
  const { data } = await apiRequest('/api/users/me', 'PATCH', {
    name: 'Test User',
    email: TEST_EMAIL,
    address: '123 Test Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
  }, true);
  return data.success === true;
}

// ============== LISTING TESTS ==============

async function testCreateListing() {
  logTest('7. Create Farm Listing');
  const { data } = await apiRequest('/api/listings', 'POST', {
    name: 'Test Organic Farm',
    description: 'A beautiful organic farm for testing',
    area_acres: 5.5,
    price_per_acre: 50000,
    crops: ['Tomato', 'Wheat'],
    location_name: 'Nashik, Maharashtra',
    latitude: 19.9975,
    longitude: 73.7898,
    soil_type: 'Black Cotton',
    irrigation_type: 'Drip',
    is_organic: true,
    expected_harvest_month: 'March',
    expected_yield_per_acre: 8.5,
  }, true);

  if (data.success) {
    listingId = data.data?.id;
    logSuccess(`Listing ID: ${listingId}`);
  }
  return data.success === true;
}

async function testGetListings() {
  logTest('8. Get All Listings');
  const { data } = await apiRequest('/api/listings?limit=10&page=1', 'GET');
  if (data.success) {
    logSuccess(`Total: ${data.pagination?.total || 0} listings`);
    logSuccess(`Page: ${data.pagination?.page || 1}/${data.pagination?.pages || 1}`);
  }
  return data.success === true;
}

async function testGetListingById() {
  logTest('9. Get Listing by ID');
  if (!listingId) {
    logError('No listing ID available');
    return false;
  }

  const { data } = await apiRequest(`/api/listings/${listingId}`, 'GET');
  if (data.success) {
    logSuccess(`Listing: ${data.data?.name}`);
  }
  return data.success === true;
}

async function testUpdateListing() {
  logTest('10. Update Listing');
  if (!listingId) {
    logError('No listing ID available');
    return false;
  }

  const { data } = await apiRequest(`/api/listings/${listingId}`, 'PATCH', {
    description: 'Updated description for testing',
    price_per_acre: 55000,
  }, true);
  return data.success === true;
}

async function testGetFarmerListings() {
  logTest('11. Get Farmer\'s Listings');
  const { data } = await apiRequest('/api/listings/my-listings', 'GET', undefined, true);
  if (data.success) {
    logSuccess(`Found ${data.data?.length || 0} listings`);
  }
  return data.success === true;
}

// ============== CONTRACT TESTS ==============

async function testCreateContract() {
  logTest('12. Create Contract');
  if (!listingId) {
    logError('No listing ID available');
    return false;
  }

  const tomorrow = new Date(Date.now() + 86400000);
  const nextMonth = new Date(Date.now() + 30 * 86400000);

  const { data } = await apiRequest('/api/contracts', 'POST', {
    listing_id: listingId,
    crop: 'Tomato',
    acreage: 3,
    price_per_acre: 55000,
    start_date: tomorrow.toISOString(),
    end_date: nextMonth.toISOString(),
  }, true);

  if (data.success) {
    contractId = data.data?.id;
    logSuccess(`Contract ID: ${contractId}`);
    logSuccess(`Status: ${data.data?.status}`);
  }
  return data.success === true;
}

async function testGetContracts() {
  logTest('13. Get Consumer Contracts');
  const { data } = await apiRequest('/api/contracts/consumer', 'GET', undefined, true);
  if (data.success) {
    logSuccess(`Found ${data.data?.length || 0} contracts`);
  }
  return data.success === true;
}

async function testAcceptContract() {
  logTest('14. Accept Contract (as farmer)');
  if (!contractId) {
    logError('No contract ID available');
    return false;
  }

  // Note: This might fail if the current user is not the farmer
  const { data } = await apiRequest(`/api/contracts/${contractId}/action`, 'POST', {
    action: 'accept',
  }, true);
  return data.success === true;
}

async function testGetContractById() {
  logTest('15. Get Contract by ID');
  if (!contractId) {
    logError('No contract ID available');
    return false;
  }

  const { data } = await apiRequest(`/api/contracts/${contractId}`, 'GET', undefined, true);
  if (data.success) {
    logSuccess(`Contract Status: ${data.data?.status}`);
    logSuccess(`Total Amount: ₹${data.data?.total_amount}`);
  }
  return data.success === true;
}

// ============== WALLET TESTS ==============

async function testGetWalletBalance() {
  logTest('16. Get Wallet Balance');
  const { data } = await apiRequest('/api/wallet/balance', 'GET', undefined, true);
  if (data.success) {
    logSuccess(`Balance: ₹${data.data?.balance || 0}`);
    logSuccess(`Pending: ₹${data.data?.pending || 0}`);
  }
  return data.success === true;
}

async function testGetWalletTransactions() {
  logTest('17. Get Wallet Transactions');
  const { data } = await apiRequest('/api/wallet/transactions?limit=10', 'GET', undefined, true);
  if (data.success) {
    logSuccess(`Found ${data.data?.length || 0} transactions`);
  }
  return data.success === true;
}

// ============== NOTIFICATION TESTS ==============

async function testGetNotifications() {
  logTest('18. Get Notifications');
  const { data } = await apiRequest('/api/notifications', 'GET', undefined, true);
  if (data.success) {
    logSuccess(`Total: ${data.pagination?.total || 0}`);
    logSuccess(`Unread: ${data.unread_count || 0}`);
  }
  return data.success === true;
}

async function testMarkNotificationAsRead() {
  logTest('19. Mark All Notifications as Read');
  const { data } = await apiRequest('/api/notifications/mark-all-read', 'POST', undefined, true);
  return data.success === true;
}

// ============== HEALTH CHECK ==============

async function testHealthCheck() {
  logTest('0. Health Check');
  const { data, response } = await apiRequest('/health', 'GET');
  if (response.ok) {
    logSuccess(`Server Status: OK`);
    logSuccess(`Timestamp: ${data.timestamp}`);
  }
  return response.ok;
}

// ============== MAIN TEST RUNNER ==============

async function runAllTests() {
  log('\n🚀 FarmConnect API Test Suite', 'cyan');
  log('Starting comprehensive API tests...', 'yellow');

  const results: { name: string; passed: boolean }[] = [];

  // Health check first
  try {
    const passed = await testHealthCheck();
    results.push({ name: 'Health Check', passed });
  } catch {
    results.push({ name: 'Health Check', passed: false });
  }

  // Auth tests
  try {
    results.push({ name: 'Send OTP', passed: await testSendOtp() });
  } catch {
    results.push({ name: 'Send OTP', passed: false });
  }

  try {
    results.push({ name: 'Verify OTP', passed: await testVerifyOtp() });
  } catch {
    results.push({ name: 'Verify OTP', passed: false });
  }

  if (accessToken) {
    try {
      results.push({ name: 'Refresh Token', passed: await testRefreshToken() });
    } catch {
      results.push({ name: 'Refresh Token', passed: false });
    }

    // User tests
    try {
      results.push({ name: 'Get User Profile', passed: await testGetUserProfile() });
    } catch {
      results.push({ name: 'Get User Profile', passed: false });
    }

    try {
      results.push({ name: 'Update User Profile', passed: await testUpdateUserProfile() });
    } catch {
      results.push({ name: 'Update User Profile', passed: false });
    }

    // Listing tests
    try {
      results.push({ name: 'Create Listing', passed: await testCreateListing() });
    } catch {
      results.push({ name: 'Create Listing', passed: false });
    }

    try {
      results.push({ name: 'Get All Listings', passed: await testGetListings() });
    } catch {
      results.push({ name: 'Get All Listings', passed: false });
    }

    if (listingId) {
      try {
        results.push({ name: 'Get Listing by ID', passed: await testGetListingById() });
      } catch {
        results.push({ name: 'Get Listing by ID', passed: false });
      }

      try {
        results.push({ name: 'Update Listing', passed: await testUpdateListing() });
      } catch {
        results.push({ name: 'Update Listing', passed: false });
      }
    }

    try {
      results.push({ name: 'Get Farmer Listings', passed: await testGetFarmerListings() });
    } catch {
      results.push({ name: 'Get Farmer Listings', passed: false });
    }

    // Contract tests
    if (listingId) {
      try {
        results.push({ name: 'Create Contract', passed: await testCreateContract() });
      } catch {
        results.push({ name: 'Create Contract', passed: false });
      }
    }

    if (contractId) {
      try {
        results.push({ name: 'Get Contracts', passed: await testGetContracts() });
      } catch {
        results.push({ name: 'Get Contracts', passed: false });
      }

      try {
        results.push({ name: 'Get Contract by ID', passed: await testGetContractById() });
      } catch {
        results.push({ name: 'Get Contract by ID', passed: false });
      }
    }

    // Wallet tests
    try {
      results.push({ name: 'Get Wallet Balance', passed: await testGetWalletBalance() });
    } catch {
      results.push({ name: 'Get Wallet Balance', passed: false });
    }

    try {
      results.push({ name: 'Get Wallet Transactions', passed: await testGetWalletTransactions() });
    } catch {
      results.push({ name: 'Get Wallet Transactions', passed: false });
    }

    // Notification tests
    try {
      results.push({ name: 'Get Notifications', passed: await testGetNotifications() });
    } catch {
      results.push({ name: 'Get Notifications', passed: false });
    }

    try {
      results.push({ name: 'Mark Notifications Read', passed: await testMarkNotificationAsRead() });
    } catch {
      results.push({ name: 'Mark Notifications Read', passed: false });
    }

    // Logout
    try {
      results.push({ name: 'Logout', passed: await testLogout() });
    } catch {
      results.push({ name: 'Logout', passed: false });
    }
  }

  // Summary
  log('\n' + '='.repeat(60), 'cyan');
  log('📊 TEST SUMMARY', 'cyan');
  log('='.repeat(60), 'cyan');

  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const percentage = ((passed / total) * 100).toFixed(2);

  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌';
    log(`${icon} ${result.name}`);
  });

  log('\n' + '-'.repeat(60), 'yellow');
  log(`Total: ${passed}/${total} tests passed (${percentage}%)`, percentage === '100.00' ? 'green' : 'yellow');
  log('='.repeat(60), 'cyan');

  process.exit(passed === total ? 0 : 1);
}

// Run tests
runAllTests().catch(error => {
  logError(`Test suite failed: ${error.message}`);
  process.exit(1);
});
