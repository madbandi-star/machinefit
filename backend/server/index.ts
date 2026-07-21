import 'dotenv/config';
import type { Server } from 'node:http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { seedDevUsers } from './data/seed-dev.js';
import { getPool, warmupDatabase } from './config/database.js';

const app = createApp();

if (!getPool()) {
  void seedDevUsers();
}

const server: Server = app.listen(env.PORT, () => {
  // Keep sockets warm behind Render's reverse proxy.
  server.keepAliveTimeout = 65_000;
  server.headersTimeout = 66_000;

  console.log(`MachineFit API running on port ${env.PORT}`);
  console.log(`Health: http://localhost:${env.PORT}${env.API_BASE_PATH}/health`);
  if (!getPool()) {
    console.log('Dev mode: admin@machinefit.com / admin123');
  }

  void warmupDatabase();
});
