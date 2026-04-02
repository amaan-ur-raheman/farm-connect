/**
 * FarmConnect Backend - Comprehensive API Test Suite
 * 
 * Tests ALL API endpoints with full authentication flow
 * Run with: npx tsx tests/api-comprehensive-test.ts
 * 
 * Prerequisites:
 * - Backend server running on http://localhost:3000
 * - Database seeded with test data (npm run db:seed)
 */

import ky from 'ky';

const BASE_URL = 'http://localhost:3000';
const api = ky.create({ prefixUrl: BASE_URL });

// Test users from seed data
const TEST_USERS = {
  FARMER: { phone: '+919876543210', name: 'Rajesh Kumar', role: 'FARMER' },
  CONSUMER: { phone: '+919876543211', name: 'Vikram Mehta', role: 'CONSUMER' },
  FARMER2: { phone: '+919876543212', name: 'Sunita Patil', role: 'FARMER' },
};

// Note: In development mode, OTP is logged to console when sent
// We'll capture it during the send OTP step
let capturedOtp: Record<string, string> = {};

// Colors for output
const c = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

const log = (msg: string, color = 'reset') => console.log(`${c[color as keyof typeof c]}${msg}${c.reset}`);

// Test state
let tokens = {
  farmer: { accessToken: '', refreshToken: '' },
  consumer: { accessToken: '', refreshToken: '' },
};

let testIds = {
  listing: '',
  contract: '',
  update: '',
  delivery: '',
  dispute: '',
  review: '',
};

// Results tracking
const results: { module: string; test: string; passed: boolean; error?: string }[] = [];

// Helper functions
async function loginAs(phone: string): Promise<{ accessToken: string; refreshToken: string }> {
  try {
    // Send OTP
    await api.post('api/auth/otp/send', { json: { phone } }).json();
    
    // Verify OTP
    const data: any = await api.post('api/auth/otp/verify', { 
      json: { phone, otp: OTP } 
    }).json();
    
    return {
      accessToken: data.data.accessToken,
      refreshToken: data.data.refreshToken,
    };
  } catch (error: any) {
    throw new Error(`Login failed for ${phone}: ${error.message}`);
  }
}

function createAuthApi(accessToken: string) {
  return api.extend({
    hooks: {
      beforeRequest: [
        request => {
          request.headers.set('Authorization', `Bearer ${accessToken}`);
        },
      ],
    },
  });
}

const testModule = (name: string) => {
  log(`\n${'='.repeat(70)}`, 'cyan');
  log(`📦 MODULE: ${name}`, 'bold');
  log('='.repeat(70), 'cyan');
};

const test = async (name: string, fn: () => Promise<void>) => {
  try {
    await fn();
    log(`   ✅ ${name}`, 'green');
    results.push({ module: 'Current', test: name, passed: true });
  } catch (error: any) {
    log(`   ❌ ${name}`, 'red');
    log(`      Error: ${error.message}`, 'yellow');
    results.push({ module: 'Current', test: name, passed: false, error: error.message });
  }
};

