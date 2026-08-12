/**
 * Theme-pack consistency for runFortuneEngine + enforceFortuneConsistency.
 * Uses fallback catalog (no DB).
 */
import assert from 'node:assert/strict';
import {
  CORE_THEMES,
  FORTUNE_FALLBACK_CATALOG,
  buildFortuneSeedKey,
  buildTraditionalChart,
  createFortuneRng,
  deriveFromTheme,
  enforceFortuneConsistency,
  isThemePackConsistent,
  type CoreTheme,
  type FortuneContentItem,
  type FortuneDataAnalysis,
} from '@machinefit/shared';
import { runFortuneEngine } from './fortune.engine.js';
import { buildRecommendation, computeFortuneScores } from './recommendation.engine.js';

const emptyAnalysis: FortuneDataAnalysis = {
  personalizationTier: 'none',
  logCount30d: 0,
  workoutCount7d: 0,
  workoutCount14d: 0,
  workoutCount30d: 0,
  consecutiveDays: 0,
  daysSinceLastWorkout: null,
  daysSincePr: null,
  barbellRatio30d: 0,
  dumbbellRatio30d: 0,
  machineRatio30d: 0,
  cableRatio30d: 0,
  bodyweightRatio30d: 0,
  freeWeightRatio30d: 0,
  topMuscleGroup: null,
  lowMuscleGroup: null,
  personalizedBullets: [],
};

const catalog = FORTUNE_FALLBACK_CATALOG as FortuneContentItem[];

const births = [
  { birthDate: '1990-05-01', birthTime: '08:30' },
  { birthDate: '1995-12-20', birthTime: null, birthTimeUnknown: true },
  { birthDate: '1988-03-15', birthTime: '22:10' },
];
const dates = ['2026-01-10', '2026-04-02', '2026-08-08', '2026-11-30'];

