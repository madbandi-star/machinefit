import { buildLifterDnaSnapshot, type LifterDnaSnapshot } from '@machinefit/shared';
import { lifterDnaRepository } from '../repositories/lifter-dna.repository.js';
import { TtlCache } from '../utils/ttl-cache.js';

const cache = new TtlCache<LifterDnaSnapshot>(60_000);

export type LifterDnaScope = { gymId?: string; memberId?: string };

export const lifterDnaService = {
  async getSnapshot(
    userId: string,
    locale = 'ko',
    options: LifterDnaScope = {}
  ): Promise<LifterDnaSnapshot> {
    const scopeKey =
      options.gymId && options.memberId ? `${options.gymId}:${options.memberId}` : 'all';
    const cacheKey = `${userId}:${locale.slice(0, 2)}:${scopeKey}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const logScope =
      options.gymId && options.memberId
        ? { gymId: options.gymId, memberId: options.memberId }
        : undefined;

    const rows = await lifterDnaRepository.loadUserLogs(userId, locale, logScope);
    const volumeByLogId = await lifterDnaRepository.resolveVolumeByLogId(
      userId,
      rows,
      logScope
    );

    // Peer baselines (gym/global/friend/national compares) removed — they were
    // heavy aggregate queries and no longer shown on the Lifter DNA page.
    const stats = lifterDnaRepository.computeStats(rows, locale, undefined, volumeByLogId);
    const snapshot = buildLifterDnaSnapshot(stats, locale, `${userId}:${stats.analyzedLogs}`);
    cache.set(cacheKey, snapshot);
    return snapshot;
  },
};
