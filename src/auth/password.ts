import bcrypt from 'bcryptjs'

const BCRYPT_COST = 12

export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters')
  }
  return bcrypt.hash(password, BCRYPT_COST)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) return false
  return bcrypt.compare(password, hash)
}