#!/bin/bash

# Setup Virtual Environment for AI API Test Automation
echo "🐍 Setting up Python virtual environment..."

# Use Python.org version (which has our dependencies)
PYTHON_PATH="/Library/Frameworks/Python.framework/Versions/3.13/bin/python3"

if [ ! -f "$PYTHON_PATH" ]; then
    echo "❌ Python 3.13 not found at expected location"
    echo "Using system python3..."
    PYTHON_PATH="python3"
fi

# Create virtual environment
echo "📦 Creating virtual environment..."
$PYTHON_PATH -m venv .venv

# Activate virtual environment
echo "⚡ Activating virtual environment..."
source .venv/bin/activate

# Upgrade pip
echo "⬆️ Upgrading pip..."
pip install --upgrade pip

# Install requirements
echo "📚 Installing requirements..."
pip install -r requirements.txt

echo "✅ Virtual environment setup complete!"
echo ""
echo "To activate in the future, run:"
echo "  source .venv/bin/activate"
echo ""
echo "To run tests:"
echo "  pytest tests/generated/pdd/ -v"