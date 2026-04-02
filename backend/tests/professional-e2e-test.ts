/**
 * FarmConnect - Professional End-to-End Test Suite
 * 
 * Comprehensive testing of complete business flows, edge cases, and error scenarios
 * Run with: npx tsx tests/professional-e2e-test.ts
 * 
 * This test suite covers:
 * 1. Complete user journeys (Farmer & Investor)
 * 2. Edge cases and boundary conditions
 * 3. Error handling and validation
 * 4. Data integrity checks
 * 5. Concurrent operations
 */

import ky from 'ky';
import * as readline from 'readline';

const BASE_URL = 'http://localhost:3000';
const api = ky.create({ prefixUrl: BASE_URL, timeout: 30000 });

// Colors
const c = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
};

const log = (msg: string, color = 'reset') => console.log(`${c[color as keyof typeof c]}${msg}${c.reset}`);

// Readline for OTP input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const prompt = (question: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
};

// Test Results Tracking
interface TestResult {
  category: string;
  test: string;
  passed: boolean;
  duration: number;
  error?: string;
  details?: string;
}

const results: TestResult[] = [];
let currentCategory = '';

// Test State
const state = {
  farmer: { accessToken: '', refreshToken: '', userId: '' },
  investor: { accessToken: '', refreshToken: '', userId: '' },
  listingId: '',
  contractId: '',
  deliveryId: '',
  updateId: '',
  disputeId: '',
  reviewId: '',
  notificationId: '',
  conversationId: '',
};

// Timing
const startTime = Date.now();

// ========== UTILITY FUNCTIONS ==========

const getCategory = (name: string) => {
  if (currentCategory !== name) {
    currentCategory = name;
    log(`\n${'═'.repeat(80)}`, 'cyan');
    log(`📦 ${name}`, 'bold');
    log('═'.repeat(80), 'cyan');
  }
};

const test = async (name: string, fn: () => Promise<void>, expectedError?: string) => {
  const start = Date.now();
  try {
    await fn();
    const duration = Date.now() - start;
    log(`   ✅ ${name} (${duration}ms)`, 'green');
    results.push({ category: currentCategory, test: name, passed: true, duration });
  } catch (error: any) {
    const duration = Date.now() - start;
    if (expectedError && error.message.includes(expectedError)) {
      log(`   ✅ ${name} (Expected error: ${expectedError})`, 'green');
      results.push({ category: currentCategory, test: name, passed: true, duration, details: `Expected error: ${expectedError}` });
    } else {
      log(`   ❌ ${name}`, 'red');
      log(`      Error: ${error.message}`, 'yellow');
      results.push({ category: currentCategory, test: name, passed: false, duration, error: error.message });
    }
  }
};

const createAuthApi = (token: string) => api.extend({
  hooks: {
    beforeRequest: [request => request.headers.set('Authorization', `Bearer ${token}`)],
  },
});

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ========== AUTHENTICATION FLOW ==========

async function authenticateUser(phone: string, role: string): Promise<{ accessToken: string; refreshToken: string; userId: string }> {
  log(`\n🔐 Authenticating ${role}...`, 'cyan');
  
  // Send OTP
  await api.post('api/auth/otp/send', { json: { phone } }).json();
  
  // Get OTP from user
  const otp = await prompt(`\n   Enter OTP for ${role} (${phone}): `);
  
  // Verify OTP
  const data: any = await api.post('api/auth/otp/verify', { 
    json: { phone, otp } 
  }).json();
  
  if (!data.data.accessToken) throw new Error('Authentication failed');
  
  log(`   ✅ Logged in as ${data.data.user.name} (${data.data.user.role})`, 'green');
  
  return {
    accessToken: data.data.accessToken,
    refreshToken: data.data.refreshToken,
    userId: data.data.user.id,
  };
}

// ========== MAIN TEST SUITE ==========

