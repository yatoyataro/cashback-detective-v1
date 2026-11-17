import { describe, it, expect } from 'vitest'

describe('Security dependencies', () => {
  it('bcryptjs should be importable', async () => {
    const bcrypt = await import('bcryptjs')
    expect(typeof bcrypt.hash).toBe('function')
    expect(typeof bcrypt.compare).toBe('function')
  })

  it('helmet should be importable', async () => {
    const helmet = await import('helmet')
    expect(typeof helmet.default).toBe('function')
  })

  it('cookie-parser should be importable', async () => {
    const cookieParser = await import('cookie-parser')
    expect(typeof cookieParser.default).toBe('function')
  })
})