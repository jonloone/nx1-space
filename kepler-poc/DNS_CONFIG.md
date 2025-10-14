# DNS Configuration for NexusOne.earth

## Current Setup ✅

Your DNS records are correctly configured:

```
Type    Host                      Value           Status
──────────────────────────────────────────────────────────
A       nexusone.earth           107.191.48.4    ✅ Active
A       www.nexusone.earth       107.191.48.4    ✅ Active
A       traefik.nexusone.earth   107.191.48.4    ⚠️  Recommended
```

## Server Information

- **IP Address**: 107.191.48.4
- **Port 80**: ✅ Open
- **Port 443**: ✅ Open
- **Current Status**: Server running, needs SSL certificate update

## Deployment Checklist

- [x] DNS records configured
- [x] Ports 80 and 443 accessible
- [ ] Configure environment variables
- [ ] Deploy Traefik with Let's Encrypt
- [ ] Verify SSL certificate for both domains

## Quick Deploy

```bash
# Navigate to project
cd /mnt/blockstorage/nx1-space/kepler-poc

# Configure environment
cp .env.production .env
nano .env  # Update ACME_EMAIL

# Deploy
./deploy-nexusone.sh
```

## Post-Deployment Verification

```bash
# Test HTTPS
curl -I https://www.nexusone.earth/health
curl -I https://nexusone.earth/health

# Check certificate
echo | openssl s_client -servername www.nexusone.earth -connect 107.191.48.4:443 2>/dev/null | openssl x509 -noout -text | grep -A 1 "Subject Alternative Name"

# Should show:
# DNS:nexusone.earth, DNS:www.nexusone.earth
```

## Current Issue

The server has an SSL certificate but it doesn't include `www.nexusone.earth` as a Subject Alternative Name. Once you deploy the Traefik configuration, it will obtain a new Let's Encrypt certificate covering both:
- nexusone.earth
- www.nexusone.earth

## DNS Propagation Check

```bash
# Check from multiple DNS servers
dig @8.8.8.8 nexusone.earth +short
dig @8.8.8.8 www.nexusone.earth +short
dig @1.1.1.1 nexusone.earth +short
dig @1.1.1.1 www.nexusone.earth +short

# All should return: 107.191.48.4
```

Verified: ✅ **DNS is correctly propagated**

## Next Steps

1. **Configure .env file** with your email for Let's Encrypt
2. **Run deployment script**: `./deploy-nexusone.sh`
3. **Wait 1-2 minutes** for certificate acquisition
4. **Test**: https://www.nexusone.earth

The new deployment will:
- Obtain fresh SSL certificates for both domains
- Enable automatic HTTP → HTTPS redirect
- Configure security headers and rate limiting
- Set up automatic certificate renewal
