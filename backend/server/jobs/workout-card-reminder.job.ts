import { workoutCardService } from '../services/workout-card.service.js';
import { logger } from '../utils/logger.js';

/** ~60 minutes — same order of magnitude as other background jobs.
 * Eligible: today’s PLANNED / COMPLETED / IN_PROGRESS cards (not SKIPPED). */
const INTERVAL_MS = 60 * 60_000;

export function startWorkoutCardReminderJob(): void {
  const tick = async () => {
    try {
      const count = await workoutCardService.sendDueReminders();
      if (count > 0) {
        logger.info(`Workout card reminders sent: ${count}`);
      }
    } catch (error) {
      logger.warn('Workout card reminder job failed', {
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  };

  void tick();
  setInterval(() => {
    void tick();
  }, INTERVAL_MS);
}
