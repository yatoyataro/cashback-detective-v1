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

export async function investigateTransaction(id: string): Promise<InvestigationResult> {
  const response = await fetch(`${API_BASE}/investigate/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  return handleResponse<InvestigationResult>(response)
}

export async function askQuestion(question: string): Promise<AskResult> {
  const response = await fetch(`${API_BASE}/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ question })
  })
  return handleResponse<AskResult>(response)
}

export async function getTransactions(): Promise<TransactionsResult> {
  const response = await fetch(`${API_BASE}/transactions`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  return handleResponse<TransactionsResult>(response)
}