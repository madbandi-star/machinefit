import type { Request } from 'express';
import { env } from '../config/env.js';
import { AppError } from '../middlewares/error.middleware.js';

function allowedOrigins(): string[] {
  return env.CORS_ORIGIN.split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

function originFromRequest(req: Request): string | null {
  const origin = req.get('origin');
  if (origin) return origin.replace(/\/+$/, '');
  const referer = req.get('referer');
  if (!referer) return null;
  try {
    const url = new URL(referer);
    return url.origin;
  } catch {
    return null;
  }
}

/** Cookie-based auth mutations must come from an allowlisted Origin/Referer. */
export function assertCsrfOrigin(req: Request): void {
  const allowed = allowedOrigins();
  const origin = originFromRequest(req);
  if (origin && allowed.includes(origin)) return;
  throw new AppError(403, 'CSRF_REJECTED', 'Request origin is not allowed');
}
