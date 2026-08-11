import 'dotenv/config';
import type { Server } from 'node:http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { assertProductionSafety } from './config/production-guards.js';
import { seedDevUsers } from './data/seed-dev.js';
import { getPool, warmupDatabase } from './config/database.js';
import { runPendingMigrations, shouldAutoMigrateOnBoot } from './db/run-pending-migrations.js';
import { startMachineTradeExpireJob } from './jobs/machine-trade-expire.job.js';
import { startOnlinePtOverdueJob } from './jobs/online-pt-overdue.job.js';
import { startOpsSamplingJob } from './jobs/ops-sampling.job.js';
import { startNoticePublishJob } from './jobs/notice-publish.job.js';
import { startSystemBackupJob } from './jobs/system-backup.job.js';
import { startPremiumExpireJob } from './jobs/premium-expire.job.js';
import { startWorkoutCardReminderJob } from './jobs/workout-card-reminder.job.js';
import { startPrivacyRetentionJob } from './jobs/privacy-retention.job.js';
import { startPolarCancelRetryJob } from './jobs/polar-cancel-retry.job.js';
import { registerGracefulShutdown } from './lifecycle/shutdown.js';
import { registerProcessErrorHandlers } from './lifecycle/process-errors.js';
import { logger } from './utils/logger.js';
import { initSentry } from './ops/sentry.js';
import { storageService } from './services/storage.service.js';

registerProcessErrorHandlers();

async function bootstrap(): Promise<void> {
  await initSentry();

  try {
    assertProductionSafety();
  } catch (err) {
    logger.error('Refusing to start — production safety check failed', {
      message: err instanceof Error ? err.message : String(err),
    });
    process.exit(1);
  }

  if (shouldAutoMigrateOnBoot()) {
    try {
      await runPendingMigrations();
    } catch (err) {
      logger.error('Auto-migrate failed — refusing to start', {
        message: err instanceof Error ? err.message : String(err),
        code: (err as { code?: string }).code,
      });
      process.exit(1);
    }
  }

  const app = createApp();

  if (!getPool()) {
    void seedDevUsers();
  }

  const server: Server = app.listen(env.PORT, '0.0.0.0', () => {
    // Keep sockets warm behind Render's reverse proxy.
    server.keepAliveTimeout = 65_000;
    server.headersTimeout = 66_000;

    logger.info(`MachineFit API running on port ${env.PORT}`);
    logger.info(`Liveness (Render): ${env.API_BASE_PATH}/health`);
    logger.info(`DR probes: /health /ready /live`);
    if (!getPool()) {
      logger.info('Dev mode: in-memory users only (no DATABASE_URL) — use OAuth against a DB for login');
    }

    void warmupDatabase();
    startMachineTradeExpireJob();
    startOnlinePtOverdueJob();
    startOpsSamplingJob();
    startNoticePublishJob();
    startSystemBackupJob();
    startPremiumExpireJob();
    startWorkoutCardReminderJob();
    startPrivacyRetentionJob();
    startPolarCancelRetryJob();

    void storageService.ensureMotivationAudioReady().then((result) => {
      // Production logger is WARN+ only — keep these visible on Render.
      if (result.status === 'ok') {
        logger.warn('Motivation audio storage bucket ready');
      }
      if (result.status === 'skipped') {
        logger.warn(
          `Motivation audio storage skipped — ${result.detail ?? 'set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY'}`
        );
      }
      if (result.status === 'error') {
        logger.error('Motivation audio storage bucket setup failed', { detail: result.detail });
      }
    });
  });

  registerGracefulShutdown(server);
}

void bootstrap();
