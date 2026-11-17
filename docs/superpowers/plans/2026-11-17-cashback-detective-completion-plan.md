# Cashback Detective Completion Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the Cashback Detective project with a polished frontend, Neon database migration (auto-suspend/resume - no keep-alive needed!), production deployment readiness, and enhanced features.

**Architecture:** Full-stack TypeScript application with Express backend, Vue 3 frontend, and PostgreSQL database (migrating to Neon serverless). The backend exposes REST APIs for transaction investigation with deterministic business rules and an AI agent for general queries. The frontend will provide a user-friendly interface for transaction lookup and investigation results.

**Tech Stack:**
- Backend: Node.js, TypeScript, Express 5, PostgreSQL (pg), Zod, OpenAI/Ollama
- Frontend: Vue 3, Vite, Vue Router, TypeScript
- Database: PostgreSQL (local) → **Neon serverless** (cloud, auto-suspend/resume)
- Deployment: Docker, GitHub Actions CI/CD
- Testing: Vitest, Supertest

**Spec:** This plan implements the completion of the Cashback Detective project based on the existing codebase in `src/`, `frontend/`, `evals/`, and the evaluation results in `evals/reports/`.

## Global Constraints

- All existing API contracts must remain compatible (evals must continue to pass)
- TypeScript strict mode must be maintained
- Database schema changes must be backward compatible or migrated properly
- Frontend must consume existing `/ask`, `/investigate/:id`, `/transactions` endpoints
- **Neon free tier: 100 projects, 1 GB/project, 100 CU-hours/month, auto-suspend after 5 min inactivity, auto-resume in ~100ms**
- **No keep-alive mechanism needed** - Neon handles suspend/resume automatically
- Connection pooling via Neon's built-in pgbouncer (use pooled connection string)

## Review Focus

1. **Neon connection pooling** - Use pooled connection string (`-pooler` suffix) for serverless; direct for migrations
2. **Frontend API error handling** - Network failures, 404s, validation errors must display user-friendly messages
3. **Evaluation regression** - All 16 existing eval cases must continue to pass after each change
4. **Transaction ID format validation** - Both frontend and backend must enforce TX-NNNN format consistently
5. **AI agent fallback** - When Ollama/OpenAI unavailable, general questions must still return predefined safe responses

---

### Task 1: Frontend - Create Transaction Investigation UI

**Files:**
- Create: `frontend/src/views/InvestigateView.vue`
- Create: `frontend/src/components/TransactionForm.vue`
- Create: `frontend/src/components/InvestigationResult.vue`
- Create: `frontend/src/services/api.ts`
- Modify: `frontend/src/router/index.ts`
- Modify: `frontend/src/App.vue`

**Interfaces:**
- Consumes: Backend APIs (`/ask`, `/investigate/:transactionId`, `/transactions`)
- Produces: Vue components for transaction lookup and result display

- [ ] **Step 1: Write the failing test for API service**

```typescript
// frontend/src/services/__tests__/api.test.ts
import { investigateTransaction, askQuestion, getTransactions } from '../api'

describe('api service', () => {
  it('investigateTransaction calls correct endpoint', async () => {
    const result = await investigateTransaction('TX-1001')
    expect(result.transactionId).toBe('TX-1001')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npm run test:unit -- src/services/__tests__/api.test.ts`
Expected: FAIL - module not found

- [ ] **Step 3: Implement `api.ts` with typed API client**

```typescript
// frontend/src/services/api.ts
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

export interface InvestigationResult {
  transactionId: string
  status: string
  decision: string
  message: string
  nextAction: string
  evidence: {
    purchaseAmount: number
    expectedCashback: number
    daysSincePurchase: number
    investigationAfterDays: number | null
  }
}

export async function investigateTransaction(id: string): Promise<InvestigationResult> {
  const res = await fetch(`${API_BASE}/investigate/${id}`)
  if (!res.ok) throw new Error('Transaction not found')
  return res.json()
}

export async function askQuestion(question: string) {
  const res = await fetch(`${API_BASE}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question })
  })
  return res.json()
}

export async function getTransactions() {
  const res = await fetch(`${API_BASE}/transactions`)
  return res.json()
}
```

- [ ] **Step 4: Create InvestigationView with transaction form and result display**

```vue
<!-- frontend/src/views/InvestigateView.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { investigateTransaction, askQuestion } from '@/services/api'
import TransactionForm from '@/components/TransactionForm.vue'
import InvestigationResult from '@/components/InvestigationResult.vue'

