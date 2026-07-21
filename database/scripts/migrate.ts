import './load-env.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { createPoolConfig } from './db-config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, '../migrations');

const { Pool } = pg;

/** Errors that mean the migration was already applied outside schema_migrations. */
const DRIFT_CODES = new Set([
  '42P07', // duplicate_table
  '42710', // duplicate_object
  '42701', // duplicate_column
]);

function isAlreadyAppliedError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { code?: string; message?: string };
  if (e.code && DRIFT_CODES.has(e.code)) return true;
  const msg = (e.message ?? '').toLowerCase();
  return msg.includes('already exists');
}

async function run() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const pool = new Pool(createPoolConfig(connectionString));

  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const { rows } = await pool.query(
      'SELECT 1 FROM schema_migrations WHERE filename = $1',
      [file]
    );
    if (rows.length > 0) {
      console.log(`skip  ${file}`);
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    console.log(`apply ${file}`);
    await pool.query('BEGIN');
    try {
      await pool.query(sql);
      await pool.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
      await pool.query('COMMIT');
    } catch (err) {
      await pool.query('ROLLBACK');
      if (isAlreadyAppliedError(err)) {
        await pool.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
        const code = (err as { code?: string }).code ?? '?';
        console.log(`  baselined ${file} (already in DB: ${code})`);
        continue;
      }
      throw err;
    }
  }

  await pool.end();
  console.log('Migrations complete.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
