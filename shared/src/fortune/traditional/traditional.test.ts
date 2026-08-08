import assert from 'node:assert/strict';
import {
  buildTraditionalChart,
  deriveFromTheme,
  enforceFortuneConsistency,
} from './index.js';

const base = {
  birthDate: '1990-05-01',
  birthTime: '08:30',
  dateKey: '2026-08-08',
};

{
  const a = buildTraditionalChart(base);
  const b = buildTraditionalChart(base);
  assert.equal(a.coreTheme, b.coreTheme);
  assert.deepEqual(
    a.narrative.layers.map((l) => l.moodKey),
    b.narrative.layers.map((l) => l.moodKey)
  );
  assert.equal(a.traditionalDetail.dayStem, b.traditionalDetail.dayStem);
}

{
  const a = buildTraditionalChart(base);
  const b = buildTraditionalChart({ ...base, dateKey: '2026-12-01' });
  assert.notDeepEqual(a.todayPillars.day, b.todayPillars.day);
}

{
  const chart = buildTraditionalChart({
    birthDate: '1990-05-01',
    birthTimeUnknown: true,
    dateKey: '2026-08-08',
  });
  assert.equal(chart.pillars.hour, null);
  assert.ok(chart.coreTheme);
  assert.equal(chart.cycles.shijin, null);
  assert.equal(
    chart.narrative.layers.some((l) => l.key === 'shijin'),
    false
  );
}

{
  const { bands } = deriveFromTheme('RECOVERY_RESET');
  const fixed = enforceFortuneConsistency({
    coreTheme: 'RECOVERY_RESET',
    keywordCode: 'PR_DAY',
    strategyCode: 'PR_CHALLENGE',
    conditionCode: 'HIGH',
    avoidCode: 'SKIP_WARMUP',
    scoreStars: 5,
    scores: {
      healthmanIndex: 90,
      prLuck: 95,
      recoveryLuck: 20,
      volumeLuck: 90,
      focusLuck: 90,
      changeLuck: 90,
    },
  });
  assert.notEqual(fixed.keywordCode, 'PR_DAY');
  assert.notEqual(fixed.strategyCode, 'PR_CHALLENGE');
  assert.ok(fixed.scoreStars <= bands.stars[1]);
  assert.ok(fixed.scores.prLuck <= bands.prLuck[1]);
  assert.ok(fixed.scores.recoveryLuck >= bands.recoveryLuck[0]);
}

{
  const chart = buildTraditionalChart(base);
  assert.ok(chart.narrative.coreThemeLabelKey.startsWith('coreTheme.'));
  assert.equal(chart.narrative.layers[0].titleKey, 'layer.base');
  assert.equal(chart.engineVersion, 'v2');
}

console.log('traditional fortune tests OK');
