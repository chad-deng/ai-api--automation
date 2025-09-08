#!/bin/bash

# Test Report Viewer
echo "📊 Available Test Reports:"
echo "========================="

if [ ! -d "reports" ]; then
    echo "❌ No reports directory found. Run tests first."
    exit 1
fi

# List HTML reports
echo "🌐 HTML Reports:"
ls -lt reports/*.html 2>/dev/null | head -5 | while read line; do
    filename=$(echo $line | awk '{print $9}')
    if [ -n "$filename" ]; then
        echo "  $(basename $filename)"
    fi
done

echo

# List XML reports  
echo "📄 XML Reports:"
ls -lt reports/*.xml 2>/dev/null | head -5 | while read line; do
    filename=$(echo $line | awk '{print $9}')
    if [ -n "$filename" ]; then
        echo "  $(basename $filename)"
    fi
done

echo

# Get latest HTML report
LATEST_HTML=$(ls -t reports/*.html 2>/dev/null | head -1)

if [ -n "$LATEST_HTML" ]; then
    echo "🚀 Opening latest HTML report..."
    echo "  File: $(basename $LATEST_HTML)"
    open "$LATEST_HTML"
else
    echo "❌ No HTML reports found. Run tests with reporting enabled first:"
    echo "  ./run_tests.sh tests/generated/pdd/ -v"
fi