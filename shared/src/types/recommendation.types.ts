import type { ExperienceLevel, Gender, UnitHeight, UnitWeight } from './api.types.js';
import type { TargetMuscleGroup, WorkoutGoal } from '../constants/workout-goals.js';
import type { YoutubeVideo } from './machine.types.js';
import type { WeightRecommendationBasis } from './weight-basis.types.js';
import type { SettingsActiveSource } from './machine-preferences.types.js';

export interface RecommendationInput {
  machineCode: string;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  experienceLevel: ExperienceLevel;
  unitHeight?: UnitHeight;
  unitWeight?: UnitWeight;
  targetMuscleGroup?: TargetMuscleGroup;
  age?: number;
  workoutGoal?: WorkoutGoal;
  /** 0.1–10.0 user scale on recommended weight (default 1). */
  weightDifficulty?: number;
  /** Active personal gym — scopes history / progressive weight. */
  gymId?: string;
  /** Active gym member — body stats & logs must belong to this member. */
  memberId?: string;
}

export interface RecommendationSettings {
  seatPosition?: number;
  backPadPosition?: number;
  footPosition?: number;
  handlePosition?: number;
  romSetting?: string;
  recommendedWeightKg?: number;
  /** Inclusive recommended rep range (e.g. hypertrophy 8–12). */
  recommendedRepsMin?: number;
  recommendedRepsMax?: number;
}

export interface RecommendationResult {
  id: string;
  machineCode: string;
  machineName?: string;
  /** Localized brand label for disambiguating same-named machines. */
  brandName?: string;
  /** Currently applied settings (adjusted wins when active). */
  settings: RecommendationSettings;
  /** Fresh AI recommendation before preference override. */
  aiRecommendedSettings?: RecommendationSettings;
  /** Saved user adjustments for this machine (may be inactive). */
  adjustedSettings?: Partial<RecommendationSettings>;
  /** Which source `settings` came from. */
  activeSource?: SettingsActiveSource;
  tips: string[];
  warnings: string[];
  youtubeVideos: YoutubeVideo[];
  createdAt: string;
  weightBasis?: WeightRecommendationBasis;
  targetMuscleGroup?: TargetMuscleGroup;
}
