import type { Request, Response, NextFunction } from 'express'
import { validateCsrfToken, CSRF_COOKIE_NAME, CSRF_COOKIE_OPTIONS, generateCsrfToken } from '../auth/csrf.js'

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS']

export function csrfMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Ensure CSRF cookie exists (for SPAs, set on first request)
  if (!req.cookies?.[CSRF_COOKIE_NAME]) {
    const token = generateCsrfToken()
    res.cookie(CSRF_COOKIE_NAME, token, CSRF_COOKIE_OPTIONS)
  }

  // Skip safe methods
  if (SAFE_METHODS.includes(req.method)) {
    next()
    return
  }

  // Validate token for unsafe methods
  if (!validateCsrfToken(req)) {
    res.status(403).json({ error: 'Invalid CSRF token' })
    return
  }

  next()
}