import { privacyRetentionService } from '../services/privacy-retention.service.js';
import { logger } from '../utils/logger.js';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Daily privacy retention:
 * - GPS coordinate TTL (keep region)
 * - Consent IP/UA scrub
 * - Login event delete
 * - Deferred hard-purge for deactivated accounts
 */
export function startPrivacyRetentionJob(): void {
  const run = () => {
    void privacyRetentionService
      .runRetentionPass()
      .then((stats) => {
        const total =
          stats.gpsCleared +
          stats.consentIpScrubbed +
          stats.loginEventsDeleted +
          stats.bannerEventsDeleted +
          stats.accountsPurged;
        if (total > 0) {
          logger.warn('[privacy-retention] pass complete', stats);
        }
      })
      .catch((err) => {
        logger.error('[privacy-retention] job failed', { err: String(err) });
      });
  };

  // Delay first run slightly so boot migrations/warmup settle.
  setTimeout(run, 45_000);
  setInterval(run, DAY_MS);
}
