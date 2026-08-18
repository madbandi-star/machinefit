/**
 * Workout-complete report metrics should match Records day summary rules.
 * Run: node --import tsx --test shared/src/utils/workout-complete-report.test.ts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildDaySummaryMetrics,
  buildWorkoutCompleteLaps,
  volumeKgForLog,
} from './workout-complete-report.js';
import type { WorkoutLog } from '../types/workout.types.js';

function log(partial: Partial<WorkoutLog> & Pick<WorkoutLog, 'id' | 'machineCode'>): WorkoutLog {
  return {
    gymId: 'g1',
    memberId: 'm1',
    machineName: partial.machineName ?? partial.machineCode,
    logDate: '2026-08-16',
    setCount: 3,
    setWeightsKg: [40, 40, 40],
    setCompleted: [true, true, false],
    createdAt: '2026-08-16T00:00:00.000Z',
    updatedAt: '2026-08-16T00:00:00.000Z',
    ...partial,
  };
}

describe('buildDaySummaryMetrics', () => {
  it('counts completed sets when any completed, matching volume filter', () => {
    const summary = buildDaySummaryMetrics({
      dateKey: '2026-08-16',
      durationMs: 0,
      logs: [log({ id: '1', machineCode: 'LEG_PRESS', setCount: 4 })],
      contexts: {
        '1': { recommendedReps: 10, fitRating: 'good' },
      },
    });
    assert.equal(summary.setCount, 2);
    assert.equal(summary.totalVolumeKg, 800);
  });

  it('splits free-weight logs by target muscle into separate exercises', () => {
    const summary = buildDaySummaryMetrics({
      dateKey: '2026-08-16',
      durationMs: 0,
      logs: [
        log({
          id: 'a',
          machineCode: 'FW_DUMBBELL',
          targetMuscleGroup: 'chest',
          setCompleted: [true, true, true],
        }),
        log({
          id: 'b',
          machineCode: 'FW_DUMBBELL',
          targetMuscleGroup: 'back',
          setCompleted: [true, true, true],
        }),
      ],
      contexts: {
        a: { recommendedReps: 10, fitRating: null },
        b: { recommendedReps: 10, fitRating: null },
      },
    });
    assert.equal(summary.exerciseCount, 2);
  });

  it('uses fitRating good → recommended reps for volume', () => {
    const volume = volumeKgForLog(
      log({
        id: '1',
        machineCode: 'CHEST_PRESS',
        setCompleted: [true, true, true],
      }),
      {
        adjustedReps: 15,
        recommendedReps: 10,
        fitRating: 'good',
      }
    );
    assert.equal(volume, 1200);
  });
});

describe('buildWorkoutCompleteLaps', () => {
  it('keeps machines on their own lap and drops empty laps', () => {
    const laps = buildWorkoutCompleteLaps(
      [
        {
          lapNumber: 1,
          durationSeconds: 751,
          exercises: [
            { machineCode: 'CHEST_PRESS', machineName: '체스트 프레스' },
            { machineCode: 'INCLINE', machineName: '인클라인 체스트 프레스' },
          ],
        },
        { lapNumber: 2, durationSeconds: 600, exercises: [] },
        {
          lapNumber: 3,
          durationSeconds: 400,
          exercises: [{ workoutLogId: 'log-1', machineCode: 'LAT' }],
        },
      ],
      { 'log-1': '랫풀다운' }
    );
    assert.equal(laps.length, 2);
    assert.equal(laps[0].lapNumber, 1);
    assert.deepEqual(
      laps[0].exercises.map((ex) => ex.machineName),
      ['체스트 프레스', '인클라인 체스트 프레스']
    );
    assert.equal(laps[1].lapNumber, 3);
    assert.equal(laps[1].exercises[0].machineName, '랫풀다운');
  });

  it('returns empty when there is no timer / lap data', () => {
    assert.deepEqual(buildWorkoutCompleteLaps(undefined), []);
    assert.deepEqual(buildWorkoutCompleteLaps([]), []);
  });
});
