import type { Request, Response, NextFunction } from 'express';
import {
  isActiveServiceAccessEnforced,
  isActiveServiceUsername,
} from '@machinefit/shared';

function stripApiPrefix(path: string): string {
  return path.replace(/^\/api\/v1/, '') || '/';
}

/** Paths authenticated non-allowlisted users may still call (logout / identity). */
function isServiceAccessExempt(req: Request): boolean {
  const raw = (req.originalUrl || req.url || '').split('?')[0] ?? '';
  const path = stripApiPrefix(raw);
  if (path.startsWith('/auth')) return true;
  if (path.startsWith('/me')) return true;
  if (path === '/users/me' && req.method === 'GET') return true;
  if (
    path === '/health' ||
    path === '/warmup' ||
    path === '/ready' ||
    path === '/liveness' ||
    path === '/meta'
  ) {
    return true;
  }
  if (path.startsWith('/webhook') || path.startsWith('/polar/')) return true;
  return false;
}

/**
 * Soft-launch: JWT users outside ACTIVE_SERVICE_USERNAMES cannot call APIs
 * (except auth / me / health). Guests without JWT are unaffected.
 */
export function activeServiceAccessMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!isActiveServiceAccessEnforced(process.env.ACTIVE_SERVICE_ACCESS)) {
    next();
    return;
  }
  if (!req.user) {
    next();
    return;
  }
  if (isServiceAccessExempt(req)) {
    next();
    return;
  }
  const displayName = req.user.displayName;
  if (isActiveServiceUsername(displayName)) {
    next();
    return;
  }
  res.status(403).json({
    success: false,
    error: {
      code: 'SERVICE_ACCESS_RESTRICTED',
      message: 'Service is available only to invited accounts',
    },
  });
}
