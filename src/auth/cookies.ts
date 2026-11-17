import type { Response, Request } from 'express'

const COOKIE_NAME = 'auth_token'
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000 // 7 days

function getCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production'
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    maxAge: COOKIE_MAX_AGE
  }
}

export function setAuthCookie(res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, getCookieOptions())
}

export function clearAuthCookie(res: Response): void {
  const isProduction = process.env.NODE_ENV === 'production'
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax'
  })
}

export function getAuthCookie(req: Request): string | null {
  return req.cookies?.[COOKIE_NAME] ?? null
}