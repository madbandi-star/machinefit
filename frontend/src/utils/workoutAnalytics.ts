import type { TargetMuscleGroup, WorkoutLog } from '@machinefit/shared';
import { normalizeDateKey } from '@/utils/historyDate';

export type GrowthPeriod = '30d' | '3m' | 'all' | 'custom';

export interface GrowthPeriodFilter {
  preset: GrowthPeriod;
  customFrom?: string;
  customTo?: string;
}

export type GrowthViewMode = 'machine' | 'daily';

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

export interface DailyPoint {
  logDate: string;
  totalVolume: number;
  totalSets: number;
  machineCount: number;
  machines: {
    machineCode: string;
    machineName: string;
    targetMuscleGroup?: TargetMuscleGroup;
    volume: number;
    contributionPct: number;
  }[];
  /** Heaviest single-set weight across all machines on this day. */
  peakSetWeight: number;
}

export interface DailyKpis {
  volumeGrowthPct: number | null;
  avgDailyVolume: number | null;
  workoutDayCount: number;
  avgMachinesPerDay: number | null;
  peakDayVolume: number | null;
  maxWeightDelta: number | null;
  currentPeakWeight: number | null;
  previousPeakWeight: number | null;
  totalLogCount: number;
}

function todayDateKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getPeriodStartDate(period: Exclude<GrowthPeriod, 'custom'>): string | null {
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

export function extractWorkoutLogDateKeys(logs: WorkoutLog[]): Set<string> {
  return new Set(logs.map((log) => normalizeDateKey(log.logDate)));
}

export function getDefaultCustomRange(logs: WorkoutLog[]): { from: string; to: string } {
  const keys = [...extractWorkoutLogDateKeys(logs)].sort();
  const to = todayDateKey();
  if (keys.length === 0) {
    return { from: getPeriodStartDate('30d')!, to };
  }
  return { from: keys[0], to: keys[keys.length - 1] };
}

export function resolveGrowthPeriodBounds(filter: GrowthPeriodFilter): {
  from: string | null;
  to: string;
} {
  if (filter.preset === 'all') {
    return { from: null, to: todayDateKey() };
  }

  if (filter.preset === '30d' || filter.preset === '3m') {
    return { from: getPeriodStartDate(filter.preset), to: todayDateKey() };
  }

  const from = filter.customFrom ?? todayDateKey();
  const to = filter.customTo ?? todayDateKey();
  if (from <= to) {
    return { from, to };
  }
  return { from: to, to: from };
}

export function filterLogsByGrowthPeriod(
  logs: WorkoutLog[],
  filter: GrowthPeriodFilter
): WorkoutLog[] {
  const { from, to } = resolveGrowthPeriodBounds(filter);
  const normalized = logs.map((log) => ({
    ...log,
    logDate: normalizeDateKey(log.logDate),
  }));

  if (!from) return normalized;
  return normalized.filter((log) => log.logDate >= from && log.logDate <= to);
}

/** @deprecated Use filterLogsByGrowthPeriod */
export function filterLogsByPeriod(logs: WorkoutLog[], period: GrowthPeriod): WorkoutLog[] {
  if (period === 'custom') {
    return filterLogsByGrowthPeriod(logs, { preset: 'all' });
  }
  return filterLogsByGrowthPeriod(logs, { preset: period });
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
        machineName: log.machineName ?? '',
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

export function aggregateDailySessions(logs: WorkoutLog[]): DailyPoint[] {
  const byDate = new Map<string, WorkoutLog[]>();

  for (const log of logs) {
    const logDate = normalizeDateKey(log.logDate);
    const dayLogs = byDate.get(logDate) ?? [];
    dayLogs.push({ ...log, logDate });
    byDate.set(logDate, dayLogs);
  }

  return [...byDate.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([logDate, dayLogs]) => {
      const machines = dayLogs.map((entry) => ({
        machineCode: entry.machineCode,
        machineName: entry.machineName ?? '',
        targetMuscleGroup: entry.targetMuscleGroup,
        volume: computeVolume(entry.setWeightsKg),
      }));

      const totalVolume = machines.reduce((sum, machine) => sum + machine.volume, 0);

      return {
        logDate,
        totalVolume,
        totalSets: dayLogs.reduce((sum, entry) => sum + entry.setCount, 0),
        machineCount: dayLogs.length,
        machines: machines.map((machine) => ({
          ...machine,
          contributionPct:
            totalVolume > 0 ? Math.round((machine.volume / totalVolume) * 100) : 0,
        })),
        peakSetWeight: Math.max(...dayLogs.flatMap((entry) => entry.setWeightsKg), 0),
      };
    });
}

export function computeDailyKpis(dailyPoints: DailyPoint[], periodLogCount = 0): DailyKpis {
  if (dailyPoints.length === 0) {
    return {
      volumeGrowthPct: null,
      avgDailyVolume: null,
      workoutDayCount: 0,
      avgMachinesPerDay: null,
      peakDayVolume: null,
      maxWeightDelta: null,
      currentPeakWeight: null,
      previousPeakWeight: null,
      totalLogCount: periodLogCount,
    };
  }

  const volumes = dailyPoints.map((point) => point.totalVolume);
  const firstVolume = volumes[0];
  const lastVolume = volumes[volumes.length - 1];
  const dailyPeaks = dailyPoints.map((point) => point.peakSetWeight);
  const firstDayPeak = dailyPeaks[0];
  const periodPeakWeight = dailyPeaks.length > 0 ? Math.max(...dailyPeaks) : null;

  return {
    volumeGrowthPct:
      dailyPoints.length >= 2 && firstVolume > 0
        ? computeGrowthPct(firstVolume, lastVolume)
        : null,
    avgDailyVolume: volumes.reduce((sum, volume) => sum + volume, 0) / volumes.length,
    workoutDayCount: dailyPoints.length,
    avgMachinesPerDay:
      dailyPoints.reduce((sum, point) => sum + point.machineCount, 0) / dailyPoints.length,
    peakDayVolume: Math.max(...volumes),
    maxWeightDelta:
      dailyPoints.length >= 2 && periodPeakWeight != null
        ? periodPeakWeight - firstDayPeak
        : null,
    currentPeakWeight: periodPeakWeight,
    previousPeakWeight: firstDayPeak,
    totalLogCount: periodLogCount,
  };
}

export function getDailyMaxWeightChartPoints(dailyPoints: DailyPoint[]): number[] {
  return dailyPoints.map((point) => point.peakSetWeight);
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

export function detectDailyPeakAlert(dailyPoints: DailyPoint[]): PrAlert | null {
  if (dailyPoints.length < 2) return null;

  const lastDay = dailyPoints[dailyPoints.length - 1];
  const previousPeaks = dailyPoints.slice(0, -1).map((day) => day.peakSetWeight);
  const previousPeak = Math.max(...previousPeaks);

  if (lastDay.peakSetWeight <= previousPeak) return null;

  return {
    machineCode: '',
    machineName: '',
    previousPr: previousPeak,
    currentPr: lastDay.peakSetWeight,
    achievedDate: lastDay.logDate,
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
    machineName: latest.machineName ?? '',
    previousPr,
    currentPr,
    achievedDate: latest.logDate,
  };
}

export function computeGrowthRanking(
  logs: WorkoutLog[],
  filter: GrowthPeriodFilter,
  limit = 5
): GrowthRankingItem[] {
  const filtered = filterLogsByGrowthPeriod(logs, filter);
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

export function formatRelativeGrowthPct(value: number | null): string {
  if (value === null) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%p`;
}

export function getGrowthValueClass(value: number | null): string {
  if (value == null || value === 0) return '';
  return value > 0 ? ' growth-analysis-kpi__value--up' : ' growth-analysis-kpi__value--down';
}

export function formatWeightDelta(value: number | null): string {
  if (value === null) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value}kg`;
}