const transactionId = ref('')
const result = ref<InvestigationResult | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

async function handleInvestigate(id: string) {
  loading.value = true
  error.value = null
  try {
    result.value = await investigateTransaction(id.toUpperCase())
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to investigate'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="investigate-container">
    <h1>Cashback Detective</h1>
    <TransactionForm @submit="handleInvestigate" :loading="loading" />
    <div v-if="error" class="error">{{ error }}</div>
    <InvestigationResult v-if="result" :data="result" />
  </div>
</template>
```

- [ ] **Step 5: Create TransactionForm component**

```vue
<!-- frontend/src/components/TransactionForm.vue -->
<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ loading: boolean }>()
defineEmits<{ submit: [id: string] }>()

const input = ref('')

function handleSubmit(e: Event) {
  e.preventDefault()
  const id = input.value.trim().toUpperCase()
  if (/^TX-\d{4}$/.test(id)) {
    emit('submit', id)
  }
}
</script>

<template>
  <form @submit="handleSubmit" class="transaction-form">
    <input
      v-model="input"
      placeholder="Enter Transaction ID (e.g., TX-1001)"
      pattern="TX-\d{4}"
      required
      :disabled="loading"
    />
    <button type="submit" :disabled="loading || !input.trim()">
      {{ loading ? 'Investigating...' : 'Investigate' }}
    </button>
  </form>
</template>
```

- [ ] **Step 6: Create InvestigationResult component**

```vue
<!-- frontend/src/components/InvestigationResult.vue -->
<script setup lang="ts">
interface Evidence {
  purchaseAmount: number
  expectedCashback: number
  daysSincePurchase: number
  investigationAfterDays: number | null
}

interface Props {
  data: {
    transactionId: string
    status: string
    decision: string
    message: string
    nextAction: string
    evidence: Evidence
  }
}

defineProps<Props>()
</script>

<template>
  <div class="investigation-result">
    <div class="decision-badge" :class="data.decision">{{ data.decision }}</div>
    <p class="message">{{ data.message }}</p>
    <p class="next-action"><strong>Next:</strong> {{ data.nextAction }}</p>
    <div class="evidence">
      <h3>Evidence</h3>
      <dl>
        <dt>Purchase Amount</dt><dd>${{ data.evidence.purchaseAmount.toLocaleString() }}</dd>
        <dt>Expected Cashback</dt><dd>${{ data.evidence.expectedCashback.toLocaleString() }}</dd>
        <dt>Days Since Purchase</dt><dd>{{ data.evidence.daysSincePurchase }}</dd>
        <dt>Investigation Threshold</dt><dd>{{ data.evidence.investigationAfterDays ?? 'N/A' }} days</dd>
      </dl>
    </div>
  </div>
</template>
```

- [ ] **Step 7: Update router and App.vue**

```typescript
// frontend/src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import InvestigateView from '@/views/InvestigateView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'investigate', component: InvestigateView },
    { path: '/transactions', name: 'transactions', component: () => import('@/views/TransactionsView.vue') },
    { path: '/ask', name: 'ask', component: () => import('@/views/AskView.vue') }
  ]
})
```

- [ ] **Step 8: Run tests and verify**

Run: `cd frontend && npm run test:unit`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add frontend/src/views/InvestigateView.vue frontend/src/components/TransactionForm.vue frontend/src/components/InvestigationResult.vue frontend/src/services/api.ts frontend/src/router/index.ts frontend/src/App.vue
git commit -m "feat: add transaction investigation frontend UI"
```

---

### Task 2: Frontend - Add Transactions List View

**Files:**
- Create: `frontend/src/views/TransactionsView.vue`
- Create: `frontend/src/components/TransactionTable.vue`
- Test: `frontend/src/views/__tests__/TransactionsView.test.ts`

**Interfaces:**
- Consumes: `getTransactions()` from api.ts
- Produces: Paginated transaction table with status badges

- [ ] **Step 1: Write failing test for TransactionsView**

- [ ] **Step 2: Implement TransactionsView with table component**

- [ ] **Step 3: Add pagination, sorting, filtering**

- [ ] **Step 4: Run tests and commit**

---

### Task 3: Frontend - Add Ask/Chat View