for (const birth of births) {
  for (const dateKey of dates) {
    const chart = buildTraditionalChart({
      birthDate: birth.birthDate,
      birthTime: birth.birthTime,
      birthTimeUnknown: birth.birthTimeUnknown,
      dateKey,
    });
    const seedKey = buildFortuneSeedKey({
      userId: 'test-user',
      birthDate: birth.birthDate,
      birthTime: birth.birthTime,
      birthTimeUnknown: birth.birthTimeUnknown,
      dateKey,
    });
    const engine = runFortuneEngine({
      seedKey,
      mode: birth.birthTimeUnknown ? 'simple' : 'full',
      catalog,
      analysis: emptyAnalysis,
      chart,
    });
    assert.equal(engine.coreTheme, chart.coreTheme);

    // Same seed → same picks
    const engine2 = runFortuneEngine({
      seedKey,
      mode: birth.birthTimeUnknown ? 'simple' : 'full',
      catalog,
      analysis: emptyAnalysis,
      chart,
    });
    assert.equal(engine.keywordCode, engine2.keywordCode);
    assert.equal(engine.headlineCode, engine2.headlineCode);
    assert.equal(engine.strategyCode, engine2.strategyCode);

    let scores = computeFortuneScores(engine, emptyAnalysis, chart.coreTheme);
    const consistent = enforceFortuneConsistency({
      coreTheme: chart.coreTheme,
      keywordCode: engine.keywordCode,
      strategyCode: engine.strategyCode,
      conditionCode: engine.conditionCode,
      avoidCode: engine.avoidCode,
      styleCode: engine.styleCode,
      bodyPartCode: engine.bodyPartCode,
      preCode: engine.preCode,
      postCode: engine.postCode,
      headlineCode: engine.headlineCode,
      oneLinerCode: engine.oneLinerCode,
      scoreStars: engine.scoreStars,
      scores,
    });
    assert.ok(
      isThemePackConsistent(chart.coreTheme, consistent),
      `inconsistent pack for ${chart.coreTheme} on ${dateKey}`
    );

    engine.keywordCode = consistent.keywordCode;
    engine.strategyCode = consistent.strategyCode;
    engine.conditionCode = consistent.conditionCode;
    engine.avoidCode = consistent.avoidCode;
    engine.styleCode = consistent.styleCode;
    engine.bodyPartCode = consistent.bodyPartCode;
    engine.preCode = consistent.preCode;
    engine.postCode = consistent.postCode;
    engine.headlineCode = consistent.headlineCode;
    engine.oneLinerCode = consistent.oneLinerCode;
    engine.scoreStars = consistent.scoreStars;

    const rec = buildRecommendation(engine, emptyAnalysis, catalog, chart.coreTheme);
    assert.equal(rec.strategy, consistent.strategyCode);
    assert.equal(rec.style, consistent.styleCode);
    assert.equal(rec.bodyPart, consistent.bodyPartCode);
    assert.equal(rec.condition, consistent.conditionCode);
    assert.equal(rec.avoid, consistent.avoidCode);

    // Heavy workout history must not rewrite fortune recommendation codes.
    const busy: FortuneDataAnalysis = {
      ...emptyAnalysis,
      personalizationTier: 'advanced',
      logCount30d: 20,
      workoutCount7d: 5,
      workoutCount14d: 10,
      workoutCount30d: 18,
      consecutiveDays: 6,
      daysSinceLastWorkout: 0,
      barbellRatio30d: 70,
      dumbbellRatio30d: 10,
      machineRatio30d: 10,
      cableRatio30d: 5,
      bodyweightRatio30d: 5,
      freeWeightRatio30d: 80,
      topMuscleGroup: 'chest',
      lowMuscleGroup: 'legs',
      daysSincePr: 1,
      personalizedBullets: ['busy'],
    };
    const engineBusy = runFortuneEngine({
      seedKey,
      mode: 'full',
      catalog,
      analysis: busy,
      chart,
    });
    assert.equal(engineBusy.keywordCode, engine.keywordCode);
    assert.equal(engineBusy.headlineCode, engine.headlineCode);
    assert.equal(engineBusy.strategyCode, engine.strategyCode);
    assert.equal(engineBusy.styleCode, engine.styleCode);
    assert.equal(engineBusy.bodyPartCode, engine.bodyPartCode);

    const recBusy = buildRecommendation(engineBusy, busy, catalog, chart.coreTheme);
    assert.equal(recBusy.style, engineBusy.styleCode);
    assert.equal(recBusy.bodyPart, engineBusy.bodyPartCode);
    assert.equal(recBusy.strategy, engineBusy.strategyCode);
  }
}

// Every theme pack allow-list codes exist in fallback catalog.
for (const theme of CORE_THEMES) {
  const { allow } = deriveFromTheme(theme as CoreTheme);
  const byCat = (cat: string) =>
    new Set(catalog.filter((c) => c.category === cat).map((c) => c.code));
  for (const code of allow.keywords) assert.ok(byCat('keyword').has(code), code);
  for (const code of allow.strategies) assert.ok(byCat('strategy').has(code), code);
  for (const code of allow.conditions) assert.ok(byCat('condition').has(code), code);
  for (const code of allow.avoids) assert.ok(byCat('avoid').has(code), code);
  for (const code of allow.styles) assert.ok(byCat('style').has(code), code);
  for (const code of allow.bodyParts) assert.ok(byCat('body_part').has(code), code);
  for (const code of allow.pre) assert.ok(byCat('pre_workout').has(code), code);
  for (const code of allow.post) assert.ok(byCat('post_workout').has(code), code);
  for (const code of allow.headlines) assert.ok(byCat('headline').has(code), code);
  for (const code of allow.oneLiners) assert.ok(byCat('one_liner').has(code), code);
}

// RNG unused leftover check — ensure createFortuneRng still deterministic
const r1 = createFortuneRng('abc');
const r2 = createFortuneRng('abc');
assert.equal(r1(), r2());

console.log('fortune engine consistency tests OK');
