# HTTPS Setup Guide for www.nexusone.earth

Complete guide to deploy the Ground Station Intelligence platform with automatic HTTPS/SSL via Let's Encrypt.

## 🎯 Overview

Your deployment is configured with:
- **Primary Domain**: www.nexusone.earth
- **Alternative**: nexusone.earth (both work)
- **Traefik Dashboard**: traefik.nexusone.earth
- **SSL/TLS**: Automatic via Let's Encrypt
- **Auto-renewal**: Traefik handles certificate renewal

## ✅ Prerequisites

1. **Server Requirements**:
   - Public IP address
   - Ports 80 and 443 open (for HTTPS and Let's Encrypt challenges)
   - Docker 20.10+ and Docker Compose 2.0+

2. **DNS Configuration** (REQUIRED):
   ```
   Type   Host                      Value
   ────────────────────────────────────────────────
   A      nexusone.earth           YOUR_SERVER_IP
   A      www.nexusone.earth       YOUR_SERVER_IP
   A      traefik.nexusone.earth   YOUR_SERVER_IP
   ```

3. **Email Address**: For Let's Encrypt notifications

## 🚀 Deployment Steps

### Step 1: Configure Environment

```bash
# Navigate to project directory
cd /mnt/blockstorage/nx1-space/kepler-poc

# Copy the production template
cp .env.production .env

# Edit configuration
nano .env
```

**Required changes in `.env`**:
```bash
# Update with your email
ACME_EMAIL=your-email@nexusone.earth

# Set a strong Grafana password
GRAFANA_PASSWORD=YourSecurePassword123!
```

### Step 2: Verify DNS Propagation

```bash
# Check if DNS is properly configured
dig nexusone.earth +short
dig www.nexusone.earth +short
dig traefik.nexusone.earth +short

# All should return your server's IP address
```

### Step 3: Deploy the Stack

```bash
# Build and deploy
docker-compose -f docker-compose.prod.yml up -d

# Watch the logs
docker-compose -f docker-compose.prod.yml logs -f traefik
```

### Step 4: Verify HTTPS

After deployment (may take 1-2 minutes for certificate issuance):

```bash
# Test HTTPS endpoint
curl -I https://www.nexusone.earth/health

# Should return:
# HTTP/2 200
# with security headers
```

Visit in browser:
- https://www.nexusone.earth (your application)
- https://traefik.nexusone.earth (Traefik dashboard)

## 🔍 Troubleshooting

### Certificate Not Issued

**Problem**: HTTPS not working after 5 minutes

**Solutions**:
1. Check DNS propagation:
   ```bash
   nslookup www.nexusone.earth 8.8.8.8
   ```

2. Verify ports are open:
   ```bash
   sudo netstat -tlnp | grep -E ':(80|443)'
   ```

3. Check Traefik logs:
   ```bash
   docker-compose -f docker-compose.prod.yml logs traefik | grep -i acme
   ```

4. Check certificate storage:
   ```bash
   docker volume inspect kepler-poc_traefik-certificates
   ```

### DNS Not Resolving

**Problem**: Domain doesn't point to your server

**Solution**:
1. Verify DNS records in your domain registrar
2. Wait for DNS propagation (can take up to 48 hours)
3. Use online tools: https://dnschecker.org

### Rate Limiting by Let's Encrypt

**Problem**: Too many certificate requests

**Solution**:
1. Enable staging mode in `.env`:
   ```bash
   LETSENCRYPT_STAGING=true
   ```

2. Restart services:
   ```bash
   docker-compose -f docker-compose.prod.yml restart traefik
   ```

3. Once working, disable staging and redeploy

### HTTP Redirect Not Working

**Problem**: HTTP doesn't redirect to HTTPS

**Check**: Traefik configuration in `traefik/traefik.yml:13-17`
```yaml
entryPoints:
  web:
    address: ":80"
    http:
      redirections:
        entryPoint:
          to: websecure
          scheme: https
```

## 📋 Verification Checklist

- [ ] DNS A records created and propagated
- [ ] Ports 80 and 443 open in firewall
- [ ] `.env` file configured with correct email
- [ ] Docker containers running (`docker ps`)
- [ ] HTTPS certificate issued (check logs)
- [ ] https://www.nexusone.earth loads with valid SSL
- [ ] HTTP automatically redirects to HTTPS
- [ ] Security headers present (check browser dev tools)

## 🔒 Security Features

Your HTTPS setup includes:

1. **TLS 1.2+ Only**: Old protocols disabled
2. **HSTS**: HTTP Strict Transport Security with preload
3. **Security Headers**:
   - Content-Security-Policy
   - X-Frame-Options: DENY
   - X-Content-Type-Options: nosniff
   - Referrer-Policy

4. **Auto-renewal**: Certificates renew 30 days before expiration
5. **Rate Limiting**: Built-in DDoS protection
6. **Strong Cipher Suites**: Modern encryption only

## 📊 Monitoring

### Check Certificate Expiry

```bash
# View certificate details
echo | openssl s_client -servername www.nexusone.earth -connect www.nexusone.earth:443 2>/dev/null | openssl x509 -noout -dates
```

### Monitor Traefik

```bash
# Real-time logs
docker-compose -f docker-compose.prod.yml logs -f traefik

# Check certificate storage
docker exec traefik-proxy ls -la /certificates/
```

### Health Endpoints

- **App Health**: https://www.nexusone.earth/health
- **Traefik Dashboard**: https://traefik.nexusone.earth
- **Prometheus**: http://localhost:9090 (internal)
- **Grafana**: http://localhost:3000 (internal)

## 🔄 Certificate Renewal

Traefik automatically renews certificates 30 days before expiration. No manual intervention required.

To force renewal:
```bash
# Remove old certificates
docker volume rm kepler-poc_traefik-certificates

# Restart Traefik
docker-compose -f docker-compose.prod.yml restart traefik
```

## 🌐 Testing Before Production

Use Let's Encrypt staging environment to test:

1. Uncomment in `traefik/traefik.yml:42`:
   ```yaml
   caServer: https://acme-staging-v02.api.letsencrypt.org/directory
   ```

2. Deploy and test
3. Comment out staging line for production certificates
4. Remove test certificates and redeploy

## 📞 Support

If issues persist:
1. Check Traefik logs: `docker-compose -f docker-compose.prod.yml logs traefik`
2. Verify DNS: `dig www.nexusone.earth`
3. Test ports: `telnet YOUR_SERVER_IP 443`
4. Review Let's Encrypt rate limits: https://letsencrypt.org/docs/rate-limits/

---

**Note**: Let's Encrypt has rate limits (50 certificates per domain per week). Use staging for testing!
