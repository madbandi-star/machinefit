import { buildLifterDnaSnapshot, type LifterDnaSnapshot } from '@machinefit/shared';
import { lifterDnaRepository } from '../repositories/lifter-dna.repository.js';
import { userGymRepository } from '../repositories/user-gym.repository.js';
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

    const gyms = await userGymRepository.listByUser(userId);
    const activeGymId =
      options.gymId ?? gyms.find((g) => g.isDefault)?.id ?? gyms[0]?.id;

    const logScope =
      options.gymId && options.memberId
        ? { gymId: options.gymId, memberId: options.memberId }
        : undefined;

    const [rows, globalPeer, gymPeer] = await Promise.all([
      lifterDnaRepository.loadUserLogs(userId, locale, logScope),
      lifterDnaRepository.peerBaseline('global'),
      activeGymId
        ? lifterDnaRepository.peerBaseline('gym', activeGymId)
        : Promise.resolve(undefined),
    ]);

    // Friend/national approximations from gym + slightly shifted global
    const friendPeer = gymPeer
      ? {
          ...gymPeer,
          intensity: gymPeer.intensity * 0.95,
          consistency: gymPeer.consistency * 0.92,
          volume: gymPeer.volume * 0.9,
        }
      : {
          ...globalPeer,
          intensity: globalPeer.intensity * 0.9,
          consistency: globalPeer.consistency * 0.88,
        };

    const nationalPeer = {
      ...globalPeer,
      intensity: globalPeer.intensity * 1.02,
      volume: globalPeer.volume * 1.05,
      consistency: globalPeer.consistency * 1.01,
    };

    const stats = lifterDnaRepository.computeStats(rows, locale, {
      friend: friendPeer,
      gym: gymPeer ?? globalPeer,
      national: nationalPeer,
      global: globalPeer,
    });

    const snapshot = buildLifterDnaSnapshot(stats, locale, `${userId}:${stats.analyzedLogs}`);
    cache.set(cacheKey, snapshot);
    return snapshot;
  },
};