// Main test runner
async function runTests() {
  log('\n' + '🚀 '.repeat(20), 'cyan');
  log('🚀 FarmConnect - Comprehensive API Test Suite', 'bold');
  log('🚀 '.repeat(20), 'cyan');

  // ========== HEALTH CHECK ==========
  testModule('Health & Infrastructure');
  
  await test('Health Check', async () => {
    const data: any = await api.get('health').json();
    if (!data.status || !data.timestamp) throw new Error('Invalid health response');
  });

  await test('Rate Limiting Active', async () => {
    let rateLimited = false;
    for (let i = 0; i < 15; i++) {
      try {
        await api.get('health').json();
      } catch (error: any) {
        if (error.response?.status === 429) {
          rateLimited = true;
          break;
        }
      }
    }
    if (!rateLimited) throw new Error('Rate limiting not triggered');
  });

  // ========== AUTHENTICATION ==========
  testModule('Authentication');

  await test('Send OTP (Farmer)', async () => {
    const data: any = await api.post('api/auth/otp/send', { 
      json: { phone: TEST_USERS.FARMER.phone } 
    }).json();
    if (!data.success) throw new Error('OTP send failed');
  });

  await test('Verify OTP & Login (Farmer)', async () => {
    const data: any = await api.post('api/auth/otp/verify', { 
      json: { phone: TEST_USERS.FARMER.phone, otp: OTP } 
    }).json();
    if (!data.data.accessToken || !data.data.refreshToken) {
      throw new Error('No tokens received');
    }
    tokens.farmer = { accessToken: data.data.accessToken, refreshToken: data.data.refreshToken };
  });

  await test('Verify OTP & Login (Consumer)', async () => {
    const data: any = await api.post('api/auth/otp/verify', { 
      json: { phone: TEST_USERS.CONSUMER.phone, otp: OTP } 
    }).json();
    if (!data.data.accessToken) throw new Error('No tokens received');
    tokens.consumer = { accessToken: data.data.accessToken, refreshToken: data.data.refreshToken };
  });

  await test('Token Refresh', async () => {
    const data: any = await api.post('api/auth/refresh', {
      json: { refreshToken: tokens.farmer.refreshToken }
    }).json();
    if (!data.data.accessToken) throw new Error('Refresh failed');
    tokens.farmer.accessToken = data.data.accessToken;
  });

  // ========== USERS ==========
  testModule('User Management');

  const farmerApi = createAuthApi(tokens.farmer.accessToken);
  
  await test('Get Current User Profile', async () => {
    const data: any = await farmerApi.get('api/users/me').json();
    if (!data.success || !data.data.user) throw new Error('Profile fetch failed');
  });

  await test('Update User Profile', async () => {
    const data: any = await farmerApi.patch('api/users/me', {
      json: {
        name: 'Rajesh Kumar Updated',
        email: 'rajesh.updated@test.com',
        city: 'Mumbai',
        state: 'Maharashtra',
      }
    }).json();
    if (!data.success) throw new Error('Profile update failed');
  });

  await test('Update Push Token', async () => {
    const data: any = await farmerApi.post('api/users/push-token', {
      json: { expo_push_token: 'test-push-token-' + Date.now() }
    }).json();
    if (!data.success) throw new Error('Push token update failed');
  });

  // ========== LISTINGS ==========
  testModule('Farm Listings');

  await test('Create Farm Listing', async () => {
    const data: any = await farmerApi.post('api/listings', {
      json: {
        name: 'Test Organic Farm - API Test',
        description: 'Beautiful organic farm for testing',
        area_acres: 5.5,
        price_per_acre: 50000,
        crops: ['Tomato', 'Spinach', 'Carrot'],
        location_name: 'Nashik, Maharashtra',
        latitude: 19.9975,
        longitude: 73.7898,
        soil_type: 'Loamy',
        irrigation_type: 'Drip',
        is_organic: true,
        expected_harvest_month: 'March',
        expected_yield_per_acre: 2000,
      }
    }).json();
    
    if (!data.success || !data.data.id) throw new Error('Listing creation failed');
    testIds.listing = data.data.id;
  });

  await test('Get My Listings', async () => {
    const data: any = await farmerApi.get('api/listings/my-listings').json();
    if (!data.success) throw new Error('Failed to get my listings');
  });

  await test('Get All Listings (Public)', async () => {
    const data: any = await api.get('api/listings?limit=10&page=1').json();
    if (!data.success) throw new Error('Failed to get listings');
    if (!Array.isArray(data.data)) throw new Error('Invalid data format');
  });

  await test('Get Single Listing', async () => {
    const data: any = await api.get(`api/listings/${testIds.listing}`).json();
    if (!data.success || !data.data) throw new Error('Failed to get listing');
  });

  await test('Update Listing', async () => {
    const data: any = await farmerApi.patch(`api/listings/${testIds.listing}`, {
      json: {
        price_per_acre: 55000,
        description: 'Updated description for testing',
      }
    }).json();
    if (!data.success) throw new Error('Listing update failed');
  });

  // ========== CONTRACTS ==========
  testModule('Contracts');

  const consumerApi = createAuthApi(tokens.consumer.accessToken);

  await test('Create Contract (Investor)', async () => {
    const data: any = await consumerApi.post('api/contracts', {
      json: {
        listing_id: testIds.listing,
        crop: 'Tomato',
        acreage: 2,
        price_per_acre: 55000,
        total_amount: 110000,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
      }
    }).json();
    
    if (!data.success || !data.data.id) throw new Error('Contract creation failed');
    testIds.contract = data.data.id;
  });

  await test('Get Farmer Contracts', async () => {
    const data: any = await farmerApi.get('api/contracts/farmer').json();
    if (!data.success) throw new Error('Failed to get farmer contracts');
  });

  await test('Get Consumer Contracts', async () => {
    const data: any = await consumerApi.get('api/contracts/consumer').json();
    if (!data.success) throw new Error('Failed to get consumer contracts');
  });

  await test('Get Contract by ID', async () => {
    const data: any = await farmerApi.get(`api/contracts/${testIds.contract}`).json();
    if (!data.success || !data.data) throw new Error('Failed to get contract');
  });

  await test('Farmer Accepts Contract', async () => {
    const data: any = await farmerApi.post(`api/contracts/${testIds.contract}/action`, {
      json: { action: 'accept' }
    }).json();
    if (!data.success) throw new Error('Contract acceptance failed');
  });

  // ========== WALLET ==========
  testModule('Wallet');

  await test('Get Wallet Balance (Farmer)', async () => {
    const data: any = await farmerApi.get('api/wallet/balance').json();
    if (!data.success || typeof data.data.balance === 'undefined') {
      throw new Error('Failed to get balance');
    }
  });

  await test('Get Wallet Transactions', async () => {
    const data: any = await farmerApi.get('api/wallet/transactions?limit=10').json();
    if (!data.success) throw new Error('Failed to get transactions');
  });

  // ========== PAYMENTS ==========
  testModule('Payments');

  await test('Create Payment Order', async () => {
    const data: any = await consumerApi.post('api/payments/order', {
      json: {
        amount: 110000,
        currency: 'INR',
        contract_id: testIds.contract,
      }
    }).json();
    if (!data.success || !data.data.order_id) throw new Error('Order creation failed');
  });

  // ========== ESCROW ==========
  testModule('Escrow');

  await test('Get Escrow Ledger', async () => {
    const data: any = await farmerApi.get(`api/escrow/contract/${testIds.contract}`).json();
    if (!data.success) throw new Error('Failed to get escrow ledger');
  });

  // ========== FARM UPDATES ==========
  testModule('Farm Updates');

  await test('Create Farm Update', async () => {
    const data: any = await farmerApi.post('api/updates', {
      json: {
        contract_id: testIds.contract,
        media_url: 'https://example.com/test-image.jpg',
        media_type: 'image',
        caption: 'Crops growing well! #API_TEST',
        latitude: 19.9975,
        longitude: 73.7898,
      }
    }).json();
    
    if (!data.success || !data.data.id) throw new Error('Update creation failed');
    testIds.update = data.data.id;
  });

  await test('Get Farm Updates', async () => {
    const data: any = await consumerApi.get(`api/updates/contract/${testIds.contract}`).json();
    if (!data.success) throw new Error('Failed to get updates');
  });

  // ========== DELIVERIES ==========
  testModule('Deliveries');

  await test('Create Delivery', async () => {
    const data: any = await farmerApi.post('api/deliveries', {
      json: {
        contract_id: testIds.contract,
        batch_number: 'BATCH-001-TEST',
        yield_amount_kg: 500,
        quality_grade: 'A',
        delivery_date: new Date().toISOString(),
        organic_verified: true,
      }
    }).json();
    
    if (!data.success || !data.data.id) throw new Error('Delivery creation failed');
    testIds.delivery = data.data.id;
  });

  await test('Get Deliveries', async () => {
    const data: any = await consumerApi.get(`api/deliveries/contract/${testIds.contract}`).json();
    if (!data.success) throw new Error('Failed to get deliveries');
  });

  await test('Update Delivery Status', async () => {
    const data: any = await consumerApi.patch(`api/deliveries/${testIds.delivery}`, {
      json: {
        status: 'DELIVERED',
        delivery_proof_url: 'https://example.com/proof.jpg',
      }
    }).json();
    if (!data.success) throw new Error('Delivery update failed');
  });

  // ========== DISPUTES ==========
  testModule('Disputes');

  await test('Create Dispute', async () => {
    const data: any = await consumerApi.post('api/disputes', {
      json: {
        contract_id: testIds.contract,
        reason: 'Quality Issue - API Test',
        description: 'Testing dispute creation via API',
        evidence_urls: ['https://example.com/evidence1.jpg'],
      }
    }).json();
    
    if (!data.success || !data.data.id) throw new Error('Dispute creation failed');
    testIds.dispute = data.data.id;
  });

  await test('Get Disputes', async () => {
    const data: any = await farmerApi.get(`api/disputes/contract/${testIds.contract}`).json();
    if (!data.success) throw new Error('Failed to get disputes');
  });

  await test('Update Dispute Status', async () => {
    const data: any = await farmerApi.patch(`api/disputes/${testIds.dispute}`, {
      json: {
        status: 'UNDER_REVIEW',
        resolution: 'Reviewing the issue - API TEST',
      }
    }).json();
    if (!data.success) throw new Error('Dispute update failed');
  });

  // ========== REVIEWS ==========
  testModule('Reviews');

  await test('Create Review', async () => {
    const data: any = await consumerApi.post('api/reviews', {
      json: {
        contract_id: testIds.contract,
        rating: 5,
        comment: 'Excellent farm management! API Test review.',
      }
    }).json();
    
    if (!data.success || !data.data.id) throw new Error('Review creation failed');
    testIds.review = data.data.id;
  });

  await test('Get Reviews for Contract', async () => {
    const data: any = await api.get(`api/reviews/contract/${testIds.contract}`).json();
    if (!data.success) throw new Error('Failed to get reviews');
  });

  // ========== NOTIFICATIONS ==========
  testModule('Notifications');

  await test('Get Notifications', async () => {
    const data: any = await farmerApi.get('api/notifications?limit=10').json();
    if (!data.success) throw new Error('Failed to get notifications');
  });

  await test('Mark Notification as Read', async () => {
    const notifData: any = await farmerApi.get('api/notifications?limit=1').json();
    if (notifData.success && notifData.data?.length > 0) {
      const notificationId = notifData.data[0].id;
      const data: any = await farmerApi.post('api/notifications/mark-read', {
        json: { notification_id: notificationId }
      }).json();
      if (!data.success) throw new Error('Mark read failed');
    }
  });

  await test('Mark All Notifications as Read', async () => {
    const data: any = await farmerApi.post('api/notifications/mark-all-read').json();
    if (!data.success) throw new Error('Mark all read failed');
  });

  // ========== CHAT ==========
  testModule('Chat');

  await test('Create Conversation', async () => {
    const data: any = await farmerApi.post('api/chat/conversations', {
      json: {
        participant_two_phone: TEST_USERS.CONSUMER.phone,
        contract_id: testIds.contract,
      }
    }).json();
    if (!data.success) throw new Error('Conversation creation failed');
  });

  await test('Get Conversations', async () => {
    const data: any = await farmerApi.get('api/chat/conversations').json();
    if (!data.success) throw new Error('Failed to get conversations');
  });

  // ========== KYC ==========
  testModule('KYC');

  await test('Get KYC Status', async () => {
    const data: any = await farmerApi.get('api/kyc/status').json();
    if (!data.success || typeof data.data.kyc_status === 'undefined') {
      throw new Error('Failed to get KYC status');
    }
  });

  // ========== LOGOUT ==========
  testModule('Session Management');

  await test('Logout (Farmer)', async () => {
    const logoutApi = createAuthApi(tokens.farmer.accessToken);
    const data: any = await logoutApi.post('api/auth/logout').json();
    if (!data.success) throw new Error('Logout failed');
  });

  await test('Logout (Consumer)', async () => {
    const logoutApi = createAuthApi(tokens.consumer.accessToken);
    const data: any = await logoutApi.post('api/auth/logout').json();
    if (!data.success) throw new Error('Logout failed');
  });

  // ========== PRINT SUMMARY ==========
  printSummary();
}

