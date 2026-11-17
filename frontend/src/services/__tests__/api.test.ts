import { describe, it, expect, vi, beforeEach } from 'vitest'
import { investigateTransaction, askQuestion, getTransactions } from '../api'

// Mock fetch globally
global.fetch = vi.fn()

describe('api service', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('investigateTransaction', () => {
    it('should call investigate endpoint with correct transaction ID', async () => {
      const mockResult = {
        transactionId: 'TX-1001',
        status: 'pending',
        decision: 'investigation_eligible',
        message: 'Test message',
        nextAction: 'Test action',
        evidence: {
          purchaseAmount: 100,
          expectedCashback: 10,
          daysSincePurchase: 30,
          investigationAfterDays: 14
        }
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult
      })

      const result = await investigateTransaction('TX-1001')

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/investigate/TX-1001',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      )
      expect(result).toEqual(mockResult)
    })

    it('should throw error for invalid transaction ID format', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid transaction ID format. Use TX-1001.' })
      })

      await expect(investigateTransaction('INVALID')).rejects.toThrow('Invalid transaction ID format')
    })

    it('should throw error for transaction not found', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Transaction not found.' })
      })

      await expect(investigateTransaction('TX-9999')).rejects.toThrow('Transaction not found')
    })

    it('should throw error on network failure', async () => {
      ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

      await expect(investigateTransaction('TX-1001')).rejects.toThrow('Network error')
    })
  })

  describe('askQuestion', () => {
    it('should call ask endpoint with question', async () => {
      const mockResult = {
        answer: 'Test answer',
        investigation: null,
        answerSource: 'predefined'
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult
      })

      const result = await askQuestion('What is Cashback Detective?')

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/ask',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({ question: 'What is Cashback Detective?' })
        })
      )
      expect(result).toEqual(mockResult)
    })

    it('should throw error on network failure', async () => {
      ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

      await expect(askQuestion('Test')).rejects.toThrow('Network error')
    })
  })

  describe('getTransactions', () => {
    it('should call transactions endpoint', async () => {
      const mockResult = {
        count: 2,
        transactions: [
          { id: 'TX-1001', merchant: 'Test Merchant', amount: 100, cashbackAmount: 10, status: 'pending' }
        ]
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult
      })

      const result = await getTransactions()

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/transactions/',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      )
      expect(result).toEqual(mockResult)
    })

    it('should throw error on network failure', async () => {
      ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

      await expect(getTransactions()).rejects.toThrow('Network error')
    })
  })
})