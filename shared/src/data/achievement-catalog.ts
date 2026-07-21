import { LIFTED_COMPARISONS } from './lifted-comparisons.js';
import type {
  AchievementCategory,
  AchievementDef,
  AchievementMetric,
  AchievementRarity,
  LocalizedText,
} from '../types/achievement.types.js';

function text(ko: string, en: string): LocalizedText {
  return { ko, en };
}

function def(partial: Omit<AchievementDef, 'sortOrder'> & { sortOrder?: number }): AchievementDef {
  return { sortOrder: partial.sortOrder ?? 0, ...partial };
}

function rarityForTarget(target: number, soft: number, mid: number, hard: number): AchievementRarity {
  if (target >= hard) return 'mythic';
  if (target >= mid) return 'legendary';
  if (target >= soft) return 'epic';
  if (target >= soft / 3) return 'rare';
  if (target >= soft / 10) return 'uncommon';
  return 'common';
}

function xpForRarity(rarity: AchievementRarity, tier = 1): number {
  const base: Record<AchievementRarity, number> = {
    common: 50,
    uncommon: 120,
    rare: 250,
    epic: 500,
    legendary: 1000,
    mythic: 2500,
  };
  return base[rarity] + Math.max(0, tier - 1) * 40;
}

function milestoneSeries(options: {
  category: AchievementCategory;
  idPrefix: string;
  metric: AchievementMetric;
  targets: number[];
  emoji: string | ((n: number, i: number) => string);
  name: (n: number) => LocalizedText;
  description: (n: number) => LocalizedText;
  title?: (n: number, i: number) => LocalizedText | undefined;
  secret?: boolean;
  season?: boolean;
  soft?: number;
  mid?: number;
  hard?: number;
}): AchievementDef[] {
  const soft = options.soft ?? options.targets[Math.floor(options.targets.length * 0.4)] ?? 10;
  const mid = options.mid ?? options.targets[Math.floor(options.targets.length * 0.7)] ?? soft * 5;
  const hard = options.hard ?? options.targets[options.targets.length - 1] ?? mid * 2;

  return options.targets.map((target, i) => {
    const rarity = rarityForTarget(target, soft, mid, hard);
    const emoji = typeof options.emoji === 'function' ? options.emoji(target, i) : options.emoji;
    return def({
      id: `${options.idPrefix}-${target}`,
      category: options.category,
      rarity,
      emoji,
      name: options.name(target),
      description: options.description(target),
      condition: { metric: options.metric, op: 'gte', target },
      xp: xpForRarity(rarity, i + 1),
      title: options.title?.(target, i),
      secret: options.secret,
      season: options.season,
      sortOrder: i,
    });
  });
}

const VOLUME_TONS = [1, 10, 50, 100, 300, 500, 1000, 3000, 5000, 10000, 30000, 50000, 100000, 1000000];

const VOLUME_TITLES: Record<number, LocalizedText> = {
  1: text('Machine Rookie', 'Machine Rookie'),
  10: text('Iron Beginner', 'Iron Beginner'),
  100: text('Steel Warrior', 'Steel Warrior'),
  500: text('Gym Beast', 'Gym Beast'),
  1000: text('Machine Master', 'Machine Master'),
  10000: text('Legend', 'Legend'),
  50000: text('Titan', 'Titan'),
  100000: text('Iron King', 'Iron King'),
  1000000: text('Machine Emperor', 'Machine Emperor'),
};

function buildVolumeAchievements(): AchievementDef[] {
  return milestoneSeries({
    category: 'volume',
    idPrefix: 'vol',
    metric: 'total_volume_kg',
    targets: VOLUME_TONS.map((t) => t * 1000),
    emoji: (kg) => {
      const tons = kg / 1000;
      if (tons >= 100000) return '👑';
      if (tons >= 10000) return '🏆';
      if (tons >= 1000) return '🥇';
      if (tons >= 100) return '💪';
      return '🏋️';
    },
    name: (kg) => {
      const tons = kg / 1000;
      const label = tons >= 1000 ? `${(tons / 1000).toLocaleString('en-US')}천 톤` : `${tons.toLocaleString('en-US')}톤`;
      const en = tons >= 1000 ? `${(tons / 1000).toLocaleString('en-US')}K Tons` : `${tons.toLocaleString('en-US')} Tons`;
      return text(label, en);
    },
    description: (kg) => {
      const tons = kg / 1000;
      return text(
        `누적 볼륨 ${tons.toLocaleString('ko-KR')}톤을 달성했습니다.`,
        `Reached ${tons.toLocaleString('en-US')} tons of cumulative volume.`
      );
    },
    title: (kg) => VOLUME_TITLES[kg / 1000],
    soft: 100_000,
    mid: 1_000_000,
    hard: 50_000_000,
  });
}

function buildRealityAchievements(): AchievementDef[] {
  // Use real-world comparison weights as volume thresholds (≥ bicycle).
  const items = LIFTED_COMPARISONS.filter((c) => c.weightKg >= 12).sort(
    (a, b) => a.weightKg - b.weightKg
  );

  return items.map((item, i) => {
    const rarity = rarityForTarget(item.weightKg, 500, 50_000, 500_000);
    return def({
      id: `reality-${item.id}`,
      category: 'reality',
      rarity,
      emoji: item.emoji,
      name: text(`${item.name.ko} 리프터`, `${item.name.en} Lifter`),
      description: text(
        `누적 볼륨이 ${item.name.ko}(${item.weightKg.toLocaleString('ko-KR')}kg)를 넘었습니다.`,
        `Your cumulative volume surpassed a ${item.name.en} (${item.weightKg.toLocaleString('en-US')} kg).`
      ),
      condition: { metric: 'total_volume_kg', op: 'gte', target: item.weightKg },
      xp: xpForRarity(rarity, i + 1),
      title:
        i >= items.length - 5
          ? text(`${item.name.ko} 정복자`, `${item.name.en} Conqueror`)
          : undefined,
      sortOrder: i,
    });
  });
}

