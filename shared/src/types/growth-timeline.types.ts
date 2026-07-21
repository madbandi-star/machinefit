type LocalizedText = { ko: string; en: string };

export type GrowthTimelinePeriod = 'day' | 'week' | 'month' | 'year';

export type GrowthChartMetric =
  | 'max_weight'
  | 'volume'
  | 'workouts'
  | 'duration'
  | 'prs'
  | 'frequency'
  | 'machines'
  | 'brands'
  | 'upper_lower'
  | 'intensity';

export interface GrowthTimelineHeadline {
  id: string;
  emoji: string;
  text: LocalizedText;
}

export interface GrowthTimelineEvent {
  id: string;
  date: string; // YYYY-MM-DD
  emoji: string;
  title: LocalizedText;
  description: LocalizedText;
  kind:
    | 'first_workout'
    | 'first_pr'
    | 'volume'
    | 'brand'
    | 'workout_count'
    | 'weight_pr'
    | 'machine'
    | 'streak'
    | 'milestone';
}

export interface GrowthBeforeNowItem {
  id: string;
  label: LocalizedText;
  beforeValue: string;
  nowValue: string;
  deltaPct: number | null;
  unit?: string;
}

export interface GrowthChartPoint {
  label: string;
  value: number;
}

export interface GrowthChartSeries {
  metric: GrowthChartMetric;
  unit: string;
  points: GrowthChartPoint[];
}

export interface GrowthInsight {
  id: string;
  emoji: string;
  text: LocalizedText;
}

export interface GrowthHighlight {
  id: string;
  emoji: string;
  title: LocalizedText;
  value: string;
  detail: LocalizedText;
}

export interface GrowthMachineHistory {
  machineCode: string;
  machineName: string;
  brandName: string | null;
  points: Array<{ date: string; maxKg: number }>;
  firstKg: number;
  currentKg: number;
  growthPct: number;
}

export interface GrowthStylePhase {
  id: string;
  periodLabel: LocalizedText;
  style: LocalizedText;
  detail: LocalizedText;
}

export interface GrowthMonthlyReport {
  yearMonth: string; // YYYY-MM
  workouts: number;
  volumeKg: number;
  prCount: number;
  topMachineName: string | null;
  avgMinutes: number;
  vsPrevMonthPct: number | null;
}

export interface GrowthWrappedSlide {
  id: string;
  emoji: string;
  title: LocalizedText;
  value: string;
  subtitle?: LocalizedText;
}

export interface GrowthWrapped {
  year: number;
  slides: GrowthWrappedSlide[];
  character: LocalizedText;
}

export interface GrowthForecast {
  disclaimer: LocalizedText;
  items: Array<{
    id: string;
    label: LocalizedText;
    current: string;
    predicted: string;
    horizon: LocalizedText;
  }>;
}

export interface GrowthCompareItem {
  id: string;
  label: LocalizedText;
  deltaPct: number;
  detail: LocalizedText;
}

export interface GrowthMemory {
  id: string;
  date: string;
  emoji: string;
  title: LocalizedText;
  detail: LocalizedText;
}

export interface GrowthTimelineSnapshot {
  analyzedAt: string;
  journeyDays: number;
  firstWorkoutDate: string | null;
  headlines: GrowthTimelineHeadline[];
  timeline: GrowthTimelineEvent[];
  beforeNow: GrowthBeforeNowItem[];
  charts: Record<GrowthTimelinePeriod, GrowthChartSeries[]>;
  insights: GrowthInsight[];
  highlights: GrowthHighlight[];
  machineHistories: GrowthMachineHistory[];
  styleEvolution: GrowthStylePhase[];
  monthlyReports: GrowthMonthlyReport[];
  wrapped: GrowthWrapped | null;
  forecast: GrowthForecast;
  comparisons: GrowthCompareItem[];
  memories: GrowthMemory[];
  shareSummary: {
    journeyDays: number;
    workouts: number;
    volumeKg: number;
    topMachineName: string | null;
    bestGrowthPct: number | null;
  };
}
