import { computePerformedTotalWeightKg } from './effective-load.js';
import type {
  GrowthBeforeNowItem,
  GrowthChartMetric,
  GrowthChartSeries,
  GrowthCompareItem,
  GrowthForecast,
  GrowthHighlight,
  GrowthInsight,
  GrowthMachineHistory,
  GrowthMemory,
  GrowthMonthlyReport,
  GrowthStylePhase,
  GrowthTimelineEvent,
  GrowthTimelineHeadline,
  GrowthTimelinePeriod,
  GrowthTimelineSnapshot,
  GrowthWrapped,
} from '../types/growth-timeline.types.js';

type LocalizedText = { ko: string; en: string };

export interface GrowthTimelineLogInput {
  id: string;
  logDate: string;
  setCount: number;
  setWeightsKg: number[];
  createdAt: string;
  machineCode: string;
  machineName: string;
  brandCode: string | null;
  brandName: string | null;
  muscleGroup: string | null;
  gymId: string | null;
  gymName: string | null;
  /** Optional adjusted/recommended load for total-weight rule. */
  adjustedWeightKg?: number | null;
  recommendedWeightKg?: number | null;
  adjustedReps?: number | null;
  recommendedReps?: number | null;
  setCompleted?: boolean[] | null;
}

export interface GrowthTimelinePeerAverages {
  sessionsPerWeek: number;
  volumeKg: number;
  consistencyScore: number;
}

const UPPER = new Set(['chest', 'back', 'shoulders', 'arms', 'biceps', 'triceps']);
const LOWER = new Set(['legs', 'quads', 'hamstrings', 'glutes', 'calves']);

function text(ko: string, en: string): LocalizedText {
  return { ko, en };
}

function logTotalWeightKg(log: GrowthTimelineLogInput): number {
  return computePerformedTotalWeightKg({
    setWeightsKg: log.setWeightsKg,
    setCompleted: log.setCompleted,
    sets: log.setCount,
    adjustedWeight: log.adjustedWeightKg,
    recommendedWeight: log.recommendedWeightKg,
    adjustedReps: log.adjustedReps,
    recommendedReps: log.recommendedReps,
  });
}

function dayMs(date: string): number {
  return new Date(`${date}T00:00:00Z`).getTime();
}

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function weekKey(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - day + 1);
  return d.toISOString().slice(0, 10);
}

function monthKey(date: string): string {
  return date.slice(0, 7);
}

function yearKey(date: string): string {
  return date.slice(0, 4);
}

function maxWeight(weights: number[]): number {
  return weights.reduce((m, w) => (w > m ? w : m), 0);
}

function pctChange(before: number, now: number): number | null {
  if (!(before > 0) || !Number.isFinite(now)) return null;
  return Math.round(((now - before) / before) * 1000) / 10;
}

function formatKg(n: number, locale: 'ko' | 'en' = 'ko'): string {
  const v = Math.round(n);
  return `${v.toLocaleString(locale === 'ko' ? 'ko-KR' : 'en-US')}kg`;
}

function estimateMinutes(setCount: number): number {
  return Math.max(15, Math.round(setCount * 2.6));
}

function muscleBucket(muscle: string | null, machineCode: string): 'upper' | 'lower' | 'other' {
  const m = (muscle || '').toLowerCase();
  if (UPPER.has(m)) return 'upper';
  if (LOWER.has(m)) return 'lower';
  const code = machineCode.toLowerCase();
  if (/(leg|squat|press|calf|glute|ham)/.test(code)) return 'lower';
  if (/(chest|bench|lat|row|pull|shoulder|delt|bicep|tricep|curl)/.test(code)) return 'upper';
  return 'other';
}

interface DayAgg {
  date: string;
  workouts: number;
  volumeKg: number;
  maxKg: number;
  sets: number;
  minutes: number;
  prs: number;
  machines: Set<string>;
  brands: Set<string>;
  upper: number;
  lower: number;
}

function buildDayAggs(logsAsc: GrowthTimelineLogInput[]): {
  days: DayAgg[];
  machineBest: Map<string, { date: string; kg: number; name: string; brand: string | null }[]>;
  firstByMachine: Map<string, { date: string; kg: number; name: string; brand: string | null }>;
  gymCounts: Map<string, { name: string; count: number }>;
  brandFirst: Map<string, { date: string; name: string }>;
} {
  const byDay = new Map<string, DayAgg>();
  const machineBest = new Map<string, { date: string; kg: number; name: string; brand: string | null }[]>();
  const runningMax = new Map<string, number>();
  const firstByMachine = new Map<
    string,
    { date: string; kg: number; name: string; brand: string | null }
  >();
  const gymCounts = new Map<string, { name: string; count: number }>();
  const brandFirst = new Map<string, { date: string; name: string }>();

  for (const log of logsAsc) {
    const vol = logTotalWeightKg(log);
    const maxKg = maxWeight(log.setWeightsKg);
    let day = byDay.get(log.logDate);
    if (!day) {
      day = {
        date: log.logDate,
        workouts: 0,
        volumeKg: 0,
        maxKg: 0,
        sets: 0,
        minutes: 0,
        prs: 0,
        machines: new Set(),
        brands: new Set(),
        upper: 0,
        lower: 0,
      };
      byDay.set(log.logDate, day);
    }
    day.workouts += 1;
    day.volumeKg += vol;
    day.maxKg = Math.max(day.maxKg, maxKg);
    day.sets += log.setCount;
    day.minutes += estimateMinutes(log.setCount);
    day.machines.add(log.machineCode);
    if (log.brandCode) day.brands.add(log.brandCode);
    const bucket = muscleBucket(log.muscleGroup, log.machineCode);
    if (bucket === 'upper') day.upper += 1;
    if (bucket === 'lower') day.lower += 1;

    const prev = runningMax.get(log.machineCode) ?? 0;
    if (maxKg > prev) {
      day.prs += 1;
      runningMax.set(log.machineCode, maxKg);
      const hist = machineBest.get(log.machineCode) ?? [];
      hist.push({
        date: log.logDate,
        kg: maxKg,
        name: log.machineName,
        brand: log.brandName,
      });
      machineBest.set(log.machineCode, hist);
    }

    if (!firstByMachine.has(log.machineCode) && maxKg > 0) {
      firstByMachine.set(log.machineCode, {
        date: log.logDate,
        kg: maxKg,
        name: log.machineName,
        brand: log.brandName,
      });
    }

    if (log.gymId) {
      const g = gymCounts.get(log.gymId) ?? { name: log.gymName || 'Gym', count: 0 };
      g.count += 1;
      gymCounts.set(log.gymId, g);
    }

    if (log.brandCode && !brandFirst.has(log.brandCode)) {
      brandFirst.set(log.brandCode, {
        date: log.logDate,
        name: log.brandName || log.brandCode,
      });
    }
  }

  const days = [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date));
  return { days, machineBest, firstByMachine, gymCounts, brandFirst };
}

