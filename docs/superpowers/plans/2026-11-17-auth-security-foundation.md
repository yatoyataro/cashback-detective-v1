# Phase 1: Authentication & Security Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement secure authentication with password hashing, secure cookies, CSRF protection, security headers (helmet), and HTTPS enforcement for the Cashback Detective application.

**Architecture:** Add bcrypt password hashing, httpOnly secure cookies for JWT storage, double-submit CSRF pattern, helmet middleware for security headers, and HTTPS redirect middleware. All changes are backward-compatible with existing JWT auth middleware.

**Tech Stack:** Node.js, TypeScript, Express 5, PostgreSQL (Neon), bcryptjs, helmet, cookie-parser, zod

**Spec:** This plan implements the security requirements from the user's request: "set up proper authentication, Hide api keys, Secure the database, Enforce Https, Hash passwords, Log and monitor, Lock down admin routes. Use parameterized queries, Check environment variables, add rate limiting, Disable production debug mode, Secure my session cookies, add csrf protection"

## Global Constraints

- All database queries must use parameterized queries (`$1`, `$2`) — already enforced
- JWT_SECRET must be 32+ chars in production (enforced via env validation)
- NODE_ENV=production enables secure cookies, HTTPS redirect, HSTS, disables debug logging
- All new endpoints must have Zod validation schemas
- Rate limiting: general API 100/15min, auth endpoints 10/15min, strict endpoints 10/1min
- Password hashing: bcrypt with cost factor 12
- Cookie settings: httpOnly=true, secure=production, sameSite=lax, maxAge=7d
- CSRF: double-submit cookie pattern (stateless, works with SPA)

## Review Focus

1. **Weak JWT_SECRET in production** — App should fail fast if JWT_SECRET is default/weak in production
2. **CSRF token leakage** — CSRF tokens must not be accessible via XSS (httpOnly cookies + custom header)
3. **Password hash timing attacks** — bcrypt.compare is constant-time, but verify implementation
4. **Cookie theft via XSS** — httpOnly prevents JS access, secure prevents HTTP transmission
5. **Missing HTTPS in production** — HTTPS redirect must work behind proxy (trust proxy header)

---

### Task 1: Install Security Dependencies & Update Package.json

**Files:**
- Modify: `package.json`
- Test: `tests/auth/security-deps.test.ts` (new)

**Interfaces:**
- Consumes: none
- Produces: bcryptjs, helmet, cookie-parser available for use

- [ ] **Step 1: Write failing test for dependency availability**

```typescript
// tests/auth/security-deps.test.ts
import { describe, it, expect } from 'vitest'

describe('Security dependencies', () => {
  it('bcryptjs should be importable', async () => {
    const bcrypt = await import('bcryptjs')
    expect(typeof bcrypt.hash).toBe('function')
    expect(typeof bcrypt.compare).toBe('function')
  })

  it('helmet should be importable', async () => {
    const helmet = await import('helmet')
    expect(typeof helmet).toBe('function')
  })

  it('cookie-parser should be importable', async () => {
    const cookieParser = await import('cookie-parser')
    expect(typeof cookieParser).toBe('function')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/auth/security-deps.test.ts`
Expected: FAIL - modules not found

- [ ] **Step 3: Install dependencies**

```bash
npm install bcryptjs helmet cookie-parser
npm install -D @types/bcryptjs @types/cookie-parser
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/auth/security-deps.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json tests/auth/security-deps.test.ts
git commit -m "feat: add security dependencies (bcryptjs, helmet, cookie-parser)"
```

---

### Task 2: Password Hashing Utilities

**Files:**
- Create: `src/auth/password.ts`
- Test: `tests/auth/password.test.ts`

**Interfaces:**
- Consumes: none
- Produces: `hashPassword(password: string): Promise<string>`, `verifyPassword(password: string, hash: string): Promise<boolean>`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/auth/password.test.ts
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
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/auth/password.test.ts`
Expected: FAIL - module not found

- [ ] **Step 3: Implement password.ts**

```typescript
// src/auth/password.ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/auth/password.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/auth/password.ts tests/auth/password.test.ts
git commit -m "feat: add password hashing utilities with bcrypt cost factor 12"
```

---

### Task 3: Secure Cookie Utilities

**Files:**
- Create: `src/auth/cookies.ts`
- Test: `tests/auth/cookies.test.ts`

**Interfaces:**
- Consumes: none
- Produces: `setAuthCookie(res, token)`, `clearAuthCookie(res)`, `getAuthCookie(req)`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/auth/cookies.test.ts
import { describe, it, expect, vi } from 'vitest'
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/auth/cookies.test.ts`
Expected: FAIL - module not found