function buildWorkoutCountAchievements(): AchievementDef[] {
  return milestoneSeries({
    category: 'workouts',
    idPrefix: 'wo',
    metric: 'workout_count',
    targets: [1, 10, 50, 100, 300, 500, 1000, 5000, 10000],
    emoji: '🔥',
    name: (n) =>
      n === 1
        ? text('첫 운동', 'First Workout')
        : text(`운동 ${n.toLocaleString('ko-KR')}회`, `${n.toLocaleString('en-US')} Workouts`),
    description: (n) =>
      text(
        `운동 기록을 ${n.toLocaleString('ko-KR')}회 남겼습니다.`,
        `Logged ${n.toLocaleString('en-US')} workouts.`
      ),
    title: (n) =>
      n >= 1000 ? text('기록 중독자', 'Log Addict') : n >= 100 ? text('루틴 러너', 'Routine Runner') : undefined,
    soft: 100,
    mid: 1000,
    hard: 10000,
  });
}

function buildAttendanceAchievements(): AchievementDef[] {
  return milestoneSeries({
    category: 'attendance',
    idPrefix: 'streak',
    metric: 'longest_streak',
    targets: [3, 7, 14, 30, 50, 100, 180, 365, 500, 1000],
    emoji: '📅',
    name: (n) => text(`${n}일 연속 출석`, `${n}-Day Streak`),
    description: (n) =>
      text(
        `최대 ${n}일 연속으로 운동장을 지켰습니다.`,
        `Held a longest streak of ${n} consecutive training days.`
      ),
    title: (n) =>
      n >= 365
        ? text('불굴의 출석왕', 'Iron Attendance')
        : n >= 30
          ? text('습관의 힘', 'Habit Forge')
          : undefined,
    soft: 30,
    mid: 180,
    hard: 1000,
  });
}

function buildConsistencyAchievements(): AchievementDef[] {
  return [
    def({
      id: 'consistency-current-7',
      category: 'consistency',
      rarity: 'uncommon',
      emoji: '❤️',
      name: text('지금 불타오르는 중', 'On Fire Now'),
      description: text('현재 연속 출석 7일 이상.', 'Current streak is 7+ days.'),
      condition: { metric: 'current_streak', op: 'gte', target: 7 },
      xp: 150,
      sortOrder: 0,
    }),
    def({
      id: 'consistency-current-30',
      category: 'consistency',
      rarity: 'epic',
      emoji: '❤️',
      name: text('한 달 무결점', 'Flawless Month'),
      description: text('현재 연속 출석 30일 이상.', 'Current streak is 30+ days.'),
      condition: { metric: 'current_streak', op: 'gte', target: 30 },
      xp: 600,
      title: text('꾸준함의 화신', 'Consistency Incarnate'),
      sortOrder: 1,
    }),
    ...milestoneSeries({
      category: 'consistency',
      idPrefix: 'days',
      metric: 'session_days',
      targets: [10, 30, 60, 100, 200, 365],
      emoji: '❤️',
      name: (n) => text(`운동일 ${n}일`, `${n} Training Days`),
      description: (n) =>
        text(`서로 다른 날짜에 ${n}일 운동했습니다.`, `Trained on ${n} distinct days.`),
      soft: 30,
      mid: 100,
      hard: 365,
    }),
  ];
}

function buildPrAchievements(): AchievementDef[] {
  return milestoneSeries({
    category: 'pr',
    idPrefix: 'pr',
    metric: 'pr_count',
    targets: [1, 10, 30, 50, 100, 500, 1000],
    emoji: '🏆',
    name: (n) =>
      n === 1 ? text('첫 PR', 'First PR') : text(`PR ${n}회`, `${n} PRs`),
    description: (n) =>
      text(
        `개인 최고 기록(PR)을 ${n}회 갱신했습니다.`,
        `Broke a personal record ${n} times.`
      ),
    title: (n) => (n >= 100 ? text('PR 헌터', 'PR Hunter') : undefined),
    soft: 30,
    mid: 100,
    hard: 1000,
  });
}

function buildMachineAchievements(): AchievementDef[] {
  const counts = milestoneSeries({
    category: 'machine',
    idPrefix: 'machine',
    metric: 'unique_machines',
    targets: [1, 10, 20, 30, 50, 100, 200],
    emoji: '🏋️',
    name: (n) =>
      n === 1
        ? text('첫 머신', 'First Machine')
        : text(`머신 ${n}종`, `${n} Machines`),
    description: (n) =>
      text(`${n}종의 서로 다른 머신을 사용했습니다.`, `Used ${n} distinct machines.`),
    title: (n) => (n >= 100 ? text('머신 컬렉터', 'Machine Collector') : undefined),
    soft: 20,
    mid: 50,
    hard: 200,
  });

  const brands = milestoneSeries({
    category: 'machine',
    idPrefix: 'brand',
    metric: 'unique_brands',
    targets: [3, 5, 10, 15, 20],
    emoji: '🏷️',
    name: (n) => text(`브랜드 ${n}종`, `${n} Brands`),
    description: (n) =>
      text(`${n}개 브랜드의 장비를 경험했습니다.`, `Trained on equipment from ${n} brands.`),
    title: (n, i) =>
      i === 4 ? text('브랜드 컬렉터', 'Brand Collector') : text(`${n} Brand Explorer`, `${n} Brand Explorer`),
    soft: 5,
    mid: 10,
    hard: 20,
  });

  const masters: AchievementDef[] = [
    ['hammer', 'Hammer Strength Master', 'Hammer Strength'],
    ['life-fitness', 'Life Fitness Master', 'Life Fitness'],
    ['technogym', 'Technogym Master', 'Technogym'],
    ['cybex', 'Cybex Master', 'Cybex'],
  ].map(([id, title, brand], i) =>
    def({
      id: `machine-master-${id}`,
      category: 'machine',
      rarity: 'legendary',
      emoji: '👑',
      name: text(title, title),
      description: text(
        `${brand} 장비를 폭넓게 경험한 마스터입니다. (브랜드 ${5 + i * 2}종 이상)`,
        `Mastered a wide ${brand} footprint (proxy: ${5 + i * 2}+ brands explored).`
      ),
      // Proxy until per-brand machine clears are tracked separately.
      condition: { metric: 'unique_brands', op: 'gte', target: 5 + i * 2 },
      xp: 1200,
      title: text(title, title),
      sortOrder: 100 + i,
    })
  );

  return [...counts, ...brands, ...masters];
}

