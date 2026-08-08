import {
  FORTUNE_FALLBACK_CATALOG,
  createFortuneRng,
  fortuneInt,
  fortunePickOne,
  type FortuneContentItem,
  type FortuneDataAnalysis,
  type FortuneMode,
  type FortuneSection,
} from '@machinefit/shared';

export interface FortuneEngineInput {
  seedKey: string;
  mode: FortuneMode;
  catalog: FortuneContentItem[];
  analysis: FortuneDataAnalysis;
}

export interface FortuneEngineResult {
  fortune: FortuneSection;
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

function pickFiltered(
  rng: () => number,
  items: CatalogItem[],
  analysis: FortuneDataAnalysis
): CatalogItem | undefined {
  const filtered = items.filter((i) => matchesConditions(i, analysis));
  return fortunePickOne(rng, filtered.length ? filtered : items);
}

const DISCLAIMER =
  '엔터테인먼트 콘텐츠이며 의료적 진단이나 과학적으로 검증된 운세가 아닙니다.';

export function runFortuneEngine(input: FortuneEngineInput): FortuneEngineResult {
  const rng = createFortuneRng(input.seedKey);
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

  // Bias recovery keywords when consecutive training is high.
  let keywords = byCategory(catalog, 'keyword');
  if (input.analysis.consecutiveDays >= 4) {
    const recovery = keywords.filter((k) =>
      ['RECOVERY_DAY', 'CARDIO_DAY', 'CONTROL_DAY'].includes(k.code)
    );
    if (recovery.length) keywords = recovery;
  } else if (
    input.analysis.daysSincePr != null &&
    input.analysis.daysSincePr >= 10 &&
    input.analysis.workoutCount7d >= 2
  ) {
    const pr = keywords.filter((k) => k.code === 'PR_DAY' || k.code === 'VOLUME_DAY');
    if (pr.length) keywords = [...pr, ...keywords];
  }

  const keyword = pickFiltered(rng, keywords, input.analysis) ?? {
    code: 'CONTROL_DAY',
    title: 'CONTROL DAY',
    body: '',
    category: 'keyword',
    priority: 90,
  };

  const headlines = byCategory(catalog, 'headline');
  const headline =
    pickFiltered(rng, headlines, input.analysis) ??
    ({
      code: 'CONTROL_FOCUS',
      title: '오늘은 욕심보다 자극에 집중하는 날입니다.',
      body: '',
      category: 'headline',
      priority: 30,
    } as CatalogItem);

  const strategy =
    pickFiltered(rng, byCategory(catalog, 'strategy'), input.analysis) ??
    ({
      code: 'WEIGHT_HOLD',
      title: '중량 유지',
      body: '',
      category: 'strategy',
      priority: 50,
    } as CatalogItem);

  const style =
    pickFiltered(rng, byCategory(catalog, 'style'), input.analysis) ??
    ({
      code: 'DUMBBELL',
      title: '덤벨',
      body: '',
      category: 'style',
      priority: 20,
    } as CatalogItem);

  let conditions = byCategory(catalog, 'condition');
  if (input.analysis.consecutiveDays >= 4) {
    conditions = conditions.filter((c) =>
      ['LIGHT', 'RECOVERY', 'REST', 'NORMAL'].includes(c.code)
    );
  }
  const condition =
    pickFiltered(rng, conditions, input.analysis) ??
    ({
      code: 'NORMAL',
      title: '평소 강도',
      body: '',
      category: 'condition',
      priority: 20,
    } as CatalogItem);

  const avoid =
    pickFiltered(rng, byCategory(catalog, 'avoid'), input.analysis) ??
    ({
      code: 'HEAVY_EGO',
      title: '무리한 고중량',
      body: '',
      category: 'avoid',
      priority: 10,
    } as CatalogItem);

  const pre =
    pickFiltered(rng, byCategory(catalog, 'pre_workout'), input.analysis) ??
    ({
      code: 'PREP_SETS',
      title: '충분한 준비세트',
      body: '준비세트를 충분히 가져가세요.',
      category: 'pre_workout',
      priority: 40,
    } as CatalogItem);

  const post =
    pickFiltered(rng, byCategory(catalog, 'post_workout'), input.analysis) ??
    ({
      code: 'STRETCH',
      title: '스트레칭',
      body: '운동 후 스트레칭을 추천해요.',
      category: 'post_workout',
      priority: 20,
    } as CatalogItem);

  const bodyPart =
    pickFiltered(rng, byCategory(catalog, 'body_part'), input.analysis) ??
    ({
      code: 'FULL_BODY',
      title: '전신',
      body: '전신',
      category: 'body_part',
      priority: 80,
    } as CatalogItem);

  const oneLiner =
    pickFiltered(rng, byCategory(catalog, 'one_liner'), input.analysis) ??
    ({
      code: 'PREP_WINS',
      title: '기록은 욕심보다 준비에서 나온다.',
      body: '',
      category: 'one_liner',
      priority: 20,
    } as CatalogItem);

  // Stars 1–5; simple mode slightly flatter distribution.
  let scoreStars = fortuneInt(rng, 2, 5);
  if (input.mode === 'simple') {
    scoreStars = Math.min(5, Math.max(2, scoreStars));
  }
  if (condition.code === 'REST' || keyword.code === 'RECOVERY_DAY') {
    scoreStars = Math.min(scoreStars, 3);
  }
  if (keyword.code === 'PR_DAY') {
    scoreStars = Math.max(scoreStars, 4);
  }

  const baseHealthman = fortuneInt(rng, 55, 92);
  const basePrLuck = fortuneInt(rng, 40, 95);
  const baseRecoveryLuck = fortuneInt(rng, 25, 90);

  const fortune: FortuneSection = {
    scoreStars,
    keyword: keyword.code,
    keywordTitle: keyword.title,
    title: headline.title,
    headline: headline.body || headline.title,
    strategyLabels: [strategy.title, style.title, condition.title].filter(Boolean),
    oneLiner: oneLiner.title,
    oneLinerDetail: oneLiner.body || undefined,
    disclaimer: DISCLAIMER,
  };

  return {
    fortune,
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
