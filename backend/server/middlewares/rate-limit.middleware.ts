import type { Request } from 'express';
import rateLimit from 'express-rate-limit';

/**
 * Skip health probes and immutable media (BYTEA covers burn the budget on first paint).
 * JSON API traffic remains limited — raised for ~1k concurrent (gym NAT shares IPs).
 */
function shouldSkipRateLimit(req: Request): boolean {
  const path = req.path || '';
  const url = req.originalUrl || req.url || path;
  if (
    path === '/health' ||
    path === '/warmup' ||
    path.endsWith('/health') ||
    path.endsWith('/warmup')
  ) {
    return true;
  }
  // Media is Cache-Control immutable; counting it caused false 429s under load.
  if (url.includes('/media/')) return true;
  return false;
}

export const rateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3_000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkipRateLimit,
  message: {
    success: false,
    error: { code: 'RATE_LIMIT', message: 'Too many requests' },
  },
});
