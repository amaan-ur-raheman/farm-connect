/**
 * FarmConnect - Edge Cases & Error Scenario Testing
 * 
 * Tests boundary conditions, invalid inputs, and error handling
 * Run with: npx tsx tests/edge-cases-test.ts
 */

import ky from 'ky';
import * as readline from 'readline';

const BASE_URL = 'http://localhost:3000';
const api = ky.create({ prefixUrl: BASE_URL });

const c = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

const log = (msg: string, color = 'reset') => console.log(`${c[color as keyof typeof c]}${msg}${c.reset}`);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const prompt = (question: string): Promise<string> => new Promise(resolve => rl.question(question, resolve));

let accessToken = '';
let authApi: typeof api;

const results: { test: string; passed: boolean; error?: string }[] = [];

const test = async (name: string, fn: () => Promise<void>, expectError?: boolean) => {
  try {
    await fn();
    if (expectError) {
      log(`   ❌ ${name} (Should have failed but passed)`, 'yellow');
      results.push({ test: name, passed: false, error: 'Expected error but got success' });
    } else {
      log(`   ✅ ${name}`, 'green');
      results.push({ test: name, passed: true });
    }
  } catch (error: any) {
    if (expectError) {
      log(`   ✅ ${name} (Expected error: ${error.response?.status || error.message})`, 'green');
      results.push({ test: name, passed: true });
    } else {
      log(`   ❌ ${name}: ${error.message}`, 'red');
      results.push({ test: name, passed: false, error: error.message });
    }
  }
};

