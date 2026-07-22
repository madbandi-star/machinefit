import {
  buildGrowthTimelineSnapshot,
  emptyGrowthTimelineSnapshot,
  type GrowthTimelineSnapshot,
} from '@machinefit/shared';
import { growthTimelineRepository } from '../repositories/growth-timeline.repository.js';
import { getPool } from '../config/database.js';
import { TtlCache } from '../utils/ttl-cache.js';
import { resolveWorkoutLoadContexts } from './workout-load.service.js';

const memoryCache = new TtlCache<GrowthTimelineSnapshot>(60_000);

export type GrowthTimelineScope = { gymId?: string; memberId?: string };

function scopeCacheKey(userId: string, options?: GrowthTimelineScope): string {
  if (options?.gymId && options?.memberId) {
    return `${userId}:${options.gymId}:${options.memberId}`;
  }
  return userId;
}

async function enrichLogsWithLoad(
  userId: string,
  logs: Awaited<ReturnType<typeof growthTimelineRepository.loadLogs>>,
  options?: GrowthTimelineScope
) {
  if (logs.length === 0) return logs;

  const asWorkoutLogs = logs.map((log) => ({
    id: log.id,
    gymId: log.gymId ?? '',
    memberId: options?.memberId ?? '',
    machineCode: log.machineCode,
    logDate: log.logDate,
    setCount: log.setCount,
    setWeightsKg: log.setWeightsKg,
    createdAt: log.createdAt,
    updatedAt: log.createdAt,
  }));

  const loadById = await resolveWorkoutLoadContexts(userId, asWorkoutLogs, {
    gymId: options?.gymId,
    memberId: options?.memberId,
  });

  return logs.map((log) => {
    const load = loadById.get(log.id);
    return {
      ...log,
      adjustedWeightKg: load?.adjustedWeight,
      recommendedWeightKg: load?.recommendedWeight,
      adjustedReps: load?.adjustedReps,
      recommendedReps: load?.recommendedReps,
    };
  });
}

export const growthTimelineService = {
  async refreshUser(
    userId: string,
    locale = 'ko',
    options?: GrowthTimelineScope
  ): Promise<GrowthTimelineSnapshot> {
    const pool = getPool();
    if (!pool) return emptyGrowthTimelineSnapshot();

    const logScope =
      options?.gymId && options?.memberId
        ? { gymId: options.gymId, memberId: options.memberId }
        : undefined;

    const [rawLogs, peers] = await Promise.all([
      growthTimelineRepository.loadLogs(userId, locale, logScope),
      growthTimelineRepository.peerAverages(),
    ]);
    const logs = await enrichLogsWithLoad(userId, rawLogs, options);

    const snapshot =
      logs.length === 0
        ? emptyGrowthTimelineSnapshot()
        : buildGrowthTimelineSnapshot({ logs, peers });

    // Persistent cache is user-keyed; only write when unscoped.
    if (!logScope) {
      await growthTimelineRepository.upsertCache(userId, snapshot, logs.length);
    }
    memoryCache.set(scopeCacheKey(userId, options), snapshot);
    return snapshot;
  },

  async getSnapshot(
    userId: string,
    locale = 'ko',
    options?: GrowthTimelineScope
  ): Promise<GrowthTimelineSnapshot> {
    const pool = getPool();
    if (!pool) return emptyGrowthTimelineSnapshot();

    const cacheKey = scopeCacheKey(userId, options);
    const hot = memoryCache.get(cacheKey);
    if (hot) return hot;

    const logScope =
      options?.gymId && options?.memberId
        ? { gymId: options.gymId, memberId: options.memberId }
        : undefined;

    if (logScope) {
      return this.refreshUser(userId, locale, options);
    }

    const logCount = await growthTimelineRepository.countLogs(userId);
    const cached = await growthTimelineRepository.getCached(userId);
    if (cached && cached.logCount === logCount) {
      memoryCache.set(cacheKey, cached.snapshot);
      return cached.snapshot;
    }

    return this.refreshUser(userId, locale, options);
  },
};
