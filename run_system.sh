#!/bin/bash

# Advanced Face Recognition System - Integrated Python Backend
# Defense Forces Edition

echo "🔒 Advanced Face Recognition System - Defense Forces Edition"
echo "=========================================================="
echo ""

# Check if Python 3 is available
if command -v python3 &> /dev/null; then
    echo "✅ Python 3 found. Checking dependencies..."
    
    # Check if virtual environment exists
    if [ ! -d "venv" ]; then
        echo "📦 Creating virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    echo "🔧 Activating virtual environment..."
    source venv/bin/activate
    
    # Install/upgrade pip
    echo "📥 Upgrading pip..."
    pip install --upgrade pip
    
    # Install requirements
    echo "📦 Installing Python dependencies..."
    pip install -r requirements.txt
    
    echo ""
    echo "🚀 Starting Face Recognition System..."
    echo "🌐 The system will open in your browser at http://localhost:5000"
    echo ""
    echo "📋 Features:"
    echo "   • Real face detection using your accurate faced.py logic"
    echo "   • Professional web interface for defense forces"
    echo "   • Live visual feedback with bounding boxes"
    echo "   • Real-time recognition results"
    echo ""
    echo "🎯 Press Ctrl+C to stop the system when done"
    echo ""
    echo "=" * 60
    
    # Start the Flask backend
    python3 app.py
    
elif command -v python &> /dev/null; then
    echo "✅ Python found. Checking dependencies..."
    
    # Check if virtual environment exists
    if [ ! -d "venv" ]; then
        echo "📦 Creating virtual environment..."
        python -m venv venv
    fi
    
    # Activate virtual environment
    echo "🔧 Activating virtual environment..."
    source venv/bin/activate
    
    # Install/upgrade pip
    echo "📥 Upgrading pip..."
    pip install --upgrade pip
    
    # Install requirements
    echo "📦 Installing Python dependencies..."
    pip install -r requirements.txt
    
    echo ""
    echo "🚀 Starting Face Recognition System..."
    echo "🌐 The system will open in your browser at http://localhost:5000"
    echo ""
    echo "📋 Features:"
    echo "   • Real face detection using your accurate faced.py logic"
    echo "   • Professional web interface for defense forces"
    echo "   • Live visual feedback with bounding boxes"
    echo "   • Real-time recognition results"
    echo ""
    echo "🎯 Press Ctrl+C to stop the system when done"
    echo ""
    echo "=" * 60
    
    # Start the Flask backend
    python app.py
    
else
    echo "❌ Python not found. Please install Python 3 or use one of these alternatives:"
    echo ""
    echo "🔧 Alternative 1: Install Python 3"
    echo "   - Visit: https://www.python.org/downloads/"
    echo "   - Download and install Python 3"
    echo "   - Run this script again"
    echo ""
    echo "🔧 Alternative 2: Use the HTML-only version"
    echo "   - Run: ./setup.sh"
    echo "   - This will use the simulated version"
    echo ""
    echo "📖 For detailed instructions, see README.md"
fi
