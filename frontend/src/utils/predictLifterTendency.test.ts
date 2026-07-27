import { describe, expect, it } from 'vitest';
import { predictLifterTendencyFromProfile } from './predictLifterTendency';

describe('predictLifterTendencyFromProfile', () => {
  it('returns three percents that sum to 100', () => {
    const rows = predictLifterTendencyFromProfile({
      gender: 'male',
      age: 30,
      heightCm: 175,
      weightKg: 75,
      workoutGoal: 'strength',
    });
    expect(rows).toHaveLength(3);
    expect(rows.reduce((sum, row) => sum + row.percent, 0)).toBe(100);
    expect(rows[0].id).toBe('power');
  });

  it('leans endurance for conditioning goal', () => {
    const rows = predictLifterTendencyFromProfile({
      workoutGoal: 'conditioning',
    });
    expect(rows[0].id).toBe('endurance');
  });

  it('is deterministic for the same profile', () => {
    const input = {
      gender: 'female' as const,
      age: 28,
      heightCm: 162,
      weightKg: 54,
      workoutGoal: 'hypertrophy' as const,
    };
    expect(predictLifterTendencyFromProfile(input)).toEqual(
      predictLifterTendencyFromProfile(input)
    );
  });
});
