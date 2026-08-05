/**
 * Disaster-recovery probes — additive; does not replace Render `/api/v1/health` liveness.
 */
import { env } from '../config/env.js';
import {
  checkDatabaseConnection,
  probeDatabaseConnection,
  resetPool,
} from '../config/database.js';
import {
  getBuildTime,
  getBuildVersion,
  getGitCommit,
  getDeployEnv,
  getUptimeSec,
  sampleProcessResources,
} from '../ops/ops-runtime.js';
import { storageService } from '../services/storage.service.js';
import { withRetry } from '../utils/with-retry.js';
import { isAcceptingTraffic } from '../middlewares/drain-guard.middleware.js';

export type ProbeStatus = 'ok' | 'down' | 'degraded' | 'not_configured';

export type DrHealthPayload = {
  status: 'healthy' | 'unhealthy';
  server: ProbeStatus;
  database: ProbeStatus;
  supabase: ProbeStatus;
  storage: ProbeStatus;
  memory: {
    usedMb: number;
    totalMb: number;
    pct: number;
  };
  cpu: {
    pct: number | null;
    load1: number | null;
  };
  uptimeSec: number;
  version: string;
  commit: string | null;
  buildTime: string;
  env: string;
  acceptingTraffic: boolean;
  timestamp: string;
};

async function probeStorage(): Promise<ProbeStatus> {
  try {
    if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
      const ok = await withRetry(
        () => storageService.probeConnection(2_500),
        { maxAttempts: 2, baseDelayMs: 150, label: 'storage-probe' }
      );
      return ok ? 'ok' : 'down';
    }
    if (storageService.localUploadRoot) return 'ok';
    return 'not_configured';
  } catch {
    return 'down';
  }
}

async function probeSupabase(): Promise<ProbeStatus> {
  if (!env.SUPABASE_URL) return 'not_configured';
  // URL configured + DB pooler reachable is enough for "connection" signal.
  const dbOk = await checkDatabaseConnection().catch(() => false);
  if (env.SUPABASE_SERVICE_ROLE_KEY) return dbOk ? 'ok' : 'degraded';
  return dbOk ? 'degraded' : 'down';
}

export async function buildDrHealth(options?: {
  includeStorage?: boolean;
}): Promise<{ httpStatus: 200 | 503; body: DrHealthPayload }> {
  const includeStorage = options?.includeStorage !== false;
  const resources = sampleProcessResources();

  const dbProbe = await probeDatabaseConnection(2_500);
  let database: ProbeStatus = !env.DATABASE_URL
    ? 'not_configured'
    : dbProbe.ok
      ? 'ok'
      : 'down';

  // Auto-reconnect attempt once when down (additive recovery).
  if (database === 'down' && env.DATABASE_URL) {
    resetPool();
    const retry = await withRetry(() => probeDatabaseConnection(2_500), {
      maxAttempts: 2,
      baseDelayMs: 200,
    });
    if (retry.ok) database = 'ok';
  }

  const [storage, supabase] = await Promise.all([
    includeStorage ? probeStorage() : Promise.resolve('ok' as ProbeStatus),
    probeSupabase(),
  ]);

  const server: ProbeStatus =
    !isAcceptingTraffic() ||
    resources.memoryPct >= 98 ||
    (resources.cpuPct != null && resources.cpuPct >= 98)
      ? 'degraded'
      : 'ok';

  const unhealthy =
    (Boolean(env.DATABASE_URL) && database === 'down') ||
    !isAcceptingTraffic() ||
    resources.memoryPct >= 99;

  const body: DrHealthPayload = {
    status: unhealthy ? 'unhealthy' : 'healthy',
    server,
    database,
    supabase,
    storage,
    memory: {
      usedMb: Math.round(resources.memoryUsedMb),
      totalMb: Math.round(resources.memoryTotalMb),
      pct: Math.round(resources.memoryPct * 10) / 10,
    },
    cpu: {
      pct: resources.cpuPct != null ? Math.round(resources.cpuPct * 10) / 10 : null,
      load1: resources.load1,
    },
    uptimeSec: getUptimeSec(),
    version: getBuildVersion(),
    commit: getGitCommit(),
    buildTime: getBuildTime(),
    env: getDeployEnv(),
    acceptingTraffic: isAcceptingTraffic(),
    timestamp: new Date().toISOString(),
  };

  return { httpStatus: unhealthy ? 503 : 200, body };
}

export async function buildReadyProbe(): Promise<{
  httpStatus: 200 | 503;
  body: {
    status: 'ready' | 'not_ready';
    database: ProbeStatus;
    storage: ProbeStatus;
    timestamp: string;
  };
}> {
  if (!isAcceptingTraffic()) {
    return {
      httpStatus: 503,
      body: {
        status: 'not_ready',
        database: 'down',
        storage: 'down',
        timestamp: new Date().toISOString(),
      },
    };
  }

  const [dbOk, storage] = await Promise.all([
    env.DATABASE_URL
      ? checkDatabaseConnection().catch(() => false)
      : Promise.resolve(true),
    probeStorage(),
  ]);

  const database: ProbeStatus = !env.DATABASE_URL
    ? 'not_configured'
    : dbOk
      ? 'ok'
      : 'down';

  // Storage not_configured is OK for readiness (local/dev without Supabase).
  const storageOk = storage === 'ok' || storage === 'not_configured';
  const ready = (database === 'ok' || database === 'not_configured') && storageOk;

  return {
    httpStatus: ready ? 200 : 503,
    body: {
      status: ready ? 'ready' : 'not_ready',
      database,
      storage,
      timestamp: new Date().toISOString(),
    },
  };
}

export function buildLiveProbe(): {
  httpStatus: 200;
  body: { status: 'alive'; uptimeSec: number; timestamp: string };
} {
  return {
    httpStatus: 200,
    body: {
      status: 'alive',
      uptimeSec: getUptimeSec(),
      timestamp: new Date().toISOString(),
    },
  };
}

export function buildMetaPayload(): {
  env: string;
  version: string;
  commit: string | null;
  buildTime: string;
  nodeEnv: string;
  uptimeSec: number;
  timestamp: string;
} {
  return {
    env: getDeployEnv(),
    version: getBuildVersion(),
    commit: getGitCommit(),
    buildTime: getBuildTime(),
    nodeEnv: env.NODE_ENV,
    uptimeSec: getUptimeSec(),
    timestamp: new Date().toISOString(),
  };
}