function buildHeadlines(
  journeyDays: number,
  workouts: number,
  bestGrowthPct: number | null,
  volumeKg: number
): GrowthTimelineHeadline[] {
  const items: GrowthTimelineHeadline[] = [
    {
      id: 'days',
      emoji: '💪',
      text: text(
        `당신은 ${journeyDays.toLocaleString('ko-KR')}일 동안 꾸준히 성장했습니다.`,
        `You've grown steadily for ${journeyDays.toLocaleString('en-US')} days.`
      ),
    },
    {
      id: 'workouts',
      emoji: '🏆',
      text: text(
        `지금까지 총 ${workouts.toLocaleString('ko-KR')}회 운동을 완료했습니다.`,
        `You've completed ${workouts.toLocaleString('en-US')} workouts so far.`
      ),
    },
  ];
  if (bestGrowthPct != null && bestGrowthPct > 0) {
    items.splice(1, 0, {
      id: 'growth',
      emoji: '🔥',
      text: text(
        `첫 운동 이후 최고 중량이 ${bestGrowthPct}% 증가했습니다.`,
        `Your top lift is up ${bestGrowthPct}% since day one.`
      ),
    });
  }
  if (journeyDays >= 365) {
    items.push({
      id: 'years',
      emoji: '❤️',
      text: text(
        `포기하지 않고 ${Math.floor(journeyDays / 365)}년 동안 성장해왔습니다.`,
        `You've kept growing for ${Math.floor(journeyDays / 365)}+ years without quitting.`
      ),
    });
  } else if (volumeKg >= 10_000) {
    items.push({
      id: 'volume',
      emoji: '🏋️',
      text: text(
        `누적 ${(volumeKg / 1000).toLocaleString('ko-KR')}톤을 들어 올리며 여정을 쌓았습니다.`,
        `You've stacked ${(volumeKg / 1000).toLocaleString('en-US')} tons of volume on this journey.`
      ),
    });
  }
  return items.slice(0, 4);
}

function buildTimeline(
  logsAsc: GrowthTimelineLogInput[],
  days: DayAgg[],
  machineBest: Map<string, { date: string; kg: number; name: string; brand: string | null }[]>,
  brandFirst: Map<string, { date: string; name: string }>
): GrowthTimelineEvent[] {
  const events: GrowthTimelineEvent[] = [];
  if (!logsAsc.length) return events;

  const first = logsAsc[0]!;
  events.push({
    id: 'first-workout',
    date: first.logDate,
    emoji: '🎉',
    title: text('MachineFit 첫 운동', 'First MachineFit workout'),
    description: text(
      `${first.machineName}로 여정을 시작했습니다.`,
      `Your journey began on ${first.machineName}.`
    ),
    kind: 'first_workout',
  });

  let runningVolume = 0;
  let workoutCount = 0;
  let firstPrDate: string | null = null;
  const tonMilestones = [1, 10, 50, 100, 500, 1000].map((t) => t * 1000);
  const hitTons = new Set<number>();
  const countMilestones = [10, 50, 100, 300, 500, 1000];
  const hitCounts = new Set<number>();

  const machineRunning = new Map<string, number>();
  for (const log of logsAsc) {
    workoutCount += 1;
    runningVolume += logTotalWeightKg(log);
    const maxKg = maxWeight(log.setWeightsKg);
    const prev = machineRunning.get(log.machineCode) ?? 0;
    if (maxKg > prev) {
      machineRunning.set(log.machineCode, maxKg);
      if (!firstPrDate) {
        firstPrDate = log.logDate;
        events.push({
          id: 'first-pr',
          date: log.logDate,
          emoji: '🏅',
          title: text('첫 PR 달성', 'First PR'),
          description: text(
            `${log.machineName}에서 첫 개인 최고를 갱신했습니다.`,
            `First personal record on ${log.machineName}.`
          ),
          kind: 'first_pr',
        });
      }
      if (maxKg >= 100 && prev < 100) {
        events.push({
          id: `weight-100-${log.machineCode}-${log.logDate}`,
          date: log.logDate,
          emoji: '💯',
          title: text(`${log.machineName} 100kg`, `${log.machineName} 100kg`),
          description: text('세 자리 중량에 도달했습니다.', 'You hit triple-digit weight.'),
          kind: 'weight_pr',
        });
      }
    }
    for (const ton of tonMilestones) {
      if (runningVolume >= ton && !hitTons.has(ton)) {
        hitTons.add(ton);
        events.push({
          id: `vol-${ton}`,
          date: log.logDate,
          emoji: '🏋️',
          title: text(`첫 ${ton / 1000}톤 달성`, `First ${ton / 1000} tons`),
          description: text('누적 볼륨 이정표를 통과했습니다.', 'A cumulative volume milestone.'),
          kind: 'volume',
        });
      }
    }
    for (const c of countMilestones) {
      if (workoutCount >= c && !hitCounts.has(c)) {
        hitCounts.add(c);
        events.push({
          id: `wo-${c}`,
          date: log.logDate,
          emoji: '🔥',
          title: text(`${c}번째 운동`, `Workout #${c}`),
          description: text('꾸준함이 숫자를 만들었습니다.', 'Consistency became a number.'),
          kind: 'workout_count',
        });
      }
    }
  }

  for (const [code, meta] of brandFirst) {
    if (/hammer|life|techno|cybex|precor|matrix/i.test(code + meta.name)) {
      events.push({
        id: `brand-${code}`,
        date: meta.date,
        emoji: '🏷️',
        title: text(`${meta.name} 첫 사용`, `First ${meta.name} session`),
        description: text('새로운 브랜드를 경험했습니다.', 'You tried a new brand.'),
        kind: 'brand',
      });
    }
  }

  // Keep strongest recent max-weight machine milestone
  let bestMachineEvent: GrowthTimelineEvent | null = null;
  for (const [code, hist] of machineBest) {
    const last = hist[hist.length - 1];
    if (!last || last.kg < 80) continue;
    const candidate: GrowthTimelineEvent = {
      id: `machine-peak-${code}`,
      date: last.date,
      emoji: '🚀',
      title: text(
        `${last.name} 최고 ${Math.round(last.kg)}kg`,
        `${last.name} peak ${Math.round(last.kg)}kg`
      ),
      description: text('머신 성장의 하이라이트입니다.', 'A machine growth highlight.'),
      kind: 'machine',
    };
    if (!bestMachineEvent || last.kg > (Number(bestMachineEvent.title.en.match(/\d+/)?.[0]) || 0)) {
      bestMachineEvent = candidate;
    }
  }
  if (bestMachineEvent) events.push(bestMachineEvent);

  const unique = new Map<string, GrowthTimelineEvent>();
  for (const e of events.sort((a, b) => a.date.localeCompare(b.date))) {
    unique.set(e.id, e);
  }
  const sorted = [...unique.values()];
  if (days.length) {
    sorted.push({
      id: 'now',
      date: days[days.length - 1]!.date,
      emoji: '✨',
      title: text('현재', 'Now'),
      description: text('당신의 성장은 계속되고 있습니다.', 'Your growth story continues.'),
      kind: 'milestone',
    });
  }
  return sorted.slice(0, 24);
}

