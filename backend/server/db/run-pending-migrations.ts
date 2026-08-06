import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPool } from '../config/database.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

/** Stable lock key so multiple Render instances do not race migrations. */
const MIGRATE_LOCK_KEY = 872314102;

const DRIFT_CODES = new Set(['42P07', '42710', '42701']);

function isAlreadyAppliedError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { code?: string; message?: string };
  if (e.code && DRIFT_CODES.has(e.code)) return true;
  const msg = (e.message ?? '').toLowerCase();
  return msg.includes('already exists');
}

function resolveMigrationsDir(): string | null {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.join(process.cwd(), 'database/migrations'),
    path.join(process.cwd(), '../database/migrations'),
    path.resolve(here, '../../../../database/migrations'),
    path.resolve(here, '../../../database/migrations'),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(dir)) return dir;
  }
  return null;
}

/**
 * Apply pending SQL files from database/migrations using the process DATABASE_URL.
 * Used on Render boot when the Cloud Agent cannot reach Postgres with a stale secret.
 */
export async function runPendingMigrations(): Promise<{ applied: string[]; skipped: number }> {
  const pool = getPool();
  if (!pool) {
    logger.warn('Auto-migrate skipped: DATABASE_URL not configured');
    return { applied: [], skipped: 0 };
  }

  const migrationsDir = resolveMigrationsDir();
  if (!migrationsDir) {
    throw new Error('database/migrations directory not found (auto-migrate)');
  }

  const client = await pool.connect();
  const applied: string[] = [];
  let skipped = 0;

  try {
    await client.query('SELECT pg_advisory_lock($1)', [MIGRATE_LOCK_KEY]);

    await client.query(`
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
      const { rows } = await client.query<{ ok: number }>(
        'SELECT 1 AS ok FROM schema_migrations WHERE filename = $1',
        [file]
      );
      if (rows.length > 0) {
        skipped += 1;
        continue;
      }

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      logger.warn(`Auto-migrate apply ${file}`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
        applied.push(file);
      } catch (err) {
        await client.query('ROLLBACK');
        if (isAlreadyAppliedError(err)) {
          await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
          applied.push(file);
          logger.warn(`Auto-migrate baselined ${file} (already in DB)`);
          continue;
        }
        throw err;
      }
    }
  } finally {
    try {
      await client.query('SELECT pg_advisory_unlock($1)', [MIGRATE_LOCK_KEY]);
    } catch {
      /* ignore unlock errors */
    }
    client.release();
  }

  if (applied.length > 0) {
    logger.warn(`Auto-migrate complete: applied ${applied.length}, skipped ${skipped}`);
  } else {
    logger.warn(`Auto-migrate complete: no pending files (skipped ${skipped})`);
  }

  return { applied, skipped };
}

/** Production default: run. Set AUTO_MIGRATE_ON_BOOT=false to disable. */
export function shouldAutoMigrateOnBoot(): boolean {
  const raw = process.env.AUTO_MIGRATE_ON_BOOT?.trim().toLowerCase();
  if (raw === 'false' || raw === '0' || raw === 'off') return false;
  if (raw === 'true' || raw === '1' || raw === 'on') return true;
  return env.NODE_ENV === 'production';
}
