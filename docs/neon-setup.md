# Neon Database Setup Guide

## Why Neon?

- **Serverless PostgreSQL**: Auto-scales to zero when idle
- **No Keep-Alive Needed**: Unlike Supabase (pauses after 1 week), Neon suspends after 5 min and resumes in ~100ms automatically
- **Free Tier**: 100 projects, 1 GB storage, 100 CU-hours/month
- **Branch & Revert**: Git-like branching for schema changes
- **Connection Pooling**: Built-in pgbouncer (use `-pooler` hostname)

## Step-by-Step Setup

### 1. Create Neon Account

1. Go to https://console.neon.tech
2. Sign up with GitHub, GitLab, or email
3. Create organization (or use personal)

### 2. Create Project

1. Click "Create Project"
2. Name: `cashback-detective` (or your choice)
4. Region: Choose closest to your users/deployment
5. PostgreSQL version: 16 (default)
6. Click "Create Project"

### 3. Get Connection Strings

After project creation, you'll see connection details:

**Pooled Connection (for Application)**
```
postgresql://user:password@ep-xxx-pooler.region.neon.tech/dbname?sslmode=require
```
- Has `-pooler` in hostname
- Uses pgbouncer connection pooling
- Max 100 connections
- **Use for DATABASE_URL in production**

**Direct Connection (for Migrations)**
```
postgresql://user:password@ep-xxx.region.neon.tech/dbname?sslmode=require
```
- No `-pooler` in hostname
- Direct to compute instance
- Supports prepared statements
- **Use for schema migrations, pg_dump, psql**

### 4. Configure Environment

```bash
# .env (development) or production environment variables
DATABASE_URL=postgresql://user:password@ep-xxx-pooler.region.neon.tech/dbname?sslmode=require
# Optional for migrations:
# DIRECT_DATABASE_URL=postgresql://user:password@ep-xxx.region.neon.tech/dbname?sslmode=require
```

### 5. Run Migrations

**Using Neon CLI (Recommended)**
```bash
# Install Neon CLI
npm i -g @neondatabase/cli

# Login
neon auth

# Run migrations using direct connection
neon sql < neon/migrations/001_initial_schema.sql --project-id your-project-id
neon sql < neon/migrations/002_seed_data.sql --project-id your-project-id
```

**Using psql (Direct Connection)**
```bash
# Schema
psql "$DIRECT_DATABASE_URL" -f neon/migrations/001_initial_schema.sql

# Seed data
psql "$DIRECT_DATABASE_URL" -f neon/migrations/002_seed_data.sql
```

**Using Node.js (Pooled Connection - Works for Both)**
```javascript
// The app's db.ts handles both pooled and direct automatically
// Just run the application - it will connect and work
npm run dev
```

### 6. Verify Connection

```bash
# Test query
psql "$DATABASE_URL" -c "SELECT * FROM merchant_policies;"

# Expected output:
 merchant_name | investigation_after_days
---------------+--------------------------
 Amazon        |                       14
 eBay          |                       21
 Walmart       |                       14
 Target        |                       14
 Best Buy      |                       30
(5 rows)
```

## Neon Behavior: Auto-Suspend/Resume

### How It Works

| Event | Behavior |
|-------|----------|
| No connections for 5 min | Compute suspends (scales to zero) |
| First connection after suspend | Auto-resumes in ~100-500ms |
| While suspended | Zero compute cost |
| Connection retry | pg client handles transparently |

### No Keep-Alive Required!

Unlike Supabase (which pauses after 1 week of inactivity and requires manual resume), Neon's suspend/resume is **fully automatic**. Your app will work after idle periods without any configuration.

### Connection String Differences

| Use Case | Connection String |
|----------|-------------------|
| Application runtime | Pooled (`-pooler`) |
| Migrations (schema changes) | Direct (no `-pooler`) |
| pg_dump / pg_restore | Direct |
| LISTEN/NOTIFY | Direct |
| Prisma/Drizzle migrations | Direct |

The app's `src/db.ts` automatically detects Neon and configures the pool appropriately:
- `max: 20` for Neon (pgbouncer handles pooling)
- `idleTimeoutMillis: 10000` (shorter for serverless)
- `allowExitOnIdle: true` (allows pool to drain)

## Free Tier Limits

| Resource | Limit |
|----------|-------|
| Projects per org | 100 |
| Storage per project | 1 GB |
| Compute hours/month | 100 CU-hours |
| Branches per project | 10 |
| Point-in-time recovery | 6 hours + 1 manual snapshot |
| Max connections (pooled) | 100 |

**Estimation**: A typical demo app with occasional use will consume ~1-5 CU-hours/month.

## Branching (Optional)

Neon supports database branching for safe schema changes:

```bash
# Create branch
neon branches create --name feature/new-schema --project-id your-project-id

# Get branch connection string
neon branches connection-string feature/new-schema --project-id your-project-id

# Test migrations on branch
psql "$BRANCH_DIRECT_URL" -f neon/migrations/003_new_feature.sql

# Promote to main when ready
neon branches promote feature/new-schema --project-id your-project-id
```

## Monitoring

- **Neon Dashboard**: https://console.neon.tech → Project → Monitoring
- **Metrics**: CPU, memory, connections, storage, compute hours
- **Logs**: Query logs, slow queries, errors

## Troubleshooting

### "prepared statement does not exist" Error

This happens when using pooled connection with prepared statements. The app disables them for Neon:

```typescript
// In src/db.ts
...(isNeon && { allowExitOnIdle: true })
```

### Connection Timeouts on First Request After Idle

First request after suspend may take 200-500ms. This is normal. Subsequent requests are fast.

### SSL Mode Issues

Always use `sslmode=require` (or `verify-full`):
```
postgresql://user:pass@ep-xxx-pooler.region.neon.tech/dbname?sslmode=require
```

### "relation does not exist" Error

Run migrations:
```bash
psql "$DIRECT_DATABASE_URL" -f neon/migrations/001_initial_schema.sql
psql "$DIRECT_DATABASE_URL" -f neon/migrations/002_seed_data.sql
```

## Migration from Local PostgreSQL

If migrating from local PostgreSQL:

1. Dump local database:
   ```bash
   pg_dump -U postgres -d cashback_detective > local_backup.sql
   ```

2. Import to Neon (using direct connection):
   ```bash
   psql "$DIRECT_DATABASE_URL" < local_backup.sql
   ```

3. Verify data:
   ```bash
   psql "$DATABASE_URL" -c "SELECT count(*) FROM transactions;"
   ```

## Security Best Practices

- Never commit connection strings to git
- Use GitHub Secrets for CI/CD
- Rotate passwords periodically in Neon dashboard
- Restrict IP access in Neon project settings (optional)
- Use read-only users for analytics/reporting