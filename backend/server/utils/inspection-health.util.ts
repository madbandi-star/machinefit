import type { InspectionItemResult } from '@machinefit/shared';

export type HealthScoreInputs = {
  /** Days since last inspection; null = never inspected */
  daysSinceLastInspection: number | null;
  failItemCount: number;
  recentFaultCount: number;
  recentRepairCount: number;
  openMemberReportCount: number;
  usageOverLimit: boolean;
  pmOverdue: boolean;
};

/**
 * Health score (0–100) per product spec.
 * Deductions are applied from a base of 100.
 */
export function computeHealthScore(input: HealthScoreInputs): number {
  let score = 100;

  if (input.daysSinceLastInspection == null) {
    score -= 5;
  } else if (input.daysSinceLastInspection > 0) {
    // Spec: 최근 점검일 -5 (treat overdue / aged inspection as the penalty once)
    if (input.daysSinceLastInspection >= 7) score -= 5;
  }

  score -= input.failItemCount * 3;
  score -= input.recentFaultCount * 10;
  score -= input.recentRepairCount * 5;
  score -= input.openMemberReportCount * 2;
  if (input.usageOverLimit) score -= 10;
  if (input.pmOverdue) score -= 15;

  return Math.max(0, Math.min(100, score));
}

export function summarizeInspectionResult(
  items: Array<{ result: InspectionItemResult }>
): 'PASS' | 'WARNING' | 'FAIL' {
  const fails = items.filter((i) => i.result === 'FAIL').length;
  if (fails > 0) return 'FAIL';
  const nas = items.filter((i) => i.result === 'NA').length;
  if (nas > 0 && nas === items.length) return 'WARNING';
  if (nas > 0) return 'WARNING';
  return 'PASS';
}

export function nextInspectionDate(
  from: Date,
  cycle: string
): Date {
  const d = new Date(from);
  switch (cycle) {
    case 'DAILY':
      d.setDate(d.getDate() + 1);
      break;
    case 'WEEKLY':
      d.setDate(d.getDate() + 7);
      break;
    case 'QUARTER':
      d.setMonth(d.getMonth() + 3);
      break;
    case 'HALF_YEAR':
      d.setMonth(d.getMonth() + 6);
      break;
    case 'YEARLY':
      d.setFullYear(d.getFullYear() + 1);
      break;
    case 'MONTHLY':
    default:
      d.setMonth(d.getMonth() + 1);
      break;
  }
  return d;
}
