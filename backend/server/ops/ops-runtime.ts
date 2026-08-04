import os from 'node:os';
import fs from 'node:fs';
import { env } from '../config/env.js';

const STARTED_AT = Date.now();
const RESTART_COUNT_KEY = 'mf_ops_restart_count';

function readRestartCount(): number {
  try {
    const raw = process.env.MF_OPS_RESTART_COUNT;
    if (raw && Number.isFinite(Number(raw))) return Math.max(0, Math.floor(Number(raw)));
  } catch {
    /* ignore */
  }
  // Best-effort file counter in /tmp (survives soft reloads on same host).
  try {
    const path = `/tmp/${RESTART_COUNT_KEY}`;
    const prev = fs.existsSync(path) ? Number(fs.readFileSync(path, 'utf8')) : 0;
    const next = Number.isFinite(prev) ? prev + 1 : 1;
    fs.writeFileSync(path, String(next), 'utf8');
    return next;
  } catch {
    return 1;
  }
}

const RESTART_COUNT = readRestartCount();

export function getBuildVersion(): string {
  return (
    process.env.MF_APP_VERSION ||
    process.env.RENDER_GIT_COMMIT?.slice(0, 7) ||
    process.env.npm_package_version ||
    '0.1.0'
  );
}

export function getBuildTime(): string {
  return (
    process.env.MF_BUILD_TIME ||
    process.env.RENDER_GIT_COMMIT_TIMESTAMP ||
    new Date(STARTED_AT).toISOString()
  );
}

export function getUptimeSec(): number {
  return Math.max(0, Math.floor((Date.now() - STARTED_AT) / 1000));
}

export function getRestartCount(): number {
  return RESTART_COUNT;
}

export function sampleProcessResources(): {
  cpuPct: number | null;
  memoryPct: number;
  memoryUsedMb: number;
  memoryTotalMb: number;
  load1: number | null;
  diskPct: number | null;
} {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const used = Math.max(0, totalMem - freeMem);
  const memoryPct = totalMem > 0 ? (used / totalMem) * 100 : 0;
  const load = os.loadavg()?.[0];
  const cpuCount = Math.max(1, os.cpus()?.length ?? 1);
  const cpuPct =
    typeof load === 'number' && Number.isFinite(load)
      ? Math.min(100, (load / cpuCount) * 100)
      : null;

  // Disk: best-effort via free-space of cwd (not available on all hosts).
  let diskPct: number | null = null;
  try {
    const stat = fs.statfsSync?.(process.cwd());
    if (stat && typeof stat.bavail === 'number' && typeof stat.blocks === 'number' && stat.blocks > 0) {
      const usedBlocks = stat.blocks - stat.bavail;
      diskPct = Math.min(100, Math.max(0, (usedBlocks / stat.blocks) * 100));
    }
  } catch {
    diskPct = null;
  }

  return {
    cpuPct,
    memoryPct,
    memoryUsedMb: used / (1024 * 1024),
    memoryTotalMb: totalMem / (1024 * 1024),
    load1: typeof load === 'number' ? load : null,
    diskPct,
  };
}

export function isProductionOps(): boolean {
  return env.NODE_ENV === 'production';
}

/** Strip secrets from arbitrary meta blobs before persistence. */
export function sanitizeOpsMeta(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  const banned =
    /pass(word)?|secret|token|authorization|cookie|refresh|access[_-]?token|api[_-]?key|private/i;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (banned.test(key)) {
      out[key] = '[redacted]';
      continue;
    }
    if (typeof value === 'string' && value.length > 2000) {
      out[key] = `${value.slice(0, 2000)}…`;
      continue;
    }
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      out[key] = sanitizeOpsMeta(value);
      continue;
    }
    out[key] = value;
  }
  return out;
}

export function normalizeRouteKey(method: string, originalUrl: string): string {
  const pathOnly = (originalUrl.split('?')[0] || '/').replace(/\/+/g, '/');
  const scrubbed = pathOnly
    .replace(
      /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi,
      ':id'
    )
    .replace(/\b\d{2,}\b/g, ':n');
  return `${method.toUpperCase()} ${scrubbed}`;
}

export function speedColor(avgMs: number | null | undefined): 'green' | 'yellow' | 'red' {
  if (avgMs == null || !Number.isFinite(avgMs)) return 'yellow';
  if (avgMs < 300) return 'green';
  if (avgMs < 1000) return 'yellow';
  return 'red';
}

export function percentile(sorted: number[], p: number): number | null {
  if (!sorted.length) return null;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx] ?? null;
}