function buildMuscleAchievements(): AchievementDef[] {
  const specs: Array<{
    id: string;
    metric: AchievementMetric;
    emoji: string;
    name: LocalizedText;
    target: number;
    rarity: AchievementRarity;
  }> = [
    {
      id: 'muscle-chest-king',
      metric: 'chest_workouts',
      emoji: '💪',
      name: text('가슴왕', 'Chest King'),
      target: 50,
      rarity: 'rare',
    },
    {
      id: 'muscle-back-beast',
      metric: 'back_workouts',
      emoji: '🦍',
      name: text('등신', 'Back Beast'),
      target: 50,
      rarity: 'rare',
    },
    {
      id: 'muscle-leg-king',
      metric: 'legs_workouts',
      emoji: '🦵',
      name: text('하체왕', 'Leg King'),
      target: 50,
      rarity: 'epic',
    },
    {
      id: 'muscle-shoulder-king',
      metric: 'shoulders_workouts',
      emoji: '🏔️',
      name: text('어깨왕', 'Shoulder King'),
      target: 40,
      rarity: 'rare',
    },
    {
      id: 'muscle-arm-master',
      metric: 'arms_workouts',
      emoji: '🦾',
      name: text('팔마스터', 'Arm Master'),
      target: 40,
      rarity: 'rare',
    },
    {
      id: 'muscle-core-artisan',
      metric: 'core_workouts',
      emoji: '🧱',
      name: text('복근장인', 'Core Artisan'),
      target: 40,
      rarity: 'rare',
    },
  ];

  const kings = specs.map((s, i) =>
    def({
      id: s.id,
      category: 'muscle',
      rarity: s.rarity,
      emoji: s.emoji,
      name: s.name,
      description: text(
        `${s.name.ko} — 해당 부위 운동 ${s.target}회 달성.`,
        `${s.name.en} — hit ${s.target} workouts for that muscle focus.`
      ),
      condition: { metric: s.metric, op: 'gte', target: s.target },
      xp: xpForRarity(s.rarity),
      title: s.name,
      sortOrder: i,
    })
  );

  return [
    ...kings,
    def({
      id: 'muscle-balanced',
      category: 'muscle',
      rarity: 'epic',
      emoji: '⚖️',
      name: text('균형형', 'Balanced Lifter'),
      description: text('상·하체 비율이 고른 균형형 트레이너.', 'Balanced upper/lower training ratio.'),
      condition: { metric: 'balance_score', op: 'gte', target: 80 },
      xp: 700,
      title: text('균형형', 'Balanced Lifter'),
      sortOrder: 20,
    }),
    def({
      id: 'muscle-upper-focus',
      category: 'muscle',
      rarity: 'uncommon',
      emoji: '⬆️',
      name: text('상체 집중형', 'Upper Focus'),
      description: text('상체 비중 70% 이상.', 'Upper-body share ≥ 70%.'),
      condition: { metric: 'upper_ratio_pct', op: 'gte', target: 70 },
      xp: 200,
      title: text('상체 집중형', 'Upper Focus'),
      sortOrder: 21,
    }),
    def({
      id: 'muscle-lower-focus',
      category: 'muscle',
      rarity: 'uncommon',
      emoji: '⬇️',
      name: text('하체 집중형', 'Lower Focus'),
      description: text('하체 비중 55% 이상.', 'Lower-body share ≥ 55%.'),
      condition: { metric: 'lower_ratio_pct', op: 'gte', target: 55 },
      xp: 220,
      title: text('하체 집중형', 'Lower Focus'),
      sortOrder: 22,
    }),
  ];
}

function buildTimeOfDayAchievements(): AchievementDef[] {
  return [
    def({
      id: 'tod-dawn',
      category: 'time_of_day',
      rarity: 'rare',
      emoji: '🌅',
      name: text('새벽 전사', 'Dawn Warrior'),
      description: text('새벽(05–07시) 운동 20회.', '20 workouts between 05:00–07:00.'),
      condition: { metric: 'dawn_workouts', op: 'gte', target: 20 },
      xp: 400,
      title: text('새벽 전사', 'Dawn Warrior'),
      sortOrder: 0,
    }),
    def({
      id: 'tod-morning',
      category: 'time_of_day',
      rarity: 'uncommon',
      emoji: '🌞',
      name: text('아침형 인간', 'Morning Person'),
      description: text('아침(07–11시) 운동 30회.', '30 workouts between 07:00–11:00.'),
      condition: { metric: 'morning_workouts', op: 'gte', target: 30 },
      xp: 250,
      title: text('아침형 인간', 'Morning Person'),
      sortOrder: 1,
    }),
    def({
      id: 'tod-evening',
      category: 'time_of_day',
      rarity: 'common',
      emoji: '🌇',
      name: text('퇴근 후 전사', 'After-Work Warrior'),
      description: text('저녁(17–21시) 운동 30회.', '30 workouts between 17:00–21:00.'),
      condition: { metric: 'evening_workouts', op: 'gte', target: 30 },
      xp: 180,
      title: text('퇴근 후 전사', 'After-Work Warrior'),
      sortOrder: 2,
    }),
    def({
      id: 'tod-night',
      category: 'time_of_day',
      rarity: 'rare',
      emoji: '🌙',
      name: text('야행성 리프터', 'Night Owl Lifter'),
      description: text('밤(21–24시) 운동 40회.', '40 workouts between 21:00–24:00.'),
      condition: { metric: 'night_workouts', op: 'gte', target: 40 },
      xp: 350,
      title: text('야행성 리프터', 'Night Owl Lifter'),
      sortOrder: 3,
    }),
    def({
      id: 'tod-late-night',
      category: 'time_of_day',
      rarity: 'epic',
      emoji: '🦉',
      name: text('심야 운동왕', 'Midnight King'),
      description: text('심야(00–05시) 운동 25회.', '25 workouts between 00:00–05:00.'),
      condition: { metric: 'night_workouts', op: 'gte', target: 80 },
      xp: 550,
      title: text('심야 운동왕', 'Midnight King'),
      sortOrder: 4,
    }),
  ];
}