**Files:**
- Create: `frontend/src/views/AskView.vue`
- Create: `frontend/src/components/ChatInterface.vue`
- Test: `frontend/src/views/__tests__/AskView.test.ts`

**Interfaces:**
- Consumes: `askQuestion()` from api.ts
- Produces: Chat-style interface for general questions

- [ ] **Step 1: Write failing test**

- [ ] **Step 2: Implement chat interface with message history**

- [ ] **Step 3: Add transaction ID detection and auto-investigate**

- [ ] **Step 4: Run tests and commit**

---

### Task 4: Database - Create Neon Migration Scripts

**Files:**
- Create: `neon/migrations/001_initial_schema.sql`
- Create: `neon/migrations/002_seed_data.sql`
- Create: `neon/config.toml` (optional, for Neon CLI)
- Modify: `src/db.ts` (support both local and Neon)

**Interfaces:**
- Consumes: Existing PostgreSQL schema from repository.ts
- Produces: Neon-compatible schema (standard PostgreSQL, no RLS needed for demo)

- [ ] **Step 1: Write failing test - verify schema matches**

```sql
-- neon/migrations/001_initial_schema.sql
CREATE TABLE IF NOT EXISTS merchant_policies (
  merchant_name TEXT PRIMARY KEY,
  investigation_after_days INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY CHECK (id ~ '^TX-[0-9]{4}$'),
  user_id TEXT NOT NULL CHECK (user_id ~ '^USER-\d+$'),
  merchant_name TEXT NOT NULL REFERENCES merchant_policies(merchant_name),
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  cashback_amount NUMERIC(12,2) NOT NULL CHECK (cashback_amount >= 0),
  days_since_purchase INTEGER NOT NULL CHECK (days_since_purchase >= 0 AND days_since_purchase <= 36500),
  status TEXT NOT NULL CHECK (status IN ('pending','canceled','returned','credited')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_merchant ON transactions(merchant_name);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
```

- [ ] **Step 2: Create seed data migration**

```sql
-- neon/migrations/002_seed_data.sql
INSERT INTO merchant_policies (merchant_name, investigation_after_days) VALUES
  ('Amazon', 14),
  ('eBay', 21),
  ('Walmart', 14),
  ('Target', 14),
  ('Best Buy', 30)
ON CONFLICT (merchant_name) DO UPDATE SET investigation_after_days = EXCLUDED.investigation_after_days;

INSERT INTO transactions (id, user_id, merchant_name, amount, cashback_amount, days_since_purchase, status) VALUES
  ('TX-1001', 'USER-1', 'Amazon', 150.00, 7.50, 5, 'pending'),
  ('TX-1002', 'USER-1', 'eBay', 200.00, 10.00, 20, 'pending'),
  ('TX-1003', 'USER-2', 'Walmart', 75.00, 3.75, 10, 'canceled'),
  ('TX-1004', 'USER-3', 'Target', 300.00, 15.00, 30, 'credited')
ON CONFLICT (id) DO NOTHING;
```

- [ ] **Step 3: Update db.ts for Neon (pooled vs direct connections)**

```typescript
// src/db.ts
import "dotenv/config";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is missing from .env");
}

// Detect Neon: check for neon.tech or pooler in URL
const isNeon = databaseUrl.includes('neon.tech') || databaseUrl.includes('-pooler.');

// Neon uses pgbouncer for pooling - use pooled connection for app, direct for migrations
// The pooled connection string has "-pooler" in the hostname
export const pool = new Pool({
  connectionString: databaseUrl,
  max: isNeon ? 20 : 10, // Neon supports more connections via pgbouncer
  idleTimeoutMillis: isNeon ? 10000 : 30000, // Shorter idle timeout for serverless
  connectionTimeoutMillis: 10000,
  // Neon/pgbouncer: disable prepared statements to avoid "prepared statement does not exist" errors
  ...(isNeon && { allowExitOnIdle: true })
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error:", error.message);
});

export async function checkDatabaseConnection(): Promise<void> {
  const result = await pool.query("SELECT NOW() AS current_time");
  console.log("Connected to PostgreSQL:", result.rows[0].current_time);
}
```

- [ ] **Step 4: Test migration locally with Neon CLI or direct connection**

Run: `psql "$DATABASE_URL" -f neon/migrations/001_initial_schema.sql && psql "$DATABASE_URL" -f neon/migrations/002_seed_data.sql`
Expected: Tables created, seed data inserted

