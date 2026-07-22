import {
  ACHIEVEMENT_CATALOG,
  ACHIEVEMENT_CATEGORIES,
  buildAchievementSummary,
  buildProgressItem,
  computeLevelInfo,
  emptyAchievementStats,
  evaluateUnlockIds,
  pickActiveTitle,
  type AchievementProgressItem,
  type AchievementRankingResponse,
  type AchievementSnapshot,
} from '@machinefit/shared';
import { achievementRepository } from '../repositories/achievement.repository.js';
import { getPool } from '../config/database.js';
import { userRepository } from '../repositories/user.repository.js';

/** In-process revision fingerprints — skip full recompute when logs are unchanged. */
const logsRevisionCache = new Map<string, string>();

/** Assembled snapshots keyed by revision — skip rebuild tax on repeated reads. */
const snapshotCache = new Map<string, { revision: string; snapshot: AchievementSnapshot }>();

const META_TTL_MS = 10 * 60_000;
let unlockMetaCache:
  | {
      expiresAt: number;
      unlockCounts: Map<string, number>;
      activeUsers: number;
    }
  | null = null;

function revisionKey(userId: string, options?: { gymId?: string; memberId?: string }): string {
  if (options?.gymId && options?.memberId) {
    return `${userId}:${options.gymId}:${options.memberId}`;
  }
  return userId;
}

async function loadUnlockMeta(): Promise<{
  unlockCounts: Map<string, number>;
  activeUsers: number;
}> {
  if (unlockMetaCache && unlockMetaCache.expiresAt > Date.now()) {
    return {
      unlockCounts: unlockMetaCache.unlockCounts,
      activeUsers: unlockMetaCache.activeUsers,
    };
  }
  const [unlockCounts, activeUsers] = await Promise.all([
    achievementRepository.getUnlockCounts(),
    achievementRepository.countActiveUsers(),
  ]);
  unlockMetaCache = {
    expiresAt: Date.now() + META_TTL_MS,
    unlockCounts,
    activeUsers,
  };
  return { unlockCounts, activeUsers };
}

function assembleSnapshot(
  statsBundle: Awaited<ReturnType<typeof achievementRepository.getStats>>,
  earned: Map<string, { earnedAt: string; xpAwarded: number }>,
  unlockCounts: Map<string, number>,
  activeUsers: number,
  newlyUnlockedIds: string[]
): AchievementSnapshot {
  const { totalXp, level: _level, activeTitle, ...stats } = statsBundle;
  void _level;

  const items: AchievementProgressItem[] = ACHIEVEMENT_CATALOG.map((def) => {
    const earnedMeta = earned.get(def.id);
    const unlockCount = unlockCounts.get(def.id) ?? 0;
    const unlockRatePct = Math.round((unlockCount / activeUsers) * 1000) / 10;
    return buildProgressItem(
      def,
      stats,
      Boolean(earnedMeta),
      earnedMeta?.earnedAt,
      unlockRatePct
    );
  });

  const newlyUnlocked = items.filter((i) => newlyUnlockedIds.includes(i.def.id));

  return {
    summary: buildAchievementSummary(items, totalXp),
    stats,
    items,
    activeTitle: activeTitle ?? pickActiveTitle(items),
    newlyUnlocked,
    categories: ACHIEVEMENT_CATEGORIES,
  };
}

