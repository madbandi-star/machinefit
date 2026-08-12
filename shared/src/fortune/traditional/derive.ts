import type { CoreTheme } from './constants.js';

export interface ThemeScoreBands {
  healthman: [number, number];
  prLuck: [number, number];
  recoveryLuck: [number, number];
  volumeLuck: [number, number];
  focusLuck: [number, number];
  changeLuck: [number, number];
  stars: [number, number];
}

/**
 * Catalog allow-lists must use codes that exist in
 * `fortune_content_items` seed / fallback catalog.
 * Empty lists are not allowed for narrative categories — they caused
 * theme-blind fallback to the full catalog.
 */
export interface ThemeCatalogAllow {
  keywords: string[];
  strategies: string[];
  styles: string[];
  conditions: string[];
  avoids: string[];
  pre: string[];
  post: string[];
  bodyParts: string[];
  headlines: string[];
  oneLiners: string[];
}

export interface ThemeDerivation {
  bands: ThemeScoreBands;
  allow: ThemeCatalogAllow;
}

const ALL_STYLES = ['BARBELL', 'DUMBBELL', 'MACHINE', 'CABLE', 'FREE_WEIGHT', 'BODYWEIGHT'];
const ALL_BODY = [
  'CHEST',
  'BACK',
  'SHOULDERS',
  'LEGS',
  'BICEPS',
  'TRICEPS',
  'CORE',
  'FULL_BODY',
];

/**
 * One coherent pack per core theme:
 * 총운(headline) → 키워드 → 전략/컨디션 → 추천 → 주의 → 한마디
 * Codes match migration 105 / fallback catalog only.
 */
