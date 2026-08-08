import type {
  FortuneNarrative,
  FortuneTraditionalDetail,
} from '../../types/fortune.types.js';
import {
  BRANCH_META,
  FORTUNE_ENGINE_VERSION,
  STEM_META,
  type CoreTheme,
  type YinYang,
} from './constants.js';
import type { FortuneCycles } from './cycles.js';
import type { FourPillars } from './pillars.js';
import type { TraditionalRelations } from './relations.js';

export function buildNarrative(input: {
  coreTheme: CoreTheme;
  yinYang: YinYang;
  cycles: FortuneCycles;
  relations: TraditionalRelations;
}): FortuneNarrative {
  const { coreTheme, yinYang, cycles, relations } = input;
  const layers: FortuneNarrative['layers'] = [
    {
      key: 'base',
      titleKey: 'layer.base',
      moodKey: `mood.${cycles.base.mood}`,
      element: cycles.base.element,
    },
    {
      key: 'daeun',
      titleKey: 'layer.daeun',
      moodKey: `mood.${cycles.daeun.mood}`,
      element: cycles.daeun.element,
    },
    {
      key: 'seun',
      titleKey: 'layer.seun',
      moodKey: `mood.${cycles.seun.mood}`,
      element: cycles.seun.element,
    },
    {
      key: 'wolun',
      titleKey: 'layer.wolun',
      moodKey: `mood.${cycles.wolun.mood}`,
      element: cycles.wolun.element,
    },
    {
      key: 'today',
      titleKey: 'layer.today',
      moodKey: `mood.${cycles.iljin.mood}`,
      element: cycles.iljin.element,
    },
  ];
  if (cycles.shijin) {
    layers.push({
      key: 'shijin',
      titleKey: 'layer.shijin',
      moodKey: `mood.${cycles.shijin.mood}`,
      element: cycles.shijin.element,
    });
  }

  return {
    coreTheme,
    coreThemeLabelKey: `coreTheme.${coreTheme}`,
    yinYang,
    yinYangSummaryKey: `yinYang.${yinYang}`,
    element: relations.elementRank,
    layers,
    storyLeadKey: `story.${coreTheme}.lead`,
    storyBodyKey: `story.${coreTheme}.body`,
  };
}

export function buildTraditionalDetail(input: {
  pillars: FourPillars;
  relations: TraditionalRelations;
}): FortuneTraditionalDetail {
  const { pillars, relations } = input;
  return {
    yearStem: STEM_META[pillars.year.stem].han,
    yearBranch: BRANCH_META[pillars.year.branch].han,
    monthStem: STEM_META[pillars.month.stem].han,
    monthBranch: BRANCH_META[pillars.month.branch].han,
    dayStem: STEM_META[pillars.day.stem].han,
    dayBranch: BRANCH_META[pillars.day.branch].han,
    hourStem: pillars.hour ? STEM_META[pillars.hour.stem].han : null,
    hourBranch: pillars.hour ? BRANCH_META[pillars.hour.branch].han : null,
    shipshin: relations.dayShipshinToday,
    unseong: relations.unseongToday,
    shinsal: relations.shinsalToday,
    yongshin: relations.useful.yongshin,
    huishin: relations.useful.huishin,
    kishin: relations.useful.kishin,
    shipshinHintKey: `detail.shipshin.${relations.dayShipshinToday}`,
    unseongHintKey: `detail.unseong.${relations.unseongToday}`,
    shinsalHintKeys: relations.shinsalToday.map((s) => `detail.shinsal.${s}`),
    usefulHintKey: 'detail.useful',
  };
}

export { FORTUNE_ENGINE_VERSION };
