import type { UsagePolicyUpdateInput } from '@machinefit/shared';
import { AppError } from '../middlewares/error.middleware.js';
import { usagePolicyRepository } from '../repositories/usage-policy.repository.js';
import { usageRepository } from '../repositories/usage.repository.js';
import { seoulDateKey, seoulMonthKey } from '../utils/mypage-workout-metrics.js';

function policySnapshot(p: Awaited<ReturnType<typeof usagePolicyRepository.findById>>) {
  if (!p) return {};
  return {
    featureCode: p.featureCode,
    featureName: p.featureName,
    description: p.description,
    freeAllowed: p.freeAllowed,
    freeDailyLimit: p.freeDailyLimit,
    freeMonthlyLimit: p.freeMonthlyLimit,
    premiumAllowed: p.premiumAllowed,
    premiumDailyLimit: p.premiumDailyLimit,
    premiumMonthlyLimit: p.premiumMonthlyLimit,
    limitsEnforced: p.limitsEnforced,
    isActive: p.isActive,
  };
}

export const usageAdminService = {
  async getSummary() {
    return usageRepository.getSummaryTotals(seoulDateKey(), seoulMonthKey());
  },

  async getTimeseries(from: string, to: string) {
    return usageRepository.getTimeseries(from, to);
  },

  async listUsers(opts: { q?: string; page: number; limit: number }) {
    return usageRepository.searchUsers(opts);
  },

  async getUser(userId: string) {
    const detail = await usageRepository.getUserDetail(userId);
    if (!detail) throw new AppError(404, 'NOT_FOUND', 'User not found');
    return detail;
  },

  async listPolicies() {
    return usagePolicyRepository.listAll();
  },

  async updatePolicy(id: string, input: UsagePolicyUpdateInput, actorId: string | null) {
    const before = await usagePolicyRepository.findById(id);
    if (!before) throw new AppError(404, 'NOT_FOUND', 'Policy not found');
    const after = await usagePolicyRepository.update(id, input, actorId);
    if (!after) throw new AppError(404, 'NOT_FOUND', 'Policy not found');
    await usagePolicyRepository.insertHistory({
      policyId: id,
      featureCode: before.featureCode,
      beforeValue: policySnapshot(before),
      afterValue: policySnapshot(after),
      changedBy: actorId,
    });
    return after;
  },

  async listHistory(opts: { policyId?: string; page: number; limit: number }) {
    return usagePolicyRepository.listHistory(opts);
  },
};
