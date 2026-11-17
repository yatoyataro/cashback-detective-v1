import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateCsrfToken, validateCsrfToken } from '../../src/auth/csrf.js'
import { csrfMiddleware } from '../../src/middleware/csrf.js'

describe('CSRF protection', () => {
  it('should generate a random token', () => {
    const token1 = generateCsrfToken()
    const token2 = generateCsrfToken()
    expect(token1).toBeDefined()
    expect(token1.length).toBeGreaterThan(20)
    expect(token1).not.toBe(token2)
  })

  it('should validate matching token from header', () => {
    const token = generateCsrfToken()
    const req = {
      cookies: { csrf_token: token },
      headers: { 'x-csrf-token': token }
    } as any
    expect(validateCsrfToken(req)).toBe(true)
  })

  it('should reject missing header token', () => {
    const token = generateCsrfToken()
    const req = { cookies: { csrf_token: token }, headers: {} } as any
    expect(validateCsrfToken(req)).toBe(false)
  })

  it('should reject mismatched token', () => {
    const req = {
      cookies: { csrf_token: 'token-a' },
      headers: { 'x-csrf-token': 'token-b' }
    } as any
    expect(validateCsrfToken(req)).toBe(false)
  })

  it('should reject missing cookie token', () => {
    const req = { cookies: {}, headers: { 'x-csrf-token': 'token' } } as any
    expect(validateCsrfToken(req)).toBe(false)
  })

  describe('CSRF middleware', () => {
    const mockReq = { method: 'POST', cookies: {}, headers: {} }
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      cookie: vi.fn()
    }
    const mockNext = vi.fn()

    beforeEach(() => {
      vi.clearAllMocks()
      mockReq.method = 'POST'
      mockReq.cookies = {}
      mockReq.headers = {}
    })

    it('should skip GET requests', () => {
      mockReq.method = 'GET'
      csrfMiddleware(mockReq as any, mockRes as any, mockNext)
      expect(mockNext).toHaveBeenCalled()
    })

    it('should skip OPTIONS requests', () => {
      mockReq.method = 'OPTIONS'
      csrfMiddleware(mockReq as any, mockRes as any, mockNext)
      expect(mockNext).toHaveBeenCalled()
    })

    it('should reject POST without valid CSRF', () => {
      mockReq.method = 'POST'
      csrfMiddleware(mockReq as any, mockRes as any, mockNext)
      expect(mockRes.status).toHaveBeenCalledWith(403)
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid CSRF token' })
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should allow POST with valid CSRF', () => {
      mockReq.method = 'POST'
      const token = generateCsrfToken()
      mockReq.cookies = { csrf_token: token }
      mockReq.headers = { 'x-csrf-token': token }
      csrfMiddleware(mockReq as any, mockRes as any, mockNext)
      expect(mockNext).toHaveBeenCalled()
    })
  })
})