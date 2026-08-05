import type { Server } from 'node:http';
import { env } from '../config/env.js';
import { closePool } from '../config/database.js';
import { setAcceptingTraffic } from '../middlewares/drain-guard.middleware.js';
import { logger } from '../utils/logger.js';

let shuttingDown = false;

/**
 * Graceful shutdown: stop accepting → drain → close DB → exit.
 * Render sends SIGTERM on deploy / scale-down.
 */
export function registerGracefulShutdown(server: Server): void {
  const shutdown = (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    setAcceptingTraffic(false);
    logger.warn('Graceful shutdown started', { signal });

    const forceTimer = setTimeout(() => {
      logger.error('Shutdown grace exceeded — forcing exit');
      process.exit(1);
    }, env.SHUTDOWN_GRACE_MS);
    forceTimer.unref?.();

    server.close((err) => {
      void (async () => {
        try {
          await closePool();
          logger.warn('DB pool closed');
        } catch (closeErr) {
          logger.error('DB pool close failed', {
            message: closeErr instanceof Error ? closeErr.message : String(closeErr),
          });
        }
        clearTimeout(forceTimer);
        if (err) {
          logger.error('HTTP server close error', { message: err.message });
          process.exit(1);
        }
        logger.warn('Shutdown complete');
        process.exit(0);
      })();
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}