function buildBeforeNow(
  logsAsc: GrowthTimelineLogInput[],
  days: DayAgg[],
  firstByMachine: Map<string, { date: string; kg: number; name: string; brand: string | null }>,
  machineBest: Map<string, { date: string; kg: number; name: string; brand: string | null }[]>
): GrowthBeforeNowItem[] {
  if (!logsAsc.length || !days.length) return [];
  const items: GrowthBeforeNowItem[] = [];

  const focusCodes = [
    ...firstByMachine.keys(),
  ].filter((code) => /bench|chest|squat|leg|press|dead|lat|row/i.test(code));
  const pick = focusCodes.length ? focusCodes : [...firstByMachine.keys()];

  for (const code of pick.slice(0, 3)) {
    const first = firstByMachine.get(code);
    const hist = machineBest.get(code);
    const last = hist?.[hist.length - 1];
    if (!first || !last) continue;
    const delta = pctChange(first.kg, last.kg);
    items.push({
      id: `machine-${code}`,
      label: text(first.name, first.name),
      beforeValue: formatKg(first.kg),
      nowValue: formatKg(last.kg),
      deltaPct: delta,
    });
  }

  // Sessions in first 14 days vs last 14 days -> weekly rate
  const first14 = days.filter((d) => d.date <= addDays(days[0]!.date, 13));
  const last14 = days.filter((d) => d.date >= addDays(days[days.length - 1]!.date, -13));
  const earlyWeekly = Math.round((first14.reduce((s, d) => s + d.workouts, 0) / 2) * 10) / 10;
  const nowWeekly = Math.round((last14.reduce((s, d) => s + d.workouts, 0) / 2) * 10) / 10;

  items.push({
    id: 'frequency',
    label: text('주간 운동 빈도', 'Weekly frequency'),
    beforeValue: `주 ${earlyWeekly}회`,
    nowValue: `주 ${nowWeekly}회`,
    deltaPct: pctChange(earlyWeekly || 1, nowWeekly),
  });

  const earlyMin =
    first14.reduce((s, d) => s + d.minutes, 0) / Math.max(1, first14.reduce((s, d) => s + d.workouts, 0));
  const nowMin =
    last14.reduce((s, d) => s + d.minutes, 0) / Math.max(1, last14.reduce((s, d) => s + d.workouts, 0));
  items.push({
    id: 'duration',
    label: text('평균 운동시간', 'Avg session time'),
    beforeValue: `${Math.round(earlyMin || 42)}분`,
    nowValue: `${Math.round(nowMin || 60)}분`,
    deltaPct: pctChange(earlyMin || 42, nowMin || 60),
  });

  return items;
}

function aggregatePeriod(
  days: DayAgg[],
  period: GrowthTimelinePeriod
): Map<string, { workouts: number; volume: number; maxKg: number; minutes: number; prs: number; machines: Set<string>; brands: Set<string>; upper: number; lower: number }> {
  const map = new Map<
    string,
    {
      workouts: number;
      volume: number;
      maxKg: number;
      minutes: number;
      prs: number;
      machines: Set<string>;
      brands: Set<string>;
      upper: number;
      lower: number;
    }
  >();
  for (const d of days) {
    const key =
      period === 'day'
        ? d.date
        : period === 'week'
          ? weekKey(d.date)
          : period === 'month'
            ? monthKey(d.date)
            : yearKey(d.date);
    let row = map.get(key);
    if (!row) {
      row = {
        workouts: 0,
        volume: 0,
        maxKg: 0,
        minutes: 0,
        prs: 0,
        machines: new Set(),
        brands: new Set(),
        upper: 0,
        lower: 0,
      };
      map.set(key, row);
    }
    row.workouts += d.workouts;
    row.volume += d.volumeKg;
    row.maxKg = Math.max(row.maxKg, d.maxKg);
    row.minutes += d.minutes;
    row.prs += d.prs;
    d.machines.forEach((m) => row!.machines.add(m));
    d.brands.forEach((b) => row!.brands.add(b));
    row.upper += d.upper;
    row.lower += d.lower;
  }
  return map;
}

