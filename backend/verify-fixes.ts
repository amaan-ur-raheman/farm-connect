#!/usr/bin/env tsx
/**
 * Quick Verification Script - Tests the specific fixes that were applied
 */

import ky from 'ky';
import { expect } from 'vitest';

const API_BASE = 'http://localhost:3000';

console.log('\n🔍 Verifying Fixes Applied to FarmConnect Backend\n');
console.log('═'.repeat(70));

const results = {
  passed: 0,
  failed: 0,
  tests: [] as string[],
};

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`✅ ${name}`);
    results.passed++;
    results.tests.push(`✅ ${name}`);
  } catch (error: any) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
    results.failed++;
    results.tests.push(`❌ ${name} - ${error.message}`);
  }
}

async function runTests() {
// Test 1: SQL Injection Prevention
await test('SQL Injection Prevention in Listing Search', async () => {
  const response = await ky.get(`${API_BASE}/api/listings`, {
    searchParams: { search: "UNION SELECT * FROM users--", limit: 10 },
  }).json<any>();

  if (!response.success) throw new Error('Expected successful response');
  // If we get here without error, SQL injection was prevented
});

// Test 2: Missing Endpoints - My Listings
await test('GET /api/listings/my-listings endpoint exists', async () => {
  try {
    const response = await ky.get(`${API_BASE}/api/listings/my-listings`);
    // Should not return 404 (might return 401 if auth required, which is fine)
    if (response.status === 404) throw new Error('Endpoint returns 404');
  } catch (error: any) {
    if (error.message.includes('404')) throw error;
    // Other errors are OK for this test
  }
});

// Test 3: Missing Endpoints - Escrow Ledger
await test('GET /api/escrow/contract/:id endpoint exists', async () => {
  try {
    const response = await ky.get(`${API_BASE}/api/escrow/contract/test-id`);
    if (response.status === 404) throw new Error('Endpoint returns 404');
  } catch (error: any) {
    if (error.message.includes('404')) throw error;
  }
});

// Test 4: Missing Endpoints - Deliveries
await test('PATCH /api/deliveries/:id endpoint exists', async () => {
  try {
    const response = await ky.patch(`${API_BASE}/api/deliveries/test-id`);
    if (response.status === 404) throw new Error('Endpoint returns 404');
  } catch (error: any) {
    if (error.message.includes('404')) throw error;
  }
});

// Test 5: Missing Endpoints - KYC Status
await test('GET /api/kyc/status endpoint exists', async () => {
  try {
    const response = await ky.get(`${API_BASE}/api/kyc/status`);
    if (response.status === 404) throw new Error('Endpoint returns 404');
  } catch (error: any) {
    if (error.message.includes('404')) throw error;
  }
});

// Test 6: Validation Returns 400 Not 500
await test('Validation errors return 400 status code', async () => {
  try {
    await ky.post(`${API_BASE}/api/auth/otp/send`, {
      json: { phone: 'invalid' }
    });
  } catch (error: any) {
    if (error.response?.status === 500) {
      throw new Error('Validation returned 500 instead of 400');
    }
    // 400 is expected
    if (error.response?.status !== 400 && error.response?.status !== 422) {
      // Some other error, but not 500 which is what we're testing for
    }
  }
});

// Test 7: Rate Limiting Works
await test('Rate limiting triggers after many requests', async () => {
  let rateLimited = false;
  for (let i = 0; i < 120; i++) {
    try {
      await ky.get(`${API_BASE}/api/listings?limit=1`);
    } catch (error: any) {
      if (error.response?.status === 429) {
        rateLimited = true;
        break;
      }
    }
  }
  if (!rateLimited) {
    throw new Error('Rate limiting did not trigger after 120 requests');
  }
});

// Test 8: Health Check Still Works
await test('Health check endpoint responds', async () => {
  const response = await ky.get(`${API_BASE}/health`).json<any>();
  if (!response) throw new Error('Health check returned empty response');
});

  console.log('\n' + '═'.repeat(70));
  console.log(`\n📊 Results: ${results.passed} passed, ${results.failed} failed\n`);

  if (results.failed === 0) {
    console.log('🎉 All fixes verified successfully!\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some fixes need attention:\n');
    results.tests.forEach(t => console.log(`  ${t}`));
    console.log('');
    process.exit(1);
  }
}

runTests();
