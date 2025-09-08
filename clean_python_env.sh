#!/bin/bash

# Clean Python Environment Script
echo "🧹 Python Environment Cleanup Script"
echo "====================================="

echo "⚠️  This script will help identify conflicting Python installations"
echo "⚠️  Review each step before proceeding"
echo

# Show current state
echo "📋 Current environment analysis:"
echo "PATH: $PATH"
echo
echo "Python installations:"
ls -la /usr/bin/python* 2>/dev/null
ls -la /usr/local/bin/python* 2>/dev/null  
ls -la /opt/homebrew/bin/python* 2>/dev/null
ls -la /Library/Frameworks/Python.framework/Versions/*/bin/python* 2>/dev/null
echo

echo "Pytest installations:"
find /usr -name pytest 2>/dev/null
find /opt -name pytest 2>/dev/null
find /Library -name pytest 2>/dev/null
echo

echo "💡 Recommendations:"
echo "1. Choose ONE primary Python installation"
echo "2. Uninstall conflicting versions (carefully!)"
echo "3. Use virtual environments for projects"
echo "4. Set PATH priority in ~/.zshrc"

echo
echo "🎯 For this project, the quick fix is already working:"
echo "   export PATH=\"/Library/Frameworks/Python.framework/Versions/3.13/bin:\$PATH\""