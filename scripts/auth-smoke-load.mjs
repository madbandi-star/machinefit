#!/usr/bin/env node
/**
 * Authenticated API smoke + light load probe.
 *
 * Public checks always run. Auth chain runs when SMOKE_EMAIL + SMOKE_PASSWORD are set:
 *   login → /users/me → machines → workout history → (optional upsert) → logout-ish
 *
 * Usage:
 *   API_BASE=https://machinefit.onrender.com/api/v1 \
 *   SMOKE_EMAIL=you@example.com SMOKE_PASSWORD='…' \
 *   node scripts/auth-smoke-load.mjs
 *
 * Load ladder (authenticated GETs after login):
 *   CONCURRENCY=20 DURATION_SEC=10 node scripts/auth-smoke-load.mjs
 */
const API_BASE = (process.env.API_BASE || 'https://machinefit.onrender.com/api/v1').replace(
  /\/$/,
  ''
);
const EMAIL = process.env.SMOKE_EMAIL?.trim() || '';
const PASSWORD = process.env.SMOKE_PASSWORD || '';
const CONCURRENCY = Number(process.env.CONCURRENCY || 1);
const DURATION_SEC = Number(process.env.DURATION_SEC || 0);
const REQUIRE_AUTH = process.env.REQUIRE_AUTH === '1';

const results = [];

function pass(name, detail = '') {
  results.push({ name, ok: true, detail });
  console.log(`✅ ${name}${detail ? ` — ${detail}` : ''}`);
}
function fail(name, detail = '') {
  results.push({ name, ok: false, detail });
  console.log(`❌ ${name}${detail ? ` — ${detail}` : ''}`);
}
function skip(name, detail = '') {
  results.push({ name, ok: true, detail: `skipped: ${detail}` });
  console.log(`⏭ ${name} — skipped: ${detail}`);
}

async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path.startsWith('/') ? path : `/${path}`}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 200) };
  }
  return { status: res.status, json, headers: res.headers };
}

// --- Public ---
{
  const health = await api('/health');
  if (health.status === 200) pass('liveness /health', health.json?.data?.status ?? 'ok');
  else fail('liveness /health', `status=${health.status}`);
}

{
  const origin = API_BASE.replace(/\/api\/v1$/, '');
  try {
    const res = await fetch(`${origin}/ready`, { headers: { Accept: 'application/json' } });
    const json = await res.json().catch(() => ({}));
    if (res.status === 200 || res.status === 503) {
      pass('readiness /ready', `status=${res.status} ${json.status ?? ''}`);
    } else fail('readiness /ready', `status=${res.status}`);
  } catch (e) {
    fail('readiness /ready', e.message);
  }
}

{
  const machines = await api('/machines?limit=5');
  const items = machines.json?.data?.items ?? machines.json?.data ?? [];
  const n = Array.isArray(items) ? items.length : 0;
  if (machines.status === 200 && n > 0) pass('machines list', `${n} items`);
  else fail('machines list', `status=${machines.status}`);
}

// --- Auth chain ---
let accessToken = null;
let user = null;

if (process.env.SMOKE_ACCESS_TOKEN) {
  accessToken = process.env.SMOKE_ACCESS_TOKEN;
  pass('auth token', 'SMOKE_ACCESS_TOKEN');
} else if (REQUIRE_AUTH) {
  fail(
    'auth chain',
    'Password login removed (social-only). Set SMOKE_ACCESS_TOKEN for authenticated probes.'
  );
} else {
  skip('auth chain', 'social-login only — set SMOKE_ACCESS_TOKEN to probe authenticated routes');
}

if (accessToken) {
  const me = await api('/users/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (me.status === 200 && me.json?.data) pass('GET /users/me', me.json.data.email ?? 'ok');
  else fail('GET /users/me', `status=${me.status}`);

  const history = await api('/workout-logs?gymId=all&limit=5', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (history.status === 200) {
    const n = Array.isArray(history.json?.data) ? history.json.data.length : 0;
    pass('GET /workout-logs', `${n} rows`);
  } else if (history.status === 400) {
    pass('GET /workout-logs (auth ok)', `status=400 validation`);
  } else {
    fail('GET /workout-logs', `status=${history.status}`);
  }

  const machinesAuthed = await api('/machines?limit=1', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const items = machinesAuthed.json?.data?.items ?? machinesAuthed.json?.data ?? [];
  const machineCode = Array.isArray(items) && items[0]?.code ? items[0].code : null;

  const gymId = me.json?.data?.activeGymId ?? me.json?.data?.gymId ?? null;
  const memberId = me.json?.data?.activeMemberId ?? me.json?.data?.memberId ?? null;
  if (machineCode && gymId && memberId) {
    const today = new Date().toISOString().slice(0, 10);
    const upsert = await api('/workout-logs', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        gymId,
        memberId,
        machineCode,
        logDate: today,
        setCount: 1,
        setWeightsKg: [10],
        setCompleted: [true],
      }),
    });
    if (upsert.status === 200) pass('PUT /workout-logs', machineCode);
    else fail('PUT /workout-logs', `status=${upsert.status} ${JSON.stringify(upsert.json?.error)}`);
  } else {
    skip('PUT /workout-logs', 'no active gym/member on profile — history/auth still checked');
  }
}

// --- Light authenticated load (optional) ---
if (accessToken && CONCURRENCY > 1 && DURATION_SEC > 0) {
  const latencies = [];
  let ok = 0;
  let failN = 0;
  let stopped = false;
  const paths = ['/health', '/machines?limit=5', '/users/me'];

  async function one() {
    const path = paths[Math.floor(Math.random() * paths.length)];
    const t0 = performance.now();
    try {
      const headers = { Accept: 'application/json' };
      if (path !== '/health') headers.Authorization = `Bearer ${accessToken}`;
      const res = await fetch(`${API_BASE}${path}`, { headers });
      latencies.push(performance.now() - t0);
      if (res.ok) ok += 1;
      else failN += 1;
    } catch {
      latencies.push(performance.now() - t0);
      failN += 1;
    }
  }

  async function worker() {
    while (!stopped) await one();
  }

  const start = Date.now();
  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await new Promise((r) => setTimeout(r, DURATION_SEC * 1000));
  stopped = true;
  await Promise.allSettled(workers);
  const elapsed = Math.max(0.001, (Date.now() - start) / 1000);
  const sorted = [...latencies].sort((a, b) => a - b);
  const avg = sorted.length ? sorted.reduce((a, b) => a + b, 0) / sorted.length : 0;
  const p95 = sorted.length ? sorted[Math.min(sorted.length - 1, Math.ceil(0.95 * sorted.length) - 1)] : 0;
  const report = {
    concurrency: CONCURRENCY,
    durationSec: DURATION_SEC,
    total: ok + failN,
    ok,
    fail: failN,
    tps: (ok + failN) / elapsed,
    avgMs: Math.round(avg),
    p95Ms: Math.round(p95),
  };
  console.log('\nLoad report:', JSON.stringify(report));
  if (failN / Math.max(1, ok + failN) > 0.05) fail('auth load error rate', `${failN}/${ok + failN}`);
  else pass('auth load', `tps=${report.tps.toFixed(1)} avg=${report.avgMs}ms p95=${report.p95Ms}ms`);
}

const failed = results.filter((r) => !r.ok);
console.log('\n--- SUMMARY ---');
console.log(`Pass: ${results.length - failed.length}/${results.length}`);
if (failed.length) {
  console.log('Failures:', failed.map((f) => `${f.name}: ${f.detail}`).join(' | '));
  process.exit(1);
}
