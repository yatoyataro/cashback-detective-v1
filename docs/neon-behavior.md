# Neon Free Tier Behavior

## Auto-Suspend
- Computes suspend after **5 minutes of inactivity**
- No connections = scale to zero
- **Zero cost** while suspended

## Auto-Resume
- First connection after suspend triggers resume
- Resume time: **~100-500ms** (typically under 200ms)
- Transparent to application - pg client handles retry

## Connection Strings
- **Pooled (for app):** `postgres://user:pass@ep-xxx-pooler.region.neon.tech/db?sslmode=require`
  - Uses pgbouncer, max 100 connections
  - Use for application runtime
- **Direct (for migrations):** `postgres://user:pass@ep-xxx.region.neon.tech/db?sslmode=require`
  - Direct to compute, supports prepared statements
  - Use for schema changes, pg_dump, LISTEN/NOTIFY

## Free Tier Limits
- 100 projects per organization
- 1 GB storage per project
- 100 compute-hours (CU-hours) per month
- 10 branches per project
- Point-in-time recovery: 6 hours + 1 manual snapshot

## No Keep-Alive Needed!
Unlike Supabase (pauses after 1 week, manual resume), Neon's suspend/resume is fully automatic.

## Implementation Notes
The `src/db.ts` file automatically detects Neon connections and:
1. Uses higher connection pool limits (20 vs 10) since pgbouncer handles pooling
2. Sets shorter idle timeout (10s vs 30s) for serverless efficiency
3. Enables `allowExitOnIdle: true` to allow process exit when idle (important for serverless)
4. Disables prepared statements automatically via pgbouncer compatibility