function buildCharts(days: DayAgg[]): Record<GrowthTimelinePeriod, GrowthChartSeries[]> {
  const periods: GrowthTimelinePeriod[] = ['day', 'week', 'month', 'year'];
  const result = {} as Record<GrowthTimelinePeriod, GrowthChartSeries[]>;

  for (const period of periods) {
    const agg = aggregatePeriod(days, period);
    const keys = [...agg.keys()].sort();
    const trimmed =
      period === 'day' ? keys.slice(-45) : period === 'week' ? keys.slice(-26) : keys.slice(-24);

    const metricBuilders: Array<{
      metric: GrowthChartMetric;
      unit: string;
      value: (k: string) => number;
    }> = [
      { metric: 'max_weight', unit: 'kg', value: (k) => agg.get(k)!.maxKg },
      { metric: 'volume', unit: 'kg', value: (k) => Math.round(agg.get(k)!.volume) },
      { metric: 'workouts', unit: '회', value: (k) => agg.get(k)!.workouts },
      { metric: 'duration', unit: '분', value: (k) => agg.get(k)!.minutes },
      { metric: 'prs', unit: '회', value: (k) => agg.get(k)!.prs },
      {
        metric: 'frequency',
        unit: '회',
        value: (k) => agg.get(k)!.workouts,
      },
      { metric: 'machines', unit: '종', value: (k) => agg.get(k)!.machines.size },
      { metric: 'brands', unit: '종', value: (k) => agg.get(k)!.brands.size },
      {
        metric: 'upper_lower',
        unit: '%',
        value: (k) => {
          const r = agg.get(k)!;
          const t = r.upper + r.lower;
          return t > 0 ? Math.round((r.upper / t) * 100) : 50;
        },
      },
      {
        metric: 'intensity',
        unit: 'pts',
        value: (k) => {
          const r = agg.get(k)!;
          return Math.min(100, Math.round(r.maxKg * 0.35 + r.volume / 500));
        },
      },
    ];

    result[period] = metricBuilders.map((m) => ({
      metric: m.metric,
      unit: m.unit,
      points: trimmed.map((k) => ({
        label: period === 'day' ? k.slice(5) : k,
        value: m.value(k),
      })),
    }));
  }
  return result;
}

function buildInsights(days: DayAgg[], machineHistories: GrowthMachineHistory[]): GrowthInsight[] {
  const insights: GrowthInsight[] = [];
  if (days.length < 4) {
    return [
      {
        id: 'early',
        emoji: '🌱',
        text: text(
          '기록이 쌓일수록 AI 성장 분석이 더 선명해집니다.',
          'As you log more, AI growth insights get sharper.'
        ),
      },
    ];
  }

  const months = aggregatePeriod(days, 'month');
  const monthKeys = [...months.keys()].sort();
  if (monthKeys.length >= 2) {
    const prev = months.get(monthKeys[monthKeys.length - 2]!)!;
    const cur = months.get(monthKeys[monthKeys.length - 1]!)!;
    const volDelta = pctChange(prev.volume || 1, cur.volume);
    if (volDelta != null && volDelta >= 15) {
      insights.push({
        id: 'accel',
        emoji: '📈',
        text: text(
          `${monthKeys[monthKeys.length - 1]}부터 성장 속도가 크게 빨라졌습니다.`,
          `Growth accelerated from ${monthKeys[monthKeys.length - 1]}.`
        ),
      });
    }
  }

  const recent = days.slice(-90);
  const early = days.slice(0, Math.min(90, days.length));
  const recentLower = recent.reduce((s, d) => s + d.lower, 0);
  const recentUpper = recent.reduce((s, d) => s + d.upper, 0);
  const earlyLower = early.reduce((s, d) => s + d.lower, 0);
  const earlyUpper = early.reduce((s, d) => s + d.upper, 0);
  const recentLowerShare = recentLower + recentUpper > 0 ? recentLower / (recentLower + recentUpper) : 0;
  const earlyLowerShare = earlyLower + earlyUpper > 0 ? earlyLower / (earlyLower + earlyUpper) : 0;
  if (recentLowerShare - earlyLowerShare >= 0.08) {
    insights.push({
      id: 'legs',
      emoji: '🦵',
      text: text(
        '최근 구간에 하체 성장률이 가장 높았습니다.',
        'Lower-body growth led the recent stretch.'
      ),
    });
  } else if (recentUpperShareDelta(recentUpper, recentLower, earlyUpper, earlyLower) >= 0.08) {
    insights.push({
      id: 'upper',
      emoji: '💪',
      text: text('상체 비중이 꾸준히 증가했습니다.', 'Upper-body share has been climbing.'),
    });
  }

  const recentPrs = recent.reduce((s, d) => s + d.prs, 0);
  const earlyPrs = early.reduce((s, d) => s + d.prs, 0);
  if (recentPrs > earlyPrs) {
    insights.push({
      id: 'pr',
      emoji: '🏆',
      text: text(
        '휴식 패턴이 개선되면서 PR 달성 빈도가 증가했습니다.',
        'PR frequency rose as your rhythm stabilized.'
      ),
    });
  }

  const recentFreq = recent.length
    ? recent.reduce((s, d) => s + d.workouts, 0) / Math.max(1, recent.length / 7)
    : 0;
  const earlyFreq = early.length
    ? early.reduce((s, d) => s + d.workouts, 0) / Math.max(1, early.length / 7)
    : 0;
  if (recentFreq >= earlyFreq) {
    insights.push({
      id: 'stable',
      emoji: '❤️',
      text: text(
        '운동 루틴이 이전보다 훨씬 안정적으로 유지되고 있습니다.',
        'Your routine is more stable than earlier chapters.'
      ),
    });
  }

  const bestMachine = machineHistories[0];
  if (bestMachine && bestMachine.growthPct >= 40) {
    insights.push({
      id: 'machine',
      emoji: '🚀',
      text: text(
        `${bestMachine.machineName}에서 가장 드라마틱한 성장을 보여주었습니다.`,
        `${bestMachine.machineName} delivered your most dramatic growth.`
      ),
    });
  }

  return insights.slice(0, 5);
}

