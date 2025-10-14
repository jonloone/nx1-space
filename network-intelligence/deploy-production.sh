#!/bin/bash
# Production deployment script for Network Intelligence (Mundi OpIntel Platform)

set -e

echo "🚀 Deploying Network Intelligence to nexusone.earth"
echo "====================================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running on the server
echo -e "${YELLOW}Checking server configuration...${NC}"

# Check if .env exists
if [ ! -f .env.production ]; then
    echo -e "${YELLOW}Creating .env.production...${NC}"
    echo "ACME_EMAIL=admin@nexusone.earth" > .env.production
    echo -e "${RED}⚠️  IMPORTANT: Edit .env.production and update ACME_EMAIL!${NC}"
    echo -e "${YELLOW}Run: nano .env.production${NC}"
    exit 1
fi

# Verify Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running!${NC}"
    exit 1
fi

# Load environment variables
export $(cat .env.production | xargs)

# Verify email is set
if [[ "$ACME_EMAIL" == "admin@nexusone.earth" ]] || [[ -z "$ACME_EMAIL" ]]; then
    echo -e "${RED}❌ Please update ACME_EMAIL in .env.production file!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Configuration validated${NC}"
echo ""
echo "Configuration:"
echo "  Domain: www.nexusone.earth"
echo "  Email: $ACME_EMAIL"
echo ""

# Ask for confirmation
read -p "Deploy to production? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

# Stop any existing deployment
echo -e "${YELLOW}Stopping existing services...${NC}"
docker compose -f docker-compose.prod.yml down 2>/dev/null || true

# Stop old kepler-poc if running
cd ../kepler-poc && docker compose -f docker-compose.prod.yml down 2>/dev/null || true
cd ../network-intelligence

# Create necessary directories
echo -e "${YELLOW}Creating directories...${NC}"
mkdir -p traefik

# Create traefik middleware configuration
echo -e "${YELLOW}Creating Traefik middleware configuration...${NC}"
cat > traefik/middlewares.yml << 'EOF'
http:
  middlewares:
    security-headers:
      headers:
        customResponseHeaders:
          X-Frame-Options: "SAMEORIGIN"
          X-Content-Type-Options: "nosniff"
          X-XSS-Protection: "1; mode=block"
          Referrer-Policy: "strict-origin-when-cross-origin"
    compression:
      compress: {}
EOF

# Build the application
echo -e "${YELLOW}Building Next.js application...${NC}"
docker compose -f docker-compose.prod.yml build --no-cache

# Start services
echo -e "${YELLOW}Starting services...${NC}"
docker compose -f docker-compose.prod.yml up -d

# Wait for services to start
echo -e "${YELLOW}Waiting for services to start...${NC}"
sleep 15

# Check service status
echo ""
echo -e "${GREEN}Service Status:${NC}"
docker compose -f docker-compose.prod.yml ps

# Check application health
echo ""
echo -e "${YELLOW}Checking application health...${NC}"
sleep 5
docker compose -f docker-compose.prod.yml logs network-intelligence | tail -20

echo ""
echo -e "${GREEN}====================================================="
echo "✅ Deployment Complete!"
echo "=====================================================${NC}"
echo ""
echo "Access your application:"
echo "  🌐 Main App: https://www.nexusone.earth"
echo "  🌐 Alternative: https://nexusone.earth"
echo "  🌐 Operations: https://nexusone.earth/operations"
echo "  🚚 Fleet Demo: https://nexusone.earth/fleet-demo"
echo ""
echo "View logs:"
echo "  docker compose -f docker-compose.prod.yml logs -f network-intelligence"
echo ""
echo "Note: SSL certificate acquisition may take 1-2 minutes."
echo "The app will redirect to /operations as the main page."
echo ""
