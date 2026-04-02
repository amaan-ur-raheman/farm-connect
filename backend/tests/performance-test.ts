/**
 * FarmConnect - Performance & Load Testing Suite
 * 
 * Tests API performance, response times, and behavior under load
 * Run with: npx tsx tests/performance-test.ts
 */

import ky from 'ky';

const BASE_URL = 'http://localhost:3000';
const api = ky.create({ prefixUrl: BASE_URL });

const c = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

const log = (msg: string, color = 'reset') => console.log(`${c[color as keyof typeof c]}${msg}${c.reset}`);

interface PerformanceMetrics {
  endpoint: string;
  requests: number;
  successful: number;
  failed: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestsPerSecond: number;
}

// ========== LOAD TEST CONFIGURATION ==========

const TEST_SCENARIOS = [
  { name: 'Health Check', requests: 100, concurrency: 10 },
  { name: 'Get Listings', requests: 50, concurrency: 5 },
  { name: 'Get User Profile', requests: 30, concurrency: 3 },
  { name: 'Get Wallet Balance', requests: 30, concurrency: 3 },
];

// ========== METRICS COLLECTION ==========

async function measureRequest(
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  options?: any
): Promise<{ duration: number; success: boolean; status: number }> {
  const start = Date.now();
  try {
    const response = await api(endpoint, { ...options, method });
    const duration = Date.now() - start;
    return { duration, success: response.ok, status: response.status };
  } catch (error: any) {
    const duration = Date.now() - start;
    return { duration, success: false, status: error.response?.status || 0 };
  }
}

async function runLoadTest(
  endpoint: string,
  totalRequests: number,
  concurrency: number,
  options?: any
): Promise<PerformanceMetrics> {
  const results: { duration: number; success: boolean; status: number }[] = [];
  const startTime = Date.now();

  log(`\n   Running ${totalRequests} requests with concurrency ${concurrency}...`, 'dim');

  // Run requests in batches
  for (let i = 0; i < totalRequests; i += concurrency) {
    const batch = Math.min(concurrency, totalRequests - i);
    const promises = Array(batch).fill(null).map(() => measureRequest(endpoint, 'GET', options));
    const batchResults = await Promise.all(promises);
    results.push(...batchResults);
  }

  const totalTime = (Date.now() - startTime) / 1000;
  const durations = results.map(r => r.duration).sort((a, b) => a - b);
  const successful = results.filter(r => r.success).length;
  const failed = results.length - successful;

  // Calculate percentiles
  const p95Index = Math.floor(durations.length * 0.95);
  const p99Index = Math.floor(durations.length * 0.99);

  return {
    endpoint,
    requests: totalRequests,
    successful,
    failed,
    avgResponseTime: durations.reduce((a, b) => a + b, 0) / durations.length,
    minResponseTime: durations[0],
    maxResponseTime: durations[durations.length - 1],
    p95ResponseTime: durations[p95Index] || durations[durations.length - 1],
    p99ResponseTime: durations[p99Index] || durations[durations.length - 1],
    requestsPerSecond: totalRequests / totalTime,
  };
}

// ========== PERFORMANCE TESTS ==========