function buildGymAchievements(): AchievementDef[] {
  return milestoneSeries({
    category: 'gym',
    idPrefix: 'gym',
    metric: 'unique_gyms',
    targets: [1, 5, 10, 20],
    emoji: '🏢',
    name: (n) =>
      n === 1
        ? text('첫 헬스장', 'First Gym')
        : n >= 20
          ? text('전국 원정러', 'Nationwide Tourer')
          : text(`헬스장 ${n}곳`, `${n} Gyms`),
    description: (n) =>
      text(`${n}곳의 헬스장에서 운동했습니다.`, `Trained at ${n} different gyms.`),
    title: (n) =>
      n >= 20 ? text('전국 원정러', 'Nationwide Tourer') : n >= 10 ? text('원정 리프터', 'Touring Lifter') : undefined,
    soft: 5,
    mid: 10,
    hard: 20,
  });
}

function buildRegionAiChallengeEvent(): AchievementDef[] {
  return [
    def({
      id: 'region-explorer',
      category: 'region',
      rarity: 'rare',
      emoji: '🌎',
      name: text('지역 탐험가', 'Region Explorer'),
      description: text('서로 다른 헬스장 5곳 이상 방문.', 'Visit 5+ different gyms.'),
      condition: { metric: 'unique_gyms', op: 'gte', target: 5 },
      xp: 300,
      sortOrder: 0,
    }),
    def({
      id: 'ai-first-recommend',
      category: 'ai',
      rarity: 'common',
      emoji: '🤖',
      name: text('AI 파트너', 'AI Partner'),
      description: text('운동 기록 10회로 AI 코칭 여정을 시작.', 'Start your AI coaching journey with 10 logs.'),
      condition: { metric: 'workout_count', op: 'gte', target: 10 },
      xp: 80,
      sortOrder: 0,
    }),
    def({
      id: 'ai-volume-sensei',
      category: 'ai',
      rarity: 'epic',
      emoji: '🤖',
      name: text('AI 볼륨 센세이', 'AI Volume Sensei'),
      description: text('누적 100톤 — AI가 인정한 성장.', '100 tons — growth the AI respects.'),
      condition: { metric: 'total_volume_kg', op: 'gte', target: 100_000 },
      xp: 800,
      title: text('AI 센세이', 'AI Sensei'),
      sortOrder: 1,
    }),
    def({
      id: 'challenge-100-days',
      category: 'challenge',
      rarity: 'legendary',
      emoji: '🎯',
      name: text('100일 챌린지', '100-Day Challenge'),
      description: text('운동일 100일 달성.', 'Reach 100 distinct training days.'),
      condition: { metric: 'session_days', op: 'gte', target: 100 },
      xp: 1500,
      title: text('챌린지 피니셔', 'Challenge Finisher'),
      sortOrder: 0,
    }),
    def({
      id: 'event-holiday-5',
      category: 'event',
      rarity: 'rare',
      emoji: '🎁',
      name: text('홀리데이 리프터', 'Holiday Lifter'),
      description: text('공휴일/기념일 운동 5회.', 'Train on 5 holiday dates.'),
      condition: { metric: 'holiday_workouts', op: 'gte', target: 5 },
      xp: 400,
      sortOrder: 0,
    }),
  ];
}

function buildSeasonAchievements(): AchievementDef[] {
  return [
    def({
      id: 'season-2026-summer',
      category: 'season',
      rarity: 'epic',
      emoji: '☀️',
      name: text('2026 Summer', '2026 Summer'),
      description: text('2026년 여름(6–8월) 운동 20회.', '20 workouts in summer 2026 (Jun–Aug).'),
      condition: { metric: 'summer_2026_workouts', op: 'gte', target: 20 },
      xp: 600,
      title: text('2026 Summer Champ', '2026 Summer Champ'),
      season: true,
      sortOrder: 0,
    }),
    def({
      id: 'season-2026-winter',
      category: 'season',
      rarity: 'epic',
      emoji: '❄️',
      name: text('2026 Winter', '2026 Winter'),
      description: text('2026년 겨울(12–2월) 운동 20회.', '20 workouts in winter 2026 window.'),
      condition: { metric: 'winter_2026_workouts', op: 'gte', target: 20 },
      xp: 600,
      title: text('2026 Winter Champ', '2026 Winter Champ'),
      season: true,
      sortOrder: 1,
    }),
    def({
      id: 'season-2027-new-year',
      category: 'season',
      rarity: 'rare',
      emoji: '🎆',
      name: text('2027 New Year', '2027 New Year'),
      description: text('새해(1/1) 운동 1회 이상.', 'Train on New Year’s Day at least once.'),
      condition: { metric: 'new_year_workouts', op: 'gte', target: 1 },
      xp: 350,
      season: true,
      sortOrder: 2,
    }),
    def({
      id: 'season-halloween',
      category: 'season',
      rarity: 'rare',
      emoji: '🎃',
      name: text('Halloween', 'Halloween'),
      description: text('할로윈(10/31) 운동.', 'Train on Halloween (Oct 31).'),
      condition: { metric: 'halloween_workouts', op: 'gte', target: 1 },
      xp: 300,
      season: true,
      sortOrder: 3,
    }),
    def({
      id: 'season-christmas',
      category: 'season',
      rarity: 'rare',
      emoji: '🎄',
      name: text('Christmas', 'Christmas'),
      description: text('크리스마스(12/25) 운동.', 'Train on Christmas Day.'),
      condition: { metric: 'christmas_workouts', op: 'gte', target: 1 },
      xp: 300,
      season: true,
      sortOrder: 4,
    }),
  ];
}

