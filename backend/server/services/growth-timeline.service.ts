import {
  buildGrowthTimelineSnapshot,
  emptyGrowthTimelineSnapshot,
  type GrowthTimelineSnapshot,
} from '@machinefit/shared';
import { growthTimelineRepository } from '../repositories/growth-timeline.repository.js';
import { getPool } from '../config/database.js';
import { TtlCache } from '../utils/ttl-cache.js';

const memoryCache = new TtlCache<GrowthTimelineSnapshot>(60_000);

export type GrowthTimelineScope = { gymId?: string; memberId?: string };

function scopeCacheKey(userId: string, options?: GrowthTimelineScope): string {
  if (options?.gymId && options?.memberId) {
    return `${userId}:${options.gymId}:${options.memberId}`;
  }
  return userId;
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

    const [logs, peers] = await Promise.all([
      growthTimelineRepository.loadLogs(userId, locale, logScope),
      growthTimelineRepository.peerAverages(),
    ]);

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
