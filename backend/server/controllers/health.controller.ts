import type { Request, Response } from 'express';
import { probeDatabaseConnection, warmupDatabase } from '../config/database.js';
import { getBuildTime, getBuildVersion, getUptimeSec } from '../ops/ops-runtime.js';

/**
 * Liveness probe for Render (`healthCheckPath: /api/v1/health`).
 *
 * Must stay fast and always HTTP 200 while the Node process is alive.
 * Do not await DB / ops aggregation here — that previously returned 503 on
 * host memory pressure and took the API out of rotation (social login 502).
 * Detailed status: GET /ops/health (admin ops dashboard).
 */
export async function healthCheck(_req: Request, res: Response): Promise<void> {
  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: getBuildVersion(),
      buildTime: getBuildTime(),
      uptimeSec: getUptimeSec(),
      features: {
        templateShare: true,
      },
    },
  });
}

/** Explicit warm endpoint for Render free-tier wake + pool priming. */
export async function warmup(_req: Request, res: Response): Promise<void> {
  const ok = await warmupDatabase();
  const probe = await probeDatabaseConnection(5_000);
  // Keep public response minimal — host/userPrefix belong in admin ops, not the open internet.
  res.status(200).json({
    success: true,
    data: {
      status: ok ? 'warm' : 'unavailable',
      database: probe.ok ? 'connected' : 'error',
      timestamp: new Date().toISOString(),
    },
  });
}