- [ ] **Step 3: Implement cookies.ts**

```typescript
// src/auth/cookies.ts
import type { Response, Request } from 'express'

const COOKIE_NAME = 'auth_token'
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000 // 7 days

const isProduction = process.env.NODE_ENV === 'production'

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax' as const,
  maxAge: COOKIE_MAX_AGE
}

export function setAuthCookie(res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, cookieOptions)
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax'
  })
}

export function getAuthCookie(req: Request): string | null {
  return req.cookies?.[COOKIE_NAME] ?? null
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/auth/cookies.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/auth/cookies.ts tests/auth/cookies.test.ts
git commit -m "feat: add secure cookie utilities for JWT storage"
```

---

### Task 4: CSRF Protection (Double-Submit Cookie Pattern)

**Files:**
- Create: `src/auth/csrf.ts`
- Create: `src/middleware/csrf.ts`
- Test: `tests/auth/csrf.test.ts`

**Interfaces:**
- Consumes: `getAuthCookie` from cookies.ts
- Produces: `generateCsrfToken(): string`, `validateCsrfToken(req): boolean`, `csrfMiddleware(req, res, next)`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/auth/csrf.test.ts
import { describe, it, expect, vi } from 'vitest'
import { generateCsrfToken, validateCsrfToken } from '../../src/auth/csrf.js'
import { csrfMiddleware } from '../../src/middleware/csrf.js'

