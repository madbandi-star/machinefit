import './load-env.js';
import pg from 'pg';
import { createPoolConfig } from './db-config.js';

/** Critical tables that must exist after migrate — extend as features ship. */
const REQUIRED_TABLES = [
  'schema_migrations',
  'users',
  'roles',
  'user_gyms',
  'gym_members',
  'workout_logs',
  'machine_trades',
  'machine_trade_reports',
  'friendships',
] as const;

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const pool = new pg.Pool(createPoolConfig(connectionString));
  try {
    const { rows: applied } = await pool.query<{ filename: string }>(
      `SELECT filename FROM schema_migrations ORDER BY filename`
    );
    console.log(`schema_migrations: ${applied.length} applied`);
    if (applied.length > 0) {
      console.log(`  latest: ${applied[applied.length - 1]!.filename}`);
    }

    const missing: string[] = [];
    for (const table of REQUIRED_TABLES) {
      const { rows } = await pool.query<{ exists: boolean }>(
        `SELECT to_regclass($1) IS NOT NULL AS exists`,
        [`public.${table}`]
      );
      if (!rows[0]?.exists) missing.push(table);
    }

    if (missing.length > 0) {
      console.error('Missing required tables:', missing.join(', '));
      console.error('Run: npm run db:migrate');
      process.exit(2);
    }

    console.log('All required tables present.');
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
