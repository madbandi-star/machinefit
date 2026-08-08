import {
  BRANCHES,
  BRANCH_META,
  ELEMENT_CONTROLS,
  ELEMENT_GENERATES,
  ELEMENTS,
  STEM_META,
  UNSEONG,
  type Branch,
  type Element,
  type Shinsal,
  type Shipshin,
  type Stem,
  type Unseong,
} from './constants.js';
import {
  countElements,
  type ElementBalance,
  type FourPillars,
  type Pillar,
} from './pillars.js';

/** 십신 of `other` stem relative to day master. */
export function shipshinOf(dayStem: Stem, other: Stem): Shipshin {
  const dm = STEM_META[dayStem];
  const ot = STEM_META[other];
  const sameYy = dm.yinYang === ot.yinYang;

  if (ot.element === dm.element) return sameYy ? 'bijian' : 'geopjae';
  if (ot.element === ELEMENT_GENERATES[dm.element]) {
    return sameYy ? 'siksin' : 'sanggwan';
  }
  if (ot.element === ELEMENT_CONTROLS[dm.element]) {
    return sameYy ? 'pyeonjae' : 'jeongjae';
  }
  if (ELEMENT_CONTROLS[ot.element] === dm.element) {
    return sameYy ? 'pyeongwan' : 'jeonggwan';
  }
  // ot generates dm
  return sameYy ? 'pyeonin' : 'jeongin';
}

/**
 * 십이운성 table by day stem group → branch order starting at 장생.
 * Entertainment-fixed sequences (classic tables simplified).
 */
const UNSEONG_START_BRANCH: Record<Stem, Branch> = {
  jia: 'hai',
  yi: 'wu',
  bing: 'yin',
  ding: 'you',
  wu: 'yin',
  ji: 'you',
  geng: 'si',
  xin: 'zi',
  ren: 'shen',
  gui: 'mao',
};

export function unseongOf(dayStem: Stem, branch: Branch): Unseong {
  const start = BRANCHES.indexOf(UNSEONG_START_BRANCH[dayStem]);
  const b = BRANCHES.indexOf(branch);
  const yang = STEM_META[dayStem].yinYang === 'yang';
  const delta = yang
    ? (b - start + 12) % 12
    : (start - b + 12) % 12;
  return UNSEONG[delta];
}

/** 삼합 groups for 신살. */
const SAMHAP: Branch[][] = [
  ['shen', 'zi', 'chen'],
  ['yin', 'wu', 'xu'],
  ['hai', 'mao', 'wei'],
  ['si', 'you', 'chou'],
];

const DOHWA: Record<string, Branch> = {
  'shen-zi-chen': 'you',
  'yin-wu-xu': 'mao',
  'hai-mao-wei': 'zi',
  'si-you-chou': 'wu',
};
const YEOKMA: Record<string, Branch> = {
  'shen-zi-chen': 'yin',
  'yin-wu-xu': 'shen',
  'hai-mao-wei': 'si',
  'si-you-chou': 'hai',
};
const HWAGAE: Record<string, Branch> = {
  'shen-zi-chen': 'chen',
  'yin-wu-xu': 'xu',
  'hai-mao-wei': 'wei',
  'si-you-chou': 'chou',
};

function samhapKey(branch: Branch): string | null {
  for (const g of SAMHAP) {
    if (g.includes(branch)) return g.join('-');
  }
  return null;
}

export function detectShinsal(dayBranch: Branch, focusBranch: Branch): Shinsal[] {
  const key = samhapKey(dayBranch);
  if (!key) return [];
  const out: Shinsal[] = [];
  if (DOHWA[key] === focusBranch) out.push('dohwa');
  if (YEOKMA[key] === focusBranch) out.push('yeokma');
  if (HWAGAE[key] === focusBranch) out.push('hwagae');
  return out;
}

export interface UsefulGods {
  yongshin: Element;
  huishin: Element;
  kishin: Element;
}

/** Weakest chart element → 용신; generator → 희신; controller → 기신. */
export function usefulGods(pillars: FourPillars): UsefulGods {
  const bal = countElements(pillars);
  let yongshin: Element = 'earth';
  let min = Infinity;
  for (const el of ELEMENTS) {
    if (bal[el] < min) {
      min = bal[el];
      yongshin = el;
    }
  }
  // Element that generates yongshin
  let huishin: Element = 'water';
  for (const el of ELEMENTS) {
    if (ELEMENT_GENERATES[el] === yongshin) huishin = el;
  }
  // Element that controls yongshin
  let kishin: Element = 'wood';
  for (const el of ELEMENTS) {
    if (ELEMENT_CONTROLS[el] === yongshin) kishin = el;
  }
  return { yongshin, huishin, kishin };
}

export function rankElements(bal: ElementBalance): {
  primary: Element;
  support: Element;
  weak: Element;
} {
  const sorted = [...ELEMENTS].sort((a, b) => bal[b] - bal[a]);
  return {
    primary: sorted[0],
    support: sorted[1],
    weak: sorted[sorted.length - 1],
  };
}

export interface TraditionalRelations {
  dayShipshinToday: Shipshin;
  unseongToday: Unseong;
  shinsalToday: Shinsal[];
  useful: UsefulGods;
  elementRank: { primary: Element; support: Element; weak: Element };
  todayElement: Element;
}

export function buildRelations(
  pillars: FourPillars,
  today: Pillar
): TraditionalRelations {
  const dayStem = pillars.day.stem;
  const bal = countElements(pillars);
  // Blend today into ranking lightly
  bal[STEM_META[today.stem].element] += 0.8;
  bal[BRANCH_META[today.branch].element] += 0.6;

  return {
    dayShipshinToday: shipshinOf(dayStem, today.stem),
    unseongToday: unseongOf(dayStem, today.branch),
    shinsalToday: detectShinsal(pillars.day.branch, today.branch),
    useful: usefulGods(pillars),
    elementRank: rankElements(bal),
    todayElement: STEM_META[today.stem].element,
  };
}
