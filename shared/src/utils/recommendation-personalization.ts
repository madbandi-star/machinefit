import type { WorkoutGoal, TargetMuscleGroup } from '../constants/workout-goals.js';
import type { RecommendationSettings } from '../types/recommendation.types.js';
import { roundRecommendWeightKg } from './recommend-weight.js';

/** Workout goal adjusts working weight (strength = heavier, rehab = lighter). */
export const WORKOUT_GOAL_WEIGHT_MULTIPLIERS: Record<WorkoutGoal, number> = {
  hypertrophy: 1,
  strength: 1.08,
  diet: 0.92,
  conditioning: 0.88,
  rehab: 0.75,
  posture: 0.85,
};

const TARGET_MUSCLE_WEIGHT_BIAS: Record<TargetMuscleGroup, number> = {
  back: 1,
  chest: 1.02,
  legs: 1.05,
  shoulders: 0.95,
  biceps: 0.88,
  triceps: 0.9,
};

const TARGET_MUSCLE_TIPS_KO: Record<TargetMuscleGroup, string> = {
  back: '오늘은 등 중심 — 견갑 안정·광배 수축에 집중하세요.',
  chest: '오늘은 가슴 중심 — 견갑 고정 후 가슴으로 밀어주세요.',
  legs: '오늘은 하체 중심 — 무릎 트래킹과 힙 힌지를 확인하세요.',
  shoulders: '오늘은 어깨 중심 — 과도한 승모 개입을 줄이세요.',
  biceps: '오늘은 이두 중심 — 팔꿈치 고정 후 수축 구간을 천천히.',
  triceps: '오늘은 삼두 중심 — 팔꿈치를 몸 가까이 두고 끝까지 펴세요.',
};

const TARGET_MUSCLE_TIPS_EN: Record<TargetMuscleGroup, string> = {
  back: 'Back focus today — stabilize scapula and drive through the lats.',
  chest: 'Chest focus today — keep shoulders set and press through the chest.',
  legs: 'Leg focus today — track knees and control the hip hinge.',
  shoulders: 'Shoulder focus today — limit trap takeover on pressing.',
  biceps: 'Biceps focus today — keep elbows fixed and control the squeeze.',
  triceps: 'Triceps focus today — tuck elbows and fully extend at the top.',
};

const GOAL_TIPS_KO: Record<WorkoutGoal, string> = {
  hypertrophy: '목표: 근비대 — 8~12회, 마지막 2~3세트 RIR 1~2.',
  strength: '목표: 근력 — 3~6회, 긴 휴식, 폼 우선.',
  diet: '목표: 다이어트 — 중량 유지·볼륨 점진적 조절.',
  conditioning: '목표: 컨디셔닝 — 짧은 휴식, 전신 펌핑.',
  rehab: '목표: 재활 — 가벼운 중량, 통증 없는 범위.',
  posture: '목표: 체형 — 가동범위와 자세 교정 우선.',
};

const GOAL_TIPS_EN: Record<WorkoutGoal, string> = {
  hypertrophy: 'Goal: hypertrophy — 8–12 reps, last 2–3 sets at RIR 1–2.',
  strength: 'Goal: strength — 3–6 reps, longer rest, form first.',
  diet: 'Goal: fat loss — maintain load, manage volume.',
  conditioning: 'Goal: conditioning — short rest, full-body pump.',
  rehab: 'Goal: rehab — light load, pain-free range.',
  posture: 'Goal: posture — ROM and alignment over load.',
};

/** Recommended working-rep range by training goal (trainer defaults). */
export function recommendRepsForGoal(goal?: WorkoutGoal): { min: number; max: number } {
  switch (goal) {
    case 'strength':
      return { min: 3, max: 6 };
    case 'diet':
      return { min: 10, max: 15 };
    case 'conditioning':
      return { min: 12, max: 15 };
    case 'rehab':
      return { min: 12, max: 15 };
    case 'posture':
      return { min: 10, max: 12 };
    case 'hypertrophy':
    default:
      return { min: 8, max: 12 };
  }
}

/** Age factor vs reference age 30 (13–100). */
export function ageWeightFactor(age?: number): number {
  if (age == null || age < 13) return 1;
  if (age <= 25) return 0.95 + (age - 13) * 0.004;
  if (age <= 40) return 1;
  if (age <= 55) return 1 - (age - 40) * 0.008;
  return Math.max(0.75, 1 - (age - 40) * 0.008);
}

export function applyPersonalizationToWeight(
  weightKg: number | undefined,
  options: {
    workoutGoal?: WorkoutGoal;
    age?: number;
    targetMuscleGroup?: TargetMuscleGroup;
  }
): number | undefined {
  if (weightKg == null || weightKg <= 0) return weightKg;

  let value = weightKg;
  if (options.workoutGoal) {
    value *= WORKOUT_GOAL_WEIGHT_MULTIPLIERS[options.workoutGoal];
  }
  value *= ageWeightFactor(options.age);
  if (options.targetMuscleGroup) {
    value *= TARGET_MUSCLE_WEIGHT_BIAS[options.targetMuscleGroup];
  }

  return roundRecommendWeightKg(value);
}

export function mergeSettingsWithPreferences(
  base: RecommendationSettings,
  preferences?: Partial<RecommendationSettings> | null
): RecommendationSettings {
  if (!preferences) return { ...base };

  return {
    seatPosition: preferences.seatPosition ?? base.seatPosition,
    backPadPosition: preferences.backPadPosition ?? base.backPadPosition,
    footPosition: preferences.footPosition ?? base.footPosition,
    handlePosition: preferences.handlePosition ?? base.handlePosition,
    romSetting: preferences.romSetting ?? base.romSetting,
    recommendedWeightKg:
      preferences.recommendedWeightKg != null
        ? preferences.recommendedWeightKg
        : base.recommendedWeightKg,
    recommendedRepsMin: preferences.recommendedRepsMin ?? base.recommendedRepsMin,
    recommendedRepsMax: preferences.recommendedRepsMax ?? base.recommendedRepsMax,
  };
}

export function buildPersonalizedTips(
  baseTips: string[],
  locale: string,
  options: {
    workoutGoal?: WorkoutGoal;
    targetMuscleGroup?: TargetMuscleGroup;
    hasCustomPreferences?: boolean;
  }
): string[] {
  const tips = [...baseTips];
  const isKo = locale.startsWith('ko');

  if (options.workoutGoal) {
    tips.unshift(isKo ? GOAL_TIPS_KO[options.workoutGoal] : GOAL_TIPS_EN[options.workoutGoal]);
  }

  if (options.targetMuscleGroup) {
    tips.unshift(
      isKo
        ? TARGET_MUSCLE_TIPS_KO[options.targetMuscleGroup]
        : TARGET_MUSCLE_TIPS_EN[options.targetMuscleGroup]
    );
  }

  if (options.hasCustomPreferences) {
    tips.unshift(
      isKo
        ? '저장된 맞춤 설정이 이번 추천에 반영되었습니다.'
        : 'Your saved custom settings were applied to this recommendation.'
    );
  }

  return tips;
}
