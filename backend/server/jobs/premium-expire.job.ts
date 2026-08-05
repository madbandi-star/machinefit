import { billingService } from '../services/billing.service.js';
import { logger } from '../utils/logger.js';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Daily Premium expiry job — membership_type FREE + subscription_status expired
 * when premium_expire_at has passed.
 * Runs once on boot, then every 24h (approx. dawn cadence via host timezone).
 */
export function startPremiumExpireJob(): void {
  const run = () => {
    void billingService
      .expireOverduePremiums()
      .then((count) => {
        if (count > 0) {
          logger.warn(`[premium] expired ${count} membership(s)`);
        }
      })
      .catch((err) => {
        logger.error('[premium] expire job failed', { err: String(err) });
      });
  };

  run();
  setInterval(run, DAY_MS);
}
