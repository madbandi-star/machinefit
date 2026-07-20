import type { ExperienceLevel, Gender } from '../types/api.types.js';
import type { WorkoutGoal, TargetMuscleGroup } from '../constants/workout-goals.js';
import { clampWeightDifficulty } from '../constants/weight-difficulty.js';
import type { RecommendationSettings } from '../types/recommendation.types.js';
import { applyWeightDifficultyMultiplier, roundRecommendWeightKg } from './recommend-weight.js';

/**
 * Evidence-informed loading & rep prescription.
 *
 * Primary sources (summarized for product defaults — not medical advice):
 * - ACSM Position Stand: Progression Models in Resistance Training for Healthy
 *   Adults (Med Sci Sports Exerc. 2009;41(3):687–708). Strength ≈ ≥85% 1RM / ≤6
 *   reps; hypertrophy ≈ 67–85% 1RM / 6–12 reps; endurance ≈ ≤67% 1RM / ≥12 reps;
 *   novices often start ~60–70% 1RM with moderate reps for motor learning.
 * - Schoenfeld BJ et al. meta-analyses on hypertrophy: muscle growth occurs across
 *   a spectrum of loads when sets approach failure / adequate volume; beginners
 *   benefit from slightly higher-rep practice ranges.
 * - NSCA Essentials of Strength Training and Conditioning: novices prioritize
 *   technique with conservative loads; advanced trainees tolerate higher intensity.
 * - Sex differences in strength at matched body mass (e.g. Miller et al. Eur J
 *   Appl Physiol 1993; Leyk et al. Eur J Appl Physiol 2007): women typically
 *   ~65–75% of men's absolute machine/compound strength at similar anthropometry;
 *   lower-body gap is smaller than upper-body. Product default ≈0.72 overall.
 */

/**
 * Relative absolute-strength bias vs male at matched height/weight/experience/goal.
 * Applied once in cold-start personalization (not on progressive log-based targets).
 */
export const GENDER_WEIGHT_BIAS: Record<Gender, number> = {
  male: 1,
  female: 0.72,
};

/** @deprecated Use GENDER_WEIGHT_BIAS via genderWeightFactor(). */
export const FEMALE_STRENGTH_RATIO_DEFAULT = GENDER_WEIGHT_BIAS.female;

/** Relative working load vs intermediate hypertrophy baseline (= 1.0). */
export const WORKOUT_GOAL_WEIGHT_MULTIPLIERS: Record<WorkoutGoal, number> = {
  hypertrophy: 1,
  /** ACSM strength intensities sit above typical hypertrophy working sets. */
  strength: 1.12,
  /** Fat-loss / metabolic work → endurance-biased relative load. */
  diet: 0.88,
  conditioning: 0.85,
  /** Rehab: submaximal, pain-free loading (conservative). */
  rehab: 0.7,
  posture: 0.82,
};

/**
 * Experience modulates goal intensity (ACSM/NSCA: novices avoid max-effort
 * strength loading; advanced lifters can express higher relative intensity).
 */
export const EXPERIENCE_GOAL_WEIGHT_FACTORS: Record<
  ExperienceLevel,
  Record<WorkoutGoal, number>
> = {
  beginner: {
    hypertrophy: 0.92,
    strength: 0.86,
    diet: 0.95,
    conditioning: 0.95,
    rehab: 0.9,
    posture: 0.92,
  },
  intermediate: {
    hypertrophy: 1,
    strength: 1,
    diet: 1,
    conditioning: 1,
    rehab: 1,
    posture: 1,
  },
  advanced: {
    hypertrophy: 1.03,
    strength: 1.06,
    diet: 1,
    conditioning: 1,
    rehab: 1,
    posture: 1,
  },
  professional: {
    hypertrophy: 1.05,
    strength: 1.1,
    diet: 1.02,
    conditioning: 1.02,
    rehab: 1,
    posture: 1.02,
  },
};

/**
 * Rep ranges by goal × experience.
 * Novices: slightly higher reps for motor learning (ACSM/NSCA).
 * Strength: ACSM ≤6 for trained; beginners 5–8 as technique bridge.
 * Hypertrophy: Schoenfeld — effective across ~6–15 with effort/volume.
 */