const DERIVE: Record<CoreTheme, ThemeDerivation> = {
  GROWTH_EXPAND: {
    bands: {
      healthman: [68, 92],
      prLuck: [55, 82],
      recoveryLuck: [40, 70],
      volumeLuck: [60, 88],
      focusLuck: [50, 78],
      changeLuck: [55, 85],
      stars: [3, 5],
    },
    allow: {
      keywords: ['VOLUME_DAY', 'DUMBBELL_DAY', 'FREE_WEIGHT_DAY', 'CONTROL_DAY'],
      strategies: ['VOLUME_UP', 'PYRAMID', 'SUPER_SET'],
      styles: ALL_STYLES,
      conditions: ['NORMAL', 'AGGRESSIVE'],
      avoids: ['NO_WARMUP_HEAVY', 'SAME_MUSCLE_VOLUME'],
      pre: ['PREP_SETS', 'MOBILITY', 'DYNAMIC_WARMUP'],
      post: ['STRETCH', 'LIGHT_CARDIO', 'HYDRATION'],
      bodyParts: ALL_BODY,
      headlines: ['VOLUME_BUILD', 'FREE_WEIGHT', 'DUMBBELL_COMPAT'],
      oneLiners: ['ONE_MORE_SET', 'CHANGE_STIMULUS'],
    },
  },
  FOCUS_BREAKTHROUGH: {
    bands: {
      healthman: [70, 95],
      prLuck: [70, 95],
      recoveryLuck: [30, 55],
      volumeLuck: [45, 70],
      focusLuck: [75, 95],
      changeLuck: [35, 60],
      stars: [4, 5],
    },
    allow: {
      keywords: ['PR_DAY', 'CONTROL_DAY', 'DROP_SET_DAY'],
      strategies: ['PR_CHALLENGE', 'HIGH_WEIGHT_LOW_REP', 'SLOW_CONTROL'],
      styles: ['BARBELL', 'DUMBBELL', 'FREE_WEIGHT'],
      conditions: ['AGGRESSIVE', 'NORMAL'],
      avoids: ['HEAVY_EGO', 'NO_WARMUP_HEAVY'],
      pre: ['PREP_SETS', 'MOBILITY', 'GRADUAL'],
      post: ['STRETCH', 'COOLDOWN'],
      bodyParts: ALL_BODY,
      headlines: ['CONTROL_FOCUS', 'PR_PUSH'],
      oneLiners: ['CONTROL_FIRST', 'PREP_WINS'],
    },
  },
  RECOVERY_RESET: {
    bands: {
      healthman: [45, 72],
      prLuck: [15, 45],
      recoveryLuck: [70, 95],
      volumeLuck: [20, 45],
      focusLuck: [40, 70],
      changeLuck: [25, 50],
      stars: [2, 3],
    },
    allow: {
      keywords: ['RECOVERY_DAY', 'CARDIO_DAY', 'CONTROL_DAY'],
      strategies: ['WEIGHT_HOLD', 'SLOW_CONTROL'],
      styles: ['MACHINE', 'CABLE', 'BODYWEIGHT'],
      conditions: ['LIGHT', 'RECOVERY', 'REST', 'NORMAL'],
      avoids: ['HEAVY_EGO', 'PR_WHEN_FATIGUED', 'SKIP_REST'],
      pre: ['MOBILITY', 'WARMUP_LIGHT', 'GRADUAL'],
      post: ['STRETCH', 'RECOVERY_FOCUS', 'HYDRATION'],
      bodyParts: ['FULL_BODY', 'CORE', 'LEGS', 'BACK'],
      headlines: ['RECOVERY_LISTEN', 'LIGHT_START'],
      oneLiners: ['LISTEN_BODY'],
    },
  },
  CHANGE_STIMULUS: {
    bands: {
      healthman: [62, 88],
      prLuck: [45, 75],
      recoveryLuck: [40, 68],
      volumeLuck: [50, 80],
      focusLuck: [45, 72],
      changeLuck: [75, 95],
      stars: [3, 5],
    },
    allow: {
      keywords: ['DUMBBELL_DAY', 'SUPER_SET_DAY', 'FREE_WEIGHT_DAY', 'DROP_SET_DAY'],
      strategies: ['SUPER_SET', 'DROP_SET', 'VOLUME_UP'],
      styles: ['DUMBBELL', 'FREE_WEIGHT', 'CABLE', 'BARBELL'],
      conditions: ['NORMAL', 'AGGRESSIVE'],
      avoids: ['SAME_MUSCLE_VOLUME', 'HEAVY_EGO'],
      pre: ['MOBILITY', 'PREP_SETS', 'DYNAMIC_WARMUP'],
      post: ['STRETCH', 'LIGHT_CARDIO'],
      bodyParts: ALL_BODY,
      headlines: ['FREE_WEIGHT', 'DUMBBELL_COMPAT', 'VOLUME_BUILD'],
      oneLiners: ['CHANGE_STIMULUS', 'ONE_MORE_SET'],
    },
  },
  STABILITY_BALANCE: {
    bands: {
      healthman: [58, 82],
      prLuck: [40, 68],
      recoveryLuck: [50, 78],
      volumeLuck: [45, 72],
      focusLuck: [55, 80],
      changeLuck: [30, 55],
      stars: [3, 4],
    },
    allow: {
      keywords: ['CONTROL_DAY', 'VOLUME_DAY', 'RECOVERY_DAY'],
      strategies: ['WEIGHT_HOLD', 'SLOW_CONTROL', 'PYRAMID'],
      styles: ALL_STYLES,
      conditions: ['NORMAL', 'LIGHT'],
      avoids: ['HEAVY_EGO', 'SAME_MUSCLE_VOLUME'],
      pre: ['PREP_SETS', 'MOBILITY', 'WARMUP_LIGHT'],
      post: ['STRETCH', 'COOLDOWN', 'HYDRATION'],
      bodyParts: ALL_BODY,
      headlines: ['MACHINE_STEADY', 'CONTROL_FOCUS', 'LIGHT_START'],
      oneLiners: ['CONTROL_FIRST', 'LISTEN_BODY'],
    },
  },
  ACCUMULATE_STEADY: {
    bands: {
      healthman: [60, 85],
      prLuck: [45, 72],
      recoveryLuck: [45, 72],
      volumeLuck: [65, 90],
      focusLuck: [55, 80],
      changeLuck: [30, 55],
      stars: [3, 4],
    },
    allow: {
      keywords: ['VOLUME_DAY', 'CONTROL_DAY', 'LEG_DAY', 'BACK_DAY', 'CHEST_DAY'],
      strategies: ['VOLUME_UP', 'PYRAMID', 'WEIGHT_HOLD'],
      styles: ALL_STYLES,
      conditions: ['NORMAL', 'AGGRESSIVE'],
      avoids: ['NO_WARMUP_HEAVY', 'PR_WHEN_FATIGUED'],
      pre: ['PREP_SETS', 'GRADUAL', 'DYNAMIC_WARMUP'],
      post: ['STRETCH', 'HYDRATION'],
      bodyParts: ALL_BODY,
      headlines: ['VOLUME_BUILD', 'MACHINE_STEADY', 'CONTROL_FOCUS'],
      oneLiners: ['ONE_MORE_SET', 'PREP_WINS'],
    },
  },
  EXECUTE_PUSH: {
    bands: {
      healthman: [72, 96],
      prLuck: [65, 92],
      recoveryLuck: [25, 50],
      volumeLuck: [55, 85],
      focusLuck: [60, 88],
      changeLuck: [40, 70],
      stars: [4, 5],
    },
    allow: {
      keywords: ['PR_DAY', 'VOLUME_DAY', 'DROP_SET_DAY', 'SUPER_SET_DAY'],
      strategies: ['PR_CHALLENGE', 'HIGH_WEIGHT_LOW_REP', 'DROP_SET', 'VOLUME_UP'],
      styles: ['BARBELL', 'DUMBBELL', 'FREE_WEIGHT'],
      conditions: ['AGGRESSIVE', 'NORMAL'],
      avoids: ['NO_WARMUP_HEAVY', 'SKIP_REST'],
      pre: ['PREP_SETS', 'DYNAMIC_WARMUP', 'GRADUAL'],
      post: ['STRETCH', 'LIGHT_CARDIO', 'HYDRATION'],
      bodyParts: ALL_BODY,
      headlines: ['PR_PUSH', 'VOLUME_BUILD', 'FREE_WEIGHT'],
      oneLiners: ['PREP_WINS', 'ONE_MORE_SET'],
    },
  },
  ORGANIZE_TRANSITION: {
    bands: {
      healthman: [55, 80],
      prLuck: [35, 60],
      recoveryLuck: [55, 85],
      volumeLuck: [40, 65],
      focusLuck: [60, 85],
      changeLuck: [45, 75],
      stars: [2, 4],
    },
    allow: {
      keywords: ['CONTROL_DAY', 'RECOVERY_DAY', 'CARDIO_DAY'],
      strategies: ['WEIGHT_HOLD', 'SLOW_CONTROL'],
      styles: ['MACHINE', 'CABLE', 'DUMBBELL', 'BODYWEIGHT'],
      conditions: ['NORMAL', 'LIGHT', 'RECOVERY'],
      avoids: ['HEAVY_EGO', 'PR_WHEN_FATIGUED', 'SAME_MUSCLE_VOLUME'],
      pre: ['MOBILITY', 'PREP_SETS', 'WARMUP_LIGHT'],
      post: ['STRETCH', 'RECOVERY_FOCUS', 'COOLDOWN'],
      bodyParts: ALL_BODY,
      headlines: ['LIGHT_START', 'CONTROL_FOCUS', 'MACHINE_STEADY', 'RECOVERY_LISTEN'],
      oneLiners: ['LISTEN_BODY', 'CONTROL_FIRST'],
    },
  },
};