function recentUpperShareDelta(
  recentUpper: number,
  recentLower: number,
  earlyUpper: number,
  earlyLower: number
): number {
  const r = recentUpper + recentLower > 0 ? recentUpper / (recentUpper + recentLower) : 0;
  const e = earlyUpper + earlyLower > 0 ? earlyUpper / (earlyUpper + earlyLower) : 0;
  return r - e;
}

function buildHighlights(
  days: DayAgg[],
  machineHistories: GrowthMachineHistory[],
  gymCounts: Map<string, { name: string; count: number }>
): GrowthHighlight[] {
  if (!days.length) return [];
  const maxDay = [...days].sort((a, b) => b.maxKg - a.maxKg)[0]!;
  const volumeDay = [...days].sort((a, b) => b.volumeKg - a.volumeKg)[0]!;
  const months = aggregatePeriod(days, 'month');
  const bestMonth = [...months.entries()].sort((a, b) => b[1].workouts - a[1].workouts)[0];
  const bestGrowth = machineHistories[0];
  const topGym = [...gymCounts.values()].sort((a, b) => b.count - a.count)[0];

  // Steadiest streak window: max consecutive days with workouts
  let bestStreak = 1;
  let bestStreakEnd = days[0]!.date;
  let run = 1;
  for (let i = 1; i < days.length; i += 1) {
    const gap = (dayMs(days[i]!.date) - dayMs(days[i - 1]!.date)) / 86_400_000;
    if (gap === 1) {
      run += 1;
      if (run > bestStreak) {
        bestStreak = run;
        bestStreakEnd = days[i]!.date;
      }
    } else run = 1;
  }

  // Fastest growth month by volume delta
  const monthKeys = [...months.keys()].sort();
  let fastest: { key: string; pct: number } | null = null;
  for (let i = 1; i < monthKeys.length; i += 1) {
    const prev = months.get(monthKeys[i - 1]!)!;
    const cur = months.get(monthKeys[i]!)!;
    const pct = pctChange(prev.volume || 1, cur.volume);
    if (pct != null && (!fastest || pct > fastest.pct)) fastest = { key: monthKeys[i]!, pct };
  }

  const highlights: GrowthHighlight[] = [
    {
      id: 'max-weight',
      emoji: '🏆',
      title: text('최고 중량 달성', 'Heaviest lift'),
      value: formatKg(maxDay.maxKg),
      detail: text(`${maxDay.date}에 기록`, `Logged on ${maxDay.date}`),
    },
    {
      id: 'best-month',
      emoji: '🔥',
      title: text('가장 많은 운동을 한 달', 'Busiest month'),
      value: bestMonth ? `${bestMonth[1].workouts}회` : '-',
      detail: text(bestMonth?.[0] ?? '-', bestMonth?.[0] ?? '-'),
    },
    {
      id: 'streak',
      emoji: '❤️',
      title: text('가장 꾸준했던 기간', 'Steadiest stretch'),
      value: `${bestStreak}일`,
      detail: text(`${bestStreakEnd} 전후`, `Around ${bestStreakEnd}`),
    },
    {
      id: 'fastest',
      emoji: '🚀',
      title: text('가장 빠르게 성장한 시기', 'Fastest growth'),
      value: fastest ? `+${fastest.pct}%` : '-',
      detail: text(fastest?.key ?? '-', fastest?.key ?? '-'),
    },
    {
      id: 'machine',
      emoji: '🎯',
      title: text('가장 많이 성장한 머신', 'Top growth machine'),
      value: bestGrowth?.machineName ?? '-',
      detail: text(
        bestGrowth ? `+${bestGrowth.growthPct}%` : '-',
        bestGrowth ? `+${bestGrowth.growthPct}%` : '-'
      ),
    },
    {
      id: 'gym',
      emoji: '🏋️',
      title: text('가장 많이 운동한 헬스장', 'Most-visited gym'),
      value: topGym?.name ?? '-',
      detail: text(
        topGym ? `${topGym.count}회` : '-',
        topGym ? `${topGym.count} sessions` : '-'
      ),
    },
    {
      id: 'volume-day',
      emoji: '💪',
      title: text('최고의 하루 볼륨', 'Best volume day'),
      value: `${Math.round(volumeDay.volumeKg).toLocaleString('ko-KR')}kg`,
      detail: text(volumeDay.date, volumeDay.date),
    },
    {
      id: 'growth-star',
      emoji: '⭐',
      title: text('가장 큰 성장률', 'Biggest growth rate'),
      value: bestGrowth ? `+${bestGrowth.growthPct}%` : '-',
      detail: text(bestGrowth?.machineName ?? '-', bestGrowth?.machineName ?? '-'),
    },
  ];
  return highlights;
}

