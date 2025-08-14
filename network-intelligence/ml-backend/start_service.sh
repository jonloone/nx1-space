#!/bin/bash

# Network Intelligence ML Backend Startup Script

set -e

# Configuration
SERVICE_NAME="Network Intelligence ML Backend"
PYTHON_VERSION="python3"
VENV_NAME="venv"
SERVICE_PORT=8000
SERVICE_HOST="0.0.0.0"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if Python is available
check_python() {
    log "Checking Python installation..."
    
    if command -v $PYTHON_VERSION &> /dev/null; then
        PYTHON_PATH=$(which $PYTHON_VERSION)
        PYTHON_VER=$($PYTHON_VERSION --version 2>&1)
        success "Found $PYTHON_VER at $PYTHON_PATH"
        return 0
    else
        error "Python 3 not found. Please install Python 3.8 or higher."
        return 1
    fi
}

# Setup virtual environment
setup_venv() {
    log "Setting up Python virtual environment..."
    
    if [ ! -d "$VENV_NAME" ]; then
        log "Creating virtual environment..."
        $PYTHON_VERSION -m venv $VENV_NAME
        success "Virtual environment created"
    else
        log "Virtual environment already exists"
    fi
    
    # Activate virtual environment
    source $VENV_NAME/bin/activate
    
    # Upgrade pip
    log "Upgrading pip..."
    pip install --upgrade pip
    
    success "Virtual environment ready"
}

# Install dependencies
install_dependencies() {
    log "Installing Python dependencies..."
    
    if [ ! -f "requirements.txt" ]; then
        error "requirements.txt not found"
        return 1
    fi
    
    pip install -r requirements.txt
    success "Dependencies installed"
}

# Check if service is already running
check_service_running() {
    if curl -s "http://localhost:$SERVICE_PORT/health" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Start the ML service
start_service() {
    log "Starting $SERVICE_NAME..."
    
    # Check if already running
    if check_service_running; then
        warning "Service is already running on port $SERVICE_PORT"
        log "Use 'pkill -f uvicorn' to stop the existing service first"
        return 1
    fi
    
    # Ensure we're in the right directory
    cd "$(dirname "$0")"
    
    # Create models directory if it doesn't exist
    mkdir -p models
    
    # Start the service
    log "Starting FastAPI service on $SERVICE_HOST:$SERVICE_PORT..."
    echo
    
    if [ "$1" = "--dev" ]; then
        # Development mode with auto-reload
        python main.py
    else
        # Production mode
        uvicorn main:app --host $SERVICE_HOST --port $SERVICE_PORT --workers 1
    fi
}

# Main execution
main() {
    echo "🚀 $SERVICE_NAME Startup Script"
    echo "================================================="
    
    # Change to script directory
    cd "$(dirname "$0")"
    
    # Check Python
    if ! check_python; then
        exit 1
    fi
    
    # Setup virtual environment
    if ! setup_venv; then
        error "Failed to setup virtual environment"
        exit 1
    fi
    
    # Install dependencies
    if ! install_dependencies; then
        error "Failed to install dependencies"
        exit 1
    fi
    
    # Start service
    start_service "$1"
}

# Handle script arguments
case "$1" in
    --help|-h)
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --dev       Run in development mode with auto-reload"
        echo "  --help, -h  Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0          # Start in production mode"
        echo "  $0 --dev    # Start in development mode"
        exit 0
        ;;
    --dev)
        main --dev
        ;;
    *)
        main
        ;;
esac