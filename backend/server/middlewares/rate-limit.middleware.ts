import type { Request, RequestHandler } from 'express';
import rateLimit, { type Options, type RateLimitRequestHandler } from 'express-rate-limit';
import { getFreePlanLimits } from '@machinefit/shared';
import { recordAbuseSafe } from '../services/abuse.service.js';

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

function clientKey(req: Request): string {
  const userId =
    (req as Request & { user?: { userId?: string } }).user?.userId ??
    (req as Request & { user?: { id?: string } }).user?.id;
  if (userId) return `u:${userId}`;
  return `ip:${req.ip || req.socket.remoteAddress || 'unknown'}`;
}

const rateLimitJson = {
  success: false as const,
  error: {
    code: 'RATE_LIMIT_EXCEEDED',
    message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
    retryAfter: 30,
  },
};

function onLimitReachedFactory(eventType: string): Options['handler'] {
  return (req, res, _next, options) => {
    const userId = (req as Request & { user?: { userId?: string } }).user?.userId;
    recordAbuseSafe({
      userId,
      ip: req.ip,
      endpoint: req.originalUrl || req.url,
      eventType,
      severity: eventType === 'BURST_REQUEST_DETECTED' ? 'HIGH' : 'MEDIUM',
      metadata: { method: req.method },
    });
    const retryAfterSec = Math.max(1, Math.ceil((options.windowMs || 30_000) / 1000));
    res.setHeader('Retry-After', String(retryAfterSec));
    res.status(options.statusCode).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
        retryAfter: retryAfterSec,
      },
    });
  };
}

export const rateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3_000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkipRateLimit,
  message: rateLimitJson,
  handler: onLimitReachedFactory('RATE_LIMIT_EXCEEDED'),
});

const limits = getFreePlanLimits();

/** Authenticated-user / IP minute budget (business traffic). */
export const apiUserMinuteRateLimit: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 1000,
  max: limits.apiRequestsPerMinute,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: clientKey,
  // Prefer identity-aware limits; anonymous traffic stays on global IP limiter.
  skip: (req) =>
    shouldSkipRateLimit(req) ||
    !(req as Request & { user?: { userId?: string } }).user?.userId,
  validate: false,
  message: rateLimitJson,
  handler: onLimitReachedFactory('RATE_LIMIT_EXCEEDED'),
});

/** Short burst protection (10s window). */
export const apiBurstRateLimit: RateLimitRequestHandler = rateLimit({
  windowMs: 10 * 1000,
  max: limits.apiRequestsPer10Seconds,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: clientKey,
  skip: (req) =>
    shouldSkipRateLimit(req) ||
    !(req as Request & { user?: { userId?: string } }).user?.userId,
  validate: false,
  message: rateLimitJson,
  handler: onLimitReachedFactory('BURST_REQUEST_DETECTED'),
});

/** Recommendation EXPENSIVE path — per minute. */
export const recommendationRateLimit: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 1000,
  max: limits.recommendationCallsPerMinute,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: clientKey,
  validate: false,
  message: rateLimitJson,
  handler: onLimitReachedFactory('RECOMMENDATION_LIMIT_EXCEEDED'),
});

/** OAuth login / signup complete — brute-force & credential stuffing resistance. */
export const authStrictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitJson,
  handler: onLimitReachedFactory('RATE_LIMIT_EXCEEDED'),
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

/** Community posts/comments/reports — spam resistance. */
export const contentWriteRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitJson,
  handler: onLimitReachedFactory('RATE_LIMIT_EXCEEDED'),
});

/** Search endpoints — scraping resistance (shared NAT friendly). */
export const searchRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitJson,
});

/** Push campaign send — prevent double-send spam. */
export const pushSendRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: clientKey,
  validate: false,
  message: rateLimitJson,
  handler: onLimitReachedFactory('PUSH_SEND_LIMIT_EXCEEDED'),
});

/** Apply both minute + burst budgets after optional auth has attached user. */
export const apiIdentityRateLimits: RequestHandler[] = [
  apiBurstRateLimit,
  apiUserMinuteRateLimit,
];
