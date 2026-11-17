import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setAuthCookie, clearAuthCookie, getAuthCookie } from '../../src/auth/cookies.js'

describe('Secure cookie utilities', () => {
  const mockRes = {
    cookie: vi.fn(),
    clearCookie: vi.fn()
  }
  const mockReq = { cookies: {} }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should set auth cookie with secure options in production', () => {
    process.env.NODE_ENV = 'production'
    setAuthCookie(mockRes as any, 'test-token')

    expect(mockRes.cookie).toHaveBeenCalledWith(
      'auth_token',
      'test-token',
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      })
    )
  })

  it('should set auth cookie without secure in development', () => {
    process.env.NODE_ENV = 'development'
    setAuthCookie(mockRes as any, 'test-token')

    expect(mockRes.cookie).toHaveBeenCalledWith(
      'auth_token',
      'test-token',
      expect.objectContaining({
        httpOnly: true,
        secure: false,
        sameSite: 'lax'
      })
    )
  })

  it('should clear auth cookie', () => {
    process.env.NODE_ENV = 'production'
    clearAuthCookie(mockRes as any)
    expect(mockRes.clearCookie).toHaveBeenCalledWith('auth_token', expect.objectContaining({
      httpOnly: true,
      secure: true,
      sameSite: 'lax'
    }))
  })

  it('should extract token from cookie', () => {
    const req = { cookies: { auth_token: 'extracted-token' } } as any
    const token = getAuthCookie(req)
    expect(token).toBe('extracted-token')
  })

  it('should return null when cookie missing', () => {
    const req = { cookies: {} } as any
    const token = getAuthCookie(req)
    expect(token).toBeNull()
  })
})