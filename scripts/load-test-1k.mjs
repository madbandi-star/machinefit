#!/usr/bin/env node
/**
 * Lightweight concurrent load probe for MachineFit API.
 *
 * Usage:
 *   API_BASE=https://YOUR.onrender.com/api/v1 node scripts/load-test-1k.mjs
 *   CONCURRENCY=100 DURATION_SEC=30 node scripts/load-test-1k.mjs
 *
 * Does not require auth for /health and /warmup. Measures latency distribution.
 */
const API_BASE = (process.env.API_BASE || 'http://localhost:3001/api/v1').replace(/\/$/, '');
const CONCURRENCY = Number(process.env.CONCURRENCY || 100);
const DURATION_SEC = Number(process.env.DURATION_SEC || 20);
const PATHS = (process.env.PATHS || '/health,/warmup').split(',').map((p) => p.trim());

const latencies = [];
let ok = 0;
let fail = 0;
let inFlight = 0;
let stopped = false;

async function oneRequest(path) {
  const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  const t0 = performance.now();
  inFlight += 1;
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    const ms = performance.now() - t0;
    latencies.push(ms);
    if (res.ok) ok += 1;
    else fail += 1;
  } catch {
    latencies.push(performance.now() - t0);
    fail += 1;
  } finally {
    inFlight -= 1;
  }
}

async function worker() {
  while (!stopped) {
    const path = PATHS[Math.floor(Math.random() * PATHS.length)];
    await oneRequest(path);
  }
}

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[idx];
}

const start = Date.now();
const workers = Array.from({ length: CONCURRENCY }, () => worker());
await new Promise((r) => setTimeout(r, DURATION_SEC * 1000));
stopped = true;
await Promise.allSettled(workers);
// Drain in-flight briefly
await new Promise((r) => setTimeout(r, 2000));

const elapsedSec = Math.max(0.001, (Date.now() - start) / 1000);
const sorted = [...latencies].sort((a, b) => a - b);
const sum = sorted.reduce((a, b) => a + b, 0);
const avg = sorted.length ? sum / sorted.length : 0;
const total = ok + fail;

const report = {
  apiBase: API_BASE,
  concurrency: CONCURRENCY,
  durationSec: DURATION_SEC,
  paths: PATHS,
  totalRequests: total,
  ok,
  fail,
  errorRate: total ? fail / total : 0,
  tps: total / elapsedSec,
  avgMs: avg,
  p50Ms: percentile(sorted, 50),
  p95Ms: percentile(sorted, 95),
  p99Ms: percentile(sorted, 99),
  maxMs: sorted.length ? sorted[sorted.length - 1] : 0,
};

console.log(JSON.stringify(report, null, 2));
if (report.errorRate > 0.01 || report.p95Ms > 500) {
  process.exitCode = 2;
}
