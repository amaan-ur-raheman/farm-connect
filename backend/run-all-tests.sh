#!/bin/bash

# FarmConnect Backend - Complete Professional Test Suite Runner
# Runs all tests and generates comprehensive report
# Run with: ./run-all-tests.sh

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Report file
REPORT_FILE="test-report-$(date +%Y%m%d-%H%M%S).md"
EXECUTED_TESTS=()
PASSED_TESTS=0
FAILED_TESTS=0

log() {
    echo -e "${CYAN}[$(date '+%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# Initialize report
init_report() {
    cat > "$REPORT_FILE" << EOF
# 🧪 FarmConnect Backend - Professional Test Report

**Generated:** $(date)

---

## Executive Summary

This report contains the results of comprehensive professional testing including:
- End-to-End Business Flow Tests
- Edge Cases & Error Scenarios
- Performance & Load Tests
- Security Vulnerability Tests

---

EOF
}

add_to_report() {
    echo "$1" >> "$REPORT_FILE"
}

# Check server health
check_server() {
    section "Checking Server Health"
    
    if curl -s http://localhost:3000/health > /dev/null 2>&1; then
        success "Backend server is running on port 3000"
        log "Health check passed"
    else
        error "Backend server is NOT running!"
        echo ""
        echo "Please start the server first:"
        echo "  cd backend"
        echo "  npm run dev"
        echo ""
        exit 1
    fi
}

# Run E2E Tests
run_e2e_tests() {
    section "Running Professional E2E Tests"
    log "Testing complete business flows..."
    
    if npx tsx tests/professional-e2e-test.ts 2>&1 | tee /tmp/e2e-output.txt; then
        success "E2E Tests PASSED"
        EXECUTED_TESTS+=("E2E Tests")
        ((PASSED_TESTS++))
        add_to_report "## ✅ E2E Tests - PASSED\n\n"
    else
        error "E2E Tests FAILED"
        EXECUTED_TESTS+=("E2E Tests")
        ((FAILED_TESTS++))
        add_to_report "## ❌ E2E Tests - FAILED\n\nSee /tmp/e2e-output.txt for details\n\n"
    fi
}

# Run Edge Case Tests
run_edge_tests() {
    section "Running Edge Case & Error Scenario Tests"
    log "Testing boundary conditions and error handling..."
    
    if npx tsx tests/edge-cases-test.ts 2>&1 | tee /tmp/edge-output.txt; then
        success "Edge Case Tests PASSED"
        EXECUTED_TESTS+=("Edge Case Tests")
        ((PASSED_TESTS++))
        add_to_report "## ✅ Edge Case Tests - PASSED\n\n"
    else
        error "Edge Case Tests FAILED"
        EXECUTED_TESTS+=("Edge Case Tests")
        ((FAILED_TESTS++))
        add_to_report "## ❌ Edge Case Tests - FAILED\n\nSee /tmp/edge-output.txt for details\n\n"
    fi
}

# Run Performance Tests
run_performance_tests() {
    section "Running Performance & Load Tests"
    log "Testing API performance under load..."
    
    if npx tsx tests/performance-test.ts 2>&1 | tee /tmp/perf-output.txt; then
        success "Performance Tests PASSED"
        EXECUTED_TESTS+=("Performance Tests")
        ((PASSED_TESTS++))
        add_to_report "## ✅ Performance Tests - PASSED\n\n"
    else
        warn "Performance Tests had issues"
        EXECUTED_TESTS+=("Performance Tests")
        ((FAILED_TESTS++))
        add_to_report "## ⚠️ Performance Tests - NEEDS ATTENTION\n\nSee /tmp/perf-output.txt for details\n\n"
    fi
}

# Run Security Tests
run_security_tests() {
    section "Running Security Tests"
    log "Testing for vulnerabilities and security issues..."
    
    if npx tsx tests/security-test.ts 2>&1 | tee /tmp/security-output.txt; then
        success "Security Tests PASSED"
        EXECUTED_TESTS+=("Security Tests")
        ((PASSED_TESTS++))
        add_to_report "## ✅ Security Tests - PASSED\n\n"
    else
        error "Security Tests FAILED"
        EXECUTED_TESTS+=("Security Tests")
        ((FAILED_TESTS++))
        add_to_report "## ❌ Security Tests - FAILED\n\nSee /tmp/security-output.txt for details\n\n"
    fi
}

# Run Unit Tests
run_unit_tests() {
    section "Running Unit & Integration Tests"
    log "Running Vitest suite..."
    
    if npm test 2>&1 | tee /tmp/unit-output.txt; then
        success "Unit Tests PASSED"
        EXECUTED_TESTS+=("Unit Tests")
        ((PASSED_TESTS++))
        add_to_report "## ✅ Unit Tests - PASSED\n\n"
    else
        warn "Unit Tests had failures"
        EXECUTED_TESTS+=("Unit Tests")
        ((FAILED_TESTS++))
        add_to_report "## ⚠️ Unit Tests - NEEDS ATTENTION\n\nSee /tmp/unit-output.txt for details\n\n"
    fi
}

# Generate final summary
generate_summary() {
    section "Test Summary"
    
    echo ""
    echo -e "${CYAN}══════════════════════════════════════════${NC}"
    echo -e "${CYAN}           TEST EXECUTION SUMMARY${NC}"
    echo -e "${CYAN}══════════════════════════════════════════${NC}"
    echo ""
    echo "Tests Executed: ${#EXECUTED_TESTS[@]}"
    echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
    echo -e "${RED}Failed: $FAILED_TESTS${NC}"
    echo ""
    
    local TOTAL=$((${#EXECUTED_TESTS[@]}))
    local SUCCESS_RATE=$(( (PASSED_TESTS * 100) / TOTAL ))
    
    echo "Success Rate: ${SUCCESS_RATE}%"
    echo ""
    
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
        echo ""
        echo "Your API is production-ready!"
        echo ""
        echo -e "${CYAN}══════════════════════════════════════════${NC}"
    else
        echo -e "${YELLOW}⚠️  Some tests failed${NC}"
        echo ""
        echo "Review the detailed outputs above"
        echo "Check generated report: $REPORT_FILE"
        echo ""
        echo -e "${CYAN}══════════════════════════════════════════${NC}"
    fi
    
    # Add to report
    add_to_report "---

## Summary

| Metric | Value |
|--------|-------|
| **Tests Executed** | ${#EXECUTED_TESTS[@]} |
| **Passed** | $PASSED_TESTS |
| **Failed** | $FAILED_TESTS |
| **Success Rate** | ${SUCCESS_RATE}% |

## Conclusion

$(if [ $FAILED_TESTS -eq 0 ]; then echo "✅ All professional tests passed. The API is production-ready."
else echo "⚠️ Some tests require attention before deployment."; fi)

---

*Report generated by FarmConnect Test Suite*
"
    
    echo ""
    echo "📄 Detailed report saved to: ${CYAN}$REPORT_FILE${NC}"
    echo ""
}

# Main execution
main() {
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                                            ║${NC}"
    echo -e "${CYAN}║   FarmConnect Professional Test Suite      ║${NC}"
    echo -e "${CYAN}║   Comprehensive API Testing                ║${NC}"
    echo -e "${CYAN}║                                            ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════╝${NC}"
    echo ""
    
    init_report
    check_server
    
    # Ask user which tests to run
    echo ""
    echo "Select tests to run:"
    echo "  1) All Tests (Recommended)"
    echo "  2) E2E Tests Only"
    echo "  3) Edge Cases Only"
    echo "  4) Performance Tests Only"
    echo "  5) Security Tests Only"
    echo "  6) Unit Tests Only"
    echo "  7) Quick Suite (E2E + Edge Cases)"
    echo ""
    read -p "Enter choice [1-7]: " choice
    
    case $choice in
        1)
            run_e2e_tests
            run_edge_tests
            run_performance_tests
            run_security_tests
            run_unit_tests
            ;;
        2)
            run_e2e_tests
            ;;
        3)
            run_edge_tests
            ;;
        4)
            run_performance_tests
            ;;
        5)
            run_security_tests
            ;;
        6)
            run_unit_tests
            ;;
        7)
            run_e2e_tests
            run_edge_tests
            ;;
        *)
            error "Invalid choice"
            exit 1
            ;;
    esac
    
    generate_summary
}

# Run main function
main
