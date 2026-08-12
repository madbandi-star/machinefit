import {
  FORTUNE_DISCLAIMER_KO,
  FORTUNE_FALLBACK_CATALOG,
  createFortuneRng,
  fortunePickOne,
  pickInBand,
  type CoreTheme,
  type FortuneContentItem,
  type FortuneDataAnalysis,
  type FortuneMode,
  type FortuneSection,
  type ThemeDerivation,
  type TraditionalChart,
} from '@machinefit/shared';

export interface FortuneEngineInput {
  seedKey: string;
  mode: FortuneMode;
  catalog: FortuneContentItem[];
  analysis: FortuneDataAnalysis;
  chart: TraditionalChart;
}

export interface FortuneEngineResult {
  fortune: FortuneSection;
  coreTheme: CoreTheme;
  keywordCode: string;
  headlineCode: string;
  strategyCode: string;
  styleCode: string;
  conditionCode: string;
  avoidCode: string;
  preCode: string;
  postCode: string;
  bodyPartCode: string;
  oneLinerCode: string;
  scoreStars: number;
  baseHealthman: number;
  basePrLuck: number;
  baseRecoveryLuck: number;
  baseVolumeLuck: number;
  baseFocusLuck: number;
  baseChangeLuck: number;
}

type CatalogItem = {
  category: string;
  code: string;
  title: string;
  body: string;
  priority: number;
  dataConditions?: Record<string, unknown> | null;
};

function byCategory(items: CatalogItem[], category: string): CatalogItem[] {
  return items
    .filter((i) => i.category === category)
    .sort((a, b) => a.priority - b.priority || a.code.localeCompare(b.code));
}

function matchesConditions(
  item: CatalogItem,
  analysis: FortuneDataAnalysis
): boolean {
  const c = item.dataConditions;
  if (!c || typeof c !== 'object') return true;
  if (typeof c.minConsecutiveDays === 'number') {
    if (analysis.consecutiveDays < c.minConsecutiveDays) return false;
  }
  if (typeof c.maxConsecutiveDays === 'number') {
    if (analysis.consecutiveDays > c.maxConsecutiveDays) return false;
  }
  if (typeof c.minWorkoutCount7d === 'number') {
    if (analysis.workoutCount7d < c.minWorkoutCount7d) return false;
  }
  if (c.requireRecovery === true && analysis.consecutiveDays < 3) return false;
  return true;
}

/**
 * Theme-first pick: never fall back to the full category catalog.
 * That theme-blind fallback was the main source of contradictory copy.
 */
function pickAllowed(
  rng: () => number,
  items: CatalogItem[],
  allowedCodes: string[],
  analysis: FortuneDataAnalysis,
  fallbackCode: string,
  fallbackTitle: string,
  category: string
): CatalogItem {
  const allowList = allowedCodes.length ? allowedCodes : [fallbackCode];
  const allowSet = new Set(allowList);
  const inAllow = items.filter((i) => allowSet.has(i.code));
  const filtered = inAllow.filter((i) => matchesConditions(i, analysis));
  const pool = filtered.length ? filtered : inAllow;
  const picked = fortunePickOne(rng, pool);
  if (picked) return picked;

  const code = allowList[0] ?? fallbackCode;
  const fromCatalog = items.find((i) => i.code === code);
  return {
    code,
    title: fromCatalog?.title ?? fallbackTitle,
    body: fromCatalog?.body ?? '',
    category,
    priority: 99,
  };
}

function syntheticFromCodes(
  category: string,
  codes: string[],
  titles: Record<string, string>
): CatalogItem[] {
  return codes.map((code, i) => ({
    category,
    code,
    title: titles[code] ?? code,
    body: '',
    priority: (i + 1) * 10,
  }));
}

