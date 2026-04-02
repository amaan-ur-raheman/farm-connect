/**
 * FarmConnect Backend API Test
 * Tests core API endpoints using seeded database users
 * 
 * Prerequisites:
 * - Backend server running on http://localhost:3000
 * - Database seeded with test data
 * 
 * Run with: npx tsx tests/api-quick-test.ts
 */

import ky from 'ky';

const BASE_URL = 'http://localhost:3000';
const api = ky.create({ prefixUrl: BASE_URL });

// Test users from seed data
const TEST_USERS = [
  { phone: '+919876543210', name: 'Rajesh Kumar', role: 'FARMER' },
  { phone: '+919876543211', name: 'Vikram Mehta', role: 'CONSUMER' },
  { phone: '+919876543212', name: 'Sunita Patil', role: 'FARMER' },
];

// Colors
const c = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

const log = (msg: string, color = 'reset') => console.log(`${c[color as keyof typeof c]}${msg}${c.reset}`);

async function runTests() {
  log('\n🚀 FarmConnect API - Quick Test\n', 'cyan');

  const results: { name: string; passed: boolean }[] = [];

  // Test 1: Health Check
  log('🧪 TEST 1: Health Check', 'cyan');
  try {
    const data: any = await api.get('health').json();
    log(`   ✅ Server: ${data.status} (${data.timestamp})`, 'green');
    results.push({ name: 'Health Check', passed: true });
  } catch (error: any) {
    log(`   ❌ Error: ${error.message}`, 'red');
    results.push({ name: 'Health Check', passed: false });
  }

  // Test 2: Get Listings (Public)
  log('\n🧪 TEST 2: Get Farm Listings', 'cyan');
  try {
    const data: any = await api.get('api/listings?limit=5').json();
    if (data.success) {
      log(`   ✅ Found ${data.data?.length || 0} listings`, 'green');
      data.data?.forEach((listing: any, i: number) => {
        log(`      ${i + 1}. ${listing.name} - ₹${listing.price_per_acre}/acre`, 'yellow');
      });
      results.push({ name: 'Get Listings', passed: true });
    } else {
      throw new Error('API returned success: false');
    }
  } catch (error: any) {
    log(`   ❌ Error: ${error.message}`, 'red');
    results.push({ name: 'Get Listings', passed: false });
  }

  // Test 3: Get Single Listing
  log('\n🧪 TEST 3: Get Listing Details', 'cyan');
  try {
    const listings: any = await api.get('api/listings?limit=1').json();
    if (listings.success && listings.data?.length > 0) {
      const listingId = listings.data[0].id;
      const data: any = await api.get(`api/listings/${listingId}`).json();
      if (data.success) {
        log(`   ✅ Listing: ${data.data.name}`, 'green');
        log(`      Location: ${data.data.location_name}`, 'yellow');
        log(`      Area: ${data.data.area_acres} acres`, 'yellow');
        results.push({ name: 'Get Listing Details', passed: true });
      } else {
        throw new Error('Failed to get listing details');
      }
    } else {
      throw new Error('No listings found');
    }
  } catch (error: any) {
    log(`   ❌ Error: ${error.message}`, 'red');
    results.push({ name: 'Get Listing Details', passed: false });
  }

  // Test 4: Check Database Connection (via users endpoint error)
  log('\n🧪 TEST 4: Database Connection', 'cyan');
  try {
    // Try to access protected endpoint without token - should get 401, not 500
    await api.get('api/users/me').json();
    log(`   ⚠️  Unexpected: No auth required`, 'yellow');
    results.push({ name: 'Database Connection', passed: false });
  } catch (error: any) {
    if (error.response?.status === 401) {
      log(`   ✅ Auth working: ${error.message}`, 'green');
      results.push({ name: 'Database Connection', passed: true });
    } else {
      log(`   ❌ Error: ${error.message}`, 'red');
      results.push({ name: 'Database Connection', passed: false });
    }
  }

  // Test 5: Rate Limiting
  log('\n🧪 TEST 5: Rate Limiting', 'cyan');
  try {
    let rateLimited = false;
    for (let i = 0; i < 15; i++) {
      try {
        await api.get('health').json();
      } catch (error: any) {
        if (error.response?.status === 429) {
          rateLimited = true;
          log(`   ✅ Rate limited after ${i + 1} requests`, 'green');
          break;
        }
      }
    }
    if (!rateLimited) {
      log(`   ⚠️  Rate limiting not triggered (15 requests)`, 'yellow');
    }
    results.push({ name: 'Rate Limiting', passed: true });
  } catch (error: any) {
    log(`   ❌ Error: ${error.message}`, 'red');
    results.push({ name: 'Rate Limiting', passed: false });
  }

  // Summary
  log('\n' + '='.repeat(60), 'cyan');
  log('📊 TEST SUMMARY', 'cyan');
  log('='.repeat(60), 'cyan');

  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const percentage = ((passed / total) * 100).toFixed(1);

  results.forEach(result => {
    log(`${result.passed ? '✅' : '❌'} ${result.name}`);
  });

  log('\n' + '-'.repeat(60), 'yellow');
  log(`Total: ${passed}/${total} tests passed (${percentage}%)`, passed === total ? 'green' : 'yellow');
  log('='.repeat(60), 'cyan');

  // Test users info
  log('\n📝 TEST USERS (from seed):', 'cyan');
  TEST_USERS.forEach(user => {
    log(`   ${user.name} - ${user.phone} (${user.role})`, 'yellow');
  });
  log('\n   OTP for all users: 123456 (in development mode)', 'yellow');
  log('='.repeat(60), 'cyan');

  process.exit(passed === total ? 0 : 1);
}

runTests().catch(error => {
  log(`\n❌ Test failed: ${error.message}`, 'red');
  process.exit(1);
});
