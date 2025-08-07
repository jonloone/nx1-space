#!/bin/bash

# Production Deployment Script for Ground Station Intelligence
# Comprehensive deployment with security validation and monitoring setup

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="ground-station-intelligence:latest"
COMPOSE_FILE="docker-compose.prod.yml"
BACKUP_DIR="backups"
DEPLOYMENT_LOG="deployment_$(date +%Y%m%d_%H%M%S).log"

# Function to print status
print_status() {
    local status=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $status in
        "INFO")
            echo -e "${BLUE}[${timestamp}] ℹ️  ${message}${NC}" | tee -a "${DEPLOYMENT_LOG}"
            ;;
        "SUCCESS")
            echo -e "${GREEN}[${timestamp}] ✅ ${message}${NC}" | tee -a "${DEPLOYMENT_LOG}"
            ;;
        "WARNING")
            echo -e "${YELLOW}[${timestamp}] ⚠️  ${message}${NC}" | tee -a "${DEPLOYMENT_LOG}"
            ;;
        "ERROR")
            echo -e "${RED}[${timestamp}] ❌ ${message}${NC}" | tee -a "${DEPLOYMENT_LOG}"
            ;;
    esac
}

# Function to check prerequisites
check_prerequisites() {
    print_status "INFO" "Checking deployment prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_status "ERROR" "Docker is not installed"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_status "ERROR" "Docker Compose is not installed"
        exit 1
    fi
    
    # Check required files
    local required_files=("${COMPOSE_FILE}" "Dockerfile.prod" "nginx.prod.conf" "kepler_ground_stations.json")
    for file in "${required_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            print_status "ERROR" "Required file not found: $file"
            exit 1
        fi
    done
    
    print_status "SUCCESS" "Prerequisites check passed"
}

# Function to run security scan
run_security_scan() {
    print_status "INFO" "Running security validation..."
    
    if [[ -f "security-scan.sh" ]]; then
        chmod +x security-scan.sh
        if ./security-scan.sh; then
            print_status "SUCCESS" "Security scan passed"
        else
            print_status "WARNING" "Security scan found issues - check reports before proceeding"
            read -p "Continue with deployment? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                print_status "INFO" "Deployment aborted by user"
                exit 1
            fi
        fi
    else
        print_status "WARNING" "Security scan script not found - skipping"
    fi
}

# Function to backup existing deployment
backup_deployment() {
    print_status "INFO" "Creating deployment backup..."
    
    mkdir -p "${BACKUP_DIR}"
    local backup_file="${BACKUP_DIR}/backup_$(date +%Y%m%d_%H%M%S).tar.gz"
    
    # Backup volumes if they exist
    if docker volume ls | grep -q "kepler-poc"; then
        print_status "INFO" "Backing up Docker volumes..."
        docker run --rm \
            -v prometheus-data:/data/prometheus \
            -v grafana-data:/data/grafana \
            -v redis-data:/data/redis \
            -v "${PWD}/${BACKUP_DIR}:/backup" \
            alpine:latest \
            tar czf "/backup/volumes_$(date +%Y%m%d_%H%M%S).tar.gz" /data/ 2>/dev/null || {
            print_status "WARNING" "Volume backup failed - continuing"
        }
    fi
    
    # Backup configuration files
    tar czf "${backup_file}" \
        "${COMPOSE_FILE}" \
        "Dockerfile.prod" \
        "nginx.prod.conf" \
        "kepler_ground_stations.json" \
        monitoring/ 2>/dev/null || {
        print_status "WARNING" "Configuration backup failed"
    }
    
    print_status "SUCCESS" "Backup created: ${backup_file}"
}

# Function to build and deploy
build_and_deploy() {
    print_status "INFO" "Building and deploying Ground Station Intelligence..."
    
    # Set build arguments
    export BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
    export VCS_REF=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    
    # Build the application
    print_status "INFO" "Building Docker image..."
    if docker-compose -f "${COMPOSE_FILE}" build --no-cache; then
        print_status "SUCCESS" "Docker image built successfully"
    else
        print_status "ERROR" "Docker build failed"
        exit 1
    fi
    
    # Deploy the stack
    print_status "INFO" "Deploying production stack..."
    if docker-compose -f "${COMPOSE_FILE}" up -d; then
        print_status "SUCCESS" "Production stack deployed"
    else
        print_status "ERROR" "Deployment failed"
        exit 1
    fi
}

