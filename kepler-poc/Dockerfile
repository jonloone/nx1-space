# Multi-stage Docker build for Kepler.gl Ground Station Intelligence
# Build stage
FROM node:18-alpine AS builder

# Install build dependencies and security updates
RUN apk update && apk upgrade && \
    apk add --no-cache python3 make g++ && \
    rm -rf /var/cache/apk/*

# Create app user for build stage
RUN addgroup -g 1001 -S builduser && \
    adduser -S builduser -u 1001 -G builduser

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json package-lock.json* yarn.lock* ./

# Install dependencies with security and performance optimizations
RUN yarn install --frozen-lockfile --production=false \
    --network-timeout 300000 \
    --ignore-optional \
    --audit

# Copy source code with proper ownership
COPY --chown=builduser:builduser . .

# Set build environment variables for optimization
ENV NODE_ENV=production
ENV GENERATE_SOURCEMAP=false
ENV INLINE_RUNTIME_CHUNK=false

# Build the application with optimizations
RUN yarn build

# Security scan stage (optional but recommended)
FROM builder AS security-scan
RUN yarn audit --level moderate || true

# Production stage - use specific nginx version for security
FROM nginx:1.25.3-alpine AS production

# Install security updates and required tools
RUN apk update && apk upgrade && \
    apk add --no-cache \
    curl \
    ca-certificates \
    tzdata \
    tini && \
    rm -rf /var/cache/apk/*

# Create nginx user with specific UID/GID
RUN addgroup -g 101 -S nginx && \
    adduser -S nginx -u 101 -G nginx

# Remove default nginx content and config
RUN rm -rf /usr/share/nginx/html/* && \
    rm /etc/nginx/conf.d/default.conf

# Copy built application with proper ownership
COPY --from=builder --chown=nginx:nginx /app/build /usr/share/nginx/html

# Copy configuration files
COPY --chown=nginx:nginx nginx.prod.conf /etc/nginx/conf.d/default.conf
COPY --chown=nginx:nginx kepler_ground_stations.json /usr/share/nginx/html/data/

# Create required directories with proper permissions
RUN mkdir -p /var/cache/nginx /var/log/nginx /var/run && \
    chown -R nginx:nginx /var/cache/nginx /var/log/nginx /var/run && \
    chmod -R 755 /usr/share/nginx/html && \
    chmod 644 /etc/nginx/conf.d/default.conf

# Configure nginx to run as non-root
RUN sed -i 's/user nginx;//g' /etc/nginx/nginx.conf && \
    echo "user nginx;" >> /etc/nginx/nginx.conf

# Add comprehensive health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Switch to non-root user
USER nginx

# Use tini as init system for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Expose port (changed from 80 to 8080 for non-root)
EXPOSE 8080

# Start nginx with error handling
CMD ["sh", "-c", "nginx -t && exec nginx -g 'daemon off;'"]

# Add metadata labels
LABEL maintainer="Ground Station Intelligence Team" \
      version="1.0.0" \
      description="Production-ready Kepler.gl Ground Station Visualization" \
      org.opencontainers.image.source="https://github.com/your-org/kepler-poc"