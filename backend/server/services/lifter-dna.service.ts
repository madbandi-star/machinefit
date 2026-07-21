import { buildLifterDnaSnapshot, type LifterDnaSnapshot } from '@machinefit/shared';
import { lifterDnaRepository } from '../repositories/lifter-dna.repository.js';
import { userGymRepository } from '../repositories/user-gym.repository.js';
import { TtlCache } from '../utils/ttl-cache.js';

const cache = new TtlCache<LifterDnaSnapshot>(60_000);

export const lifterDnaService = {
  async getSnapshot(userId: string, locale = 'ko'): Promise<LifterDnaSnapshot> {
    const cacheKey = `${userId}:${locale.slice(0, 2)}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const gyms = await userGymRepository.listByUser(userId);
    const activeGymId = gyms.find((g) => g.isDefault)?.id ?? gyms[0]?.id;

    const [rows, globalPeer, gymPeer] = await Promise.all([
      lifterDnaRepository.loadUserLogs(userId, locale),
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