async function runTests() {
  log('\n🔬 FarmConnect - Edge Cases & Error Scenarios\n', 'cyan');

  // ========== AUTHENTICATION EDGE CASES ==========
  log('\n📦 Authentication Edge Cases', 'cyan');
  log('─'.repeat(60), 'dim');

  await test('Send OTP - Invalid Phone Format', async () => {
    await api.post('api/auth/otp/send', { json: { phone: 'invalid' } }).json();
  }, true);

  await test('Send OTP - Empty Phone', async () => {
    await api.post('api/auth/otp/send', { json: { phone: '' } }).json();
  }, true);

  await test('Send OTP - Missing Phone', async () => {
    await api.post('api/auth/otp/send', { json: {} }).json();
  }, true);

  await test('Verify OTP - Wrong Length', async () => {
    await api.post('api/auth/otp/verify', { json: { phone: '+919876543210', otp: '123' } }).json();
  }, true);

  await test('Verify OTP - Non-numeric OTP', async () => {
    await api.post('api/auth/otp/verify', { json: { phone: '+919876543210', otp: 'abcdef' } }).json();
  }, true);

  await test('Verify OTP - Expired OTP', async () => {
    await api.post('api/auth/otp/verify', { json: { phone: '+919876543210', otp: '000000' } }).json();
  }, true);

  // Get valid token for subsequent tests
  log('\n📝 Getting valid authentication token...', 'yellow');
  const otp = await prompt('Enter OTP for +919876543210: ');
  const authData: any = await api.post('api/auth/otp/verify', { 
    json: { phone: '+919876543210', otp } 
  }).json();
  accessToken = authData.data.accessToken;
  authApi = api.extend({
    hooks: { beforeRequest: [req => req.headers.set('Authorization', `Bearer ${accessToken}`)] },
  });

  // ========== LISTING VALIDATION EDGE CASES ==========
  log('\n📦 Listing Validation Edge Cases', 'cyan');
  log('─'.repeat(60), 'dim');

  await test('Create Listing - Negative Area', async () => {
    await authApi.post('api/listings', { json: {
      name: 'Test', area_acres: -5, price_per_acre: 50000,
      latitude: 19.9975, longitude: 73.7898, crops: ['Tomato'], location_name: 'Test'
    }}).json();
  }, true);

  await test('Create Listing - Zero Area', async () => {
    await authApi.post('api/listings', { json: {
      name: 'Test', area_acres: 0, price_per_acre: 50000,
      latitude: 19.9975, longitude: 73.7898, crops: ['Tomato'], location_name: 'Test'
    }}).json();
  }, true);

  await test('Create Listing - Negative Price', async () => {
    await authApi.post('api/listings', { json: {
      name: 'Test', area_acres: 5, price_per_acre: -50000,
      latitude: 19.9975, longitude: 73.7898, crops: ['Tomato'], location_name: 'Test'
    }}).json();
  }, true);

  await test('Create Listing - Latitude Out of Range (>90)', async () => {
    await authApi.post('api/listings', { json: {
      name: 'Test', area_acres: 5, price_per_acre: 50000,
      latitude: 91, longitude: 73.7898, crops: ['Tomato'], location_name: 'Test'
    }}).json();
  }, true);

  await test('Create Listing - Longitude Out of Range (>180)', async () => {
    await authApi.post('api/listings', { json: {
      name: 'Test', area_acres: 5, price_per_acre: 50000,
      latitude: 19.9975, longitude: 181, crops: ['Tomato'], location_name: 'Test'
    }}).json();
  }, true);

  await test('Create Listing - Empty Crops Array', async () => {
    await authApi.post('api/listings', { json: {
      name: 'Test', area_acres: 5, price_per_acre: 50000,
      latitude: 19.9975, longitude: 73.7898, crops: [], location_name: 'Test'
    }}).json();
  }, true);

  await test('Create Listing - Very Long Name (256+ chars)', async () => {
    await authApi.post('api/listings', { json: {
      name: 'A'.repeat(300), area_acres: 5, price_per_acre: 50000,
      latitude: 19.9975, longitude: 73.7898, crops: ['Tomato'], location_name: 'Test'
    }}).json();
  }, true);

  await test('Create Listing - Valid Extreme Values', async () => {
    await authApi.post('api/listings', { json: {
      name: 'Edge Case Farm',
      area_acres: 0.1, // Very small
      price_per_acre: 1, // Very low price
      latitude: -89.999, // Near pole
      longitude: -179.999, // Near date line
      crops: ['Tomato'],
      location_name: 'Remote Location'
    }}).json();
  }, false);

  // ========== CONTRACT VALIDATION EDGE CASES ==========
  log('\n📦 Contract Validation Edge Cases', 'cyan');
  log('─'.repeat(60), 'dim');

  await test('Create Contract - Negative Acreage', async () => {
    await authApi.post('api/contracts', { json: {
      listing_id: 'test', crop: 'Wheat', acreage: -5, total_amount: 100000
    }}).json();
  }, true);

  await test('Create Contract - Zero Total Amount', async () => {
    await authApi.post('api/contracts', { json: {
      listing_id: 'test', crop: 'Wheat', acreage: 5, total_amount: 0
    }}).json();
  }, true);

  await test('Create Contract - End Date Before Start Date', async () => {
    await authApi.post('api/contracts', { json: {
      listing_id: 'test', crop: 'Wheat', acreage: 5, total_amount: 100000,
      start_date: new Date('2027-01-01').toISOString(),
      end_date: new Date('2026-01-01').toISOString()
    }}).json();
  }, true);

  await test('Create Contract - Invalid Listing ID', async () => {
    await authApi.post('api/contracts', { json: {
      listing_id: 'non-existent-id-format-xyz',
      crop: 'Wheat', acreage: 5, total_amount: 100000
    }}).json();
  }, true);

  // ========== PAYMENT EDGE CASES ==========
  log('\n📦 Payment Validation Edge Cases', 'cyan');
  log('─'.repeat(60), 'dim');

  await test('Create Payment Order - Negative Amount', async () => {
    await authApi.post('api/payments/order', { json: {
      amount: -100, currency: 'INR'
    }}).json();
  }, true);

  await test('Create Payment Order - Zero Amount', async () => {
    await authApi.post('api/payments/order', { json: {
      amount: 0, currency: 'INR'
    }}).json();
  }, true);

  await test('Create Payment Order - Invalid Currency', async () => {
    await authApi.post('api/payments/order', { json: {
      amount: 100, currency: 'INVALID'
    }}).json();
  }, true);

  await test('Create Payment Order - Extremely Large Amount', async () => {
    await authApi.post('api/payments/order', { json: {
      amount: 999999999999, currency: 'INR'
    }}).json();
  }, true); // May or may not fail

  // ========== DELIVERY EDGE CASES ==========
  log('\n📦 Delivery Validation Edge Cases', 'cyan');
  log('─'.repeat(60), 'dim');

  await test('Create Delivery - Negative Yield', async () => {
    await authApi.post('api/deliveries', { json: {
      contract_id: 'test', yield_amount_kg: -100
    }}).json();
  }, true);

  await test('Create Delivery - Invalid Quality Grade', async () => {
    await authApi.post('api/deliveries', { json: {
      contract_id: 'test', quality_grade: 'INVALID_GRADE'
    }}).json();
  }, true);

  await test('Create Delivery - Future Delivery Date', async () => {
    await authApi.post('api/deliveries', { json: {
      contract_id: 'test',
      delivery_date: new Date('2030-01-01').toISOString()
    }}).json();
  }, true);

  // ========== REVIEW EDGE CASES ==========
  log('\n📦 Review Validation Edge Cases', 'cyan');
  log('─'.repeat(60), 'dim');

  await test('Create Review - Rating Below Minimum', async () => {
    await authApi.post('api/reviews', { json: {
      contract_id: 'test', rating: 0
    }}).json();
  }, true);

  await test('Create Review - Rating Above Maximum', async () => {
    await authApi.post('api/reviews', { json: {
      contract_id: 'test', rating: 6
    }}).json();
  }, true);

  await test('Create Review - Empty Comment', async () => {
    await authApi.post('api/reviews', { json: {
      contract_id: 'test', rating: 5, comment: ''
    }}).json();
  }, false); // Should succeed

  // ========== NOTIFICATION EDGE CASES ==========
  log('\n📦 Notification Edge Cases', 'cyan');
  log('─'.repeat(60), 'dim');

  await test('Mark Read - Invalid Notification ID', async () => {
    await authApi.post('api/notifications/mark-read', { json: {
      notification_id: 'invalid-id'
    }}).json();
  }, true);

  await test('Get Notifications - Negative Limit', async () => {
    await authApi.get('api/notifications?limit=-10').json();
  }, true);

  await test('Get Notifications - Very Large Limit', async () => {
    const data: any = await authApi.get('api/notifications?limit=1000').json();
    // Should either work or cap at max
  }, false);

  // ========== CONCURRENCY & RACE CONDITIONS ==========
  log('\n📦 Concurrency Tests', 'cyan');
  log('─'.repeat(60), 'dim');

  await test('Multiple Simulated Requests', async () => {
    const promises = Array(10).fill(null).map(() => authApi.get('api/users/me').json());
    const responses = await Promise.all(promises);
    if (responses.some(r => !(r as any).success)) {
      throw new Error('Some concurrent requests failed');
    }
  }, false);

  await test('Rapid Sequential Auth Requests', async () => {
    for (let i = 0; i < 5; i++) {
      await authApi.get('api/users/me').json();
    }
  }, false);

  // ========== SPECIAL CHARACTERS & INJECTION ==========
  log('\n📦 Special Characters & Security', 'cyan');
  log('─'.repeat(60), 'dim');

  await test('Update Profile - SQL Injection Attempt in Name', async () => {
    await authApi.patch('api/users/me', { json: {
      name: "Robert'); DROP TABLE users;--"
    }}).json();
  }, false); // Should be sanitized

  await test('Update Profile - XSS Attempt', async () => {
    await authApi.patch('api/users/me', { json: {
      name: '<script>alert("XSS")</script>'
    }}).json();
  }, false); // Should be sanitized

  await test('Update Profile - Unicode Characters', async () => {
    await authApi.patch('api/users/me', { json: {
      name: '你好世界 🌍 مرحبا'
    }}).json();
  }, false); // Should handle unicode

  await test('Update Profile - Emoji Only', async () => {
    await authApi.patch('api/users/me', { json: {
      name: '👨‍🌾'
    }}).json();
  }, false); // Should handle emoji

  // ========== SUMMARY ==========
  rl.close();
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const percentage = ((passed / total) * 100).toFixed(2);

  log('\n' + '='.repeat(60), 'cyan');
  log('📊 EDGE CASE TEST SUMMARY', 'cyan');
  log('='.repeat(60), 'cyan');
  log(`\nTotal: ${passed}/${total} tests passed (${percentage}%)`, passed === total ? 'green' : 'yellow');

  if (passed < total) {
    log('\n❌ Failed Tests:', 'red');
    results.filter(r => !r.passed).forEach(r => {
      log(`   • ${r.test}`, 'red');
      if (r.error) log(`     Error: ${r.error}`, 'yellow');
    });
  } else {
    log('\n🎉 All edge cases handled correctly!', 'green');
  }

  log('='.repeat(60), 'cyan');
  process.exit(passed === total ? 0 : 1);
}

runTests().catch(error => {
  log(`\n❌ Test suite crashed: ${error.message}`, 'red');
  rl.close();
  process.exit(1);
});