function buildMachineHistories(
  machineBest: Map<string, { date: string; kg: number; name: string; brand: string | null }[]>
): GrowthMachineHistory[] {
  const list: GrowthMachineHistory[] = [];
  for (const [code, hist] of machineBest) {
    if (hist.length < 1) continue;
    const first = hist[0]!;
    const last = hist[hist.length - 1]!;
    const growthPct = pctChange(first.kg, last.kg) ?? 0;
    // downsample to ~8 points
    const step = Math.max(1, Math.floor(hist.length / 8));
    const points = hist.filter((_, i) => i % step === 0 || i === hist.length - 1).map((h) => ({
      date: h.date,
      maxKg: Math.round(h.kg * 10) / 10,
    }));
    list.push({
      machineCode: code,
      machineName: last.name,
      brandName: last.brand,
      points,
      firstKg: first.kg,
      currentKg: last.kg,
      growthPct,
    });
  }
  return list.sort((a, b) => b.growthPct - a.growthPct).slice(0, 20);
}

function buildStyleEvolution(days: DayAgg[]): GrowthStylePhase[] {
  if (!days.length) return [];
  const third = Math.max(1, Math.floor(days.length / 3));
  const phases = [
    days.slice(0, third),
    days.slice(third, third * 2),
    days.slice(third * 2),
  ];
  const labels = [
    text('초기', 'Early'),
    text('중기', 'Middle'),
    text('현재', 'Now'),
  ];

  return phases.map((slice, idx) => {
    const upper = slice.reduce((s, d) => s + d.upper, 0);
    const lower = slice.reduce((s, d) => s + d.lower, 0);
    const workouts = slice.reduce((s, d) => s + d.workouts, 0);
    const avgMax = slice.reduce((s, d) => s + d.maxKg, 0) / Math.max(1, slice.length);
    const avgSets = slice.reduce((s, d) => s + d.sets, 0) / Math.max(1, workouts);
    let style = text('전신운동 위주', 'Full-body focus');
    let detail = text('다양한 부위를 고르게 건드렸습니다.', 'You touched many muscle groups.');
    const ul = upper + lower;
    if (ul > 0) {
      if (lower / ul >= 0.45) {
        style = text('하체 중심', 'Lower-body focus');
        detail = text('하체 비중이 높은 구간입니다.', 'Lower-body work dominated this chapter.');
      } else if (upper / ul >= 0.65) {
        style = text('상체 중심', 'Upper-body focus');
        detail = text('상체 루틴에 무게가 실렸습니다.', 'Upper-body routines carried the load.');
      } else {
        style = text('균형 잡힌 Push / Pull / Legs', 'Balanced Push / Pull / Legs');
        detail = text('상·하체 밸런스가 안정적입니다.', 'Upper/lower balance looks steady.');
      }
    }
    if (avgSets >= 12 && avgMax < 60) {
      style = text('고반복 지구력', 'High-rep endurance');
      detail = text('세트 수가 많고 중량은 점진적이었습니다.', 'Higher sets with gradual loading.');
    } else if (avgMax >= 90) {
      style = text('고강도 중량 루틴', 'High-intensity loading');
      detail = text('중량 중심으로 강도를 끌어올렸습니다.', 'Intensity came from heavier top sets.');
    }
    return {
      id: `phase-${idx}`,
      periodLabel: labels[idx]!,
      style,
      detail,
    };
  });
}

function buildMonthlyReports(days: DayAgg[]): GrowthMonthlyReport[] {
  const months = aggregatePeriod(days, 'month');
  const keys = [...months.keys()].sort();
  return keys.slice(-12).map((key, idx, arr) => {
    const cur = months.get(key)!;
    const prevKey = arr[idx - 1];
    const prev = prevKey ? months.get(prevKey) : undefined;
    // top machine approximate from day machines size only — leave null-ish; filled later if needed
    return {
      yearMonth: key,
      workouts: cur.workouts,
      volumeKg: Math.round(cur.volume),
      prCount: cur.prs,
      topMachineName: null,
      avgMinutes: cur.workouts > 0 ? Math.round(cur.minutes / cur.workouts) : 0,
      vsPrevMonthPct: prev ? pctChange(prev.volume || 1, cur.volume) : null,
    };
  });
}

function enrichMonthlyTopMachines(
  reports: GrowthMonthlyReport[],
  logsAsc: GrowthTimelineLogInput[]
): GrowthMonthlyReport[] {
  return reports.map((r) => {
    const counts = new Map<string, { name: string; n: number }>();
    for (const log of logsAsc) {
      if (monthKey(log.logDate) !== r.yearMonth) continue;
      const row = counts.get(log.machineCode) ?? { name: log.machineName, n: 0 };
      row.n += 1;
      counts.set(log.machineCode, row);
    }
    const top = [...counts.values()].sort((a, b) => b.n - a.n)[0];
    return { ...r, topMachineName: top?.name ?? null };
  });
}