- [ ] **Step 5: Run evals against Neon database**

Run: `DATABASE_URL=<your-neon-connection-string> npm run eval`
Expected: All 16 tests pass

- [ ] **Step 6: Commit**

```bash
git add neon/ src/db.ts
git commit -m "feat: add Neon migration scripts and configuration"
```

---

### Task 5: Database - Neon Auto-Suspend/Resume (NO KEEP-ALIVE NEEDED!)

**Key Finding:** Neon automatically suspends after 5 minutes of inactivity and resumes in ~100ms on first connection. **No keep-alive mechanism is required!** This is a major advantage over Supabase.

**Files:**
- Create: `docs/neon-behavior.md` (documentation)
- Modify: `src/db.ts` (already handles Neon in Task 4)

**Verification:**
- [ ] **Step 1: Document Neon behavior for the team**

```markdown
# docs/neon-behavior.md
## Neon Free Tier Behavior

### Auto-Suspend
- Computes suspend after **5 minutes of inactivity**
- No connections = scale to zero
- **Zero cost** while suspended

### Auto-Resume
- First connection after suspend triggers resume
- Resume time: **~100-500ms** (typically under 200ms)
- Transparent to application - pg client handles retry

### Connection Strings
- **Pooled (for app):** `postgres://user:pass@ep-xxx-pooler.region.neon.tech/db?sslmode=require`
  - Uses pgbouncer, max 100 connections
  - Use for application runtime
- **Direct (for migrations):** `postgres://user:pass@ep-xxx.region.neon.tech/db?sslmode=require`
  - Direct to compute, supports prepared statements
  - Use for schema changes, pg_dump, LISTEN/NOTIFY

### Free Tier Limits
- 100 projects per organization
- 1 GB storage per project
- 100 compute-hours (CU-hours) per month
- 10 branches per project
- Point-in-time recovery: 6 hours + 1 manual snapshot

### No Keep-Alive Needed!
Unlike Supabase (pauses after 1 week, manual resume), Neon's suspend/resume is fully automatic.
```

- [ ] **Step 2: Verify auto-resume works in testing**

Run evals against Neon after letting it sit idle for 10+ minutes
Expected: First request may take ~200ms longer, subsequent requests normal speed

- [ ] **Step 3: Commit**

```bash
git add docs/neon-behavior.md
git commit -m "docs: document Neon auto-suspend/resume behavior"
```

---

### Task 6: Deployment - Dockerize Application

**Files:**
- Create: `Dockerfile`
- Create: `docker-compose.yml`
- Create: `docker-compose.prod.yml`
- Create: `.dockerignore`
- Modify: `package.json` (add build script)

**Interfaces:**
- Consumes: Node.js 22+, all dependencies
- Produces: Multi-stage Docker image for production

- [ ] **Step 1: Create optimized Dockerfile**

```dockerfile
# Dockerfile
FROM node:22-alpine AS base
WORKDIR /app

# Install dependencies only when needed
FROM base AS deps
COPY package*.json ./
RUN npm ci

# Build frontend
FROM base AS frontend-builder
COPY --from=deps /app/node_modules ./node_modules
COPY frontend ./frontend
WORKDIR /app/frontend
RUN npm ci && npm run build

# Build backend
FROM base AS backend-builder
COPY --from=deps /app/node_modules ./node_modules
COPY src ./src
COPY tsconfig.json ./
COPY package*.json ./
RUN npm run build

# Production image
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=backend-builder /app/dist ./dist
COPY --from=backend-builder /app/node_modules ./node_modules
COPY --from=backend-builder /app/package.json ./
COPY --from=frontend-builder /app/frontend/dist ./public

EXPOSE 3000
CMD ["node", "dist/server.js"]
```

- [ ] **Step 2: Create docker-compose for development (with local Postgres)**

```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: cashback_detective
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: .
      dockerfile: Dockerfile
      target: backend-builder
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/cashback_detective
      PORT: 3000
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - .:/app
      - /app/node_modules

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "5173:5173"
    environment:
      VITE_API_BASE: http://localhost:3000
    volumes:
      - ./frontend:/app
      - /app/node_modules

volumes:
  postgres_data:
```

- [ ] **Step 3: Create production docker-compose (uses Neon via env var)**

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: runner
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: ${DATABASE_URL}
      PORT: 3000
      NODE_ENV: production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
```

