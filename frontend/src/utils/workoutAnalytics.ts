import type { WorkoutLog } from '@machinefit/shared';

export type GrowthPeriod = '30d' | '3m' | 'all';

export interface SessionPoint {
  logDate: string;
  totalVolume: number;
  maxWeight: number;
  setCount: number;
}

export interface MachineOption {
  machineCode: string;
  machineName: string;
}

export interface PrAlert {
  machineCode: string;
  machineName: string;
  previousPr: number;
  currentPr: number;
  achievedDate: string;
}

export interface GrowthRankingItem {
  machineCode: string;
  machineName: string;
  growthPct: number;
}

export interface MachineKpis {
  volumeGrowthPct: number | null;
  maxWeightDelta: number | null;
  workoutCount: number;
  currentPr: number | null;
  previousPr: number | null;
}

function normalizeLogDate(logDate: string): string {
  if (/^\d{4}-\d{2}-\d{2}/.test(logDate)) {
    return logDate.slice(0, 10);
  }

  const parsed = new Date(logDate);
  if (!Number.isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return logDate;
}

function todayDateKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getPeriodStartDate(period: GrowthPeriod): string | null {
  if (period === 'all') return null;
  const date = new Date();
  if (period === '30d') {
    date.setDate(date.getDate() - 30);
  } else {
    date.setMonth(date.getMonth() - 3);
  }
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function filterLogsByPeriod(logs: WorkoutLog[], period: GrowthPeriod): WorkoutLog[] {
  const from = getPeriodStartDate(period);
  const to = todayDateKey();
  const normalized = logs.map((log) => ({
    ...log,
    logDate: normalizeLogDate(log.logDate),
  }));

  if (!from) return normalized;
  return normalized.filter((log) => log.logDate >= from && log.logDate <= to);
}

export function computeVolume(weights: number[]): number {
  return weights.reduce((sum, weight) => sum + weight, 0);
}

export function computeMaxWeight(weights: number[]): number {
  if (weights.length === 0) return 0;
  return Math.max(...weights);
}

export function toSessionPoint(log: WorkoutLog): SessionPoint {
  return {
    logDate: log.logDate,
    totalVolume: computeVolume(log.setWeightsKg),
    maxWeight: computeMaxWeight(log.setWeightsKg),
    setCount: log.setCount,
  };
}

export function getMachineOptions(logs: WorkoutLog[]): MachineOption[] {
  const map = new Map<string, MachineOption>();
  for (const log of logs) {
    if (!map.has(log.machineCode)) {
      map.set(log.machineCode, {
        machineCode: log.machineCode,
        machineName: log.machineName ?? log.machineCode,
      });
    }
  }
  return [...map.values()].sort((a, b) => a.machineName.localeCompare(b.machineName));
}

export function getSessionsForMachine(logs: WorkoutLog[], machineCode: string): SessionPoint[] {
  return logs
    .filter((log) => log.machineCode === machineCode)
    .sort((a, b) => a.logDate.localeCompare(b.logDate))
    .map(toSessionPoint);
}

export function computeGrowthPct(first: number, last: number): number | null {
  if (first === 0 && last === 0) return 0;
  if (first === 0) return null;
  return ((last - first) / first) * 100;
}

export function computeVolumeGrowthPct(sessions: SessionPoint[]): number | null {
  if (sessions.length < 2) return null;
  return computeGrowthPct(sessions[0].totalVolume, sessions[sessions.length - 1].totalVolume);
}

export function computeMachineKpis(sessions: SessionPoint[]): MachineKpis {
  if (sessions.length === 0) {
    return {
      volumeGrowthPct: null,
      maxWeightDelta: null,
      workoutCount: 0,
      currentPr: null,
      previousPr: null,
    };
  }

  const firstMax = sessions[0].maxWeight;
  const currentPr = Math.max(...sessions.map((s) => s.maxWeight));
  const previousPr = sessions.length > 1 ? Math.max(...sessions.slice(0, -1).map((s) => s.maxWeight)) : firstMax;

  return {
    volumeGrowthPct: computeVolumeGrowthPct(sessions),
    maxWeightDelta: sessions.length >= 2 ? currentPr - firstMax : null,
    workoutCount: sessions.length,
    currentPr,
    previousPr: sessions.length > 1 ? previousPr : null,
  };
}

export function detectPrAlert(logs: WorkoutLog[], machineCode: string): PrAlert | null {
  const machineLogs = logs
    .filter((log) => log.machineCode === machineCode)
    .sort((a, b) => a.logDate.localeCompare(b.logDate));

  if (machineLogs.length === 0) return null;

  const latest = machineLogs[machineLogs.length - 1];
  const currentPr = computeMaxWeight(latest.setWeightsKg);
  const previousLogs = machineLogs.slice(0, -1);

  if (previousLogs.length === 0) return null;

  const previousPr = Math.max(...previousLogs.flatMap((log) => log.setWeightsKg));
  if (currentPr <= previousPr) return null;

  return {
    machineCode: latest.machineCode,
    machineName: latest.machineName ?? latest.machineCode,
    previousPr,
    currentPr,
    achievedDate: latest.logDate,
  };
}

export function computeGrowthRanking(logs: WorkoutLog[], period: GrowthPeriod, limit = 5): GrowthRankingItem[] {
  const filtered = filterLogsByPeriod(logs, period);
  const options = getMachineOptions(filtered);

  const ranked = options
    .map((option) => {
      const sessions = getSessionsForMachine(filtered, option.machineCode);
      const growthPct = computeVolumeGrowthPct(sessions);
      return growthPct === null
        ? null
        : {
            machineCode: option.machineCode,
            machineName: option.machineName,
            growthPct,
          };
    })
    .filter((item): item is GrowthRankingItem => item !== null && item.growthPct > 0)
    .sort((a, b) => b.growthPct - a.growthPct);

  return ranked.slice(0, limit);
}

export interface TrendLine {
  slope: number;
  intercept: number;
}

export function linearRegression(points: { x: number; y: number }[]): TrendLine {
  const n = points.length;
  if (n === 0) return { slope: 0, intercept: 0 };
  if (n === 1) return { slope: 0, intercept: points[0].y };

  const sumX = points.reduce((sum, point) => sum + point.x, 0);
  const sumY = points.reduce((sum, point) => sum + point.y, 0);
  const sumXY = points.reduce((sum, point) => sum + point.x * point.y, 0);
  const sumX2 = points.reduce((sum, point) => sum + point.x * point.x, 0);
  const denominator = n * sumX2 - sumX * sumX;

  if (denominator === 0) return { slope: 0, intercept: sumY / n };

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

export function formatShortDate(dateKey: string, locale: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(locale, { month: 'numeric', day: 'numeric' });
}

export function formatGrowthPct(value: number | null): string {
  if (value === null) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export function formatWeightDelta(value: number | null): string {
  if (value === null) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value}kg`;
}
