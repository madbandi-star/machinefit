import {
  LIFTER_DNA_BADGES,
  LIFTER_DNA_CHARACTERS,
  LIFTER_DNA_PHRASE_PARTS,
  LIFTER_DNA_RECO_TEMPLATES,
  LIFTER_DNA_TRAITS,
} from '../data/lifter-dna-catalog.js';
import type {
  LifterDnaBadgeAward,
  LifterDnaCharacterResult,
  LifterDnaCompareItem,
  LifterDnaForecast,
  LifterDnaHabitItem,
  LifterDnaRecommendation,
  LifterDnaSnapshot,
  LifterDnaTraitId,
  LifterDnaTraitScore,
} from '../types/lifter-dna.types.js';

export {
  LIFTER_DNA_BADGES,
  LIFTER_DNA_CHARACTERS,
  LIFTER_DNA_PHRASE_PARTS,
  LIFTER_DNA_RECO_TEMPLATES,
  LIFTER_DNA_TRAITS,
};

export interface LifterDnaRawStats {
  analyzedLogs: number;
  sessionDays: number;
  totalSets: number;
  totalVolumeKg: number;
  avgWeightKg: number;
  maxWeightKg: number;
  avgSetsPerDay: number;
  avgSessionsPerWeek: number;
  avgRestDays: number;
  machineCount: number;
  topMachineCode: string | null;
  topMachineName: string | null;
  longestMachineCode: string | null;
  longestMachineName: string | null;
  topBrandCode: string | null;
  topBrandName: string | null;
  topMuscle: string | null;
  topWeekday: number | null; // 0=Sun
  topHourBucket: 'dawn' | 'day' | 'night' | null;
  topHourLabel: string | null;
  upperRatio: number;
  lowerRatio: number;
  pushRatio: number;
  pullRatio: number;
  growthRate: number;
  prEvents: number;
  prRate: number;
  loyaltyRate: number;
  varietyScore: number;
  intensityScore: number;
  powerScore: number;
  enduranceScore: number;
  consistencyScore: number;
  balanceScore: number;
  challengeScore: number;
  explosivenessScore: number;
  /** Peer baselines for deltas (optional). */
  peers?: {
    friend?: Partial<PeerBaseline>;
    gym?: Partial<PeerBaseline>;
    national?: Partial<PeerBaseline>;
    global?: Partial<PeerBaseline>;
  };
}

export interface PeerBaseline {
  intensity: number;
  consistency: number;
  volume: number;
  lowerRatio: number;
  prRate: number;
  avgSessionMinutes: number;
}

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

function starsFromScore(score: number): number {
  if (score >= 90) return 5;
  if (score >= 75) return 4;
  if (score >= 55) return 3;
  if (score >= 35) return 2;
  if (score >= 15) return 1;
  return 0;
}

function pickLocale(map: { ko: string; en: string }, locale: string): string {
  return locale.startsWith('ko') ? map.ko : map.en;
}

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function muscleLabel(code: string | null, locale: string): string {
  if (!code) return locale.startsWith('ko') ? '—' : '—';
  const map: Record<string, { ko: string; en: string }> = {
    chest: { ko: '가슴', en: 'Chest' },
    back: { ko: '등', en: 'Back' },
    shoulders: { ko: '어깨', en: 'Shoulders' },
    arms: { ko: '팔', en: 'Arms' },
    legs: { ko: '하체', en: 'Legs' },
    core: { ko: '코어', en: 'Core' },
    full_body: { ko: '전신', en: 'Full body' },
    biceps: { ko: '이두', en: 'Biceps' },
    triceps: { ko: '삼두', en: 'Triceps' },
  };
  const hit = map[code];
  return hit ? pickLocale(hit, locale) : code;
}

function weekdayLabel(day: number | null, locale: string): string {
  if (day == null) return '—';
  const ko = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  const en = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return locale.startsWith('ko') ? ko[day]! : en[day]!;
}

function traitMap(stats: LifterDnaRawStats): Record<LifterDnaTraitId, number> {
  return {
    power: clamp(stats.powerScore),
    intensity: clamp(stats.intensityScore),
    explosiveness: clamp(stats.explosivenessScore),
    endurance: clamp(stats.enduranceScore),
    growth: clamp(50 + stats.growthRate * 100),
    consistency: clamp(stats.consistencyScore),
    balance: clamp(stats.balanceScore),
    variety: clamp(stats.varietyScore),
    challenge: clamp(stats.challengeScore),
    prRate: clamp(stats.prRate * 100),
  };
}