function printSummary() {
  log('\n' + '═'.repeat(70), 'cyan');
  log('📊 COMPREHENSIVE TEST SUMMARY', 'bold');
  log('═'.repeat(70), 'cyan');

  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const percentage = ((passed / total) * 100).toFixed(1);

  // Group by module
  const modules = [...new Set(results.map(r => r.module))];
  
  log('\n📦 BY MODULE:', 'yellow');
  log('-'.repeat(70), 'yellow');
  
  modules.forEach(module => {
    const moduleResults = results.filter(r => r.module === module);
    const modulePassed = moduleResults.filter(r => r.passed).length;
    const moduleTotal = moduleResults.length;
    const modulePct = ((modulePassed / moduleTotal) * 100).toFixed(0);
    
    const status = modulePassed === moduleTotal ? '✅' : '⚠️';
    log(`   ${status} ${module}: ${modulePassed}/${moduleTotal} (${modulePct}%)`, 
      modulePassed === moduleTotal ? 'green' : 'yellow');
  });

  log('\n' + '-'.repeat(70), 'yellow');
  log(`\n📈 OVERALL: ${passed}/${total} tests passed (${percentage}%)`, 
    passed === total ? 'green' : 'yellow');
  log('═'.repeat(70), 'cyan');

  // Failed tests detail
  const failed = results.filter(r => !r.passed);
  if (failed.length > 0) {
    log('\n❌ FAILED TESTS:', 'red');
    log('-'.repeat(70), 'red');
    failed.forEach(f => {
      log(`   • ${f.test}`, 'red');
      if (f.error) log(`     Error: ${f.error}`, 'yellow');
    });
    log('═'.repeat(70), 'cyan');
  }

  // Exit code
  process.exit(passed === total ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  log(`\n❌ Test suite crashed: ${error.message}`, 'red');
  log(error.stack, 'red');
  process.exit(1);
});