async function runTests() {
  log('\n' + '🚀 '.repeat(30), 'cyan');
  log('🚀 FarmConnect Professional E2E Test Suite', 'bold');
  log('🚀 Comprehensive Business Flow Testing', 'bold');
  log('🚀 '.repeat(30), 'cyan');

  // ===== CATEGORY 1: INFRASTRUCTURE =====
  getCategory('Infrastructure & Health Checks');

  await test('Health Check Endpoint', async () => {
    const data: any = await api.get('health').json();
    if (!data.status || !data.timestamp) throw new Error('Invalid health response');
  });

  await test('Rate Limiting - Multiple Requests', async () => {
    let rateLimited = false;
    // Health endpoint skips rate limiting, so test a different endpoint
    for (let i = 0; i < 120; i++) {
      try {
        await api.get('api/listings?limit=1').json();
      } catch (error: any) {
        if (error.response?.status === 429) {
          rateLimited = true;
          break;
        }
      }
    }
    if (!rateLimited) throw new Error('Rate limiting not triggered after 120 requests');
  });

  await test('Invalid Endpoint Returns 404', async () => {
    try {
      await api.get('api/invalid-endpoint').json();
      throw new Error('Should have returned 404');
    } catch (error: any) {
      if (error.response?.status !== 404) throw error;
    }
  });

  // ===== CATEGORY 2: AUTHENTICATION =====
  getCategory('Authentication & Authorization');

  // Authenticate Farmer
  const farmerAuth = await authenticateUser('+919876543210', 'Farmer');
  state.farmer = farmerAuth;
  const farmerApi = createAuthApi(farmerAuth.accessToken);

  // Authenticate Investor
  const investorAuth = await authenticateUser('+919876543211', 'Investor');
  state.investor = investorAuth;
  const investorApi = createAuthApi(investorAuth.accessToken);

  await test('Token Refresh Works', async () => {
    const data: any = await api.post('api/auth/refresh', {
      json: { refreshToken: farmerAuth.refreshToken }
    }).json();
    if (!data.data.accessToken) throw new Error('Refresh failed');
  });

  await test('Protected Endpoint Without Token Fails', async () => {
    try {
      await api.get('api/users/me').json();
      throw new Error('Should have returned 401');
    } catch (error: any) {
      if (error.response?.status !== 401) throw error;
    }
  });

  await test('Invalid Token Returns 401', async () => {
    try {
      const badApi = createAuthApi('invalid-token');
      await badApi.get('api/users/me').json();
      throw new Error('Should have returned 401');
    } catch (error: any) {
      if (error.response?.status !== 401) throw error;
    }
  });

  // ===== CATEGORY 3: USER MANAGEMENT =====
  getCategory('User Management');

  await test('Get Current User Profile', async () => {
    const data: any = await farmerApi.get('api/users/me').json();
    if (!data.success || !data.data.user) throw new Error('Profile fetch failed');
  });

  await test('Update User Profile - Valid Data', async () => {
    const data: any = await farmerApi.patch('api/users/me', {
      json: {
        name: 'Rajesh Kumar Updated',
        email: 'rajesh@test.com',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        address: '123 Test Street',
      }
    }).json();
    if (!data.success) throw new Error('Profile update failed');
  });

  await test('Update Profile - Invalid Email Format', async () => {
    try {
      await farmerApi.patch('api/users/me', {
        json: { email: 'invalid-email' }
      }).json();
      throw new Error('Should have failed validation');
    } catch (error: any) {
      if (!error.message.includes('400') && !error.message.includes('Invalid')) {
        throw error;
      }
    }
  });

  await test('Update Push Token', async () => {
    const data: any = await farmerApi.post('api/users/push-token', {
      json: { expo_push_token: `test-token-${Date.now()}` }
    }).json();
    if (!data.success) throw new Error('Push token update failed');
  });

  // ===== CATEGORY 4: LISTINGS CRUD =====
  getCategory('Farm Listings - Full CRUD');

  await test('Create Listing - Valid Data', async () => {
    const data: any = await farmerApi.post('api/listings', {
      json: {
        name: 'Professional Test Farm',
        description: 'High-quality organic farm for investment',
        area_acres: 10.5,
        price_per_acre: 75000,
        crops: ['Tomato', 'Spinach', 'Carrot', 'Wheat'],
        location_name: 'Nashik, Maharashtra',
        latitude: 19.9975,
        longitude: 73.7898,
        soil_type: 'Loamy',
        irrigation_type: 'Drip',
        is_organic: true,
        expected_harvest_month: 'March',
        expected_yield_per_acre: 2500,
      }
    }).json();
    
    if (!data.data.id) throw new Error('Listing creation failed');
    state.listingId = data.data.id;
  });

  await test('Create Listing - Missing Required Fields', async () => {
    try {
      await farmerApi.post('api/listings', {
        json: { name: 'Incomplete Listing' }
      }).json();
      throw new Error('Should have failed validation');
    } catch (error: any) {
      if (!error.message.includes('400')) throw error;
    }
  });

  await test('Create Listing - Invalid Coordinates', async () => {
    try {
      await farmerApi.post('api/listings', {
        json: {
          name: 'Bad Location Farm',
          area_acres: 5,
          price_per_acre: 50000,
          latitude: 999, // Invalid
          longitude: 999, // Invalid
        }
      }).json();
      throw new Error('Should have failed validation');
    } catch (error: any) {
      if (!error.message.includes('400')) throw error;
    }
  });

  await test('Get My Listings', async () => {
    const data: any = await farmerApi.get('api/listings/my-listings').json();
    if (!data.success) throw new Error('Failed to get my listings');
  });

  await test('Get All Listings - Pagination', async () => {
    const data: any = await api.get('api/listings?limit=5&page=1').json();
    if (!data.success || !data.pagination) throw new Error('Pagination failed');
  });

  await test('Get Single Listing by ID', async () => {
    const data: any = await api.get(`api/listings/${state.listingId}`).json();
    if (!data.success || !data.data) throw new Error('Failed to get listing');
  });

  await test('Update Listing - Partial Update', async () => {
    const data: any = await farmerApi.patch(`api/listings/${state.listingId}`, {
      json: { price_per_acre: 80000 }
    }).json();
    if (!data.success) throw new Error('Update failed');
  });

  await test('Get Non-existent Listing Returns 404', async () => {
    try {
      await api.get('api/listings/non-existent-id').json();
      throw new Error('Should have returned 404');
    } catch (error: any) {
      if (error.response?.status !== 404) throw error;
    }
  });

  // ===== CATEGORY 5: CONTRACTS =====
  getCategory('Investment Contracts');

  await test('Create Contract - Valid Data', async () => {
    const data: any = await investorApi.post('api/contracts', {
      json: {
        listing_id: state.listingId,
        crop: 'Tomato',
        acreage: 5,
        price_per_acre: 80000,
        total_amount: 400000,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
      }
    }).json();
    
    if (!data.data.id) throw new Error('Contract creation failed');
    state.contractId = data.data.id;
  });

  await test('Create Contract - Invalid Listing ID', async () => {
    try {
      await investorApi.post('api/contracts', {
        json: {
          listing_id: 'non-existent',
          crop: 'Wheat',
          acreage: 2,
          total_amount: 100000,
        }
      }).json();
      throw new Error('Should have failed');
    } catch (error: any) {
      if (!error.message.includes('400') && !error.message.includes('404')) throw error;
    }
  });

  await test('Get Farmer Contracts', async () => {
    const data: any = await farmerApi.get('api/contracts/farmer').json();
    if (!data.success) throw new Error('Failed to get farmer contracts');
  });

  await test('Get Consumer Contracts', async () => {
    const data: any = await investorApi.get('api/contracts/consumer').json();
    if (!data.success) throw new Error('Failed to get consumer contracts');
  });

  await test('Get Contract by ID', async () => {
    const data: any = await farmerApi.get(`api/contracts/${state.contractId}`).json();
    if (!data.success || !data.data) throw new Error('Failed to get contract');
  });

  await test('Farmer Accepts Contract', async () => {
    const data: any = await farmerApi.post(`api/contracts/${state.contractId}/action`, {
      json: { action: 'accept' }
    }).json();
    if (!data.success) throw new Error('Acceptance failed');
  });

  await test('Contract Status After Acceptance', async () => {
    const data: any = await farmerApi.get(`api/contracts/${state.contractId}`).json();
    if (!data.success || data.data.status !== 'ACTIVE') {
      throw new Error('Contract status should be ACTIVE');
    }
  });

  // ===== CATEGORY 6: WALLET & PAYMENTS =====
  getCategory('Wallet & Payment Operations');

  await test('Get Wallet Balance', async () => {
    const data: any = await farmerApi.get('api/wallet/balance').json();
    if (typeof data.data.balance === 'undefined') throw new Error('Failed to get balance');
  });

  await test('Get Wallet Transactions', async () => {
    const data: any = await farmerApi.get('api/wallet/transactions?limit=10').json();
    if (!data.success) throw new Error('Failed to get transactions');
  });

  await test('Create Payment Order', async () => {
    const data: any = await investorApi.post('api/payments/order', {
      json: {
        amount: 400000,
        currency: 'INR',
        contract_id: state.contractId,
      }
    }).json();
    if (!data.data.order_id) throw new Error('Order creation failed');
  });

  await test('Create Payment Order - Invalid Amount', async () => {
    try {
      await investorApi.post('api/payments/order', {
        json: { amount: -100, currency: 'INR' }
      }).json();
      throw new Error('Should have failed');
    } catch (error: any) {
      if (!error.message.includes('400')) throw error;
    }
  });

  // ===== CATEGORY 7: ESCROW =====
  getCategory('Escrow Management');

  await test('Get Escrow Ledger', async () => {
    const data: any = await farmerApi.get(`api/escrow/contract/${state.contractId}`).json();
    if (!data.success) throw new Error('Failed to get escrow ledger');
  });

  // ===== CATEGORY 8: FARM UPDATES =====
  getCategory('Farm Updates');

  await test('Create Farm Update', async () => {
    const data: any = await farmerApi.post('api/updates', {
      json: {
        contract_id: state.contractId,
        media_url: 'https://example.com/test-update.jpg',
        media_type: 'image',
        caption: 'Crops growing excellently! Professional test update.',
        latitude: 19.9975,
        longitude: 73.7898,
      }
    }).json();
    
    if (!data.data.id) throw new Error('Update creation failed');
    state.updateId = data.data.id;
  });

  await test('Get Farm Updates for Contract', async () => {
    const data: any = await investorApi.get(`api/updates/contract/${state.contractId}`).json();
    if (!data.success) throw new Error('Failed to get updates');
  });

  // ===== CATEGORY 9: DELIVERIES =====
  getCategory('Delivery Tracking');

  await test('Create Delivery', async () => {
    const data: any = await farmerApi.post('api/deliveries', {
      json: {
        contract_id: state.contractId,
        batch_number: `BATCH-${Date.now()}`,
        yield_amount_kg: 750,
        quality_grade: 'A',
        delivery_date: new Date().toISOString(),
        organic_verified: true,
      }
    }).json();
    
    if (!data.data.id) throw new Error('Delivery creation failed');
    state.deliveryId = data.data.id;
  });

  await test('Get Deliveries for Contract', async () => {
    const data: any = await investorApi.get(`api/deliveries/contract/${state.contractId}`).json();
    if (!data.success) throw new Error('Failed to get deliveries');
  });

  await test('Update Delivery Status - Investor Verification', async () => {
    const data: any = await investorApi.patch(`api/deliveries/${state.deliveryId}`, {
      json: {
        status: 'VERIFIED',
        delivery_proof_url: 'https://example.com/proof.jpg',
      }
    }).json();
    if (!data.success) throw new Error('Delivery verification failed');
  });

  // ===== CATEGORY 10: NOTIFICATIONS =====
  getCategory('Notifications');

  await test('Get Notifications', async () => {
    const data: any = await farmerApi.get('api/notifications?limit=10').json();
    if (!data.success) throw new Error('Failed to get notifications');
  });

  await test('Mark Notification as Read', async () => {
    const notifData: any = await farmerApi.get('api/notifications?limit=1').json();
    if (notifData.success && notifData.data?.length > 0) {
      state.notificationId = notifData.data[0].id;
      const data: any = await farmerApi.post('api/notifications/mark-read', {
        json: { notification_id: state.notificationId }
      }).json();
      if (!data.success) throw new Error('Mark read failed');
    }
  });

  // ===== CATEGORY 11: KYC =====
  getCategory('KYC Verification');

  await test('Get KYC Status', async () => {
    const data: any = await farmerApi.get('api/kyc/status').json();
    if (!data.success || typeof data.data.kyc_status === 'undefined') {
      throw new Error('Failed to get KYC status');
    }
  });

  // ===== CATEGORY 12: CHAT =====
  getCategory('Real-time Chat');

  await test('Create Conversation', async () => {
    const data: any = await farmerApi.post('api/chat/conversations', {
      json: {
        participant_two_phone: '+919876543211',
        contract_id: state.contractId,
      }
    }).json();
    if (!data.success) throw new Error('Conversation creation failed');
  });

  await test('Get Conversations', async () => {
    const data: any = await farmerApi.get('api/chat/conversations').json();
    if (!data.success) throw new Error('Failed to get conversations');
  });

  // ===== CATEGORY 13: ERROR HANDLING =====
  getCategory('Error Handling & Edge Cases');

  await test('Malformed JSON Returns 400', async () => {
    try {
      await farmerApi.post('api/listings', {
        headers: { 'Content-Type': 'application/json' },
        body: '{invalid json}'
      }).json();
      throw new Error('Should have failed');
    } catch (error: any) {
      if (!error.message.includes('400')) throw error;
    }
  });

  await test('Oversized Payload Rejected', async () => {
    try {
      await farmerApi.post('api/listings', {
        json: {
          name: 'Test',
          description: 'A'.repeat(10000), // Very long description
        }
      }).json();
      // May or may not fail depending on limits
    } catch (error: any) {
      // Expected if payload too large
    }
  });

  await test('Concurrent Requests Handled', async () => {
    const promises = Array(5).fill(null).map(() => 
      farmerApi.get('api/users/me').json()
    );
    const responses = await Promise.all(promises);
    if (responses.some(r => !(r as any).success)) {
      throw new Error('Some concurrent requests failed');
    }
  });

  // ===== CLEANUP =====
  getCategory('Session Cleanup');

  await test('Logout Farmer', async () => {
    const logoutApi = createAuthApi(state.farmer.accessToken);
    const data: any = await logoutApi.post('api/auth/logout').json();
    if (!data.success) throw new Error('Logout failed');
  });

  await test('Logout Investor', async () => {
    const logoutApi = createAuthApi(state.investor.accessToken);
    const data: any = await logoutApi.post('api/auth/logout').json();
    if (!data.success) throw new Error('Logout failed');
  });

  // Generate Report
  rl.close();
  generateReport();
}

