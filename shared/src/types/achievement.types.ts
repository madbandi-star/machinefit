export type LocalizedText = { ko: string; en: string };

export type AchievementCategory =
  | 'volume'
  | 'reality'
  | 'workouts'
  | 'attendance'
  | 'time_of_day'
  | 'consistency'
  | 'pr'
  | 'machine'
  | 'gym'
  | 'region'
  | 'ai'
  | 'challenge'
  | 'event'
  | 'hidden'
  | 'season'
  | 'muscle';

export type AchievementRarity =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'epic'
  | 'legendary'
  | 'mythic';

/** Metric keys evaluated by the rule engine against user stats. */
export type AchievementMetric =
  | 'total_volume_kg'
  | 'workout_count'
  | 'session_days'
  | 'current_streak'
  | 'longest_streak'
  | 'unique_machines'
  | 'unique_brands'
  | 'unique_gyms'
  | 'pr_count'
  | 'dawn_workouts'
  | 'morning_workouts'
  | 'afternoon_workouts'
  | 'evening_workouts'
  | 'night_workouts'
  | 'chest_workouts'
  | 'back_workouts'
  | 'legs_workouts'
  | 'shoulders_workouts'
  | 'arms_workouts'
  | 'core_workouts'
  | 'holiday_workouts'
  | 'new_year_workouts'
  | 'christmas_workouts'
  | 'halloween_workouts'
  | 'summer_2026_workouts'
  | 'winter_2026_workouts'
  | 'leg_day_workouts'
  | 'bench_workouts'
  | 'squat_workouts'
  | 'upper_ratio_pct'
  | 'lower_ratio_pct'
  | 'balance_score';

export type AchievementOperator = 'gte' | 'lte' | 'eq';

export interface AchievementCondition {
  metric: AchievementMetric;
  op: AchievementOperator;
  target: number;
}

export interface AchievementDef {
  id: string;
  category: AchievementCategory;
  /** Static rarity hint; live rarity prefers unlock-rate when available. */
  rarity: AchievementRarity;
  emoji: string;
  name: LocalizedText;
  description: LocalizedText;
  condition: AchievementCondition;
  xp: number;
  title?: LocalizedText;
  iconKey?: string;
  imageKey?: string;
  animationKey?: string;
  /** Hidden until unlocked — UI shows ??? */
  secret?: boolean;
  season?: boolean;
  /** Sort order within category */
  sortOrder: number;
}

export interface AchievementUserStats {
  totalVolumeKg: number;
  workoutCount: number;
  sessionDays: number;
  currentStreak: number;
  longestStreak: number;
  uniqueMachines: number;
  uniqueBrands: number;
  uniqueGyms: number;
  prCount: number;
  dawnWorkouts: number;
  morningWorkouts: number;
  afternoonWorkouts: number;
  eveningWorkouts: number;
  nightWorkouts: number;
  chestWorkouts: number;
  backWorkouts: number;
  legsWorkouts: number;
  shouldersWorkouts: number;
  armsWorkouts: number;
  coreWorkouts: number;
  holidayWorkouts: number;
  newYearWorkouts: number;
  christmasWorkouts: number;
  halloweenWorkouts: number;
  summer2026Workouts: number;
  winter2026Workouts: number;
  legDayWorkouts: number;
  benchWorkouts: number;
  squatWorkouts: number;
  upperRatioPct: number;
  lowerRatioPct: number;
  balanceScore: number;
}

export interface AchievementProgressItem {
  def: AchievementDef;
  current: number;
  target: number;
  progressPct: number;
  unlocked: boolean;
  earnedAt?: string;
  rarity: AchievementRarity;
  unlockRatePct: number | null;
  /** Secret and not yet unlocked */
  obscured: boolean;
}

export interface AchievementLevelInfo {
  level: number;
  totalXp: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  xpToNextLevel: number;
  progressPct: number;
}

export interface AchievementSummary {
  completed: number;
  total: number;
  completionPct: number;
  totalXp: number;
  level: AchievementLevelInfo;
  badgeCount: number;
  rareCount: number;
  hiddenUnlocked: number;
  hiddenTotal: number;
  inProgress: number;
}

export interface AchievementSnapshot {
  summary: AchievementSummary;
  stats: AchievementUserStats;
  items: AchievementProgressItem[];
  activeTitle: LocalizedText | null;
  newlyUnlocked: AchievementProgressItem[];
  categories: AchievementCategory[];
}

export interface AchievementRankingEntry {
  rank: number;
  userId: string;
  displayName: string;
  totalXp: number;
  level: number;
  completed: number;
  activeTitle: LocalizedText | null;
}

export interface AchievementRankingResponse {
  board: 'global';
  entries: AchievementRankingEntry[];
  me: AchievementRankingEntry | null;
}