export const EXPERIENCE_GOAL_REP_RANGES: Record<
  ExperienceLevel,
  Record<WorkoutGoal, { min: number; max: number }>
> = {
  beginner: {
    strength: { min: 5, max: 8 },
    hypertrophy: { min: 10, max: 15 },
    diet: { min: 12, max: 15 },
    conditioning: { min: 12, max: 15 },
    rehab: { min: 12, max: 15 },
    posture: { min: 12, max: 15 },
  },
  intermediate: {
    strength: { min: 3, max: 6 },
    hypertrophy: { min: 8, max: 12 },
    diet: { min: 10, max: 15 },
    conditioning: { min: 12, max: 15 },
    rehab: { min: 12, max: 15 },
    posture: { min: 10, max: 12 },
  },
  advanced: {
    strength: { min: 2, max: 5 },
    hypertrophy: { min: 6, max: 12 },
    diet: { min: 10, max: 12 },
    conditioning: { min: 10, max: 15 },
    rehab: { min: 10, max: 15 },
    posture: { min: 10, max: 12 },
  },
  professional: {
    strength: { min: 2, max: 5 },
    hypertrophy: { min: 6, max: 10 },
    diet: { min: 8, max: 12 },
    conditioning: { min: 10, max: 15 },
    rehab: { min: 10, max: 15 },
    posture: { min: 8, max: 12 },
  },
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

function formatRepTip(min: number, max: number, localeKo: boolean): string {
  return localeKo ? `${min}~${max}회` : `${min}–${max} reps`;
}

function buildGoalTip(
  goal: WorkoutGoal,
  experience: ExperienceLevel | undefined,
  localeKo: boolean
): string {
  const reps = recommendRepsForGoal(goal, experience);
  const repLabel = formatRepTip(reps.min, reps.max, localeKo);

  if (localeKo) {
    switch (goal) {
      case 'strength':
        return `목표: 근력 — ${repLabel}, 여유 있는 휴식, 폼 우선 (ACSM 근력 구간).`;
      case 'diet':
        return `목표: 다이어트 — ${repLabel}, 중량은 무리 없이·볼륨을 관리하세요.`;
      case 'conditioning':
        return `목표: 컨디셔닝 — ${repLabel}, 짧은 휴식으로 전신 펌핑.`;
      case 'rehab':
        return `목표: 재활 — ${repLabel}, 가벼운 중량·통증 없는 범위.`;
      case 'posture':
        return `목표: 체형 — ${repLabel}, 가동범위와 정렬을 우선하세요.`;
      case 'hypertrophy':
      default:
        return `목표: 근비대 — ${repLabel}, 마지막 세트 RIR 1~2 (Schoenfeld 등).`;
    }
  }

  switch (goal) {
    case 'strength':
      return `Goal: strength — ${repLabel}, longer rest, form first (ACSM strength zone).`;
    case 'diet':
      return `Goal: fat loss — ${repLabel}, keep load manageable and watch volume.`;
    case 'conditioning':
      return `Goal: conditioning — ${repLabel}, shorter rest, full-body pump.`;
    case 'rehab':
      return `Goal: rehab — ${repLabel}, light load, pain-free range.`;
    case 'posture':
      return `Goal: posture — ${repLabel}, prioritize ROM and alignment.`;
    case 'hypertrophy':
    default:
      return `Goal: hypertrophy — ${repLabel}, last sets near RIR 1–2 (Schoenfeld et al.).`;
  }
}

/** Working-rep range by training goal × experience (ACSM / Schoenfeld / NSCA). */
export function recommendRepsForGoal(
  goal?: WorkoutGoal,
  experienceLevel: ExperienceLevel = 'intermediate'
): { min: number; max: number } {
  const resolvedGoal: WorkoutGoal = goal ?? 'hypertrophy';
  const byExperience =
    EXPERIENCE_GOAL_REP_RANGES[experienceLevel] ?? EXPERIENCE_GOAL_REP_RANGES.intermediate;
  return { ...byExperience[resolvedGoal] };
}

/** Combined goal × experience load factor (before age / muscle bias). */
export function resolveGoalExperienceWeightFactor(
  workoutGoal?: WorkoutGoal,
  experienceLevel: ExperienceLevel = 'intermediate'
): number {
  if (!workoutGoal) return 1;
  const goalFactor = WORKOUT_GOAL_WEIGHT_MULTIPLIERS[workoutGoal];
  const experienceFactor =
    EXPERIENCE_GOAL_WEIGHT_FACTORS[experienceLevel]?.[workoutGoal] ?? 1;
  return goalFactor * experienceFactor;
}

/** Age factor vs reference age 30 (13–100). */
export function ageWeightFactor(age?: number): number {
  if (age == null || age < 13) return 1;
  if (age <= 25) return 0.95 + (age - 13) * 0.004;
  if (age <= 40) return 1;
  if (age <= 55) return 1 - (age - 40) * 0.008;
  return Math.max(0.75, 1 - (age - 40) * 0.008);
}

/** Sex-based absolute strength adjustment (male baseline = 1). */
export function genderWeightFactor(gender?: Gender): number {
  if (!gender) return 1;
  return GENDER_WEIGHT_BIAS[gender];
}

export function applyPersonalizationToWeight(
  weightKg: number | undefined,
  options: {
    gender?: Gender;
    workoutGoal?: WorkoutGoal;
    experienceLevel?: ExperienceLevel;
    age?: number;
    targetMuscleGroup?: TargetMuscleGroup;
  }
): number | undefined {
  if (weightKg == null || weightKg <= 0) return weightKg;

  let value = weightKg;
  value *= genderWeightFactor(options.gender);
  value *= resolveGoalExperienceWeightFactor(
    options.workoutGoal,
    options.experienceLevel ?? 'intermediate'
  );
  value *= ageWeightFactor(options.age);
  if (options.targetMuscleGroup) {
    value *= TARGET_MUSCLE_WEIGHT_BIAS[options.targetMuscleGroup];
  }

  return roundRecommendWeightKg(value);
}

/** Apply user weight-difficulty preference on top of algorithm output. */
export function applyWeightDifficultyToRecommendation(
  weightKg: number | undefined,
  weightDifficulty?: number
): number | undefined {
  const multiplier = clampWeightDifficulty(weightDifficulty ?? 1);
  return applyWeightDifficultyMultiplier(weightKg, multiplier);
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
    experienceLevel?: ExperienceLevel;
    targetMuscleGroup?: TargetMuscleGroup;
    hasCustomPreferences?: boolean;
  }
): string[] {
  const tips = [...baseTips];
  const isKo = locale.startsWith('ko');

  if (options.workoutGoal) {
    tips.unshift(buildGoalTip(options.workoutGoal, options.experienceLevel, isKo));
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

/** Single rep count for volume math (uses stored min, else goal×experience default). */
export function resolveRecommendedRepCount(
  settings: RecommendationSettings,
  experienceLevel: ExperienceLevel = 'intermediate',
  workoutGoal?: WorkoutGoal
): number | null {
  if (settings.recommendedRepsMin != null && settings.recommendedRepsMin > 0) {
    return settings.recommendedRepsMin;
  }
  const range = recommendRepsForGoal(workoutGoal, experienceLevel);
  return range.min > 0 ? range.min : null;
}

/** Recommended card total weight = recommended weight × rep count. */
export function computeRecommendedTotalWeightKg(
  settings: RecommendationSettings,
  options?: {
    workoutGoal?: WorkoutGoal;
    experienceLevel?: ExperienceLevel;
  }
): number | null {
  const weightKg = settings.recommendedWeightKg;
  if (weightKg == null || weightKg <= 0) return null;

  const reps = resolveRecommendedRepCount(
    settings,
    options?.experienceLevel ?? 'intermediate',
    options?.workoutGoal
  );
  if (reps == null || reps <= 0) return null;

  return Math.round(weightKg * reps);
}
