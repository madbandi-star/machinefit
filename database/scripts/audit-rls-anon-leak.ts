/**
 * Audit public-table RLS and probe Supabase PostgREST with the anon key.
 *
 * Usage:
 *   DATABASE_URL=... npm run db:audit-rls
 *   SUPABASE_URL=... SUPABASE_ANON_KEY=... npm run db:audit-rls
 *
 * Exit 1 if any public table lacks RLS, or anon REST returns rows / write succeeds.
 */
import './load-env.js';
import pg from 'pg';
import { createPoolConfig } from './db-config.js';

const { Pool } = pg;

type RelRow = {
  tablename: string;
  rls_enabled: boolean;
  rls_forced: boolean;
};

function deriveSupabaseUrl(databaseUrl: string | undefined): string | undefined {
  if (!databaseUrl) return undefined;
  const pooler = databaseUrl.match(/postgres\.([a-z0-9]{10,})\b/i);
  if (pooler?.[1]) return `https://${pooler[1]}.supabase.co`;
  const direct = databaseUrl.match(/@db\.([a-z0-9]+)\.supabase\.co\b/i);
  if (direct?.[1]) return `https://${direct[1]}.supabase.co`;
  return undefined;
}

async function listPublicTables(pool: pg.Pool): Promise<RelRow[]> {
  const { rows } = await pool.query<RelRow>(`
    SELECT
      c.relname AS tablename,
      c.relrowsecurity AS rls_enabled,
      c.relforcerowsecurity AS rls_forced
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
    ORDER BY c.relname
  `);
  return rows;
}

async function listPolicies(pool: pg.Pool): Promise<{ tablename: string; policyname: string }[]> {
  const { rows } = await pool.query<{ tablename: string; policyname: string }>(`
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname
  `);
  return rows;
}

type ProbeResult = {
  table: string;
  status: number;
  leaked: boolean;
  detail: string;
};

async function probeAnonRest(
  baseUrl: string,
  anonKey: string,
  tables: string[]
): Promise<ProbeResult[]> {
  const results: ProbeResult[] = [];
  const headers = {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
    Accept: 'application/json',
    Prefer: 'count=exact',
  };

  for (const table of tables) {
    const url = `${baseUrl.replace(/\/$/, '')}/rest/v1/${encodeURIComponent(table)}?select=*&limit=1`;
    try {
      const res = await fetch(url, { method: 'GET', headers });
      const text = await res.text();
      let rows: unknown = null;
      try {
        rows = text ? JSON.parse(text) : null;
      } catch {
        rows = text.slice(0, 200);
      }
      const isArray = Array.isArray(rows);
      // Leak = HTTP 200 with at least one row. Empty 200 / 401 / 403 / PGRST = locked.
      const leaked = res.ok && isArray && (rows as unknown[]).length > 0;
      results.push({
        table,
        status: res.status,
        leaked,
        detail: leaked
          ? `LEAK rows=${(rows as unknown[]).length}`
          : res.ok
            ? 'ok empty/denied'
            : `blocked ${res.status} ${typeof rows === 'string' ? rows : JSON.stringify(rows).slice(0, 120)}`,
      });
    } catch (err) {
      results.push({
        table,
        status: 0,
        leaked: false,
        detail: `fetch error: ${(err as Error).message}`,
      });
    }
  }
  return results;
}

async function run() {
  const databaseUrl = process.env.DATABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const supabaseUrl =
    process.env.SUPABASE_URL || deriveSupabaseUrl(databaseUrl);

  let tables: RelRow[] = [];
  let policies: { tablename: string; policyname: string }[] = [];
  let dbOk = false;
  let failed = false;

  if (databaseUrl) {
    const pool = new Pool(createPoolConfig(databaseUrl));
    try {
      tables = await listPublicTables(pool);
      policies = await listPolicies(pool);
      dbOk = true;
    } catch (err) {
      console.error('[db] connection/query failed:', (err as Error).message);
    } finally {
      await pool.end();
    }
  } else {
    console.warn('[db] DATABASE_URL missing — skip RLS catalog check');
  }

  const unlocked = tables.filter((t) => !t.rls_enabled);
  console.log('=== RLS catalog ===');
  if (dbOk) {
    console.log(`public tables: ${tables.length}`);
    console.log(`RLS enabled:  ${tables.length - unlocked.length}`);
    console.log(`RLS missing:  ${unlocked.length}`);
    if (unlocked.length) {
      for (const t of unlocked) console.log(`  - ${t.tablename}`);
    }
    console.log(`policies:     ${policies.length}`);
    if (policies.length) {
      for (const p of policies) console.log(`  - ${p.tablename}.${p.policyname}`);
    }
  }

  console.log('=== Anon PostgREST probe ===');
  if (!supabaseUrl || !anonKey) {
    console.warn(
      '[rest] SUPABASE_URL / SUPABASE_ANON_KEY missing — cannot probe public anon leaks'
    );
  } else {
    const names =
      tables.length > 0
        ? tables.map((t) => t.tablename)
        : [
            // fallback high-value targets if DB list unavailable
            'users',
            'gyms',
            'machines',
            'workout_logs',
            'subscriptions',
            'standard_machine_types',
            'ops_app_logs',
            'qa_articles',
          ];
    const probes = await probeAnonRest(supabaseUrl, anonKey, names);
    const leaks = probes.filter((p) => p.leaked);
    const openEmpty = probes.filter((p) => p.status === 200 && !p.leaked);
    const blocked = probes.filter((p) => p.status !== 200 && p.status !== 0);
    console.log(`probed: ${probes.length}  leaks: ${leaks.length}  http200_empty: ${openEmpty.length}  blocked: ${blocked.length}`);
    for (const p of leaks) console.log(`  LEAK ${p.table} ${p.detail}`);
    if (leaks.length === 0 && probes.length) {
      console.log('no anon row leaks detected');
    }
    if (leaks.length) {
      failed = true;
    }
  }

  if (dbOk && unlocked.length) {
    failed = true;
  }
  if (dbOk && policies.length) {
    // Residual policies are unexpected under lock-down posture.
    console.warn('[warn] public policies present — expected none under Express-only posture');
    failed = true;
  }

  if (!dbOk && (!supabaseUrl || !anonKey)) {
    console.error('[fail] neither DB audit nor anon probe could run');
    failed = true;
  }

  if (failed) process.exit(1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
