import { describe, expect, it } from 'vitest';
import {
  formatBrandedMachineLabel,
  machineNameIncludesBrand,
} from '@/utils/freeWeightDisplay';

describe('formatBrandedMachineLabel', () => {
  it('prefixes brand when machine name does not include it', () => {
    expect(formatBrandedMachineLabel('레그 프레스', '사이벡스')).toBe('사이벡스 · 레그 프레스');
  });

  it('does not repeat brand when machine name already starts with it', () => {
    expect(
      formatBrandedMachineLabel('아스날 스트렝스 45도 레그 프레스', '아스날 스트렝스')
    ).toBe('아스날 스트렝스 45도 레그 프레스');
  });

  it('detects brand already present with middot separator', () => {
    expect(machineNameIncludesBrand('아스날 스트렝스 · 45도 레그 프레스', '아스날 스트렝스')).toBe(
      true
    );
  });

  it('does not treat a short brand as a partial prefix of another word', () => {
    expect(machineNameIncludesBrand('Awesome Press', 'A')).toBe(false);
    expect(formatBrandedMachineLabel('Awesome Press', 'A')).toBe('A · Awesome Press');
  });
});
