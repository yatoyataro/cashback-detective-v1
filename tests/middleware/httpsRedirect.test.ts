import { describe, it, expect, vi, beforeEach } from 'vitest'
import { httpsRedirectMiddleware } from '../../src/middleware/httpsRedirect.js'

describe('HTTPS redirect middleware', () => {
  const mockReq = {
    method: 'GET',
    headers: {},
    protocol: 'http',
    get: vi.fn(),
    originalUrl: '/test'
  }
  const mockRes = {
    redirect: vi.fn(),
    setHeader: vi.fn()
  }
  const mockNext = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockReq.protocol = 'http'
    mockReq.headers = {}
    mockReq.get = vi.fn()
  })

  it('should skip in development', () => {
    process.env.NODE_ENV = 'development'
    httpsRedirectMiddleware(mockReq as any, mockRes as any, mockNext)
    expect(mockNext).toHaveBeenCalled()
    expect(mockRes.redirect).not.toHaveBeenCalled()
  })

  it('should redirect HTTP to HTTPS in production', () => {
    process.env.NODE_ENV = 'production'
    mockReq.protocol = 'http'
    mockReq.get.mockReturnValue('localhost:3000')
    httpsRedirectMiddleware(mockReq as any, mockRes as any, mockNext)
    expect(mockRes.redirect).toHaveBeenCalledWith(301, 'https://localhost:3000/test')
    expect(mockNext).not.toHaveBeenCalled()
  })

  it('should allow HTTPS in production', () => {
    process.env.NODE_ENV = 'production'
    mockReq.protocol = 'https'
    httpsRedirectMiddleware(mockReq as any, mockRes as any, mockNext)
    expect(mockNext).toHaveBeenCalled()
    expect(mockRes.redirect).not.toHaveBeenCalled()
  })

  it('should trust x-forwarded-proto header behind proxy', () => {
    process.env.NODE_ENV = 'production'
    mockReq.protocol = 'http'
    mockReq.get.mockReturnValue('https')
    httpsRedirectMiddleware(mockReq as any, mockRes as any, mockNext)
    expect(mockNext).toHaveBeenCalled()
    expect(mockRes.redirect).not.toHaveBeenCalled()
  })
})