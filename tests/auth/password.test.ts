import { describe, it, expect, beforeEach } from 'vitest'
import { hashPassword, verifyPassword } from '../../src/auth/password.js'

describe('Password hashing', () => {
  const testPassword = 'SecureP@ssw0rd123!'

  it('should hash a password', async () => {
    const hash = await hashPassword(testPassword)
    expect(hash).toBeDefined()
    expect(hash).not.toBe(testPassword)
    expect(hash.startsWith('$2b$')).toBe(true) // bcrypt prefix
  })

  it('should verify correct password', async () => {
    const hash = await hashPassword(testPassword)
    const result = await verifyPassword(testPassword, hash)
    expect(result).toBe(true)
  })

  it('should reject incorrect password', async () => {
    const hash = await hashPassword(testPassword)
    const result = await verifyPassword('WrongPassword', hash)
    expect(result).toBe(false)
  })

  it('should produce different hashes for same password', async () => {
    const hash1 = await hashPassword(testPassword)
    const hash2 = await hashPassword(testPassword)
    expect(hash1).not.toBe(hash2)
  })

  it('should use cost factor 12', async () => {
    const hash = await hashPassword(testPassword)
    // bcrypt format: $2b$<cost>$<salt><hash>
    const cost = parseInt(hash.split('$')[2], 10)
    expect(cost).toBe(12)
  })

  it('should throw error for password less than 8 characters', async () => {
    await expect(hashPassword('short')).rejects.toThrow('Password must be at least 8 characters')
  })

  it('should throw error for empty password', async () => {
    await expect(hashPassword('')).rejects.toThrow('Password must be at least 8 characters')
  })
})