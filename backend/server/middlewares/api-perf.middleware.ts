import type { Request, Response, NextFunction } from 'express';

/**
 * Optional API timing breakdown (dev / API_PERF_LOG=1).
 * Logs only durations — never tokens, emails, or request bodies.
 * Does not alter JSON responses.
 */
export type ApiPerfMarks = {
  startedAt: number;
  authMs?: number;
  dbMs: number;
  logicMs: number;
  markDb(ms: number): void;
  markAuth(ms: number): void;
};

declare global {
  namespace Express {
    interface Request {
      apiPerf?: ApiPerfMarks;
    }
  }
}

function perfEnabled(): boolean {
  if (process.env.API_PERF_LOG === '1' || process.env.API_PERF_LOG === 'true') return true;
  return process.env.NODE_ENV === 'development';
}

export function createApiPerfMarks(startedAt = Date.now()): ApiPerfMarks {
  return {
    startedAt,
    dbMs: 0,
    logicMs: 0,
    markDb(ms: number) {
      if (ms > 0) this.dbMs += ms;
    },
    markAuth(ms: number) {
      if (ms > 0) this.authMs = (this.authMs ?? 0) + ms;
    },
  };
}

export function apiPerfMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!perfEnabled()) {
    next();
    return;
  }

  const marks = createApiPerfMarks();
  req.apiPerf = marks;

  res.on('finish', () => {
    const total = Date.now() - marks.startedAt;
    const auth = marks.authMs ?? 0;
    const db = marks.dbMs;
    const accounted = auth + db;
    const logic = Math.max(0, total - accounted);
    const route = req.route?.path ? `${req.baseUrl}${req.route.path}` : req.originalUrl.split('?')[0];
    // eslint-disable-next-line no-console
    console.info(
      `[api-perf] ${req.method} ${route} Total:${total}ms Auth:${auth}ms DB:${db}ms Logic:~${logic}ms Status:${res.statusCode}`
    );
  });

  next();
}

/** Time an async DB call and attribute duration to the request perf marks. */
export async function withDbTiming<T>(req: Request | undefined, work: () => Promise<T>): Promise<T> {
  const started = Date.now();
  try {
    return await work();
  } finally {
    req?.apiPerf?.markDb(Date.now() - started);
  }
}
