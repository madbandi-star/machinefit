/**
 * Entertainment-structured traditional fortune constants.
 * Not a professional 사주 solver — solar approximations for narrative consistency.
 */

export const FORTUNE_ENGINE_VERSION = 'v3';

export const STEMS = [
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
export type Stem = (typeof STEMS)[number];

export const BRANCHES = [
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
export type Branch = (typeof BRANCHES)[number];

export const ELEMENTS = ['wood', 'fire', 'earth', 'metal', 'water'] as const;
export type Element = (typeof ELEMENTS)[number];

export type YinYang = 'yang' | 'yin';

export const STEM_META: Record<
  Stem,
  { element: Element; yinYang: YinYang; han: string }
> = {
  jia: { element: 'wood', yinYang: 'yang', han: '甲' },
  yi: { element: 'wood', yinYang: 'yin', han: '乙' },
  bing: { element: 'fire', yinYang: 'yang', han: '丙' },
  ding: { element: 'fire', yinYang: 'yin', han: '丁' },
  wu: { element: 'earth', yinYang: 'yang', han: '戊' },
  ji: { element: 'earth', yinYang: 'yin', han: '己' },
  geng: { element: 'metal', yinYang: 'yang', han: '庚' },
  xin: { element: 'metal', yinYang: 'yin', han: '辛' },
  ren: { element: 'water', yinYang: 'yang', han: '壬' },
  gui: { element: 'water', yinYang: 'yin', han: '癸' },
};

export const BRANCH_META: Record<
  Branch,
  { element: Element; yinYang: YinYang; han: string }
> = {
  zi: { element: 'water', yinYang: 'yang', han: '子' },
  chou: { element: 'earth', yinYang: 'yin', han: '丑' },
  yin: { element: 'wood', yinYang: 'yang', han: '寅' },
  mao: { element: 'wood', yinYang: 'yin', han: '卯' },
  chen: { element: 'earth', yinYang: 'yang', han: '辰' },
  si: { element: 'fire', yinYang: 'yin', han: '巳' },
  wu: { element: 'fire', yinYang: 'yang', han: '午' },
  wei: { element: 'earth', yinYang: 'yin', han: '未' },
  shen: { element: 'metal', yinYang: 'yang', han: '申' },
  you: { element: 'metal', yinYang: 'yin', han: '酉' },
  xu: { element: 'earth', yinYang: 'yang', han: '戌' },
  hai: { element: 'water', yinYang: 'yin', han: '亥' },
};

export const SHIPSHIN = [
  'bijian',
  'geopjae',
  'siksin',
  'sanggwan',
  'pyeonjae',
  'jeongjae',
  'pyeongwan',
  'jeonggwan',
  'pyeonin',
  'jeongin',
] as const;
export type Shipshin = (typeof SHIPSHIN)[number];

export const UNSEONG = [
  'jangsaeng',
  'mokyok',
  'gwandae',
  'geonrok',
  'jewang',
  'soe',
  'byeong',
  'sa',
  'myo',
  'jeol',
  'tae',
  'yang',
] as const;
export type Unseong = (typeof UNSEONG)[number];

export const SHINSAL = ['dohwa', 'yeokma', 'hwagae'] as const;
export type Shinsal = (typeof SHINSAL)[number];

/** Single daily core theme shown to the user. */
export const CORE_THEMES = [
  'GROWTH_EXPAND',
  'FOCUS_BREAKTHROUGH',
  'RECOVERY_RESET',
  'CHANGE_STIMULUS',
  'STABILITY_BALANCE',
  'ACCUMULATE_STEADY',
  'EXECUTE_PUSH',
  'ORGANIZE_TRANSITION',
] as const;
export type CoreTheme = (typeof CORE_THEMES)[number];

/** Layer-level mood before synthesis. */
export const LAYER_MOODS = [
  'expand',
  'grow',
  'focus',
  'challenge',
  'recover',
  'organize',
  'steady',
  'change',
  'execute',
  'balance',
] as const;
export type LayerMood = (typeof LAYER_MOODS)[number];

export const ELEMENT_GENERATES: Record<Element, Element> = {
  wood: 'fire',
  fire: 'earth',
  earth: 'metal',
  metal: 'water',
  water: 'wood',
};

export const ELEMENT_CONTROLS: Record<Element, Element> = {
  wood: 'earth',
  fire: 'metal',
  earth: 'water',
  metal: 'wood',
  water: 'fire',
};

export const FORTUNE_DISCLAIMER_KO =
  '오늘의 헬창운세는 전통 운세 요소를 운동 콘텐츠에 맞게 재해석한 엔터테인먼트 콘텐츠입니다. 과학적으로 검증된 예측이나 의료적 진단이 아닙니다.';
