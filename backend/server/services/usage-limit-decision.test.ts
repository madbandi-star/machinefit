import assert from 'node:assert/strict';
import { decideUsageLimit } from './usage-limit-decision.js';

const base = {
  planTier: 'FREE' as const,
  limitsEnforced: false,
  isActive: true,
  freeAllowed: true,
  premiumAllowed: true,
  freeDailyLimit: null as number | null,
  freeMonthlyLimit: null as number | null,
  premiumDailyLimit: null as number | null,
  premiumMonthlyLimit: null as number | null,
  dailyUsage: 0,
  monthlyUsage: 0,
};

{
  const r = decideUsageLimit({ ...base, dailyUsage: 99 });
  assert.equal(r.allowed, true);
  assert.equal(r.reason, 'LIMITS_NOT_ENFORCED');
}

{
  const r = decideUsageLimit({
    ...base,
    limitsEnforced: true,
    freeDailyLimit: 5,
    dailyUsage: 5,
  });
  assert.equal(r.allowed, false);
  assert.equal(r.reason, 'DAILY_LIMIT_EXCEEDED');
}

{
  const r = decideUsageLimit({
    ...base,
    limitsEnforced: true,
    freeDailyLimit: 5,
    dailyUsage: 4,
  });
  assert.equal(r.allowed, true);
  assert.equal(r.reason, 'ALLOWED');
  assert.equal(r.remainingDaily, 1);
}

{
  const r = decideUsageLimit({
    ...base,
    limitsEnforced: true,
    freeAllowed: false,
  });
  assert.equal(r.allowed, false);
  assert.equal(r.reason, 'PLAN_NOT_ALLOWED');
}

{
  const r = decideUsageLimit({
    ...base,
    planTier: 'ADMIN',
    limitsEnforced: true,
    freeDailyLimit: 1,
    dailyUsage: 100,
  });
  assert.equal(r.allowed, true);
  assert.equal(r.reason, 'LIMITS_NOT_ENFORCED');
}

console.log('usage-limit-decision ok');