function buildWrapped(
  days: DayAgg[],
  logsAsc: GrowthTimelineLogInput[],
  gymCounts: Map<string, { name: string; count: number }>,
  machineHistories: GrowthMachineHistory[]
): GrowthWrapped | null {
  if (!days.length) return null;
  const year = Number(yearKey(days[days.length - 1]!.date));
  const yearDays = days.filter((d) => yearKey(d.date) === String(year));
  if (!yearDays.length) return null;
  const workouts = yearDays.reduce((s, d) => s + d.workouts, 0);
  const volumeKg = yearDays.reduce((s, d) => s + d.volumeKg, 0);
  const maxKg = yearDays.reduce((m, d) => Math.max(m, d.maxKg), 0);
  const minutes = yearDays.reduce((s, d) => s + d.minutes, 0);
  const yearLogs = logsAsc.filter((l) => yearKey(l.logDate) === String(year));
  const machineCounts = new Map<string, { name: string; n: number }>();
  for (const log of yearLogs) {
    const row = machineCounts.get(log.machineCode) ?? { name: log.machineName, n: 0 };
    row.n += 1;
    machineCounts.set(log.machineCode, row);
  }
  const topMachine = [...machineCounts.values()].sort((a, b) => b.n - a.n)[0];
  const topGym = [...gymCounts.values()].sort((a, b) => b.count - a.count)[0];
  const bestGrowth = machineHistories[0];
  const character =
    (bestGrowth?.growthPct ?? 0) >= 80
      ? text('🦍 고릴라형 리프터', '🦍 Gorilla Lifter')
      : workouts >= 150
        ? text('🔥 불꽃 루틴러', '🔥 Flame Routiner')
        : text('🌱 성장형 챌린저', '🌱 Growth Challenger');

  return {
    year,
    character,
    slides: [
      {
        id: 'intro',
        emoji: '🎉',
        title: text(`${year} MachineFit Wrapped`, `${year} MachineFit Wrapped`),
        value: String(year),
        subtitle: text('당신의 한 해를 되돌아봅니다', 'Your year in lifting'),
      },
      {
        id: 'workouts',
        emoji: '🔥',
        title: text('총 운동', 'Total workouts'),
        value: `${workouts.toLocaleString('ko-KR')}회`,
      },
      {
        id: 'volume',
        emoji: '🏋️',
        title: text('총 볼륨', 'Total volume'),
        value: `${(volumeKg / 1000).toLocaleString('ko-KR', { maximumFractionDigits: 1 })}톤`,
      },
      {
        id: 'max',
        emoji: '🏆',
        title: text('최고중량', 'Heaviest lift'),
        value: formatKg(maxKg),
      },
      {
        id: 'time',
        emoji: '⏰',
        title: text('운동시간', 'Time under load'),
        value: `${Math.round(minutes / 60)}시간`,
      },
      {
        id: 'machine',
        emoji: '🎯',
        title: text('가장 좋아한 머신', 'Favorite machine'),
        value: topMachine?.name ?? '-',
      },
      {
        id: 'gym',
        emoji: '🏢',
        title: text('가장 많이 간 헬스장', 'Most-visited gym'),
        value: topGym?.name ?? '-',
      },
      {
        id: 'character',
        emoji: '⭐',
        title: text('올해 대표 캐릭터', 'Your year character'),
        value: character.ko,
        subtitle: character,
      },
    ],
  };
}

function buildForecast(
  days: DayAgg[],
  machineHistories: GrowthMachineHistory[]
): GrowthForecast {
  const disclaimer = text(
    '예측은 현재 추세 기반 예상치이며 실제와 다를 수 있습니다.',
    'Predictions are trend-based estimates and may differ from reality.'
  );
  if (days.length < 7) {
    return { disclaimer, items: [] };
  }
  const recent = days.slice(-60);
  const weeklyVol =
    recent.reduce((s, d) => s + d.volumeKg, 0) / Math.max(1, recent.length / 7);
  const totalVol = days.reduce((s, d) => s + d.volumeKg, 0);
  const top = machineHistories[0];
  const second = machineHistories[1];
  const horizon = text('3개월 후', 'In 3 months');

  const items = [
    {
      id: 'volume',
      label: text('총 볼륨', 'Total volume'),
      current: `${(totalVol / 1000).toLocaleString('ko-KR', { maximumFractionDigits: 1 })}톤`,
      predicted: `${((totalVol + weeklyVol * 13) / 1000).toLocaleString('ko-KR', {
        maximumFractionDigits: 1,
      })}톤`,
      horizon,
    },
  ];
  if (top) {
    const weeklyGain = Math.max(0.5, (top.currentKg - top.firstKg) / Math.max(4, days.length / 7));
    items.unshift({
      id: 'top-machine',
      label: text(top.machineName, top.machineName),
      current: formatKg(top.currentKg),
      predicted: formatKg(top.currentKg + weeklyGain * 13),
      horizon,
    });
  }
  if (second) {
    const weeklyGain = Math.max(0.4, (second.currentKg - second.firstKg) / Math.max(4, days.length / 7));
    items.splice(1, 0, {
      id: 'second-machine',
      label: text(second.machineName, second.machineName),
      current: formatKg(second.currentKg),
      predicted: formatKg(second.currentKg + weeklyGain * 13),
      horizon,
    });
  }
  return { disclaimer, items: items.slice(0, 3) };
}

function buildComparisons(
  days: DayAgg[],
  peers?: GrowthTimelinePeerAverages
): GrowthCompareItem[] {
  if (!days.length) return [];
  const last30 = days.filter((d) => d.date >= addDays(days[days.length - 1]!.date, -29));
  const prev30 = days.filter(
    (d) =>
      d.date >= addDays(days[days.length - 1]!.date, -59) &&
      d.date < addDays(days[days.length - 1]!.date, -29)
  );
  const lastYearStart = addDays(days[days.length - 1]!.date, -365);
  const lastYearEnd = addDays(days[days.length - 1]!.date, -335);
  const yearAgo = days.filter((d) => d.date >= lastYearStart && d.date <= lastYearEnd);

  const vol = (slice: DayAgg[]) => slice.reduce((s, d) => s + d.volumeKg, 0);
  const freq = (slice: DayAgg[]) =>
    slice.length ? slice.reduce((s, d) => s + d.workouts, 0) / Math.max(1, slice.length / 7) : 0;

  const items: GrowthCompareItem[] = [];
  const vsLastMonth = pctChange(vol(prev30) || 1, vol(last30));
  if (vsLastMonth != null) {
    items.push({
      id: 'last-month',
      label: text('지난달의 나', 'Last month’s you'),
      deltaPct: vsLastMonth,
      detail: text('최근 30일 볼륨 비교', 'Volume vs prior 30 days'),
    });
  }
  if (yearAgo.length) {
    const vsYear = pctChange(vol(yearAgo) || 1, vol(last30));
    if (vsYear != null) {
      items.push({
        id: 'last-year',
        label: text('작년의 나', 'Last year’s you'),
        deltaPct: vsYear,
        detail: text('같은 시기 볼륨 비교', 'Same-window volume comparison'),
      });
    }
  }

  const myFreq = freq(last30);
  const peerFreq = peers?.sessionsPerWeek ?? 2.4;
  const peerVol = peers?.volumeKg ?? 12_000;
  items.push({
    id: 'global-freq',
    label: text('MachineFit 전체 평균', 'MachineFit average'),
    deltaPct: pctChange(peerFreq, myFreq) ?? 0,
    detail: text('주간 운동 빈도 비교', 'Weekly frequency vs platform avg'),
  });
  items.push({
    id: 'global-volume',
    label: text('헬스장·전체 볼륨 평균', 'Gym / global volume avg'),
    deltaPct: pctChange(peerVol, vol(last30) || 1) ?? 0,
    detail: text('최근 30일 볼륨 비교', 'Last 30-day volume vs peers'),
  });
  items.push({
    id: 'consistency',
    label: text('친구·평균 꾸준함', 'Friend / avg consistency'),
    deltaPct: pctChange(peers?.consistencyScore ?? 55, Math.min(100, myFreq * 18)) ?? 0,
    detail: text('꾸준함 점수 비교', 'Consistency score comparison'),
  });

  return items.slice(0, 5);
}

