/** Entertainment fortune — not medical advice. */

export type FortuneStatus = 'ready' | 'needs_birth_profile';
export type FortuneMode = 'full' | 'simple';
export type FortunePersonalizationTier = 'none' | 'basic' | 'pattern' | 'advanced';

export type FortuneContentCategory =
  | 'keyword'
  | 'headline'
  | 'strategy'
  | 'pre_workout'
  | 'post_workout'
  | 'avoid'
  | 'one_liner'
  | 'style'
  | 'condition'
  | 'body_part';

export interface FortuneContentItem {
  id: string;
  category: FortuneContentCategory;
  code: string;
  locale: string;
  title: string;
  body: string;
  priority: number;
  isActive: boolean;
  dataConditions?: Record<string, unknown> | null;
  scoreWeights?: Record<string, number> | null;
  createdAt: string;
  updatedAt: string;
}

export type FortuneCoreTheme =
  | 'GROWTH_EXPAND'
  | 'FOCUS_BREAKTHROUGH'
  | 'RECOVERY_RESET'
  | 'CHANGE_STIMULUS'
  | 'STABILITY_BALANCE'
  | 'ACCUMULATE_STEADY'
  | 'EXECUTE_PUSH'
  | 'ORGANIZE_TRANSITION';

export type FortuneElement = 'wood' | 'fire' | 'earth' | 'metal' | 'water';
export type FortuneYinYang = 'yin' | 'yang';

export interface FortuneNarrativeLayer {
  key: 'base' | 'daeun' | 'seun' | 'wolun' | 'today' | 'shijin';
  /** i18n key under fortune:layer.* */
  titleKey: string;
  /** i18n key under fortune:mood.* */
  moodKey: string;
  element: FortuneElement;
}

export interface FortuneNarrative {
  coreTheme: FortuneCoreTheme;
  /** i18n key: coreTheme.<theme> */
  coreThemeLabelKey: string;
  yinYang: FortuneYinYang;
  yinYangSummaryKey: string;
  element: {
    primary: FortuneElement;
    support: FortuneElement;
    weak: FortuneElement;
  };
  layers: FortuneNarrativeLayer[];
  /** Short story keys for FE prose */
  storyLeadKey: string;
  storyBodyKey: string;
}

export interface FortuneTraditionalDetail {
  yearStem: string;
  yearBranch: string;
  monthStem: string;
  monthBranch: string;
  dayStem: string;
  dayBranch: string;
  hourStem: string | null;
  hourBranch: string | null;
  shipshin: string;
  unseong: string;
  shinsal: string[];
  yongshin: FortuneElement;
  huishin: FortuneElement;
  kishin: FortuneElement;
  /** One-line interpretation keys */
  shipshinHintKey: string;
  unseongHintKey: string;
  shinsalHintKeys: string[];
  usefulHintKey: string;
}

export interface FortuneSection {
  scoreStars: number;
  keyword: string;
  keywordTitle: string;
  title: string;
  headline: string;
  strategyLabels: string[];
  oneLiner: string;
  oneLinerDetail?: string;
  disclaimer: string;
  coreTheme?: FortuneCoreTheme;
}

export interface FortuneScores {
  healthmanIndex: number;
  prLuck: number;
  recoveryLuck: number;
  volumeLuck: number;
  focusLuck: number;
  changeLuck: number;
}

export interface FortuneCta {
  kind: 'records' | 'machines' | 'pr' | 'settings_birth';
  labelKey: string;
  href: string;
}

export interface FortuneRecommendation {
  bodyPart: string;
  bodyPartLabel: string;
  style: string;
  styleLabel: string;
  strategy: string;
  strategyLabel: string;
  avoid: string;
  avoidLabel: string;
  preWorkout: string;
  preWorkoutBody: string;
  postWorkout: string;
  postWorkoutBody: string;
  condition: string;
  conditionLabel: string;
  ctas: FortuneCta[];
}

export interface FortuneDataAnalysis {
  personalizationTier: FortunePersonalizationTier;
  workoutCount7d: number;
  workoutCount14d: number;
  workoutCount30d: number;
  logCount30d: number;
  consecutiveDays: number;
  daysSinceLastWorkout: number | null;
  daysSincePr: number | null;
  barbellRatio30d: number;
  dumbbellRatio30d: number;
  machineRatio30d: number;
  cableRatio30d: number;
  bodyweightRatio30d: number;
  freeWeightRatio30d: number;
  topMuscleGroup: string | null;
  lowMuscleGroup: string | null;
  personalizedBullets: string[];
}

export interface TodayFortuneResponse {
  date: string;
  status: FortuneStatus;
  mode?: FortuneMode;
  fortune?: FortuneSection;
  scores?: FortuneScores;
  recommendation?: FortuneRecommendation;
  dataAnalysis?: FortuneDataAnalysis | null;
  narrative?: FortuneNarrative;
  traditionalDetail?: FortuneTraditionalDetail;
  engineVersion?: string;
}
