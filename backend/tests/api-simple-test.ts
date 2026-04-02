/**
 * Simple API Test Script for FarmConnect Backend
 * Uses ky for consistent HTTP requests
 * 
 * Run with: npx tsx tests/api-simple-test.ts
 */

import ky from 'ky';

const BASE_URL = 'http://localhost:3000';

const api = ky.create({
  prefixUrl: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Colors for console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message: string, color = 'reset') {
  console.log(`${colors[color as keyof typeof colors]}${message}${colors.reset}`);
}

let accessToken = '';
let refreshToken = '';
const testPhone = '+919999888877';

async function test(name: string, fn: () => Promise<boolean>) {
  log(`\n🧪 TEST: ${name}`, 'cyan');
  try {
    const passed = await fn();
    if (passed) {
      log(`✅ ${name} - PASSED`, 'green');
      return true;
    } else {
      log(`❌ ${name} - FAILED`, 'red');
      return false;
    }
  } catch (error: any) {
    log(`❌ ${name} - ERROR: ${error.message}`, 'red');
    return false;
  }
}

async function runTests() {
  log('\n🚀 FarmConnect API - Simple Test Suite\n', 'cyan');

  const results: boolean[] = [];

  // Test 1: Health Check
  results.push(await test('Health Check', async () => {
    const data: any = await api.get('health').json();
    log(`   Server Status: ${data.status}`);
    return data.status === 'ok';
  }));

  // Test 2: Send OTP
  results.push(await test('Send OTP', async () => {
    const data: any = await api.post('api/auth/otp/send', { json: { phone: testPhone } }).json();
    log(`   Response: ${data.success ? 'OTP sent' : 'Failed'}`);
    return data.success === true;
  }));

  // Test 3: Verify OTP
  results.push(await test('Verify OTP', async () => {
    const data: any = await api.post('api/auth/otp/verify', { 
      json: { phone: testPhone, otp: '123456' } 
    }).json();
    
    if (data.success) {
      accessToken = data.data.accessToken;
      refreshToken = data.data.refreshToken;
      log(`   User ID: ${data.data.user.id}`);
      log(`   Role: ${data.data.user.role}`);
      log(`   Token: ${accessToken.slice(0, 20)}...`);
    }
    return data.success === true;
  }));

  // Test 4: Get User Profile
  results.push(await test('Get User Profile', async () => {
    if (!accessToken) return false;
    const data: any = await api.get('api/users/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    }).json();
    
    if (data.success) {
      log(`   Name: ${data.data?.name || 'Not set'}`);
      log(`   Phone: ${data.data?.phone}`);
    }
    return data.success === true;
  }));

  // Test 5: Get Listings
  results.push(await test('Get Listings', async () => {
    const data: any = await api.get('api/listings?limit=5').json();
    
    if (data.success) {
      log(`   Total: ${data.pagination?.total || 0} listings`);
      log(`   Page: ${data.pagination?.page || 1}`);
    }
    return data.success === true;
  }));

  // Test 6: Get Wallet Balance
  results.push(await test('Get Wallet Balance', async () => {
    if (!accessToken) return false;
    const data: any = await api.get('api/wallet/balance', {
      headers: { Authorization: `Bearer ${accessToken}` },
    }).json();
    
    log(`   Balance: ₹${data.data?.balance || 0}`);
    return data.success === true;
  }));

  // Test 7: Get Notifications
  results.push(await test('Get Notifications', async () => {
    if (!accessToken) return false;
    const data: any = await api.get('api/notifications', {
      headers: { Authorization: `Bearer ${accessToken}` },
    }).json();
    
    log(`   Total: ${data.pagination?.total || 0}`);
    log(`   Unread: ${data.unread_count || 0}`);
    return data.success === true;
  }));

  // Test 8: Refresh Token
  results.push(await test('Refresh Token', async () => {
    if (!refreshToken) return false;
    const data: any = await api.post('api/auth/refresh', { 
      json: { refreshToken } 
    }).json();
    
    if (data.success) {
      accessToken = data.data.accessToken;
      refreshToken = data.data.refreshToken;
      log(`   New Token: ${accessToken.slice(0, 20)}...`);
    }
    return data.success === true;
  }));

  // Test 9: Logout
  results.push(await test('Logout', async () => {
    if (!accessToken) return false;
    const data: any = await api.post('api/auth/logout', {
      headers: { Authorization: `Bearer ${accessToken}` },
    }).json();
    
    log(`   Response: ${data.success ? 'Logged out' : 'Failed'}`);
    return data.success === true;
  }));

  // Summary
  log('\n' + '='.repeat(60), 'cyan');
  log('📊 TEST SUMMARY', 'cyan');
  log('='.repeat(60), 'cyan');

  const passed = results.filter(r => r).length;
  const total = results.length;
  const percentage = ((passed / total) * 100).toFixed(2);

  const tests = [
    'Health Check',
    'Send OTP',
    'Verify OTP',
    'Get User Profile',
    'Get Listings',
    'Get Wallet Balance',
    'Get Notifications',
    'Refresh Token',
    'Logout',
  ];

  results.forEach((result, i) => {
    log(`${result ? '✅' : '❌'} ${tests[i]}`);
  });

  log('\n' + '-'.repeat(60), 'yellow');
  log(`Total: ${passed}/${total} tests passed (${percentage}%)`, percentage === '100.00' ? 'green' : 'yellow');
  log('='.repeat(60), 'cyan');

  process.exit(passed === total ? 0 : 1);
}

runTests().catch(error => {
  log(`\n❌ Test suite failed: ${error.message}`, 'red');
  process.exit(1);
});
