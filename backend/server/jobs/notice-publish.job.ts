import { noticeService } from '../services/notice.service.js';
import { logger } from '../utils/logger.js';

const INTERVAL_MS = 60_000;

export function startNoticePublishJob(): void {
  const tick = async () => {
    try {
      const count = await noticeService.publishDueReserved();
      if (count > 0) {
        logger.info(`Published ${count} reserved notice(s)`);
      }
    } catch (error) {
      logger.warn('Notice publish job failed', {
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  };

  void tick();
  setInterval(() => {
    void tick();
  }, INTERVAL_MS);
}
