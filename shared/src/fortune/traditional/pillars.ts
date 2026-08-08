/**
 * Solar-calendar pillar approximation for entertainment fortune.
 * Year flips near 입춘 (Feb 4). Month uses solar-term-ish fixed days.
 * Day uses Julian-day sexagenary offset. Hour uses 2h 시진.
 */

import {
  BRANCHES,
  BRANCH_META,
  STEMS,
  STEM_META,
  type Branch,
  type Element,
  type Stem,
  type YinYang,
} from './constants.js';

export interface Pillar {
  stem: Stem;
  branch: Branch;
}

export interface FourPillars {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar | null;
}

export interface ElementBalance {
  wood: number;
  fire: number;
  earth: number;
  metal: number;
  water: number;
}

function parseDateKey(dateKey: string): { y: number; m: number; d: number } {
  const [y, m, d] = dateKey.split('-').map(Number);
  return { y, m, d };
}

/** Gregorian → Julian Day Number (integer noon-based). */
export function julianDay(y: number, m: number, d: number): number {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return (
    d +
    Math.floor((153 * mm + 2) / 5) +
    365 * yy +
    Math.floor(yy / 4) -
    Math.floor(yy / 100) +
    Math.floor(yy / 400) -
    32045
  );
}

function stemAt(index: number): Stem {
  return STEMS[((index % 10) + 10) % 10];
}

function branchAt(index: number): Branch {
  return BRANCHES[((index % 12) + 12) % 12];
}

/**
 * Entertainment year: before Feb 4 → previous year for 세운/연주.
 */
export function fortuneYear(y: number, m: number, d: number): number {
  if (m < 2 || (m === 2 && d < 4)) return y - 1;
  return y;
}

/** Month branch index: 寅=2 after 입춘 (Feb 4). Entertainment solar-term approx. */
function monthBranchIndex(_y: number, m: number, d: number): number {
  const boundaries: Array<{ m: number; d: number; idx: number }> = [
    { m: 2, d: 4, idx: 2 }, // 寅
    { m: 3, d: 6, idx: 3 },
    { m: 4, d: 5, idx: 4 },
    { m: 5, d: 6, idx: 5 },
    { m: 6, d: 6, idx: 6 },
    { m: 7, d: 7, idx: 7 },
    { m: 8, d: 8, idx: 8 },
    { m: 9, d: 8, idx: 9 },
    { m: 10, d: 8, idx: 10 },
    { m: 11, d: 7, idx: 11 },
    { m: 12, d: 7, idx: 0 }, // 子
  ];
  if (m === 1 || (m === 2 && d < 4)) return 1; // 丑
  let idx = 2;
  for (const b of boundaries) {
    if (m > b.m || (m === b.m && d >= b.d)) idx = b.idx;
  }
  return idx;
}

function yearPillar(fy: number): Pillar {
  // 1984 = 甲子
  const stem = stemAt(fy - 1984);
  const branch = branchAt(fy - 1984);
  return { stem, branch };
}

function monthPillar(fy: number, branchIdx: number): Pillar {
  // 월간: 연간에 따라 인월 천간 결정 (五虎遁)
  const yearStemIdx = STEMS.indexOf(yearPillar(fy).stem);
  const yinStemStarts = [2, 4, 6, 8, 0]; // 甲己→丙, 乙庚→戊, …
  const group = yearStemIdx % 5;
  const yinStem = yinStemStarts[group];
  // branchIdx 2 = 寅 → offset 0
  const offset = ((branchIdx - 2) % 12 + 12) % 12;
  return {
    stem: stemAt(yinStem + offset),
    branch: branchAt(branchIdx),
  };
}

function dayPillar(y: number, m: number, d: number): Pillar {
  // JD offset chosen for stable entertainment sexagenary (not professional 만세력).
  const jd = julianDay(y, m, d);
  const idx = ((jd + 49) % 60 + 60) % 60;
  return {
    stem: stemAt(idx % 10),
    branch: branchAt(idx % 12),
  };
}