describe('CSRF protection', () => {
  it('should generate a random token', () => {
    const token1 = generateCsrfToken()
    const token2 = generateCsrfToken()
    expect(token1).toBeDefined()
    expect(token1.length).toBeGreaterThan(20)
    expect(token1).not.toBe(token2)
  })

  it('should validate matching token from header', () => {
    const token = generateCsrfToken()
    const req = {
      cookies: { csrf_token: token },
      headers: { 'x-csrf-token': token }
    } as any
    expect(validateCsrfToken(req)).toBe(true)
  })

  it('should reject missing header token', () => {
    const token = generateCsrfToken()
    const req = { cookies: { csrf_token: token }, headers: {} } as any
    expect(validateCsrfToken(req)).toBe(false)
  })

  it('should reject mismatched token', () => {
    const req = {
      cookies: { csrf_token: 'token-a' },
      headers: { 'x-csrf-token': 'token-b' }
    } as any
    expect(validateCsrfToken(req)).toBe(false)
  })

  it('should reject missing cookie token', () => {
    const req = { cookies: {}, headers: { 'x-csrf-token': 'token' } } as any
    expect(validateCsrfToken(req)).toBe(false)
  })

  describe('CSRF middleware', () => {
    const mockReq = { method: 'POST', cookies: {}, headers: {} }
    const mockRes = { status: vi.fn().mockReturnThis(), json: vi.fn() }
    const mockNext = vi.fn()

    beforeEach(() => {
      vi.clearAllMocks()
      mockReq.method = 'POST'
      mockReq.cookies = {}
      mockReq.headers = {}
    })

    it('should skip GET requests', () => {
      mockReq.method = 'GET'
      csrfMiddleware(mockReq as any, mockRes as any, mockNext)
      expect(mockNext).toHaveBeenCalled()
    })

    it('should skip OPTIONS requests', () => {
      mockReq.method = 'OPTIONS'
      csrfMiddleware(mockReq as any, mockRes as any, mockNext)
      expect(mockNext).toHaveBeenCalled()
    })

    it('should reject POST without valid CSRF', () => {
      mockReq.method = 'POST'
      csrfMiddleware(mockReq as any, mockRes as any, mockNext)
      expect(mockRes.status).toHaveBeenCalledWith(403)
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid CSRF token' })
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should allow POST with valid CSRF', () => {
      mockReq.method = 'POST'
      const token = generateCsrfToken()
      mockReq.cookies = { csrf_token: token }
      mockReq.headers = { 'x-csrf-token': token }
      csrfMiddleware(mockReq as any, mockRes as any, mockNext)
      expect(mockNext).toHaveBeenCalled()
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/auth/csrf.test.ts`
Expected: FAIL - module not found

- [ ] **Step 3: Implement csrf.ts**

```typescript
// src/auth/csrf.ts
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
```

- [ ] **Step 4: Implement middleware/csrf.ts**

```typescript
// src/middleware/csrf.ts
import type { Request, Response, NextFunction } from 'express'
import { validateCsrfToken, CSRF_COOKIE_NAME, CSRF_COOKIE_OPTIONS, generateCsrfToken } from '../auth/csrf.js'

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS']

export function csrfMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Skip safe methods
  if (SAFE_METHODS.includes(req.method)) {
    return next()
  }

  // Ensure CSRF cookie exists (for SPAs, set on first request)
  if (!req.cookies?.[CSRF_COOKIE_NAME]) {
    const token = generateCsrfToken()
    res.cookie(CSRF_COOKIE_NAME, token, CSRF_COOKIE_OPTIONS)
  }

  // Validate token
  if (!validateCsrfToken(req)) {
    return res.status(403).json({ error: 'Invalid CSRF token' })
  }

  next()
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/auth/csrf.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/auth/csrf.ts src/middleware/csrf.ts tests/auth/csrf.test.ts
git commit -m "feat: add CSRF protection with double-submit cookie pattern"
```

---

### Task 5: Security Headers with Helmet

**Files:**
- Create: `src/middleware/securityHeaders.ts`
- Test: `tests/middleware/securityHeaders.test.ts`

**Interfaces:**
- Consumes: none
- Produces: `securityHeadersMiddleware` (helmet configured)

- [ ] **Step 1: Write failing tests**

```typescript
// tests/middleware/securityHeaders.test.ts
import { describe, it, expect, vi } from 'vitest'
import { securityHeadersMiddleware } from '../../src/middleware/securityHeaders.js'

describe('Security headers middleware', () => {
  const mockReq = { method: 'GET', headers: {} }
  const mockRes = {
    setHeader: vi.fn(),
    removeHeader: vi.fn()
  }
  const mockNext = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should set HSTS header in production', () => {
    process.env.NODE_ENV = 'production'
    securityHeadersMiddleware(mockReq as any, mockRes as any, mockNext)

    expect(mockRes.setHeader).toHaveBeenCalledWith(
      'Strict-Transport-Security',
      expect.stringContaining('max-age=31536000')
    )
  })

  it('should set CSP header', () => {
    securityHeadersMiddleware(mockReq as any, mockRes as any, mockNext)

    expect(mockRes.setHeader).toHaveBeenCalledWith(
      'Content-Security-Policy',
      expect.stringContaining("default-src 'self'")
    )
  })

  it('should set X-Frame-Options', () => {
    securityHeadersMiddleware(mockReq as any, mockRes as any, mockNext)

    expect(mockRes.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY')
  })

  it('should set X-Content-Type-Options', () => {
    securityHeadersMiddleware(mockReq as any, mockRes as any, mockNext)

    expect(mockRes.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff')
  })

  it('should set Referrer-Policy', () => {
    securityHeadersMiddleware(mockReq as any, mockRes as any, mockNext)

    expect(mockRes.setHeader).toHaveBeenCalledWith('Referrer-Policy', 'strict-origin-when-cross-origin')
  })

  it('should call next', () => {
    securityHeadersMiddleware(mockReq as any, mockRes as any, mockNext)
    expect(mockNext).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/middleware/securityHeaders.test.ts`
Expected: FAIL - module not found

- [ ] **Step 3: Implement securityHeaders.ts**

```typescript
// src/middleware/securityHeaders.ts
import type { Request, Response, NextFunction } from 'express'
import helmet from 'helmet'

const isProduction = process.env.NODE_ENV === 'production'

const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"]
    }
  },
  hsts: isProduction ? {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  } : false,
  frameguard: { action: 'deny' },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
  hidePoweredBy: true
})

export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction): void {
  helmetMiddleware(req, res, next)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/middleware/securityHeaders.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/middleware/securityHeaders.ts tests/middleware/securityHeaders.test.ts
git commit -m "feat: add security headers middleware with helmet (CSP, HSTS, X-Frame-Options)"
```

---

### Task 6: HTTPS Enforcement Middleware

**Files:**
- Create: `src/middleware/httpsRedirect.ts`
- Test: `tests/middleware/httpsRedirect.test.ts`

**Interfaces:**
- Consumes: none
- Produces: `httpsRedirectMiddleware(req, res, next)`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/middleware/httpsRedirect.test.ts
import { describe, it, expect, vi } from 'vitest'
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
    httpsRedirectMiddleware(mockReq as any, mockRes as any, mockNext)
    expect(mockRes.redirect).toHaveBeenCalledWith(301, 'https://' + mockReq.get('host') + mockReq.originalUrl)
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/middleware/httpsRedirect.test.ts`
Expected: FAIL - module not found

- [ ] **Step 3: Implement httpsRedirect.ts**

```typescript
// src/middleware/httpsRedirect.ts
import type { Request, Response, NextFunction } from 'express'

const isProduction = process.env.NODE_ENV === 'production'

export function httpsRedirectMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!isProduction) {
    return next()
  }

  // Check if request is already HTTPS or behind a proxy with HTTPS
  const isHttps = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https'

  if (!isHttps) {
    const host = req.get('host')
    const url = `https://${host}${req.originalUrl}`
    return res.redirect(301, url)
  }

  next()
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/middleware/httpsRedirect.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/middleware/httpsRedirect.ts tests/middleware/httpsRedirect.test.ts
git commit -m "feat: add HTTPS enforcement middleware with proxy support"
```

---

### Task 7: Update Auth Middleware to Use Secure Cookies

**Files:**
- Modify: `src/middleware/auth.ts`
- Modify: `src/auth.ts` (add cookie-based token extraction)
- Test: `tests/middleware/auth-cookie.test.ts`

**Interfaces:**
- Consumes: `getAuthCookie` from cookies.ts, `verifyToken` from auth.ts
- Produces: Updated `authenticateToken` that reads from cookie first, then Authorization header

- [ ] **Step 1: Write failing tests**

```typescript
// tests/middleware/auth-cookie.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { authenticateToken } from '../../src/middleware/auth.js'
import { generateToken } from '../../src/auth.js'
import { setAuthCookie } from '../../src/auth/cookies.js'

describe('Auth middleware with cookies', () => {
  const mockReq = { headers: {}, cookies: {}, user: undefined }
  const mockRes = { status: vi.fn().mockReturnThis(), json: vi.fn() }
  const mockNext = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockReq.headers = {}
    mockReq.cookies = {}
    mockReq.user = undefined
  })

  it('should authenticate via httpOnly cookie', () => {
    const token = generateToken({ userId: 'USER-1', role: 'user' })
    mockReq.cookies = { auth_token: token }

    authenticateToken(mockReq as any, mockRes as any, mockNext)

    expect(mockReq.user).toEqual({ userId: 'USER-1', role: 'user' })
    expect(mockNext).toHaveBeenCalled()
    expect(mockRes.status).not.toHaveBeenCalled()
  })

  it('should fall back to Authorization header', () => {
    const token = generateToken({ userId: 'USER-1', role: 'user' })
    mockReq.headers = { authorization: `Bearer ${token}` }

    authenticateToken(mockReq as any, mockRes as any, mockNext)

    expect(mockReq.user).toEqual({ userId: 'USER-1', role: 'user' })
    expect(mockNext).toHaveBeenCalled()
  })

  it('should prefer cookie over header', () => {
    const cookieToken = generateToken({ userId: 'USER-1', role: 'user' })
    const headerToken = generateToken({ userId: 'USER-2', role: 'admin' })
    mockReq.cookies = { auth_token: cookieToken }
    mockReq.headers = { authorization: `Bearer ${headerToken}` }

    authenticateToken(mockReq as any, mockRes as any, mockNext)

    expect(mockReq.user).toEqual({ userId: 'USER-1', role: 'user' })
  })

  it('should reject invalid token in cookie', () => {
    mockReq.cookies = { auth_token: 'invalid-token' }
    authenticateToken(mockReq as any, mockRes as any, mockNext)
    expect(mockRes.status).toHaveBeenCalledWith(401)
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/middleware/auth-cookie.test.ts`
Expected: FAIL - current auth middleware doesn't read cookies

- [ ] **Step 3: Update auth.ts to export getAuthCookie and verifyToken**

```typescript
// src/auth.ts (add to existing exports)
export { getAuthCookie } from './cookies.js'
```

- [ ] **Step 4: Update middleware/auth.ts**

```typescript
// src/middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import { verifyToken, TokenPayload, getAuthCookie } from "../auth.js";

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  // Try cookie first (more secure for SPA), then Authorization header
  const cookieToken = getAuthCookie(req)
  const headerToken = req.headers.authorization?.replace("Bearer ", "")

  const token = cookieToken ?? headerToken
  const payload = token ? verifyToken(token) : null

  if (!payload) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }

  req.user = payload
  next()
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== "admin") {
    res.status(403).json({ error: "Forbidden: Admin access required" })
    return
  }
  next()
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/middleware/auth-cookie.test.ts`
Expected: PASS

- [ ] **Step 6: Run all existing tests to ensure no regression**

Run: `npx vitest run`
Expected: All tests PASS (including existing eval tests)

- [ ] **Step 7: Commit**

```bash
git add src/auth.ts src/middleware/auth.ts tests/middleware/auth-cookie.test.ts
git commit -m "feat: update auth middleware to prioritize secure httpOnly cookie over Authorization header"
```

---

### Task 8: Integrate All Security Middleware into App

**Files:**
- Modify: `src/app.ts` (add new middleware in correct order)
- Test: `tests/app/security-integration.test.ts`

**Interfaces:**
- Consumes: All new middleware
- Produces: App with full security stack

- [ ] **Step 1: Write failing integration test**

```typescript
// tests/app/security-integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
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
    const cookies = res.headers['set-cookie']
    expect(cookies.some(c => c.includes('csrf_token='))).toBe(true)
  })

  it('should reject POST without CSRF token', async () => {
    const res = await request(app)
      .post('/ask')
      .send({ question: 'test' })
    expect(res.status).toBe(403)
    expect(res.body.error).toBe('Invalid CSRF token')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/app/security-integration.test.ts`
Expected: FAIL - middleware not yet integrated

- [ ] **Step 3: Update app.ts with security middleware**

```typescript
// src/app.ts (add imports at top)
import { securityHeadersMiddleware } from "./middleware/securityHeaders.js";
import { httpsRedirectMiddleware } from "./middleware/httpsRedirect.js";
import { csrfMiddleware } from "./middleware/csrf.js";
import cookieParser from "cookie-parser";

// Add after express.json() and before routes
app.use(cookieParser());
app.use(httpsRedirectMiddleware);
app.use(securityHeadersMiddleware);
app.use(csrfMiddleware); // Apply to all routes, CSRF middleware skips safe methods
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/app/security-integration.test.ts`
Expected: PASS

- [ ] **Step 5: Run all tests to ensure no regression**

Run: `npx vitest run`
Expected: All tests PASS (16 evals + all unit tests)

- [ ] **Step 6: Commit**

```bash
git add src/app.ts tests/app/security-integration.test.ts
git commit -m "feat: integrate security middleware stack (helmet, HTTPS redirect, CSRF, cookie-parser)"
```

---

### Task 9: Environment Validation & Production Hardening

**Files:**
- Modify: `src/server.ts` (add env validation on startup)
- Create: `src/config/env.ts`
- Test: `tests/config/env.test.ts`

**Interfaces:**
- Consumes: process.env
- Produces: Validated config object, throws on invalid production config

- [ ] **Step 1: Write failing tests**

```typescript
// tests/config/env.test.ts
import { describe, it, expect, vi } from 'vitest'
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/config/env.test.ts`
Expected: FAIL - module not found

- [ ] **Step 3: Implement config/env.ts**

```typescript
// src/config/env.ts

export interface AppConfig {
  nodeEnv: string
  port: number
  jwtSecret: string
  databaseUrl: string
  logLevel: string
  enableAiQuestions: boolean
  ollamaModel: string
}

function validateEnv(): void {
  const nodeEnv = process.env.NODE_ENV ?? 'development'
  const isProduction = nodeEnv === 'production'

  // Required in all environments
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required')
  }

  // Production-only validations
  if (isProduction) {
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret || jwtSecret === 'dev-secret-change-in-production' || jwtSecret.length < 32) {
      throw new Error('JWT_SECRET must be set to a secure random string (32+ chars) in production. Generate with: openssl rand -base64 32')
    }

    // Ensure DATABASE_URL uses SSL
    if (!process.env.DATABASE_URL.includes('sslmode=require')) {
      throw new Error('DATABASE_URL must use sslmode=require in production')
    }
  }
}

export function getConfig(): AppConfig {
  validateEnv()

  return {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: Number(process.env.PORT ?? 3000),
    jwtSecret: process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
    databaseUrl: process.env.DATABASE_URL!,
    logLevel: process.env.LOG_LEVEL ?? 'info',
    enableAiQuestions: process.env.ENABLE_AI_GENERAL_QUESTIONS === 'true',
    ollamaModel: process.env.OLLAMA_MODEL ?? 'qwen3:4b'
  }
}

// Re-export validateEnv for testing
export { validateEnv }
```

- [ ] **Step 4: Update server.ts to use config**

```typescript
// src/server.ts (modify imports and startup)
import { app } from "./app.js";
import { checkDatabaseConnection, pool } from "./db.js";
import { logger } from "./logger.js";
import { getConfig } from "./config/env.js";

const config = getConfig()

async function startServer() {
  try {
    await checkDatabaseConnection();

    const server = app.listen(config.port, () => {
      logger.info(`Cashback Detective API running at http://localhost:${config.port} [${config.nodeEnv}]`);
    });

    const shutdown = () => {
      server.close(() => {
        void pool.end().then(() => process.exit(0));
      });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    logger.error({ err: error }, "Could not start the application");
    await pool.end();
    process.exit(1);
  }
}

void startServer();
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/config/env.test.ts`
Expected: PASS

- [ ] **Step 6: Run all tests to ensure no regression**

Run: `npx vitest run`
Expected: All tests PASS

- [ ] **Step 7: Commit**

```bash
git add src/config/env.ts src/server.ts tests/config/env.test.ts
git commit -m "feat: add environment validation with production hardening checks"
```

---

### Task 10: Update .env.example with New Variables

**Files:**
- Modify: `.env.example`

**Interfaces:**
- Documents all required/optional environment variables

- [ ] **Step 1: Update .env.example**

```bash
# Add to .env.example:

# ============================================
# SECURITY (Production)
# ============================================
# Generate with: openssl rand -base64 32
# MUST be 32+ chars in production
JWT_SECRET=dev-secret-change-in-production

# CSRF protection (auto-generated if not set)
# CSRF_SECRET=optional-custom-secret

# ============================================
# RATE LIMITING (Optional tuning)
# ============================================
# General API: requests per window
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# Auth endpoints: stricter limits
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX=10

# Strict endpoints (investigate, transactions)
STRICT_RATE_LIMIT_WINDOW_MS=60000
STRICT_RATE_LIMIT_MAX=10
```

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "docs: update .env.example with security and rate limiting variables"
```

---

### Task 11: Final Verification - Run All Tests & Evals

**Files:**
- None (verification only)

- [ ] **Step 1: Run all unit tests**

Run: `npx vitest run`
Expected: All tests PASS

- [ ] **Step 2: Run backend evals (requires running server)**

```bash
# Start server in background
npx tsx src/server.ts &
SERVER_PID=$!
sleep 3
npx tsx evals/run.ts
kill $SERVER_PID
```

Expected: 16/16 evals PASS (100%)

- [ ] **Step 3: Run frontend tests**

```bash
cd frontend && npm run test:unit -- --run
```

Expected: 21/21 tests PASS

- [ ] **Step 4: Build both projects**

```bash
npm run build
cd frontend && npm run build
```

Expected: Both builds succeed

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete Phase 1 - Authentication & Security Foundation"
```

---

## Summary

This plan implements **Phase 1: Authentication & Security Foundation** with 11 tasks covering:

1. **Dependencies** - bcryptjs, helmet, cookie-parser
2. **Password hashing** - bcrypt cost 12, secure verification
3. **Secure cookies** - httpOnly, secure, sameSite=lax, 7-day expiry
4. **CSRF protection** - double-submit cookie pattern with timing-safe comparison
5. **Security headers** - Helmet with CSP, HSTS, X-Frame-Options, etc.
6. **HTTPS enforcement** - Redirect HTTP→HTTPS with proxy support
7. **Auth middleware update** - Cookie-first token extraction
8. **Middleware integration** - Proper order in Express app
9. **Environment validation** - Production hardening checks
10. **Documentation** - Updated .env.example
11. **Verification** - Full test suite + evals

Each task follows TDD: write failing test → implement → verify → commit.

Ready to execute with **superpowers:executing-plans**.