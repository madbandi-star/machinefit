import { describe, expect, it } from 'vitest';
import {
  applyWorkoutCardOrderMove,
  buildWorkoutCardOrderKey,
  sortCardsByDisplayOrder,
} from './workoutCardOrder';

describe('workoutCardOrder', () => {
  it('swaps with neighbors and jumps to ends', () => {
    const items = ['a', 'b', 'c', 'd'];
    expect(applyWorkoutCardOrderMove(items, 2, 'up')).toEqual(['a', 'c', 'b', 'd']);
    expect(applyWorkoutCardOrderMove(items, 1, 'down')).toEqual(['a', 'c', 'b', 'd']);
    expect(applyWorkoutCardOrderMove(items, 3, 'top')).toEqual(['d', 'a', 'b', 'c']);
    expect(applyWorkoutCardOrderMove(items, 0, 'bottom')).toEqual(['b', 'c', 'd', 'a']);
  });

  it('no-ops at boundaries', () => {
    const items = ['a', 'b'];
    expect(applyWorkoutCardOrderMove(items, 0, 'up')).toBe(items);
    expect(applyWorkoutCardOrderMove(items, 0, 'top')).toBe(items);
    expect(applyWorkoutCardOrderMove(items, 1, 'down')).toBe(items);
    expect(applyWorkoutCardOrderMove(items, 1, 'bottom')).toBe(items);
  });

  it('sorts by display_order then viewedAt', () => {
    const cards = [
      {
        machineCode: 'm1',
        logDate: '2026-08-06',
        viewedAt: '2026-08-06T12:00:00.000Z',
      },
      {
        machineCode: 'm2',
        logDate: '2026-08-06',
        viewedAt: '2026-08-06T13:00:00.000Z',
      },
      {
        machineCode: 'm3',
        logDate: '2026-08-06',
        viewedAt: '2026-08-06T14:00:00.000Z',
      },
    ];
    const ordered = sortCardsByDisplayOrder(cards, [
      {
        gymId: 'g',
        memberId: 'm',
        logDate: '2026-08-06',
        machineCode: 'm1',
        displayOrder: 0,
      },
      {
        gymId: 'g',
        memberId: 'm',
        logDate: '2026-08-06',
        machineCode: 'm3',
        displayOrder: 1,
      },
    ]);
    expect(ordered.map((card) => card.machineCode)).toEqual(['m1', 'm3', 'm2']);
    expect(buildWorkoutCardOrderKey('m1', '2026-08-06')).toBe('m1:2026-08-06:');
  });
});