export function runFortuneEngine(input: FortuneEngineInput): FortuneEngineResult {
  const rng = createFortuneRng(`${input.seedKey}|theme:${input.chart.coreTheme}`);
  const derivation: ThemeDerivation = input.chart.derivation;
  const allow = derivation.allow;

  const fromDb: CatalogItem[] = input.catalog.map((c) => ({
    category: c.category,
    code: c.code,
    title: c.title,
    body: c.body,
    priority: c.priority,
    dataConditions: c.dataConditions,
  }));
  const catalog: CatalogItem[] =
    fromDb.length > 0
      ? fromDb
      : FORTUNE_FALLBACK_CATALOG.map((c) => ({
          category: c.category,
          code: c.code,
          title: c.title,
          body: c.body,
          priority: c.priority,
        }));

  // Fortune picks are theme-bound only. Workout history must not shrink
  // or rewrite the narrative pool (data stays in dataAnalysis / apply UI).
  const keyword = pickAllowed(
    rng,
    byCategory(catalog, 'keyword'),
    allow.keywords,
    input.analysis,
    allow.keywords[0] ?? 'CONTROL_DAY',
    'CONTROL DAY',
    'keyword'
  );

  const headline = pickAllowed(
    rng,
    byCategory(catalog, 'headline'),
    allow.headlines,
    input.analysis,
    allow.headlines[0] ?? 'CONTROL_FOCUS',
    '오늘은 핵심 기운에 맞춰 움직이는 날입니다.',
    'headline'
  );

  const strategy = pickAllowed(
    rng,
    byCategory(catalog, 'strategy'),
    allow.strategies,
    input.analysis,
    allow.strategies[0] ?? 'WEIGHT_HOLD',
    '중량 유지',
    'strategy'
  );

  const style = pickAllowed(
    rng,
    byCategory(catalog, 'style'),
    allow.styles,
    input.analysis,
    allow.styles[0] ?? 'DUMBBELL',
    '덤벨',
    'style'
  );

  const condition = pickAllowed(
    rng,
    byCategory(catalog, 'condition'),
    allow.conditions,
    input.analysis,
    allow.conditions[0] ?? 'NORMAL',
    '평소 강도',
    'condition'
  );

  const avoid = pickAllowed(
    rng,
    byCategory(catalog, 'avoid'),
    allow.avoids,
    input.analysis,
    allow.avoids[0] ?? 'HEAVY_EGO',
    '무리한 고중량',
    'avoid'
  );

  const pre = pickAllowed(
    rng,
    byCategory(catalog, 'pre_workout'),
    allow.pre,
    input.analysis,
    allow.pre[0] ?? 'PREP_SETS',
    '충분한 준비세트',
    'pre_workout'
  );

  const post = pickAllowed(
    rng,
    byCategory(catalog, 'post_workout'),
    allow.post,
    input.analysis,
    allow.post[0] ?? 'STRETCH',
    '스트레칭',
    'post_workout'
  );

  const bodyPartItems =
    byCategory(catalog, 'body_part').length > 0
      ? byCategory(catalog, 'body_part')
      : syntheticFromCodes('body_part', allow.bodyParts, {
          FULL_BODY: '전신',
          CHEST: '가슴',
          BACK: '등',
          SHOULDERS: '어깨',
          LEGS: '하체',
          BICEPS: '이두',
          TRICEPS: '삼두',
          CORE: '코어',
        });

  const bodyPart = pickAllowed(
    rng,
    bodyPartItems,
    allow.bodyParts,
    input.analysis,
    allow.bodyParts[0] ?? 'FULL_BODY',
    '전신',
    'body_part'
  );

  const oneLiner = pickAllowed(
    rng,
    byCategory(catalog, 'one_liner'),
    allow.oneLiners,
    input.analysis,
    allow.oneLiners[0] ?? 'PREP_WINS',
    '오늘의 핵심 기운에 맞춰 한 가지에 집중하세요.',
    'one_liner'
  );

  let scoreStars = pickInBand(rng, derivation.bands.stars);
  if (input.mode === 'simple') {
    scoreStars = Math.min(
      derivation.bands.stars[1],
      Math.max(derivation.bands.stars[0], scoreStars)
    );
  }

  const baseHealthman = pickInBand(rng, derivation.bands.healthman);
  const basePrLuck = pickInBand(rng, derivation.bands.prLuck);
  const baseRecoveryLuck = pickInBand(rng, derivation.bands.recoveryLuck);
  const baseVolumeLuck = pickInBand(rng, derivation.bands.volumeLuck);
  const baseFocusLuck = pickInBand(rng, derivation.bands.focusLuck);
  const baseChangeLuck = pickInBand(rng, derivation.bands.changeLuck);

  const fortune: FortuneSection = {
    scoreStars,
    keyword: keyword.code,
    keywordTitle: keyword.title,
    title: headline.title,
    headline: headline.body || headline.title,
    strategyLabels: [strategy.title, style.title, condition.title].filter(Boolean),
    oneLiner: oneLiner.title,
    oneLinerDetail: oneLiner.body || undefined,
    disclaimer: input.chart.disclaimer || FORTUNE_DISCLAIMER_KO,
    coreTheme: input.chart.coreTheme,
  };

  return {
    fortune,
    coreTheme: input.chart.coreTheme,
    keywordCode: keyword.code,
    headlineCode: headline.code,
    strategyCode: strategy.code,
    styleCode: style.code,
    conditionCode: condition.code,
    avoidCode: avoid.code,
    preCode: pre.code,
    postCode: post.code,
    bodyPartCode: bodyPart.code,
    oneLinerCode: oneLiner.code,
    scoreStars,
    baseHealthman,
    basePrLuck,
    baseRecoveryLuck,
    baseVolumeLuck,
    baseFocusLuck,
    baseChangeLuck,
  };
}

export function labelForCode(
  catalog: FortuneContentItem[],
  category: string,
  code: string
): { title: string; body: string } {
  const hit = catalog.find((c) => c.category === category && c.code === code);
  if (hit) return { title: hit.title, body: hit.body };
  const fb = FORTUNE_FALLBACK_CATALOG.find(
    (c) => c.category === category && c.code === code
  );
  return { title: fb?.title ?? code, body: fb?.body ?? '' };
}
