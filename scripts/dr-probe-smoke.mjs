#!/usr/bin/env node
/**
 * Smoke checks for DR probes (read-only).
 *
 *   API_ORIGIN=https://machinefit.onrender.com node scripts/dr-probe-smoke.mjs
 */
const ORIGIN = (process.env.API_ORIGIN || 'http://localhost:3001').replace(/\/$/, '');

async function check(path, expectOkStatuses = [200, 503]) {
  const url = `${ORIGIN}${path}`;
  const t0 = performance.now();
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    const ms = Math.round(performance.now() - t0);
    const requestId = res.headers.get('x-request-id');
    let body = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    const ok = expectOkStatuses.includes(res.status);
    return { path, ok, status: res.status, ms, requestId, body };
  } catch (err) {
    return {
      path,
      ok: false,
      status: 0,
      ms: Math.round(performance.now() - t0),
      requestId: null,
      error: String(err),
    };
  }
}

const results = [];
results.push(await check('/live', [200]));
results.push(await check('/health', [200, 503]));
results.push(await check('/ready', [200, 503]));
results.push(await check('/api/v1/health', [200]));
results.push(await check('/api/v1/liveness', [200]));
results.push(await check('/api/v1/ready', [200, 503]));
results.push(await check('/api/v1/meta', [200]));

const failed = results.filter((r) => !r.ok);
console.log(JSON.stringify({ origin: ORIGIN, results, failed: failed.length }, null, 2));
process.exit(failed.length ? 1 : 0);