export const achievementService = {
  /** Refresh stats + award newly unlocked achievements for a user. */
  async refreshUser(
    userId: string,
    options?: { gymId?: string; memberId?: string },
    knownRevision?: string
  ): Promise<{ newlyUnlockedIds: string[] }> {
    const pool = getPool();
    if (!pool) return { newlyUnlockedIds: [] };

    const key = revisionKey(userId, options);
    const revision =
      knownRevision ?? (await achievementRepository.getLogsRevision(userId, options));
    if (logsRevisionCache.get(key) === revision) {
      return { newlyUnlockedIds: [] };
    }

    const stats = await achievementRepository.computeStatsFromLogs(userId, options);
    const earned = await achievementRepository.listEarned(userId);
    const unlockedIds = new Set(evaluateUnlockIds(ACHIEVEMENT_CATALOG, stats));

    const toAward = ACHIEVEMENT_CATALOG.filter(
      (def) => unlockedIds.has(def.id) && !earned.has(def.id)
    ).map((def) => ({ achievementId: def.id, xp: def.xp }));

    const newlyUnlockedIds = await achievementRepository.awardMany(userId, toAward);
    if (newlyUnlockedIds.length) {
      unlockMetaCache = null;
    }

    const [earnedAfter, meta] = await Promise.all([
      achievementRepository.listEarned(userId),
      loadUnlockMeta(),
    ]);
    let totalXp = 0;
    for (const e of earnedAfter.values()) totalXp += e.xpAwarded;

    const items = ACHIEVEMENT_CATALOG.map((def) => {
      const earnedMeta = earnedAfter.get(def.id);
      const unlockCount = meta.unlockCounts.get(def.id) ?? 0;
      const unlockRatePct = Math.round((unlockCount / meta.activeUsers) * 1000) / 10;
      return buildProgressItem(
        def,
        stats,
        Boolean(earnedMeta),
        earnedMeta?.earnedAt,
        unlockRatePct
      );
    });

    const activeTitle = pickActiveTitle(items);
    const levelInfo = computeLevelInfo(totalXp);

    await achievementRepository.upsertStats(userId, stats, {
      totalXp,
      level: levelInfo.level,
      activeTitle,
    });

    logsRevisionCache.set(key, revision);
    snapshotCache.delete(key);
    return { newlyUnlockedIds };
  },

  async getSnapshot(
    userId: string,
    options?: { gymId?: string; memberId?: string }
  ): Promise<AchievementSnapshot> {
    const pool = getPool();
    if (!pool) return emptySnapshot();

    const key = revisionKey(userId, options);
    const revision = await achievementRepository.getLogsRevision(userId, options);
    const hot = snapshotCache.get(key);
    if (hot && hot.revision === revision) {
      return hot.snapshot;
    }

    // Refresh is a no-op when the logs revision matches the last compute.
    const refreshResult = await this.refreshUser(userId, options, revision);
    const [statsBundle, earned, meta] = await Promise.all([
      achievementRepository.getStats(userId),
      achievementRepository.listEarned(userId),
      loadUnlockMeta(),
    ]);

    const snapshot = assembleSnapshot(
      statsBundle,
      earned,
      meta.unlockCounts,
      meta.activeUsers,
      refreshResult.newlyUnlockedIds
    );

    snapshotCache.set(key, {
      revision,
      snapshot: { ...snapshot, newlyUnlocked: [] },
    });
    return snapshot;
  },

  async getRankings(userId: string, limit = 50): Promise<AchievementRankingResponse> {
    const pool = getPool();
    if (!pool) {
      return { board: 'global', entries: [], me: null };
    }

    await this.refreshUser(userId);
    const top = await achievementRepository.listTopByXp(limit);
    const entries = top.map((row, idx) => ({
      rank: idx + 1,
      userId: row.userId,
      displayName: row.displayName,
      totalXp: row.totalXp,
      level: row.level,
      completed: row.completed,
      activeTitle: row.activeTitle,
    }));

    let me = entries.find((e) => e.userId === userId) ?? null;
    if (!me) {
      const [mine, earned, user] = await Promise.all([
        achievementRepository.getStats(userId),
        achievementRepository.listEarned(userId),
        userRepository.findById(userId),
      ]);
      const rank = await achievementRepository.rankByXp(mine.totalXp);
      me = {
        rank,
        userId,
        displayName: user?.displayName ?? 'Me',
        totalXp: mine.totalXp,
        level: mine.level,
        completed: earned.size,
        activeTitle: mine.activeTitle,
      };
    }

    return { board: 'global', entries, me };
  },
};

function emptySnapshot(): AchievementSnapshot {
  const stats = emptyAchievementStats();
  const items = ACHIEVEMENT_CATALOG.map((def) =>
    buildProgressItem(def, stats, false, undefined, null)
  );
  return {
    summary: buildAchievementSummary(items, 0),
    stats,
    items,
    activeTitle: null,
    newlyUnlocked: [],
    categories: ACHIEVEMENT_CATEGORIES,
  };
}
