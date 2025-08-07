#!/bin/bash

# Ground Station Intelligence - Kepler.gl Setup Script

echo "🚀 Setting up Ground Station Intelligence Kepler.gl POC"
echo "=================================================="

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 14+ first."
    exit 1
fi

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.7+ first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install npm dependencies
echo "📦 Installing npm dependencies..."
npm install

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo "🔧 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please edit .env and add your Mapbox token (optional)"
fi

# Transform data
echo "🔄 Transforming ground station data..."
python3 data_transformer.py

# Copy transformed data to src
if [ ! -d "src/data" ]; then
    mkdir -p src/data
fi

if [ -f "kepler_ground_stations.json" ]; then
    cp kepler_ground_stations.json src/data/
    echo "✅ Data copied to src/data/"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env if you want to add a custom Mapbox token"
echo "2. Run 'npm start' to launch the development server"
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "🎯 Ready to visualize ground station intelligence!"