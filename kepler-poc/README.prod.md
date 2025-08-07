# Ground Station Intelligence - Production Deployment

Enterprise-grade Kepler.gl application for visualizing commercial satellite ground station investment opportunities.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Traefik       │────│  Kepler.gl App  │────│   Monitoring    │
│  Load Balancer  │    │   (Nginx +      │    │  (Prometheus +  │
│  + SSL/TLS      │    │    React)       │    │    Grafana)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │     Redis       │
                    │   Caching       │
                    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum
- 10GB disk space

### 1. Production Deployment
```bash
# Clone or copy the project
git clone <repository> ground-station-intelligence
cd ground-station-intelligence

# Run security scan (recommended)
./security-scan.sh

# Deploy to production
./deploy.sh
```

### 2. Access the Application
- **Main App**: http://localhost:80
- **Grafana**: http://localhost:3000 (admin/admin123!)
- **Prometheus**: http://localhost:9090
- **Traefik Dashboard**: http://localhost:8080

## 🔒 Security Features

### Container Security
- ✅ Non-root execution (UID 101)
- ✅ Read-only root filesystem
- ✅ No privileged containers
- ✅ Resource limits enforced
- ✅ Security scanning integrated

### Network Security
- ✅ Network isolation
- ✅ Security headers (HSTS, CSP, etc.)
- ✅ Rate limiting
- ✅ Attack pattern blocking

### Application Security
- ✅ Dependency vulnerability scanning
- ✅ Dockerfile security analysis
- ✅ HTTPS ready (with certificates)
- ✅ Secure session management

## 📊 Monitoring & Observability

### Metrics Collection
- **Prometheus**: Application and infrastructure metrics
- **Grafana**: Visualization dashboards
- **Health Checks**: Automated service monitoring
- **Alerting**: Production-ready alerts (configurable)

### Logging
- **Centralized**: All services log to stdout
- **Structured**: JSON format for easy parsing
- **Retention**: Configurable log retention

## 🛠️ Operations

### Daily Operations
```bash
# Check service status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f kepler-app

# Scale application
docker-compose -f docker-compose.prod.yml up -d --scale kepler-app=3

# Restart services
docker-compose -f docker-compose.prod.yml restart
```

### Maintenance
```bash
# Security scan
./security-scan.sh

# Update images
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d

# Backup data
docker run --rm -v prometheus-data:/data -v $(pwd)/backups:/backup alpine tar czf /backup/prometheus-$(date +%Y%m%d).tar.gz /data

# Clean up old images
docker system prune -f
```

## 🔧 Configuration

### Environment Variables
```bash
# Create .env file
cat > .env << EOF
# Domain configuration
DOMAIN=ground-station.yourdomain.com
ACME_EMAIL=admin@yourdomain.com

# Security
GRAFANA_PASSWORD=your-secure-password

# Application
NODE_ENV=production
TZ=UTC
EOF
```

### SSL/TLS Setup
1. Update domain in `docker-compose.prod.yml`
2. Ensure DNS points to your server
3. Traefik will automatically obtain Let's Encrypt certificates

### Custom Map Styles
Edit `src/config/mapStyles.js` to add custom base maps:
```javascript
{
  id: 'custom-style',
  label: 'Custom Style',
  style: {
    version: 8,
    sources: { /* your map sources */ },
    layers: [ /* your map layers */ ]
  }
}
```

## 📊 Data Management

### Ground Station Data
- **Location**: `/data/ground_stations.json`
- **Format**: GeoJSON with investment metadata
- **Update**: Replace file and restart containers

### Data Processing Pipeline
```bash
# Update ground station data
python3 data_transformer.py
docker-compose -f docker-compose.prod.yml restart kepler-app
```

## 🚨 Troubleshooting

### Common Issues

#### Application Won't Start
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs kepler-app

# Verify data file
ls -la kepler_ground_stations.json

# Rebuild image
docker-compose -f docker-compose.prod.yml build --no-cache kepler-app
```

#### Performance Issues
```bash
# Check resource usage
docker stats

# Scale application
docker-compose -f docker-compose.prod.yml up -d --scale kepler-app=3

# Check monitoring
curl http://localhost:9090/metrics
```

#### Security Alerts
```bash
# Run security scan
./security-scan.sh

# Update vulnerable dependencies
npm audit fix
docker-compose -f docker-compose.prod.yml build --no-cache
```

### Log Analysis
```bash
# Application errors
docker-compose -f docker-compose.prod.yml logs kepler-app | grep ERROR

# Nginx access logs
docker-compose -f docker-compose.prod.yml logs kepler-app | grep "GET\|POST"

# Performance metrics
curl -s http://localhost:9090/api/v1/query?query=up | jq .
```

## 🔄 Disaster Recovery

### Backup Strategy
```bash
# Full backup script
#!/bin/bash
BACKUP_DIR="backups/$(date +%Y%m%d)"
mkdir -p "$BACKUP_DIR"

# Backup volumes
docker run --rm -v prometheus-data:/data -v $(pwd)/$BACKUP_DIR:/backup alpine tar czf /backup/prometheus.tar.gz /data
docker run --rm -v grafana-data:/data -v $(pwd)/$BACKUP_DIR:/backup alpine tar czf /backup/grafana.tar.gz /data
docker run --rm -v redis-data:/data -v $(pwd)/$BACKUP_DIR:/backup alpine tar czf /backup/redis.tar.gz /data

# Backup configuration
tar czf "$BACKUP_DIR/config.tar.gz" docker-compose.prod.yml nginx.prod.conf Dockerfile.prod
```

### Recovery Procedure
```bash
# Stop services
docker-compose -f docker-compose.prod.yml down

# Restore volumes
docker volume create prometheus-data
docker run --rm -v prometheus-data:/data -v $(pwd)/backups/YYYYMMDD:/backup alpine tar xzf /backup/prometheus.tar.gz -C /

# Restart services
docker-compose -f docker-compose.prod.yml up -d
```

## 📈 Performance Tuning

### Resource Optimization
```yaml
# In docker-compose.prod.yml
deploy:
  resources:
    limits:
      cpus: '2.0'      # Increase for high traffic
      memory: 1024M    # Increase for large datasets
    reservations:
      cpus: '0.5'
      memory: 256M
```

### Caching Strategy
- **Redis**: Session and API response caching
- **Nginx**: Static asset caching with long expiry
- **Browser**: Optimized cache headers

## 🤝 Contributing

### Development Setup
```bash
# Development environment
docker-compose up --build

# Run tests
docker-compose exec kepler-app npm test

# Security scan
./security-scan.sh
```

### Production Deployment
1. Run security scan
2. Test in staging environment
3. Deploy with `./deploy.sh`
4. Monitor deployment health
5. Validate functionality

## 📞 Support

### Health Checks
- **Application**: http://localhost:80/health
- **Prometheus**: http://localhost:9090/-/healthy
- **Grafana**: http://localhost:3000/api/health

### Monitoring Endpoints
- **Metrics**: http://localhost:9090/metrics
- **Dashboards**: http://localhost:3000
- **Service Discovery**: http://localhost:9090/targets

---

**Security Notice**: This deployment includes production-grade security configurations. Regular security scans and updates are recommended.