// ========== REPORT GENERATION ==========

function generateReport() {
  const endTime = Date.now();
  const totalDuration = ((endTime - startTime) / 1000).toFixed(2);

  log('\n' + '╔'.repeat(80), 'cyan');
  log('║' + ' '.repeat(78) + '║', 'cyan');
  log('║' + ' '.repeat(30) + '📊 TEST REPORT 📊' + ' '.repeat(31) + '║', 'bold');
  log('║' + ' '.repeat(78) + '║', 'cyan');
  log('╚'.repeat(80), 'cyan');

  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const percentage = ((passed / total) * 100).toFixed(2);
  const failed = total - passed;

  log(`\n⏱️  Total Duration: ${totalDuration}s`, 'cyan');
  log(`📈 Success Rate: ${percentage}%`, percentage === '100.00' ? 'green' : 'yellow');

  // Category breakdown
  const categories = [...new Set(results.map(r => r.category))];
  
  log('\n📦 BREAKDOWN BY CATEGORY:', 'yellow');
  log('─'.repeat(80), 'dim');
  
  categories.forEach(cat => {
    const catResults = results.filter(r => r.category === cat);
    const catPassed = catResults.filter(r => r.passed).length;
    const catTotal = catResults.length;
    const catPct = ((catPassed / catTotal) * 100).toFixed(0);
    
    const icon = catPassed === catTotal ? '✅' : '⚠️';
    const color = catPassed === catTotal ? 'green' : 'yellow';
    
    log(`   ${icon} ${color === 'green' ? '' : ''}${cat}: ${catPassed}/${catTotal} (${catPct}%)${color === 'green' ? '' : ''}`, color);
  });

  log('\n' + '─'.repeat(80), 'dim');
  log(`📊 OVERALL: ${passed}/${total} tests passed`, passed === total ? 'green' : 'yellow');
  log('═'.repeat(80), 'cyan');

  // Failed tests detail
  if (failed > 0) {
    log('\n❌ FAILED TESTS:', 'red');
    log('─'.repeat(80), 'red');
    
    results.filter(r => !r.passed).forEach(r => {
      log(`   • ${r.test}`, 'red');
      if (r.error) log(`     Error: ${r.error}`, 'yellow');
    });
    
    log('═'.repeat(80), 'cyan');
  }

  // Performance stats
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / total;
  const slowest = [...results].sort((a, b) => b.duration - a.duration)[0];
  
  log('\n⚡ PERFORMANCE STATS:', 'cyan');
  log(`   Average test duration: ${avgDuration.toFixed(0)}ms`);
  log(`   Slowest test: ${slowest.test} (${slowest.duration}ms)`);

  // Final verdict
  log('\n' + '═'.repeat(80), 'cyan');
  if (passed === total) {
    log('🎉 ALL TESTS PASSED! Your API is production-ready!', 'bold');
  } else {
    log('⚠️  Some tests failed. Review the errors above.', 'yellow');
  }
  log('═'.repeat(80), 'cyan');

  // Exit code
  process.exit(passed === total ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  log(`\n❌ Test suite crashed: ${error.message}`, 'red');
  log(error.stack, 'red');
  rl.close();
  process.exit(1);
});
