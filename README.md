# Cashback Detective

A full-stack TypeScript application for investigating fictional cashback transactions. Built with Express 5, Vue 3, and PostgreSQL (Neon serverless).

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
4. Run migrations:
   ```bash
   psql "$DATABASE_URL" -f neon/migrations/001_initial_schema.sql
   psql "$DATABASE_URL" -f neon/migrations/002_seed_data.sql
   ```
5. **No keep-alive needed!** Auto-suspend/resume is automatic.

## Project Structure

```
├── src/                    # Backend source
│   ├── app.ts             # Express app with routes
│   ├── server.ts          # Server entry point
│   ├── db.ts              # Database connection (Neon-aware)
│   ├── cashback.ts        # Business logic for cashback investigation
│   ├── repository.ts      # Database queries
│   ├── data.ts            # TypeScript interfaces
│   ├── agent.ts           # AI agent for general queries
│   ├── agent-tools.ts     # Agent tool definitions
│   ├── auth.ts            # JWT authentication
│   ├── logger.ts          # Structured logging (pino)
│   └── middleware/        # Express middleware
│       ├── rateLimit.ts   # Rate limiting
│       ├── auth.ts        # Auth middleware
│       └── requestLogger.ts # Request logging
├── frontend/              # Vue 3 frontend
│   ├── src/
│   │   ├── views/         # Page components
│   │   ├── components/    # Reusable components
│   │   ├── services/      # API client
│   │   └── router/        # Vue Router
│   └── ...
├── neon/
│   └── migrations/        # SQL migrations
├── evals/                 # Evaluation tests
│   ├── run.ts             # Evaluation runner
│   └── cases.json         # Test cases
├── .github/workflows/     # CI/CD pipelines
├── Dockerfile             # Multi-stage Docker build
├── docker-compose.yml     # Development with local Postgres
├── docker-compose.prod.yml # Production with Neon
└── docs/                  # Documentation
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/transactions` | List all transactions |
| POST | `/transactions` | Create new transaction |
| GET | `/investigate/:transactionId` | Investigate transaction |
| POST | `/ask` | Ask general question or investigate by TX-ID |
| GET | `/admin/*` | Admin-only routes (requires JWT) |

## Transaction ID Format

All transaction IDs must follow the format `TX-NNNN` (e.g., `TX-1001`).

## Demo Data

The seed data includes:
- 5 merchant policies (Amazon, eBay, Walmart, Target, Best Buy)
- 4 demo transactions (TX-1001 through TX-1004)

## Evaluation

Run the evaluation suite against a running server:

```bash
npm run eval
```

Or with custom URL:
```bash
EVAL_BASE_URL=http://localhost:3000 npm run eval
```

The evaluation tests 16 cases across:
- Transaction decision logic
- Error handling
- Safe responses

## Deployment

See [docs/deployment.md](docs/deployment.md) for detailed deployment instructions.

## Neon Advantages

- **Auto-suspend**: After 5 minutes of inactivity, compute scales to zero (zero cost)
- **Auto-resume**: First connection triggers resume in ~100-500ms (typically under 200ms)
- **No keep-alive needed**: Unlike Supabase, Neon handles suspend/resume automatically
- **Connection pooling**: Built-in pgbouncer with pooled connection strings

## License

ISC