function matchCharacter(
  stats: LifterDnaRawStats,
  traits: Record<LifterDnaTraitId, number>,
  locale: string
): LifterDnaCharacterResult {
  let best = LIFTER_DNA_CHARACTERS[0]!;
  let bestScore = -1;

  for (const character of LIFTER_DNA_CHARACTERS) {
    let score = 0;
    let weightSum = 0;
    for (const [trait, weight] of Object.entries(character.weights) as [
      LifterDnaTraitId,
      number,
    ][]) {
      score += (traits[trait] ?? 0) * weight;
      weightSum += weight;
    }
    if (weightSum > 0) score /= weightSum;

    const signals = character.signals;
    if (signals?.preferMuscle?.length && stats.topMuscle) {
      if (signals.preferMuscle.includes(stats.topMuscle)) score += 18;
    }
    if (signals?.preferHour && stats.topHourBucket === signals.preferHour) score += 16;
    if (signals?.preferPushPull === 'push' && stats.pushRatio >= 0.58) score += 12;
    if (signals?.preferPushPull === 'pull' && stats.pullRatio >= 0.58) score += 12;
    if (signals?.preferPushPull === 'balanced' && Math.abs(stats.pushRatio - stats.pullRatio) < 0.12) {
      score += 12;
    }
    if (signals?.highVolume && stats.totalVolumeKg > 50_000) score += 10;
    if (signals?.highVariety && stats.varietyScore >= 70) score += 12;
    if (signals?.prHunter && stats.prRate >= 0.2) score += 14;

    if (score > bestScore) {
      bestScore = score;
      best = character;
    }
  }

  return {
    id: best.id,
    emoji: best.emoji,
    name: pickLocale(best.name, locale),
    tagline: pickLocale(best.tagline, locale),
  };
}

function buildOneLiner(
  character: LifterDnaCharacterResult,
  seedKey: string,
  locale: string
): string {
  const lang = locale.startsWith('ko') ? 'ko' : 'en';
  const seed = hashSeed(seedKey);
  const openers = LIFTER_DNA_PHRASE_PARTS.openers[lang];
  const middles = LIFTER_DNA_PHRASE_PARTS.middles[lang];
  const closers = LIFTER_DNA_PHRASE_PARTS.closers[lang];
  const opener = openers[seed % openers.length]!;
  const middle = middles[(seed >> 3) % middles.length]!;
  const closer = closers[(seed >> 5) % closers.length]!;
  if (lang === 'ko') {
    return `${opener} ${middle} ${character.name} ${closer}`;
  }
  return `${opener} ${middle} ${character.name} ${closer}`;
}

function buildTraits(
  traits: Record<LifterDnaTraitId, number>,
  locale: string
): LifterDnaTraitScore[] {
  return LIFTER_DNA_TRAITS.map((def) => {
    const score = traits[def.id];
    return {
      id: def.id,
      emoji: def.emoji,
      label: pickLocale(def.label, locale),
      stars: starsFromScore(score),
      score: Math.round(score),
    };
  });
}

function buildHabits(stats: LifterDnaRawStats, locale: string): LifterDnaHabitItem[] {
  const ko = locale.startsWith('ko');
  const estMinutes = Math.max(25, Math.round(stats.avgSetsPerDay * 2.6));
  return [
    {
      id: 'topMachine',
      emoji: '🏋️',
      label: ko ? '가장 좋아하는 머신' : 'Favorite machine',
      value: stats.topMachineName ?? '—',
    },
    {
      id: 'topMuscle',
      emoji: '💪',
      label: ko ? '가장 많이 운동한 부위' : 'Top muscle group',
      value: muscleLabel(stats.topMuscle, locale),
    },
    {
      id: 'weekday',
      emoji: '📅',
      label: ko ? '가장 많이 운동하는 요일' : 'Most active weekday',
      value: weekdayLabel(stats.topWeekday, locale),
    },
    {
      id: 'hour',
      emoji: '⏰',
      label: ko ? '가장 많이 운동하는 시간' : 'Peak training hours',
      value: stats.topHourLabel ?? '—',
    },
    {
      id: 'avgMinutes',
      emoji: '⏱️',
      label: ko ? '평균 운동시간(추정)' : 'Avg session (est.)',
      value: ko ? `${estMinutes}분` : `${estMinutes} min`,
    },
    {
      id: 'avgSets',
      emoji: '🔢',
      label: ko ? '평균 세트' : 'Avg sets / day',
      value: ko
        ? `${Math.round(stats.avgSetsPerDay)}세트`
        : `${Math.round(stats.avgSetsPerDay)} sets`,
    },
    {
      id: 'weekly',
      emoji: '📊',
      label: ko ? '평균 운동일' : 'Avg training days',
      value: ko
        ? `주 ${stats.avgSessionsPerWeek.toFixed(1)}회`
        : `${stats.avgSessionsPerWeek.toFixed(1)} / week`,
    },
    {
      id: 'rest',
      emoji: '😴',
      label: ko ? '평균 휴식일' : 'Avg rest gap',
      value: ko ? `${stats.avgRestDays.toFixed(1)}일` : `${stats.avgRestDays.toFixed(1)} days`,
    },
    {
      id: 'brand',
      emoji: '⭐',
      label: ko ? '가장 선호 브랜드' : 'Favorite brand',
      value: stats.topBrandName ?? '—',
    },
    {
      id: 'longest',
      emoji: '🧲',
      label: ko ? '가장 오래 사용하는 머신' : 'Most loyal machine',
      value: stats.longestMachineName ?? '—',
    },
  ];
}

