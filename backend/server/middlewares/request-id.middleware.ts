import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      /** Epoch ms when request entered the pipeline. */
      requestStartedAt?: number;
    }
  }
}

const HEADER = 'x-request-id';

/** Attach / echo X-Request-ID on every request (additive DR correlation). */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.headers[HEADER];
  const fromClient =
    typeof incoming === 'string' && incoming.trim().length > 0 && incoming.trim().length <= 128
      ? incoming.trim()
      : null;
  const id = fromClient ?? randomUUID();
  req.requestId = id;
  req.requestStartedAt = Date.now();
  res.setHeader('X-Request-ID', id);
  next();
}