- [ ] **Step 4: Add .dockerignore**

```
node_modules
dist
.git
.gitignore
README.md
.env
.env.local
*.log
coverage
.vscode
.idea
Dockerfile
docker-compose*.yml
```

- [ ] **Step 5: Test Docker build locally**

Run: `docker compose up --build`
Expected: All services healthy, API accessible at localhost:3000

- [ ] **Step 6: Run evals in Docker**

Run: `docker compose exec backend npm run eval`
Expected: All 16 tests pass

- [ ] **Step 7: Commit**

```bash
git add Dockerfile docker-compose.yml docker-compose.prod.yml .dockerignore
git commit -m "feat: add Docker configuration for development and production"
```

---

### Task 7: Deployment - CI/CD Pipeline

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `.github/workflows/cd.yml`
- Create: `.github/workflows/eval.yml`

**Interfaces:**
- Consumes: GitHub Actions, Docker Hub/registry, deployment target
- Produces: Automated testing, building, and deployment

- [ ] **Step 1: Create CI workflow**

```yaml
# .github/workflows/ci.yml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      - run: npm ci
      - run: npm run test
      - run: cd frontend && npm ci && npm run lint

  eval:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: cashback_detective
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
        ports: ['5432:5432']
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      - run: npm ci
      - name: Run evals
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/cashback_detective
        run: npm run eval
```

- [ ] **Step 2: Create CD workflow (deploy to Render/Fly.io/Railway/Vercel)**

```yaml
# .github/workflows/cd.yml
name: Deploy
on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to production
        # Add your deployment provider steps here
        # Example for Render:
        # run: curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK }}
        # Example for Fly.io:
        # uses: superfly/flyctl-actions@setup-flyctl
        # run: flyctl deploy --remote-only
```

- [ ] **Step 3: Create eval-only workflow for scheduled runs**

```yaml
# .github/workflows/eval.yml
name: Scheduled Evaluation
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
  workflow_dispatch:

jobs:
  eval:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: cashback_detective
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
        ports: ['5432:5432']
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      - run: npm ci
      - name: Run evals
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/cashback_detective
        run: npm run eval
```

- [ ] **Step 4: Test CI pipeline**

Push to GitHub and verify all workflows pass

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/
git commit -m "feat: add CI/CD pipelines for testing, evaluation, and deployment"
```

---

### Task 8: Enhanced Features - Authentication & Rate Limiting

**Files:**
- Create: `src/auth.ts`
- Create: `src/middleware/rateLimit.ts`
- Create: `src/middleware/auth.ts`
- Modify: `src/app.ts` (apply middleware)
- Modify: `package.json` (add dependencies)

**Interfaces:**
- Consumes: Express request/response, environment variables
- Produces: JWT-based auth, rate-limited endpoints

- [ ] **Step 1: Add dependencies**

Run: `npm install jsonwebtoken express-rate-limit @types/jsonwebtoken`

- [ ] **Step 2: Implement JWT authentication**

```typescript
// src/auth.ts
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";
const JWT_EXPIRES = "7d";

export interface TokenPayload {
  userId: string;
  role: "user" | "admin";
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}
```

- [ ] **Step 3: Implement rate limiting**

```typescript
// src/middleware/rateLimit.ts
import rateLimit from "express-rate-limit";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute for sensitive endpoints
  message: { error: "Rate limit exceeded for this endpoint." },
});
```

- [ ] **Step 4: Apply middleware in app.ts**

```typescript
// src/app.ts (additions)
import { apiLimiter, strictLimiter } from "./middleware/rateLimit.js";
import { verifyToken } from "./auth.js";

app.use(apiLimiter);
app.use("/investigate", strictLimiter);
app.use("/transactions", strictLimiter);

