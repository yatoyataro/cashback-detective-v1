import { describe, it, expect, vi, beforeEach } from 'vitest'
import { authenticateToken } from '../../src/middleware/auth.js'
import { generateToken } from '../../src/auth.js'
import { setAuthCookie } from '../../src/auth/cookies.js'

describe('Auth middleware with cookies', () => {
  const mockReq = { headers: {}, cookies: {}, user: undefined }
  const mockRes = { status: vi.fn().mockReturnThis(), json: vi.fn() }
  const mockNext = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockReq.headers = {}
    mockReq.cookies = {}
    mockReq.user = undefined
  })

  it('should authenticate via httpOnly cookie', () => {
    const token = generateToken({ userId: 'USER-1', role: 'user' })
    mockReq.cookies = { auth_token: token }

    authenticateToken(mockReq as any, mockRes as any, mockNext)

    expect(mockReq.user).toEqual(expect.objectContaining({ userId: 'USER-1', role: 'user' }))
    expect(mockNext).toHaveBeenCalled()
    expect(mockRes.status).not.toHaveBeenCalled()
  })

  it('should fall back to Authorization header', () => {
    const token = generateToken({ userId: 'USER-1', role: 'user' })
    mockReq.headers = { authorization: `Bearer ${token}` }

    authenticateToken(mockReq as any, mockRes as any, mockNext)

    expect(mockReq.user).toEqual(expect.objectContaining({ userId: 'USER-1', role: 'user' }))
    expect(mockNext).toHaveBeenCalled()
  })

  it('should prefer cookie over header', () => {
    const cookieToken = generateToken({ userId: 'USER-1', role: 'user' })
    const headerToken = generateToken({ userId: 'USER-2', role: 'admin' })
    mockReq.cookies = { auth_token: cookieToken }
    mockReq.headers = { authorization: `Bearer ${headerToken}` }

    authenticateToken(mockReq as any, mockRes as any, mockNext)

    expect(mockReq.user).toEqual(expect.objectContaining({ userId: 'USER-1', role: 'user' }))
  })

  it('should reject invalid token in cookie', () => {
    mockReq.cookies = { auth_token: 'invalid-token' }
    authenticateToken(mockReq as any, mockRes as any, mockNext)
    expect(mockRes.status).toHaveBeenCalledWith(401)
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' })
  })
})