import type { TargetMuscleGroup } from '../constants/workout-goals.js';
import type { WorkoutCardStatus } from '../constants/workout-card.js';
import type { RecommendationSettings } from './recommendation.types.js';

export interface WorkoutCard {
  id: string;
  gymId: string;
  memberId: string;
  machineCode: string;
  machineName?: string;
  brandName?: string;
  /** Resolved machine / cover image (same chain as machine search). */
  primaryImageUrl?: string;
  /** Machine catalog muscle group (selectorized / plate). */
  muscleGroup?: string;
  recommendationId?: string;
  /** Populated when recommendation_id is set (joined from machine_recommendations). */
  settings?: RecommendationSettings;
  targetMuscleGroup?: TargetMuscleGroup;
  scheduledDate: string;
  status: WorkoutCardStatus;
  setCount: number;
  setWeightsKg: number[];
  setReps?: number[];
  setCompleted?: boolean[];
  diary?: string;
  restSeconds?: number;
  displayOrder: number;
  workoutLogId?: string;
  sourceCardId?: string;
  templateId?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutCardTemplateItem {
  machineCode: string;
  targetMuscleGroup?: TargetMuscleGroup;
  setCount: number;
  setWeightsKg: number[];
  setReps?: number[];
  diary?: string;
  restSeconds?: number;
  displayOrder: number;
  recommendationId?: string;
}

export interface WorkoutCardTemplate {
  id: string;
  gymId?: string;
  name: string;
  items: WorkoutCardTemplateItem[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutCardDaySummary {
  scheduledDate: string;
  plannedCount: number;
  inProgressCount: number;
  completedCount: number;
  skippedCount: number;
  totalCount: number;
}

export interface WorkoutPlanStats {
  plannedCount: number;
  completedCount: number;
  skippedCount: number;
  completionRate: number;
  weeklyCompletionRate: number;
  monthlyCompletionRate: number;
}
