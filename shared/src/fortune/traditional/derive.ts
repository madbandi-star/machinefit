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
      conditions: ['NORMAL', 'HIGH'],
      avoids: ['SKIP_WARMUP', 'RANDOM_ROUTINE'],
      pre: ['PREP_SETS', 'MOBILITY'],
      post: ['STRETCH', 'WALK'],
      bodyParts: ALL_BODY,
      headlines: [],
      oneLiners: [],
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
      conditions: ['HIGH', 'NORMAL'],
      avoids: ['HEAVY_EGO', 'SKIP_WARMUP'],
      pre: ['PREP_SETS', 'MOBILITY'],
      post: ['STRETCH'],
      bodyParts: ALL_BODY.filter((b) => b !== 'FULL_BODY').concat('FULL_BODY'),
      headlines: [],
      oneLiners: [],
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
      avoids: ['HEAVY_EGO', 'DROP_SET_SPAM', 'MAX_ATTEMPT'],
      pre: ['MOBILITY', 'PREP_SETS'],
      post: ['STRETCH', 'WALK', 'SLEEP'],
      bodyParts: ['FULL_BODY', 'CORE', 'LEGS', 'BACK'],
      headlines: [],
      oneLiners: [],
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
      conditions: ['NORMAL', 'HIGH'],
      avoids: ['SAME_ROUTINE', 'HEAVY_EGO'],
      pre: ['MOBILITY', 'PREP_SETS'],
      post: ['STRETCH'],
      bodyParts: ALL_BODY,
      headlines: [],
      oneLiners: [],
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
      avoids: ['HEAVY_EGO', 'RANDOM_ROUTINE'],
      pre: ['PREP_SETS', 'MOBILITY'],
      post: ['STRETCH', 'WALK'],
      bodyParts: ALL_BODY,
      headlines: [],
      oneLiners: [],
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
      conditions: ['NORMAL', 'HIGH'],
      avoids: ['SKIP_WARMUP', 'MAX_ATTEMPT'],
      pre: ['PREP_SETS'],
      post: ['STRETCH'],
      bodyParts: ALL_BODY,
      headlines: [],
      oneLiners: [],
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
      conditions: ['HIGH', 'NORMAL'],
      avoids: ['SKIP_WARMUP', 'LONG_REST_CHAT'],
      pre: ['PREP_SETS'],
      post: ['STRETCH', 'WALK'],
      bodyParts: ALL_BODY,
      headlines: [],
      oneLiners: [],
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
      avoids: ['HEAVY_EGO', 'RANDOM_ROUTINE', 'MAX_ATTEMPT'],
      pre: ['MOBILITY', 'PREP_SETS'],
      post: ['STRETCH', 'SLEEP'],
      bodyParts: ALL_BODY,
      headlines: [],
      oneLiners: [],
    },
  },
};

export function deriveFromTheme(theme: CoreTheme): ThemeDerivation {
  return DERIVE[theme];
}

export function clampToBand(value: number, band: [number, number]): number {
  return Math.min(band[1], Math.max(band[0], Math.round(value)));
}

export function pickInBand(
  rng: () => number,
  band: [number, number]
): number {
  const [lo, hi] = band;
  if (hi <= lo) return lo;
  return lo + Math.floor(rng() * (hi - lo + 1));
}
