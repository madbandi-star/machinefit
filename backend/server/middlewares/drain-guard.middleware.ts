import type { Request, Response, NextFunction } from 'express';

let acceptingTraffic = true;

/** Flip to false during graceful shutdown so new work is rejected with 503. */
export function setAcceptingTraffic(value: boolean): void {
  acceptingTraffic = value;
}

export function isAcceptingTraffic(): boolean {
  return acceptingTraffic;
}

export function drainGuardMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (acceptingTraffic) {
    next();
    return;
  }
  const url = req.originalUrl || req.url || '';
  // Allow liveness while draining so orchestrators can still see the process.
  if (url.endsWith('/live') || url.endsWith('/liveness') || url.endsWith('/health')) {
    next();
    return;
  }
  res.setHeader('Connection', 'close');
  res.status(503).json({
    success: false,
    error: {
      code: 'SHUTTING_DOWN',
      message: 'Server is shutting down',
      requestId: req.requestId,
    },
  });
}
