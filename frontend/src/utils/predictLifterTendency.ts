import type { Gender, WorkoutGoal } from '@machinefit/shared';

export type LifterTendencyId = 'power' | 'balance' | 'endurance';

export interface LifterTendencyPrediction {
  id: LifterTendencyId;
  emoji: string;
  /** Integer percent; the three values always sum to 100. */
  percent: number;
}

export interface LifterTendencyProfileInput {
  gender?: Gender | null;
  age?: number | null;
  heightCm?: number | null;
  weightKg?: number | null;
  workoutGoal?: WorkoutGoal | null;
}

const TENDENCY_META: Record<
  LifterTendencyId,
  { emoji: string }
> = {
  power: { emoji: '🦁' },
  balance: { emoji: '🐆' },
  endurance: { emoji: '🦅' },
};

/** Goal → raw affinity weights before profile nudges. */
function goalWeights(goal?: WorkoutGoal | null): Record<LifterTendencyId, number> {
  switch (goal) {
    case 'strength':
      return { power: 70, balance: 20, endurance: 10 };
    case 'hypertrophy':
      return { power: 48, balance: 37, endurance: 15 };
    case 'diet':
      return { power: 22, balance: 48, endurance: 30 };
    case 'conditioning':
      return { power: 15, balance: 25, endurance: 60 };
    case 'rehab':
      return { power: 12, balance: 43, endurance: 45 };
    case 'posture':
      return { power: 18, balance: 55, endurance: 27 };
    default:
      return { power: 40, balance: 35, endurance: 25 };
  }
}

/**
 * Deterministic AI-style tendency prediction from signup profile only.
 * Used when the member has zero workout logs — does not touch real DNA analysis.
 */
export function predictLifterTendencyFromProfile(
  input: LifterTendencyProfileInput
): LifterTendencyPrediction[] {
  const weights = goalWeights(input.workoutGoal);

  const age = input.age != null && Number.isFinite(input.age) ? input.age : null;
  if (age != null) {
    if (age < 25) {
      weights.power += 4;
      weights.endurance -= 2;
      weights.balance -= 2;
    } else if (age >= 45) {
      weights.endurance += 5;
      weights.balance += 2;
      weights.power -= 7;
    }
  }

  if (input.gender === 'male') {
    weights.power += 3;
    weights.endurance -= 2;
    weights.balance -= 1;
  } else if (input.gender === 'female') {
    weights.balance += 2;
    weights.endurance += 2;
    weights.power -= 4;
  }

  const height = input.heightCm;
  const weight = input.weightKg;
  if (
    height != null &&
    weight != null &&
    Number.isFinite(height) &&
    Number.isFinite(weight) &&
    height > 0
  ) {
    const bmi = weight / (height / 100) ** 2;
    if (bmi >= 27) {
      weights.power += 5;
      weights.endurance -= 3;
      weights.balance -= 2;
    } else if (bmi < 20) {
      weights.endurance += 4;
      weights.power -= 3;
      weights.balance -= 1;
    }
  }

  // Keep weights non-negative before normalizing.
  weights.power = Math.max(1, weights.power);
  weights.balance = Math.max(1, weights.balance);
  weights.endurance = Math.max(1, weights.endurance);

  const total = weights.power + weights.balance + weights.endurance;
  const raw = {
    power: (weights.power / total) * 100,
    balance: (weights.balance / total) * 100,
    endurance: (weights.endurance / total) * 100,
  };

  // Round to integers that sum to 100 (largest remainder method).
  const ids: LifterTendencyId[] = ['power', 'balance', 'endurance'];
  const floored = ids.map((id) => ({
    id,
    floor: Math.floor(raw[id]),
    frac: raw[id] - Math.floor(raw[id]),
  }));
  let remainder = 100 - floored.reduce((sum, row) => sum + row.floor, 0);
  floored.sort((a, b) => b.frac - a.frac);
  const percents = Object.fromEntries(floored.map((row) => [row.id, row.floor])) as Record<
    LifterTendencyId,
    number
  >;
  for (const row of floored) {
    if (remainder <= 0) break;
    percents[row.id] += 1;
    remainder -= 1;
  }

  return (['power', 'balance', 'endurance'] as LifterTendencyId[])
    .map((id) => ({
      id,
      emoji: TENDENCY_META[id].emoji,
      percent: percents[id],
    }))
    .sort((a, b) => b.percent - a.percent);
}
