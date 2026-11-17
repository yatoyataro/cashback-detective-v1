# Deployment Guide

## Overview

This guide covers deploying Cashback Detective to production using Docker and Neon PostgreSQL.

## Prerequisites

- Docker and Docker Compose
- Neon PostgreSQL account (free tier available)
- Domain name (optional, for HTTPS)

## Neon Database Setup

1. **Create a Neon Project**
   - Go to https://console.neon.tech
   - Create a new project
   - Choose a region close to your deployment target

2. **Get Connection Strings**
   - **Pooled (for application)**: `postgres://user:pass@ep-xxx-pooler.region.neon.tech/db?sslmode=require`
     - Uses pgbouncer, max 100 connections
     - Use for application runtime
   - **Direct (for migrations)**: `postgres://user:pass@ep-xxx.region.neon.tech/db?sslmode=require`
     - Direct to compute, supports prepared statements
     - Use for schema changes, pg_dump, LISTEN/NOTIFY

3. **Run Migrations**
   ```bash
   # Using direct connection string
   psql "$DIRECT_DATABASE_URL" -f neon/migrations/001_initial_schema.sql
   psql "$DIRECT_DATABASE_URL" -f neon/migrations/002_seed_data.sql
   ```

4. **Set Environment Variable**
   ```bash
   # Use pooled connection for production
   DATABASE_URL=postgres://user:pass@ep-xxx-pooler.region.neon.tech/db?sslmode=require
   ```

## Docker Deployment

### Build Production Image

```bash
docker compose -f docker-compose.prod.yml build
```

### Run with Neon

```bash
# Set DATABASE_URL in environment
export DATABASE_URL="your-neon-pooled-connection-string"
docker compose -f docker-compose.prod.yml up -d
```

### Health Check

The production image includes a health check endpoint at `/health`:

```bash
curl http://localhost:3000/health
# Returns: {"status":"ok","service":"Cashback Detective"}
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon pooled connection string |
| `PORT` | No | Server port (default: 3000) |
| `NODE_ENV` | No | `production` enables production logging |
| `LOG_LEVEL` | No | Log level: `debug`, `info`, `warn`, `error` |
| `JWT_SECRET` | No | Secret for JWT tokens (change in production!) |
| `OLLAMA_MODEL` | No | Ollama model for AI features |
| `ENABLE_AI_GENERAL_QUESTIONS` | No | Enable AI for general questions |

## Production Checklist

- [ ] Use Neon pooled connection string (`-pooler` suffix)
- [ ] Set strong `JWT_SECRET` in production
- [ ] Configure `LOG_LEVEL=info` or `warn`
- [ ] Set up reverse proxy (nginx, Caddy) for HTTPS
- [ ] Configure domain and SSL certificates
- [ ] Set up monitoring/alerting
- [ ] Configure backup strategy (Neon provides point-in-time recovery)

## CI/CD Pipeline

The project includes GitHub Actions workflows:

- **CI** (`.github/workflows/ci.yml`): Runs on push/PR to main
  - Lint and test backend
  - Lint frontend
  - Run evaluations against PostgreSQL

- **Deploy** (`.github/workflows/cd.yml`): Runs on push to main
  - Configure your deployment provider (Render, Fly.io, Railway, etc.)

- **Scheduled Evaluations** (`.github/workflows/eval.yml`): Daily at 2 AM UTC
  - Runs full evaluation suite against test database

## Scaling Considerations

- **Neon Free Tier**: 100 projects, 1 GB/project, 100 CU-hours/month
- **Connection Pooling**: Neon's pgbouncer handles up to 100 connections
- **Auto-suspend**: After 5 minutes inactivity, scales to zero (zero cost)
- **Auto-resume**: ~100-500ms on first connection
- **Horizontal Scaling**: Run multiple containers behind load balancer

## Troubleshooting

### Connection Issues

1. Verify Neon project is not suspended (check console)
2. Use pooled connection string for application
3. Check firewall/security groups allow outbound PostgreSQL (port 5432)
4. Verify SSL mode is `require` in connection string

### Migration Failures

1. Use **direct** connection string for migrations
2. Check Neon project has sufficient storage
3. Verify SQL syntax compatibility with PostgreSQL 16

### Performance

1. Monitor Neon compute hours in console
2. Use connection pooling (already configured in `db.ts`)
3. Consider read replicas for read-heavy workloads