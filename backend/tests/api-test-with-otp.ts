/**
 * FarmConnect Backend - API Test with Manual OTP Entry
 * 
 * This test prompts you for the OTP from the server console
 * Run with: npx tsx tests/api-test-with-otp.ts
 */

import ky from 'ky';
import * as readline from 'readline';

const BASE_URL = 'http://localhost:3000';
const api = ky.create({ prefixUrl: BASE_URL });

// Colors
const c = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

const log = (msg: string, color = 'reset') => console.log(`${c[color as keyof typeof c]}${msg}${c.reset}`);

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const prompt = (question: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
};

// Test state
let tokens = {
  farmer: { accessToken: '', refreshToken: '' },
  consumer: { accessToken: '', refreshToken: '' },
};

let testIds = {
  listing: '',
  contract: '',
};

// Results tracking
const results: { module: string; test: string; passed: boolean; error?: string }[] = [];

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

async function runTests() {
  log('\n' + '🚀 '.repeat(20), 'cyan');
  log('🚀 FarmConnect - API Test with OTP Entry', 'bold');
  log('🚀 '.repeat(20), 'cyan');

  // ========== HEALTH CHECK ==========
  testModule('Health & Infrastructure');
  
  await test('Health Check', async () => {
    const data: any = await api.get('health').json();
    if (!data.status) throw new Error('Invalid health response');
  });

  // ========== AUTHENTICATION ==========
  testModule('Authentication');

  // Get OTP from user
  log('\n' + '-'.repeat(70), 'yellow');
  log('📝 IMPORTANT: Please check your backend server console!', 'yellow');
  log('-'.repeat(70), 'yellow');
  log('\nYou should see a log like:', 'yellow');
  log('   [DEV] OTP for +919876543210: XXXXXX', 'cyan');
  log('\nEnter the 6-digit OTP shown in your server console:', 'yellow');
  
  const farmerOtp = await prompt('\n🔑 OTP for Farmer (+919876543210): ');
  
  await test('Verify OTP & Login (Farmer)', async () => {
    const data: any = await api.post('api/auth/otp/verify', { 
      json: { phone: '+919876543210', otp: farmerOtp } 
    }).json();
    
    if (!data.data.accessToken) {
      throw new Error('No tokens received');
    }
    tokens.farmer = { accessToken: data.data.accessToken, refreshToken: data.data.refreshToken };
    log(`   Logged in as: ${data.data.user.name} (${data.data.user.role})`, 'green');
  });

  const consumerOtp = await prompt('\n🔑 OTP for Consumer (+919876543211): ');
  
  await test('Verify OTP & Login (Consumer)', async () => {
    const data: any = await api.post('api/auth/otp/verify', { 
      json: { phone: '+919876543211', otp: consumerOtp } 
    }).json();
    if (!data.data.accessToken) throw new Error('No tokens received');
    tokens.consumer = { accessToken: data.data.accessToken, refreshToken: data.data.refreshToken };
    log(`   Logged in as: ${data.data.user.name} (${data.data.user.role})`, 'green');
  });

  // ========== USER MANAGEMENT ==========
  testModule('User Management');

  const farmerApi = api.extend({
    hooks: {
      beforeRequest: [
        request => {
          request.headers.set('Authorization', `Bearer ${tokens.farmer.accessToken}`);
        },
      ],
    },
  });
  
  await test('Get Current User Profile', async () => {
    const data: any = await farmerApi.get('api/users/me').json();
    if (!data.success || !data.data.user) throw new Error('Profile fetch failed');
  });

  await test('Update User Profile', async () => {
    const data: any = await farmerApi.patch('api/users/me', {
      json: {
        name: 'Rajesh Kumar Updated',
        city: 'Mumbai',
        state: 'Maharashtra',
      }
    }).json();
    if (!data.success) throw new Error('Profile update failed');
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
        crops: ['Tomato', 'Spinach'],
        location_name: 'Nashik, Maharashtra',
        latitude: 19.9975,
        longitude: 73.7898,
        soil_type: 'Loamy',
        irrigation_type: 'Drip',
        is_organic: true,
      }
    }).json();
    
    if (!data.data.id) throw new Error('Listing creation failed');
    testIds.listing = data.data.id;
    log(`   Created listing ID: ${testIds.listing}`, 'yellow');
  });

  await test('Get My Listings', async () => {
    const data: any = await farmerApi.get('api/listings/my-listings').json();
    if (!data.success) throw new Error('Failed to get my listings');
  });

  await test('Get All Listings (Public)', async () => {
    const data: any = await api.get('api/listings?limit=10').json();
    if (!data.success) throw new Error('Failed to get listings');
  });

  // ========== CONTRACTS ==========
  testModule('Contracts');

  const consumerApi = api.extend({
    hooks: {
      beforeRequest: [
        request => {
          request.headers.set('Authorization', `Bearer ${tokens.consumer.accessToken}`);
        },
      ],
    },
  });

  await test('Create Contract (Investor)', async () => {
    const data: any = await consumerApi.post('api/contracts', {
      json: {
        listing_id: testIds.listing,
        crop: 'Tomato',
        acreage: 2,
        price_per_acre: 50000,
        total_amount: 100000,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
      }
    }).json();
    
    if (!data.data.id) throw new Error('Contract creation failed');
    testIds.contract = data.data.id;
    log(`   Created contract ID: ${testIds.contract}`, 'yellow');
  });

  await test('Get Farmer Contracts', async () => {
    const data: any = await farmerApi.get('api/contracts/farmer').json();
    if (!data.success) throw new Error('Failed to get farmer contracts');
  });

  await test('Get Consumer Contracts', async () => {
    const data: any = await consumerApi.get('api/contracts/consumer').json();
    if (!data.success) throw new Error('Failed to get consumer contracts');
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
    if (typeof data.data.balance === 'undefined') throw new Error('Failed to get balance');
    log(`   Balance: ₹${data.data.balance}`, 'yellow');
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
        amount: 100000,
        currency: 'INR',
        contract_id: testIds.contract,
      }
    }).json();
    if (!data.data.order_id) throw new Error('Order creation failed');
    log(`   Order ID: ${data.data.order_id}`, 'yellow');
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
      }
    }).json();
    
    if (!data.data.id) throw new Error('Update creation failed');
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
      }
    }).json();
    
    if (!data.data.id) throw new Error('Delivery creation failed');
  });

  await test('Get Deliveries', async () => {
    const data: any = await consumerApi.get(`api/deliveries/contract/${testIds.contract}`).json();
    if (!data.success) throw new Error('Failed to get deliveries');
  });

  // ========== NOTIFICATIONS ==========
  testModule('Notifications');

  await test('Get Notifications', async () => {
    const data: any = await farmerApi.get('api/notifications?limit=10').json();
    if (!data.success) throw new Error('Failed to get notifications');
  });

  // ========== KYC ==========
  testModule('KYC');

  await test('Get KYC Status', async () => {
    const data: any = await farmerApi.get('api/kyc/status').json();
    if (!data.success) throw new Error('Failed to get KYC status');
    log(`   KYC Status: ${data.data.kyc_status}`, 'yellow');
  });

  // ========== SUMMARY ==========
  rl.close();
  printSummary();
}

function printSummary() {
  log('\n' + '═'.repeat(70), 'cyan');
  log('📊 TEST SUMMARY', 'bold');
  log('═'.repeat(70), 'cyan');

  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const percentage = ((passed / total) * 100).toFixed(1);

  log(`\n📈 OVERALL: ${passed}/${total} tests passed (${percentage}%)`, 
    passed === total ? 'green' : 'yellow');
  log('═'.repeat(70), 'cyan');

  if (passed < total) {
    log('\n❌ FAILED TESTS:', 'red');
    const failed = results.filter(r => !r.passed);
    failed.forEach(f => {
      log(`   • ${f.test}`, 'red');
      if (f.error) log(`     Error: ${f.error}`, 'yellow');
    });
  } else {
    log('\n🎉 ALL TESTS PASSED! Your API is working perfectly!', 'green');
  }

  log('\n' + '═'.repeat(70), 'cyan');
  process.exit(passed === total ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  log(`\n❌ Test suite crashed: ${error.message}`, 'red');
  rl.close();
  process.exit(1);
});
