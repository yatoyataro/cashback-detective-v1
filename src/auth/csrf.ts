import crypto from 'crypto'

const CSRF_COOKIE_NAME = 'csrf_token'
const CSRF_HEADER_NAME = 'x-csrf-token'

export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('base64url')
}

export function validateCsrfToken(req: { cookies?: Record<string, string>; headers?: Record<string, string> }): boolean {
  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME]
  const headerToken = req.headers?.[CSRF_HEADER_NAME]

  if (!cookieToken || !headerToken) return false

  // Timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(cookieToken),
    Buffer.from(headerToken)
  )
}

export const CSRF_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000
}