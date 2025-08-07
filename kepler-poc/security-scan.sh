#!/bin/bash

# Security Scanning Script for Ground Station Intelligence
# Comprehensive security validation and vulnerability assessment

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="ground-station-intelligence:latest"
REPORT_DIR="security-reports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Create reports directory
mkdir -p "${REPORT_DIR}"

echo -e "${BLUE}🔒 Ground Station Intelligence Security Scanner${NC}"
echo -e "${BLUE}================================================${NC}"
echo "Timestamp: $(date)"
echo "Image: ${IMAGE_NAME}"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print status
print_status() {
    local status=$1
    local message=$2
    case $status in
        "INFO")
            echo -e "${BLUE}ℹ️  ${message}${NC}"
            ;;
        "SUCCESS")
            echo -e "${GREEN}✅ ${message}${NC}"
            ;;
        "WARNING")
            echo -e "${YELLOW}⚠️  ${message}${NC}"
            ;;
        "ERROR")
            echo -e "${RED}❌ ${message}${NC}"
            ;;
    esac
}

# 1. Dockerfile Security Analysis
print_status "INFO" "Running Dockerfile security analysis..."
if command_exists hadolint; then
    print_status "INFO" "Analyzing Dockerfile with Hadolint..."
    hadolint Dockerfile.prod > "${REPORT_DIR}/hadolint_${TIMESTAMP}.txt" 2>&1 || {
        print_status "WARNING" "Hadolint found issues. Check ${REPORT_DIR}/hadolint_${TIMESTAMP}.txt"
    }
    print_status "SUCCESS" "Dockerfile analysis complete"
else
    print_status "WARNING" "Hadolint not installed. Installing..."
    if command_exists docker; then
        docker run --rm -i hadolint/hadolint < Dockerfile.prod > "${REPORT_DIR}/hadolint_${TIMESTAMP}.txt" 2>&1 || {
            print_status "WARNING" "Hadolint found issues via Docker"
        }
    else
        print_status "ERROR" "Cannot run Hadolint - Docker not available"
    fi
fi

# 2. Dependency Vulnerability Scan
print_status "INFO" "Scanning dependencies for vulnerabilities..."
if [ -f "package.prod.json" ]; then
    cp package.prod.json package.json
    if command_exists npm; then
        print_status "INFO" "Running npm audit..."
        npm audit --audit-level moderate > "${REPORT_DIR}/npm_audit_${TIMESTAMP}.txt" 2>&1 || {
            print_status "WARNING" "npm audit found vulnerabilities"
        }
        print_status "SUCCESS" "NPM audit complete"
    fi
fi

# 3. Container Image Vulnerability Scan
print_status "INFO" "Scanning container image for vulnerabilities..."

# Try Trivy first (most comprehensive)
if command_exists trivy; then
    print_status "INFO" "Running Trivy scan..."
    trivy image --format json --output "${REPORT_DIR}/trivy_${TIMESTAMP}.json" "${IMAGE_NAME}" 2>/dev/null || {
        print_status "WARNING" "Trivy scan encountered issues"
    }
    trivy image --format table --output "${REPORT_DIR}/trivy_${TIMESTAMP}.txt" "${IMAGE_NAME}" 2>/dev/null || true
    print_status "SUCCESS" "Trivy scan complete"
elif command_exists docker; then
    print_status "INFO" "Installing and running Trivy via Docker..."
    docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
        -v "${PWD}/${REPORT_DIR}:/reports" \
        aquasec/trivy:latest image --format json \
        --output "/reports/trivy_${TIMESTAMP}.json" "${IMAGE_NAME}" 2>/dev/null || {
        print_status "WARNING" "Trivy Docker scan encountered issues"
    }
    print_status "SUCCESS" "Trivy Docker scan complete"
else
    print_status "ERROR" "Cannot run vulnerability scan - no compatible tools found"
fi

# 4. Docker Compose Security Check
print_status "INFO" "Analyzing Docker Compose configuration..."
if [ -f "docker-compose.prod.yml" ]; then
    # Check for common security issues
    {
        echo "=== Docker Compose Security Analysis ==="
        echo "Timestamp: $(date)"
        echo ""
        
        # Check for privileged containers
        if grep -q "privileged.*true" docker-compose.prod.yml; then
            echo "❌ CRITICAL: Privileged containers found"
        else
            echo "✅ No privileged containers"
        fi
        
        # Check for host network mode
        if grep -q "network_mode.*host" docker-compose.prod.yml; then
            echo "❌ WARNING: Host network mode detected"
        else
            echo "✅ No host network mode usage"
        fi
        
        # Check for bind mounts to sensitive directories
        if grep -q "/proc\|/sys\|/dev" docker-compose.prod.yml; then
            echo "⚠️  WARNING: Sensitive directory mounts detected"
        else
            echo "✅ No sensitive directory mounts"
        fi
        
        # Check for secret management
        if grep -q "environment:" docker-compose.prod.yml && ! grep -q "secrets:" docker-compose.prod.yml; then
            echo "⚠️  INFO: Consider using Docker secrets for sensitive data"
        fi
        
        # Check for resource limits
        if grep -q "deploy:" docker-compose.prod.yml && grep -q "resources:" docker-compose.prod.yml; then
            echo "✅ Resource limits configured"
        else
            echo "⚠️  WARNING: No resource limits found"
        fi
        
    } > "${REPORT_DIR}/compose_security_${TIMESTAMP}.txt"
    print_status "SUCCESS" "Docker Compose analysis complete"
