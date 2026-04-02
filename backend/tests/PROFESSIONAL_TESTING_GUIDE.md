# 🧪 FarmConnect Professional Testing Guide

## 🎯 Complete Professional Test Suite

This guide provides comprehensive instructions for professional-grade API testing.

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Test Suite Overview](#test-suite-overview)
3. [Running All Tests](#running-all-tests)
4. [Individual Test Suites](#individual-test-suites)
5. [Understanding Results](#understanding-results)
6. [CI/CD Integration](#cicd-integration)

---

## 🚀 Quick Start

### Run Complete Test Suite (Recommended)

```bash
cd backend
./run-all-tests.sh
```

This interactive script will:
- ✅ Check server health
- ✅ Run all test suites
- ✅ Generate comprehensive report
- ✅ Provide pass/fail summary

**Duration:** ~10-15 minutes for full suite

---

## 📊 Test Suite Overview

| Test Suite | Purpose | Tests | Duration | Criticality |
|------------|---------|-------|----------|-------------|
| **E2E Tests** | Business flows | 40+ | 5 min | 🔴 Critical |
| **Edge Cases** | Error handling | 30+ | 3 min | 🔴 Critical |
| **Performance** | Load testing | 6 scenarios | 2 min | 🟡 Important |
| **Security** | Vulnerabilities | 25+ | 2 min | 🔴 Critical |
| **Unit Tests** | Code logic | 25+ | 15 sec | 🟡 Important |

---

## 🎯 Running All Tests

### Option 1: Interactive Runner

```bash
cd backend
./run-all-tests.sh
```

**Features:**
- Choose which tests to run
- Real-time progress tracking
- Automatic report generation
- Color-coded results

### Option 2: Manual Sequential Execution

```bash
cd backend

# 1. E2E Tests
npx tsx tests/professional-e2e-test.ts

# 2. Edge Cases
npx tsx tests/edge-cases-test.ts

# 3. Performance
npx tsx tests/performance-test.ts

# 4. Security
npx tsx tests/security-test.ts

# 5. Unit Tests
npm test
```

---

## 📁 Individual Test Suites

### 1. Professional E2E Tests

**File:** `tests/professional-e2e-test.ts`

**Coverage:**
- ✅ Complete user authentication flows
- ✅ Listing CRUD operations
- ✅ Contract lifecycle management
- ✅ Payment and escrow operations
- ✅ Delivery tracking
- ✅ Notification system
- ✅ Chat functionality
- ✅ Data integrity checks

**Run:**
```bash
npx tsx tests/professional-e2e-test.ts
```

**What it tests:**
1. Infrastructure & Health
2. Authentication & Authorization
3. User Management
4. Farm Listings (Full CRUD)
5. Investment Contracts
6. Wallet & Payments
7. Escrow Management
8. Farm Updates
9. Delivery Tracking
10. Notifications
11. KYC Verification
12. Real-time Chat
13. Error Handling
14. Session Cleanup

---

### 2. Edge Cases & Error Scenarios

**File:** `tests/edge-cases-test.ts`

**Coverage:**
- ✅ Boundary value testing
- ✅ Invalid input handling
- ✅ Type validation
- ✅ Range checking
- ✅ Special characters
- ✅ Unicode support
- ✅ SQL injection prevention
- ✅ XSS prevention

**Run:**
```bash
npx tsx tests/edge-cases-test.ts
```

**Test Categories:**
1. Authentication Edge Cases
   - Invalid phone formats
   - Wrong OTP lengths
   - Non-numeric OTPs

2. Listing Validation
   - Negative/zero values
   - Coordinate ranges
   - String length limits

3. Contract Validation
   - Date validations
   - Amount validations
   - Invalid references

4. Payment Edge Cases
   - Currency validation
   - Amount limits
   - Invalid formats

5. Special Characters
   - SQL injection attempts
   - XSS attempts
   - Unicode handling
   - Emoji support

---

### 3. Performance & Load Tests

**File:** `tests/performance-test.ts`

**Coverage:**
- ✅ Response time measurement
- ✅ Load testing (concurrent requests)
- ✅ Stress testing
- ✅ Endurance testing
- ✅ Spike testing
- ✅ Consistency analysis

**Run:**
```bash
npx tsx tests/performance-test.ts
```

**Metrics Tracked:**
- Average response time
- P95/P99 percentiles
- Requests per second
- Success rate under load
- Memory usage patterns

**Performance Benchmarks:**
- ✅ Excellent: < 200ms avg, > 99% success
- ✅ Good: < 500ms avg, > 95% success
- ⚠️ Acceptable: < 1000ms avg, > 90% success
- ❌ Poor: > 1000ms avg, < 90% success

---

### 4. Security Tests

**File:** `tests/security-test.ts`

**Coverage:**
- ✅ Authentication security
- ✅ Authorization enforcement
- ✅ Input validation
- ✅ SQL injection prevention
- ✅ XSS prevention
- ✅ Path traversal protection
- ✅ Rate limiting
- ✅ CORS configuration
- ✅ Session security

**Run:**
```bash
npx tsx tests/security-test.ts
```

**Security Checks:**
1. JWT Token Validation
2. Rate Limiting Enforcement
3. Protected Endpoint Security
4. SQL Injection Attempts
5. XSS Attack Prevention
6. Path Traversal Blocks
7. Header Security
8. CORS Configuration
9. Data Exposure Prevention
10. Session Management

---

### 5. Unit & Integration Tests

**Command:**
```bash
npm test
```

**Coverage:**
- ✅ Authentication logic
- ✅ Service layer functions
- ✅ Business logic validation
- ✅ Integration flows
- ✅ Utility functions

---

## 📈 Understanding Results

### Test Result Symbols

- ✅ **Green Check** - Test passed
- ❌ **Red X** - Test failed
- ⚠️ **Yellow Warning** - Needs attention
- ℹ️ **Blue Info** - Informational

### Performance Grades

- **A+** - Excellent (< 200ms, 100% success)
- **A** - Very Good (< 300ms, > 99% success)
- **B** - Good (< 500ms, > 95% success)
- **C** - Acceptable (< 1000ms, > 90% success)
- **D** - Needs Improvement (> 1000ms)
- **F** - Failed (< 90% success rate)

### Security Grades

- **A+** - No vulnerabilities found
- **A** - Minor issues (low severity)
- **B** - Some medium severity issues
- **C** - High severity issues found
- **D/F** - Critical vulnerabilities

---

## 🎯 Interpreting Test Results

### All Tests Pass ✅

**Status:** Production Ready

Your API demonstrates:
- ✅ Correct business logic implementation
- ✅ Robust error handling
- ✅ Good performance characteristics
- ✅ Strong security posture

**Next Steps:**
1. Deploy with confidence
2. Set up monitoring
3. Schedule regular test runs

---

### Some Tests Fail ❌

**Review Error Messages:**

**E2E Failures:**
- Check database connectivity
- Verify seeded data exists
- Review business logic implementation

**Edge Case Failures:**
- Add missing input validation
- Improve error handling
- Check type conversions

**Performance Issues:**
- Profile slow endpoints
- Optimize database queries
- Consider caching strategies

**Security Issues:**
- **HIGH priority:** Fix immediately
- **MEDIUM priority:** Fix before deployment
- **LOW priority:** Address in next sprint

---

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: API Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Setup database
        run: |
          npm run db:generate
          npm run db:push
      
      - name: Start server
        run: npm run dev &
        env:
          PORT: 3000
      
      - name: Wait for server
        run: sleep 10
      
      - name: Run E2E Tests
        run: npx tsx tests/professional-e2e-test.ts
      
      - name: Run Edge Cases
        run: npx tsx tests/edge-cases-test.ts
      
      - name: Run Security Tests
        run: npx tsx tests/security-test.ts
      
      - name: Run Unit Tests
        run: npm test
```

---

## 📊 Report Generation

### Automatic Reports

The test runner generates markdown reports saved as:
```
test-report-YYYYMMDD-HHMMSS.md
```

**Report includes:**
- Executive summary
- Test results by category
- Performance metrics
- Security findings
- Recommendations

### Manual Report Review

Reports are saved in the backend directory:
```bash
ls test-report-*.md
cat test-report-20260403-120000.md
```

---

## 🎓 Best Practices

### Before Deployment

Run complete test suite:
```bash
./run-all-tests.sh
# Choose option 1 (All Tests)
```

**Required Results:**
- ✅ All E2E tests pass
- ✅ All edge cases handled
- ✅ Security grade A or better
- ✅ Performance grade B or better

### During Development

Run relevant tests frequently:
```bash
# After code changes
npm test  # Unit tests

# Before commit
npx tsx tests/edge-cases-test.ts

# Before push
npx tsx tests/professional-e2e-test.ts
```

### Production Monitoring

Schedule regular test runs:
- **Daily:** Unit tests
- **Weekly:** E2E + Edge cases
- **Monthly:** Full suite including performance & security

---

## 🐛 Troubleshooting

### Server Connection Issues

```bash
# Check if server is running
curl http://localhost:3000/health

# Restart server
npm run dev
```

### Database Issues

```bash
# Regenerate Prisma client
npm run db:generate

# Reset database
npm run db:push -- --force-reset

# Re-seed data
npm run db:seed
```

### Test Hangs

```bash
# Increase timeout
NODE_OPTIONS='--max-old-space-size=4096' npx tsx tests/professional-e2e-test.ts

# Or kill hanging process
pkill -f tsx
```

---

## 📚 Additional Resources

| Resource | Location |
|----------|----------|
| API Documentation | `API_DOCUMENTATION.md` |
| Main README | `../../README.md` |
| Test Examples | `tests/*.ts` |
| Postman Collection | `tests/FarmConnect-API.postman_collection.json` |

---

## 🎉 Success Criteria

### Production Ready Checklist

- [ ] All E2E tests pass (100%)
- [ ] All edge cases handled correctly
- [ ] Performance grade B or better
- [ ] Security grade A or better
- [ ] No HIGH severity security issues
- [ ] Unit tests passing
- [ ] Database operations verified
- [ ] Error messages are clear
- [ ] Rate limiting active
- [ ] Authentication working correctly

**If all above pass → READY FOR DEPLOYMENT!** 🚀

---

**Questions?** Check individual test files for detailed comments or review server logs for error details.
