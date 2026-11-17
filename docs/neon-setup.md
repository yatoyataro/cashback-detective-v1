# Neon Database Setup Guide

## Why Neon?

Neon is a serverless PostgreSQL platform with unique advantages for this project:

- **Auto-suspend**: Scales to zero after 5 minutes of inactivity (zero cost)
- **Auto-resume**: Resumes in ~100-500ms on first connection (typically under 200ms)
- **No keep-alive needed**: Unlike Supabase (pauses after 1 week, manual resume), Neon's suspend/resume is fully automatic
- **Built-in connection pooling**: pgbouncer with 100 connection limit
- **Free tier**: 100 projects, 1 GB/project, 100 CU-hours/month
- **Point-in-time recovery**: 6 hours + 1 manual snapshot
- **Branching**: 10 branches per project for development

## Step-by-Step Setup

### 1. Create Neon Account

1. Go to https://console.neon.tech
2. Sign up with GitHub, Google, or email
3. Verify email if required

### 2. Create Project

1. Click "Create a project"
2. Choose:
   - **Project name**: `cashback-detective` (or your preferred name)
   - **PostgreSQL version**: 16 (latest)
   - **Region**: Choose closest to your deployment (e.g., `us-east-1`, `eu-west-1`)
   - **Compute size**: Start with `0.25 CU` (free tier default)
3. Click "Create project"

### 3. Get Connection Strings

After project creation, you'll see connection details. You need two strings:

#### Pooled Connection (for Application)
```
postgres://user:password@ep-xxx-pooler.region.neon.tech/dbname?sslmode=require
```
- Contains `-pooler` in hostname
- Uses pgbouncer for connection pooling
- **Use this for `DATABASE_URL` in production**

#### Direct Connection (for Migrations)
```
postgres://user:password@ep-xxx.region.neon.tech/dbname?sslmode=require
```
- Direct to compute instance
- Supports prepared statements
- **Use this for running migrations**

### 4. Configure Environment

Create `.env` file in project root:

```bash
# Use pooled connection for application
DATABASE_URL=postgres://user:password@ep-xxx-pooler.region.neon.tech/dbname?sslmode=require

# Optional: for local development with different database
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cashback_detective

PORT=3000
NODE_ENV=production
LOG_LEVEL=info

# Change this in production!
JWT_SECRET=your-super-secret-key-here

# AI features (optional)
OLLAMA_MODEL=qwen3:4b
ENABLE_AI_GENERAL_QUESTIONS=false
```

### 5. Run Migrations

Using the **direct** connection string:

```bash
# Option 1: Using psql with direct URL
export DIRECT_DATABASE_URL="postgres://user:password@ep-xxx.region.neon.tech/dbname?sslmode=require"
psql "$DIRECT_DATABASE_URL" -f neon/migrations/001_initial_schema.sql
psql "$DIRECT_DATABASE_URL" -f neon/migrations/002_seed_data.sql

# Option 2: Using Neon CLI (if installed)
neon sql --project-id <project-id> < neon/migrations/001_initial_schema.sql
neon sql --project-id <project-id> < neon/migrations/002_seed_data.sql
```

### 6. Verify Setup

Start the application and test:

```bash
npm run build
npm start
```

In another terminal:
```bash
curl http://localhost:3000/health
curl http://localhost:3000/transactions
curl -X POST http://localhost:3000/ask -H "Content-Type: application/json" -d '{"question": "What about TX-1001?"}'
```

Run evaluations:
```bash
npm run eval
```

## Neon Free Tier Limits

| Resource | Limit |
|----------|-------|
| Projects per organization | 100 |
| Storage per project | 1 GB |
| Compute hours per month | 100 CU-hours |
| Branches per project | 10 |
| Point-in-time recovery | 6 hours |
| Manual snapshots | 1 |

## Connection Pooling Details

Neon uses pgbouncer for connection pooling:

- **Pooled connections**: Up to 100 concurrent connections
- **Transaction pooling mode**: Connections returned to pool after each transaction
- **Prepared statements**: Disabled for pooled connections (handled in `db.ts`)
- **Idle timeout**: Configured to 10 seconds for serverless

## Auto-Suspend/Resume Behavior

### Suspend
- Triggers after **5 minutes of inactivity** (no active connections)
- Compute scales to zero
- **Zero cost** while suspended
- Storage persists (counts toward 1 GB limit)

### Resume
- Triggered by **first connection attempt**
- Resume time: **~100-500ms** (typically under 200ms)
- Transparent to application - pg client handles retry automatically
- No application code changes needed

### No Keep-Alive Required!

Unlike Supabase (which pauses after 1 week and requires manual resume), Neon's suspend/resume cycle is fully automatic. Your application will experience a slight delay (~200ms) on the first request after idle period, then normal performance.

## Troubleshooting

### "prepared statement does not exist" Error

This happens when using pooled connections with prepared statements. The `db.ts` automatically disables prepared statements for Neon connections:

```typescript
const isNeon = databaseUrl.includes('neon.tech') || databaseUrl.includes('-pooler.');

// In pool config:
...(isNeon && { allowExitOnIdle: true })
```

### Connection Timeout

If connections timeout:
1. Verify using **pooled** connection string for application
2. Check Neon project is not suspended (check console)
3. Increase `connectionTimeoutMillis` in `db.ts` if needed

### Migration Fails

1. Use **direct** connection string for migrations
2. Ensure Neon project has available compute (not suspended)
3. Check SQL syntax compatibility with PostgreSQL 16

### Out of Compute Hours

Free tier: 100 CU-hours/month
- 0.25 CU × 24 hours × 30 days = 180 CU-hours (if running 24/7)
- **Solution**: Auto-suspend saves hours when idle
- Monitor usage in Neon console

## Production Best Practices

1. **Use pooled connection** for application runtime
2. **Use direct connection** only for migrations/admin tasks
3. **Set strong JWT_SECRET** in production
4. **Monitor compute hours** in Neon dashboard
5. **Set up alerts** for storage/compute limits
6. **Use branching** for schema changes: create branch, migrate, test, then merge
7. **Enable point-in-time recovery** for disaster recovery

## Useful Commands

```bash
# Check Neon project status
neon projects list

# View compute hours usage
neon projects describe <project-id>

# Create branch for schema changes
neon branches create <project-id> --name feature/new-schema

# Run SQL on branch
neon sql --branch feature/new-schema < migration.sql

# Delete branch after merge
neon branches delete <project-id> feature/new-schema
```

## Comparison: Neon vs Supabase

| Feature | Neon | Supabase |
|---------|------|----------|
| Auto-suspend | ✅ 5 min | ❌ 1 week |
| Auto-resume | ✅ ~100ms | ❌ Manual |
| Keep-alive needed | ❌ No | ✅ Yes |
| Connection pooling | ✅ Built-in pgbouncer | ✅ Supavisor |
| Branching | ✅ 10 free | ❌ Paid |
| Free tier storage | 1 GB | 500 MB |
| Free tier compute | 100 CU-hrs | 2 GB bandwidth |
| Point-in-time recovery | 6 hours | 7 days |

**Recommendation**: Neon for serverless apps with variable traffic; Supabase for apps needing auth, storage, realtime.