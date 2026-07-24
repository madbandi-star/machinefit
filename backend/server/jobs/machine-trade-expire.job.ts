import { machineTradeService } from '../services/machine-trade.service.js';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Daily expiry job (server-side only). Marks overdue active listings as expired.
 * Runs once on boot, then every 24 hours.
 */
export function startMachineTradeExpireJob(): void {
  const run = () => {
    void machineTradeService.expireOverdue().then((count) => {
      if (count > 0) {
        console.log(`[machine-trade] expired ${count} listing(s)`);
      }
    }).catch((err) => {
      console.error('[machine-trade] expire job failed', err);
    });
  };

  run();
  setInterval(run, DAY_MS);
}
