import { xpRequiredForLevel, RARITY_RANK } from '../constants/achievements.js';
import type {
  AchievementCondition,
  AchievementDef,
  AchievementLevelInfo,
  AchievementMetric,
  AchievementProgressItem,
  AchievementRarity,
  AchievementSummary,
  AchievementUserStats,
  LocalizedText,
} from '../types/achievement.types.js';

const METRIC_GETTERS: Record<AchievementMetric, (s: AchievementUserStats) => number> = {
  total_volume_kg: (s) => s.totalVolumeKg,
  workout_count: (s) => s.workoutCount,
  session_days: (s) => s.sessionDays,
  current_streak: (s) => s.currentStreak,
  longest_streak: (s) => s.longestStreak,
  unique_machines: (s) => s.uniqueMachines,
  unique_brands: (s) => s.uniqueBrands,
  unique_gyms: (s) => s.uniqueGyms,
  pr_count: (s) => s.prCount,
  dawn_workouts: (s) => s.dawnWorkouts,
  morning_workouts: (s) => s.morningWorkouts,
  afternoon_workouts: (s) => s.afternoonWorkouts,
  evening_workouts: (s) => s.eveningWorkouts,
  night_workouts: (s) => s.nightWorkouts,
  chest_workouts: (s) => s.chestWorkouts,
  back_workouts: (s) => s.backWorkouts,
  legs_workouts: (s) => s.legsWorkouts,
  shoulders_workouts: (s) => s.shouldersWorkouts,
  arms_workouts: (s) => s.armsWorkouts,
  core_workouts: (s) => s.coreWorkouts,
  holiday_workouts: (s) => s.holidayWorkouts,
  new_year_workouts: (s) => s.newYearWorkouts,
  christmas_workouts: (s) => s.christmasWorkouts,
  halloween_workouts: (s) => s.halloweenWorkouts,
  summer_2026_workouts: (s) => s.summer2026Workouts,
  winter_2026_workouts: (s) => s.winter2026Workouts,
  leg_day_workouts: (s) => s.legDayWorkouts,
  bench_workouts: (s) => s.benchWorkouts,
  squat_workouts: (s) => s.squatWorkouts,
  upper_ratio_pct: (s) => s.upperRatioPct,
  lower_ratio_pct: (s) => s.lowerRatioPct,
  balance_score: (s) => s.balanceScore,
};

export function emptyAchievementStats(): AchievementUserStats {
  return {
    totalVolumeKg: 0,
    workoutCount: 0,
    sessionDays: 0,
    currentStreak: 0,
    longestStreak: 0,
    uniqueMachines: 0,
    uniqueBrands: 0,
    uniqueGyms: 0,
    prCount: 0,
    dawnWorkouts: 0,
    morningWorkouts: 0,
    afternoonWorkouts: 0,
    eveningWorkouts: 0,
    nightWorkouts: 0,
    chestWorkouts: 0,
    backWorkouts: 0,
    legsWorkouts: 0,
    shouldersWorkouts: 0,
    armsWorkouts: 0,
    coreWorkouts: 0,
    holidayWorkouts: 0,
    newYearWorkouts: 0,
    christmasWorkouts: 0,
    halloweenWorkouts: 0,
    summer2026Workouts: 0,
    winter2026Workouts: 0,
    legDayWorkouts: 0,
    benchWorkouts: 0,
    squatWorkouts: 0,
    upperRatioPct: 0,
    lowerRatioPct: 0,
    balanceScore: 0,
  };
}

export function readMetric(stats: AchievementUserStats, metric: AchievementMetric): number {
  return METRIC_GETTERS[metric](stats);
}

export function conditionMet(stats: AchievementUserStats, condition: AchievementCondition): boolean {
  const current = readMetric(stats, condition.metric);
  switch (condition.op) {
    case 'gte':
      return current >= condition.target;
    case 'lte':
      return current <= condition.target;
    case 'eq':
      return current === condition.target;
    default:
      return false;
  }
}

