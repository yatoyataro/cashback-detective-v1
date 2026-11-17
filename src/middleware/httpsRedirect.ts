import type { Request, Response, NextFunction } from 'express'

export function httpsRedirectMiddleware(req: Request, res: Response, next: NextFunction): void {
  const isProduction = process.env.NODE_ENV === 'production'
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