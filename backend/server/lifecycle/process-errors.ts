import { logger } from '../utils/logger.js';

let installed = false;

/**
 * Capture fatal process errors into structured logs (+ optional ops ingest).
 * Does not change request handling paths.
 */
export function registerProcessErrorHandlers(): void {
  if (installed) return;
  installed = true;

  process.on('unhandledRejection', (reason) => {
    const message = reason instanceof Error ? reason.message : String(reason);
    const stack = reason instanceof Error ? reason.stack : undefined;
    logger.error('unhandledRejection', { message, stack });
    void ingestFatal('unhandledRejection', message, stack);
  });

  process.on('uncaughtException', (err) => {
    logger.error('uncaughtException', { message: err.message, stack: err.stack });
    void ingestFatal('uncaughtException', err.message, err.stack).finally(() => {
      // Give logs a brief flush window, then exit so Render restarts the process.
      setTimeout(() => process.exit(1), 500).unref?.();
    });
  });
}

async function ingestFatal(title: string, message: string, stack?: string): Promise<void> {
  try {
    const { captureSentryException } = await import('../ops/sentry.js');
    await captureSentryException(new Error(`${title}: ${message}`), { stack, source: 'process' });
  } catch {
    /* ignore */
  }
  try {
    const { opsService } = await import('../services/ops.service.js');
    await opsService.ingest(
      [
        {
          type: 'error',
          error: {
            title,
            message,
            stack,
            severity: 'critical',
            source: 'backend',
          },
        },
      ],
      { userId: null, ip: null, userAgent: null }
    );
  } catch {
    /* ignore */
  }
}
