import pg from 'pg';
import { env } from './env.js';
import { apiPerfAls } from '../middlewares/api-perf.middleware.js';

const { Pool } = pg;

let pool: pg.Pool | null = null;
let poolQueryInstrumented = false;

function instrumentPoolQuery(active: pg.Pool): void {
  if (poolQueryInstrumented) return;
  poolQueryInstrumented = true;
  const originalQuery = active.query.bind(active) as pg.Pool['query'];
  // Attribute every pool.query to the active request ALS store (API_PERF_LOG / dev only stores).
  active.query = ((...args: Parameters<pg.Pool['query']>) => {
    const marks = apiPerfAls.getStore();
    if (!marks) {
      return (originalQuery as (...a: unknown[]) => unknown)(...args);
    }
    const started = Date.now();
    const result = (originalQuery as (...a: unknown[]) => unknown)(...args);
    if (result && typeof (result as Promise<unknown>).then === 'function') {
      return (result as Promise<unknown>).finally(() => {
        marks.markDb(Date.now() - started);
      });
    }
    marks.markDb(Date.now() - started);
    return result;
  }) as pg.Pool['query'];
}

function useSsl(connectionString: string): boolean {
  return (
    env.NODE_ENV === 'production' ||
    connectionString.includes('supabase.co') ||
    connectionString.includes('supabase.com')
  );
}

function poolMax(): number {
  // Prefer transaction pooler + moderate per-instance max when scaling horizontally.
  // Override with DATABASE_POOL_MAX (clamped 2–100).
  const raw = Number(env.DATABASE_POOL_MAX);
  if (Number.isFinite(raw) && raw >= 2 && raw <= 100) return Math.floor(raw);
  return 20;
}

export function getPool(): pg.Pool | null {
  if (!env.DATABASE_URL) return null;
  if (!pool) {
    pool = new Pool({
      connectionString: env.DATABASE_URL,
      ssl: useSsl(env.DATABASE_URL) ? { rejectUnauthorized: false } : undefined,
      max: poolMax(),
      idleTimeoutMillis: env.DATABASE_POOL_IDLE_TIMEOUT_MS,
      connectionTimeoutMillis: env.DATABASE_POOL_CONNECTION_TIMEOUT_MS,
      allowExitOnIdle: false,
    });
      pool.on('connect', (client) => {
      void client.query('SET statement_timeout = 30000');
    });
    pool.on('error', (err) => {
      // Idle client errors — keep process alive; next query will reconnect.
      try {
        // Dynamic import-safe: avoid circular deps at module load.
        void import('../utils/logger.js').then(({ logger }) => {
          logger.error('pg pool error', {
            message: err.message,
            code: (err as { code?: string }).code,
          });
        });
      } catch {
        /* ignore */
      }
    });
    instrumentPoolQuery(pool);
  }
  return pool;
}

/** Safe DB URL shape for diagnostics — never includes password. */
export function getDatabaseUrlDiag(): {
  configured: boolean;
  host: string | null;
  port: string | null;
  database: string | null;
  userPrefix: string | null;
  hasPgbouncerParam: boolean;
} {
  const raw = env.DATABASE_URL?.trim() ?? '';
  if (!raw) {
    return {
      configured: false,
      host: null,
      port: null,
      database: null,
      userPrefix: null,
      hasPgbouncerParam: false,
    };
  }
  try {
    const u = new URL(raw.replace(/^postgresql:/i, 'http:'));
    return {
      configured: true,
      host: u.hostname || null,
      port: u.port || null,
      database: u.pathname.replace(/^\//, '') || null,
      userPrefix: decodeURIComponent(u.username || '').slice(0, 32) || null,
      hasPgbouncerParam: u.searchParams.get('pgbouncer') === 'true',
    };
  } catch {
    return {
      configured: true,
      host: null,
      port: null,
      database: null,
      userPrefix: null,
      hasPgbouncerParam: /pgbouncer=true/i.test(raw),
    };
  }
}

export type DatabaseProbeResult = {
  ok: boolean;
  code: string | null;
  /** Short safe hint — no connection string / password. */
  hint: string | null;
  /** Sanitized driver message (password / URL stripped). */
  detail: string | null;
};

function sanitizeDbErrorMessage(raw: string): string {
  return raw
    .replace(/postgresql:\/\/[^@\s]+@/gi, 'postgresql://***@')
    .replace(/password\s*=\s*[^;\s]+/gi, 'password=***')
    .replace(/:[^:@/\s]+@/g, ':***@')
    .slice(0, 240);
}

/** Probe DB and return a password-safe error classification. */
export async function probeDatabaseConnection(
  timeoutMs = 5000
): Promise<DatabaseProbeResult> {
  const db = getPool();
  if (!db) {
    return {
      ok: false,
      code: 'NO_DATABASE_URL',
      hint: 'DATABASE_URL is missing',
      detail: null,
    };
  }
  try {
    await Promise.race([
      db.query('SELECT 1'),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('DB_TIMEOUT')), timeoutMs)
      ),
    ]);
    return { ok: true, code: null, hint: null, detail: null };
  } catch (err) {
    const e = err as { code?: string; message?: string };
    const msg = String(e.message ?? err);
    const detail = sanitizeDbErrorMessage(msg);
    const code = e.code || (msg.includes('DB_TIMEOUT') ? 'DB_TIMEOUT' : 'DB_ERROR');
    let hint = 'Database connection failed';
    if (code === '28P01' || /password authentication failed/i.test(msg)) {
      hint = 'Password authentication failed — reset DB password and paste Transaction URI into Render';
    } else if (/tenant or user not found/i.test(msg)) {
      hint = 'Tenant/user not found — use user postgres.PROJECT_REF on pooler Transaction URI';
    } else if (code === 'ENOTFOUND' || /getaddrinfo/i.test(msg)) {
      hint = 'Host not found — check pooler hostname (no spaces)';
    } else if (code === 'ECONNREFUSED') {
      hint = 'Connection refused — check port 6543 for Transaction mode';
    } else if (code === 'DB_TIMEOUT' || /timeout/i.test(msg)) {
      hint = 'Connection timed out';
    } else if (/EMAXCONN|max clients reached/i.test(msg)) {
      hint = 'Pooler max clients reached — lower DATABASE_POOL_MAX or use Transaction :6543';
    } else if (/Invalid URL|ERR_INVALID_URL/i.test(msg)) {
      hint = 'DATABASE_URL is not a valid URL (space in port? unescaped password?)';
    } else if (code === 'XX000') {
      hint = 'Pooler internal error — see detail; often wrong mode/user or SSL';
    }
    return { ok: false, code, hint, detail };
  }
}

/** Pre-open a pool connection so the first user request avoids TLS + connect cost. */
export async function warmupDatabase(): Promise<boolean> {
  const probe = await probeDatabaseConnection(5_000);
  return probe.ok;
}

export async function checkDatabaseConnection(): Promise<boolean> {
  const probe = await probeDatabaseConnection(3_000);
  return probe.ok;
}

/** Drop the pool so the next getPool() rebuilds connections (DR reconnect). */
export async function closePool(): Promise<void> {
  if (!pool) return;
  const current = pool;
  pool = null;
  try {
    await current.end();
  } catch {
    /* ignore */
  }
}

/** Sync reset used when a probe fails — next getPool recreates. */
export function resetPool(): void {
  if (!pool) return;
  const current = pool;
  pool = null;
  void current.end().catch(() => undefined);
}
