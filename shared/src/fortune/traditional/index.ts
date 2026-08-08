import type {
  FortuneNarrative,
  FortuneTraditionalDetail,
} from '../../types/fortune.types.js';
import {
  FORTUNE_DISCLAIMER_KO,
  FORTUNE_ENGINE_VERSION,
  type CoreTheme,
  type YinYang,
} from './constants.js';
import { buildCycles, type FortuneCycles } from './cycles.js';
import { deriveFromTheme, type ThemeDerivation } from './derive.js';
import { enforceFortuneConsistency } from './consistency.js';
import { buildNarrative, buildTraditionalDetail } from './interpret.js';
import {
  buildFourPillars,
  buildTodayPillars,
  dayMasterYinYang,
  dominantYinYang,
  type FourPillars,
} from './pillars.js';
import { buildRelations, type TraditionalRelations } from './relations.js';
import { synthesizeCoreTheme } from './themes.js';

export * from './constants.js';
export * from './pillars.js';
export * from './relations.js';
export * from './cycles.js';
export * from './themes.js';
export * from './derive.js';
export * from './consistency.js';
export * from './interpret.js';

export interface TraditionalChart {
  pillars: FourPillars;
  todayPillars: ReturnType<typeof buildTodayPillars>;
  relations: TraditionalRelations;
  cycles: FortuneCycles;
  yinYang: YinYang;
  dayMasterYinYang: YinYang;
  coreTheme: CoreTheme;
  derivation: ThemeDerivation;
  narrative: FortuneNarrative;
  traditionalDetail: FortuneTraditionalDetail;
  disclaimer: string;
  engineVersion: string;
}

export function buildTraditionalChart(input: {
  birthDate: string;
  birthTime?: string | null;
  birthTimeUnknown?: boolean;
  dateKey: string;
  gender?: string | null;
}): TraditionalChart {
  const pillars = buildFourPillars({
    birthDate: input.birthDate,
    birthTime: input.birthTime,
    birthTimeUnknown: input.birthTimeUnknown,
  });
  const todayPillars = buildTodayPillars(input.dateKey);
  const relations = buildRelations(pillars, todayPillars.day);
  const yinYang = dominantYinYang(pillars, todayPillars.day);
  const cycles = buildCycles({
    pillars,
    today: todayPillars,
    birthDate: input.birthDate,
    dateKey: input.dateKey,
    relations,
    yinYang,
    gender: input.gender,
  });
  const coreTheme = synthesizeCoreTheme({ cycles, relations, yinYang });
  const derivation = deriveFromTheme(coreTheme);
  const narrative = buildNarrative({
    coreTheme,
    yinYang,
    cycles,
    relations,
  });
  const traditionalDetail = buildTraditionalDetail({ pillars, relations });

  return {
    pillars,
    todayPillars,
    relations,
    cycles,
    yinYang,
    dayMasterYinYang: dayMasterYinYang(pillars),
    coreTheme,
    derivation,
    narrative,
    traditionalDetail,
    disclaimer: FORTUNE_DISCLAIMER_KO,
    engineVersion: FORTUNE_ENGINE_VERSION,
  };
}

export { enforceFortuneConsistency, FORTUNE_ENGINE_VERSION, FORTUNE_DISCLAIMER_KO };
