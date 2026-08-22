import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  hasSeenStandardMachineImageHint,
  markStandardMachineImageHintSeen,
  notifyStandardMachineImageShown,
  resetStandardMachineImageOnboardingForTests,
  subscribeStandardMachineImageOnboarding,
} from './standardMachineImageOnboarding';

describe('standardMachineImageOnboarding', () => {
  beforeEach(() => {
    resetStandardMachineImageOnboardingForTests();
  });

  it('notifies subscribers once until marked seen', () => {
    const spy = vi.fn();
    const unsub = subscribeStandardMachineImageOnboarding(spy);
    notifyStandardMachineImageShown();
    notifyStandardMachineImageShown();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(hasSeenStandardMachineImageHint()).toBe(false);
    markStandardMachineImageHintSeen();
    expect(hasSeenStandardMachineImageHint()).toBe(true);
    unsub();
  });

  it('does not notify after hint was already seen', () => {
    markStandardMachineImageHintSeen();
    const spy = vi.fn();
    subscribeStandardMachineImageOnboarding(spy);
    notifyStandardMachineImageShown();
    expect(spy).not.toHaveBeenCalled();
  });
});
