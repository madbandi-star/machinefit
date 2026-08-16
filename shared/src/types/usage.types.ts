import type { UsageFeatureCode, UsageLimitReason, UsagePlanTier } from '../constants/usage.js';

export interface UsagePolicy {
  id: string;
  featureCode: UsageFeatureCode | string;
  featureName: string;
  description: string;
  category: string;
  freeAllowed: boolean;
  freeDailyLimit: number | null;
  freeMonthlyLimit: number | null;
  /** Concurrent ownership cap (e.g. max cards). Null = unlimited. */
  freeStockLimit: number | null;
  premiumAllowed: boolean;
  premiumDailyLimit: number | null;
  premiumMonthlyLimit: number | null;
  premiumStockLimit: number | null;
  limitsEnforced: boolean;
  isActive: boolean;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UsagePolicyHistoryItem {
  id: string;
  policyId: string;
  featureCode: string;
  beforeValue: Record<string, unknown>;
  afterValue: Record<string, unknown>;
  changedBy: string | null;
  changedByEmail?: string | null;
  changedByName?: string | null;
  createdAt: string;
}

export interface UsageLimitCheckResult {
  allowed: boolean;
  featureCode: string;
  planTier: UsagePlanTier;
  currentUsage: number;
  dailyLimit: number | null;
  monthlyUsage: number;
  monthlyLimit: number | null;
  remainingDaily: number | null;
  remainingMonthly: number | null;
  reason: UsageLimitReason;
  limitsEnforced: boolean;
}

export interface UsageCounters {
  exerciseCardCreateCount: number;
  exerciseCardUpdateCount: number;
  exerciseRecordSaveCount: number;
  exerciseRecordDeleteCount: number;
  templateCreateCount: number;
  templateUseCount: number;
  templateDownloadCount: number;
  templateSaveCount: number;
  timerStartCount: number;
  timerEndCount: number;
  restTimerCount: number;
  lapRecordCount: number;
  voiceCountCount: number;
  voiceCountCompleteCount: number;
  loginCount: number;
  apiRequestCount: number;
  extras: Record<string, number>;
}

export interface UserUsageDailyRow extends UsageCounters {
  id: string;
  userId: string;
  usageDate: string;
  activeFlag: boolean;
}

export interface UserUsageMonthlyRow extends UsageCounters {
  id: string;
  userId: string;
  usageMonth: string;
  activeDays: number;
}

export interface AdminUsageSummary {
  totalUsers: number;
  activeUsersToday: number;
  activeUsersMonth: number;
  today: UsageCounters;
  month: UsageCounters;
}

export interface AdminUsageUserListItem {
  userId: string;
  email: string;
  displayName: string;
  roleCode: string;
  membershipType: string | null;
  subscriptionPlan: string | null;
  createdAt: string;
  todayActive: boolean;
  monthActiveDays: number;
  today: UsageCounters;
  month: UsageCounters;
}

export interface AdminUsageUserDetail {
  user: {
    id: string;
    email: string;
    displayName: string;
    roleCode: string;
    membershipType: string | null;
    subscriptionPlan: string | null;
    subscriptionStatus: string | null;
    createdAt: string;
  };
  today: UsageCounters;
  last7Days: UsageCounters;
  month: UsageCounters;
  lifetime: UsageCounters;
  dailySeries: Array<{ date: string; counters: UsageCounters }>;
}

export interface AdminUsageTimeseriesPoint {
  date: string;
  activeUsers: number;
  exerciseCardCreateCount: number;
  templateUseCount: number;
  timerStartCount: number;
  voiceCountCount: number;
}
