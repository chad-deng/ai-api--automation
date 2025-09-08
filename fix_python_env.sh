#!/bin/bash

# Fix Python Environment Script
# This script helps diagnose and fix Python environment issues

echo "🔧 Python Environment Diagnostic & Fix Script"
echo "=============================================="

echo "📋 Current Python environments:"
echo "which python3: $(which python3)"
echo "which pytest: $(which pytest)"
echo "which pip3: $(which pip3)"
echo

echo "📍 All Python installations found:"
which -a python3
echo

echo "📍 All pytest installations found:"
which -a pytest
echo

echo "📦 Current pytest version:"
pytest --version 2>/dev/null || echo "pytest not found or has issues"
echo

echo "🔍 Checking pytest-asyncio installation:"
python3 -c "import pytest_asyncio; print('✅ pytest-asyncio found')" 2>/dev/null || echo "❌ pytest-asyncio not found"
echo

echo "💡 Recommended solutions:"
echo "1. Always use: python3 -m pytest (most reliable)"
echo "2. Or add to your ~/.zshrc:"
echo "   export PATH=\"/Library/Frameworks/Python.framework/Versions/3.13/bin:\$PATH\""
echo "3. Use the project's ./run_tests.sh script"
echo

echo "🎯 Testing current setup:"
echo "Running a simple pytest command..."
python3 -m pytest --version