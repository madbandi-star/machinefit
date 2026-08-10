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
    path === '/ready' ||
    path === '/live' ||
    path === '/liveness' ||
    path === '/meta' ||
    path.endsWith('/health') ||
    path.endsWith('/warmup') ||
    path.endsWith('/ready') ||
    path.endsWith('/live') ||
    path.endsWith('/liveness') ||
    path.endsWith('/meta')
  ) {
    return true;
  }
  // Media is Cache-Control immutable; counting it caused false 429s under load.
  if (url.includes('/media/')) return true;
  return false;
}

const rateLimitJson = {
  success: false as const,
  error: { code: 'RATE_LIMIT', message: 'Too many requests' },
};

export const rateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3_000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkipRateLimit,
  message: rateLimitJson,
});

/** OAuth login / signup complete — brute-force & credential stuffing resistance. */
export const authStrictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitJson,
});

/** Consent accept / refresh — slightly looser than login. */
export const authSessionRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitJson,
});

/** Checkout / trial start — prevent spam checkout sessions. */
export const billingCheckoutRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitJson,
});

/**
 * Provider webhooks — allow retries but cap abuse.
 * Signature verification remains the primary authz.
 */
export const webhookRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitJson,
});