export function deriveFromTheme(theme: CoreTheme): ThemeDerivation {
  return DERIVE[theme];
}

export function clampToBand(value: number, band: [number, number]): number {
  return Math.min(band[1], Math.max(band[0], Math.round(value)));
}

export function pickInBand(rng: () => number, band: [number, number]): number {
  const [lo, hi] = band;
  if (hi <= lo) return lo;
  return lo + Math.floor(rng() * (hi - lo + 1));
}

/** True when every narrative code sits inside the theme allow-list. */
export function isThemePackConsistent(
  theme: CoreTheme,
  pack: {
    keywordCode: string;
    strategyCode: string;
    conditionCode: string;
    avoidCode: string;
    styleCode: string;
    bodyPartCode: string;
    preCode: string;
    postCode: string;
    headlineCode: string;
    oneLinerCode: string;
  }
): boolean {
  const { allow } = deriveFromTheme(theme);
  return (
    allow.keywords.includes(pack.keywordCode) &&
    allow.strategies.includes(pack.strategyCode) &&
    allow.conditions.includes(pack.conditionCode) &&
    allow.avoids.includes(pack.avoidCode) &&
    allow.styles.includes(pack.styleCode) &&
    allow.bodyParts.includes(pack.bodyPartCode) &&
    allow.pre.includes(pack.preCode) &&
    allow.post.includes(pack.postCode) &&
    allow.headlines.includes(pack.headlineCode) &&
    allow.oneLiners.includes(pack.oneLinerCode)
  );
}
