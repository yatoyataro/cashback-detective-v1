// API base URL - uses relative paths so Vercel rewrites route to backend service
// In development, Vite proxy handles /investigate, /transactions, /ask -> localhost:3000
// In production (Vercel), rewrites in vercel.json handle routing to backend service
const API_BASE = import.meta.env.VITE_API_BASE || ''

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

export interface AskResult {
  answer: string
  investigation: InvestigationResult | null
  answerSource: 'rules_engine' | 'predefined'
}

export interface TransactionsResult {
  count: number
  transactions: Array<{
    id: string
    merchant: string
    amount: number
    cashbackAmount: number
    daysSincePurchase: number
    status: string
    userId: string
  }>
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const message = errorData.error || `Request failed with status ${response.status}`
    throw new Error(message)
  }
  return response.json()
}

function getHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json'
  }
}

export async function investigateTransaction(id: string): Promise<InvestigationResult> {
  const response = await fetch(`${API_BASE}/investigate/${id}`, {
    method: 'GET',
    headers: getHeaders(),
    credentials: 'include'
  })
  return handleResponse<InvestigationResult>(response)
}

export async function askQuestion(question: string): Promise<AskResult> {
  const response = await fetch(`${API_BASE}/ask`, {
    method: 'POST',
    headers: getHeaders(),
    credentials: 'include',
    body: JSON.stringify({ question })
  })
  return handleResponse<AskResult>(response)
}

export async function getTransactions(): Promise<TransactionsResult> {
  const response = await fetch(`${API_BASE}/transactions/`, {
    method: 'GET',
    headers: getHeaders(),
    credentials: 'include'
  })
  return handleResponse<TransactionsResult>(response)
}