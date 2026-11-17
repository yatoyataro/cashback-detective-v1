import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest'
import { validateEnv, getConfig } from '../../src/config/env.js'

describe('Environment validation', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('should accept valid production config', () => {
    process.env.NODE_ENV = 'production'
    process.env.JWT_SECRET = 'a'.repeat(32)
    process.env.DATABASE_URL = 'postgresql://user:pass@host/db?sslmode=require'

    expect(() => validateEnv()).not.toThrow()
  })

  it('should reject default JWT_SECRET in production', () => {
    process.env.NODE_ENV = 'production'
    process.env.JWT_SECRET = 'dev-secret-change-in-production'
    process.env.DATABASE_URL = 'postgresql://user:pass@host/db?sslmode=require'

    expect(() => validateEnv()).toThrow('JWT_SECRET')
  })

  it('should reject short JWT_SECRET in production', () => {
    process.env.NODE_ENV = 'production'
    process.env.JWT_SECRET = 'short'
    process.env.DATABASE_URL = 'postgresql://user:pass@host/db?sslmode=require'

    expect(() => validateEnv()).toThrow('JWT_SECRET')
  })

  it('should allow default JWT_SECRET in development', () => {
    process.env.NODE_ENV = 'development'
    process.env.JWT_SECRET = 'dev-secret-change-in-production'
    process.env.DATABASE_URL = 'postgresql://user:pass@host/db?sslmode=require'

    expect(() => validateEnv()).not.toThrow()
  })

  it('should require DATABASE_URL', () => {
    process.env.NODE_ENV = 'production'
    process.env.JWT_SECRET = 'a'.repeat(32)
    delete process.env.DATABASE_URL

    expect(() => validateEnv()).toThrow('DATABASE_URL')
  })

  it('should return config object', () => {
    process.env.NODE_ENV = 'production'
    process.env.JWT_SECRET = 'a'.repeat(32)
    process.env.DATABASE_URL = 'postgresql://user:pass@host/db?sslmode=require'
    process.env.PORT = '4000'

    const config = getConfig()
    expect(config.nodeEnv).toBe('production')
    expect(config.port).toBe(4000)
    expect(config.jwtSecret).toBe('a'.repeat(32))
  })
})