import { billingService } from '../services/billing.service.js';
import { logger } from '../utils/logger.js';

const INTERVAL_MS = 5 * 60 * 1000;

/**
 * Retry Polar subscription revoke after account withdraw when the first call failed.
 */
export function startPolarCancelRetryJob(): void {
  const run = () => {
    void billingService
      .processPolarCancelRetries()
      .then((count) => {
        if (count > 0) {
          logger.warn(`[billing] polar cancel retries completed ${count}`);
        }
      })
      .catch((err) => {
        logger.error('[billing] polar cancel retry job failed', { err: String(err) });
      });
  };

  setTimeout(run, 20_000);
  setInterval(run, INTERVAL_MS);
}
