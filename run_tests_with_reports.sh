#!/bin/bash

# AI API Test Automation - Advanced Test Runner with Reports
# This script provides comprehensive testing and reporting options

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}🧪 AI API Test Automation - Advanced Test Runner${NC}"
    echo "================================================="
    echo "Using Python: $(python3 --version)"
    echo "Using pytest: $(python3 -m pytest --version | head -1)"
    echo
}

print_usage() {
    echo "Usage: $0 [OPTIONS] [TEST_PATH]"
    echo
    echo "Options:"
    echo "  --quick         Quick run without detailed reports"
    echo "  --coverage      Include coverage analysis"
    echo "  --benchmark     Include performance benchmarks"
    echo "  --allure        Generate Allure reports (requires allure)"
    echo "  --help          Show this help message"
    echo
    echo "Examples:"
    echo "  $0 tests/generated/pdd/ -v"
    echo "  $0 --coverage tests/generated/pdd/"
    echo "  $0 --quick tests/generated/pdd/test_process_payment_post_error_scenarios.py"
}

# Parse command line arguments
QUICK_MODE=false
COVERAGE_MODE=false
BENCHMARK_MODE=false
ALLURE_MODE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --quick)
            QUICK_MODE=true
            shift
            ;;
        --coverage)
            COVERAGE_MODE=true
            shift
            ;;
        --benchmark)
            BENCHMARK_MODE=true
            shift
            ;;
        --allure)
            ALLURE_MODE=true
            shift
            ;;
        --help)
            print_usage
            exit 0
            ;;
        *)
            break
            ;;
    esac
done

print_header

# Create reports directory
mkdir -p reports
mkdir -p reports/coverage
mkdir -p reports/allure-results

# Get current timestamp for report names
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_DIR="reports"

echo -e "${YELLOW}📊 Test Configuration:${NC}"
echo "  Quick Mode: $QUICK_MODE"
echo "  Coverage: $COVERAGE_MODE"
echo "  Benchmarks: $BENCHMARK_MODE"
echo "  Allure Reports: $ALLURE_MODE"
echo

# Build pytest command
PYTEST_CMD="python3 -m pytest"
PYTEST_ARGS="$@"

# Add basic reporting (unless quick mode)
if [ "$QUICK_MODE" = false ]; then
    PYTEST_CMD="$PYTEST_CMD --html=${REPORT_DIR}/test_report_${TIMESTAMP}.html --self-contained-html"
    PYTEST_CMD="$PYTEST_CMD --junitxml=${REPORT_DIR}/junit_report_${TIMESTAMP}.xml"
fi

# Add coverage if requested
if [ "$COVERAGE_MODE" = true ]; then
    echo -e "${BLUE}📈 Including coverage analysis...${NC}"
    PYTEST_CMD="$PYTEST_CMD --cov=src --cov-report=html:${REPORT_DIR}/coverage/coverage_${TIMESTAMP}"
    PYTEST_CMD="$PYTEST_CMD --cov-report=xml:${REPORT_DIR}/coverage/coverage_${TIMESTAMP}.xml"
    PYTEST_CMD="$PYTEST_CMD --cov-report=term"
fi

# Add benchmarks if requested
if [ "$BENCHMARK_MODE" = true ]; then
    echo -e "${BLUE}⚡ Including performance benchmarks...${NC}"
    PYTEST_CMD="$PYTEST_CMD --benchmark-only --benchmark-json=${REPORT_DIR}/benchmark_${TIMESTAMP}.json"
fi

# Add Allure if requested
if [ "$ALLURE_MODE" = true ]; then
    echo -e "${BLUE}🎯 Including Allure reports...${NC}"
    PYTEST_CMD="$PYTEST_CMD --alluredir=${REPORT_DIR}/allure-results"
fi

# Add common options
PYTEST_CMD="$PYTEST_CMD --tb=short --durations=10 -v"

echo -e "${GREEN}🚀 Running tests...${NC}"
echo "Command: $PYTEST_CMD $PYTEST_ARGS"
echo

# Run the tests
if $PYTEST_CMD $PYTEST_ARGS; then
    EXIT_CODE=0
    echo -e "${GREEN}✅ Tests completed successfully!${NC}"
else
    EXIT_CODE=$?
    echo -e "${RED}❌ Some tests failed (exit code: $EXIT_CODE)${NC}"
fi

echo
echo -e "${BLUE}📋 Generated Reports:${NC}"

if [ "$QUICK_MODE" = false ]; then
    echo "  📄 HTML Report: ${REPORT_DIR}/test_report_${TIMESTAMP}.html"
    echo "  📊 JUnit XML:   ${REPORT_DIR}/junit_report_${TIMESTAMP}.xml"
fi

if [ "$COVERAGE_MODE" = true ]; then
    echo "  📈 Coverage HTML: ${REPORT_DIR}/coverage/coverage_${TIMESTAMP}/index.html"
    echo "  📈 Coverage XML:  ${REPORT_DIR}/coverage/coverage_${TIMESTAMP}.xml"
fi

if [ "$BENCHMARK_MODE" = true ]; then
    echo "  ⚡ Benchmark JSON: ${REPORT_DIR}/benchmark_${TIMESTAMP}.json"
fi

if [ "$ALLURE_MODE" = true ]; then
    echo "  🎯 Allure Results: ${REPORT_DIR}/allure-results/"
    echo "     To generate Allure report: allure generate ${REPORT_DIR}/allure-results -o ${REPORT_DIR}/allure-report"
fi

echo
echo -e "${YELLOW}🌐 Quick View Commands:${NC}"
if [ "$QUICK_MODE" = false ]; then
    echo "  open ${REPORT_DIR}/test_report_${TIMESTAMP}.html"
fi
if [ "$COVERAGE_MODE" = true ]; then
    echo "  open ${REPORT_DIR}/coverage/coverage_${TIMESTAMP}/index.html"
fi

exit $EXIT_CODE