function buildRecommendations(stats: LifterDnaRawStats, locale: string): LifterDnaRecommendation[] {
  const flags = new Set<string>();
  if (stats.upperRatio < 0.35) flags.add('lowUpper');
  if (stats.topMuscle !== 'back' && stats.pullRatio < 0.35) flags.add('lowBack');
  if (stats.avgRestDays < 1.2) flags.add('lowRest');
  if (stats.avgRestDays >= 1.5 && stats.avgRestDays <= 3.5) flags.add('goodRest');
  if (stats.consistencyScore >= 70) flags.add('goodRoutine');
  if (stats.prRate < 0.12) flags.add('lowPr');
  if (stats.varietyScore < 40) flags.add('lowVariety');
  if (stats.lowerRatio < 0.3) flags.add('lowLegs');
  if (stats.pullRatio < 0.35) flags.add('lowPull');
  if (stats.intensityScore >= 75) flags.add('highIntensity');

  const picks = LIFTER_DNA_RECO_TEMPLATES.filter((t) => flags.has(t.when)).slice(0, 4);
  if (!picks.length) {
    return [
      {
        id: 'default',
        text: locale.startsWith('ko')
          ? '현재 루틴은 매우 좋습니다. 이 페이스를 유지하세요.'
          : 'Your routine looks great — keep this pace.',
      },
    ];
  }
  return picks.map((p) => ({ id: p.id, text: pickLocale(p.text, locale) }));
}

function buildForecast(stats: LifterDnaRawStats, locale: string): LifterDnaForecast[] {
  const ko = locale.startsWith('ko');
  const growthBoost = clamp(50 + stats.growthRate * 120, 20, 98);
  const volumeStars = starsFromScore(clamp(stats.totalVolumeKg / 800 + growthBoost * 0.4));
  const maxStars = starsFromScore(clamp(stats.powerScore * 0.7 + growthBoost * 0.3));
  const sessionsStars = starsFromScore(clamp(stats.consistencyScore * 0.8 + 10));
  const growthStars = starsFromScore(growthBoost);
  const projectedVolume = Math.round(stats.totalVolumeKg * (1 + Math.max(0.15, stats.growthRate * 3)));
  const projectedMax = Math.round(stats.maxWeightKg * (1 + Math.max(0.05, stats.growthRate)));
  const projectedSessions = Math.round(stats.avgSessionsPerWeek * 12);

  return [
    {
      id: 'volume',
      label: ko ? '예상 총 볼륨' : 'Projected volume',
      stars: volumeStars,
      detail: ko
        ? `약 ${projectedVolume.toLocaleString('ko-KR')}KG`
        : `~${projectedVolume.toLocaleString('en-US')} KG`,
    },
    {
      id: 'max',
      label: ko ? '예상 최고중량' : 'Projected max load',
      stars: maxStars,
      detail: ko ? `약 ${projectedMax}KG` : `~${projectedMax} KG`,
    },
    {
      id: 'sessions',
      label: ko ? '예상 운동횟수' : 'Projected sessions',
      stars: sessionsStars,
      detail: ko ? `약 ${projectedSessions}회` : `~${projectedSessions} sessions`,
    },
    {
      id: 'growth',
      label: ko ? '예상 성장률' : 'Projected growth',
      stars: growthStars,
      detail: ko
        ? `+${Math.round(Math.max(5, stats.growthRate * 100))}%`
        : `+${Math.round(Math.max(5, stats.growthRate * 100))}%`,
    },
  ];
}