# Function to verify deployment
verify_deployment() {
    print_status "INFO" "Verifying deployment health..."
    
    # Wait for services to start
    sleep 30
    
    # Check service health
    local services=("kepler-app" "traefik" "prometheus" "grafana" "redis")
    local all_healthy=true
    
    for service in "${services[@]}"; do
        if docker-compose -f "${COMPOSE_FILE}" ps "$service" | grep -q "Up"; then
            print_status "SUCCESS" "Service $service is running"
        else
            print_status "ERROR" "Service $service is not running"
            all_healthy=false
        fi
    done
    
    # Test application endpoint
    local max_attempts=10
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f -s http://localhost:80/health > /dev/null 2>&1; then
            print_status "SUCCESS" "Application health check passed"
            break
        else
            print_status "INFO" "Health check attempt ${attempt}/${max_attempts} failed, retrying..."
            sleep 10
            ((attempt++))
        fi
    done
    
    if [[ $attempt -gt $max_attempts ]]; then
        print_status "ERROR" "Application health check failed after ${max_attempts} attempts"
        all_healthy=false
    fi
    
    if [[ "$all_healthy" == "true" ]]; then
        print_status "SUCCESS" "All services are healthy"
    else
        print_status "ERROR" "Some services are unhealthy - check logs"
        return 1
    fi
}

# Function to display post-deployment information
show_deployment_info() {
    print_status "INFO" "Deployment completed successfully!"
    
    echo ""
    echo -e "${BLUE}🚀 Ground Station Intelligence - Production Deployment${NC}"
    echo -e "${BLUE}======================================================${NC}"
    echo ""
    echo "📍 Service URLs:"
    echo "   • Application:     http://localhost:80"
    echo "   • Traefik Dashboard: http://localhost:8080"
    echo "   • Prometheus:      http://localhost:9090"
    echo "   • Grafana:         http://localhost:3000 (admin/admin123!)"
    echo ""
    echo "📊 Monitoring:"
    echo "   • Health endpoint: http://localhost:80/health"
    echo "   • Metrics:         http://localhost:9090/metrics"
    echo "   • Logs:            docker-compose -f ${COMPOSE_FILE} logs -f"
    echo ""
    echo "🔧 Management Commands:"
    echo "   • Stop:            docker-compose -f ${COMPOSE_FILE} down"
    echo "   • Restart:         docker-compose -f ${COMPOSE_FILE} restart"
    echo "   • Logs:            docker-compose -f ${COMPOSE_FILE} logs -f [service]"
    echo "   • Scale:           docker-compose -f ${COMPOSE_FILE} up -d --scale kepler-app=3"
    echo ""
    echo "🔒 Security:"
    echo "   • Run security scan: ./security-scan.sh"
    echo "   • Check vulnerabilities: docker run --rm aquasec/trivy image ${IMAGE_NAME}"
    echo ""
    echo "📋 Next Steps:"
    echo "   1. Configure domain names in /etc/hosts or DNS"
    echo "   2. Set up SSL certificates for HTTPS"
    echo "   3. Configure monitoring alerts"
    echo "   4. Set up log aggregation"
    echo "   5. Schedule regular security scans"
    echo ""
    echo "📝 Deployment Log: ${DEPLOYMENT_LOG}"
    echo ""
}

# Function to handle cleanup on failure
cleanup_on_failure() {
    print_status "ERROR" "Deployment failed - cleaning up..."
    
    # Stop any running containers
    docker-compose -f "${COMPOSE_FILE}" down 2>/dev/null || true
    
    # Show logs for debugging
    print_status "INFO" "Recent logs for debugging:"
    docker-compose -f "${COMPOSE_FILE}" logs --tail=50 2>/dev/null || true
    
    exit 1
}

# Trap for cleanup on failure
trap cleanup_on_failure ERR

# Main deployment flow
main() {
    echo -e "${BLUE}🚀 Ground Station Intelligence - Production Deployment${NC}"
    echo -e "${BLUE}======================================================${NC}"
    echo "Started: $(date)"
    echo "Log file: ${DEPLOYMENT_LOG}"
    echo ""
    
    # Run deployment steps
    check_prerequisites
    run_security_scan
    backup_deployment
    build_and_deploy
    verify_deployment
    show_deployment_info
    
    print_status "SUCCESS" "Production deployment completed successfully!"
}

# Run main function
main "$@"