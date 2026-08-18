/**
 * Run: node --import tsx --test shared/src/utils/machine-rarity.test.ts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { calculateMachineRarity } from './machine-rarity.js';

describe('calculateMachineRarity', () => {
  it('treats widespread machines as common', () => {
    const r = calculateMachineRarity({
      gymHoldingCount: 700,
      totalGyms: 1000,
      userGymHoldingCount: 400,
      postCount: 80,
      discoveryCount: 200,
    });
    assert.equal(r.grade, 'COMMON');
    assert.ok(r.score < 28);
  });

  it('treats a handful of gyms as legendary-or-higher on a large catalog', () => {
    const r = calculateMachineRarity({
      gymHoldingCount: 7,
      totalGyms: 1000,
      userGymHoldingCount: 12,
      postCount: 9,
      discoveryCount: 8,
    });
    assert.ok(['EPIC', 'LEGENDARY', 'MYTHIC'].includes(r.grade));
    assert.ok(r.score >= 60);
  });

  it('boosts 1-gym machines to mythic when the catalog is large', () => {
    const r = calculateMachineRarity({
      gymHoldingCount: 1,
      totalGyms: 1000,
      userGymHoldingCount: 1,
      postCount: 1,
      discoveryCount: 1,
    });
    assert.equal(r.autoGrade, 'MYTHIC');
    assert.equal(r.grade, 'MYTHIC');
  });

  it('does not auto-assign UNIQUE', () => {
    const r = calculateMachineRarity({
      gymHoldingCount: 0,
      totalGyms: 1000,
      userGymHoldingCount: 0,
      postCount: 0,
      discoveryCount: 0,
    });
    assert.notEqual(r.autoGrade, 'UNIQUE');
    assert.notEqual(r.grade, 'UNIQUE');
  });

  it('applies UNIQUE only via admin flag/override', () => {
    const flagged = calculateMachineRarity({
      gymHoldingCount: 400,
      totalGyms: 1000,
      userGymHoldingCount: 10,
      postCount: 20,
      discoveryCount: 30,
      uniqueFlag: true,
    });
    assert.ok(['COMMON', 'UNCOMMON'].includes(flagged.autoGrade));
    assert.equal(flagged.grade, 'UNIQUE');

    const override = calculateMachineRarity({
      gymHoldingCount: 400,
      totalGyms: 1000,
      userGymHoldingCount: 10,
      postCount: 20,
      discoveryCount: 30,
      gradeOverride: 'LEGENDARY',
    });
    assert.equal(override.grade, 'LEGENDARY');
  });

  it('clamps admin weight and ignores client-style nonsense holdings', () => {
    const r = calculateMachineRarity({
      gymHoldingCount: 3,
      totalGyms: 1000,
      userGymHoldingCount: 3,
      postCount: 2,
      discoveryCount: 2,
      adminWeight: 999,
    });
    assert.ok(r.score <= 100);
  });
});
