import {
  BRANCH_META,
  STEM_META,
  type Branch,
  type Element,
  type LayerMood,
  type Stem,
  type Unseong,
  type Shipshin,
  type Shinsal,
  type YinYang,
} from './constants.js';
import type { FourPillars, Pillar } from './pillars.js';
import type { TraditionalRelations } from './relations.js';

export interface CycleLayer {
  mood: LayerMood;
  element: Element;
}

export interface FortuneCycles {
  base: CycleLayer;
  daeun: CycleLayer;
  seun: CycleLayer;
  wolun: CycleLayer;
  iljin: CycleLayer;
  shijin: CycleLayer | null;
}

const ELEMENT_MOOD: Record<Element, LayerMood> = {
  wood: 'grow',
  fire: 'execute',
  earth: 'steady',
  metal: 'focus',
  water: 'recover',
};

const SHIPSHIN_MOOD: Record<Shipshin, LayerMood> = {
  bijian: 'challenge',
  geopjae: 'challenge',
  siksin: 'steady',
  sanggwan: 'change',
  pyeonjae: 'expand',
  jeongjae: 'focus',
  pyeongwan: 'execute',
  jeonggwan: 'focus',
  pyeonin: 'change',
  jeongin: 'organize',
};

const UNSEONG_MOOD: Record<Unseong, LayerMood> = {
  jangsaeng: 'grow',
  mokyok: 'change',
  gwandae: 'expand',
  geonrok: 'execute',
  jewang: 'challenge',
  soe: 'organize',
  byeong: 'recover',
  sa: 'organize',
  myo: 'recover',
  jeol: 'organize',
  tae: 'grow',
  yang: 'steady',
};

function parseYmd(dateKey: string): { y: number; m: number; d: number } {
  const [y, m, d] = dateKey.split('-').map(Number);
  return { y, m, d };
}

function ageYears(birthDate: string, dateKey: string): number {
  const b = parseYmd(birthDate);
  const t = parseYmd(dateKey);
  let age = t.y - b.y;
  if (t.m < b.m || (t.m === b.m && t.d < b.d)) age -= 1;
  return Math.max(0, age);
}

/** Map stem/branch pair to a mood with soft gender-based 대운 direction. */
function pillarMood(stem: Stem, branch: Branch): LayerMood {
  const el = STEM_META[stem].element;
  const branchMood = ELEMENT_MOOD[BRANCH_META[branch].element];
  // Prefer stem element mood, blend branch if earth (neutral)
  if (el === 'earth') return branchMood;
  return ELEMENT_MOOD[el];
}

/**
 * 대운: decade theme from birth year pillar advancing every 10 years.
 * Gender soft-use: female → reverse branch walk entertainment rule.
 */
export function daeunLayer(
  pillars: FourPillars,
  birthDate: string,
  dateKey: string,
  gender?: string | null
): CycleLayer {
  const age = ageYears(birthDate, dateKey);
  const step = Math.floor(age / 10);
  const yearStemIdx = [
    'jia',
    'yi',
    'bing',
    'ding',
    'wu',
    'ji',
    'geng',
    'xin',
    'ren',
    'gui',
  ].indexOf(pillars.year.stem);
  const yearBranchIdx = [
    'zi',
    'chou',
    'yin',
    'mao',
    'chen',
    'si',
    'wu',
    'wei',
    'shen',
    'you',
    'xu',
    'hai',
  ].indexOf(pillars.year.branch);

  const reverse =
    gender === 'female' || gender === 'F' || gender === 'f' || gender === '여자';
  const dir = reverse ? -1 : 1;
  const stemIdx = (yearStemIdx + step * dir + 1000) % 10;
  const branchIdx = (yearBranchIdx + step * dir + 1200) % 12;
  const stems = [
    'jia',
    'yi',
    'bing',
    'ding',
    'wu',
    'ji',
    'geng',
    'xin',
    'ren',
    'gui',
  ] as const;
  const branches = [
    'zi',
    'chou',
    'yin',
    'mao',
    'chen',
    'si',
    'wu',
    'wei',
    'shen',
    'you',
    'xu',
    'hai',
  ] as const;
  const stem = stems[stemIdx];
  const branch = branches[branchIdx];
  return {
    mood: pillarMood(stem, branch),
    element: STEM_META[stem].element,
  };
}

export function buildCycles(input: {
  pillars: FourPillars;
  today: { year: Pillar; month: Pillar; day: Pillar };
  birthDate: string;
  dateKey: string;
  relations: TraditionalRelations;
  yinYang: YinYang;
  gender?: string | null;
}): FortuneCycles {
  const { pillars, today, relations } = input;
  const baseEl = STEM_META[pillars.day.stem].element;
  let baseMood = ELEMENT_MOOD[baseEl];
  if (input.yinYang === 'yin' && baseMood === 'execute') baseMood = 'focus';
  if (input.yinYang === 'yang' && baseMood === 'recover') baseMood = 'grow';

  const seun = {
    mood: pillarMood(today.year.stem, today.year.branch),
    element: STEM_META[today.year.stem].element,
  };
  const wolun = {
    mood: pillarMood(today.month.stem, today.month.branch),
    element: STEM_META[today.month.stem].element,
  };

  let iljinMood = SHIPSHIN_MOOD[relations.dayShipshinToday];
  const uMood = UNSEONG_MOOD[relations.unseongToday];
  // Blend 운성 lightly
  if (uMood === 'recover' || uMood === 'organize') iljinMood = uMood;
  else if (relations.shinsalToday.includes('yeokma')) iljinMood = 'change';
  else if (relations.shinsalToday.includes('hwagae')) iljinMood = 'focus';

  const iljin = {
    mood: iljinMood,
    element: relations.todayElement,
  };

  let shijin: CycleLayer | null = null;
  if (pillars.hour) {
    shijin = {
      mood: pillarMood(pillars.hour.stem, pillars.hour.branch),
      element: STEM_META[pillars.hour.stem].element,
    };
  }

  return {
    base: { mood: baseMood, element: baseEl },
    daeun: daeunLayer(pillars, input.birthDate, input.dateKey, input.gender),
    seun,
    wolun,
    iljin,
    shijin,
  };
}

export function shinsalBoost(shinsal: Shinsal[]): LayerMood | null {
  if (shinsal.includes('yeokma')) return 'change';
  if (shinsal.includes('hwagae')) return 'focus';
  if (shinsal.includes('dohwa')) return 'expand';
  return null;
}
