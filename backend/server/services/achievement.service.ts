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

export const achievementService = {
  /** Refresh stats + award newly unlocked achievements for a user. */
  async refreshUser(userId: string): Promise<{ newlyUnlockedIds: string[] }> {
    const pool = getPool();
    if (!pool) return { newlyUnlockedIds: [] };

    const stats = await achievementRepository.computeStatsFromLogs(userId);
    const earned = await achievementRepository.listEarned(userId);
    const unlockedIds = new Set(evaluateUnlockIds(ACHIEVEMENT_CATALOG, stats));

    const toAward = ACHIEVEMENT_CATALOG.filter(
      (def) => unlockedIds.has(def.id) && !earned.has(def.id)
    ).map((def) => ({ achievementId: def.id, xp: def.xp }));

    const newlyUnlockedIds = await achievementRepository.awardMany(userId, toAward);

    const earnedAfter = await achievementRepository.listEarned(userId);
    let totalXp = 0;
    for (const e of earnedAfter.values()) totalXp += e.xpAwarded;

    const unlockCounts = await achievementRepository.getUnlockCounts();
    const activeUsers = await achievementRepository.countActiveUsers();
    const items = ACHIEVEMENT_CATALOG.map((def) => {
      const earnedMeta = earnedAfter.get(def.id);
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

    const activeTitle = pickActiveTitle(items);
    const levelInfo = computeLevelInfo(totalXp);

    await achievementRepository.upsertStats(userId, stats, {
      totalXp,
      level: levelInfo.level,
      activeTitle,
    });

    return { newlyUnlockedIds };
  },

  async getSnapshot(userId: string): Promise<AchievementSnapshot> {
    const pool = getPool();
    if (!pool) return emptySnapshot();

    const refreshResult = await this.refreshUser(userId);
    const statsBundle = await achievementRepository.getStats(userId);
    const earned = await achievementRepository.listEarned(userId);
    const unlockCounts = await achievementRepository.getUnlockCounts();
    const activeUsers = await achievementRepository.countActiveUsers();

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

    const newlyUnlocked = items.filter((i) => refreshResult.newlyUnlockedIds.includes(i.def.id));

    return {
      summary: buildAchievementSummary(items, totalXp),
      stats,
      items,
      activeTitle: activeTitle ?? pickActiveTitle(items),
      newlyUnlocked,
      categories: ACHIEVEMENT_CATEGORIES,
    };
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
      const mine = await achievementRepository.getStats(userId);
      const earned = await achievementRepository.listEarned(userId);
      const user = await userRepository.findById(userId);
      const all = await achievementRepository.listTopByXp(10_000);
      const idx = all.findIndex((r) => r.userId === userId);
      me = {
        rank: idx >= 0 ? idx + 1 : all.length + 1,
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
