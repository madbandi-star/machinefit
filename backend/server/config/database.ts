import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

let pool: pg.Pool | null = null;

function useSsl(connectionString: string): boolean {
  return (
    env.NODE_ENV === 'production' ||
    connectionString.includes('supabase.co') ||
    connectionString.includes('supabase.com')
  );
}

export function getPool(): pg.Pool | null {
  if (!env.DATABASE_URL) return null;
  if (!pool) {
    pool = new Pool({
      connectionString: env.DATABASE_URL,
      ssl: useSsl(env.DATABASE_URL) ? { rejectUnauthorized: false } : undefined,
    });
  }
  return pool;
}

export async function checkDatabaseConnection(): Promise<boolean> {
  const db = getPool();
  if (!db) return false;
  try {
    const result = await Promise.race([
      db.query('SELECT 1'),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('DB_TIMEOUT')), 3000)
      ),
    ]);
    return !!result;
  } catch {
    return false;
  }
}
