#!/bin/bash

# Advanced Face Recognition System - Setup Script
# Defense Forces Edition

echo "🔒 Advanced Face Recognition System - Defense Forces Edition"
echo "=========================================================="
echo ""

# Check if Python 3 is available
if command -v python3 &> /dev/null; then
    echo "✅ Python 3 found. Starting local server..."
    echo "🌐 Opening http://localhost:8000 in your browser..."
    echo ""
    echo "📋 Instructions:"
    echo "   1. The website will open automatically in your browser"
    echo "   2. Click 'Start Analysis' to begin the demonstration"
    echo "   3. Watch the real-time progress and results"
    echo "   4. Press Ctrl+C to stop the server when done"
    echo ""
    echo "🚀 Starting server..."
    
    # Open browser automatically (macOS)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open http://localhost:8000 &
    # Linux
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        xdg-open http://localhost:8000 &
    # Windows (Git Bash)
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        start http://localhost:8000 &
    fi
    
    # Start Python server
    python3 -m http.server 8000
    
elif command -v python &> /dev/null; then
    echo "✅ Python found. Starting local server..."
    echo "🌐 Opening http://localhost:8000 in your browser..."
    echo ""
    echo "📋 Instructions:"
    echo "   1. The website will open automatically in your browser"
    echo "   2. Click 'Start Analysis' to begin the demonstration"
    echo "   3. Watch the real-time progress and results"
    echo "   4. Press Ctrl+C to stop the server when done"
    echo ""
    echo "🚀 Starting server..."
    
    # Open browser automatically (macOS)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open http://localhost:8000 &
    # Linux
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        xdg-open http://localhost:8000 &
    # Windows (Git Bash)
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        start http://localhost:8000 &
    fi
    
    # Start Python server
    python -m http.server 8000
    
else
    echo "❌ Python not found. Please install Python 3 or use one of these alternatives:"
    echo ""
    echo "🔧 Alternative 1: Open index.html directly in your browser"
    echo "   - Double-click index.html file"
    echo "   - Or drag and drop into your browser"
    echo ""
    echo "🔧 Alternative 2: Install Python 3"
    echo "   - Visit: https://www.python.org/downloads/"
    echo "   - Download and install Python 3"
    echo "   - Run this script again"
    echo ""
    echo "🔧 Alternative 3: Use Node.js (if installed)"
    if command -v node &> /dev/null; then
        echo "   - Run: npx http-server"
        echo "   - Open the provided URL in your browser"
    else
        echo "   - Install Node.js from: https://nodejs.org/"
    fi
    echo ""
    echo "📖 For detailed instructions, see README.md"
fi
