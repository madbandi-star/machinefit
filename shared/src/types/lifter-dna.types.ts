export type LifterDnaLocaleText = { ko: string; en: string };

export type LifterDnaTraitId =
  | 'power'
  | 'intensity'
  | 'explosiveness'
  | 'endurance'
  | 'growth'
  | 'consistency'
  | 'balance'
  | 'variety'
  | 'challenge'
  | 'prRate';

export interface LifterDnaCharacterDef {
  id: string;
  emoji: string;
  name: LifterDnaLocaleText;
  tagline: LifterDnaLocaleText;
  /** Trait weights used for matching (0–1). */
  weights: Partial<Record<LifterDnaTraitId, number>>;
  /** Extra signal hooks beyond traits. */
  signals?: {
    preferMuscle?: string[];
    preferHour?: 'dawn' | 'day' | 'night';
    preferPushPull?: 'push' | 'pull' | 'balanced';
    highVolume?: boolean;
    highVariety?: boolean;
    prHunter?: boolean;
  };
}

export interface LifterDnaBadgeDef {
  id: string;
  emoji: string;
  name: LifterDnaLocaleText;
  description: LifterDnaLocaleText;
  /** Rule id evaluated by analyzer. */
  rule: string;
}

export interface LifterDnaTraitScore {
  id: LifterDnaTraitId;
  emoji: string;
  label: string;
  stars: number;
  score: number;
}

export interface LifterDnaHabitItem {
  id: string;
  emoji: string;
  label: string;
  value: string;
}

export interface LifterDnaRecommendation {
  id: string;
  text: string;
}

export interface LifterDnaForecast {
  id: string;
  label: string;
  stars: number;
  detail: string;
}

export interface LifterDnaCompareItem {
  id: string;
  label: string;
  deltaPct: number;
}

export interface LifterDnaBadgeAward {
  id: string;
  emoji: string;
  name: string;
  description: string;
}

export interface LifterDnaCharacterResult {
  id: string;
  emoji: string;
  name: string;
  tagline: string;
}

export interface LifterDnaSnapshot {
  character: LifterDnaCharacterResult;
  confidence: number;
  confidenceStars: number;
  analyzedLogs: number;
  analyzedAt: string;
  oneLiner: string;
  traits: LifterDnaTraitScore[];
  habits: LifterDnaHabitItem[];
  recommendations: LifterDnaRecommendation[];
  forecast: LifterDnaForecast[];
  friendCompare: LifterDnaCompareItem[];
  gymCompare: LifterDnaCompareItem[];
  nationalCompare: LifterDnaCompareItem[];
  globalCompare: LifterDnaCompareItem[];
  badges: LifterDnaBadgeAward[];
  shareHeadline: string;
}
