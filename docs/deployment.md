# Deployment Guide

## Overview

This guide covers deploying Cashback Detective to production using Docker with Neon PostgreSQL.

## Prerequisites

- Neon account (free tier at https://console.neon.tech)
- Docker and Docker Compose installed
- Domain name (optional, for HTTPS)

## Neon Database Setup

1. **Create a Neon Project**
   - Go to https://console.neon.tech
   - Create a new project (e.g., "cashback-detective")
   - Note the project region

2. **Get Connection Strings**
   - **Pooled (for app)**: `postgresql://user:pass@ep-xxx-pooler.region.neon.tech/dbname?sslmode=require`
     - Use for application runtime
     - Uses pgbouncer, max 100 connections
   - **Direct (for migrations)**: `postgresql://user:pass@ep-xxx.region.neon.tech/dbname?sslmode=require`
     - Use for schema changes, pg_dump
     - Direct to compute, supports prepared statements

3. **Run Migrations**
   ```bash
   # Using direct connection for migrations
   psql "$DIRECT_DATABASE_URL" -f neon/migrations/001_initial_schema.sql
   psql "$DIRECT_DATABASE_URL" -f neon/migrations/002_seed_data.sql
   ```

## Environment Variables

Create a `.env.production` file or set environment variables:

```bash
# Required
DATABASE_URL=postgresql://user:pass@ep-xxx-pooler.region.neon.tech/dbname?sslmode=require
JWT_SECRET=your-32-char-minimum-secret-generated-with-openssl-rand-base64-32

# Optional
PORT=3000
NODE_ENV=production
LOG_LEVEL=info
OLLAMA_MODEL=qwen3:4b
ENABLE_AI_GENERAL_QUESTIONS=false

# Rate limiting (optional tuning)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX=10
STRICT_RATE_LIMIT_WINDOW_MS=60000
STRICT_RATE_LIMIT_MAX=10
```

## Docker Production Deployment

### Option 1: Docker Compose (Single Server)

```bash
# Build and start
docker compose -f docker-compose.prod.yml up --build -d

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Stop
docker compose -f docker-compose.prod.yml down
```

### Option 2: Manual Docker Build

```bash
# Build image
docker build -t cashback-detective .

# Run container
docker run -d \
  --name cashback-detective \
  -p 3000:3000 \
  --env-file .env.production \
  --restart unless-stopped \
  cashback-detective
```

## Reverse Proxy (Nginx/Traefik/Caddy)

For production HTTPS, use a reverse proxy:

### Caddy (Automatic HTTPS)

```caddy
# Caddyfile
your-domain.com {
    reverse_proxy localhost:3000
}
```

```bash
docker run -d \
  -p 80:80 -p 443:443 \
  -v $PWD/Caddyfile:/etc/caddy/Caddyfile \
  -v caddy_data:/data \
  -v caddy_config:/config \
  caddy:2-alpine
```

### Nginx

```nginx
# /etc/nginx/sites-available/cashback-detective
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Cloud Provider Deployment

### Render

1. Create a new Web Service
2. Connect GitHub repository
3. Build Command: `npm ci && npm run build`
4. Start Command: `npm start`
5. Add environment variables in dashboard
6. Add PostgreSQL database (or use external Neon)

### Fly.io

```bash
flyctl launch --name cashback-detective --region sea
flyctl secrets set DATABASE_URL=... JWT_SECRET=...
flyctl deploy
```

### Railway

```bash
railway login
railway link
railway variables set DATABASE_URL=... JWT_SECRET=...
railway up
```

### Vercel (Frontend Only)

```bash
cd frontend
vercel --prod
```
- Set `VITE_API_BASE` to your backend URL

## Health Checks

The application exposes `/health` endpoint:

```bash
curl https://your-domain.com/health
# {"status":"ok","service":"Cashback Detective"}
```

Docker health check (in docker-compose.prod.yml):
```yaml
healthcheck:
  test: ["CMD", "wget", "-q", "--spider", "http://localhost:3000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 10s
```

## Monitoring

### Logs

Structured JSON logs via Pino:
```bash
docker compose -f docker-compose.prod.yml logs -f app
```

### Key Metrics to Monitor

- HTTP request latency (via requestLogger middleware)
- Error rates (5xx responses)
- Database connection pool usage
- Rate limit hits (429 responses)
- Neon compute hours (in Neon dashboard)

## Backup & Recovery

Neon provides:
- Point-in-time recovery (6 hours on free tier)
- Manual snapshots (1 on free tier)

For additional safety:
```bash
# Backup schema + data
pg_dump "$DIRECT_DATABASE_URL" > backup.sql

# Restore
psql "$DIRECT_DATABASE_URL" < backup.sql
```

## Security Checklist

- [ ] Strong JWT_SECRET (32+ chars, generated with `openssl rand -base64 32`)
- [ ] HTTPS enforced (reverse proxy with valid TLS cert)
- [ ] Rate limiting configured
- [ ] Secure cookies (HTTPS required for `secure: true`)
- [ ] CSRF protection enabled
- [ ] Helmet security headers active
- [ ] Database SSL required (`sslmode=require`)
- [ ] No debug logging in production (`LOG_LEVEL=info` or `warn`)
- [ ] Admin routes protected with JWT + role check

## Scaling Considerations

- **Horizontal**: Run multiple containers behind load balancer
- **Database**: Neon auto-scales compute; connection pooling via pgbouncer
- **Rate limiting**: Adjust `RATE_LIMIT_MAX` based on traffic
- **Frontend**: Deploy static assets to CDN (Vercel, Netlify, Cloudflare Pages)