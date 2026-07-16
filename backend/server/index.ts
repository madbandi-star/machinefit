import 'dotenv/config';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { seedDevUsers } from './data/seed-dev.js';
import { getPool } from './config/database.js';

const app = createApp();

if (!getPool()) {
  void seedDevUsers();
}

app.listen(env.PORT, () => {
  console.log(`MachineFit API running on port ${env.PORT}`);
  console.log(`Health: http://localhost:${env.PORT}${env.API_BASE_PATH}/health`);
  if (!getPool()) {
    console.log('Dev mode: admin@machinefit.com / admin123');
  }
});
