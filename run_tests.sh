#!/bin/bash

# AI API Test Automation - Test Runner
# This script ensures we use the correct Python environment with pytest-asyncio

echo "🧪 Running AI API Test Automation tests..."
echo "Using Python: $(python3 --version)"
echo "Using pytest from Python modules"
echo

# Create reports directory
mkdir -p reports

# Get current timestamp for report names
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Run tests with multiple report formats
echo "📊 Generating test reports..."
python3 -m pytest "$@" \
    --html=reports/test_report_${TIMESTAMP}.html \
    --self-contained-html \
    --junitxml=reports/junit_report_${TIMESTAMP}.xml \
    --tb=short \
    --durations=10

echo
echo "📋 Test Reports Generated:"
echo "  HTML Report: reports/test_report_${TIMESTAMP}.html"
echo "  JUnit XML:   reports/junit_report_${TIMESTAMP}.xml"

# Generate summary report
echo "📊 Generating summary report..."
python3 generate_summary_report.py

echo
echo "📂 View Reports:"
echo "  Detailed HTML: open reports/test_report_${TIMESTAMP}.html"
echo "  Summary Report: open reports/latest_summary.html"
echo
echo "🚀 Quick view: ./view_reports.sh"