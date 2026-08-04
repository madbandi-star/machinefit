import type { Request, Response } from 'express';
import { checkDatabaseConnection, warmupDatabase } from '../config/database.js';
import { opsService } from '../services/ops.service.js';

/**
 * Liveness probe for Render / load balancers.
 *
 * IMPORTANT: Always return HTTP 200 while the process is up.
 * Host memory/CPU/disk "red" from ops sampling must NOT take the service out of
 * rotation — that caused production 502s and broke social login after ops monitoring.
 * Detailed status stays in the JSON body; use GET /ops/health for ops severity.
 */
export async function healthCheck(_req: Request, res: Response): Promise<void> {
  try {
    const health = await opsService.getHealth();
    const degraded = health.statusColor !== 'green';
    res.status(200).json({
      success: true,
      data: {
        status: degraded ? 'degraded' : 'ok',
        timestamp: health.checkedAt,
        database:
          health.database === 'ok'
            ? 'connected'
            : health.database === 'not_configured'
              ? 'not_configured'
              : 'error',
        server: health.server,
        storage: health.storage,
        version: health.version,
        buildTime: health.buildTime,
        statusColor: health.statusColor,
        uptimeSec: health.uptimeSec,
      },
    });
    return;
  } catch {
    // Fallback to legacy lightweight probe.
  }

  const dbConnected = await Promise.race([
    checkDatabaseConnection(),
    new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 1500)),
  ]);

  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbConnected ? 'connected' : 'not_configured',
    },
  });
}

/** Explicit warm endpoint for Render free-tier wake + pool priming. */
export async function warmup(_req: Request, res: Response): Promise<void> {
  const ok = await warmupDatabase();
  res.json({
    success: true,
    data: {
      status: ok ? 'warm' : 'unavailable',
      timestamp: new Date().toISOString(),
    },
  });
}
