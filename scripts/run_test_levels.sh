#!/bin/bash

# Test Level Classification Runner
# Usage: ./scripts/run_test_levels.sh [smoke|integration|load|all]

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Default to smoke tests if no argument provided
TEST_LEVEL=${1:-smoke}

echo -e "${BLUE}🚀 Running ${TEST_LEVEL} tests...${NC}"

case $TEST_LEVEL in
    "smoke")
        echo -e "${GREEN}Running SMOKE tests - Fast critical path validation${NC}"
        echo "⚡ Expected duration: 2-5 minutes"
        python3 -m pytest \
            -m "smoke" \
            --tb=short \
            -v \
            --html=reports/smoke_report.html \
            --self-contained-html \
            --junit-xml=reports/smoke_junit.xml
        ;;
    
    "integration") 
        echo -e "${YELLOW}Running INTEGRATION tests - Real service dependencies${NC}"
        echo "🔗 Expected duration: 10-30 minutes"
        echo "⚠️  Requires live API endpoints"
        python3 -m pytest \
            -m "integration" \
            --tb=short \
            -v \
            --html=reports/integration_report.html \
            --self-contained-html \
            --junit-xml=reports/integration_junit.xml
        ;;
    
    "load")
        echo -e "${RED}Running LOAD tests - Performance and concurrency${NC}"
        echo "🏋️  Expected duration: 30+ minutes" 
        echo "⚠️  High resource usage - may impact system performance"
        python3 -m pytest \
            -m "load or concurrency" \
            --tb=short \
            -v \
            --html=reports/load_report.html \
            --self-contained-html \
            --junit-xml=reports/load_junit.xml \
            --durations=20
        ;;
    
    "all")
        echo -e "${BLUE}Running ALL test levels in sequence${NC}"
        echo "🎯 Complete test suite execution"
        
        echo -e "\n${GREEN}Phase 1: Smoke Tests${NC}"
        $0 smoke
        
        echo -e "\n${YELLOW}Phase 2: Integration Tests${NC}"  
        $0 integration
        
        echo -e "\n${RED}Phase 3: Load Tests${NC}"
        $0 load
        
        echo -e "\n${GREEN}✅ All test levels completed successfully!${NC}"
        ;;
    
    "quick")
        echo -e "${GREEN}Running QUICK validation - Smoke + Critical${NC}"
        echo "⚡ Fast validation for CI/CD pipelines"
        python3 -m pytest \
            -m "smoke or critical" \
            --tb=line \
            -x \
            --html=reports/quick_report.html \
            --self-contained-html
        ;;
    
    *)
        echo -e "${RED}❌ Unknown test level: $TEST_LEVEL${NC}"
        echo "Available options:"
        echo "  smoke       - Fast critical path tests (2-5 min)"
        echo "  integration - Real API dependency tests (10-30 min)" 
        echo "  load        - Performance/concurrency tests (30+ min)"
        echo "  quick       - Smoke + critical tests for CI/CD"
        echo "  all         - Run all levels in sequence"
        exit 1
        ;;
esac

echo -e "${GREEN}✅ ${TEST_LEVEL} tests completed${NC}"
echo -e "📊 Reports available in: reports/"