/** Hour branch from local clock (23:00–00:59 = 子). */
export function hourBranchFromTime(hhmm: string): Branch {
  const [hStr, mStr] = hhmm.slice(0, 5).split(':');
  const h = Number(hStr);
  const mi = Number(mStr) || 0;
  const minutes = h * 60 + mi;
  // Centers: 子 around 0:00 → treat 23:00–00:59 as zi
  if (minutes >= 23 * 60 || minutes < 60) return 'zi';
  const slots: Branch[] = [
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
  ];
  // 01:00–02:59 丑 … each 2h
  const idx = Math.floor((minutes - 60) / 120);
  return slots[Math.min(slots.length - 1, Math.max(0, idx))];
}

function hourPillar(day: Pillar, hhmm: string): Pillar {
  const branch = hourBranchFromTime(hhmm);
  const branchIdx = BRANCHES.indexOf(branch);
  // 오서둔: 일간에 따른 자시 천간
  const dayStemIdx = STEMS.indexOf(day.stem);
  const ziStarts = [0, 2, 4, 6, 8]; // 甲己→甲, 乙庚→丙, …
  const group = dayStemIdx % 5;
  const ziStem = ziStarts[group];
  return {
    stem: stemAt(ziStem + branchIdx),
    branch,
  };
}

export function buildFourPillars(input: {
  birthDate: string;
  birthTime?: string | null;
  birthTimeUnknown?: boolean;
}): FourPillars {
  const { y, m, d } = parseDateKey(input.birthDate);
  const fy = fortuneYear(y, m, d);
  const year = yearPillar(fy);
  const month = monthPillar(fy, monthBranchIndex(y, m, d));
  const day = dayPillar(y, m, d);
  const unknown = Boolean(input.birthTimeUnknown) || !input.birthTime?.trim();
  const hour = unknown ? null : hourPillar(day, input.birthTime!.trim());
  return { year, month, day, hour };
}

export function buildTodayPillars(dateKey: string): {
  year: Pillar;
  month: Pillar;
  day: Pillar;
} {
  const { y, m, d } = parseDateKey(dateKey);
  const fy = fortuneYear(y, m, d);
  return {
    year: yearPillar(fy),
    month: monthPillar(fy, monthBranchIndex(y, m, d)),
    day: dayPillar(y, m, d),
  };
}

export function countElements(pillars: FourPillars): ElementBalance {
  const bal: ElementBalance = {
    wood: 0,
    fire: 0,
    earth: 0,
    metal: 0,
    water: 0,
  };
  const add = (stem: Stem, branch: Branch) => {
    bal[STEM_META[stem].element] += 1.2;
    bal[BRANCH_META[branch].element] += 1;
  };
  add(pillars.year.stem, pillars.year.branch);
  add(pillars.month.stem, pillars.month.branch);
  add(pillars.day.stem, pillars.day.branch);
  if (pillars.hour) add(pillars.hour.stem, pillars.hour.branch);
  return bal;
}

export function dayMasterYinYang(pillars: FourPillars): YinYang {
  return STEM_META[pillars.day.stem].yinYang;
}

export function dayMasterElement(pillars: FourPillars): Element {
  return STEM_META[pillars.day.stem].element;
}

export function dominantYinYang(pillars: FourPillars, today: Pillar): YinYang {
  let yang = 0;
  let yin = 0;
  const tally = (stem: Stem, branch: Branch) => {
    if (STEM_META[stem].yinYang === 'yang') yang += 1;
    else yin += 1;
    if (BRANCH_META[branch].yinYang === 'yang') yang += 0.8;
    else yin += 0.8;
  };
  tally(pillars.day.stem, pillars.day.branch);
  tally(today.stem, today.branch);
  if (pillars.hour) tally(pillars.hour.stem, pillars.hour.branch);
  return yang >= yin ? 'yang' : 'yin';
}
