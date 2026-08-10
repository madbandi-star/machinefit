import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type pg from 'pg';
import { getPool } from '../config/database.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

/** Stable lock key so multiple Render instances do not race migrations. */
const MIGRATE_LOCK_KEY = 872314102;

const DRIFT_CODES = new Set(['42P07', '42710', '42701']);

type Queryable = Pick<pg.PoolClient, 'query'>;

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

async function ensureSchemaMigrationsTable(client: Queryable): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function loadAppliedFilenames(client: Queryable): Promise<Set<string>> {
  const { rows } = await client.query<{ filename: string }>(
    'SELECT filename FROM schema_migrations'
  );
  return new Set(rows.map((r) => r.filename));
}

/**
 * Apply pending SQL files from database/migrations using the process DATABASE_URL.
 * Used on Render boot when the Cloud Agent cannot reach Postgres with a stale secret.
 *
 * Important: use transaction-scoped advisory locks (not session locks). Session
 * `pg_advisory_lock` orphans under PgBouncer transaction pooling and then blocks
 * every subsequent boot with statement_timeout 57014.
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

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const client = await pool.connect();
  const applied: string[] = [];
  let skipped = 0;

  try {
    await ensureSchemaMigrationsTable(client);

    const already = await loadAppliedFilenames(client);
    const pending = files.filter((f) => !already.has(f));
    skipped = files.length - pending.length;

    if (pending.length === 0) {
      logger.warn(`Auto-migrate complete: no pending files (skipped ${skipped})`);
      return { applied: [], skipped };
    }

    // Transaction-scoped lock: released on COMMIT/ROLLBACK; safe with PgBouncer.
    // SET LOCAL keeps timeouts on this txn even when the pooler swaps servers between txns.
    await client.query('BEGIN');
    try {
      await client.query(`SET LOCAL statement_timeout = 0`);
      await client.query(`SET LOCAL lock_timeout = '120s'`);
      await client.query('SELECT pg_advisory_xact_lock($1)', [MIGRATE_LOCK_KEY]);

      const appliedNow = await loadAppliedFilenames(client);
      for (const file of pending) {
        if (appliedNow.has(file)) {
          skipped += 1;
          continue;
        }

        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
        logger.warn(`Auto-migrate apply ${file}`);
        await client.query('SAVEPOINT sp_mig');
        try {
          await client.query(sql);
          await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
          await client.query('RELEASE SAVEPOINT sp_mig');
          applied.push(file);
        } catch (err) {
          await client.query('ROLLBACK TO SAVEPOINT sp_mig');
          if (isAlreadyAppliedError(err)) {
            await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
            applied.push(file);
            logger.warn(`Auto-migrate baselined ${file} (already in DB)`);
            continue;
          }
          throw err;
        }
      }

      await client.query('COMMIT');
    } catch (err) {
      try {
        await client.query('ROLLBACK');
      } catch {
        /* ignore */
      }
      throw err;
    }
  } finally {
    client.release();
  }

  logger.warn(`Auto-migrate complete: applied ${applied.length}, skipped ${skipped}`);
  return { applied, skipped };
}

/** Production default: run. Set AUTO_MIGRATE_ON_BOOT=false to disable. */
export function shouldAutoMigrateOnBoot(): boolean {
  const raw = process.env.AUTO_MIGRATE_ON_BOOT?.trim().toLowerCase();
  if (raw === 'false' || raw === '0' || raw === 'off') return false;
  if (raw === 'true' || raw === '1' || raw === 'on') return true;
  return env.NODE_ENV === 'production';
}