async function runPerformanceTests() {
  log('\n' + '🚀 '.repeat(25), 'cyan');
  log('🚀 FarmConnect Performance & Load Test', 'bold');
  log('🚀 '.repeat(25), 'cyan');

  const allMetrics: PerformanceMetrics[] = [];

  // Test 1: Health Endpoint Load Test
  log('\n📦 Test 1: Health Check Endpoint', 'cyan');
  log('─'.repeat(70), 'dim');
  
  const healthMetrics = await runLoadTest('health', 100, 10);
  allMetrics.push(healthMetrics);
  printMetrics(healthMetrics);

  // Test 2: Get Listings Load Test
  log('\n📦 Test 2: Get Listings Endpoint', 'cyan');
  log('─'.repeat(70), 'dim');
  
  const listingsMetrics = await runLoadTest('api/listings?limit=10', 50, 5);
  allMetrics.push(listingsMetrics);
  printMetrics(listingsMetrics);

  // Test 3: Stress Test - Rapid Requests
  log('\n📦 Test 3: Stress Test (100 requests)', 'cyan');
  log('─'.repeat(70), 'dim');
  
  const stressMetrics = await runLoadTest('health', 100, 20);
  allMetrics.push(stressMetrics);
  printMetrics(stressMetrics);

  // Test 4: Endurance Test - Sustained Load
  log('\n📦 Test 4: Endurance Test (30 seconds)', 'cyan');
  log('─'.repeat(70), 'dim');
  
  const enduranceStart = Date.now();
  let enduranceRequests = 0;
  let enduranceSuccess = 0;
  
  while (Date.now() - enduranceStart < 30000) {
    const promises = Array(5).fill(null).map(() => measureRequest('health'));
    const results = await Promise.all(promises);
    enduranceRequests += results.length;
    enduranceSuccess += results.filter(r => r.success).length;
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
  }
  
  log(`   Completed ${enduranceRequests} requests in 30 seconds`, 'cyan');
  log(`   Success rate: ${((enduranceSuccess / enduranceRequests) * 100).toFixed(2)}%`, 'green');

  // Test 5: Spike Test - Sudden Traffic Increase
  log('\n📦 Test 5: Spike Test', 'cyan');
  log('─'.repeat(70), 'dim');
  
  const spikeStart = Date.now();
  let spikeRequests = 0;
  let spikeSuccess = 0;
  
  // Send 50 requests as fast as possible
  const promises = Array(50).fill(null).map(() => measureRequest('health'));
  const results = await Promise.all(promises);
  spikeRequests = results.length;
  spikeSuccess = results.filter(r => r.success).length;
  
  const spikeDuration = Date.now() - spikeStart;
  log(`   Sent ${spikeRequests} requests in ${spikeDuration}ms`, 'cyan');
  log(`   Rate: ${((spikeRequests / (spikeDuration / 1000)).toFixed(2))} req/s`, 'cyan');
  log(`   Success: ${spikeSuccess}/${spikeRequests}`, spikeSuccess === spikeRequests ? 'green' : 'yellow');

  // Test 6: Response Time Consistency
  log('\n📦 Test 6: Response Time Consistency', 'cyan');
  log('─'.repeat(70), 'dim');
  
  const consistencyResults: number[] = [];
  for (let i = 0; i < 20; i++) {
    const result = await measureRequest('health');
    consistencyResults.push(result.duration);
  }
  
  const avg = consistencyResults.reduce((a, b) => a + b, 0) / consistencyResults.length;
  const variance = consistencyResults.reduce((sum, t) => sum + Math.pow(t - avg, 2), 0) / consistencyResults.length;
  const stdDev = Math.sqrt(variance);
  
  log(`   Average: ${avg.toFixed(2)}ms`, 'cyan');
  log(`   Std Dev: ${stdDev.toFixed(2)}ms`, stdDev < 50 ? 'green' : 'yellow');
  log(`   Min: ${Math.min(...consistencyResults)}ms`, 'dim');
  log(`   Max: ${Math.max(...consistencyResults)}ms`, 'dim');

  // Generate Summary Report
  generateReport(allMetrics);
}

// ========== REPORTING ==========

function printMetrics(metrics: PerformanceMetrics) {
  log(`\n   📊 Results:`, 'cyan');
  log(`   ───────────────────────────────────────`, 'dim');
  log(`   Total Requests:     ${metrics.requests}`, 'dim');
  log(`   Successful:         ${metrics.successful} (${((metrics.successful / metrics.requests) * 100).toFixed(2)}%)`, metrics.failed === 0 ? 'green' : 'yellow');
  log(`   Failed:             ${metrics.failed}`, metrics.failed === 0 ? 'green' : 'red');
  log(`   Avg Response Time:  ${metrics.avgResponseTime.toFixed(2)}ms`, metrics.avgResponseTime < 500 ? 'green' : 'yellow');
  log(`   Min Response Time:  ${metrics.minResponseTime}ms`, 'dim');
  log(`   Max Response Time:  ${metrics.maxResponseTime}ms`, 'dim');
  log(`   95th Percentile:    ${metrics.p95ResponseTime}ms`, metrics.p95ResponseTime < 1000 ? 'green' : 'yellow');
  log(`   99th Percentile:    ${metrics.p99ResponseTime}ms`, metrics.p99ResponseTime < 2000 ? 'green' : 'yellow');
  log(`   Requests/Second:    ${metrics.requestsPerSecond.toFixed(2)}`, 'cyan');
}