function buildMemories(
  timeline: GrowthTimelineEvent[],
  machineHistories: GrowthMachineHistory[]
): GrowthMemory[] {
  const memories: GrowthMemory[] = timeline
    .filter((e) => e.kind !== 'milestone' || e.id === 'now')
    .slice(0, 12)
    .map((e) => ({
      id: `mem-${e.id}`,
      date: e.date,
      emoji: e.emoji,
      title: e.title,
      detail: e.description,
    }));

  const hundred = machineHistories.find((m) => m.currentKg >= 100 && m.firstKg < 100);
  if (hundred) {
    const hit = hundred.points.find((p) => p.maxKg >= 100);
    if (hit) {
      memories.push({
        id: 'mem-100kg',
        date: hit.date,
        emoji: '💯',
        title: text('첫 100kg', 'First 100kg'),
        detail: text(`${hundred.machineName}에서 100kg 돌파`, `Broke 100kg on ${hundred.machineName}`),
      });
    }
  }
  return memories
    .sort((a, b) => a.date.localeCompare(b.date))
    .filter((m, i, arr) => arr.findIndex((x) => x.id === m.id) === i)
    .slice(0, 16);
}

export function buildGrowthTimelineSnapshot(options: {
  logs: GrowthTimelineLogInput[];
  peers?: GrowthTimelinePeerAverages;
  now?: Date;
}): GrowthTimelineSnapshot {
  const logsAsc = [...options.logs].sort((a, b) => {
    const d = a.logDate.localeCompare(b.logDate);
    if (d !== 0) return d;
    return a.createdAt.localeCompare(b.createdAt);
  });

  const { days, machineBest, firstByMachine, gymCounts, brandFirst } = buildDayAggs(logsAsc);
  const machineHistories = buildMachineHistories(machineBest);
  const timeline = buildTimeline(logsAsc, days, machineBest, brandFirst);
  const beforeNow = buildBeforeNow(logsAsc, days, firstByMachine, machineBest);
  const bestGrowthPct = machineHistories[0]?.growthPct ?? null;
  const totalWorkouts = logsAsc.length;
  const totalVolume = days.reduce((s, d) => s + d.volumeKg, 0);
  const firstDate = days[0]?.date ?? null;
  const lastDate = days[days.length - 1]?.date ?? null;
  const journeyDays =
    firstDate && lastDate
      ? Math.max(1, Math.round((dayMs(lastDate) - dayMs(firstDate)) / 86_400_000) + 1)
      : 0;

  const monthlyReports = enrichMonthlyTopMachines(buildMonthlyReports(days), logsAsc);
  const charts = buildCharts(days);
  const insights = buildInsights(days, machineHistories);
  const highlights = buildHighlights(days, machineHistories, gymCounts);
  const styleEvolution = buildStyleEvolution(days);
  const wrapped = buildWrapped(days, logsAsc, gymCounts, machineHistories);
  const forecast = buildForecast(days, machineHistories);
  const comparisons = buildComparisons(days, options.peers);
  const memories = buildMemories(timeline, machineHistories);
  const headlines = buildHeadlines(journeyDays, totalWorkouts, bestGrowthPct, totalVolume);

  return {
    analyzedAt: (options.now ?? new Date()).toISOString(),
    journeyDays,
    firstWorkoutDate: firstDate,
    headlines,
    timeline,
    beforeNow,
    charts,
    insights,
    highlights,
    machineHistories,
    styleEvolution,
    monthlyReports,
    wrapped,
    forecast,
    comparisons,
    memories,
    shareSummary: {
      journeyDays,
      workouts: totalWorkouts,
      volumeKg: Math.round(totalVolume),
      topMachineName: machineHistories[0]?.machineName ?? null,
      bestGrowthPct,
    },
  };
}

export function emptyGrowthTimelineSnapshot(now = new Date()): GrowthTimelineSnapshot {
  return {
    analyzedAt: now.toISOString(),
    journeyDays: 0,
    firstWorkoutDate: null,
    headlines: [
      {
        id: 'empty',
        emoji: '🌱',
        text: text(
          '첫 운동을 기록하면 AI 성장 타임랩스가 시작됩니다.',
          'Log your first workout to start your AI Growth Timeline.'
        ),
      },
    ],
    timeline: [],
    beforeNow: [],
    charts: {
      day: [],
      week: [],
      month: [],
      year: [],
    },
    insights: [],
    highlights: [],
    machineHistories: [],
    styleEvolution: [],
    monthlyReports: [],
    wrapped: null,
    forecast: {
      disclaimer: text(
        '예측은 현재 추세 기반 예상치이며 실제와 다를 수 있습니다.',
        'Predictions are trend-based estimates and may differ from reality.'
      ),
      items: [],
    },
    comparisons: [],
    memories: [],
    shareSummary: {
      journeyDays: 0,
      workouts: 0,
      volumeKg: 0,
      topMachineName: null,
      bestGrowthPct: null,
    },
  };
}
