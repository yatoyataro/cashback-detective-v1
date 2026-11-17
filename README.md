# Cashback Detective

A demo application for investigating fictional cashback transactions. Built with Express 5, Vue 3, TypeScript, and PostgreSQL (Neon serverless).

## Features

- **Transaction Investigation**: Check cashback status for transactions (TX-1001 to TX-1004)
- **Chat Interface**: Ask general questions about cashback policies
- **Transaction List**: View all demo transactions in a paginated table
- **Secure by Default**: HTTPS enforcement, CSRF protection, secure cookies, rate limiting, helmet security headers
- **Production Ready**: JWT authentication, structured logging, Docker support, CI/CD pipelines

## Tech Stack

- **Backend**: Node.js 22, TypeScript, Express 5, PostgreSQL (pg), Zod, JWT, Pino logging
- **Frontend**: Vue 3, Vite, Vue Router, TypeScript, Vitest
- **Database**: Neon serverless PostgreSQL (auto-suspend/resume, no keep-alive needed)
- **Deployment**: Docker, GitHub Actions CI/CD

## Quick Start

### Local Development

```bash
# Backend
npm install
cp .env.example .env
# Edit .env with your DATABASE_URL (local PostgreSQL or Neon pooled connection)
npm run dev

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

### Docker Development

```bash
docker compose up --build
```
- Backend: http://localhost:3000
- Frontend: http://localhost:5173
- PostgreSQL: localhost:5432

### Production with Neon

```bash
# 1. Create Neon project at https://console.neon.tech
# 2. Copy POOLED connection string (has -pooler in hostname)
# 3. Set DATABASE_URL in .env or environment
# 4. Run migrations:
psql "$DATABASE_URL" -f neon/migrations/001_initial_schema.sql
psql "$DATABASE_URL" -f neon/migrations/002_seed_data.sql

# 5. Deploy using docker-compose.prod.yml
docker compose -f docker-compose.prod.yml up --build
```

**No keep-alive needed!** Neon auto-suspends after 5 min inactivity and resumes in ~100ms automatically.

## Project Structure

```
cashback-detective/
├── src/                    # Backend source
│   ├── app.ts             # Express app with all routes
│   ├── server.ts          # Entry point
│   ├── cashback.ts        # Business logic for investigation
│   ├── repository.ts      # Database queries
│   ├── db.ts              # Neon-compatible pg pool
│   ├── auth.ts            # JWT authentication
│   ├── logger.ts          # Pino structured logging
│   ├── config/env.ts      # Environment validation
│   ├── auth/              # Auth utilities (password, cookies, CSRF)
│   └── middleware/        # Security, rate limiting, logging
├── frontend/              # Vue 3 frontend
│   ├── src/
│   │   ├── views/         # Page components (Investigate, Transactions, Ask)
│   │   ├── components/    # Reusable components
│   │   ├── services/      # API client
│   │   └── router/        # Vue Router config
│   └── ...
├── neon/
│   └── migrations/        # SQL migrations for Neon
├── evals/                 # Evaluation test suite (16 cases)
├── tests/                 # Unit & integration tests
├── .github/workflows/     # CI/CD pipelines
├── Dockerfile             # Multi-stage Docker build
├── docker-compose.yml     # Local development
└── docker-compose.prod.yml # Production
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/investigate/:transactionId` | Investigate a transaction |
| POST | `/ask` | Ask a question (general or transaction-specific) |
| GET | `/transactions` | List all transactions |
| POST | `/transactions` | Create a demo transaction |
| GET | `/admin` | Admin endpoint (requires admin JWT) |

## Environment Variables

See `.env.example` for all options.

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (Neon pooled for production) |
| `JWT_SECRET` | Yes | JWT signing secret (32+ chars in production) |
| `PORT` | No | Server port (default: 3000) |
| `NODE_ENV` | No | `development` or `production` |
| `LOG_LEVEL` | No | `debug`, `info`, `warn`, `error` |
| `OLLAMA_MODEL` | No | Ollama model for AI questions |
| `ENABLE_AI_GENERAL_QUESTIONS` | No | Enable AI responses (`true`/`false`) |

## Testing

```bash
# Backend tests
npm run test

# Frontend tests
cd frontend && npm run test:unit

# Evaluation suite (16 cases)
npm run eval
```

## Neon Free Tier Limits

- 100 projects per organization
- 1 GB storage per project
- 100 compute-hours (CU-hours) per month
- Auto-suspend after 5 min inactivity
- Auto-resume in ~100ms
- 10 branches per project
- Point-in-time recovery: 6 hours + 1 manual snapshot

## License

ISC