function buildHiddenAchievements(): AchievementDef[] {
  const hiddenTargets: Array<{
    id: string;
    metric: AchievementMetric;
    target: number;
    emoji: string;
    name: LocalizedText;
    rarity: AchievementRarity;
  }> = [
    { id: 'hidden-leg-100', metric: 'leg_day_workouts', target: 100, emoji: '🦵', name: text('레그데이 100', '100 Leg Days'), rarity: 'legendary' },
    { id: 'hidden-bench-100', metric: 'bench_workouts', target: 100, emoji: '🛏️', name: text('벤치만 100', '100 Bench Days'), rarity: 'legendary' },
    { id: 'hidden-squat-100', metric: 'squat_workouts', target: 100, emoji: '🏔️', name: text('스쿼트만 100', '100 Squat Days'), rarity: 'legendary' },
    { id: 'hidden-dawn-50', metric: 'dawn_workouts', target: 50, emoji: '🌅', name: text('새벽 50회', '50 Dawn Sessions'), rarity: 'epic' },
    { id: 'hidden-night-100', metric: 'night_workouts', target: 100, emoji: '🌙', name: text('밤운동 100', '100 Night Sessions'), rarity: 'epic' },
    { id: 'hidden-machines-100', metric: 'unique_machines', target: 100, emoji: '🤖', name: text('머신 100종 비밀', 'Secret Machine 100'), rarity: 'mythic' },
    { id: 'hidden-brands-10', metric: 'unique_brands', target: 10, emoji: '🎁', name: text('브랜드 10 비밀', 'Secret Brand 10'), rarity: 'epic' },
    { id: 'hidden-streak-30-now', metric: 'current_streak', target: 30, emoji: '🔥', name: text('30일 무휴식', '30 Days No Rest'), rarity: 'mythic' },
    { id: 'hidden-christmas', metric: 'christmas_workouts', target: 1, emoji: '🎄', name: text('크리스마스 리프트', 'Christmas Lift'), rarity: 'rare' },
    { id: 'hidden-new-year', metric: 'new_year_workouts', target: 1, emoji: '🎊', name: text('새해 첫 운동', 'New Year Lift'), rarity: 'rare' },
    { id: 'hidden-halloween', metric: 'halloween_workouts', target: 1, emoji: '🎃', name: text('할로윈 스웻', 'Halloween Sweat'), rarity: 'rare' },
    { id: 'hidden-holiday-10', metric: 'holiday_workouts', target: 10, emoji: '🎁', name: text('휴일 중독', 'Holiday Addict'), rarity: 'legendary' },
    { id: 'hidden-pr-500', metric: 'pr_count', target: 500, emoji: '🚀', name: text('PR 폭풍', 'PR Storm'), rarity: 'mythic' },
    { id: 'hidden-volume-777', metric: 'total_volume_kg', target: 777_000, emoji: '🎰', name: text('777톤의 저주', 'Curse of 777t'), rarity: 'legendary' },
    { id: 'hidden-workouts-777', metric: 'workout_count', target: 777, emoji: '✨', name: text('행운의 777', 'Lucky 777'), rarity: 'legendary' },
    { id: 'hidden-gyms-7', metric: 'unique_gyms', target: 7, emoji: '🗺️', name: text('일곱 체육관', 'Seven Gyms'), rarity: 'epic' },
    { id: 'hidden-balance-95', metric: 'balance_score', target: 95, emoji: '☯️', name: text('완벽한 균형', 'Perfect Balance'), rarity: 'mythic' },
    { id: 'hidden-core-100', metric: 'core_workouts', target: 100, emoji: '🧱', name: text('코어 수도원', 'Core Monastery'), rarity: 'epic' },
    { id: 'hidden-shoulders-100', metric: 'shoulders_workouts', target: 100, emoji: '⛰️', name: text('어깨 요새', 'Shoulder Fortress'), rarity: 'epic' },
    { id: 'hidden-arms-100', metric: 'arms_workouts', target: 100, emoji: '🦞', name: text('팔 전설', 'Arm Legend'), rarity: 'epic' },
    { id: 'hidden-chest-100', metric: 'chest_workouts', target: 100, emoji: '🦁', name: text('가슴 레전드', 'Chest Legend'), rarity: 'epic' },
    { id: 'hidden-back-100', metric: 'back_workouts', target: 100, emoji: '🐉', name: text('등판 드래곤', 'Back Dragon'), rarity: 'epic' },
    { id: 'hidden-legs-200', metric: 'legs_workouts', target: 200, emoji: '🐘', name: text('하체 코끼리', 'Leg Elephant'), rarity: 'mythic' },
    { id: 'hidden-session-500', metric: 'session_days', target: 500, emoji: '📆', name: text('500일의 맹세', 'Oath of 500'), rarity: 'mythic' },
    { id: 'hidden-streak-100', metric: 'longest_streak', target: 100, emoji: '💎', name: text('백일홍', 'Century Flame'), rarity: 'mythic' },
    { id: 'hidden-morning-100', metric: 'morning_workouts', target: 100, emoji: '☀️', name: text('아침 100', 'Morning 100'), rarity: 'epic' },
    { id: 'hidden-evening-200', metric: 'evening_workouts', target: 200, emoji: '🌆', name: text('퇴근 200', 'After-Work 200'), rarity: 'legendary' },
    { id: 'hidden-afternoon-50', metric: 'afternoon_workouts', target: 50, emoji: '🌤️', name: text('오후반', 'Afternoon Crew'), rarity: 'rare' },
    { id: 'hidden-summer-50', metric: 'summer_2026_workouts', target: 50, emoji: '🏖️', name: text('여름 폭염', 'Summer Inferno'), rarity: 'legendary' },
    { id: 'hidden-winter-50', metric: 'winter_2026_workouts', target: 50, emoji: '🧊', name: text('겨울 동상', 'Winter Frostbite'), rarity: 'legendary' },
    { id: 'hidden-volume-1', metric: 'total_volume_kg', target: 1, emoji: '🥚', name: text('첫 그램의 비밀', 'Secret First Gram'), rarity: 'common' },
    { id: 'hidden-first-pr-secret', metric: 'pr_count', target: 1, emoji: '🥇', name: text('비밀의 첫 PR', 'Secret First PR'), rarity: 'common' },
    { id: 'hidden-machines-30', metric: 'unique_machines', target: 30, emoji: '🧩', name: text('30 피스', '30 Pieces'), rarity: 'rare' },
    { id: 'hidden-brands-3', metric: 'unique_brands', target: 3, emoji: '🔖', name: text('세 브랜드', 'Triple Brand'), rarity: 'uncommon' },
    { id: 'hidden-upper-90', metric: 'upper_ratio_pct', target: 90, emoji: '🦅', name: text('상체 편애', 'Upper Bias'), rarity: 'epic' },
    { id: 'hidden-lower-70', metric: 'lower_ratio_pct', target: 70, emoji: '🦬', name: text('하체 편애', 'Lower Bias'), rarity: 'epic' },
    { id: 'hidden-workouts-13', metric: 'workout_count', target: 13, emoji: '🔮', name: text('13의 저주', 'Curse of 13'), rarity: 'uncommon' },
    { id: 'hidden-workouts-42', metric: 'workout_count', target: 42, emoji: '🌌', name: text('인생답 42', 'Answer 42'), rarity: 'rare' },
    { id: 'hidden-streak-14-now', metric: 'current_streak', target: 14, emoji: '🔗', name: text('2주 사슬', 'Two-Week Chain'), rarity: 'epic' },
    { id: 'hidden-gym-1-secret', metric: 'unique_gyms', target: 1, emoji: '🏠', name: text('나만의 홈짐', 'My Home Gym'), rarity: 'common' },
    { id: 'hidden-ton-333', metric: 'total_volume_kg', target: 333_000, emoji: '🔺', name: text('333톤', '333 Tons'), rarity: 'epic' },
    { id: 'hidden-ton-999', metric: 'total_volume_kg', target: 999_000, emoji: '🧿', name: text('999톤', '999 Tons'), rarity: 'legendary' },
    { id: 'hidden-pr-7', metric: 'pr_count', target: 7, emoji: '7️⃣', name: text('행운의 PR 7', 'Lucky PR 7'), rarity: 'uncommon' },
    { id: 'hidden-pr-77', metric: 'pr_count', target: 77, emoji: '🎰', name: text('PR 77', 'PR 77'), rarity: 'epic' },
    { id: 'hidden-days-7', metric: 'session_days', target: 7, emoji: '🌱', name: text('일주일의 씨앗', 'Week Seed'), rarity: 'common' },
    { id: 'hidden-days-77', metric: 'session_days', target: 77, emoji: '🌲', name: text('77일의 숲', 'Forest of 77'), rarity: 'rare' },
    { id: 'hidden-machines-7', metric: 'unique_machines', target: 7, emoji: '🎲', name: text('럭키 7머신', 'Lucky 7 Machines'), rarity: 'uncommon' },
    { id: 'hidden-dawn-7', metric: 'dawn_workouts', target: 7, emoji: '🌄', name: text('새벽 7', 'Dawn 7'), rarity: 'uncommon' },
    { id: 'hidden-night-7', metric: 'night_workouts', target: 7, emoji: '🌃', name: text('밤 7', 'Night 7'), rarity: 'uncommon' },
    { id: 'hidden-leg-7', metric: 'leg_day_workouts', target: 7, emoji: '🍗', name: text('치킨레그 탈출 7', 'Chicken-Leg Escape 7'), rarity: 'uncommon' },
    { id: 'hidden-bench-7', metric: 'bench_workouts', target: 7, emoji: '🛋️', name: text('벤치 7', 'Bench 7'), rarity: 'uncommon' },
    { id: 'hidden-squat-7', metric: 'squat_workouts', target: 7, emoji: '🪨', name: text('스쿼트 7', 'Squat 7'), rarity: 'uncommon' },
    { id: 'hidden-holiday-1', metric: 'holiday_workouts', target: 1, emoji: '🎌', name: text('휴일 한 방', 'One Holiday Hit'), rarity: 'uncommon' },
    { id: 'hidden-chest-7', metric: 'chest_workouts', target: 7, emoji: '💓', name: text('가슴 7', 'Chest 7'), rarity: 'uncommon' },
    { id: 'hidden-back-7', metric: 'back_workouts', target: 7, emoji: '🔙', name: text('등 7', 'Back 7'), rarity: 'uncommon' },
    { id: 'hidden-shoulder-7', metric: 'shoulders_workouts', target: 7, emoji: '🪨', name: text('어깨 7', 'Shoulder 7'), rarity: 'uncommon' },
    { id: 'hidden-arm-7', metric: 'arms_workouts', target: 7, emoji: '💪', name: text('팔 7', 'Arm 7'), rarity: 'uncommon' },
    { id: 'hidden-core-7', metric: 'core_workouts', target: 7, emoji: '🌀', name: text('코어 7', 'Core 7'), rarity: 'uncommon' },
    { id: 'hidden-volume-50t', metric: 'total_volume_kg', target: 50_000, emoji: '🤫', name: text('비밀 50톤', 'Secret 50t'), rarity: 'rare' },
    { id: 'hidden-volume-250t', metric: 'total_volume_kg', target: 250_000, emoji: '🙊', name: text('비밀 250톤', 'Secret 250t'), rarity: 'epic' },
    { id: 'hidden-machines-50', metric: 'unique_machines', target: 50, emoji: '🧪', name: text('실험실 50', 'Lab 50'), rarity: 'epic' },
    { id: 'hidden-brands-15', metric: 'unique_brands', target: 15, emoji: '🌈', name: text('브랜드 무지개', 'Brand Rainbow'), rarity: 'legendary' },
    { id: 'hidden-gyms-3', metric: 'unique_gyms', target: 3, emoji: '📍', name: text('세 거점', 'Triple Base'), rarity: 'rare' },
    { id: 'hidden-streak-3-now', metric: 'current_streak', target: 3, emoji: '⛓️', name: text('삼일천하', 'Three-Day Reign'), rarity: 'common' },
    { id: 'hidden-longest-7', metric: 'longest_streak', target: 7, emoji: '📿', name: text('칠일염주', 'Seven Beads'), rarity: 'uncommon' },
    { id: 'hidden-longest-50', metric: 'longest_streak', target: 50, emoji: '🏅', name: text('오십일 금장', 'Gold 50'), rarity: 'legendary' },
    { id: 'hidden-workouts-1000', metric: 'workout_count', target: 1000, emoji: '🏰', name: text('천 번의 기록', 'Thousand Logs'), rarity: 'mythic' },
    { id: 'hidden-session-365', metric: 'session_days', target: 365, emoji: '👑', name: text('1년의 왕관', 'Year Crown'), rarity: 'mythic' },
    { id: 'hidden-pr-1000', metric: 'pr_count', target: 1000, emoji: '☄️', name: text('PR 운석', 'PR Meteor'), rarity: 'mythic' },
    { id: 'hidden-balance-50', metric: 'balance_score', target: 50, emoji: '🌓', name: text('반반의 미학', 'Half & Half'), rarity: 'uncommon' },
    { id: 'hidden-upper-50', metric: 'upper_ratio_pct', target: 50, emoji: '↕️', name: text('상체 과반', 'Upper Majority'), rarity: 'common' },
    { id: 'hidden-lower-40', metric: 'lower_ratio_pct', target: 40, emoji: '📉', name: text('하체 40', 'Lower 40'), rarity: 'common' },
    { id: 'hidden-dawn-1', metric: 'dawn_workouts', target: 1, emoji: '🤫', name: text('첫 새벽', 'First Dawn'), rarity: 'common' },
    { id: 'hidden-night-1', metric: 'night_workouts', target: 1, emoji: '🕶️', name: text('첫 야간', 'First Night'), rarity: 'common' },
    { id: 'hidden-leg-1', metric: 'leg_day_workouts', target: 1, emoji: '🐣', name: text('첫 레그데이', 'First Leg Day'), rarity: 'common' },
    { id: 'hidden-bench-1', metric: 'bench_workouts', target: 1, emoji: '🕯️', name: text('첫 벤치', 'First Bench'), rarity: 'common' },
    { id: 'hidden-squat-1', metric: 'squat_workouts', target: 1, emoji: '🪵', name: text('첫 스쿼트', 'First Squat'), rarity: 'common' },
    { id: 'hidden-summer-1', metric: 'summer_2026_workouts', target: 1, emoji: '🍉', name: text('여름의 속삭임', 'Summer Whisper'), rarity: 'uncommon' },
    { id: 'hidden-winter-1', metric: 'winter_2026_workouts', target: 1, emoji: '🧣', name: text('겨울의 속삭임', 'Winter Whisper'), rarity: 'uncommon' },
    { id: 'hidden-ton-3', metric: 'total_volume_kg', target: 3000, emoji: '🥉', name: text('비밀 3톤', 'Secret 3t'), rarity: 'common' },
    { id: 'hidden-ton-30', metric: 'total_volume_kg', target: 30_000, emoji: '🥈', name: text('비밀 30톤', 'Secret 30t'), rarity: 'uncommon' },
    { id: 'hidden-machines-200', metric: 'unique_machines', target: 200, emoji: '🛸', name: text('머신 UFO', 'Machine UFO'), rarity: 'mythic' },
    { id: 'hidden-brands-20', metric: 'unique_brands', target: 20, emoji: '🌠', name: text('브랜드 은하', 'Brand Galaxy'), rarity: 'mythic' },
    { id: 'hidden-gyms-10', metric: 'unique_gyms', target: 10, emoji: '🧳', name: text('짐 트래블러', 'Gym Traveler'), rarity: 'legendary' },
    { id: 'hidden-afternoon-1', metric: 'afternoon_workouts', target: 1, emoji: '☕', name: text('오후 커피 리프트', 'Afternoon Coffee Lift'), rarity: 'common' },
    { id: 'hidden-evening-1', metric: 'evening_workouts', target: 1, emoji: '🌃', name: text('첫 퇴근 리프트', 'First After-Work'), rarity: 'common' },
    { id: 'hidden-morning-1', metric: 'morning_workouts', target: 1, emoji: '🥐', name: text('첫 모닝', 'First Morning'), rarity: 'common' },
    { id: 'hidden-chest-1', metric: 'chest_workouts', target: 1, emoji: '🔒', name: text('가슴 시크릿', 'Chest Secret'), rarity: 'common' },
    { id: 'hidden-back-1', metric: 'back_workouts', target: 1, emoji: '🔐', name: text('등 시크릿', 'Back Secret'), rarity: 'common' },
    { id: 'hidden-core-1', metric: 'core_workouts', target: 1, emoji: '🗝️', name: text('코어 시크릿', 'Core Secret'), rarity: 'common' },
    { id: 'hidden-arms-1', metric: 'arms_workouts', target: 1, emoji: '🔏', name: text('팔 시크릿', 'Arm Secret'), rarity: 'common' },
    { id: 'hidden-shoulders-1', metric: 'shoulders_workouts', target: 1, emoji: '🔓', name: text('어깨 시크릿', 'Shoulder Secret'), rarity: 'common' },
    { id: 'hidden-legs-1', metric: 'legs_workouts', target: 1, emoji: '🫢', name: text('하체 시크릿', 'Leg Secret'), rarity: 'common' },
    { id: 'hidden-workouts-2', metric: 'workout_count', target: 2, emoji: '2️⃣', name: text('두 번째 발자국', 'Second Step'), rarity: 'common' },
    { id: 'hidden-workouts-25', metric: 'workout_count', target: 25, emoji: '📦', name: text('25 박스', 'Box of 25'), rarity: 'uncommon' },
    { id: 'hidden-workouts-250', metric: 'workout_count', target: 250, emoji: '🎖️', name: text('250 훈장', 'Medal 250'), rarity: 'epic' },
    { id: 'hidden-pr-3', metric: 'pr_count', target: 3, emoji: '🎯', name: text('PR 트리플', 'PR Triple'), rarity: 'common' },
    { id: 'hidden-pr-33', metric: 'pr_count', target: 33, emoji: '🎼', name: text('PR 33', 'PR 33'), rarity: 'rare' },
    { id: 'hidden-session-21', metric: 'session_days', target: 21, emoji: '🧘', name: text('21일 명상', '21-Day Zen'), rarity: 'uncommon' },
    { id: 'hidden-session-88', metric: 'session_days', target: 88, emoji: '🎹', name: text('88건반', '88 Keys'), rarity: 'rare' },
    { id: 'hidden-ton-888', metric: 'total_volume_kg', target: 888_000, emoji: '🎱', name: text('888톤', '888 Tons'), rarity: 'legendary' },
    { id: 'hidden-machines-15', metric: 'unique_machines', target: 15, emoji: '🎒', name: text('머신 백팩', 'Machine Backpack'), rarity: 'uncommon' },
    { id: 'hidden-balance-70', metric: 'balance_score', target: 70, emoji: '🪞', name: text('거울 균형', 'Mirror Balance'), rarity: 'rare' },
    { id: 'hidden-leg-30', metric: 'leg_day_workouts', target: 30, emoji: '🪵', name: text('레그 30', 'Leg 30'), rarity: 'rare' },
    { id: 'hidden-bench-30', metric: 'bench_workouts', target: 30, emoji: '🛏️', name: text('벤치 30', 'Bench 30'), rarity: 'rare' },
    { id: 'hidden-squat-30', metric: 'squat_workouts', target: 30, emoji: '🪨', name: text('스쿼트 30', 'Squat 30'), rarity: 'rare' },
    { id: 'hidden-dawn-3', metric: 'dawn_workouts', target: 3, emoji: '🕊️', name: text('새벽 삼세번', 'Dawn x3'), rarity: 'uncommon' },
    { id: 'hidden-night-30', metric: 'night_workouts', target: 30, emoji: '🦇', name: text('밤의 박쥐', 'Night Bat'), rarity: 'rare' },
    { id: 'hidden-holiday-3', metric: 'holiday_workouts', target: 3, emoji: '🎀', name: text('홀리데이 3', 'Holiday 3'), rarity: 'rare' },
    { id: 'hidden-christmas-3', metric: 'christmas_workouts', target: 3, emoji: '🛷', name: text('루돌프 3회', 'Rudolph x3'), rarity: 'legendary' },
    { id: 'hidden-new-year-3', metric: 'new_year_workouts', target: 3, emoji: '🍾', name: text('새해 3배', 'New Year x3'), rarity: 'legendary' },
    { id: 'hidden-halloween-3', metric: 'halloween_workouts', target: 3, emoji: '👻', name: text('유령 3회', 'Ghost x3'), rarity: 'legendary' },
    { id: 'hidden-summer-10', metric: 'summer_2026_workouts', target: 10, emoji: '🕶️', name: text('여름 10', 'Summer 10'), rarity: 'rare' },
    { id: 'hidden-winter-10', metric: 'winter_2026_workouts', target: 10, emoji: '🧤', name: text('겨울 10', 'Winter 10'), rarity: 'rare' },
    { id: 'hidden-volume-10kt', metric: 'total_volume_kg', target: 10_000_000, emoji: '🌋', name: text('비밀 만 톤', 'Secret 10Kt'), rarity: 'mythic' },
    { id: 'hidden-streak-365', metric: 'longest_streak', target: 365, emoji: '💍', name: text('1년 결혼', 'Year Marriage'), rarity: 'mythic' },
    { id: 'hidden-current-100', metric: 'current_streak', target: 100, emoji: '⚡', name: text('현재 100연', 'Live 100 Streak'), rarity: 'mythic' },
    { id: 'hidden-gyms-15', metric: 'unique_gyms', target: 15, emoji: '🌏', name: text('짐 대륙', 'Gym Continent'), rarity: 'mythic' },
    { id: 'hidden-workouts-5000', metric: 'workout_count', target: 5000, emoji: '🏛️', name: text('오천 신전', 'Temple of 5000'), rarity: 'mythic' },
    { id: 'hidden-pr-250', metric: 'pr_count', target: 250, emoji: '🧨', name: text('PR 폭죽', 'PR Firecracker'), rarity: 'legendary' },
    { id: 'hidden-machines-75', metric: 'unique_machines', target: 75, emoji: '🧬', name: text('머신 DNA 75', 'Machine DNA 75'), rarity: 'legendary' },
    { id: 'hidden-core-30', metric: 'core_workouts', target: 30, emoji: '🧿', name: text('코어 30', 'Core 30'), rarity: 'rare' },
    { id: 'hidden-arms-30', metric: 'arms_workouts', target: 30, emoji: '🪝', name: text('팔 30', 'Arm 30'), rarity: 'rare' },
    { id: 'hidden-shoulders-30', metric: 'shoulders_workouts', target: 30, emoji: '🗻', name: text('어깨 30', 'Shoulder 30'), rarity: 'rare' },
    { id: 'hidden-chest-30', metric: 'chest_workouts', target: 30, emoji: '🛡️', name: text('가슴 30', 'Chest 30'), rarity: 'rare' },
    { id: 'hidden-back-30', metric: 'back_workouts', target: 30, emoji: '🛡️', name: text('등 30', 'Back 30'), rarity: 'rare' },
    { id: 'hidden-legs-30', metric: 'legs_workouts', target: 30, emoji: '🛡️', name: text('하체 30', 'Legs 30'), rarity: 'rare' },
  ];

  return hiddenTargets.map((h, i) =>
    def({
      id: h.id,
      category: 'hidden',
      rarity: h.rarity,
      emoji: h.emoji,
      name: h.name,
      description: text('숨겨진 조건을 달성했습니다!', 'You uncovered a secret condition!'),
      condition: { metric: h.metric, op: 'gte', target: h.target },
      xp: xpForRarity(h.rarity, i + 1),
      title: h.name,
      secret: true,
      sortOrder: i,
    })
  );
}

function buildCatalog(): AchievementDef[] {
  const all = [
    ...buildVolumeAchievements(),
    ...buildRealityAchievements(),
    ...buildWorkoutCountAchievements(),
    ...buildAttendanceAchievements(),
    ...buildConsistencyAchievements(),
    ...buildPrAchievements(),
    ...buildMachineAchievements(),
    ...buildMuscleAchievements(),
    ...buildTimeOfDayAchievements(),
    ...buildGymAchievements(),
    ...buildRegionAiChallengeEvent(),
    ...buildSeasonAchievements(),
    ...buildHiddenAchievements(),
  ];

  const seen = new Set<string>();
  return all.filter((a) => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });
}

/** Full achievement catalog (rule definitions). Operators can extend this list without schema changes. */
export const ACHIEVEMENT_CATALOG: AchievementDef[] = buildCatalog();

export const ACHIEVEMENT_BY_ID: Record<string, AchievementDef> = Object.fromEntries(
  ACHIEVEMENT_CATALOG.map((a) => [a.id, a])
);

export function getAchievementCatalogCount(): number {
  return ACHIEVEMENT_CATALOG.length;
}