function deltaPct(mine: number, peer: number | undefined): number {
  if (peer == null || peer <= 0) return 0;
  return Math.round(((mine - peer) / peer) * 100);
}

function buildCompare(
  stats: LifterDnaRawStats,
  peer: Partial<PeerBaseline> | undefined,
  locale: string
): LifterDnaCompareItem[] {
  if (!peer) return [];
  const ko = locale.startsWith('ko');
  const estMinutes = Math.max(25, Math.round(stats.avgSetsPerDay * 2.6));
  return [
    {
      id: 'intensity',
      label: ko ? '강도' : 'Intensity',
      deltaPct: deltaPct(stats.intensityScore, peer.intensity),
    },
    {
      id: 'consistency',
      label: ko ? '꾸준함' : 'Consistency',
      deltaPct: deltaPct(stats.consistencyScore, peer.consistency),
    },
    {
      id: 'volume',
      label: ko ? '볼륨' : 'Volume',
      deltaPct: deltaPct(stats.totalVolumeKg / Math.max(1, stats.sessionDays), peer.volume),
    },
    {
      id: 'legs',
      label: ko ? '하체' : 'Legs',
      deltaPct: deltaPct(stats.lowerRatio * 100, (peer.lowerRatio ?? 0) * 100 || undefined),
    },
    {
      id: 'pr',
      label: 'PR',
      deltaPct: deltaPct(stats.prRate * 100, (peer.prRate ?? 0) * 100 || undefined),
    },
    {
      id: 'time',
      label: ko ? '운동시간' : 'Session time',
      deltaPct: deltaPct(estMinutes, peer.avgSessionMinutes),
    },
  ].filter((item) => item.deltaPct !== 0);
}

function awardBadges(stats: LifterDnaRawStats, locale: string): LifterDnaBadgeAward[] {
  const rules: Record<string, boolean> = {
    legsDominant: stats.lowerRatio >= 0.45,
    prHunter: stats.prRate >= 0.18,
    machineLoyal: stats.loyaltyRate >= 0.35,
    powerLifter: stats.powerScore >= 75,
    consistencyGod: stats.consistencyScore >= 80,
    nightWarrior: stats.topHourBucket === 'night',
    dawnChamp: stats.topHourBucket === 'dawn',
    machineCollector: stats.machineCount >= 12 || stats.varietyScore >= 75,
    volumeBeast: stats.totalVolumeKg >= 80_000,
    balancedSoul: stats.balanceScore >= 75,
  };

  return LIFTER_DNA_BADGES.filter((b) => rules[b.rule])
    .slice(0, 6)
    .map((b) => ({
      id: b.id,
      emoji: b.emoji,
      name: pickLocale(b.name, locale),
      description: pickLocale(b.description, locale),
    }));
}

/** Pure analyzer — JSON catalogs drive characters/badges/phrases. */
export function buildLifterDnaSnapshot(
  stats: LifterDnaRawStats,
  locale: string,
  seedKey: string
): LifterDnaSnapshot {
  const traits = traitMap(stats);
  const character = matchCharacter(stats, traits, locale);
  const confidence = clamp(
    55 + Math.min(40, stats.analyzedLogs / 12) + (stats.sessionDays > 10 ? 5 : 0)
  );

  const ko = locale.startsWith('ko');
  return {
    character,
    confidence: Math.round(confidence),
    confidenceStars: starsFromScore(confidence),
    analyzedLogs: stats.analyzedLogs,
    analyzedAt: new Date().toISOString(),
    oneLiner: buildOneLiner(character, seedKey, locale),
    traits: buildTraits(traits, locale),
    habits: buildHabits(stats, locale),
    recommendations: buildRecommendations(stats, locale),
    forecast: buildForecast(stats, locale),
    friendCompare: buildCompare(stats, stats.peers?.friend, locale),
    gymCompare: buildCompare(stats, stats.peers?.gym, locale),
    nationalCompare: buildCompare(stats, stats.peers?.national, locale),
    globalCompare: buildCompare(stats, stats.peers?.global, locale),
    badges: awardBadges(stats, locale),
    shareHeadline: ko
      ? `당신은 ${character.emoji} ${character.name} 리프터입니다.`
      : `You are a ${character.emoji} ${character.name} lifter.`,
  };
}
