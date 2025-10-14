#!/bin/bash
# Deployment script for www.nexusone.earth
# Server IP: 107.191.48.4

set -e

echo "🚀 Deploying Ground Station Intelligence to nexusone.earth"
echo "=========================================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running on the server
echo -e "${YELLOW}Checking server configuration...${NC}"

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env from template...${NC}"
    cp .env.production .env
    echo -e "${RED}⚠️  IMPORTANT: Edit .env and update ACME_EMAIL before deploying!${NC}"
    echo -e "${YELLOW}Run: nano .env${NC}"
    exit 1
fi

# Verify Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running!${NC}"
    exit 1
fi

# Check if ports 80 and 443 are available or used by our stack
echo -e "${YELLOW}Checking ports...${NC}"
if netstat -tlnp 2>/dev/null | grep -E ':80 |:443 ' | grep -v docker; then
    echo -e "${RED}⚠️  Warning: Ports 80 or 443 are in use by another service!${NC}"
    echo "You may need to stop existing nginx or other web servers."
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Load environment variables
source .env

# Verify email is set
if [[ "$ACME_EMAIL" == "admin@nexusone.earth" ]] || [[ -z "$ACME_EMAIL" ]]; then
    echo -e "${RED}❌ Please update ACME_EMAIL in .env file!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Configuration validated${NC}"
echo ""
echo "Configuration:"
echo "  Domain: www.nexusone.earth"
echo "  Email: $ACME_EMAIL"
echo "  IP: 107.191.48.4"
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
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true

# Create necessary directories
echo -e "${YELLOW}Creating directories...${NC}"
mkdir -p traefik monitoring/grafana monitoring/prometheus

# Pull latest images
echo -e "${YELLOW}Pulling Docker images...${NC}"
docker-compose -f docker-compose.prod.yml pull

# Build the application
echo -e "${YELLOW}Building application...${NC}"
docker-compose -f docker-compose.prod.yml build --no-cache

# Start services
echo -e "${YELLOW}Starting services...${NC}"
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to start
echo -e "${YELLOW}Waiting for services to start...${NC}"
sleep 10

# Check service status
echo ""
echo -e "${GREEN}Service Status:${NC}"
docker-compose -f docker-compose.prod.yml ps

# Check Traefik logs for certificate acquisition
echo ""
echo -e "${YELLOW}Checking Traefik certificate status...${NC}"
sleep 5
docker-compose -f docker-compose.prod.yml logs traefik | grep -i "acme\|certificate" | tail -20

echo ""
echo -e "${GREEN}=========================================================="
echo "✅ Deployment Complete!"
echo "==========================================================${NC}"
echo ""
echo "Access your application:"
echo "  🌐 Main App: https://www.nexusone.earth"
echo "  🌐 Alternative: https://nexusone.earth"
echo "  📊 Grafana: http://107.191.48.4:3000"
echo "  📈 Prometheus: http://107.191.48.4:9090"
echo "  🔧 Traefik Dashboard: https://traefik.nexusone.earth"
echo ""
echo "Health Check:"
echo "  curl https://www.nexusone.earth/health"
echo ""
echo "View logs:"
echo "  docker-compose -f docker-compose.prod.yml logs -f"
echo ""
echo "Note: SSL certificate acquisition may take 1-2 minutes."
echo "Check certificate status:"
echo "  docker-compose -f docker-compose.prod.yml logs traefik | grep -i certificate"
echo ""
