import type { ExperienceLevel, Gender, UnitHeight, UnitWeight } from './api.types.js';
import type { YoutubeVideo } from './machine.types.js';

export interface RecommendationInput {
  machineCode: string;
  gender: Gender;
  heightCm: number;
  weightKg?: number;
  experienceLevel: ExperienceLevel;
  unitHeight?: UnitHeight;
  unitWeight?: UnitWeight;
}

export interface RecommendationSettings {
  seatPosition?: number;
  backPadPosition?: number;
  footPosition?: number;
  handlePosition?: number;
  romSetting?: string;
  recommendedWeightKg?: number;
}

export interface RecommendationResult {
  id: string;
  machineCode: string;
  machineName?: string;
  settings: RecommendationSettings;
  tips: string[];
  warnings: string[];
  youtubeVideos: YoutubeVideo[];
  createdAt: string;
}
