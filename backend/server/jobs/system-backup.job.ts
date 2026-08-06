import { systemBackupService } from '../services/system-backup.service.js';
import { logger } from '../utils/logger.js';

const INTERVAL_MS = 15 * 60 * 1000; // check every 15 minutes

export function startSystemBackupJob(): void {
  const tick = () => {
    void systemBackupService.runAutoBackupIfDue().catch((err) => {
      logger.error('system-backup job tick failed', {
        message: err instanceof Error ? err.message : String(err),
      });
    });
  };
  tick();
  setInterval(tick, INTERVAL_MS);
}
