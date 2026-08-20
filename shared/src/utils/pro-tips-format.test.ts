import { describe, expect, it } from 'vitest';
import {
  stripHorizontalRuleSeparators,
  stripProTipSeparatorsFromLines,
} from './pro-tips-format';

describe('stripHorizontalRuleSeparators', () => {
  it('removes --- lines and keeps sections with blank lines', () => {
    const input = ['A', '', '---', '', 'B', '---', 'C'].join('\n');
    expect(stripHorizontalRuleSeparators(input)).toBe('A\n\nB\nC');
  });

  it('ignores dashes that are not alone on a line', () => {
    expect(stripHorizontalRuleSeparators('A --- B')).toBe('A --- B');
  });

  it('cleans tip arrays', () => {
    expect(stripProTipSeparatorsFromLines(['---', 'hello\n\n---\n\nworld', '  ---  '])).toEqual([
      'hello\n\nworld',
    ]);
  });
});
