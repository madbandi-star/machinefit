import { describe, expect, it } from 'vitest';
import {
  resolveMachineImageUrl,
  resolveRecordMachineImageUrl,
  machinePlaceholderUrl,
} from './catalogAssets';

describe('resolveMachineImageUrl', () => {
  it('accepts admin /media/machine-covers URLs', () => {
    const url =
      'https://api.machine-fit.com/api/v1/media/machine-covers/BW_SQUAT/main?v=3';
    expect(resolveMachineImageUrl('BW_SQUAT', url)).toContain('/media/machine-covers/BW_SQUAT/main');
  });

  it('accepts Supabase public cover URLs (admin upload path)', () => {
    const url =
      'https://xyz.supabase.co/storage/v1/object/public/machine-cover-images/BW_SQUAT/main.webp';
    expect(resolveMachineImageUrl('BW_SQUAT', url)).toBe(url);
  });

  it('blocks unlicensed packaged Hammer Strength PNGs', () => {
    const url = '/machinefit/assets/machines/hammer_strength/hs_leg_press.png';
    expect(resolveMachineImageUrl('HS_LEG_PRESS', url)).toBe(machinePlaceholderUrl());
  });
});

describe('resolveRecordMachineImageUrl', () => {
  it('falls through to cover media when API image is missing', () => {
    const url = resolveRecordMachineImageUrl('UNKNOWN_MACHINE_XYZ');
    expect(url).toContain('/media/machine-covers/UNKNOWN_MACHINE_XYZ/main');
    expect(url).not.toBe(machinePlaceholderUrl());
  });

  it('keeps standard-machine media URLs from the API', () => {
    const api =
      'https://machinefit.onrender.com/api/v1/media/standard-machine-images/abc/main?v=1';
    expect(resolveRecordMachineImageUrl('ANY_CODE', { primaryImageUrl: api })).toBe(api);
  });
});
