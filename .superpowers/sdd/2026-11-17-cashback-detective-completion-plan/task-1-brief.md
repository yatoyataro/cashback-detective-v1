# Task 1 Brief: Frontend - Create Transaction Investigation UI

## Context
This is Task 1 of the Cashback Detective completion plan. The project has a working Express/TypeScript backend with endpoints for transaction investigation, but the Vue 3 frontend is just a starter template. This task creates the main investigation UI.

## Files to Create/Modify

### New Files:
1. `frontend/src/services/api.ts` - Typed API client for backend communication
2. `frontend/src/services/__tests__/api.test.ts` - Unit tests for API service
3. `frontend/src/components/TransactionForm.vue` - Transaction ID input form with validation
4. `frontend/src/components/InvestigationResult.vue` - Investigation result display component
5. `frontend/src/views/InvestigateView.vue` - Main investigation page view

### Modified Files:
6. `frontend/src/router/index.ts` - Add routes for investigate, transactions, ask
7. `frontend/src/App.vue` - Update to use new layout

## Interfaces

### API Service (`api.ts`)
```typescript
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

export async function investigateTransaction(id: string): Promise<InvestigationResult>
export async function askQuestion(question: string): Promise<any>
export async function getTransactions(): Promise<any>
```

### TransactionForm Props/Emits
- Props: `loading: boolean`
- Emits: `submit: [id: string]`
- Validates: TX-NNNN format (regex: `/^TX-\d{4}$/`)

### InvestigationResult Props
- `data: InvestigationResult` (from API)

## Global Constraints (MUST FOLLOW)
- All existing API contracts must remain compatible (evals must continue to pass)
- TypeScript strict mode must be maintained
- Frontend must consume existing `/ask`, `/investigate/:id`, `/transactions` endpoints
- Transaction ID format validation: both frontend and backend must enforce TX-NNNN format consistently
- Vitest for testing
- Vue 3 Composition API with `<script setup>`

## Test Requirements
- Write failing test first for `api.ts`
- Run: `cd frontend && npm run test:unit -- src/services/__tests__/api.test.ts`
- Expected: FAIL - module not found
- After implementation: Run `cd frontend && npm run test:unit` - Expected: PASS
- Run root evals: `npm run eval` - All 16 must pass

## Backend Endpoints (Already Working)
- `GET /investigate/:transactionId` - Returns InvestigationResult or 404
- `POST /ask` - Accepts `{ question: string }`, returns answer with source
- `GET /transactions` - Returns list of all transactions
- `GET /health` - Health check

## Acceptance Criteria
1. User can enter TX-1001, TX-1002, TX-1003, TX-1004 and see investigation results
2. Form validates TX-NNNN format
3. Error handling for invalid IDs and network errors
4. Loading states during API calls
5. All frontend tests pass
6. All backend evals still pass (100%)