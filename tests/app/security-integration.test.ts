import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from '../../src/app.js'

describe('Security middleware integration', () => {
  it('should have helmet headers on response', async () => {
    const res = await request(app).get('/health')
    expect(res.headers['x-frame-options']).toBe('DENY')
    expect(res.headers['x-content-type-options']).toBe('nosniff')
    expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
  })

  it('should set CSRF cookie on first request', async () => {
    const res = await request(app).get('/health')
    expect(res.headers['set-cookie']).toBeDefined()
    const cookies = Array.isArray(res.headers['set-cookie'])
      ? res.headers['set-cookie']
      : [res.headers['set-cookie']]
    expect(cookies.some((c: string) => c.includes('csrf_token='))).toBe(true)
  })

  it('should reject POST without CSRF token', async () => {
    const res = await request(app)
      .post('/ask')
      .send({ question: 'test' })
    expect(res.status).toBe(403)
    expect(res.body.error).toBe('Invalid CSRF token')
  })
})