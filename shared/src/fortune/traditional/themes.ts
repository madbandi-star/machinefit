import {
  CORE_THEMES,
  type CoreTheme,
  type Element,
  type LayerMood,
  type YinYang,
} from './constants.js';
import type { FortuneCycles } from './cycles.js';
import type { TraditionalRelations } from './relations.js';

const MOOD_TO_THEME: Record<LayerMood, CoreTheme> = {
  expand: 'GROWTH_EXPAND',
  grow: 'GROWTH_EXPAND',
  focus: 'FOCUS_BREAKTHROUGH',
  challenge: 'FOCUS_BREAKTHROUGH',
  recover: 'RECOVERY_RESET',
  organize: 'ORGANIZE_TRANSITION',
  steady: 'ACCUMULATE_STEADY',
  change: 'CHANGE_STIMULUS',
  execute: 'EXECUTE_PUSH',
  balance: 'STABILITY_BALANCE',
};

const WEIGHTS = {
  iljin: 5,
  wolun: 3,
  seun: 2,
  daeun: 2,
  base: 2,
  shijin: 1,
  shipshin: 2,
  unseong: 1,
  useful: 2,
  yinYang: 1,
};

function addScore(
  scores: Record<CoreTheme, number>,
  theme: CoreTheme,
  w: number
): void {
  scores[theme] += w;
}

function emptyScores(): Record<CoreTheme, number> {
  const scores = {} as Record<CoreTheme, number>;
  for (const t of CORE_THEMES) scores[t] = 0;
  return scores;
}

function usefulHarmony(
  todayEl: Element,
  yong: Element,
  hui: Element,
  ki: Element
): CoreTheme {
  if (todayEl === yong || todayEl === hui) return 'GROWTH_EXPAND';
  if (todayEl === ki) return 'STABILITY_BALANCE';
  return 'ACCUMULATE_STEADY';
}

/**
 * Synthesize exactly one CoreTheme from hierarchical layers + relations.
 * Deterministic: highest score wins; ties broken by CORE_THEMES order.
 */
export function synthesizeCoreTheme(input: {
  cycles: FortuneCycles;
  relations: TraditionalRelations;
  yinYang: YinYang;
}): CoreTheme {
  const scores = emptyScores();
  const { cycles, relations, yinYang } = input;

  addScore(scores, MOOD_TO_THEME[cycles.iljin.mood], WEIGHTS.iljin);
  addScore(scores, MOOD_TO_THEME[cycles.wolun.mood], WEIGHTS.wolun);
  addScore(scores, MOOD_TO_THEME[cycles.seun.mood], WEIGHTS.seun);
  addScore(scores, MOOD_TO_THEME[cycles.daeun.mood], WEIGHTS.daeun);
  addScore(scores, MOOD_TO_THEME[cycles.base.mood], WEIGHTS.base);
  if (cycles.shijin) {
    addScore(scores, MOOD_TO_THEME[cycles.shijin.mood], WEIGHTS.shijin);
  }

  // 십신 / 운성 already baked into iljin mood; reinforce useful gods
  addScore(
    scores,
    usefulHarmony(
      relations.todayElement,
      relations.useful.yongshin,
      relations.useful.huishin,
      relations.useful.kishin
    ),
    WEIGHTS.useful
  );

  if (yinYang === 'yang') {
    addScore(scores, 'EXECUTE_PUSH', WEIGHTS.yinYang);
  } else {
    addScore(scores, 'RECOVERY_RESET', WEIGHTS.yinYang * 0.8);
    addScore(scores, 'FOCUS_BREAKTHROUGH', WEIGHTS.yinYang * 0.5);
  }

  if (relations.shinsalToday.includes('yeokma')) {
    addScore(scores, 'CHANGE_STIMULUS', 2);
  }
  if (relations.shinsalToday.includes('hwagae')) {
    addScore(scores, 'FOCUS_BREAKTHROUGH', 1.5);
  }

  let best: CoreTheme = 'STABILITY_BALANCE';
  let bestScore = -1;
  for (const t of CORE_THEMES) {
    if (scores[t] > bestScore) {
      bestScore = scores[t];
      best = t;
    }
  }
  return best;
}
