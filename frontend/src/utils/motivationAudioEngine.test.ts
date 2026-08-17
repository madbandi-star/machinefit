import { describe, expect, it } from 'vitest';
import { classifyMotivationMediaError } from '@/utils/motivationAudioEngine';

describe('classifyMotivationMediaError', () => {
  it('detects autoplay blocks', () => {
    expect(classifyMotivationMediaError(Object.assign(new Error('denied'), { name: 'NotAllowedError' }))).toBe(
      'AUTOPLAY_BLOCKED'
    );
  });

  it('detects network errors', () => {
    expect(classifyMotivationMediaError(Object.assign(new Error('network'), { name: 'NetworkError' }))).toBe(
      'NETWORK_ERROR'
    );
  });

  it('detects abort', () => {
    expect(classifyMotivationMediaError(Object.assign(new Error('aborted'), { name: 'AbortError' }))).toBe(
      'ABORTED'
    );
  });
});