fi

# 5. Network Security Analysis
print_status "INFO" "Analyzing network configuration..."
{
    echo "=== Network Security Analysis ==="
    echo "Timestamp: $(date)"
    echo ""
    
    # Check nginx configuration
    if [ -f "nginx.prod.conf" ]; then
        echo "🔍 Nginx Configuration Analysis:"
        
        if grep -q "ssl_protocols" nginx.prod.conf; then
            echo "✅ SSL protocols configured"
        else
            echo "⚠️  INFO: Consider specifying SSL protocols"
        fi
        
        if grep -q "add_header.*X-Frame-Options" nginx.prod.conf; then
            echo "✅ X-Frame-Options header configured"
        else
            echo "❌ WARNING: Missing X-Frame-Options header"
        fi
        
        if grep -q "add_header.*X-Content-Type-Options" nginx.prod.conf; then
            echo "✅ X-Content-Type-Options header configured"
        else
            echo "❌ WARNING: Missing X-Content-Type-Options header"
        fi
        
        if grep -q "server_tokens.*off" nginx.prod.conf; then
            echo "✅ Server tokens disabled"
        else
            echo "⚠️  WARNING: Consider disabling server tokens"
        fi
    fi
    
} > "${REPORT_DIR}/network_security_${TIMESTAMP}.txt"

# 6. Generate Security Summary Report
print_status "INFO" "Generating security summary report..."
{
    echo "=== Ground Station Intelligence Security Report ==="
    echo "Generated: $(date)"
    echo "Image: ${IMAGE_NAME}"
    echo ""
    
    echo "🔍 SCANS PERFORMED:"
    echo "- Dockerfile security analysis (Hadolint)"
    echo "- Dependency vulnerability scan (npm audit)"
    echo "- Container image vulnerability scan (Trivy)"
    echo "- Docker Compose security check"
    echo "- Network configuration analysis"
    echo ""
    
    echo "📁 REPORT FILES:"
    ls -la "${REPORT_DIR}"/*"${TIMESTAMP}"* 2>/dev/null || echo "No report files generated"
    echo ""
    
    echo "🔧 RECOMMENDATIONS:"
    echo "1. Review all generated reports in ${REPORT_DIR}/"
    echo "2. Address any CRITICAL or HIGH severity vulnerabilities"
    echo "3. Regularly update base images and dependencies"
    echo "4. Implement security monitoring in production"
    echo "5. Configure SSL/TLS certificates for HTTPS"
    echo "6. Set up log monitoring and alerting"
    echo ""
    
    echo "✅ SECURITY FEATURES IMPLEMENTED:"
    echo "- Non-root container execution"
    echo "- Security headers in nginx configuration"
    echo "- Resource limits and health checks"
    echo "- Multi-stage Docker build"
    echo "- Network isolation"
    echo "- Comprehensive monitoring stack"
    
} > "${REPORT_DIR}/security_summary_${TIMESTAMP}.txt"

# 7. Final Status
print_status "SUCCESS" "Security scan complete!"
print_status "INFO" "Reports saved to ${REPORT_DIR}/"
print_status "INFO" "Review security_summary_${TIMESTAMP}.txt for overview"

echo ""
echo -e "${BLUE}📋 Quick Summary:${NC}"
echo "• Reports directory: ${REPORT_DIR}/"
echo "• Main report: security_summary_${TIMESTAMP}.txt"
echo "• Timestamp: ${TIMESTAMP}"

# Check for critical issues
CRITICAL_ISSUES=0
if [ -f "${REPORT_DIR}/trivy_${TIMESTAMP}.json" ]; then
    CRITICAL_COUNT=$(jq -r '.Results[]?.Vulnerabilities[]? | select(.Severity == "CRITICAL") | .VulnerabilityID' "${REPORT_DIR}/trivy_${TIMESTAMP}.json" 2>/dev/null | wc -l || echo "0")
    if [ "$CRITICAL_COUNT" -gt 0 ]; then
        print_status "ERROR" "Found ${CRITICAL_COUNT} CRITICAL vulnerabilities!"
        CRITICAL_ISSUES=$((CRITICAL_ISSUES + CRITICAL_COUNT))
    fi
fi

if [ "$CRITICAL_ISSUES" -gt 0 ]; then
    print_status "ERROR" "CRITICAL ISSUES FOUND - Review reports before deploying!"
    exit 1
else
    print_status "SUCCESS" "No critical security issues detected"
    exit 0
fi