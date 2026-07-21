import {
  buildGrowthTimelineSnapshot,
  emptyGrowthTimelineSnapshot,
  type GrowthTimelineSnapshot,
} from '@machinefit/shared';
import { growthTimelineRepository } from '../repositories/growth-timeline.repository.js';
import { getPool } from '../config/database.js';
import { TtlCache } from '../utils/ttl-cache.js';

const memoryCache = new TtlCache<GrowthTimelineSnapshot>(60_000);

export const growthTimelineService = {
  async refreshUser(userId: string, locale = 'ko'): Promise<GrowthTimelineSnapshot> {
    const pool = getPool();
    if (!pool) return emptyGrowthTimelineSnapshot();

    const [logs, peers] = await Promise.all([
      growthTimelineRepository.loadLogs(userId, locale),
      growthTimelineRepository.peerAverages(),
    ]);

    const snapshot =
      logs.length === 0
        ? emptyGrowthTimelineSnapshot()
        : buildGrowthTimelineSnapshot({ logs, peers });

    await growthTimelineRepository.upsertCache(userId, snapshot, logs.length);
    memoryCache.set(userId, snapshot);
    return snapshot;
  },

  async getSnapshot(userId: string, locale = 'ko'): Promise<GrowthTimelineSnapshot> {
    const pool = getPool();
    if (!pool) return emptyGrowthTimelineSnapshot();

    const hot = memoryCache.get(userId);
    if (hot) return hot;

    const logCount = await growthTimelineRepository.countLogs(userId);
    const cached = await growthTimelineRepository.getCached(userId);
    if (cached && cached.logCount === logCount) {
      memoryCache.set(userId, cached.snapshot);
      return cached.snapshot;
    }

    return this.refreshUser(userId, locale);
  },
};
