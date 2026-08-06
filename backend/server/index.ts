import 'dotenv/config';
import type { Server } from 'node:http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { seedDevUsers } from './data/seed-dev.js';
import { getPool, warmupDatabase } from './config/database.js';
import { startMachineTradeExpireJob } from './jobs/machine-trade-expire.job.js';
import { startOnlinePtOverdueJob } from './jobs/online-pt-overdue.job.js';
import { startOpsSamplingJob } from './jobs/ops-sampling.job.js';
import { startNoticePublishJob } from './jobs/notice-publish.job.js';
import { registerGracefulShutdown } from './lifecycle/shutdown.js';
import { registerProcessErrorHandlers } from './lifecycle/process-errors.js';
import { logger } from './utils/logger.js';
import { initSentry } from './ops/sentry.js';
import { storageService } from './services/storage.service.js';

registerProcessErrorHandlers();
void initSentry();

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
    logger.info('Dev mode: admin@machinefit.com / admin123');
  }

  void warmupDatabase();
  startMachineTradeExpireJob();
  startOnlinePtOverdueJob();
  startOpsSamplingJob();
  startNoticePublishJob();

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
