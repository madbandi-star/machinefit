export type WorkoutInsightPeriod = '30d' | '3m' | 'all';

export type WorkoutInsightViewMode = 'machine' | 'daily';

export type WorkoutCoachingFocus =
  | 'consistency'
  | 'intensity'
  | 'volume'
  | 'recovery'
  | 'maintain';

export type WorkoutComparisonLevel = 'above' | 'near' | 'below';

export interface WorkoutInsightsProfileAverage {
  avgMaxWeightKg: number;
  avgSessionVolumeKg: number;
  avgVolumeGrowthPct: number;
  avgWorkoutCount: number;
  sampleSize: number;
}

export interface WorkoutInsightsPeerComparison {
  userVolumeGrowthPct: number | null;
  peerAvgVolumeGrowthPct: number;
  relativePct: number | null;
  sampleSize: number;
  heightMinCm: number;
  heightMaxCm: number;
  weightMinKg: number;
  weightMaxKg: number;
  weightClassKey: string;
  weightClassUnlimited: boolean;
  gender: string;
}

export interface WorkoutInsightsNextTarget {
  currentMaxWeightKg: number;
  suggestedMaxWeightKg: number;
  suggestedSetWeightsKg: number[];
  setCount: number;
}

export interface WorkoutInsightsNextVolumeTarget {
  currentTotalVolumeKg: number;
  suggestedTotalVolumeKg: number;
}

export interface WorkoutInsightsCoaching {
  focus: WorkoutCoachingFocus;
  comparisonLevel: WorkoutComparisonLevel;
  plateau: boolean;
  lowFrequency: boolean;
}

export interface WorkoutInsights {
  viewMode: WorkoutInsightViewMode;
  hasProfile: boolean;
  machineCode?: string;
  machineName?: string;
  period: WorkoutInsightPeriod;
  userVolumeGrowthPct: number | null;
  userMaxWeightKg: number | null;
  userAvgSessionVolumeKg: number | null;
  userWorkoutCount: number;
  profileAverage: WorkoutInsightsProfileAverage | null;
  peerComparison: WorkoutInsightsPeerComparison | null;
  nextTarget: WorkoutInsightsNextTarget | null;
  nextVolumeTarget: WorkoutInsightsNextVolumeTarget | null;
  coaching: WorkoutInsightsCoaching | null;
}
