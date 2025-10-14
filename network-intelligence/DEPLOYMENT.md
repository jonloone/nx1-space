# Network Intelligence - Production Deployment

Deploy the Mundi OpIntel Platform to nexusone.earth

## Prerequisites

- Docker and Docker Compose installed
- Server access (107.191.48.4)
- Domain pointing to server (nexusone.earth, www.nexusone.earth)

## Quick Deploy

```bash
cd /mnt/blockstorage/nx1-space/network-intelligence

# 1. Update email for Let's Encrypt
nano .env.production
# Change: ACME_EMAIL=your-email@example.com

# 2. Run deployment script
./deploy-production.sh
```

## What Gets Deployed

- **Next.js Application**: Network Intelligence platform with Mundi design
- **Traefik**: Reverse proxy with automatic HTTPS (Let's Encrypt)
- **Landing Page**: `/operations` - Operational Intelligence dashboard
- **Additional Pages**:
  - `/fleet-demo` - Fleet tracking demo
  - `/api/health` - Health check endpoint

## Manual Deployment Steps

If you prefer manual control:

```bash
# 1. Build the Docker image
docker-compose -f docker-compose.prod.yml build

# 2. Start services
docker-compose -f docker-compose.prod.yml up -d

# 3. Check status
docker-compose -f docker-compose.prod.yml ps

# 4. View logs
docker-compose -f docker-compose.prod.yml logs -f network-intelligence
```

## Verify Deployment

Once deployed, access:
- **Main App**: https://www.nexusone.earth
- **Operations**: https://nexusone.earth/operations (main page)
- **Health Check**: https://nexusone.earth/api/health

## Troubleshooting

### Check logs
```bash
docker-compose -f docker-compose.prod.yml logs network-intelligence
docker-compose -f docker-compose.prod.yml logs traefik
```

### Restart services
```bash
docker-compose -f docker-compose.prod.yml restart
```

### Rebuild from scratch
```bash
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

### SSL Certificate Issues
```bash
# Check Traefik certificate acquisition
docker-compose -f docker-compose.prod.yml logs traefik | grep -i certificate

# Traefik dashboard (for debugging)
# Access: https://traefik.nexusone.earth (if configured)
```

## Configuration

### Environment Variables
Edit `.env.production`:
- `ACME_EMAIL`: Your email for Let's Encrypt notifications

### Traefik Middlewares
Edit `traefik/middlewares.yml` for security headers and compression settings.

## Ports

- **80**: HTTP (redirects to HTTPS)
- **443**: HTTPS
- **8080**: Traefik dashboard (optional)

## Resource Limits

The application is configured with:
- **CPU**: 0.5-2.0 cores
- **Memory**: 256MB-1GB

## Monitoring

Check application health:
```bash
curl https://nexusone.earth/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "network-intelligence",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 12345
}
```

## Rollback

If you need to rollback to the old kepler-poc site:

```bash
cd /mnt/blockstorage/nx1-space/network-intelligence
docker-compose -f docker-compose.prod.yml down

cd /mnt/blockstorage/nx1-space/kepler-poc
./deploy-nexusone.sh
```

## Production URLs

After deployment:
- https://www.nexusone.earth → Operations Intelligence
- https://nexusone.earth → Operations Intelligence
- https://nexusone.earth/operations → Operational Intelligence (main)
- https://nexusone.earth/fleet-demo → Fleet Tracking Demo