function generateReport(allMetrics: PerformanceMetrics[]) {
  log('\n\n' + '═'.repeat(70), 'cyan');
  log('║' + ' '.repeat(25) + '📈 PERFORMANCE REPORT 📈' + ' '.repeat(24) + '║', 'bold');
  log('═'.repeat(70), 'cyan');

  // Overall Statistics
  const totalRequests = allMetrics.reduce((sum, m) => sum + m.requests, 0);
  const totalSuccessful = allMetrics.reduce((sum, m) => sum + m.successful, 0);
  const overallAvgResponse = allMetrics.reduce((sum, m) => sum + m.avgResponseTime, 0) / allMetrics.length;
  const overallSuccessRate = ((totalSuccessful / totalRequests) * 100).toFixed(2);

  log(`\n📊 OVERALL STATISTICS:`, 'yellow');
  log(`   Total Requests Tested:    ${totalRequests}`, 'cyan');
  log(`   Overall Success Rate:     ${overallSuccessRate}%`, parseFloat(overallSuccessRate) > 99 ? 'green' : 'yellow');
  log(`   Average Response Time:    ${overallAvgResponse.toFixed(2)}ms`, overallAvgResponse < 500 ? 'green' : 'yellow');

  // Performance Grades
  log(`\n🎯 PERFORMANCE GRADES:`, 'yellow');
  log(`   ───────────────────────────────────────`, 'dim');

  allMetrics.forEach(m => {
    const successRate = ((m.successful / m.requests) * 100);
    let grade = 'A+';
    if (successRate < 99) grade = 'B';
    if (successRate < 95) grade = 'C';
    if (successRate < 90) grade = 'D';
    if (successRate < 80) grade = 'F';

    const color = grade === 'A+' || grade === 'A' ? 'green' : grade === 'B' ? 'cyan' : 'yellow';
    log(`   ${m.endpoint.padEnd(25)} Grade: ${grade}`, color);
  });

  // Recommendations
  log(`\n💡 RECOMMENDATIONS:`, 'yellow');
  log(`   ───────────────────────────────────────`, 'dim');

  if (overallAvgResponse > 500) {
    log(`   ⚠️  Average response time is high (${overallAvgResponse.toFixed(0)}ms)`, 'yellow');
    log(`      Consider optimizing database queries or adding caching`, 'dim');
  } else {
    log(`   ✅ Response times are excellent`, 'green');
  }

  const slowEndpoints = allMetrics.filter(m => m.p95ResponseTime > 1000);
  if (slowEndpoints.length > 0) {
    log(`   ⚠️  Some endpoints have high P95 latency:`, 'yellow');
    slowEndpoints.forEach(m => {
      log(`      • ${m.endpoint}: ${m.p95ResponseTime}ms (P95)`, 'dim');
    });
  }

  const failedRequests = allMetrics.reduce((sum, m) => sum + m.failed, 0);
  if (failedRequests > 0) {
    log(`   ❌ ${failedRequests} requests failed during load testing`, 'red');
    log(`      Review server logs for errors`, 'dim');
  } else {
    log(`   ✅ No failed requests under load`, 'green');
  }

  // Performance Summary
  log(`\n📋 PERFORMANCE SUMMARY:`, 'yellow');
  log(`   ───────────────────────────────────────`, 'dim');

  if (parseFloat(overallSuccessRate) >= 99 && overallAvgResponse < 500 && failedRequests === 0) {
    log(`   🎉 API performance is EXCELLENT!`, 'bold');
    log(`   Ready for production deployment`, 'green');
  } else if (parseFloat(overallSuccessRate) >= 95 && overallAvgResponse < 1000) {
    log(`   👍 API performance is GOOD`, 'cyan');
    log(`   Minor optimizations recommended`, 'dim');
  } else {
    log(`   ⚠️  API performance needs improvement`, 'yellow');
    log(`   Review recommendations above`, 'dim');
  }

  log('\n' + '═'.repeat(70), 'cyan');
}

// Run tests
runPerformanceTests().catch(error => {
  log(`\n❌ Performance test failed: ${error.message}`, 'red');
  process.exit(1);
});