export function rarityFromUnlockRate(unlockRatePct: number | null | undefined): AchievementRarity | null {
  if (unlockRatePct == null || !Number.isFinite(unlockRatePct)) return null;
  if (unlockRatePct >= 50) return 'common';
  if (unlockRatePct >= 25) return 'uncommon';
  if (unlockRatePct >= 10) return 'rare';
  if (unlockRatePct >= 3) return 'epic';
  if (unlockRatePct >= 0.5) return 'legendary';
  return 'mythic';
}

export function resolveRarity(
  def: AchievementDef,
  unlockRatePct: number | null | undefined
): AchievementRarity {
  const fromRate = rarityFromUnlockRate(unlockRatePct);
  if (!fromRate) return def.rarity;
  // Never softer than the catalog floor for ultra-hard goals.
  return RARITY_RANK[fromRate] >= RARITY_RANK[def.rarity] ? fromRate : def.rarity;
}

export function computeLevelInfo(totalXp: number): AchievementLevelInfo {
  const xp = Math.max(0, Math.floor(totalXp));
  let level = 1;
  let remaining = xp;
  let need = xpRequiredForLevel(level);

  while (remaining >= need && level < 200) {
    remaining -= need;
    level += 1;
    need = xpRequiredForLevel(level);
  }

  return {
    level,
    totalXp: xp,
    xpIntoLevel: remaining,
    xpForNextLevel: need,
    xpToNextLevel: Math.max(0, need - remaining),
    progressPct: need > 0 ? Math.min(100, Math.round((remaining / need) * 1000) / 10) : 100,
  };
}

export function buildProgressItem(
  def: AchievementDef,
  stats: AchievementUserStats,
  unlocked: boolean,
  earnedAt: string | undefined,
  unlockRatePct: number | null
): AchievementProgressItem {
  const current = readMetric(stats, def.condition.metric);
  const target = def.condition.target;
  const progressPct =
    target <= 0 ? (unlocked ? 100 : 0) : Math.min(100, Math.round((current / target) * 1000) / 10);
  const obscured = Boolean(def.secret) && !unlocked;

  return {
    def,
    current,
    target,
    progressPct: unlocked ? 100 : progressPct,
    unlocked,
    earnedAt,
    rarity: resolveRarity(def, unlockRatePct),
    unlockRatePct,
    obscured,
  };
}

export function buildAchievementSummary(
  items: AchievementProgressItem[],
  totalXp: number
): AchievementSummary {
  const completed = items.filter((i) => i.unlocked).length;
  const total = items.length;
  const badgeCount = completed;
  const rareCount = items.filter(
    (i) => i.unlocked && RARITY_RANK[i.rarity] >= RARITY_RANK.epic
  ).length;
  const hiddenItems = items.filter((i) => i.def.secret);
  const hiddenUnlocked = hiddenItems.filter((i) => i.unlocked).length;
  const inProgress = items.filter((i) => !i.unlocked && !i.obscured && i.progressPct > 0).length;

  return {
    completed,
    total,
    completionPct: total > 0 ? Math.round((completed / total) * 1000) / 10 : 0,
    totalXp,
    level: computeLevelInfo(totalXp),
    badgeCount,
    rareCount,
    hiddenUnlocked,
    hiddenTotal: hiddenItems.length,
    inProgress,
  };
}

export function pickActiveTitle(
  items: AchievementProgressItem[],
  locale: 'ko' | 'en' = 'ko'
): LocalizedText | null {
  const titled = items
    .filter((i) => i.unlocked && i.def.title)
    .sort((a, b) => {
      const rarityDiff = RARITY_RANK[b.rarity] - RARITY_RANK[a.rarity];
      if (rarityDiff !== 0) return rarityDiff;
      return (b.earnedAt ?? '').localeCompare(a.earnedAt ?? '');
    });
  const best = titled[0];
  if (!best?.def.title) return null;
  void locale;
  return best.def.title;
}

export function evaluateUnlockIds(catalog: AchievementDef[], stats: AchievementUserStats): string[] {
  return catalog.filter((def) => conditionMet(stats, def.condition)).map((def) => def.id);
}
