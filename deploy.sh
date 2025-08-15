#!/bin/bash

# NexusOne GeoCore Deployment Script

set -e

echo "🚀 NexusOne GeoCore Deployment"
echo "================================"

# Get server IP
SERVER_IP=$(hostname -I | awk '{print $1}')
echo "📍 Server IP: $SERVER_IP"

# Load environment variables if .env exists
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check for required environment variables
if [ -z "$MAPTILER_KEY" ]; then
    echo "✅ Using MapTiler key from .env file"
fi

# Build mode
MODE=${1:-production}

echo "📦 Building in $MODE mode..."

# Update API URLs with actual IP
export NEXT_PUBLIC_API_URL="http://${SERVER_IP}:3001"
export NEXT_PUBLIC_WS_URL="ws://${SERVER_IP}:3001"

# Install dependencies
echo "📥 Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo "📥 Installing API dependencies..."
cd api
npm install
cd ..

if [ "$MODE" = "development" ]; then
    echo "🔧 Starting development servers..."
    
    # Start API server
    cd api
    HOST=0.0.0.0 npm run dev &
    API_PID=$!
    cd ..
    
    # Start frontend
    cd frontend
    npm run dev &
    FRONTEND_PID=$!
    cd ..
    
    echo "✅ Development servers started!"
    echo ""
    echo "Access the application at:"
    echo "   📱 Frontend: http://${SERVER_IP}:3000"
    echo "   🔌 API: http://${SERVER_IP}:3001"
    echo ""
    echo "Or from this machine:"
    echo "   Frontend: http://0.0.0.0:3000"
    echo "   API: http://0.0.0.0:3001"
    echo ""
    echo "Press Ctrl+C to stop..."
    
    # Wait for interrupt
    trap "kill $API_PID $FRONTEND_PID" INT
    wait
    
else
    echo "🐳 Building Docker containers..."
    
    # Export environment for Docker
    export API_URL="http://${SERVER_IP}:3001"
    export WS_URL="ws://${SERVER_IP}:3001"
    
    # Build containers
    docker-compose build
    
    echo "🚀 Starting production services..."
    
    # Start services
    docker-compose up -d
    
    echo "✅ Deployment complete!"
    echo ""
    echo "Services running at:"
    echo "   📱 Frontend: http://${SERVER_IP}:3000"
    echo "   🔌 API: http://${SERVER_IP}:3001"
    echo "   🌐 Nginx Proxy: http://${SERVER_IP}:80"
    echo ""
    echo "Or access from any device on your network using:"
    echo "   http://${SERVER_IP}:3000"
    echo ""
    echo "To view logs: docker-compose logs -f"
    echo "To stop: docker-compose down"
fi