// Optional: Protected routes
app.get("/admin/*", (req, res, next) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const payload = token ? verifyToken(token) : null;
  if (!payload || payload.role !== "admin") {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
});
```

- [ ] **Step 5: Test rate limiting**

Run: `npm run dev` and hit endpoints rapidly
Expected: 429 responses after limits exceeded

- [ ] **Step 6: Run evals to ensure no regression**

Run: `npm run eval`
Expected: All 16 tests pass (adjust expected status codes if needed)

- [ ] **Step 7: Commit**

```bash
git add src/auth.ts src/middleware/ src/app.ts package.json
git commit -m "feat: add authentication and rate limiting middleware"
```

---

### Task 9: Enhanced Features - Logging & Observability

**Files:**
- Create: `src/logger.ts`
- Create: `src/middleware/requestLogger.ts`
- Modify: `src/app.ts`, `src/server.ts`
- Modify: `package.json` (add pino dependencies)

**Interfaces:**
- Consumes: Application events, errors, requests
- Produces: Structured JSON logs, health metrics

- [ ] **Step 1: Add pino logger**

Run: `npm install pino pino-pretty`

- [ ] **Step 2: Implement structured logging**

```typescript
// src/logger.ts
import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: process.env.NODE_ENV !== "production" ? {
    target: "pino-pretty",
    options: { colorize: true }
  } : undefined,
  base: { service: "cashback-detective" }
});
```

- [ ] **Step 3: Add request logging middleware**

```typescript
// src/middleware/requestLogger.ts
import { logger } from "../logger.js";

export function requestLogger(req, res, next) {
  const start = Date.now();
  res.on("finish", () => {
    logger.info({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: Date.now() - start,
      ip: req.ip
    }, "HTTP Request");
  });
  next();
}
```

- [ ] **Step 4: Integrate in app.ts and server.ts**

- [ ] **Step 5: Add health check metrics**

- [ ] **Step 6: Commit**

---

### Task 10: Final Integration Testing & Documentation

**Files:**
- Modify: `README.md`
- Create: `docs/deployment.md`
- Create: `docs/api.md`
- Create: `docs/neon-setup.md`
- Test: Full end-to-end test

**Interfaces:**
- Consumes: All previous tasks
- Produces: Production-ready application with documentation

- [ ] **Step 1: Update README with setup instructions**

```markdown
# Cashback Detective

## Quick Start

### Local Development
```bash
# Backend
npm install
cp .env.example .env
# Edit .env with your DATABASE_URL
npm run dev

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

### Docker
```bash
docker compose up --build
```

### Neon Setup
1. Create Neon project at https://console.neon.tech
2. Copy **pooled** connection string (has `-pooler` in hostname)
3. Set DATABASE_URL in .env
4. Run migrations: `psql "$DATABASE_URL" -f neon/migrations/001_initial_schema.sql && psql "$DATABASE_URL" -f neon/migrations/002_seed_data.sql`
5. **No keep-alive needed!** Auto-suspend/resume is automatic.
```

- [ ] **Step 2: Create API documentation**

- [ ] **Step 3: Create deployment guide**

- [ ] **Step 4: Create Neon-specific setup guide**

- [ ] **Step 5: Run full test suite**

Run: `npm run test && npm run eval && cd frontend && npm run test:unit`
Expected: All tests pass

- [ ] **Step 6: Test production Docker image**

Run: `docker compose -f docker-compose.prod.yml up --build`
Expected: Application runs, all endpoints work

- [ ] **Step 7: Commit**

```bash
git add README.md docs/
git commit -m "docs: add comprehensive documentation and deployment guides"
```

---

## Execution Order Summary

| Phase | Tasks | Dependencies |
|-------|-------|--------------|
| 1. Frontend | 1, 2, 3 | None (can start immediately) |
| 2. Database | 4, 5 | Task 1 (for testing) |
| 3. Deployment | 6, 7 | Task 4, 5 |
| 4. Enhanced | 8, 9 | Task 6 |
| 5. Final | 10 | All above |

## Risk Mitigation

1. **Neon auto-suspend**: Zero risk - auto-resumes in ~100ms, no keep-alive needed
2. **Eval regression**: Run evals after every task
3. **Frontend-backend mismatch**: Shared TypeScript types via API service
4. **Docker build failures**: Multi-stage build with cached dependencies
5. **Secret management**: Use GitHub Secrets, never commit .env
6. **Neon pgbouncer prepared statements**: Disabled in db.ts for Neon connections

## Success Criteria

- ✅ All 16 evaluation cases pass (100% pass rate maintained)
- ✅ Frontend loads and can investigate transactions
- ✅ Neon database connected (auto-suspend/resume verified)
- ✅ Docker image builds and runs in production mode
- ✅ CI/CD pipeline passes on main branch
- ✅ Rate limiting and logging functional
- ✅ Documentation complete for deployment
- ✅ **No keep-alive mechanism needed** (Neon advantage!)